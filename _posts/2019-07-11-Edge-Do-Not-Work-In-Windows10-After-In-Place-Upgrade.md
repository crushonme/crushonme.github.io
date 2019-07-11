---
layout: post
title: 从 Win7 升级到 Win10 后 Edge 无法正常浏览网页
categories: IIS
description: 本文分析了一个 Edge 无法打开网页的问题原因。
keywords: In-Place-update, Edge
---

# 问题现象
使用 In-Place 方式将 Windows 7 升级至 Windows 10 RS5 版本后，打开 Edge 并输入网址页面无任何响应并且需要多次点击关闭按键才能正常关闭



# 问题分析

该问题出现在输入网址后，无响应，那我们首先想到的便是网络请求是否有发出，Server 端是否又返回。由于该问题是所有站点均无法正常访问，因此我们怀疑网络请求未正常发出。那么抓取 Network Monitor 日志就可以确认；

通过网络抓包，发现对应的网络请求未正常发出，因此该问题应该是在 Edge 的底层出现了问题。对于这种问题，我们通常需要使用 Process Monitor 和事件日志来寻找更多的线索，以便更深入的理解问题。

从应用程序日志中，我们发现存在 Application Error，详细内容如下，即在 MicrosoftEdge.exe 运行过程中遇到了异常代码为 0xC0000409 的异常，对应的出问题模块为 iertutil.dll。
```
Faulting application name: MicrosoftEdge.exe, version: 11.0.17763.107, time stamp: 0x5bd3b881
Faulting module name: iertutil.dll, version: 11.0.17763.1, time stamp: 0x80814317
Exception code: 0xc0000409
Fault offset: 0x000000000000941f
Faulting process id: 0x2378
Faulting application start time: 0x01d50a1f336479b2
Faulting application path: C:\Windows\SystemApps\Microsoft.MicrosoftEdge_8wekyb3d8bbwe\MicrosoftEdge.exe
Faulting module path: C:\WINDOWS\System32\iertutil.dll
Report Id: 5c685ad5-f047-415a-a338-3dbf7e8022b1
Faulting package full name: Microsoft.MicrosoftEdge_44.17763.1.0_neutral__8wekyb3d8bbwe
Faulting package-relative application ID: MicrosoftEdge
```
看到有 Application Error， 我们就可以配置 WER 来抓取 DUMP，还原问题现场。关于如何配置 WER 抓取 DUMP 可以参考微软文档 [Collecting User-Mode Dumps](https://docs.microsoft.com/en-us/windows/win32/wer/collecting-user-mode-dumps)
>注： 配置 WER 抓取  DUMP 有针对系统和针对某个应用两种情况，当前场景仅需要针对 MicrosoftEdge.exe 配置即可

分析 DUMP 可以看到 iertutil 组件在尝试调用 [AttachBrowserElevationBroker](https://i.blackhat.com/eu-18/Thu-Dec-6/eu-18-Ding-Cutting-Edge-Microsoft-Browser-Security-From-People-Who-Owned-It-wp.pdf) , 经过查询发现该调用时为了启动一个 Browser Broker，即 ietutil 组件尝试启动 Brower broker 时失败并报错 FAST_FAIL_FATAL_APP_EXIT。
```
0:004> .exr -1
ExceptionAddress: 00007ff8699e941f (iertutil!AttachBrowserElevationBroker+0x00000000000000ff)
   ExceptionCode: c0000409 (Security check failure or stack buffer overrun)
  ExceptionFlags: 00000001
NumberParameters: 3
   Parameter[0]: 0000000000000007
   Parameter[1]: ffffffff80080005
   Parameter[2]: 000000000000008d
Subcode: 0x7 FAST_FAIL_FATAL_APP_EXIT
0:004> kcL
  *** Stack trace for last set context - .thread/.cxr resets it
 # Call Site
00 KERNELBASE!RaiseFailFastException
01 iertutil!wil::details::WilDynamicLoadRaiseFailFastException
02 iertutil!wil::details::WilRaiseFailFastException
03 iertutil!wil::details::WilFailFast
04 iertutil!wil::details::ReportFailure
05 iertutil!wil::details::ReportFailure_Msg
06 iertutil!wil::details::in1diag3::FailFast_IfFailedMsg
07 iertutil!AttachBrowserElevationBroker
08 eModel!`anonymous namespace'::InitializeIfNeeded
09 eModel!ElevationBroker::BrowserBrokerSTAThread::s_ThreadProc
0a kernel32!BaseThreadInitThunk
0b ntdll!RtlUserThreadStart
```
此时结合 Process  Monitor 日志，查看 进程树，发现实际 Browser Broker 进程是存在的，此处失败，说明 MicrosoftEdge.exe 与其通信过程存在问题。
![](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/EdgeBrowserBroker.png)

在 Process  Monitor 中设置如下两个过滤条件并找到 browser_broker.exe 进程的启动过程，可以看到在 browser_broker 的启动阶段前期较为正常，但在和 VDD2HookUmode.dll 的交互过程中进入了死循环。从名字来看，该组件是用于用户空间的 Hook 组件。

> Process Name contains browser_broker

![](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/EdgeBrowserBroker-VDD2HookUmode.png)

排查到这里，我们需要做的就是找出 VDD2HookUmode.dll，设置过滤条件为:

> path contains VDD2HookUmode.dll

找出任意一个正常加载了该组件的进程并在事件属性的 Process 栏查看该组件的相关信息，如下图。 可以看出该组件的介绍为 WDDM User Mode Filter Hook Driver, 开发厂商为 datronicssoft Inc. 。

![](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/VDD2HookUmode.png)


>注： Microsoft Edge 已经禁止了非授权的组件的加载，对于第三方组件在 Edge 中加载需要 WHQL 签名。 
>参考文档：
>
>>[Mitigating arbitrary native code execution in Microsoft Edge](https://blogs.windows.com/msedgedev/2017/02/23/mitigating-arbitrary-native-code-execution/#5Kl88ui7Z5rm60Od.97)
>>[Microsoft Edge: Building a safer browser](https://blogs.windows.com/msedgedev/2015/05/11/microsoft-edge-building-a-safer-browser/#TkIdQFTjTXTlp45K.97)



# 解决方案

- 卸载使用 VDD2HookUmode.dll 组件的软件；
- 联系使用 VDD2HookUmode.dll 组件的厂商；

>注： 已知会使用该组件的有
>
>> [ClickShare Extension Pack ](https://www.barco.com/en/product/clickshare-extension-pack)