---
layout: post
title: Process Monitor 使用实例
categories: Windows Tools
description: 本文介绍使用实例介绍如何使用 Process Monitor 解决问题。
keywords: Procmon，Debug
---

[如何使用 Process Monitor 排查问题](https://crushonme.github.io/2018/09/10/How-To-Use-Process-Monitor/)文章介绍了 Process Monior 的功能并介绍其使用方法。 本篇文章将以实际案例讲解在使用过程中如何快速定位问题点并结合其他工具排查问题。

# Chrome 无法加载 Silverlight 插件

问题环境中部署了 DLP 11 后，Chrome 中无法正确加载 Silverlight，使用的 Chrome 版本为 44.5。



## 问题分析

由于是 Chrome 加载 Silverlight 的问题，首先应该想到的是检查 Chrome 版本，在 Chrome 42.0 以后的版本中默认设置会阻止 NPAPI扩展，而 Silverlight 在 Chrome 中是基于 NPAPI 实现的。具体解释可以参考微软官方文章： [Microsoft Silverlight may not work in recent versions of Google Chrome](https://support.microsoft.com/en-us/help/3058254/microsoft-silverlight-may-not-work-in-recent-versions-of-google-chrome) 在 Chrome 45.0 以后的版本中已经移除了 NPAPI 特性，因此无法使用 Silverlight；鉴于当前版本号为 44.5，因此需要确认通过 Workaround 来开启 NPAPI 特性；

问题出现在部署了 DLP 11 后，基本可以排除是由于 Chrome 版本问题或者 NPAPI 特性被移除导致，那么很有可能是 DLP 11 的组件导致加载 Silverlight 过程出现问题。



## 日志分析过程

为了确认该猜测，我们可以使用 Process Monitor 来确认安装 DLP 11 前后对 Silverlight 插件的加载过程是否有差异。在对比 Process Monitor 日志时，我们可以加入以下几个条件来快速定位问题现场：

1. Process Name is chrome.exe ,该条件过滤其他干扰进程日子；
2. Path contains Silverlight ,该问题出现在加载 Silverlight 插件过程中，那么必然需要加载 Silverlight 相关的组件，因此可以将其设为条件之一；
3. Path contains xxx ,xxx为自定义插件的名称，显然如果 Chrome 调用插件，必然会引用其 DLL；
4. Result is not SUCCESS ,一般而言出问题时的 Result 都不会是 SUCCESS，但该条件只作为试探性条件，因为某些场景下正是因为增加了某些注册表或者文件，才会导致逻辑不一致；

经过以上条件过滤后，对比正常和异常日志则可以发现如下特征：

![ChromeLoadSilverlight](/images/posts/ChromeLoadSilverlight.png)

即 Chrome 正常情况下会加载 Silverlight 核心组件 agcore.dll, 而在异常情况下则没有加载该组件；因此我们可以移除前面的 2、3、4 条件，并添加以下条件：

- Path contains agcore.dll

添加以上条件后，可以很明显的看到 Chrome 在问题场景下加载 agcore.dll 时一直返回的是 NAME NOT FOUND ,说明 Chrome 在载 agcore.dll 过程中无法找到正确的路径，而正常情况下该路径应该是 C:\Program Files\Microsoft Silverlight\5.1.50709.0\agcore.dll

![ChromeLoadAgcoreDLL](/images/posts/ChromeLoadAgcoreDLL.png)

尝试检查调用栈确认 DLP 组件是否有对该过程进行操作：

![DLPHookLoadLibrary](/images/posts/DLPHookLoadLibrary.png)

通过上图对比，可以很明显的发现在异常情况中调用 Kernel32!LoadLibraryW 时会被 fcagchrome.dll 拦截，而该 DLL 正是 DLP 的 Chrome 扩展组件。同时也可以看到在被 fcagchrome.dll 拦截后， LoadLibraryW 函数在遍历 Path 环境变量中的路径，寻找 agcore.dll, 但未到 C:\Program Files\Microsoft Silverlight\5.1.50709.0 路径中寻找；

此时我们有三种方案：

1. 移除 DLP 的 Chrome 扩展组件，验证问题是否存在；
2. 将 C:\Program Files\Microsoft Silverlight\5.1.50709.0 加入环境变量 Path 中绕过该问题；
3. 联系 MacAfee 确认其 DLP Chrome 扩展组件在 Hook Kernel32!LoadLibraryW 时的具体行为；



