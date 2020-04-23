---
layout: wiki
title: How To Capture Fiddler Log
categories: Debug
description: 本文描述各种场景下抓取 Fiddler 的方法
keywords: Fiddler,iOS,Android
---
# 如何使用 Fiddler 收集 HTTP/HTTPS 流量

## Windows 平台收集 Fiddler 日志步骤

- 下载并安装 Fiddler: [Fiddler下载地址](http://www.telerik.com/download/fiddler)；

- 关闭所有浏览器及会发起 HTTP/HTTPS 请求的应用；

  > 尽可能减少其他应用的干扰

- 在菜单栏选择 Tools -> Clean Wininet Cache 清空 Wininet 组件缓存；

- 如果只有 HTTP 请求，则跳过这一步；如果是 HTTPS 请求，请在菜单栏选择 Tools -> Fiddler Options -> Https -> 勾选 "Capture HTTPS CONNECTs"; 在此设置过程中的弹窗，一律选择是(Y)

  ![Fiddler-HTTPS](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/Fiddler-HTTPS.png)
  ![Fiddler-Root-Certificate](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/Fiddler-Root-Certificate.png)
  ![Fiddler-TrustCert](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/Fiddler-TrustCert.png)

  > 在设置过程中会要求安装 Fiddler 的证书，此为正常现象。 Fiddler 抓取 HTTPS 时需要使用自己的证书重新加密请求并返回给浏览器。

- 确保 Fiddler 处于 Capturing 状态；

  ![Fiddler-Capturing](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/Fiddler-Capturing.png)

- 开启相关应用 （如 IE/Edge），重现问题；

- 当问题重现后，点击菜单栏中的 File -> Save -> All Sessions 保存为 .saz 文件。

  ![Fiddler-Save](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/Fiddler-Save.png)

## 收集手机端 Fiddler 步骤

### iOS

- 在 PC 端下载并安装 Fiddler: [Fiddler下载地址](http://www.telerik.com/download/fiddler)；

- 在菜单栏选择 Tools -> Fiddler Options -> Https -> 勾选 "Capture HTTPS CONNECTs"; 在此设置过程中的弹窗，一律选择是(Y)

  ![Fiddler-HTTPS](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/Fiddler-HTTPS.png)
  ![Fiddler-Root-Certificate](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/Fiddler-Root-Certificate.png)
  ![Fiddler-TrustCert](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/Fiddler-TrustCert.png)
  > 在设置过程中会要求安装 Fiddler 的证书，此为正常现象。 Fiddler 抓取 HTTPS 时需要使用自己的证书重新加密请求并返回给浏览器。

- 在菜单栏选择 Connections -> 勾选 "Allow remote computers to connect";

  ![Fiddler-Allow-Remote](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/Fiddler-Allow-Remote.png)

- 将 iPhone 连接到 PC 机同一个局域网中。依次打开 设置 -> WiFi -> WiFi 名后的感叹号 -> 配置代理 -> 选择手动 -> 服务器名设置为 PC 机的 IP 地址 -> 端口设置为 8888;

  ![Fiddler-iOS-Proxy](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/Fiddler-iOS-Proxy.jpg)
  ![Fiddler-iOS-Proxy-Settings](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/Fiddler-iOS-Proxy-Settings.jpg)
  > 端口设置默认为 8888， 如果在 Fiddler 设置中设置为其他端口，此处也需要修改为对应端口。

- 确保 Fiddler 处于 Capturing 状态；

  ![Fiddler-Capturing](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/Fiddler-Capturing.png)
- 使用目标手机中的 Safari 浏览器访 [http:/ipv4.fiddler:8888](http:/ipv4.fiddler:8888), 点击 "FiddlerRoot certificate" 下载证书描述文件；此时会弹窗提醒 "此网站正尝试下载一个配置描述文件。您要允许吗？"，选择 "允许"

  ![Fiddler-iOS-Access-Certificate](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/Fiddler-iOS-Access-Certificate.jpg)
  ![Fiddler-iOS-Download-Certificate](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/Fiddler-iOS-Download-Certificate.jpg)
- 在目标手机打开设置，会看到 "已下载描述文件"，点击后选择 "安装"， 此时会弹出警告窗口，选择 "安装"；

  ![Fiddler-iOS-AccessCertificate-In-Settings](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/Fiddler-iOS-AccessCertificate-In-Settings.jpg)
  ![Fiddler-iOS-Add-Certificate-Install](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/Fiddler-iOS-Add-Certificate-Install.jpg)
  ![Fiddler-iOS-Add-Certificate](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/Fiddler-iOS-Add-Certificate.jpg)

- 关闭 PC 和手机中所有浏览器及会发起 HTTP/HTTPS 请求的应用；在 Fiddler 菜单栏选择 "Edit" -> "Remove" -> "All Sessions"；

- 使用手机开启相关应用复现问题；

- 当问题重现后，点击菜单栏中的 File -> Save -> All Sessions 保存为 .saz 文件；

  ![Fiddler-Save](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/Fiddler-Save.png)
- 保存完成后，将手机端的代理设置恢复为关闭，并在 设置 -> 通用 -> 描述文件与设备管理 -> 移除名为 "DO_NOT_TRUST_FiddlerRoot" 的描述文件；

### Android

- 在 PC 端下载并安装 Fiddler: [Fiddler下载地址](http://www.telerik.com/download/fiddler)；

- 在菜单栏选择 Tools -> Fiddler Options -> Https -> 勾选 "Capture HTTPS CONNECTs"; 在此设置过程中的弹窗，一律选择是(Y)

  ![Fiddler-HTTPS](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/Fiddler-HTTPS.png)
  ![Fiddler-Root-Certificate](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/Fiddler-Root-Certificate.png)
  ![Fiddler-TrustCert](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/Fiddler-TrustCert.png)
  > 在设置过程中会要求安装 Fiddler 的证书，此为正常现象。 Fiddler 抓取 HTTPS 时需要使用自己的证书重新加密请求并返回给浏览器。

- 在菜单栏选择 Connections -> 勾选 "Allow remote computers to connect";

  ![Fiddler-Allow-Remote](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/Fiddler-Allow-Remote.png)
- 将 Android 连接到 PC 机同一个局域网中。依次打开 设置 -> WiFi -> WiFi 名后的感叹号 -> 配置代理 -> 选择手动 -> 服务器名设置为 PC 机的 IP 地址 -> 端口设置为 8888;
  > 端口设置默认为 8888， 如果在 Fiddler 设置中设置为其他端口，此处也需要修改为对应端口。

- 确保 Fiddler 处于 Capturing 状态；

  ![Fiddler-Capturing](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/Fiddler-Capturing.png)
- 使用目标手机中的浏览器访 [http:/ipv4.fiddler:8888](http:/ipv4.fiddler:8888), 点击 "FiddlerRoot certificate" 下载证书描述文件；在下载中选中 FiddlerRoot.crt 文件并设置证书名称，点击 OK 安装。

- 关闭 PC 和手机中所有浏览器及会发起 HTTP/HTTPS 请求的应用；在 Fiddler 菜单栏选择 "Edit" -> "Remove" -> "All Sessions"；

- 使用手机开启相关应用复现问题；

- 当问题重现后，点击菜单栏中的 File -> Save -> All Sessions 保存为 .saz 文件；

  ![Fiddler-Save](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/Fiddler-Save.png)
- 保存完成后，将手机端的代理设置恢复为关闭，并在 设置 -> 安全与位置 -> 高级设置 -> 加密与凭据 -> 信任的凭据 -> 用户凭据 -> 移除名为 "DO_NOT_TRUST_FiddlerRoot" 的证书；
