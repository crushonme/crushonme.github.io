---
layout: post
title: Azure Sphere 预览版开箱测试
categories: IoT
description: 本文介绍如何使用 Azure Sphere。
keywords: Azure Sphere,Azure,Sphere,IoT,Microsoft IoT，Secure IoT，MT6320
---

Azure Sphere 是一种用于创建高度安全、连接的微控制器 (MCU) 设备的解决方案，让人可以安心无忧并大胆地重新构想业务，创造未来。关于 Azure Sphere 详细介绍可以参考官方文章 [Azure Sphere | Microsoft Azure](https://azure.microsoft.com/zh-cn/services/azure-sphere/) 。 Azure Sphere 解决方案主要包含三个组件：

- Azure Sphere 认证的 MCU
- Azure Sphere OS
- Azure Sphere 安全服务

第一款 Azure Sphere MCU 出自于 Microsoft 与 MediaTek 合作的 MT6320AN，其搭载 Arm Cortex-A7 应用处理器和双核带有 FPU 的 Cortex-M4，运行频率为 500MHz，片上 I/O 资源主要包含5 个 UART/I2C/SPI、2 个 12S、8 个 ADC、最多 12 个 PWM 计数器以及高达最多 72 个 GPIO。关于其详细介绍可以看 MediaTek 的详细介绍 [MT6320AN](https://www.mediatek.cn/products/azureSphere/mt3620)

Azure Sphere OS 是基于 Yocto 定制的 Linux 系统，版本号为 4.9，在文档 [开始使用 Azure Sphere](https://azure.microsoft.com/zh-cn/services/azure-sphere/get-started/) 中的第三方披露部分提供了源码。![Azure Sphere Third Party Source](\images\blog\AzureSphereThirdPartySource.jpg)

# 准备工作

拿到 Azure Sphere 预览版开发板做测试前，我们需要完成以下准备工作：

- [安装 Azure Sphere SDK](https://docs.microsoft.com/en-us/azure-sphere/install/install)；
  - Windows 10 1607 以上版本 
  - VS 2017 15.7 以上版本；
  - 安装USB 转串口驱动，在 PC 接上 Azure Sphere 开发板后在设备管理器查看设备，如果发现未安装驱动的设备，选择自动更新即可；
  - 安装  [Azure Sphere SDK 预览版](https://aka.ms/AzureSphereSDKDownload)，包含 Azure Sphere 开发命令行工具集、Azure Sphere 应用库、Visual Studio Azure Sphere 插件；

- [创建 Azure 帐号](https://docs.microsoft.com/en-us/azure-sphere/install/azure-directory-account)，用于后续 Azure Sphere 连接 Azure IoT 服务；

- [声明 Azure Sphere 开发板](https://docs.microsoft.com/en-us/azure-sphere/install/claim-device)，需要注意的是申明在设备的声明周期内只能做一次，一旦声明后设备将永久的与对应的 Azure Sphere 租户绑定，且无法解绑；在此过程中如果遇到问题，可以参考官方文章排查 [Troubleshooting](https://docs.microsoft.com/en-us/azure-sphere/app-development/troubleshooting) 或者在 github 中创建 [azure sphere issues](https://github.com/MicrosoftDocs/azure-sphere-issues)

  - 以管理员权限运行 Azure Sphere 命令行提示窗口；

  - 登录 Azure Sphere

    ```azsphere login```
  - 创建 Azure Sphere 租户，通常建议一个公司或者组织只创建一个 Azure Sphere 租户；
    ```azsphere tenant create --name <tenant name>```
    如果当前账户下已经存在一个 Azure Sphere 租户并且再创建一个，则需要使用 force 参数：
    ```azsphere tenant create --force --name <tenant name>```
  - 声明设备，注意如果当前开发板系统版本不是最新系统，则会报错，此时请升级至最新版本：
    ```azsphere device claim```

- 配置 Wi-Fi ；

  - 使用 USB 连接 Azure Sphere 开发板并且以管理员权限运行 Azure Sphere 命令行提示窗口；

  - 添加 Wi-Fi 配置，当前 Azure Sphere 不支持 WEP 加密算法：当前不支持 802.11a；

    ```azsphere device wifi add --ssid <SsidName> --key <Password>```

  - 查看 Wi-Fi 连接状态：

    ```azsphere device wifi show-status```

  - 设置好 Wi-Fi 连接并连接到互联网后，会检查系统更新，以后每隔24小时或者在重启后检查系统更新；在系统更新期间不能中断设备；可以使用 show-ota-status 命令检查更新状态：

    ```azsphere device show-ota-status```

- 配置 Azure Sphere 为调试状态：默认情况下 Azure Sphere 设备处于锁定状态，即不允许开发中的应用从 PC  端加载并且也不允许应用调试；

  - 使用 USB 连接 Azure Sphere 开发板并且以管理员权限运行 Azure Sphere 命令行提示窗口，输入以下命令：

    ```azspere device prep-debug```


# Azure Sphere 应用开发注意事项

对于 Azure Sphere 的应用开发当前有以下限制：

- Azure Sphere 开发仅支持 C 语言，**不支持 C++**；
- Azure Sphere 同一时刻仅能运行一个用户应用；用户应用在系统启动或者异常退出时，系统会自动启动用户应用程序；用户应用仅能在系统发出信号时退出；
- Azure Sphere 用户应用程序最大可用 Flash 大小为 512KB，A7 侧最大运行时 RAM 大小为 256KB；
- 用户应用程序如果需要操作硬件资源必须在 [Application manifest](https://docs.microsoft.com/en-us/azure-sphere/app-development/app-manifest) 中声明，否则无法正常使用硬件资源，炳辉在 errno 中得到 Access Denied 报错；

# Azure Sphere 库

Azure Sphere SDK 为用户提供了以下静态库：

- 定制的标准 C 语言库，其中不支持文件 I/O 、进程间通信、Shell 操作；
- Curl 静态库，支持通过 HTTP 传输数据，其中官方提供了使用样例 [如何通过 curl 连接 Web Services](https://docs.microsoft.com/en-us/azure-sphere/app-development/curl)；
- 自定义应用静态库，主要提供了以下功能接口：
  - 通用 I/O
  - 日志
  - 网络
  - 存储
  - 串口
  - Wi-Fi 配置

SDK 默认安装在 C:\Program Files(x86)\Microsoft Azure Sphere SDK ，对应的头文件则位于 C:\Program Files (x86)\Microsoft Azure Sphere SDK\SysRoot\usr\include

# 开始第一个 Azure Sphere 应用

安装完 VS Azure Sphere 插件 后，在 VS 的新建项目中会添加 Visual C++ --->Cross Platform ---> Azure Sphere 模版，如下图：

![VS Azure Sphere Template](https://docs.microsoft.com/en-us/azure-sphere/media/blinktemplatescreen.png)

可以看到 VS 插件中存在五个模版项目，分别如下：

- Blink Sample for MT3620 RDB ，该项会创建一个控制 LED 等闪烁的简单工程；
- UART Sample for MT3620 RDB，该项会创建一个 UART 通信的简单工程；
- Azure IoT Hub Sample for MT3620 RDB，该项会创建一个连接 Azure IoT Hub 的示例工程，其中包括给 IoT Hub 发送消息，接收 IoT 传输的数据或者通过 Azure IoT Hub 直接调用 Azure Sphere 中的方法（实际并非直接调用函数，而是通过解析数据的方式实现）；
- Blank Application for MT3620 RDB，该项目会创建一个 Hello World 工程；
- Blank Static Library，该项会创建一个静态库工程，当前实际并未添加任何样例代码；

## Hello World

下述代码是使用模版中的 Blank Application 创建的 Hello World 代码，其代码非常简单，仅需要 C 语言基础即可；

```c
#include <stdbool.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

// applibs_versions.h defines the API struct versions to use for applibs APIs.
#include "applibs_versions.h"
#include <applibs/log.h>

#include "mt3620_rdb.h"

// This C application for the MT3620 Reference Development Board (Azure Sphere)
// outputs a string every second to Visual Studio's Device Output window
//
// It uses the API for the following Azure Sphere application libraries:
// - log (messages shown in Visual Studio's Device Output window during debugging)

static volatile sig_atomic_t terminationRequested = false;

/// <summary>
///     Signal handler for termination requests. This handler must be async-signal-safe.
/// </summary>
static void TerminationHandler(int signalNumber)
{
    // Don't use Log_Debug here, as it is not guaranteed to be async signal safe
    terminationRequested = true;
}

/// <summary>
///     Main entry point for this sample.
/// </summary>
int main(int argc, char *argv[])
{
    Log_Debug("Application starting\n");

    // Register a SIGTERM handler for termination requests
    struct sigaction action;
    memset(&action, 0, sizeof(struct sigaction));
    action.sa_handler = TerminationHandler;
    sigaction(SIGTERM, &action, NULL);

    // Main loop
    const struct timespec sleepTime = {1, 0};
    while (!terminationRequested) {
        Log_Debug("Hello world\n");
        nanosleep(&sleepTime, NULL);
    }

    Log_Debug("Application exiting\n");
    return 0;
}
```