---
layout: wiki
title: Performance counter trace 
categories: Debug
description: 如何收集 Performance Counter
keywords: Performance Counter
---
# Performance Counter Trace

## 收集 Dotnet 应用相关的性能日志

- 以管理员身份启动命令行窗口, 输入以下命令以创建DotNetPerfLog计数器集, 日志最大为512MB, 并设置采样间隔(-si)为1秒, 您可以根据实际使用情况进行调节.

  ```CMD
  Logman.exe create counter DotNetPerfLog -f bincirc  -max 512 -c  "\.NET CLR Memory(*)\*" "\.NET CLR Data(*)\*" "\Process(*)\*" "\.NET Data Provider for Oracle(*)\*" "\ASP.NET Applications(*)\*" "\ASP.NET v4.0.30319(*)\*"  "\Processor(*)\*"  -si 00:00:01 -o  C:\perflogs\DotNetPerfLog.blg
  ```

- 启动计数器收集工作

  ```CMD
  Logman start DotNetPerfLog
  ```

- 停止收集日志

  ```CMD
  Logman stop DotNetPerfLog
  ```

- 删除计数器集.

  ```CMD
  Logman delete DotNetPerfLog
  ```

## 收集性能日志脚本

```CMD
Logman.exe create counter Perf-1Minute -f bincirc -max 500 -c "\LogicalDisk(*)\*" "\Memory\*" "\Network Interface(*)\*" "\Paging File(*)\*" "\PhysicalDisk(*)\*"  "\Server\*" "\System\*" "\Process(*)\*" "\Processor(*)\*"  "\Cache\*" -si 00:01:00 -o C:\PerfMonLogs\Perf-1Minute.blg

Logman start Perf-1Minute

pause

Logman stop Perf-1Minute

Logman delete Perf-1Minute
```
