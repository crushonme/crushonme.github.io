---
layout: wiki
title: Browser Log Collection
categories: Browser
description: 浏览器相关调试和排障技巧汇总
keywords: IE11, Web Browser
---

# Browser Log Collection

## How To Disable LCIE

- Save below content to DisableLCIE.reg and then merge the registry script

  ```REG
  Windows Registry Editor Version 5.00

  [HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Microsoft\Internet Explorer\Main]
  "TabProcGrowth"="0"

  [HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Internet Explorer\Main]
  "TabProcGrowth"="0"

  [HKEY_LOCAL_MACHINE\SOFTWARE\Wow6432Node\Microsoft\Internet Explorer\Main]
  "TabProcGrowth"="0"
  ```

## How To Enable LCIE After Disable It

- Save below content to EnableLCIE.reg and then merge the registry script

  ```REG
  Windows Registry Editor Version 5.00

  [HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Microsoft\Internet Explorer\Main]
  "TabProcGrowth"=-

  [HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Internet Explorer\Main]
  "TabProcGrowth"=-

  [HKEY_LOCAL_MACHINE\SOFTWARE\Wow6432Node\Microsoft\Internet Explorer\Main]
  "TabProcGrowth"=-
  ```

## Collect IE settings

- Download IEDigest from [here](https://aka.ms/iedigest)

- Run IEDigest and Click "Create report"; And then you will get a report on your desktop named with IEDigest;

  ![IEDigest](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IEDigest.png)

## 收集 IE 设置

- 下载 [IEDigest](https://aka.ms/iedigest)

- 运行 IEDigest 并点击 "Create report"，会在您桌面上生成名为 IEDigest 的文件夹。
  ![IEDigest](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IEDigest.png)
