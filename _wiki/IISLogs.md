---
layout: wiki
title: Logs for IIS
categories: Debug
description: IIS 相关日志收集
keywords: IIS
---
# Logs for IIS

## IIS log

- 在 CMD 中运行如下命令获取站点 ID，其中 < SiteName > 使用站点名称替代
  ```
  %systemroot%\system32\inetsrv\APPCMD list site <SiteName>
  ```

- IIS日志保存在 %SystemDrive%\inetpub\logs\LogFiles\W3SVCn 下，如下图：
  ![IISLog](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IISLOG.png)

## HTTP Error Log

- HTTP Error 日志默认保存在 %SystemRoot%\System32\LogFiles

