---
layout: post
title: DM81xx DVR RDK 中内存分布
categories: Davinci
description: DM81xx DVR RDK 中内存分布, 翻译自 DM81xx DVR_RDK Memory Map.pdf。
keywords: Davinci, DM8168, Memory
---

以下内容译自 DM81xx DVR_RDK Memory Map.pdf 文件。

 

在 DVR RDK 中支持多种不同的场景，为了更有效地利用内存，在 SYS/BIOS 侧将物理内存配制成多个段，不同的段的大小是可以配置的，具体属性各不相同。

​    下面简单介绍下各个区域的用途：

Linux Memory：分配给 Linux 管理的内存区域

Shared Regions: 受限制的共享内存区，根据配置不同，其属性也各不相同，具体配置请参考 [syslink 文档](http://processors.wiki.ti.com/index.php/SysLink_UserGuide)

l Syslink MessageQ/IPC ListMP：Non-cached on M3

l Bitstream Buffer：Cached on A8. Cached on M3, although access by DMAs

l Frame Buffer：VPSS - Video M3 Frame Buf

l IPC ListMP for Dual-M3：Cached on M3

Slave Code and Data Section Memory：各个处理器的代码段和数据段，包括 DSP 和 Dual-M3 系统

Remote Debug Memory：即2.2.1中所说的 Remote debug 部分的共享内存

VPDMA Descriptiors Memory：用于存放 VPSS M3 部分分配的 DMA 配置

Host VPSS Notify Shared Memory：用于使用 FBDev 时传递 A8 侧命令至 VPSS M3 侧

Tiler Memory：为 HDVPSS 和 HDVICP 提供 Tiled 内存，包含 8bit 区和 16bit 区。

FBDev Shared Memory：为 VPSS M3 侧驱动提供内存

硬件上的限制：

- Ducati M3 系统无法访问超过 0xA0000000 的代码区；
- Ducati M3 系统无法访问超过 0xE0000000 的数据区；
- Ducati M3 系统中的 AMMU 只能管理 512MB 或者 32MB 的大内存段 (Large Pages), 被划分成了四个段，其中一段用于映射寄存器，因此 AMMU只能访问这三个内存段；

软件上的限制：

-  由于 Linux 系统的内核空间为 1GB、用户空间为 3GB，因此内核最大只能映射 1GB 的存储空间，其中包含了启动参数及共享内存区；
-  共享内存是静态分配的，因此修改后需要重新编译链接；
- 由于映射 Frame Buffer 会消耗大量的内核空间，因此并未被映射到 A8 侧，用户在需要的时候动态映射（如使用 IPC Frames In/Out link）；

在修改内存分布的时候需要注意的事项：

-  必须考虑上述的软硬件上的限制；即 VPSS M3和 VIDEO M3 的代码段必须放置在低 512MB 的物理内存里，并且需要在 AMMU 配置中将虚拟地址一一映射到物理地址；
- 最少需要留 2MB 的空间给 Syslink-Notify 给内核空间，用于 A8 和 VPSS M3 的通信，位置改变的时候，需要注意 bootargs 中的参数 “notifyk.vpssm3_sva” 也需要相应修改；
- RemoteDebug 段是用于方便调试用的打印消息暂存区，除 A8 外，所有消息打印都存在该区域，并使用 Vps_printf 调用，送到 Linux 侧串口终端打印出来。可用于日志记录。在原有的一套代码中，需要自己根据内存配置指定日志记录所处的内存位置。用户可以将该套代码修改后集成到源程序中，做出实时打印来方便调试。具体位置可以根据配置，修改TI原有的 genaddrinfo.xs 脚本来产生一个头文件来指定（具体可仿照 genaddriinfo.xs 中生成 env_xx_xx.sh 的方法生成一个宏定义的头文件 autocfg_mem.h，供其他代码调用）。
- Linux Memory 大小改变同样也需要修改 bootargs 中的 “mem” 参数，如果被分成多段的话，则可以使用 “mem=<SIZE>@<ADDR>” 来指定，需要注意的是TI在后续版本中要求 Linux Memory 需要按照 4MB 对齐。
- Tiler Memory 的起始地址需要 128MB 对齐，如果不使用 Tiler Memory ，该段内存会被用于 Frame Buffer 或者 Bitstream Buffer 的补充；

 