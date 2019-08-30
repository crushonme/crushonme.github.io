---
layout: post
title: 如何从 DUMP 中确认当前的 dotnet runtime 是否为调试模式
categories: Windbg
description: 本文介绍如何在dump中确认当前 dotnet runtime 是否为调试模式。
keywords: Windbg, Memory,dotNet
---

As we know for applications running in production Debug should never be set to true which will casue performance issue. 
-  The compilation of ASP.NET pages takes longer (since some batch optimizations are disabled)
- Code can execute slower (since some additional debug paths are enabled)
- Much more memory is used within the application at runtime
- Scripts and images downloaded from the WebResources.axd handler are not cached
- ASP.NET Timeouts

For more impact we can refer to document 
[Don’t run production ASP.NET Applications with debug=”true” enabled](https://weblogs.asp.net/scottgu/442448)
[ASP.NET Memory: If your application is in production… then why is debug=true](https://blogs.msdn.microsoft.com/tess/2006/04/12/asp-net-memory-if-your-application-is-in-production-then-why-is-debugtrue/ )

However the command  finddebugtrue and finddebugmodules do not work and we will get below information:

> 0:027> !psscor4.finddebugtrue
> Loading the heap objects into our cache.
> The garbage collector data structures are not in a valid state for traversal.
> It is either in the "plan phase," where objects are being moved around, or
> we are at the initialization or shutdown of the gc heap. Commands related to 
> displaying, finding or traversing objects as well as gc heap segments may not 
> work properly. !dumpheap and !verifyheap may incorrectly complain of heap 
> consistency errors.
> Error requesting GC Heap data
> Unable to build snapshot of the garbage collector state
> No Runtimes have debug=true
> Total 0 HttpRuntime objects
>
> 0:027> !psscor4.finddebugtrue
> No Runtimes have debug=true
> Total 0 HttpRuntime objects



**So how can we identify it in a memory dump?**

We can use [netext](https://github.com/rodneyviana/netext) extension instead of psscor4. With netext extension, we can use **wruntime** to dump http runtime information as active requests and app domain id and **wmodule** to Dump all modules in process which can be filtered by name, company, debug mode, etc. 

Below is help information for wruntime and wmodule. Before we use these two command, we should index and dump managed heap types enabling tree view and to save index in disk with command **windex**.

> 0:006> !whelp wruntime
> Dump all active Http Runtime information
> This is equivalent to this command:
>
> ```
> !wfrom -nospace -nofield -type System.Web.HttpRuntime where ((!_beforeFirstRequest) || _shutdownReason) "\n=========================================================================\n","Address         : ",$addr(),"\nFirst Request   : ",$tickstodatetime(_firstRequestStartTime.dateData),"\nRuning Time     : ",$tickstotimespan($now() - _firstRequestStartTime.dateData),"\nApp Pool User   : ",_wpUserId,"\nTrust Level     : ",_trustLevel,"\nApp Domnain Id  : ",_appDomainId,"\nDebug Enabled   : ",$if(_debuggingEnabled,"True (Not recommended in production)","False"),"\nActive Requests : ",_activeRequestCount,"\nPath            : ",_appDomainAppPath,$if(_isOnUNCShare," (in a share)"," (local disk)"),"\nTemp Folder     : ",_tempDir,"\nCompiling Folder: ",_codegenDir,"\nShutdown Reason : ",$if(_shutdownReason,$enumname(_shutdownReason)+" at "+$tickstodatetime(_lastShutdownAttemptTime.dateData),"Not shutting down"),"\n\n",$if(_shutdownReason,_shutDownMessage+"n"+_shutDownStack,"")
> ```
>
>
> **Syntax:**
> ---------
> !wruntime
>
> Examples:
> ---------
>
> Dumps all Active Http Runtime
> --------------------------------
> 0:00>!wruntime
>
> =========================================================================
> Address         : 000000011F7244F0
> First Request   : 7/23/2014 5:13:36 PM
> Runing Time     : 00:03:14
> App Pool User   : CONTOSO\serv_account
> Trust Level     : Full
> App Domnain Id  : /LM/W3SVC/8989/ROOT/Services/2013v3-1-130506092168812411
> Debug Enabled   : True (Not recommended in production)
> Active Requests : 0n0
> Path            : G:\Internet\wwwroot\contoso\Services\ (local disk)
> Temp Folder     : C:\Windows\Microsoft.NET\Framework64\v4.0.30319\Temporary ASP.NET Files
> Compiling Folder: C:\Windows\Microsoft.NET\Framework64\v4.0.30319\Temporary ASP.NET Files\contoso_Services\998f0bec\b158a7c7
> Shutdown Reason : HostingEnvironment at 7/23/2014 5:25:41 PM
>
> Directory rename change notification for 'G:\Internet\wwwroot\contoso\Services\'.
> Services dir change or directory rename
> HostingEnvironment initiated shutdown
> HostingEnvironment caused shutdownn   at System.Environment.GetStackTrace(Exception e, Boolean needFileInfo)
> at System.Environment.get_StackTrace()
> at System.Web.Hosting.HostingEnvironment.InitiateShutdownInternal()
> at System.Web.HttpRuntime.ShutdownAppDomain(String stackTrace)
> at System.Web.HttpRuntime.OnCriticalDirectoryChange(Object sender, FileChangeEvent e)
> at System.Web.FileChangesMonitor.OnSubdirChange(Object sender, FileChangeEvent e)
> at System.Web.DirectoryMonitor.FireNotifications()
> at System.Web.Util.WorkItem.CallCallbackWithAssert(WorkItemCallback callback)
> at System.Threading.ExecutionContext.Run(ExecutionContext executionContext, ContextCallback callback, Object state, Boolean ignoreSyncCtx)
> at System.Threading.QueueUserWorkItemCallback.System.Threading.IThreadPoolWorkItem.ExecuteWorkItem()
> at System.Threading.ThreadPoolWorkQueue.Dispatch()
> at System.Threading._ThreadPoolWaitCallback.PerformWaitCallback()
>
> 
>
> -----------------------------------------------------------
>
> 0:006> !whelp wmodule
> Dump modules filtered by type or pattern.
>
> The types are:
> - Not from Microsoft
> - Managed only
> - Compiled in debug mode (managed code only)
>
>
> Syntax:
> ---------
>
> !wmodule [-debug] [-managed] [-noms] [-order] [-fullpath] [-name <partial-name>]
>    [-company <partial-name>] [-saveto <folder>]
>
> Where:
>  - debug Lists only managed modules compiled in debug mode. Optional
>  - managed Lists only managed modules. Optional
>  - noms Lists modules which are not from Microsoft (it may contain false positives). Optional
>  - order The output will be sorted by name. Optional
>  - fullpath It includes the full path to the modules. Optional
>  - name <partial-name> List only modules matching the pattern (e.g -name Contoso.MyLibrary*). Optional
>  - company <partial-name> List only modules from the company in the pattern (e.g -company TailsSpin*). Optional
>  - saveto <folder>When present it will save the selected module to an existing folder (e.g. -saveto c:\my mods\). Optional. Must be at the end.
>
> > Note: -saveto <folder> must be the last parameter. Do not use quotes.
> Examples:
> -----------------------------------
>
> Dumps all modules containing 'mscor'
> ------------------------------------
> 0:000> !wmodule -name mscor* -fullpath
> Address                      Module Version Company Name       Debug Mode Type Module Binary
> 00007fff1c590000                  4.6.127.1 Microsoft Corporation     No   CLR C:\Windows\assembly\NativeImages_v4.0.30319_64\mscorlib\88c60510e9a0b668a5a8e270dba0dfcf\mscorlib.ni.dll
> 00007fff1f830000                   4.6.79.0 Microsoft Corporation     No   NAT C:\Windows\Microsoft.NET\Framework64\v4.0.30319\mscoreei.dll
> 00007fff1f8d0000           10.0.10240.16384 Microsoft Corporation     No   NAT C:\Windows\System32\mscoree.dll
>
> 3 module(s) listed, 74 skipped by the filters
>
> Dumps all non-Microsoft modules and save to disk
> -------------------------------------------
> 0:000> !wmodule -noms -saveto c:\modules here
> Saved 'c:\modules here\NoTrack.dll' successfully
> Saved 'c:\modules here\VanillaService.exe' successfully
> Saved 'c:\modules here\HttpListenerBehavior.dll' successfully
>
> 3 module(s) saved, 0 failed, 74 skipped by the filters