---
layout: wiki
title: How To Collect Event Log
categories: Debug
description: 收集事件日志的方法
keywords: Debug, Event Log
---

# How To Collect Event Log

## Collect Event log

- Open Eventview with running eventvwr.msc;

- Click on "Windows Logs" and then right click the log you want to save, Then Click "Save All Events As":

  ![EventLog-Save-US](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/EventLog-Save-US.png)

- Save Event log as evtx format to get more details of event log.

## 收集事件日志

- 在运行中运行命令 eventvwr.msc;

- 在事件查看器中点击 "Windows 日志"，然后选择需要保存的日志，右键并选择 "将所有时间另存为":

  ![EventLog-Save-CN](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/EventLog-Save-CN.png)

- 将事件日志保存为 evtx 格式，以便获取更多的日志细节信息；

- 如果跳出 "显示信息" 提示，点击确定即可；
  ![EventLog-Information](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/EventLog-Information.png)

## 命令行收集事件日志

```
wevtutil epl System C:\temp\system.evtx
wevtutil epl Application C:\temp\Application.evtx
```
