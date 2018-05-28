---
layout: post
title: 在 Win7 中调用 CoreAudio API IsFormatSupported 或者 Initialize 时随机出现延迟十秒的现象
categories: Debug
description: 在 Win7 中调用 CoreAudio API IsFormatSupported 或者 Initialize 时随机出现延迟十秒的现象。
keywords: Windows, CoreAudio, Hang
---

某日朋友反馈在他们开发的基于 CoreAudio 的音频系统在测试时某台机器每天会复现一两次 API 需要十秒才返回结果的现象。

由于该现象没有特定规律，比较难抓日志。由于大部分场景下出现延迟十秒是 API [IsFormatSupported](https://msdn.microsoft.com/en-us/library/windows/desktop/dd370876(v=vs.85).aspx)， 起初怀疑是机器上的音频驱动问题。经过升级驱动并作对比测试发现该问题依然存在。

从接口 [IsFormatSupported](https://msdn.microsoft.com/en-us/library/windows/desktop/dd370876(v=vs.85).aspx) 的描述看，该 API 是用来判断音频客户端是否支持某个音频码流格式。

```
HRESULT IsFormatSupported(
  [in]        AUDCLNT_SHAREMODE ShareMode,
  [in]  const WAVEFORMATEX      *pFormat,
  [out]       WAVEFORMATEX      **ppClosestMatch
);
```

参数 ShareMode 有两种，即 AUDCLNT_SHAREMODE_EXCLUSIVE 或者  AUDCLNT_SHAREMODE_SHARED。关于这两种模式的差别可以参考 [User-Mode Audio Components](https://msdn.microsoft.com/en-us/library/windows/desktop/dd316780(v=vs.85).aspx) 。下图也能简单明了的说明其中的区别。

![Core audio APIs and their relationship to the other user-mode audio components in Windows](https://msdn.microsoft.com/dynimg/IC45726.jpg)，则返回 



经过确认当前程序中使用的是 Shared Mode。如  [User-Mode Audio Components](https://msdn.microsoft.com/en-us/library/windows/desktop/dd316780(v=vs.85).aspx)  中描述，一般而言，对于实时性要求不高的场景中，使用 Shared Mode；而对于实时性要求高的场景中，则推荐使用 Exclusive Mode。对于当前的问题，延迟十秒，对于音频而言，时间远远大于对实时性的要求，通常不会是由于 ShareMode 选择导致。需要注意的是如果使用 Shared Mode，API 需要通过 Audio Engine 和 Audio Service 处理。此处推测为 Audio Service 中出现了 Hang。为了验证这个想法，我们需要在问题出现时抓取 DUMP。

[^注]: 需要注意，此处我们需要同时抓取当前进程和 Audio Service 的 DUMP。 对应的 Service 名为 audiosrv。



鉴于当前问题一天才能复现一两次，我们必须通过程序中实现自动抓取 DUMP 的动作。基本逻辑是在  [IsFormatSupported](https://msdn.microsoft.com/en-us/library/windows/desktop/dd370876(v=vs.85).aspx) 三秒内未返回，则出发抓取 DUMP。用户态抓取 DUMP，可以考虑以下两种方案：

- 另起一个进程调用 [ProcDump](https://docs.microsoft.com/en-us/sysinternals/downloads/procdump) 产生 DUMP，优点是不需要考虑 API ， C++ 和 C# 均可以使用；
- 使用 C++ API [MiniDumpWriteDump](https://msdn.microsoft.com/en-us/library/ms680360(VS.85).aspx) ，C# 封装可以参考 [Programmatically Generating a Dump File](http://blogs.microsoft.co.il/sasha/2008/05/28/programmatically-generating-a-dump-file/) 。



经过对抓取到的 DUMP 分析发现，当前的调用在的确在等待远程调用，对应的 EndPoint 为 AudioClientRPC ，Server PID 正是 audiosrv 所在的 svchost.exe。

```
0:066> !mex.t 66 -l
DbgID ThreadID       User Kernel Create Time (UTC)
66    7be8 (0n31720)   0s   15ms 05/03/2018 12:26:44.967 下午

 # Child-SP Return   Call Site                                  Info
 0 14a8f258 74bd764b ntdll!NtAlpcSendWaitReceivePort+0x12                                       
 1 14a8f260 74bd7aeb rpcrt4!LRPC_CASSOCIATION::AlpcSendWaitReceivePort+0x5d                     
 2 14a8f294 74bd79ee rpcrt4!LRPC_BASE_CCALL::DoSendReceive+0xa3                                 
 3 14a8f2ec 74be2643 rpcrt4!LRPC_BASE_CCALL::SendReceive+0x2f   Endpoint: AudioClientRpc  Server PID: 0x3cc
 4 14a8f304 74bd73f9 rpcrt4!LRPC_CCALL::SendReceive+0x25                                        
 5 14a8f314 74bd80bb rpcrt4!I_RpcSendReceive+0x28               
 6 14a8f324 74bd808a rpcrt4!NdrSendReceive+0x31                 
 7 14a8f338 74c70149 rpcrt4!NdrpSendReceive+0x9                 
 8 14a8f344 0b2edd7a rpcrt4!NdrClientCall2+0x1a6                
 9 14a8f758 0b2edd00 AudioSes!AudioServerIsFormatSupported+0x19                                 
 a 14a8f770 0f0c7a65 AudioSes!CAudioClient::IsFormatSupported+0x6e                               
……          
11 14a8f904 77069832 kernel32!BaseThreadInitThunk+0xe           
12 14a8f910 77069805 ntdll!__RtlUserThreadStart+0x70            
13 14a8f950 00000000 ntdll!_RtlUserThreadStart+0x1b 
0:066> |
.  0	id: 2094	examine	name: D:\xxxx.exe
```

查看 audiosrv 的 DUMP，其中有三个线程均在处理远程调用的请求（可以使用 !mex.us 快速找到对应的线程），找到处理 [IsFormatSupported](https://msdn.microsoft.com/en-us/library/windows/desktop/dd370876(v=vs.85).aspx) 请求的线程，可以看到如下调用栈：

```
0:000> !mex.t 22 -l
DbgID ThreadID       User Kernel Create Time (UTC)
22    7b10 (0n31504) 62ms  124ms 05/03/2018 12:26:04.858 下午

 # Child-SP         Return           Call Site                                Info
 0 0000000002eadf58 0000000076ea2998 ntdll!ZwWaitForSingleObject+0xa          
 1 0000000002eadf60 0000000076e9d0c1 ntdll!RtlpWaitOnCriticalSection+0xe8                                                                                             
 2 0000000002eae010 0000000076c63b40 ntdll!RtlEnterCriticalSection+0xd1       Critical Section: kernel32!PredefinedHandleTableCriticalSection Owning Thread ID: 0x7668
 3 0000000002eae040 0000000076c638fc kernel32!MapPredefinedHandleInternal+0xb4                   ……                                                                                            
 c 0000000002eae860 000007fefeaeef85 audiosrv!AudioServerIsFormatSupported+0x325                 ……                                                                 
13 0000000002eaf240 000007fefeb22f36 rpcrt4!LRPC_SCALL::HandleRequest+0x20d   Client: PID: 0x2094 TID: 0x7c7c
14 0000000002eaf370 000007fefeb23330 rpcrt4!LRPC_SASSOCIATION::HandleRequest+0xf6  
……                         
19 0000000002eaf660 0000000076c659cd ntdll!TppWorkerThread+0x554              
1a 0000000002eaf8f0 0000000076ec383d kernel32!BaseThreadInitThunk+0xd         
1b 0000000002eaf920 0000000000000000 ntdll!RtlUserThreadStart+0x1d
0:022> |
.  0	id: 3cc	examine	name: C:\Windows\System32\svchost.exe
```

从调用栈中可以看到，当前在等待一个 Critical Section，而拥有者线程 ID 为 0x7668。从其调用栈中可以看到，当前有个第三方模块 sysfer 在等待一个 Handle c5322a。由于当前为 User Space DUMP，无法查看当前的 Handle 具体内容，但从目前的调用栈已经很清晰，即测试程序等待 audiosrv，audiosrv 中 sysfer在等待一个未知 Handle。

```
0:020> !mex.t -t 0x7668 -l
DbgID ThreadID        User Kernel Create Time (UTC)
20    7668 (0n30312) 187ms  358ms 05/03/2018 12:22:04.770 下午

# Child-SP         Return           Call Site                               Info
0 0000000001dadff8 000007fefce810ac ntdll!ZwWaitForSingleObject+0xa         
1 0000000001dae000 000000007487cc50 KERNELBASE!WaitForSingleObjectEx+0x79   Handle: c5322a ->  
2 0000000001dae0a0 000000007487cadb sysfer+0x4cc50                          
3 0000000001dae440 000000007487ca1c sysfer+0x4cadb                          
4 0000000001dae530 000000007487a969 sysfer+0x4ca1c                          
5 0000000001dae5d0 0000000074849ab7 sysfer+0x4a969                          
6 0000000001dae830 0000000000000008 sysfer+0x19ab7                          
7 0000000001dae838 0000000001dae9d0 0x8                                     
8 0000000001dae840 0000000001dae9d0 0x1dae9d0                               
9 0000000001dae848 0000000076c65bbe 0x1dae9d0                               
a 0000000001dae850 0000000076cee8a0 kernel32!LocalOpenLocalMachine+0xbe                        
b 0000000001dae920 0000000000000040 kernel32!MachineStringKey+0x0           
c 0000000001dae928 0000000000000000 0x40 
0:020> lmvmsysfer
Browse full module list
start             end                 module name
00000000`74830000 00000000`748c2000   sysfer     (no symbols)           
    Loaded symbol image file: sysfer.dll
    Image path: C:\Windows\System32\sysfer.dll
    Image name: sysfer.dll
    Browse all global symbols  functions  data
    Timestamp:        Fri Sep 22 01:04:14 2017 (59C4C3FE)
    CheckSum:         0008A81A
    ImageSize:        00092000
    File version:     14.0.3688.1000
    Product version:  14.0.3688.1000
    File flags:       0 (Mask 0)
    File OS:          40004 NT Win32
    File type:        1.0 App
    File date:        00000000.00000000
    Translations:     0409.04e4
    Information from resource tables:
        CompanyName:      Symantec Corporation
        ProductName:      Symantec CMC Firewall
        InternalName:     sysfer
        OriginalFilename: sysfer.dll
        ProductVersion:   14.0.3688.1000
        FileVersion:      14.0.3688.1000
        FileDescription:  Symantec CMC Firewall sysfer
        LegalCopyright:   Copyright (c) 2006-2017 Symantec Corporation. All rights reserved. Use of this product is subject to license terms.
```

由上面的信息可以知道 sysfer 为 Symantec 防火墙组件，既然在等待未知 Handle，那我们可以尝试卸载该防火墙软件进行测试。进一步测试表明，的确是受 Symantec 防火墙影响。

如果有 Symantec 的 Symbol，还可以继续深挖确认当前等待的是什么并从根本上解决该问题。