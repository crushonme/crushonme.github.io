---
layout: post
title: 使用 WNetUseConnection 连接网络资源时，返回报错 1219
categories: Win32
description: 在使用 WNetUseConnection 连接网络资源时，偶发性返回报错 1219.
keywords: WNetUseConnection, SMB
---

问题现象：在使用 [WNetUseConnection](https://msdn.microsoft.com/en-us/library/windows/desktop/aa385482(v=vs.85).aspx) 连接网络资源时，偶发性返回报错 1219。当网络资源是 Linux Samba 配置的共享资源时，比较容易复现该问题。

先了解下 1219 报错的含义，即同一个用户使用多个链接访问服务器或者共享资源且使用的用户名不同，建议是断开前面的所有链接，并重新创建。是不是很绕？同一个用户却使用了不同的用户名。

| Error Code | Symbolic Name | Error Description                 | Header                                                       |            |
| ---------- | ------------- | --------------------------------- | ------------------------------------------------------------ | ---------- |
| Hex        | Dec           |                                   |                                                              |            |
| 0x4c3      | 1219          | ERROR_SESSION_CREDENTIAL_CONFLICT | Multiple connections to a server or shared resource by the same user, using more than one user name, are not allowed. Disconnect all previous connections to the server or shared resource and try again. | winerror.h |

遇到这种问题，必然的先去检查代码是否传入了不同的Credential。如果生产环境中无法修改代码，则通常可以抓取问题复现时的网络包，然后找到出问题点的报错及对应的认证过程。也可以使用 [TTD overview](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/time-travel-debugging-overview) 抓取 Trace 后通过对比实际传参确认。

以下为复现问题时的抓包，设置正确的过滤条件后，可以很明显的看到登录时使用的 User 一个为本地账户 root，一个为域账户 xxPC\root。

![SMB-Return-1219](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/SMB-return-1219.png)

从网络包能看到传入的用户名不同，那么对于这个问题的解决，则可以通过传给 [WNetUseConnection](https://msdn.microsoft.com/en-us/library/windows/desktop/aa385482(v=vs.85).aspx) 明确的用户名，如果是域用户，则带上域名；如果是本机账户则表述为 ".\Username" 即可规避该问题。但当我们需要两个不同的 Credential 去访问同一个共享资源时，又会得到 1219 的返回值。对于这个问题，微软官方文章有提到，[Error message when you use user credentials to connect to a network share from a Windows-based computer: "The network folder specified is currently mapped using a different user name and password"](https://support.microsoft.com/en-us/help/938120/error-message-when-you-use-user-credentials-to-connect-to-a-network-sh) ，即这种行为是 by designed。规避办法有两种：

- 使用 IP 访问共享资源；
- 为该共享资源创建一个 DNS 别名，然后用别名去访问该共享资源；

在以上两种场景下，系统的表现和访问两个不同的共享资源是相同的。但实际测试发现使用 IP 的方式也无法规避该问题。

![NETUSE-WITH-IP](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/netuse-with-IP.png)

但这种场景下为什么会被认为是同一个用户呢？通过 [WNetUseConnection](https://msdn.microsoft.com/en-us/library/windows/desktop/aa385482(v=vs.85).aspx) 传入的用户名为何会被解析成两种不同的用户名？



