---
layout: post
title: Troubleshooting Native Heap Leak on Windows
categories: Debug
description: 
keywords: Heap Leak,WPR,WPA,Xperf
---

## 什么是 Native Heap Leak

在理解 Native Heap Leak 前我们需要了解以下几个概念：

- Heap 是一种用于小内存分配的管理机制。如在 Windows 10 中系统提供的 Heap 管理机制有 [NT Heap Manager 和 Segment Heap Manager](https://docs.microsoft.com/en-us/windows/win32/memory/heap-functions)；Dotnet 提供的 [Managed Heap 管理机制](https://docs.microsoft.com/en-us/dotnet/standard/automatic-memory-management)；C Runtime 提供的 [Memory Allocation](https://docs.microsoft.com/en-us/cpp/c-runtime-library/memory-allocation?view=vs-2019) 机制等。

- Native Heap 是相对于托管堆的概念，一般特指 NT Heap Manager 和 Segment Heap Manager 管理的堆。

- Leak 是指在分配了内存后未释放或者未及时释放，一般会导致应用程序崩溃或者是性能下降。

理解以上几个概念后，我们很容易知道 Native Heap Leak 是 Memory Leak 的一种,是相对于 Managed Heap Leak 的概念。

## 如何判断 Memory Leak 的场景为 Native Heap Leak

我们通常可以使用 [VMMAP](https://docs.microsoft.com/en-us/sysinternals/downloads/vmmap) 快速判断是否是 Native Heap Leak。
![VMMAP-Memory-Usage](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/VMMAP-Memory-Usage.png)

如果我们已经抓取了 DUMP， 也可以通过 !address -summary 的结果来判断,如下面的结果中 Heap 占用了 1.301 GB 的内存。

```windbg
    0:000> !address -summary
    Mapping file section regions...
    Mapping module regions...
    Mapping PEB regions...
    Mapping TEB and stack regions...
    Mapping heap regions...
    Mapping page heap regions...
    Mapping other regions...
    Mapping stack trace database regions...
    Mapping activation context regions...

    -Usage Summary -RgnCount --Total Size --- %ofBusy %ofTotal
    Heap             2741       533c0000 ( 1.301 GB)  71.38%   65.03%
    <unknown>        3881       14139000 ( 321.223 MB)  17.22%   15.69%
    Free             1344       b656000 ( 182.336 MB)            8.90%
    Image            707        8d55000 ( 141.332 MB)   7.58%    6.90%
    Stack            111        2590000 (  37.563 MB)   2.01%    1.83%
    Other            522        2166000 (  33.398 MB)   1.79%    1.63%
    TEB              37         53000 ( 332.000 kB)   0.02%    0.02%
    PEB              1          3000 (  12.000 kB)   0.00%    0.00%
```

## 如何排查 Native Heap Leak的原因

相对于 Managed Heap Leak，在排查 Native Heap Leak 时，我们通常需要借助于开启系统的辅助调试功能。一般主要有以下两种方式：

### 使用 DUMP 分析 Native Heap Leak

使用 DUMP 分析 Native Heap Leak 需要使用 Gflag/Pageheap/Regstry 等工具提前开启 Usermode Stack Tracing 才能确认其泄露的原因。假设出现 Native Heap Leak 的应用名称为 TestLeak.exe，任选一种即可：

- 使用 Gflags: 该方法需要安装 Debugging Tools for Windows
  - 下载并安装 Debugging Tools for Windows；​
  - 以管理员权限运行 CMD 并运行以下命令：

    ```BAT
    gflags -i TestLeak.exe +ust
    ```

- 注册表
  - 合并以下注册表:

    ```REG
    Windows Registry Editor Version 5.00
    [HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Image File Execution Options\TestLeak.exe]
    "GlobalFlag"=dword:0x1000
    ```

收集到 DUMP 后分析的过程大致如下：

- 检查当前的内存占用状态,确定当前是否为 Native Heap Leak;

  ```windbg
  !address -summary
  ```

- 检查是否正确开启了 Usermode Stack Tracing;

  ```windbg
    /* 以下两个命令均可以得出当前的 PageHeap 标志*/
    0:000> !gflag
    Current NtGlobalFlag contents: 0x00001000
    ust - Create user mode stack trace database

    0:000> !mex.gflags
    Current Process NtGlobalFlag 00001000 FLG_USER_STACK_TRACE_DB
  ```

- 查看当前的 Heap 状态，并确认当前消耗最多内存的堆块，如下面的实例中 Heap 009b0000 消耗了 1.53GB 的内存;

  ```windbg
  /* 以下两个命令的结果相同，但mheap 命令带有提示功能 */
  0:000> !heap -s
  0:000> !mex.mheap

    ************************************************************************************************************************
                                                NT HEAP STATS BELOW
    ************************************************************************************************************************
    NtGlobalFlag enables following debugging aids for new heaps:
        stack back traces
    LFH Key                   : 0x937b5411
    Termination on corruption : ENABLED
    Affinity manager status:
    - Virtual affinity limit 8
    - Current entries in use 0
    - Statistics:  Swaps=0, Resets=0, Allocs=0

    Heap     Flags   Reserv  Commit  Virt   Free  List   UCR  Virt  Lock  Fast
                        (k)     (k)    (k)     (k) length      blocks cont. heap
    -----------------------------------------------------------------------------
    00510000 08000002  162164 148972 162056  43273  1549    40  542     8a   LFH
        External fragmentation  29 % (1549 free blocks)
    009b0000 08001002   31700  14244  31592  11919   241     9    0      0   LFH
        External fragmentation  83 % (241 free blocks)
    072a0000 08001002    1188    144   1080     36    18     2    0      0   LFH
    07190000 08001002    7324   3792   7216     26    34     4    0      0   LFH
    07360000 08001002      60      4     60      2     1     1    0      0
    17180000 08001002      60     12     60      5     3     1    0      0
    240a0000 08001002   64076  53440  63968    281    49     8    1      4   LFH
    -----------------------------------------------------------------------------

    /*需要注意的是上面的数量是十六进制的，因此需要转换成十进制来计算或者使用rollup命令来换算*/
    0:000> !rollup -kb 188824
    1.53 GB
  ```

- 查看对应的堆块的内存占用统计信息：如示例中，有 542(21e) 个大小为 156k 的堆占用了该堆块 94% 的内存；

  ```windbg
  /* 以下两个命令均可以得出当前的 PageHeap 标志*/
  0:000> !heap -stat -h 510000 -grp A
  0:000> !mex.mheap 00510000
    heap @ 00510000
    group-by: TOTSIZE max-display: 20
        size     #blocks     total     ( %) (percent of total busy bytes)
        156600 21e - 2d4df400  (94.45)
        4981a 8d - 287c652  (5.28)
        800 94 - 4a000  (0.04)
        1000 2c - 2c000  (0.02)
        7c0 34 - 19300  (0.01)
        320 70 - 15e00  (0.01)
        20 a36 - 146c0  (0.01)
        d0 16d - 12890  (0.01)
        10 d8f - d8f0  (0.01)
        1034 c - c270  (0.01)
        470 25 - a430  (0.01)
        cc be - 9768  (0.00)
        1b80 5 - 8980  (0.00)
        3b8 23 - 8228  (0.00)
        4000 2 - 8000  (0.00)
        6c8 12 - 7a10  (0.00)
        200 38 - 7000  (0.00)
        1278 5 - 5c58  (0.00)
        40 165 - 5940  (0.00)
        48 12d - 54a8  (0.00)
  ```

- 查看消耗最多内存的 Heap Entry 信息；

  ```windbg
  /* 以下两个命令均可以得出当前的 PageHeap 标志*/
  0:000> !heap -flt s 156600
  0:000> !mex.mheap 00510000 -flt 156600
    Running '!mex.head 5000 !mex.grep '_HEAP @ .*510000' -until _HEAP !ext.heap -flt s 156600' to gather the 5000 entries.
        _HEAP @ 510000
        HEAP_ENTRY Size Prev Flags    UserPtr UserSize - state
            0ac49018 2ae00 0000  [00]   0ac49030    156600 - (busy VirtualAlloc)
            0d786018 2ae00 ae00  [00]   0d786030    156600 - (busy VirtualAlloc)
            164d2018 2ae00 ae00  [00]   164d2030    156600 - (busy VirtualAlloc)
            16f48018 2ae00 ae00  [00]   16f48030    156600 - (busy VirtualAlloc)
            11eea018 2ae00 ae00  [00]   11eea030    156600 - (busy VirtualAlloc)
            16bb8018 2ae00 ae00  [00]   16bb8030    156600 - (busy VirtualAlloc)
            16688018 2ae00 ae00  [00]   16688030    156600 - (busy VirtualAlloc)
            17dc4018 2ae00 ae00  [00]   17dc4030    156600 - (busy VirtualAlloc)
            17b74018 2ae00 ae00  [00]   17b74030    156600 - (busy VirtualAlloc)
            185ae018 2ae00 ae00  [00]   185ae030    156600 - (busy VirtualAlloc)
            16d78018 2ae00 ae00  [00]   16d78030    156600 - (busy VirtualAlloc)
            1776f018 2ae00 ae00  [00]   1776f030    156600 - (busy VirtualAlloc)
            1ee0d018 2ae00 ae00  [00]   1ee0d030    156600 - (busy VirtualAlloc)
            ……
  ```

- 确认对应的 Heap Owner;

  ```windbg
  /* 以下两个命令均可以得出当前的 PageHeap 标志*/
  0:000> !heap -p -a 7edcc018
  0:000> !mex.mheap -pa 7edcc018
    address 7edcc018 found in
    _HEAP @ 510000
      HEAP_ENTRY Size Prev Flags    UserPtr UserSize - state
        7edcc018 2ae00 0000  [00]   7edcc030    156600 - (busy VirtualAlloc)
        77e44ab6 ntdll!RtlpCallInterceptRoutine+0x00000026
        77e0206d ntdll!RtlpAllocateHeapInternal+0x0005011d
        77db1f3e ntdll!RtlAllocateHeap+0x0000003e
        6a4e8af3 TestLeakLib!DllRegisterServer+0x0002bb83
        6a4e8406 TestLeakLib!DllRegisterServer+0x0002b496
        6a4e846c TestLeakLib!DllRegisterServer+0x0002b4fc
        6a4aca4e TestLeakLib+0x0001ca4e
        6a4ac896 TestLeakLib+0x0001c896
        6a4a1d9e TestLeakLib+0x00011d9e
        6a4c812e TestLeakLib!DllRegisterServer+0x0000b1be
        ...
        76bd0419 kernel32!BaseThreadInitThunk+0x00000019
        77dd662d ntdll!__RtlUserThreadStart+0x0000002f
        77dd65fd ntdll!_RtlUserThreadStart+0x0000001b
  ```

### 使用 Windows Performance Toolkit 分析 Native Heap Leak 的原因

Windows Performance Toolkit 对于调试 Memeory Leak 的场景非常直观，因此其在我们日常工作中的使用率日益增加。

对于 Native Heap Leak 的场景，在使用 Windows Performance Toolkit 抓取 Native Heap Tracing 前，需要通过注册表增加 TracingFlags 后才可以收集到正确的诊断信息。由于 Heap Tracing 功能会记录很多信息，因此我们通常仅针对有问题的进程开启，并且在日志收集完成后，及时关闭 Heap Tracing 功能。

```BAT
reg add "HKLM\Software\Microsoft\Windows NT\CurrentVersion\Image File Execution Options\TestLeakApp.exe" /v TracingFlags /t REG_DWORD /d 1 /f
```

收集 Native Heap Leak 的 WPR 步骤如下：

- 以管理员权限运行 CMD 并运行以下命令：

  ```BAT
  wpr -start GeneralProfile -start Heap -start VirtualAllocation -filemode
  ```

  > 需要注意如果收集的时间跨度较长，请使用 filemode, 否则日志会被覆盖。

- 复现问题；

- 运行以下命令停止收集日志：

  ```BAT
  wpr -stop C:\HeapLeak.etl
  ```

> 如果安装了 ADK，也可以使用有界面的 Windows Performance Recorder。

收集好 WPR 日志，可以使用 Windows Performance Analyzer 分析日志，一般的分析步骤如下（更详细的示例可以参考 [Review heap dynamic allocations](https://docs.microsoft.com/en-us/windows-hardware/test/wpt/memory-footprint-optimization-exercise-2#step-3-review-heap-dynamic-allocations)）：

- 运行 WPA 并在 Memory 栏中找到 Heap Allocations 窗口，将其拖拽到分析页中；

- 调整表格中的列序并按照下列顺序从左往右依次排列(将需要分组的列放在 Golden Bar 左侧);
  - Process
  - Handle
  - Impacting Type
  - Stack
  - AllocTime
  - Count
  - Impacting Size
  - Size

- 在进程列表中找到关注的进程并将其他进程过滤（右键选中进程，然后选择 Filter To Selection 即可）；

- 点击 Size 列按照 Size 大小排序，定位到 Leak 的 Heap Handle；通过展开 Stack 列确定 Heap Leak 的 Owner。
