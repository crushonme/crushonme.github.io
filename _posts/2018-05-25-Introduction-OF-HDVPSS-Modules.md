---
layout: post
title: HDVPSS 模块介绍及使用
categories: Davinci
description: HDVPSS 模块介绍及使用。
keywords: Davinci, DM8168, HDVPSS
---

HDVPSS模块即High-Definition Video Process Sub System，主要用于视频的capture、deinterlacing、scaler、up/down sample、graphics、display等，由Media Controller Dula ARM Cortex-M3系统中的VPSS-M3控制。软件工程师在做程序的时候需要注意各个模块支持数据的输入格式和输出格式（另外需要注意的是：TI提供的RDK中限定了display controller的矩阵连接，如果希望灵活使用这个矩阵连接，需要自行拆分，关于该部分内容请参考HDVPSS_UserGuide.pdf中Display Controller Driver中Macro Mapping）。HDVPSS整体硬件框架如下图所示，注意数据格式。

![img](http://img.blog.csdn.net/20130918232259515?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvY3J1c2hvbm1l/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

播放接口：

​       播放接口支持同时独立输出两路高清图像和一路标清图像，其中两路高清图像的源可以从两路数字接口（DVO1和DVO2，其中DVO1支持HDMI输出）和一路模拟接口（HDCOMP即内部集成的HD DAC）中选择，标清输出支持多种数据格式和多种视频制式。（需要注意的是DVO1与HDMI公用数字信号线，所以HDMI与DVO1输出是完全相同的，硬件工程师在设计的时候尤其需要注意。）

![img](http://img.blog.csdn.net/20130920092843828?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvY3J1c2hvbm1l/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

图1 播放口应用

​        DVO1：该接口的数据既可以直接输出数字信号也可以送给内部的HDMI Transfer Phy产生HDMI信号，可以支持10/20/30bit的内外同步数据输出，可以送出HS、VS、FID（Field ID）、AVID（Active Video ID）等时序信号。该接口有独立的时钟源，即hd_venc_d_clk。

​        HDCOMP：该接口实际是内部集成的HD DAC输出接口，最高支持1080P60，像素时钟为148.5MHz，其时序参数是可编程的，具体请参考hdvpss中源码。HD DAC也有独立的时钟源，即hd_venc_g_clk。需要注意的是该接口支持[VBI](http://baike.baidu.com/view/989273.htm#2)输出。

​       DVO2：该接口特性基本和DVO1相同，需要注意的是DVO2口没有独立的时钟源，其时钟源既可以共享DVO1的时钟源，也可以共享HD DAC的时钟源，因此决定了播放接口只能送出两路独立的高清图像（主要体现在分辨率上）。（注：在RDK中DM814x的DVO2的时钟源绑定到了HDMI口，如果希望HDMI和DVO2口同时输出不同分辨率的内容，请注意修改该部分内容，E2E上已经有很多人问道该问题。具体修改，请参照VPSS M3侧Display controller配置部分代码）

​       SD DAC：该接口支持PAL、NTSC、SECAM等标清视频制式，输出格式也是多种多样，包括复合信号（[CVBS](http://en.wikipedia.org/wiki/Composite_video)）、[S端子](http://en.wikipedia.org/wiki/S-Video)、分量信号（[YPbPr](http://en.wikipedia.org/wiki/YPbPr)）、[Euro-SCART](http://en.wikipedia.org/wiki/SCART)（RGB）等。和HD DAC一样，该接口也支持VBI输出。

![img](http://img.blog.csdn.net/20130920092901328?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvY3J1c2hvbm1l/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

图2 播放口时钟分配

采集接口：

​        采集口有VIP0和VIP1，VIP0支持8/16/24bit采集，当VIP0作为24bit采集口时，VIP1口不可用。VIP0和VIP1既可以采集16bit数据，也可以拆分成两个8bit采集口，Port A和Port B，如下表所示：

![img](http://img.blog.csdn.net/20131114191038546?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvY3J1c2hvbm1l/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

​       采集方式根据数据通道数、所需时序信号和复合方式（针对多路采集复合成一路数据的decoder，如TVP5158、TW2865）分成多种，根据通道数可以分成Single Channel和Multi Channel；在Single Channel的数据中又根据同步方式分成内同步（Embedded）和外同步（Discrete）方式；在外同步方式中根据所使用不同参考时钟分成多种，如HS&VBLK模式、HS&VS模式、AVID&VBLK模式、AVID&VBLK模式（VBLK为消隐时钟）；在Multi Channel的数据中根据复合方式不同，分成三种，即Line Mux、Pixel Mux及Split Line Mux。

​       在HDVPSS包中，有stream、channel、instance(port)、path等概念，port很容易理解，对于HDVPSS模块，采集path有两个，即VIP0和VIP1；instance则表示实际的输入端口(port)，如上述表中所示，HDVPSS的输入端口可以配置成单个instance（24bit）、两个instance（16bit）、四个instance（8bit），至于能不能为3个instance（两个8bit和一个16bit）本人未试验过，不太清楚；channel则表示每个instance有多少个输入通道，普通的AD为单通道，但对于TVP5158/TW2865/TW2866这类多通道AD则可以配置成单通道、双通道或者是四通道；stream是专门用于描述采集口输出的，没路采集口可以输出最多四路码流，在HDVPSS UserGuide中举的例子如下：

Example of streams are:
• Single source dual format capture - YUV420 capture (stream 0) + RGB capture (stream 1)
• Ancillary data capture - YUV422 capture (stream 0) + VBI capture (stream 1)

对于channel和stream的概念需要注意区分，UserGuide中告诉我们以下两点注意事项：

![img](http://img.blog.csdn.net/20131114192809109?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvY3J1c2hvbm1l/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

在采集的驱动中还有个概念叫channelNum，该值是通过instance、channel、stream三个值获取，被放入frame的信息头中，用于标识改frame的归属，其公式如下：

```
/**
 * \brief Make a system unique channelNum
 *
 * channelNum is value which is a combination of
 *  - instance ID
 *  - stream ID for that instance
 *  - channel ID for that stream, instance
 *
 * For details refer to VIP capture section in User Guide
 *
 * \param instId    [IN] VIP Instance ID
 * \param streamId  [IN] Stream ID
 * \param chId      [IN] Channel ID
 *
 * \return channelNum
*/
static inline UInt32 Vps_captMakeChannelNum ( UInt32 instId, UInt32 streamId,
                                              UInt32 chId )
{
    return instId * VPS_CAPT_CH_PER_PORT_MAX * VPS_CAPT_STREAM_ID_MAX
        + streamId * VPS_CAPT_CH_PER_PORT_MAX + chId;
}
```

![img](http://img.blog.csdn.net/20131114193657265?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvY3J1c2hvbm1l/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

注意：

- 对于Multi Channel模式，由于无法共用参考时钟，因此必须使用内同步模式，具体格式可以参考[BT656格式](http://www-inst.eecs.berkeley.edu/~cs150/Documents/ITU656.PDF)。Single Channel支持三种数据格式，即：YUV444、YUV422、RGB888；Multi Channel仅支持YUV422格式。
- 采集口支持VBI数据采集；
- 对于Multi Channel模式采集，采集口内置了De-Multiplexing模块，该模块不需要CPU的参与；
- 采集口像素始终最高能达到150MHz，即Single Channel模式下采集分辨率可以达到1080P60，Multi Channel模式下采集分辨率可以达到16 Channel D1@30fps；
- 采集模块中内置RGB2YUV和YUV2RGB色彩空间转换模块（CSC：ColorSpace Conversion）、Scalar模块（缩放范围：1/8x ---8x）、降采样模块（YUV422toYUV420）；
- 内置CSC模块矩阵系数 Ai/Bi/Ci 和偏置 Di 均可以设置，如下图所示。

![img](http://img.blog.csdn.net/20130920100306796?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvY3J1c2hvbm1l/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

Pixel Mux：在DM8168的TRM和TVP5158的数据手册中都有详细描述，说白了其实就是一种利用时分复用的减少数据引脚数的方法，下面用两张图（均摘自[TVP5158数据手册](http://www.ti.com/lit/ds/symlink/tvp5158.pdf)）来说明，分别是两路视频信号和四路视频信号（内同步格式，嵌入了同步信号，请参考BT656格式）的复用模式：

![img](http://img.blog.csdn.net/20130917193248031?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvY3J1c2hvbm1l/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

注：上图中时钟好像有点错误，两路D1的pixel mux模式下时钟应该为54MHz。

![img](http://img.blog.csdn.net/20130917193203734?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvY3J1c2hvbm1l/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

Line Mux：下图（截图来自DM8168 TRM）中是两路视频信号的line mux模式。

![img](http://img.blog.csdn.net/20130917202626078?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvY3J1c2hvbm1l/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

其他模块

其他模块在这里仅仅给出名词解释，内部原理想了解的话可以找本图像处理方面的书来学习下。

DEI：DeInterlacing，去交织处理，官方解释：Used to converted interlaced video source material to progressive form即隔行信号到逐行信号的转换；

DRN：De-Ringing，去振铃效应，官方解释：Applies a de-ringring algorithm on input video data to reduce noise即使用去振铃算法来做降噪处理；

SC：scaler，缩放处理，官方解释：Resize the input image to the desired output size即将输入图像做缩放处理；

EDE：Edge Detail Enhancer，边缘增强，官方解释：Performs edge detail enhancement即对边缘的细节做增强处理；

VCOMP：Video Compositor，图像合成，官方解释：Composite two sources of input video over a background color layer即将两幅图像放入一个背景图层中；

CPROC：Color Processing，色彩处理，包括了CSC、DCC(Dynamic contrast control)、White point control等等

NF：Noise Filter，噪声滤波器，官方解释：Performs a memory to memory spatial/temporal noise filter algorithm即使用时空域噪声滤波算法做降噪处理；


[HDVPSS 模块介绍及使用](http://blog.csdn.net/crushonme/article/details/10287693)

有任何问题和意见可以在评论区给我留言，我们一起探讨和学习。有童鞋邮件我说是能否讲解的更详细，其实我也想讲的更详细，只可惜大部分资料来源于NDA文档，所以不能讲的太细，想了解更多，请联系TI FAE 或者代理商。

参考资料：

1、HDVPSS UserGuide文档

2、TVP5158 datasheet

3、HDVPSS驱动包

 