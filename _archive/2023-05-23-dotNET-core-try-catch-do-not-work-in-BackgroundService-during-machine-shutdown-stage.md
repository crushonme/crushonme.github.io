---
layout: post
title: .NET core try-catch do not work in BackgroundService during machine shutdown stage
categories: dotnet
description: N/A
keywords: .net core,.net,dotnet core,BackgroundService
---

# Issue Description

Implement a .NET Core Service following [Create Windows Service using BackgroundService](https://learn.microsoft.com/en-us/dotnet/core/extensions/windows-service) and throw a exception in a try-catch block in the routine callback of 
StopAsync. Then publish with x86 platform and then we will see it crash at machine shutdown stage.  And the issue do not occur during normal service stop.

We can use below to reproduce the issue.

```csharp
using ShutdownStageExceptionHandle;
using System.Diagnostics;
using Microsoft.Extensions.Logging.EventLog;
using Microsoft.Extensions.Logging.Configuration;
using System.Runtime.InteropServices;

try
{
    using IHost host = Host.CreateDefaultBuilder(args)
        .UseWindowsService(options =>
         {
             options.ServiceName = "TestBackGroundService";
         })
        .ConfigureServices(services =>
         {
             LoggerProviderOptions.RegisterProviderOptions<
    EventLogSettings, EventLogLoggerProvider>(services);
             services.AddHostedService<WindowsBackgroundService>();
         })
         .ConfigureLogging((hostingContext, logging) =>
         {
             logging.ClearProviders();
             logging.AddEventLog(options =>
             {
                 options.SourceName = "TestBackGroundService";
                 options.LogName = "Application";
             });
             logging.AddConsole();
             logging.AddLog4Net();

         })
        .Build();
    //using var registration = PosixSignalRegistration.Create(PosixSignal.SIGTERM, (context) => context.Cancel = true);
    await host.RunAsync();
}
catch (Exception ex)
{
    Console.WriteLine($"ex happen: {ex.Message}");
}
```

```csharp
using System.ComponentModel;
using System.Diagnostics;

namespace ShutdownStageExceptionHandle
{
    public class WindowsBackgroundService : BackgroundService
    {
        private readonly ILogger<WindowsBackgroundService> _logger;
        private readonly Timer _timer;

        public WindowsBackgroundService(
            ILogger<WindowsBackgroundService> logger)
        {
            _logger = logger;
            

        }
        public void Heartbeat(object state)
        {
            Debug.WriteLine("Heartbeat");
            _logger.LogInformation("Test BackGround Service service heart beat at: {time}", DateTimeOffset.Now);
        }
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            Debug.WriteLine("ExecuteAsync");
             new Timer(Heartbeat, null, 1000, 5000);
            try
            {
                if (stoppingToken.IsCancellationRequested)
                {
                    return;
                }

                _logger.LogInformation("Test BackGround Service service starts at: {time}", DateTimeOffset.Now);
                await Task.Run(() =>
                {
                    throw new NotImplementedException();
                }, stoppingToken);

                
            }
            catch (Exception ex)
            {
                _logger.LogInformation($"exception happen during ExecuteAsync: {ex.Message}");
            }
            Debug.WriteLine("Exit ExecuteAsync");
        }
        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            Debug.WriteLine("StopAsync");
            for(int i = 0; i < 30; i++)
            {
                try
                {
                    _logger.LogInformation($"Test BackGround Service service ends at: {DateTimeOffset.Now}");
                    Debug.WriteLine($"Test BackGround Service service ends: {DateTimeOffset.Now}");
                    if (cancellationToken.IsCancellationRequested)
                    {
                        _logger.LogInformation($"StopAsync is cancled");
                        Debug.WriteLine("StopAsync is cancled");
                        return;
                    }

                    try
                    {
                        throw new NotImplementedException();
                    }
                    catch
                    {
                        Debug.WriteLine("exception happen during StopAsync");
                        _logger.LogInformation($"exception happen during StopAsync");
                    }
                }
                catch (Exception ex)
                {
                    Debug.WriteLine($"exception happen during StopAsync:{ex.Message}");
                    _logger.LogInformation($"exception happen during StopAsync: {ex.Message}");
                }
                Thread.Sleep(100);
            }
        }
    }
}
```

# Troubleshooting

1. Try to reproduce the issue locally and do live kernel debug. 

2. Research the process of system shutdown and found that Service application will receive shutdown notifications in their handler routines. To register a service control handler, use the RegisterServiceCtrlHandlerEx function. Shutting Down - Win32 apps | Microsoft Learn

3. File a DTS to engage PG to identify the root cause.

4. Collect .NET Stress log : 
This shows that while the SHE handler COMPlusFrameHandler was called by the OS, our first pass exception handler was not called. 
Looking through the COMPlusFrameHandler code, I’ve found that it could be due to the g_fNoExceptions being set. This variable is set in certain stage of the .NET process shutdown where handling exceptions is not safe anymore. This is in the COMPlusFrameHandler EXCEPTION_HANDLER_IMPL
```
STRESS LOG:
    facilitiesToLog  = 0x80004000
    levelToLog       = 6
    MaxLogSizePerThread = 0x10000 (65536)
    MaxTotalLogSize = 0x1000000 (16777216)
    CurrentTotalLogChunk = 17
    ThreadsWithLogs  = 14
    Clock frequency  = 1.805 GHz
    Start time         10:44:05
    Last message time  10:47:02
    Total elapsed time 176.539 sec
 
THREAD  TIMESTAMP     FACILITY                              MESSAGE
  ID  (sec from start)
--------------------------------------------------------------------------------------
994 176.539191796 : `EH`                 In InternalUnhandledExceptionFilter_Worker, Exception = e0434352, sp = 08C9E8C8
 
994 176.537607355 : `EH`                 In COMPlusFrameHander EH code = e0434352  flag = 1 EIP = 7611e4b2 with ESP = 8c9f5a0, pEstablisherFrame = 0x08C9FB00
 
994 176.537517216 : `EH`                 in Thread::SetLastThrownObject: obj = 039E1854
 
994 176.537513099 : `EH`                 Exception HRESULT = 0x80004001 Message String 0x039AD260 (db will display) InnerException 00000000 MT 00000000 (BAD MethodTable)
 
994 176.537512665 : `EH`                 ******* MANAGED EXCEPTION THROWN: Object thrown: 039E1854 MT 07070E90 (System.NotImplementedException) rethrow 0
 
c1c 176.402716415 : `ALWAYS`             SetupThread  managed Thread 09165A80 Thread Id = 10
 
------------ Last message from thread c1c -----------
257c 176.397667175 : `ALWAYS`             SetupThread  managed Thread 06E54788 Thread Id = f
 
------------ Last message from thread 257c -----------
994 176.334943159 : `ALWAYS`             SetupThread  managed Thread 090F80F0 Thread Id = e
 
------------ Last message from thread 994 -----------
df0 176.291195722 : `ALWAYS`             SetupThread  managed Thread 0909E828 Thread Id = d
 
------------ Last message from thread df0 -----------
10e8 176.101414707 : `ALWAYS`             SetupThread  managed Thread 090B38B8 Thread Id = c
 
------------ Last message from thread 10e8 -----------
1310 176.098092583 : `ALWAYS`             SetupThread  managed Thread 00AB8088 Thread Id = 3
 
------------ Last message from thread 1310 -----------
33a0 176.097317584 : `EH`                 In EEPolicy::HandleExitProcess
 
------------ Last message from thread 33a0 -----------
1ed8  17.189285786 : `ALWAYS`             SetupThread  managed Thread 090F70A0 Thread Id = a
 
------------ Last message from thread 1ed8 -----------
1ea0  17.082423023 : `ALWAYS`             SetupThread  managed Thread 0908B658 Thread Id = 6
 
------------ Last message from thread 1ea0 -----------
1e4c  16.743905322 : `ALWAYS`             SetupThread  managed Thread 0908B230 Thread Id = 5
 
------------ Last message from thread 1e4c -----------
1bc8  12.272344885 : `ALWAYS`             SetupThread  managed Thread 06E58550 Thread Id = 4
 
------------ Last message from thread 1bc8 -----------
131c   0.095694830 : `ALWAYS`             SetupThread  managed Thread 00AA0370 Thread Id = 2
 
------------ Last message from thread 131c -----------
12ec   0.085065625 : `CORDB`ALWAYS`       Debugger Thread spinning up
 
------------ Last message from thread 12ec -----------
e30   0.077795239 : `ALWAYS`             SetupThread  managed Thread 00A92B30 Thread Id = 1
 
------------ Last message from thread e30 -----------
---------------------------- 19 total entries ------------------------------------
```
5. Capture a TTD during shutdown and do analysis: During a shutdown a service will still receive the CTRL_SHUTDOWN_EVENT and it seems that the Service implementation races to finish handling the shutdown (and any first chance exceptions) before the runtime disables exception handling.  
```
0:000> bp coreclr!EEPolicy::HandleExitProcess
0:000> g
Breakpoint 0 hit
Time Travel Position: 19B:59
eax=00000000 ebx=fffffffe ecx=00000002 edx=00000006 esi=7262c4b0 edi=00000006
eip=723ed0d6 esp=03b1f998 ebp=03b1f99c iopl=0         nv up ei pl zr na pe nc
cs=0023  ss=002b  ds=002b  es=002b  fs=0053  gs=002b             efl=00000246
coreclr!EEPolicy::HandleExitProcess:
723ed0d6 55              push    ebp
0:000> kn
 # ChildEBP RetAddr      
00 03b1f99c 7262c4fb     coreclr!EEPolicy::HandleExitProcess [D:\a\_work\1\s\src\coreclr\vm\eepolicy.cpp @ 151] 
01 03b1f99c 7576f012     coreclr!DbgCtrlCHandler+0x4b [D:\a\_work\1\s\src\coreclr\vm\ceemain.cpp @ 396] 
02 03b1fa34 754a7d69     KERNELBASE!CtrlRoutine+0x102
03 03b1fa44 7736b74b     KERNEL32!BaseThreadInitThunk+0x19
04 03b1fa9c 7736b6cf     ntdll!__RtlUserThreadStart+0x2b
05 03b1faac 00000000     ntdll!_RtlUserThreadStart+0x1b
0:000> .frame 1
01 03b1f99c 7576f012     coreclr!DbgCtrlCHandler+0x4b [D:\a\_work\1\s\src\coreclr\vm\ceemain.cpp @ 396] 
0:000> dv
     dwCtrlType = 6
 
Stepping into this I see that SafeExitProcess will set g_fNoExceptions 
0:000> p
Time Travel Position: B53D:7
eax=726dcf00 ebx=fffffffe ecx=726d8dd0 edx=00000004 esi=00000000 edi=00000002
eip=723ed17d esp=03b1f970 ebp=03b1f980 iopl=0         nv up ei pl zr na pe nc
cs=0023  ss=002b  ds=002b  es=002b  fs=0053  gs=002b             efl=00000246
coreclr!SafeExitProcess+0x66:
723ed17d 83ff01          cmp     edi,1
0:000> x coreclr!g_fNoExceptions
726d3d8d          coreclr!g_fNoExceptions = true
 
Slightly after this I see we hit WerpReportFault for an exception that should be caught.
0:008> bp kernel32!WerpReportFault
0:008> g
Breakpoint 11 hit
Time Travel Position: B9DA:117
eax=00000001 ebx=00000004 ecx=0bb7f06c edx=75490000 esi=00000000 edi=00000000
eip=754fc60f esp=0bb7ef98 ebp=0bb7ef9c iopl=0         nv up ei pl nz na po nc
cs=0023  ss=002b  ds=002b  es=002b  fs=0053  gs=002b             efl=00000202
KERNEL32!WerpReportFault:
754fc60f 8bff            mov     edi,edi
0:002> kn
 # ChildEBP RetAddr      
00 0bb7ef9c 754c7f19     KERNEL32!WerpReportFault
01 0bb7ef9c 757892eb     KERNEL32!BasepReportFault+0x19
02 0bb7f03c 7736b7dd     KERNELBASE!UnhandledExceptionFilter+0x27b
03 0bb7fd1c 7737a942     ntdll!__RtlUserThreadStart+0xbd
04 0bb7fd1c 7737a260     ntdll!_EH4_CallFilterFunc+0x12
05 0bb7f084 7737e8d0     ntdll!_except_handler4_common+0x80
06 0bb7f0a4 77398502     ntdll!_except_handler4+0x20
07 0bb7f0c8 773984d4     ntdll!ExecuteHandler2+0x26
08 0bb7f190 77378756     ntdll!ExecuteHandler+0x24
09 0bb7f6b8 756c7902     ntdll!KiUserExceptionDispatcher+0x26
0a 0bb7f6b8 723cea58     KERNELBASE!RaiseException+0x62
0b 0bb7f75c 723ce3d7     coreclr!RaiseTheExceptionInternalOnly+0x143 [D:\a\_work\1\s\src\coreclr\vm\excep.cpp @ 2806] 
0c 0bb7f7f4 0a86eb82     coreclr!IL_Throw+0x87 [D:\a\_work\1\s\src\coreclr\vm\jithelpers.cpp @ 4025] 
0d 0bb7f83c 0a86da16     System_Diagnostics_EventLog!System.Diagnostics.EventLogInternal.InternalWriteEvent+0x302 [/_/src/libraries/System.Diagnostics.EventLog/src/System/Diagnostics/EventLogInternal.cs @ 1385] 
0e 0bb7f8a8 0a86d7e0     System_Diagnostics_EventLog!System.Diagnostics.EventLogInternal.WriteEntry+0x21e [/_/src/libraries/System.Diagnostics.EventLog/src/System/Diagnostics/EventLogInternal.cs @ 1309] 
0f 0bb7f8cc 0a86d791     System_Diagnostics_EventLog!System.Diagnostics.EventLog.WriteEntry+0x38 [/_/src/libraries/System.Diagnostics.EventLog/src/System/Diagnostics/EventLog.cs @ 1025] 
10 0bb7f8ec 0a86cb99     System_Diagnostics_EventLog!System.Diagnostics.EventLog.WriteEntry+0x21 [/_/src/libraries/System.Diagnostics.EventLog/src/System/Diagnostics/EventLog.cs @ 987] 
11 0bb7f91c 0ab25fad     System_ServiceProcess_ServiceController!System.ServiceProcess.ServiceBase.WriteLogEntry+0x49 [/_/src/libraries/System.ServiceProcess.ServiceController/src/System/ServiceProcess/ServiceBase.cs @ 939] 
12 0bb7f964 0ab25ce8     System_ServiceProcess_ServiceController!System.ServiceProcess.ServiceBase.DeferredStop+0x95 [/_/src/libraries/System.ServiceProcess.ServiceController/src/System/ServiceProcess/ServiceBase.cs @ 516] 
WARNING: Frame IP not in any known module. Following frames may be wrong.
13 0bb7f970 71b2c455     0xab25ce8
14 0bb7f980 71b30894     System_Private_CoreLib!System.Threading.Tasks.Task.InnerInvoke+0x35 [/_/src/libraries/System.Private.CoreLib/src/System/Threading/Tasks/Task.cs @ 2409] 
15 0bb7f988 71b160d3     System_Private_CoreLib!System.Threading.Tasks.Task.<>c.<.cctor>b__273_0+0x14 [/_/src/libraries/System.Private.CoreLib/src/System/Threading/Tasks/Task.cs @ 2388] 
16 0bb7f9b0 71b2c1f1     System_Private_CoreLib!System.Threading.ExecutionContext.RunFromThreadPoolDispatchLoop+0x33 [/_/src/libraries/System.Private.CoreLib/src/System/Threading/ExecutionContext.cs @ 268] 
17 0bb7fa10 71b2c12b     System_Private_CoreLib!System.Threading.Tasks.Task.ExecuteWithThreadLocal+0x81 [/_/src/libraries/System.Private.CoreLib/src/System/Threading/Tasks/Task.cs @ 2349] 
18 0bb7fa24 71b1e089     System_Private_CoreLib!System.Threading.Tasks.Task.ExecuteEntryUnsafe+0x4b [/_/src/libraries/System.Private.CoreLib/src/System/Threading/Tasks/Task.cs @ 2289] 
19 0bb7fa60 71b27454     System_Private_CoreLib!System.Threading.ThreadPoolWorkQueue.Dispatch+0x159 [/_/src/libraries/System.Private.CoreLib/src/System/Threading/ThreadPoolWorkQueue.cs @ 919] 
1a 0bb7faf0 71b0d595     System_Private_CoreLib!System.Threading.PortableThreadPool.WorkerThread.WorkerThreadStart+0x134 [/_/src/libraries/System.Private.CoreLib/src/System/Threading/PortableThreadPool.WorkerThread.cs @ 77] 
1b 0bb7fb00 72415cef     System_Private_CoreLib!System.Threading.Thread.StartCallback+0x35 [/_/src/coreclr/System.Private.CoreLib/src/System/Threading/Thread.CoreCLR.cs @ 106] 
1c 0bb7fb0c 7238435b     coreclr!CallDescrWorkerInternal+0x34
1d 0bb7fb38 72384151     coreclr!CallDescrWorkerWithHandler+0x65 [D:\a\_work\1\s\src\coreclr\vm\callhelpers.cpp @ 69] 
1e 0bb7fb80 7230df0b     coreclr!DispatchCallSimple+0x82 [D:\a\_work\1\s\src\coreclr\vm\callhelpers.cpp @ 218] 
1f 0bb7fba4 7230de93     coreclr!ThreadNative::KickOffThread_Worker+0x4b [D:\a\_work\1\s\src\coreclr\vm\comsynchronizable.cpp @ 158] 
20 (Inline) --------     coreclr!ManagedThreadBase_DispatchInner+0xf [D:\a\_work\1\s\src\coreclr\vm\threads.cpp @ 7298] 
21 0bb7fc28 7230ddf1     coreclr!ManagedThreadBase_DispatchMiddle+0x5e [D:\a\_work\1\s\src\coreclr\vm\threads.cpp @ 7343] 
22 0bb7fc80 7230d68f     coreclr!ManagedThreadBase_DispatchOuter+0x62 [D:\a\_work\1\s\src\coreclr\vm\threads.cpp @ 7520] 
23 (Inline) --------     coreclr!ManagedThreadBase_FullTransition+0x21 [D:\a\_work\1\s\src\coreclr\vm\threads.cpp @ 7546] 
24 (Inline) --------     coreclr!ManagedThreadBase::KickOff+0x21 [D:\a\_work\1\s\src\coreclr\vm\threads.cpp @ 7581] 
25 0bb7fcb4 754a7d69     coreclr!ThreadNative::KickOffThread+0x7f [D:\a\_work\1\s\src\coreclr\vm\comsynchronizable.cpp @ 230] 
26 0bb7fcc4 7736b74b     KERNEL32!BaseThreadInitThunk+0x19
27 0bb7fd1c 7736b6cf     ntdll!__RtlUserThreadStart+0x2b
28 0bb7fd2c 00000000     ntdll!_RtlUserThreadStart+0x1b
```

# Cause

In X86 platform, the exception handling honoring g_fNoExceptions flag in [EXCEPTION_HANDLER_IMPL](https://github.com/dotnet/runtime/blob/92971c9ae60b40548ec1dda54de977afc3ff8021/src/coreclr/vm/i386/excepx86.cpp#L1574).

1. During a shutdown Windows notifies all control handlers of a shutdown event. 

2. SCM in Services.exe is responsible for sending messages to all the registered services and does so when it self sees the CTRL_SHUTDOWN_EVENT in its own control handler

3. Service processes normally avoid reacting to CTRL_SHUTDOWN_EVENT because their default handler does nothing when it sees CTRL_SHUTDOWN_EVENT based on the previously shared docs.  They count on SCM sending them SERVICE_CONTROL messages.

# Resolution

Currently there is no fix in coreclr. We can use either of below workaround:

1. Register a callback with RegisterServiceCtrlHandlerExA to detect system shutdown event and then call StopAync in the callback.

1. Register a handler with SetConsoleCtrlHandler, in the HandlerRoutine return “true” indicating the event was handled when receiving CTRL_SHUTDOWN_EVENT.  This will prevent the OS from calling the CLR’s registered handler which is registered on startup.  In .NET 6 and later this can be done with the PosixSignalRegistration class.

  ```csharp
   using var registration =PosixSignalRegistration.Create(PosixSignal.SIGTERM, (context) =>context.Cancel = true);
  ```
