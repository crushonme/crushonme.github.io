---
layout: post
title: 如何使用 Process Monitor 排查问题
categories: Windows Tools
description: 本文介绍如何使用 Process Monitor 排查 Windows 中的问题。
keywords: Procmon，Debug
---

Process Monitor 是一款 Windows 平台的高级监控工具。它可以记录系统中注册表、文件和进城、线程的活动。功能上集合了 Sysinternals 组件中 FileMon 和 RegMon 的功能并添加了很多方便排查问题的实用功能，如过滤条件并且提供了丰富的事件属性，如 Session IDs 、用户名、进程信息、调用栈等等。这些特性使 Process Monitor成为 Windows 平台中不可或缺的神兵利刃。



# Procmon 强大的功能集

- 强大的条件过滤功能，方便我们快速定位；
- 捕获每个操作的线程堆栈；
- 可靠捕获进程详细信息，如映像路劲、命令行、用户、加载的模块和会话 ID等；
- 进程树可以详细的列举进程的父子关系；
- PML格式支持保存所有日志信息，以便在不同的 Process Monitor实例中加载；
- 支持引导启动，方便排查启动过程中的错误；



# Process Monitor 的缺点

- 日志缓存在虚拟内存中，长时间抓取时会导致内存不足；一般情况下我们建议每隔一小时启停一次，可以配合脚本或者定时任务来完成；
- 条件设置的逻辑关系无法自定义；



# 如何开启Process Monitor数据收集

1. 启动Process Monitor工具.
2. 点击![img](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/clear.jpg)图标清空日志。
3. 点击![img](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/Stop_Capture.jpg)图标，之后该图标会变为![img](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/Start_Capture.jpg)表示此时正在收集数据。

 

# 如何保存Process Monitor收集到的数据

1. 点击![img](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/Start_Capture.jpg)图标，之后该图标变为![img](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/Stop_Capture.jpg)表示数据收集工作已经停止。
2. 点击![img](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/SaveLogs.jpg)图标保存日志，选择“All events”，格式选择为PML，如下图所示：            

![img](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/SaveToFile.jpg)



# 如何使用过滤功能

1. 点击图标 ![Filter](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/Filter.png) 弹出过滤设置窗口，如下图所示：

   ![FilterSettings](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/FilterSettings.png)

2. 设置条件并添加至条件列表，然后选择 OK 或者 Apply ：如下图设置表示当记录项的 Architecture 属性为 32-bit 时则显示对应记录项

   ![HowToAddFilters](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/HowToAddFilters.png)



# 如何定位问题现场

- 结合问题现象设置合适的条件：
  - 如需要排查某应用的问题，则可以先添加 Process Name 条件为某应用的名称；
  - 如需要定位注册表，则可以尝试设置可能的 Path 路径条件 或者可能的关键字；
  - 如需要定位 FileNotFound 的问题，则可以设置 Result 为 FileNotFound；
- 添加合适条件后尝试使用二分法定位具体位置，可以结合对应的事件属性，如调用栈；



# 如何抓取系统启动时的事件

1. 在 Option 中选择 Enable Boot Logging 功能，如下图：

   ![EnableBootLogging](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/EnableBootLogging.png)

2. 弹出以下窗口提示，如果希望获取线程事件信息则勾选 Generate thread profiling events 并选择时间间隔，然后选择 OK；

   ![EnableBootLoggingOption](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/EnableBootLoggingOption.png)

3. 重启机器并复现问题，当系统启动后运行 Process Monitor，此时会提示 Boot-Time 活动已经记录，是否保存数据，保存对应的日志即可：

   ![EnableBootLoggingPromopt](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/EnableBootLoggingPromopt.png)



# 如何查看调用栈

1. 配置 Symbol 路径，可以在 Process Monitor --> Option --> Configure Symbols 中配置或者设置系统环境变量，可以参考文章 [Specify symbol file locations from the command line](https://docs.microsoft.com/en-us/visualstudio/profiling/how-to-specify-symbol-file-locations-from-the-command-line?view=vs-2017)

2. 双击事件并选择 Stack 列，则可以看到对应的调用栈，该功能部分场景下只有 public symbol 时意义不大，但如果有 private symbol 则如虎添翼；

   ![Stack](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/Stack.png)