---
layout: post
title: IIS 8.5 无法安装 Advanced Logging 组件
categories: IIS
description: 本文介绍如何如何找出 IIS8.5 无法安装 Advanced Logging 组件的原因。
keywords: IIS 8.5, Advancced Logging
---
本文分析并记录了一个在 IIS 8.5 环境中安装 Advanced Logging 功能失败原因的分析过程。Advanced Logging 功能是 IIS 的插件，是 IIS 内置日志功能的增强版本，其主要增加了以下几个特性：
 - 自定义日志项；
 - 日志过滤功能；
 - 实时日志处理机制，可供自动化分析工具使用；
 - 记录客户端信息；

 按照其官方文档说明，该插件仅适用于 IIS 7/7.5/8 三个版本，实际也可以在 IIS 8.5 中安装。 但对于 IIS 10 则无法正常安装。

 # 问题现象：
在 IIS 8.5 环境中安装 Advanced Logging 功能是弹窗提示 "IIS version 7.0 is required to use IIS advanced logging 1.0"

# 问题分析
出现该问题首先想到的是查阅文档，检查 Advanced Logging 功能支持的 IIS 版本。 在 [Advanced Logging Readme](https://docs.microsoft.com/en-us/iis/extensions/advanced-logging-module/advanced-logging-readme#installation-notes) 文档中列出了前提条件：
- IIS 主版本号必须为 7 
>注： 此处文档较老，较新的文档中显示该功能可以工作在 IIS 7, IIS 7.5, IIS 8版本中，参考文档 [Advanced Logging](https://www.iis.net/downloads/microsoft/advanced-logging)
- 必须安装 IIS Management Console 功能
- 运行的账号必须拥有管理员权限

当前环境中版本为 8.5, 则第一个条件就不满足。问题就这么解决了吗？ No. 我们会发现在正常的 IIS 8.5 环境中安装该功能并不会出问题，而且也能正常使用，那在该环境中出现问题的原因是什么呢？

由于当前问题本地无法重现问题且提示的信息和 IIS 版本相关，因此我们大胆猜测此处的版本来自于注册表并且弹框提示会调用 MessageBox。 因此排查问题第一步，抓取 Process Monitor 日志 并在弹出框时抓取Dump 分析。
- 由于分析 Process Monitor 非常耗时，而且线索较难寻找，因此先看看 Dump 中是否有弹框相关的调用栈：

  ```
    0:000> ~*kcL

    .  0  Id: 86d5c.7220c Suspend: 0 Teb: 00007ff7`7a43d000 Unfrozen
     # Call Site
    00 user32!ZwUserGetMessage
    01 user32!GetMessageW
    02 msihnd!CMsiDialog::Execute
    03 msihnd!CMsiHandler::Message
    04 msi!MsiUIMessageContext::ProcessMessage
    05 msi!MsiUIMessageContext::RunInstall
    06 msi!RunEngine
    07 msi!MsiInstallProductW
    08 msiexec!DoInstallPackage
    09 msiexec!ServerMain
    0a msiexec!WinMain
    0b msiexec!__mainCRTStartup
    0c kernel32!BaseThreadInitThunk
    0d ntdll!RtlUserThreadStart

       1  Id: 86d5c.89a24 Suspend: 0 Teb: 00007ff7`7a43b000 Unfrozen
     # Call Site
    00 ntdll!ZwWaitForMultipleObjects
    01 KERNELBASE!WaitForMultipleObjectsEx
    02 user32!RealMsgWaitForMultipleObjectsEx
    03 user32!MsgWaitForMultipleObjectsEx
    04 user32!MsgWaitForMultipleObjects
    05 msi!MsiUIMessageContext::Invoke
    06 msi!CMsiEngine::Message
    07 msi!LaunchConditions
    08 msi!CMsiEngine::FindAndRunAction
    09 msi!CMsiEngine::DoAction
    0a msi!CMsiEngine::Sequence
    0b msi!RunUIOrExecuteSequence
    0c msi!CMsiEngine::FindAndRunAction
    0d msi!CMsiEngine::DoAction
    0e msi!CreateAndRunEngine
    0f msi!MsiUIMessageContext::MainEngineThread
    10 kernel32!BaseThreadInitThunk
    11 ntdll!RtlUserThreadStart

       2  Id: 86d5c.89a94 Suspend: 0 Teb: 00007ff7`7a30e000 Unfrozen
     # Call Site
    00 ntdll!ZwWaitForWorkViaWorkerFactory
    01 ntdll!TppWorkerThread
    02 kernel32!BaseThreadInitThunk
    03 ntdll!RtlUserThreadStart

       3  Id: 86d5c.89e90 Suspend: 0 Teb: 00007ff7`7a30c000 Unfrozen
     # Call Site
    00 ntdll!ZwWaitForMultipleObjects
    01 KERNELBASE!WaitForMultipleObjectsEx
    02 crypt32!ILS_WaitForThreadProc
    03 kernel32!BaseThreadInitThunk
    04 ntdll!RtlUserThreadStart

       4  Id: 86d5c.82dfc Suspend: 0 Teb: 00007ff7`7a30a000 Unfrozen
     # Call Site
    00 ntdll!ZwWaitForWorkViaWorkerFactory
    01 ntdll!TppWorkerThread
    02 kernel32!BaseThreadInitThunk
    03 ntdll!RtlUserThreadStart

       5  Id: 86d5c.89f80 Suspend: 0 Teb: 00007ff7`7a308000 Unfrozen
     # Call Site
    00 ntdll!ZwWaitForWorkViaWorkerFactory
    01 ntdll!TppWorkerThread
    02 kernel32!BaseThreadInitThunk
    03 ntdll!RtlUserThreadStart

       6  Id: 86d5c.89164 Suspend: 0 Teb: 00007ff7`7a306000 Unfrozen
     # Call Site
    00 ntdll!ZwWaitForMultipleObjects
    01 KERNELBASE!WaitForMultipleObjectsEx
    02 combase!WaitCoalesced
    03 combase!CROIDTable::WorkerThreadLoop
    04 combase!CRpcThread::WorkerLoop
    05 combase!CRpcThreadCache::RpcWorkerThreadEntry
    06 kernel32!BaseThreadInitThunk
    07 ntdll!RtlUserThreadStart

    似乎运气不太好，看上去调用栈中并没有弹窗相关的函数。不过在86d5c.89a24 线程调用栈中似乎在查找 LaunchConditions；
  ```
- 既然DUMP 中未看到明显的线索，那就检查 Process Monitor 日志看是否能找出些蛛丝马迹
  - 用 path 以 version 开头或者结尾为条件过滤，发现其中一条记录如下，使用标签功能标记该记录：
  >msiexec.exe	RegQueryValue	HKLM\SOFTWARE\Microsoft\INETSTP\MajorVersion	SUCCESS	Type: REG_DWORD, Length: 4, Data: 8	
  - 移除上述条件，观察该记录上下文的记录，发现在访问该注册表后写了日志文件：
  >msiexec.exe	WriteFile	C:\Users\xx\AppData\Local\Temp\4\MSI26823.LOG	SUCCESS	Offset: 59,696, Length: 366, Priority: Normal	
- 当我们熟悉 MSI 安装程序时，第一步想到的应该是打开日志记录功能，排查详细日志。我们再绕了一大圈后也找到了对应的日志记录；
- 检查对应日志，我们会发现如下记录：
  ```
    MSI (c) (48:FC) [16:45:12:302]: Doing action: LaunchConditions
    Action 16:45:12: LaunchConditions. Evaluating launch conditions
    Action start 16:45:12: LaunchConditions.
    IIS Version 7.0 is required to use IIS Advanced Logging 1.0.
    MSI (c) (48:FC) [16:45:13:726]: Product: IIS Advanced Logging 1.0 -- IIS Version 7.0 is required to use IIS Advanced Logging 1.0.

    Action ended 16:45:13: LaunchConditions. Return value 3.
    MSI (c) (48:FC) [16:45:13:728]: Doing action: FatalError
    Action 16:45:13: FatalError. 
    Action start 16:45:13: FatalError.
  ```
- 在安装过程中检查 LaunchConditions 时抛出 "IIS Version 7.0 is required to use IIS Advanced Logging 1.0"。此时我们要思考的是 Advanced Logging 的安装包的 LaunchConditions 是什么？经过一番搜索和思考，我们找到以下两篇文档 [From MSI to WiX, Part 3 – Launch Conditions and Application Search](https://blogs.technet.microsoft.com/alexshev/2008/02/10/from-msi-to-wix-part-3-launch-conditions-and-application-search/) 和[LaunchCondition Table](https://docs.microsoft.com/en-us/windows/win32/msi/launchcondition-table)。 从对应的文档中我们可以知道在 MSI 的文件中存在一个数据库，其中记录了很多的安装信息，如安装条件，执行顺序，回滚方法等等；
- 紧接着我们肯定会想到的就是如何从 MSI 文件中找到对应的数据库，又经过一番搜索，我们可以找到 [MSI Explorer](https://blogs.technet.microsoft.com/sateesh-arveti/2010/11/20/msi-explorer/)。 通过 MSI Explorer 可以看到 Advanced Logging 组件的 LaunchCondition 中可能抛出 "IIS Version 7.0 is required to use IIS Advanced Logging 1.0" 报错有两种
  ![](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/LaunchCondition.png)
- 结合 MSI 安装日志，则很容易知道是由于属性 IISW3SVCINSTALLED 和 IISMANAGEMENTCONSOLEINSTALLED 为空导致； ![](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/AdvancedLoggingMSILog.png)
- MSI 中的属性在 AppSearch 表中可以找到对应的 Signature, 而对应的资源在  CompLocator, DrLocator, RegLocator, 和 IniLocator  中找到其实际对应的资源。详细解释参考 [From MSI to WiX, Part 3 – Launch Conditions and Application Search](https://blogs.technet.microsoft.com/alexshev/2008/02/10/from-msi-to-wix-part-3-launch-conditions-and-application-search/)
  ![](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/AppSearch.png)
  ![](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/RegLocator.png)
- 目前为止我们已经了解到当前问题是由于注册表 [HKLM\SOFTWARE\Microsoft\INETSTP\Components\W3SVC] 和 [HKLM\SOFTWARE\Microsoft\INETSTP\Components\ManagementConsole] 为空导致，因此我们需要了解这两项注册表分别代表什么含义；此处我们再次需要搜索相关的资料, 在 IIS 的文档 [Discover Installed Components](https://docs.microsoft.com/en-us/iis/install/installing-iis-7/discover-installed-components) 中列出了对应的注册表项含义， W3SVC 和 ManagementConsole 分别代表 "Web Server" 和 "IIS Management Console"; 而这两项为 IIS 的核心组件。
- 至此我们基本的除了该问题的可能原因：注册表损坏
  