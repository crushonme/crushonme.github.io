---
layout: post
title: Davinci 的异构多核间通信基础组件 SysLink 2.0
categories: Davinci
description: Davinci 的异构多核间通信基础组件SysLink 2.0。
keywords: Davinci, DM8168, RDK
---


[Davinci 的异构多核间通信基础组件 SysLink 2.0](http://blog.csdn.net/crushonme/article/details/10287693) 部分模块由于没有用过，也没看到 SysLink 包中提供例子，所以只是简略介绍。文中给出的 API 并不会给出相关解释，请参考[SysLink API Reference Documentation](http://software-dl.ti.com/dsps/dsps_public_sw/sdo_sb/targetcontent/syslink/latest/docs/html/index.html)

注：这部分涉及到 cfg 脚本（XDC）配置，用得比较少，涉及到很多 TI 及其他公司封装的 java 类库，后续等学习了再详细说明。




绪论：Davinci 中的多核系统一般由 GPP+DSP 构成，也就是所谓的异构多核（同构是指内部核的结构是相同的，而异构是指内部的核结构是不同的），为了为异构多核处理器间提供高效的异构多核协作，需要建立异构多核间的通信机制。在 TI 提供的异构多核间通信组件 SysLink 中，核间通信机制为用户提供了多种实现方法。下面的内容将介绍 [SysLink](http://processors.wiki.ti.com/index.php/SysLink_UserGuide) 架构、特性和相关的 API。

关键词

| 缩写词  | 解释                                        |
| ------- | ------------------------------------------- |
| HLOS    | Higher Level Operating System               |
| RTOS    | Real Time Operating System                  |
| CCS     | Code Composer Studio                        |
| IPC     | Inter-Processor Communication               |
| GPP     | General Purpose Processor e.g.ARM           |
| DSP     | Digital Signal Processor e.g. C64X          |
| CGTools | Code Gen Tools e.g.Compiler Linker Archiver |

 

SysLink 工具包为异构多核之间的通信提供基础开发接口，使得多核系统之间更方便的交换信息。在多核异构系统中，每个核心运行的操作系统和所处地位各不相同。所运行的 OS 可以是 HLOS，如 Linux、WinCE 等，也可以是RTOS 如 SYS/BIOS 或者 QNX 。异构多核系统中主处理器（Host Processor）肩负着控制从处理器（Slave Processor）的责任。

广义上的 SysLink 包含了运行在 HLOS 上的 SysLink 和运行在 RTOS 上的 IPC。其基本架构如下图所示：

![img](http://img.blog.csdn.net/20130830095854156?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvY3J1c2hvbm1l/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

SysLink 工具包主要针对于嵌入式操作系统中的应用，主要由以下组件构成：

- 系统管理（System Manager）
- 处理器管理（Processor Manager——PM）
- 核间通信（Inter-Processor Communication——IPC）
- 其他模块（Utility Modules）

# 1、系统管理

​        系统管理模块（IPC module）为方便多核管理提供了简单快捷的方法，此外也为系统资源（e.g.系统内存）的管理提供了接口。

​        IPC 模块提供的功能包括：

- SysLink 系统初始化 (syslink_setup()、syslink_destroy()) 并为其他 SysLink 组件分配内存，包括 IPC 模块和 PM 模块 (MemoryOS_setup()、Ipc_setup(&config))
- 系统配置：任何系统级别的配置信息是由系统管理；

# 2、处理器管理

​        ProcMgr 模块为从处理器提供了以下 services：具体例子可以参见 DVRRDK_xx.xx.xx.xx\dvr_rdk\mcfw\src_linux\utils\fw_load 中 firmware load 的例子。

- boot-loading 从处理器
- 读写从处理器的内存区
- 从处理器电源管理

​        因此该模块为以上 services 提供了以下接口：

- Loader：处理器的 Loader 接口有多种实现实现方式，被写入的文件形式可能是如 COFF、ELF、动态 loader (不太清楚这是啥)或者自定义类型的文件等等；
- Power Manager：考虑到处理器管理模块的通用性并且希望电源管理模块可以自定义，在 SysLink 中电源管理是可嵌入处理器管理的独立模块；
- Processor Manager：为处理器提供了加载、MMU 管理( A8 支持)、读写从处理器内存等接口。

Loader 流程图：

![img](http://img.blog.csdn.net/20131015192637046?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvY3J1c2hvbm1l/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

Processor Manager 系统框架图如下

![img](http://img.blog.csdn.net/20130829233549406?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvY3J1c2hvbm1l/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

​        在 SysLink 系统中，为了方便管理，每个处理器都会被编码（即 Processor ID）；如图中所示，在该系统中使用了硬件抽象层来屏蔽底层硬件差异，这样做的好处就是为不同的底层硬件提供了通用的软件接口。

注：

1. SysLink 中从处理器的 Loader 文件理论上支持多种格式，在 SysLink Release 版本中主要支持 COFF 和 ELF。在 TI 的编译系统中，可以以可执行文件的后缀名来区别 COFF 文件和 ELF 文件，后缀名中带有 ‘e’ 的是 ELF（如：xxx.xe64P），不带 ‘e’ 的是COFF文件（如：xxx.x64P）。
2. 当前的 ELF Loader 只支持顺序加载，即只有当一个从处理器加载并启动后才能去加载下一个从处理器，不支持并行加载。

# 3、处理器间通信协议（Inter-Processor Communication Protocols）

​        SysLink下定义了以下几种通信机制：

- Notify
- MessageQ
- ListMp
- GateMp
- HeapBufMp
- HeapMemMp
- FrameQ（通常用于raw 视频数据）
- RingIO（通常用于音频数据）

​       这些通信机制的接口都有一下几个共同点：

1. 所有 IPC 通信机制的接口都由系统规范化的命名；
2. 在 HLOS 端，所有 IPC 接口都有 <Module>_setup() and <Module>_destroy() API 用于初始化或者销毁相应的 IPC Module；部分初始化还需要提供配置接口，<Module>_config();
3. 所有的实例化都需要使用 <Module>_create() 来创建，使用 <Module>_delete() 来删除；
4. 在更深层次使用IPC时需要用 API <Module>_open() 来获取 handle ，在结束使用 IPC 时需要用 API <Module>_close() 来回收 handle；
5. IPC 的配置多数都是在 SYS/BIOS 下完成配置的，对于支持 XDC 配置的则可以使用静态配置方法；
6. 每个 IPC 模块都支持 Trace 信息用于调试，而且支持不同的 Trace 等级；
7. 部分 IPCs 提供了专门的 APIs 来用于提取分析信息；

## 3.1、Notify

Notify 组件将硬件中断抽象成多组逻辑事件，是一种简单快捷的发送低于 32bit 信息的通信方式。

Notify 组件提供了以下接口：

1. 初始化并配置 Notify 组件；Notify_attach();
2. 注册/注销事件；Notify_registerEvent()/Notify_unregisterEvent()/Notify_registerEventSingle()/Notify_unregisterEventSingle()
3. 发送带参数的事件给某处理器；Notify_sendEvent()
4. 通过回调函数接收事件；Notify_FnNotifyCbck()
5. 使能/禁用事件；Notify_diableEvent()/Notify_enableEvent()
6. 其他逻辑接口；Notify_eventAvailable()/Notify_intLineRegistered()/Notify_numIntLines()/Notify_restore()

注：

1. 同一个中断号可以注册多个事件，同一个事件可以有多个回调函数或者多个宿主（可以是处理器、线程或者任务），事件被触发后所有宿主都会被唤醒；
2. 一个事件可以接收多个宿主发送来的通知（notification），事件所携带的参数最大支持 32bit；
3. 事件是有优先级的，EventId 越小优先级越高，事件 0 的优先级最高，随着 EventId 增大优先级依次递减；当多个事件被触发，优先级最高的会最先响应；
4. Notify 模块使用硬件中断，因此不能被频繁调度。

Notify 组件常用于传递附带消息少于 32bit 的场景，如信令传递、buffer 指针传递等。在信令传递时使用高优先级的事件，如事件 0；而在传递 buffer 指针是可以使用低优先级的事件，如事件 30 等。

在 Notify_sentEvent() API 中带有参数 waitClear，该参数为可选参数，如果 waitClear 为 TRUE，这就意味着多宿主事件无法及时响应，必须等待前一宿主事件结束后才能响应下一宿主；如果 waitClear 为 FALSE，最好不要为事件附带参数，否则多宿主事件可能会由于消息被覆盖而出现丢消息的现象。该API最好不要在中断服务程序(ISR)中调用(特别是 waitClear = TRUE 时)，否则会导致中断调度出现异常(表现之一：高优先级的中断响应会延迟)；此外该 API 不能再使用 GateMP 模块锁保护的程序段中调用，否则可能会导致操作系统死锁。

由于其他模块使用了 Notify 机制，因此在 SysLink 中预留了部分事件号，这部分事件号用户需要慎重选用（如果你没有使用其他组建的话，可以考虑占用这部分事件号）,在注册事件前可以使用 Notify_eventAvailable() 来检查该事件是否可用，即该中断号上的该事件号是否被注册。

| Module                 | Event Ids |
| ---------------------- | --------- |
| FrameQBufMgr           | 0         |
| FrameQ                 | 1         |
| MessageQ(TransportShm) | 2         |
| RingIO                 | 3         |
| NameServerRemoteNotify | 4         |

## 3.2、MessageQ

MessageQ，顾名思义，基于队列的消息传递，可不是 MaggieQ 噢，哈哈。

MessageQ 有以下特点：

- 实现了处理期间变长消息的传递；
- 消息的传递都是通过操作消息队列来实现的；
- 每个消息队列可以有多个写者，但只能有一个读者；每个任务(task)可以对多个消息队列进行读写；
- 一个宿主在准备接收消息时，必须先创建消息队列，而在发送消息前，需要打开预定的接收消息队列；

MessageQ 组件常用在满足以下条件的场景中：

1. 在消息传递中有多个写者，但仅有一个读者；
2. 所需要传递的消息超过 32bit，且长度可变；读写者的缓冲区大小相同；
3. 处理期间需要频繁传递消息，在这种情况下，消息被依次放入队列，能保证不会丢消息；
4. 消息队列为空时，调用 MessageQ_get() 获取消息时会被阻塞，直到消息队列被写入消息；
5. 支持处理器间移动消息队列，在这种情况下，调用 MessageQ_open() 来定位队列位置，而消息传递部分代码不需要改动；

MessageQ 组件提供了以下几个 API：

1. 消息队列初始化：MessageQ_Params_init()
2. 消息队列创建/销毁：MessageQ_create()/MessageQ_delete()，create创建消息队列，并分配相应存储空间
3. 消息队列打开/关闭：MessageQ_open()/MessageQ_close()，open时会返回远程处理器上的 QueID 的地址。
4. 为消息队列分配堆内存：MessageQ_alloc()/MessageQ_free()
5. 为消息队列注册/注销堆内存：MessageQ_registerHeap()/MessageQ_unregisterHeap()
6. 向消息队列中放入/获取消息：MessageQ_put()/MessageQ_get()
7. 其他逻辑 API：

- 获取消息队列ID：MessageQ_getQueueId()
- 获取消息队列中消息数：MessageQ_count()
- 在消息队列中嵌入消息：MessageQ_setReplyQueue()
- 为消息队列解阻塞：MessageQ_unblock()
- 为调试消息队列加入Trace：MessageQ_setMsgTrace()

## 3.3、ListMP

ListMP 实现了多宿主双向循环链表，即该双向循环链表为多个处理器共同拥有，可以由多个处理器共同维护，共同使用。

ListMP 的实现区别于一般的双向循环链表，因此它不仅具有双向循环链表的特性外，还增添了其他的特性，比如以下几点：

- 实现了简单的多宿主协议，支持多个读写者（multi-reader、multi-writee）；
- 使用 Gate 作为内部保护机制，防止多个宿主处理器同时访问该链表；

ListMP 的实现并未加入通知机制，如果需要的话，可以在外部封装是引入 Notify 机制来实现；使用 ListMP 机制来管理的 buffers 都需要从共享内存区分配，包括从堆内存分配的 buffers 以及动态分配的内存。

ListMP 组件常用于满足一下条件的场景中：

1. 需要被多个宿主访问并且需要频繁传递消息或者数据；
2. 可用于无规则的消息传递，基于链表实现，因此读者可以遍历所有对象，并选出需要的对象进行处理；如果硬件支持快速队列，则无法完成队列遍历操作(WHY)；
3. 可以自定义消息优先级，同样是基于链表实现，读者可以随意的选择在链表头部还是链表的尾部来插入消息或者实现链表对象的位置调整，进而实现消息的优先级选择；如果硬件支持快速队列，则无法完成队列遍历操作(WHY)；
4. 无内置通知机制，可以灵活的外部通知机制来实现。譬如根据实际情况，选用Notify来实现，亦或是使用选用 MessageQ 则可以使用最少的中断资源实现性能优良的通知机制，缺点是需要额外的代码实现通知机制。

ListMP 组件提供了以下 API 接口：

1. ListMP 参数初始化：ListMP_Params_init()
2. ListMP 创建/销毁：ListMP_create()/ListMP_delete()
3. ListMP 打开/关闭：ListMP_open()/ListMP_close()
4. ListMP 相关链表操作：

- 判断链表空：ListMP_empty()
- 获取保护锁：ListMP_getGate()
- 获取链表头/表尾：ListMP_getHead()/ListMP_getTail()
- 链表插入操作：ListMP_insert()
- 获取链表上游元素/下游元素：ListMP_next()/ListMP_prev()
- 插入元素到链表头/尾：ListMP_putHead()/ListMP_putTail()
- 删除元素：ListMP_remove()

## 3.4、GateMP

GateMP 是针对于多处理器共享资源的一种保护机制，就如其名字一样，把共享资源比作房子，那么 GateMP 就是这个房子的门。GateMP 组件实现了开关门的机制，用于保护共享资源一次只被一个处理器读写。根据SOC硬件资源配置的不同，GateMP 的实现有所不同。对于硬件支持 Hardware Spinlock 的可以基于 H/W spinlock 来实现GateHwSpinlock；而对于没有该硬件资源的系统中，则使用软件方法 ([Peterson算法](http://zh.wikipedia.org/wiki/Peterson%E7%AE%97%E6%B3%95)) 来实现 GatePeterson。

GateMP 组件框架如下：

![img](http://img.blog.csdn.net/20130830234145296?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvY3J1c2hvbm1l/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

GateMP 组件对用户提供了以下API接口：

1. GateMP 初始化：GateMP_Params_init()；
2. GateMP 创建/删除：GateMP_create()/GateMP_delete()；
3. GateMP 打开/关闭：GateMP_open()/GateMP_close()；
4. 进入/离开 GateMP 保护：GateMP_enter()/GateMP_leave()；
5. 获取当前 GateMP 的保护类型：GateMP_getLocalProtect()/GateMP_getRemoteProtect()；

注：如果某个处理器在想使用被某个 GateMP 保护的共享资源，那么该处理器会被阻塞，直到该资源被释放（即 GateMP_leave()）。

## 3.5、HeapMP

HeapMP 主要包括 HeapBufMP 和 HeapMemMP，用于共享内存区的堆内存配置和管理。

HeapMP 具备以下几个特征：

- 支持多宿主，即无论是运行 HLOS 的主处理器还是运行 SYS/BIOS 的从处理器都可以配置和管理堆内存；
- 可以将共享内存区配置成缓冲池（buffer pools）；
- 可以从共享内存区分配和释放缓冲区；

### 3.5.1、HeapBufMP

HeapBufMP 为用户提供了固定大小的缓冲池管理接口；

HeapBufMP 组件为用户提供的API接口如下：

1. HeapBufMP 创建/删除：HeapBufMP_create()；HeapBufMP_delete()；
2. HeapBufMP 打开/关闭：HeapBufMP_open()；HeapBufMP_close()；
3. HeapBufMP 参数初始化：HeapBufMP_Params_init()；
4. HeapBufMP 分配/释放内存：HeapBufMP_alloc()；HeapBufMP_free()；
5. HeapBufMP 获取所有状态：HeapBufMP_getExtendedStats()；HeapBufMP_getStats()；

### 3.5.2、HeapMultiBufMP

在 SysLink 包中并没有找到相关 API，但 SysLink UserGuide 中有提到.

HepMultiBufMP 为用户提供了可配置大小的缓冲池管理接口。

### 3.5.3、HeapMemMP

HeapMemMp 为用户提供了基于堆的可变大小的内存管理机制。

HeapMemMp 组件为用户提供的接口如下：

1. HeapMemMP 参数初始化：HeapMemMP_Params_init()；
2. HeapMemMP 创建/删除：HeapMemMP_create()/HeapMemMP_delete()；
3. HeapMemMP 打开/关闭：HeapMemMP_open()/HeapMemMP_close()；
4. HeapMemMP 分配/释放内存：HeapMemMP_alloc()/HeapMemMP_free()；
5. HeapMemMP 获取内存状态：HeapMemMP_getExtendedStats()/HeamMemMP_getStats()；
6. HeapMemMP 恢复内存初始状态：HeapMemMP_restore()；

## 3.6、FrameQ

FrameQ 是专门为传递视频帧而设计出来的组件。FrameQ 的基本数据结构是可用于 queue/dequeue 数据的数据队列，封装了视频帧缓存指针、帧数据类型、帧宽、帧高、时间戳等信息。

对于FrameQ 模块具有以下特征：

- 支持多个读者，但写者唯一；
- 可以分配和释放 Frames；
- 可以对指向同一块内存区多次分配和初始化成新的帧 buffer；
- FrameQ 允许有多个队列，在多通道的运用中，视频帧会根据通道号被分配到相应的帧队列中；

FrameQ 中用于 buffer 管理的模块称为 FrameQBufMgr，该模块用于提供 buffer 管理接口和通知机制。

FrameQ 提供以下 API 接口：

1. FrameQ 组件初始化/销毁：FrameQ_setup()/FrameQ_destroy()；
2. 创建/删除 FrameQ 实例：FrameQ_create()/FrameQ_delete()；
3. 打开/关闭 FrameQ 实例：FrameQ_open()/FrameQ_close()；FrameQ_openByAddr()；
4. 为 FrameQ 实例分配/释放内存：FrameQ_alloc()/FrameQ_free()；FrameQ_allocv/FrameQ_freev()；
5. 插入/释放 FrameQ 中帧：FrameQ_put()/FrameQ_get()；FrameQ_putv()/FrameQ_getv()；
6. 复制给定的帧：FrameQ_dup()；
7. 注册/注销 FrameQ 通知：FrameQ_registerNotifier()/FrameQ_unregisterNotifier()；
8. 强制发送通知：FrameQ_sendNotify()
9. 获取 FrameQ 中有效帧数/已被释放的帧数：FrameQ_getNumFrames()/FrameQ_getNumFreeFrames()；                   FrameQ_getvNumFrames()/FrameQ_getvNumFreeFrames()
10. FrameQ 控制：FrameQ_control()
11. 获取 FrameQ 的头指针：FrameQ_getExtendedHeaderPtr()；
12. 获取帧 buffer/帧大小/帧数：FrameQ_getFrameBuffer()/FrameQ_getFrameBufSize()/FrameQ_getNumFrameBuffers()；
13. 获取空数据帧大小/位置：FrameQ_getFrameBufValidSize()/FrameQ_getFrameBufDataStartOffset()；
14. 设置空数据帧大小/位置：FrameQ_setFrameBufValidSize()/FrameQ_setFrameBufDataStartOffset()；
15. 获取 FrameQ 默认设置：FrameQ_getConfig()；

## 3.7、RingIO

[RingIO](http://processors.wiki.ti.com/index.php/RingIO_Users_Guide) 是基于数据流的环形缓冲 buffer ，而且针对于音视频数据的特性做了优化。

RingIO 支持一下特性：

- 仅支持一个读者和一个写者；
- 读写相对独立，可以在不同的进程或者处理器中同时进行读写操作；

RingIO 为用户提供了以下接口：

1. RingIO 参数初始化：RingIO_Params_init()；
2. 创建/删除 RingIO 对象：RingIO_create()/RingIO_delete()；
3. 打开/关闭 RingIO 对象：RingIO_open()/RingIO_close()；RingIO_openByAddr()；
4. 获取共享内存请求：RingIO_sharedMemReq()；
5. 注册/注销 RingIO 通知：RingIO_registerNotifier()/RingIO_unregisterNotifier()；
6. 强制发送 RingIO 通知：RingIO_sendNotify()；
7. 获取 RingIO 通知类型：RingIO_setNotifyType()；
8. 设置/获取水印标志/通知类型：RIngIO_setWaterMark()/RIngIO_getWaterMark()
9. 获取/释放 RingIO 数据：RingIO_acquire()/RingIO_release()；
10. 设置/获取 RingIO 属性：RingIO_setvAttribute()/RingIO_getvAttribute()；
11. 设置/获取 RingIO 固定大小的属性：RingIO_setAttribute()/RingIO_getAttribute()；
12. 刷新 RingIO 的 buffer：RingIO_flush()；
13. 获取有效/空 buffer 大小：RingIO_getValidSize()/RingIO_getEmptySize()；
14. 获取有效/空属性大小：RingIO_getValidAttrSize()/RingIO_getEmptyAttrSize()；
15. 获取用户需求 buffer 的大小/位置：RingIO_getAcquiredSize()/RingIO_getAcquiredOffset()；

# 4、公共组件（基础组件）

Utility Modules 包括 SharedRegion(IPC中属于类库ti.sdo.ipc.SharedRegion)、List、Trace、MultiProc、NameServer 等，这些模块是上层组件实现的基础。在 IPC 包中，该组件对应于类库 ti.sdo.utils.

## 4.1、SharedRegion（非常重要，SysLink模块最基础的模块）

### 4.1.1、SharedRegion总览

SharedRegion 顾名思义，是共享内存区的意思。SharedRegion 模块负责管理共享内存区。在一个有共享内存的多核架构中，普遍会遇到共享内存映射虚拟地址转换问题,如下图所示：

![img](http://img.blog.csdn.net/20130904165214343?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvY3J1c2hvbm1l/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

SharedRegion 有两种配置方式，即静态配置方法(对于 SYS/BIOS 侧可以通过 cfg 脚本配置，而对于 HLOS 则当从处理器被加载的时候会通过读取 SYS/BIOS 共享内存区配置信息来获取，请参考内核driver/dsp/syslink/notify_shmdriver/notify_shm_drv.c 中实现)和动态配置方法(通过 SharedRegion 模块提供的 API SharedRegion_setEntry() 来设置，但值得注意的是这个API只是把入口信息放入该处理器对应的共享内存查找表中，而其他处理器也需要在自己的系统中使用该API来加入该入口)。实际配置中需要指明共享内存区在各个处理器中映射的虚拟地址及堆栈设置等，如上图所示，对于 proc0 来说，SR0 映射出的虚拟地址为 0x80000000，而对于 Proc[1..3] 映射出的地址则是 0x90000000；SR0 中有部分预留区域且被配置成 HeapMemMP（见3.5.3节）；此外由上图还可以知道，SharedRegion 1 是 Proc1--Proc6 构成的子系统的内部共享内存，且配置成使用 HeapMemMP 来管理。

​       SharedRegion 模块由于其状态都存在处理器本地的内存中，因此其本身并不会占用共享内存区空间。所有的SharedRegion 模块 API 都是用 Gate 用于进程互斥操作。
       SharedRegion 模块会为系统中每个处理器创建一个共享内存查找表。在这个查找表中包含了所有处理器与共享内存区的关系及相关设置。如果某块共享内存区对于某处理器是不能访问，那么在表中会设置为空。
       在runtime时，共享内存查找表与共享内存区指针一起被用于快速的地址转换操作；

​       在共享内存查找表中最大入口数（即 SharedRegion 的个数）使用 ShareRegion.numEntries 静态配置。在系统runtime中可以使用静态配置或者动态配置增减入口数，但必须在更改后更新所有处理器的表。共享内存入口数越多耗费在地址转换上的时间越长，因此考虑到效率，尽可能设计少的入口数。
       SharedRegion 0 的意义比较特殊，在所有使用 IPC 组建的环境中都必须配置并且所有的处理器都有权限访问该共享区域，虽然应用程序也可以使用这部分内存，但不建议用户在不了解该区域详细的内存分布时使用，否则容易造成系统挂死。由 DM8168 的配置 DVRRDK_xx.xx.xx.xx\dvr_rdk\mcfw\src_bios6\cfg\ti816x\SYSLINK_common.cfg 可以看出该区域用于 MsgQ。

### 4.1.2、SharedRegion配置方式举例

一般来说配置一个 SharedRegion 需要设置以下几个：

- base - The base address 共享内存区的基地址，这个所谓的基地址实际上是映射后的虚拟地址，并非物理地址；
- len - The length 共享内存区的大小，对于同一片共享内存，其所有者的查找表中该项值应该是相同的；
- name - The name of the region 该共享内存区的名字；
- isValid - Whether the region is valid 对于该处理器而言，是否具有权限去访问该共享内存区；
- ownerProcId - The id of the processor which owns the region 管理该内存区的处理器 ID，该处理器具有创建 HeapMemMP 的权限，而其他处理器只有使用的权限；
- cacheEnable - Whether the region is cacheable 是否为该共享内存区创建 cache；
- cacheLineSize - The cache line size  cache 的大小；
- createHeap - Whether a heap is created for the region.是否使用 Heap（堆）管理该内存区域；

静态配置方法e.g.：DVRRDK_xx.xx.xx.xx\dvr_rdk\mcfw\src_bios6\cfg\ti816x\SYSLINK_common.cfg

```
/* Set Shared Region variables by picking up the information from Platform
 * memory map
 */
var sr0MemSection           = Program.cpu.memoryMap['SR0']; //此处值都是有config_xxx.bld文件读取的，下同
var sr1MemSection           = Program.cpu.memoryMap['SR1'];
var sr2MemSection           = Program.cpu.memoryMap['SR2_FRAME_BUFFER_MEM'];
var sr3MemSection           = Program.cpu.memoryMap['SR3_FRAME_BUFFER_EXTRA'];
/*
 *  Need to define the shared region. The IPC modules use this
 *  to make portable pointers. All processors need to add this
 *  call with their base address of the shared memory region.
 *  If the processor cannot access the memory, do not add it.

        This section is the SR0 section of syslink and is
        used for MsgQ's that are present on different processors.


        A8  - NON-CACHED
        M3  - NON-CACHED
        DSP - NON-CACHED
*/
SharedRegion.setEntryMeta( 0,
    {
      base:        sr0MemSection.base,
      len:         sr0MemSection.len,
      name:        sr0MemSection.name,
      isValid:     true,
      ownerProcId: srOwnerProcId,
      cacheEnable: false,
      cacheLineSize: 128,
      createHeap:  true 
    }
);
```

注：在 IPC 中所给的例子除了设置以上需要设置 SharedRegion.cacheLineSize、SharedRegion.numEnties、SharedRegion.translate 等，如果不知道入口地址，可以讲 isValid 设置成 false，在 runtime 时通过计算来得到，然后是中 SharedRegion_getEntry() 来设置。

e.g.

```
var SharedRegion = xdc.useModule('ti.sdo.ipc.SharedRegion');
SharedRegion.cacheLineSize = 32;//cache 行缓冲字节数，暂时还没明白这个设置于上面例子中 cacheLineSize: 128 有何区别，如何不指定则使用默认值；
SharedRegion.numEntries = 4;//总的共享内存区个数（入口数）；
SharedRegion.translate = true;//是否需要做地址转换，如果设置为 false，因为不需要做地址转换，则对总体性能有所提升；
```

 

动态配置方法e.g.：DVRRDK_xx.xx.xx.xx\dvr_rdk\mcfw\src_bios6\utils\src\utils_mem.c

```
SharedRegion_Entry srEntry;
Int                                   srStatus = SharedRegion_S_SUCCESS;
UInt32                           srId;
SharedRegion_entryInit(&srEntry);
SharedRegion_getEntry(srId[i], &srEntry);
 Vps_printf (" %d: MEM: Shared Region %d: Base = 0x%08x, Length = 0x%08x (%d MB) \n",\
                    Utils_getCurTimeInMsec(), srId[i],srEntry.base,srEntry.len, srEntry.len/(1024*1024));
if ((FALSE == srEntry.isValid)&&(0 != srEntry.len))
 {
            srEntry.isValid     = TRUE;
            do {
                srStatus = SharedRegion_setEntry(srId[i], &srEntry);


                if (srStatus != SharedRegion_S_SUCCESS) {
                    Vps_printf(" %d: MEM: ERROR: SharedRegion_setEntry (%d, 0x%08x) FAILED !!! "
                               " (status=%d) \n", Utils_getCurTimeInMsec(), srId[i], &srEntry, srStatus);
                    Task_sleep(1000);
                     }
                  } while (srStatus != SharedRegion_S_SUCCESS);
 }
 if (srEntry.len)
 {
        gUtils_heapMemHandle[i] = SharedRegion_getHeap(srId[i]);
        UTILS_assert(gUtils_heapMemHandle[i] != NULL);
        gUtils_memClearBuf[i] = FALSE;
}
```

 

 

注：通常来说动态创建入口的方式不常用，一般只是用来更改原有配置。另外，如果想完全重新配置一个共享内存，可以在每个处理器上调用 SharedRegion_clear() 来清除该共享内存的入口信息。

### 4.1.3、如何使用SharedRegion中的内存

SharedRegion 中的内存可以使用 Memory_alloc(IHeap_Handle heap, SizeT size, SizeT align, Ptr eb) 来动态分配。IHeap_Handle 获取方式如上例中 gUtils_heapMemHandle[i] = SharedRegion_getHeap(srId[i]);

### 4.1.4、相关API

- SharedRegion_clearEntry()
- ShareRegion_entryInit()
- SharedRegion_getCacheLineSize()
- SharedRegion_getEntry()、SharedRegion_setEntry()
- SharedRegion_getHeap()
- SharedRegion_getId
- SharedRegion_getIdByName()
- SharedRegion_getNumRegions()
- SharedRegion_getPtr()
- SharedRegion_getSRPtr()
- SharegRegion_isCacheEnabled()
- SharedRegion_translateEnabled()
- SharedRegion_inValidSRPtr()

## 4.2、List

List 模块封装了双向循环链表的操作 API，SYS/BIOS 参见 “ti.sdo.utils.List” 实现，HLOS 侧见 “DVRRDK_xx.xx.xx.xx\ti_tools\syslink\syslink_x_xx_xx_xx\packages\ti\syslink\utils\hlos\List.c” 中实现。提供的API 也就是通常用于操作链表的一些 api 接口，这里就不多介绍了。

## 4.3、Trace

用于打印相关调试是使用,有点像 CCS 下的探针，在 SysLink 中根据所带的参数分了7种不同的探针，不多介绍，具体实现参考“DVRRDK_xx.xx.xx.xx\ti_tools\syslink\syslink_x_xx_xx_xx\packages\ti\syslink\utils\common\Trace.c”

在调试 TI 的各种开发包（如 HDVPSS  ISS 等）时非常方便，加载 syslink.ko 时需要附加参数 TRACE，如：

```
insmod syslink.ko TRACE=1
insmod syslink.ko TRACE=1 TRACEFAILURE=1 TRACECLASS=3
insmod syslink.ko TRACE=1 TRACEFAILURE=1 TRACEENTER=1 TRACECLASS=3
```

 

## 4.4、MultiProc

MultiProc 模块用于多核处理器中唯一的标识处理器（多处理器 ID 管理，如果你看了 fwload 的程序，肯定注意到其中调用 MultiProc_getId 获取 ProcId 用于 ProcMgr_open 的参数），在使用该模块前，需要在 IPC 环境中使用*.cfg 脚本来配置多处理器环境。

如：在 DVRRDK_xx.xx.xx.xx\dvr_rdk\mcfw\src_bios6\cfg\ti816x\SYSLINK_c6xdsp.cfg 中

```
/*******************************************************************************
* SysLink  SysMgr initializations - IPC is a part of sysLink
*
******************************************************************************/
var MultiProc              = xdc.useModule('ti.sdo.utils.MultiProc');
var Notify                 = xdc.useModule('ti.sdo.ipc.Notify');

/* The DSP is processor id 0 and there are 3 other cores */
MultiProc.setConfig("DSP", ["DSP", "VIDEO-M3", "VPSS-M3", "HOST"]);
```

 

 

除了上述的静态设置方法外，还可以主处理器起来后（此时从处理器均未 startup，不能强制配置其 Proc_ID）通过GPIO、Nand、EEPROM等手段动态获取，使用 MultiProc_setLocalId() API 设置，但 cfg 文件配置还是需要的，只不过此时相应处理器名称设置为 NULL。

MultiProc 模块提供的 API 主要有：

1. 获取/设置多核系统的基 ID：MultiProc_getBaseIdOfCluster()/MultiProc_setBaseIdOfCluster()；
2. 通过处理器名字检索其 ID：MultiProc_getId()；
3. 通过处理器 ID 检索其名字：MultiProc_getName()；
4. 查询多核系统的处理器数：MultiProc_getNumProcessors()/MultiProc_getNumProcsInCluster()；
5. 返回当前处理器的 ID：MultiProc_self()；
6. 设置处理器 ID：MultiProc_setLocalId()；

## 4.5、NameServer

NameServer 直译为名称服务器，大致看了下实现过程，有点像简单的网络中的 DNS（Domain Name Server），即可以根据名字查找某对象（DNS中可以根据网址查找到对应网址的IP）。

NameServer 的实现原理：基于链表的结构，并且可以根据设置决定是否对 value 域进行 [Hash](http://baike.baidu.com/link?url=TyEgAE_RkabUTTjTpcRDAluJh0eFT3OU-ASb3SlflhgOYIxJKfjD3xGyhsAkKngW) 编码（查了下资料，这个可能是从 [java ](http://baike.baidu.com/link?url=TyEgAE_RkabUTTjTpcRDAluJh0eFT3OU-ASb3SlflhgOYIxJKfjD3xGyhsAkKngW)中吸其精华而改造来的），其基本数据结构如下：

```
typedef struct NameServer_TableEntry_tag {
    List_Elem                 elem;
    /* List element */
    UInt32                    hash;
    /* Hash value */
    String                    name;
    /* Name portion of the name/value pair. */
    UInt                      len;
    /* Length of the value field. */
    Ptr                       value;
    /* Value portion of the name/value entry. */
    Bool                      collide;
    /* Does the hash collides? */
    struct NameServer_TableEntry_tag * next;
    /* Pointer to the next entry, used incase of collision only */
} NameServer_TableEntry;
```

 

 

NameServer 提供了以下 API：

- NameServer_Params_init()
- NameServer_create()/NameServer_delete()
- NameServer_getHandle()
- NameServer_add()
- NameServer_addUInt32()
- NameServer_get()/NameServer_getUInt32
- NameServer_getLocal()/NameServer_getLocalUInt32()
- NameServer_removeEntry()/NameServer_remove()

在 SysLink 中很多组件都用到了 NameServer，如 FrameQ、HeapMemMP、GateMP、ListMP、MessageQ。RingIO 等等。