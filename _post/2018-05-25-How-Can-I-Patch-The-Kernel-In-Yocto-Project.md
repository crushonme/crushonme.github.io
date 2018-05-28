---
layout: post
title: 如何在 Yocoto Project 中给内核打补丁
categories: Yocoto
description: 介绍如何在 Yocoto Project 中给内核打补丁。
keywords: Yocoto, Kernel, Linux
---

﻿Yocto Project为我们提供了简单高效的嵌入式Linux基础镜像包管理系统，它默认采用分层结构来组织所有的软件包。而Linux Kernel作为其基础包之一，学会了如何对kernel打patch，那么就可以举一反三的修改自己的定制镜像。下面将分步介绍在Yocto Project中如何向linux内核源代码打patch。其中一个原则是不修改Yocto目前已有的层。因此我们需要创建一个层来实现对Linux Kernel打patch的工作，这样即使Yocto Linux Kernel在以后的版本中出现变更也不会影响到我们自己创建的层。

1、生成linux patch文件待用。作为例子我们向linux内核的init/calibrate.c文件中添加开机启动打印信息，具体patch文件如下：
```
diff --git a/init/calibrate.c b/init/calibrate.c
index a4f57ff..af23131 100755
--- a/init/calibrate.c
+++ b/init/calibrate.c
@@ -259,6 +259,9 @@ void __cpuinit calibrate_delay(void)
 #else
        if (preset_lpj) {
 #endif
+       printk("*************************************\n");
+       printk("*        HELLO YOCTO PROJECT        *\n");
+       printk("*************************************\n");
                lpj = preset_lpj;
                if (!printed)
                        pr_info("Calibrating delay loop (skipped) "

```
该patch名称为test.patch。

2、在poky同级目录下创建一个新目录meta-customer，并且在该目录下生成conf, recipes-kernel/linux/linux-customer目录结构；
步骤如下：
```bash
MACHINE=<machine name> source setup-environment <build-dir>
cd $SOURCE [*]
yocto-layer create customer [*]
mkdir -p recipes-kernel/linux/linux-customer
```
注：
* $SOURCE 表示poky所在的目录
* 该命令会在meta-customer下创建conf文件夹、默认的MIT开元协议及README。

3、在meta-customer/recipes-kernel/linux/目录下生成linux-customer_3.10.bbappend（该bbappend文件的前缀必须与所归属的bb文件名完全相同）文件，该文件用于通知bitbake有新的内容要加载到linux-customer编译过程中，具体linux-customer_3.10.bbappend文件内容如下：
```
#FILESEXTRAPATHS_prepend定义搜索SRC_URI的首选路径

FILESEXTRAPATHS_prepend := "${THISDIR}/${PN}:"

LICENSE = "MIT"
LIC_FILES_CHKSUM = "file://COPYING.MIT;md5=838c366f69b72c5df05c96dff79b35f2"
SRC_URI += "file://test.patch"
```
[FILESEXTRAPATHS 详细解释](http://www.yoctoproject.org/docs/2.0.1/ref-manual/ref-manual.html#var-FILESEXTRAPATHS)
4、将生成的.patch文件放在meta-customer/recipes-kernel/linux/linux-customer/目录下；

到此，新建的层已经完毕。该层的具体目录结构如下：
```
meta-customer/
├── conf
│   └── layer.conf
├── COPYING.MIT
├── README
└── recipes-kernel
    └── linux
        ├── linux-customer
        │   └── test.patch
        └── linux-customer_3.14.52.bbappend

```

5、使能新加入的层。修改base/conf/bblayer.conf文件，将新加入的层添加到bblayer.conf文件中，即：

```
BBLAYERS += " ${BSPDIR}/sources/meta-customer"
```
6、重新编译打patch的源代码包。
```
    # bitbake -c cleansstate linux-customer

    # bitbake -k linux-customer
```

8、验证打patch后的内核。

    # runqemu qemux86
    
    # dmesg | less

参考信息：
[i.MX Yocto Project: How can I patch the kernel?](https://community.freescale.com/docs/DOC-95252)
[i.MX Yocto Project: How can I (quickly) modify the kernel and test it?](https://community.freescale.com/docs/DOC-95003)
[Yocto Project Linux Kernel Development Manual](http://www.yoctoproject.org/docs/2.0.1/kernel-dev/kernel-dev.html)
[Yocto Project Development Manual](http://www.yoctoproject.org/docs/2.0.1/dev-manual/dev-manual.html)
[Yocto Project Board Support Package (BSP) Developer's Guide](http://www.yoctoproject.org/docs/2.0.1/bsp-guide/bsp-guide.html)