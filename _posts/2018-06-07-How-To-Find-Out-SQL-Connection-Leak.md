---
layout: post
title: 如何找出 .NET 程序中的数据库连接泄漏
categories: Windbg
description: 本文介绍如何找出 .NET 程序中的数据库连接泄漏.
keywords: Windbg，SQL，Connection Leak
---

通常我们可以通过查看性能计数器 NumberOfReclaimedConnections 来观察是否存在数据库连接泄露的问题，通常对应于 .NET Data Provider for Oracle 和 .NET Data Provider for SqlServer下，如下图：
![Connection Leak](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/Connectionleak.png)

如果通过性能计数器 NumberOfReclaimedConnections 观察到有数据库连接泄露的问题，我们通常可以通过 Code Review ，找出泄漏点。但是如果代码量很大，此时很难通过直接 Code Review 的方式来定位。这时候我们可以通过抓取 DUMP 来定位出可能存在泄露的数据库语句，然后通过数据库语句定位可能的泄漏点，然后再通过 Code Review 的方式找出未关闭连接的代码并解决即可。

通常查看数据库连接泄露的 DUMP 可以通过以下几步定位：

1.  查看 DUMP 中的性能计数器：

   - 如果是 SQL 则通过命令 !mex.sqlclientperfcounters 获取；
   - 如果是 Oracle 则通过命令 !mex.oracleclientperfcounters 获取；

2. 查看可能存在泄露的 SQL 命令：!mex.sqlcmd -l

   ![sqlcmd -l](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/sqlcmd-l.png)

3. 根据上面获得的命令定位泄漏点：

   - 此时如果我们有对应的工程，则可以在工程中尝试搜索这些 SQL Command 或者存储过程在哪些地方被使用，并定位出问题点；
   - 如果没有工程，在反编译工具中无法进行全局搜索，因此可以在 DUMP 中通过 GC Root 尝试恢复出调用栈，然后根据线索找出泄漏点；

常见的数据库泄露问题代码样式：

- 关闭连接部分代码为放在 finally 代码块中；此时如果执行过程中出现异常，则无法正常关闭连接；
- 在 ExecuteReader 中指定行为常量为 [CommandBehavior.CloseConnection](https://msdn.microsoft.com/en-us/library/system.data.commandbehavior(v=vs.110).aspx)，但最终未关闭 DataReader 对象；
- 在类中定义的静态数据库连接变量用于连接复用，此时需要注意在合适的时候关闭连接，否则该连接很可能一直无法释放；