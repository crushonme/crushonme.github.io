---
layout: post
title: Process Crash With Loading Components
categories: CI
description: This article talk about one possible reason about process crash with loading components.
keywords: Code Integrity, UMCI, Device Guard, 0x060c201e
---

代码完整性检查是系统安全中重要的功能，在 Windows 10 中加强了代码完整性的检查，譬如浏览器 Edge 中完全禁止了加载未通过微软认证的模块 [Mitigating arbitrary native code execution in Microsoft Edge](https://blogs.windows.com/msedgedev/2017/02/23/mitigating-arbitrary-native-code-execution/#A2jfQbV6G6r5R1RH.97)。但在加强代码、系统完整性检查的同时也会因为误杀导致一些问题，譬如应用程序崩溃。 

最近我们遇到一个案例，在安装了最新的某安全组件后，出现站点无法启动的问题，经过一系列排查，发现是由于最新版本的安全软件默认开启了代码完整性检查，而该站点引用的部分组件的签名已过期，进而导致在应用启动时加载对应模块过程中出现应用崩溃的问题。

本文我们记录了该问题的完整排查过程。对于一般的崩溃问题我们一般排查思路如下：

- 检查应用程序日志，查找 Application Error 日志，确认崩溃时抛出的异常及模块；通常应用程序日志中记录的模块并不准确，大部分情况下都会被记录为 NTDLL，因为抛出异常的函数为 NTDLL!RtlReportException;
- 如果事件日志中没有记录，通常会抓取 Process Monitor 日志分析；如果有 WER 记录，则配置 [WER](https://docs.microsoft.com/en-us/windows/win32/wer/collecting-user-mode-dumps) 、[Procdump](https://docs.microsoft.com/en-us/sysinternals/downloads/procdump) 或者 [DebugDiag](https://www.microsoft.com/en-us/download/details.aspx?id=58210) 抓取 DUMP 分析进一步原因；
- 如果在 DUMP 中无法直接找出原因，需要结合 LiveDebug 或者 [TTD](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/time-travel-debugging-overview) 分析程序退出的完整过程；

在该问题中我们结合 DUMP 和 Process monitor 日志一起看，如果仅仅从 DUMP 看，则很难知道具体原因。

在应用程序日志中，我们能看到有异常代码为 0x060c201e 的 Application Error 日志，该异常代码为非[常规代码](https://docs.microsoft.com/zh-cn/windows/win32/debug/system-error-codes)，没有对应的描述。

![0x060c201eException](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/0x060c201eException.png)

看到这个报错后，我们通过 [WER](https://docs.microsoft.com/en-us/windows/win32/wer/collecting-user-mode-dumps) 收集了崩溃时的 DUMP ，检查 DUMP 看到如下调用栈， 可以看到帧 0 的方法是在处理完整性相关的错误。可以通过检查参数信息找到当前需要加载的模块信息，但此时依然无法知道完整性错误的具体原因。

```
00 ntdll!LdrAppxHandleIntegrityFailure
01 KERNELBASE!CreateFileMappingNumaW
02 KERNELBASE!CreateFileMappingW
03 clr!MappedImageLayout::MappedImageLayout
04 clr!PEImageLayout::Map
……
19 clr!AssemblySpec::LoadAssembly
1a clr!AssemblyNative::Load
1b mscorlib_ni!System.Reflection.RuntimeAssembly.InternalLoadAssemblyName
1c mscorlib_ni!System.Reflection.RuntimeAssembly.InternalLoad
1d mscorlib_ni!System.Reflection.RuntimeAssembly.InternalLoad
1e mscorlib_ni!System.Reflection.Assembl
……
```



为了进一步得到更多信息，我们抓取了 Process Monitor 日志，并检查了加载对应模块上下文的调用栈：可以从调用栈明显的看到在 CI 模块调用 CiValidateImageHeader 时抛了错 CipReportAndReprieveUMCIFailure。

<img src="https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/LdrAppxHandleIntegrityFailure.png" alt="LdrAppxHandleIntegrityFailure" style="zoom:100%;" />

> 关于如何在 Process Monitor 中加载调用栈可以参考前面的文章 [如何查看调用栈]([https://crushonme.github.io/2018/09/10/How-To-Use-Process-Monitor/#%E5%A6%82%E4%BD%95%E6%9F%A5%E7%9C%8B%E8%B0%83%E7%94%A8%E6%A0%88](https://crushonme.github.io/2018/09/10/How-To-Use-Process-Monitor/#如何查看调用栈))

基于前面的信息我们可以半段该问题是由于 Code  Integrity 的设置导致崩溃，那我们就需要去检查 [Code Integrity 的日志](https://docs.microsoft.com/en-us/windows-hardware/drivers/install/viewing-code-integrity-events)确认真正的原因。通过检查 Code Integrity 的日志可以知道该问题是由于对应的模块的签名级别不满足企业要求。因此使用满足该企业要求证书重新对模块做签名即可。关于 Code Integrity 相关内容可以参考文章 [Getting Started with Windows 10 Device Guard](https://blogs.technet.microsoft.com/ukplatforms/2017/04/04/getting-started-with-windows-10-device-guard-part-1-of-2/)。

![CodeIntegrityError3303](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/CodeIntegrityErrorEvent3033.png)