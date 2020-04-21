---
layout: wiki
title: How to Collect Process Monitor Log
categories: Debug
description: Procmon 收集步骤
keywords: Procmon
---
# How to Collect Process Monitor Log

## Collect Process Monitor With Command

- Download [Process Monitor](https://download.sysinternals.com/files/ProcessMonitor.zip)

- Run CMD as Administrator and run below command:

  ```CMD
  mkdir C:\temp
  Procmon /backingfile C:\temp\logfile.pml /AcceptEula /Minimized /Quiet
  ```

- Reproduce issue;

- After the issue happens, run below command in previours CMD window

  ```CMD
  prcmon /terminate
  ```

## 如何开启Process Monitor数据收集

1. 启动Process Monitor工具.
2. 点击![img](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/clear.jpg)图标清空日志。
3. 点击![img](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/Stop_Capture.jpg)图标，之后该图标会变为![img](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/Start_Capture.jpg)表示此时正在收集数据。

## 如何保存Process Monitor收集到的数据

1. 点击![img](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/Start_Capture.jpg)图标，之后该图标变为![img](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/Stop_Capture.jpg)表示数据收集工作已经停止。
2. 点击![img](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/SaveLogs.jpg)图标保存日志，选择“All events”，格式选择为PML，如下图所示：
  ![img](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/SaveToFile.jpg)

## 如何抓取系统启动时的事件

1. 在 Option 中选择 Enable Boot Logging 功能，如下图：
   ![EnableBootLogging](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/EnableBootLogging.png)

2. 弹出以下窗口提示，如果希望获取线程事件信息则勾选 Generate thread profiling events 并选择时间间隔，然后选择 OK；
   ![EnableBootLoggingOption](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/EnableBootLoggingOption.png)

3. 重启机器并复现问题，当系统启动后运行 Process Monitor，此时会提示 Boot-Time 活动已经记录，是否保存数据，保存对应的日志即可：
   ![EnableBootLoggingPromopt](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/EnableBootLoggingPromopt.png)
