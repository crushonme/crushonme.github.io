---
layout: post
title: RDK 中的 Vps_printf() 与 Vps_rprintf()
categories: Davinci
description: Davinci DM8xx 系列 RDK 中打印函数简介。
keywords: Davinci, DM8168, RDK
---


原文地址：<http://blog.csdn.net/crushonme/article/details/16105261>

迁移地址：http://crushone.github.io

​       最近在TI的e2e以及相关QQ群众讨论时很多同学在做DSP算法或者在使用中断时SYS/BIOS被异常挂起，最终分析下来的原因是因为在中断上下文中使用了Vps_printf()或者是在禁止中断后恢复中断前的期间内使用了Vps_printf()，即hwi_disable()和hwi_restore()的上下文中使用。

​       在TI提供的RDK（包括DVRRDK和IPNCRDK）中Ducati-M3和DSP中运行的实时操作系统为SYS/BIOS，在SYS/BIOS中输出到串口的打印API为System_printf()。提供的能输出到linux串口的API即为Vps_printf()和Vps_rprintf()。

​       下面我们来分析下Vps_printf()和Vps_rprintf的源代码和相关限制。

​       首先我们来看下两个API的实现代码：

```
int Vps_printf(char *format, ...)
{
    int retVal;
    va_list vaArgPtr;
    char *buf = NULL;
    UInt32 cookie;

    cookie = Hwi_disable();

    buf = &gRemoteDebug_serverObj.printBuf[0];

    va_start(vaArgPtr, format);
    vsnprintf(buf, REMOTE_DEBUG_SERVER_PRINT_BUF_LEN, format, vaArgPtr);
    va_end(vaArgPtr);

    retVal = RemoteDebug_serverPutString(gRemoteDebug_serverObj.coreId, buf);

    Hwi_restore(cookie);

    if (BIOS_getThreadType() == BIOS_ThreadType_Task)
    {
        /* Printf should be called only from Task context as it does pend.
         * Calling from other context will cause exception
         */
        System_printf(buf);
    }

    return (retVal);
}
```

```
int Vps_rprintf(char *format, ...)
{
    int retVal;
    va_list vaArgPtr;
    char *buf = NULL;
    UInt32 cookie;

    cookie = Hwi_disable();

    buf = &gRemoteDebug_serverObj.printBuf[0];

    va_start(vaArgPtr, format);
    vsnprintf(buf, REMOTE_DEBUG_SERVER_PRINT_BUF_LEN, format, vaArgPtr);
    va_end(vaArgPtr);

    retVal = RemoteDebug_serverPutString(gRemoteDebug_serverObj.coreId, buf);

    Hwi_restore(cookie);

    return (retVal);
}
```

​       由上面两端代码可以很明显的看出Vps_printf()和Vps_rprintf()的前半部分都是讲输出到共享内存中供A8侧打印线程输出，唯一的区别就是Vps_printf()会

判断当前thread类型

是否是Task，如果是Task则调用SYS/BIOS下的System_printf()，将数据输出到对应处理器的串口或者是Circular Buffer中。

​       在Vps_printf()中有下列注释：

```
        /* Printf should be called only from Task context as it does pend.
         * Calling from other context will cause exception
         */
```

即表示Vps_printf()只能被用于Task任务类型的

thread

，在其他类型的thread中会导致异常情况。（

thread未翻译成

线程，因为这里的thread和我们通常理解的线程有差异）

​      此外，需要注意的是在Vps_printf()和Vps_rprintf()的实现中均需要屏蔽硬件中断，因此不能用于硬件中断类型的thread。下面有个童鞋使用的错误的例子：

![img](http://img.blog.csdn.net/20131113231408453?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvY3J1c2hvbm1l/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

注：

1、在SYS/BIOS下线程可以分为以下几类，如下图所示：

![img](http://img.blog.csdn.net/20131113225549703?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvY3J1c2hvbm1l/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

2、SYS/BIOS下的 System_printf() 可以配制成两种模式，一种是输出到串口，另一种是将内容输出到SYS/BIOS下配置的静态circular buffer中。System_printf()的静态circular buffer配置及输出方式配置如下图所示：

![img](http://img.blog.csdn.net/20131113230508218?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvY3J1c2hvbm1l/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

相关文档：

1、[SYS/BIOS ](http://processors.wiki.ti.com/index.php?title=Category:SYSBIOS)

2、[SYS/BIOS API](http://software-dl.ti.com/dsps/dsps_public_sw/sdo_sb/targetcontent/sysbios/6_21_01_16/exports/docs/docs/cdoc/ti/sysbios/BIOS.html#.Thread.Type)

3、[System_printf no output](http://e2e.ti.com/support/development_tools/code_composer_studio/f/81/t/43747)

["Hello world" is not output System_printf()](http://e2e.ti.com/support/embedded/bios/f/355/t/224754.aspx)