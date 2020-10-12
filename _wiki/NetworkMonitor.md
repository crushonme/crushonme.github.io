---
layout: wiki
title: Network Monitor
categories: Browser
description: 网络包收集步骤
keywords: netmon,Network Monitor
---

# Network Monitor

## Network Monitor 抓取网络包步骤

- 根据当前 CPU 架构下载并安装 [Network Monitor](https://www.microsoft.com/en-us/download/4865)；

- 尽量关闭所有与问题无关的软件并以管理员权限运行 Network Monitor；

- 在 Network Monitor 左下角 Select Networks 中勾选对应的网络，确保正在被使用的 IP 对应的网卡被选中；

  ![NetworkMonitor](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/NetworkMonitor.png)

- 点击 "File" -> "New" -> "Capture" 新建采集实例，然后点击 “Capture" -> "Start" 或者快捷键 F5 开始抓取数据；

- 重现问题并记录时间点, URL, IP 地址等相关信息；

- 点击 "Capture" -> "Stop" 或者快捷键 F7 停止抓取数据，然后点击 "File" -> "Save As", 保存采集的数据。

## Netowrk Monitor 分包抓取网络包步骤

- 根据当前 CPU 架构下载并安装 [Network Monitor](https://www.microsoft.com/en-us/download/4865)；

- 尽量关闭所有与问题无关的软件并以管理员权限运行 Network Monitor；

- 以管理员权限运行 CMD并运行以下命令抓取网络包，该命令会每隔 200M 拆分一个文件存储；

  ```CMD
  mkdir C:\temp
  nmcap /network * /capture /file C:\temp\netmon.chn:200MB
  ```

- 重现问题并记录时间点， URL，IP 地址等信息；

- 问题重现后按 Ctrl + C 停止网络包抓取，网络包文件保存在 C:\temp 文件夹中。

## How to Capture Network Package with Network Monitor

- Download and install network monitor from [Network Monitor](https://www.microsoft.com/en-us/download/4865)；

- Restart machine

- Begin to capture netmon log (Open a cmd window, run command as below):

  ```CMD
  md c:\temp
  nmcap /network * /capture /file c:\temp\netmon.cap
  ```
  
  If we want to limit the file size of each capture file generated, use below command instead:

  ```CMD
  nmcap /network * /capture /file C:\temp\netmon.chn:200MB
  ```

- Repro issue

- After issue repro, press Ctrl+C in before cmd window to stop nmcap command, then collect logs in C:\temp.
