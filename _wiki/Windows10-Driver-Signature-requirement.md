---
layout: wiki
title: Windows 10 对内核驱动签名的要求
categories: Windows Driver
description: Windows 10 对内核驱动签名的要求。
keywords: Windows 10, Driver
---

Windows 10 1607版本开始，对于新的内核驱动要求需要提交 Dev Portal 做签名。

交叉签名的内核驱动在以下场景中依然可以正常运行：

- 系统是有早期版本 Windows 10 升级而来；
- 在BIOS中未开启 Secure Boot
- 使用 2015 年 7 月 29 日前颁发的可信任证书机构颁发的终端实体证书签名；

综合而言就是开启了 Secure Boot 的新安装 Windows 10 1607 以后版本系统，内核驱动必须被微软或者可信任证书机构颁发的终端实体证书签名。

# FAQ

**对于已经存在的内核驱动如何处理？是否需要重新签名？**

对于已经存在的内核驱动不需要做任何处理。为了向前兼容，Windows 10 1607 以后的版本依然支持使用 2015 年 7 月 29 日前颁发的可信任证书机构颁发的终端实体证书签名的内核驱动。



**对于旧版本的 Windows 系统如何处理？**

当前对于内核驱动签名要求仅适用于版本号高于 1607 的 Windows 10 系统。但需要值得注意的是 Windows Hardware Developer Center Dashboard  Portal 对于新提交的需求均要求使用 EV 代码签名证书，无论您驱动支持哪些系统。



**对于开发和测试阶段的驱动如何处理？**

该部分内容请参考 MSDN 中的文章 [Signing Drivers during Development and Test](https://msdn.microsoft.com/en-us/windows/hardware/drivers/install/signing-drivers-during-development-and-test) 。另外，对于未开启 Secure Boot 的场景中，使用已经存在的交叉签名证书签名依然是有效的。



**如何正确的签名内核驱动以便其可以在 Vista，Windows 7，Windows 8，Windows 8.1，Windows 10 上均正常运行？**

对于Windows 10，我们需要通过 HLK 测试；对于 Windows 8.1 以前的版本，则需要通过 HCK 测试。然后使用 Windows 10 HLK 合并两个测试日志并和您的驱动一起提交至 [Windows Hardware Developer Center Dashboard portal](https://developer.microsoft.com/en-us/windows/hardware/dashboard-sign-in)。



**如何获取证书？**

请参考 MSDN 文章 [获取代码签名证书](https://docs.microsoft.com/zh-cn/windows-hardware/drivers/dashboard/get-a-code-signing-certificate)。