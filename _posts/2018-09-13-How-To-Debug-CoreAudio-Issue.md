---
layout: post
title: Core Audio API 相关问题如何排查
categories: Audio Windows
description: 本文介绍一般遇到 Core Audio 问题如何排查。
keywords: Procmon,Debug
---

在 Windows 中使用音频组件通常较为方便的为 Core Audio API，当然也可以使用经过封装过的更上层的 API。 在 Windows 10 中其音频栈框架在 MSDN 中有详细介绍，可以参考 [Windows Audio Architecture](https://docs.microsoft.com/en-us/windows-hardware/drivers/audio/windows-audio-architecture),其框架图如下
![audio-windows-10-stack-diagram](/images/posts/audio-windows-10-stack-diagram.png)

通常而言对于使用 Core Audio API 的应用出现问题较多的场景为部分 API 在使用过程中出现被阻塞的现象，一般而言这种问题有以下几种排查思路：

1. 可以在应用中添加日志即可确认具体的 API 接口问题;
2. 如果实际生产环境中才能复现的问题，则我们需要使用 Windows 中的 ETL trace 方式，但该方式的明显缺点是普通使用者无法解析 ETL，因为普通使用者没有对应的 Symbol。通常这种情况下需要有 Microsoft 的技术支持介入协助排查;
3. 以上两种方案一般仅仅能定位到具体出问题的 API，但很难知道底层为什么被阻塞，此时我们通常需要抓取 Complete DUMP来看（User Space DUMP 仅能看到当前进程的问题，而音频问题通常是 Audio Service 或者底层 driver 甚至是底层硬件导致）； 



针对其中第2点，我们可以使用如下脚本实现日志抓取，虽然以下脚本最大可以抓取 4G 日志，但通常而言不建议长时间抓取。 

``` 
@echo off
ECHO These commands will enable tracing:
@echo on

logman create trace "avcore_published" -ow -o c:\avcore_published.etl -p {A6A00EFD-21F2-4A99-807E-9B3BF1D90285} 0xffffffffffffffff 0xff -nb 16 16 -bs 1024 -mode Circular -f bincirc -max 4096 -ets
logman update trace "avcore_published" -p {E27950EB-1768-451F-96AC-CC4E14F6D3D0} 0xffffffffffffffff 0xff -ets
logman update trace "avcore_published" -p {B3A109EC-1CB3-4947-95ED-431033EEB1B4} 0xffffffffffffffff 0xff -ets
logman update trace "avcore_published" -p {10EB6007-818C-4DB6-A694-B518E589D07A} 0xffffffffffffffff 0xff -ets
@echo off
echo
ECHO Reproduce your issue and enter any key to stop tracing
@echo on
pause
logman stop "avcore_published" -ets

@echo off
echo Tracing has been captured and saved successfully at c:\avcore_published.etl
pause
```



对于抓取 Complete DUMP 可以参考文章 [How to generate a kernel or a complete memory dump file](https://support.microsoft.com/en-us/help/969028/how-to-generate-a-kernel-or-a-complete-memory-dump-file-in-windows-ser) ,这篇文章介绍了 Win7 平台下如何抓取 Complete DUMP ,对于抓取 Complete DUMP 通常需要注意以下几点：

- 对于物理内存小于 2GB 的系统，如果修改注册表才能开启 Complete DUMP 选项：

  ```
  Key:HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\CrashControl
  Entry:CrashDumpEnabled
  Value: 0x1
  ```

- 通常建议将 虚拟内存大小设置为物理内存的两倍；
- 一般而言我们使用 NotMyfault 产生 Dump， 对于一些阻塞事件较短的场景，可以配置使用按键触发 DUMP；

对于阻塞的 Complete DUMP 分析一般思路如下：

1. 使用 !mex.tl 命令列出所有的进程；
2. 找到调用音频组件出现问题的进程并使用命令 !mex.p 获取进程信息；
3. 列出其所有线程的状态，可以使用 !mex.lt ,此时如果有阻塞的线程，则会在信息中列出；
4. 依次根据阻塞线程信息最终定位到阻塞源并分析可能的原因即可；