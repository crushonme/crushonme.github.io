---
layout: post
title: Netra McASP 接口介绍
categories: Davinci
description: Netra McASP 接口介绍。
keywords: Davinci, DM8168, RDK
---


原文地址：<http://blog.csdn.net/crushonme/article/details/10012051>

迁移地址：http://crushonme.github.io

有任何问题和意见可以在评论区给我留言，我们一起探讨和学习



​        McASP即multichannel audio serial port，是通用音频接口，支持[TDM](http://baike.c114.net/view.asp?TDM)(Time-Division Multiplexed stream)协议、[I2S](http://zh.wikipedia.org/zh-cn/I%C2%B2S)协议等。McASP可以非常灵活的与[S/PDIF](http://baike.baidu.com/view/190317.htm) ([Sony/Philips Digital Interface](http://en.wikipedia.org/wiki/S/PDIF))等接口连接。McASP的数据线可以灵活的配置成输入或者输出，同步模式则根据具体接口设计来决定，可以配置成主模式(由内部生成帧同步、字同步、位同步)或者从模式(由外部提供帧同步、字同步、位同步)。

1、 McASP硬件框架

![img](https://mp.csdn.net/postedit/10012051)![img](http://img.blog.csdn.net/20130819230816718?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvcm9iaW4xOTg5MDMwNQ==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

![img](https://mp.csdn.net/postedit/10012051)

由上图可以看出对于McASP接口的时钟（包括帧同步、字同步、位同步）是独立的，这也就意味着McASP可以设置输入输出不同采样率的数据。

2、McASP时钟配置

2.1、Bit Clock

​        MCASP时钟发生器可以产生两个独立的时钟域，即采集时钟(Receive)和播放时钟(Transmit)。bit clock主要有三种方式：内部时钟、外部时钟、混合时钟输入方式。

​        内部时钟是有主时钟经过分频送来的AUXCLK提供(具体请参考DM8168 TRM中的PRCM部分介绍)；

![img](http://img.blog.csdn.net/20130819231042234?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvcm9iaW4xOTg5MDMwNQ==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

![img](https://mp.csdn.net/postedit/10012051)

​        外部时钟则可以通过晶体提供，即输入到ACLKR/X引脚的外部时钟驱动；

​        混合式中输入方式，即外部高频时钟输入到AHCLK/R引脚，分频后作为ACLKR/X的驱动源；

![img](http://img.blog.csdn.net/20130819230904875?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvcm9iaW4xOTg5MDMwNQ==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)![img](http://img.blog.csdn.net/20130819230918203?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvcm9iaW4xOTg5MDMwNQ==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

![img](https://mp.csdn.net/postedit/10012051)![img](https://mp.csdn.net/postedit/10012051)

​        由上图可以知道，CLKXM/CLKRM决定XCLK/RCLK是由内部提供还是外部输入；CLKXP/CLKRP控制XCLK/RCLK的时钟极性，即上升沿采样或者下降沿采样；

注意：AHCLKX和AHCLKR也有两种方式，一种是外部提供，一种由AUXCLK倍频得到。

2.2、Frame Clock

帧同步信号有两种不同的模式：突发模式、TDM模式。帧同步信号的选择是通过对接收和发送帧同步信号控制寄存器AFSRCTL和AFSXCTL来编程控制的。

主要的配置选项包括以下几个方面：

- 帧同步时钟驱动方式：内部产生、外部供给
- 帧同步信号极性：上升沿、下降沿
- 帧同步信号宽度：bit、word
- 位延时：在第一个数据位前的0、1或2个时钟周期（在I2S中要求位延迟设置为1）

![img](http://img.blog.csdn.net/20130908225943796?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvY3J1c2hvbm1l/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

3、McASP的传输方式

在McASP传输模式中，TRM中讲解的很清楚，有三种：Burst Transfer Mode、Time-Division Multified Tramsfer Mode、Digital Audio Interface Transmit Transfer Mode。

3.1、Burst Transfer Mode

这种传输方式并非用于传输音频信号，常用于处理器之间传输控制信息等，此时其实McASP用作普通的串行通信接口。详细的配置方法请参见DM8168 TRM 14.2.6.1节。

以下网页说明了该模式如何使用：

<http://e2e.ti.com/support/dsp/tms320c6000_high_performance_dsps/f/115/t/86981.aspx>

3.2、Time-Division Multified Tramsfer Mode

最常用的一种传输方式；常用的音频格式I2S格式就是从TDM格式中把每帧中Slot数设置成2得到的。基本时序如下图：

![img](http://img.blog.csdn.net/20130908233512156?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvY3J1c2hvbm1l/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

图中每个Slot（最多32个slot）都可以看作是一路信号（maybe 音频信号），每帧数据中包括多个通道的数据。对于标准I2S信号而言，每帧中包括两个Slot（即左右声道数据）；扩展后的I2S信号中有2*N个Slot，包含了N路立体声音频数据，例如TW2865、TVP5158这类decoder中音频为多路复合数据（详见datasheet中描述）。

3.3、Digital Audio Interface Transmit Transfer Mode

该传输模式作为以上两种方式的一种补充，传输方式基本类似于I2S，但编码方式有所区别，采用BMC编码（[Biphase-Mark Code](http://en.wikipedia.org/wiki/Differential_Manchester_encoding)，中文名：[差分曼彻斯特编码](http://baike.baidu.com/view/1147173.htm) ）方式，如下图所示，详细解释请参考[通信原理相关知识](http://www.cnblogs.com/johnchain/archive/2013/05/05/3061028.html)：

![img](http://img.blog.csdn.net/20130908235934671?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvY3J1c2hvbm1l/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

 