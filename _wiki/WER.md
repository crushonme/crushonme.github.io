---
layout: wiki
title: WER DUMP Collections
categories: Debug
description: 如何收集 WER DUMP
keywords: WER,Windows Error Reporting
---
# WER DUMP Collections

## Collect WER Dump with Registry Script

- Copy below content to notepad and save as WER.reg;

  ```REG
  Windows Registry Editor Version 5.00

  [HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\Windows Error Reporting\LocalDumps\iexplore.exe]
  "DumpFolder"="c:\\WERDumps"
  "DumpType"=dword:00000002
  "DumpCount"=dword:00000003

  [HKEY_LOCAL_MACHINE\Software\Microsoft\Windows\Windows Error Reporting]
  "DontShowUI"=dword:00000001

  [HKEY_LOCAL_MACHINE\SOFTWARE\Wow6432Node\Microsoft\Windows\Windows Error Reporting\LocalDumps\iexplore.exe]
  "DumpFolder"="c:\\WERDumps"
  "DumpType"=dword:00000002
  "DumpCount"=dword:00000003

  [HKEY_LOCAL_MACHINE\Software\Wow6432Node\Microsoft\Windows\Windows Error Reporting]
  "DontShowUI"=dword:00000001
  ```

- Create a folder in C volume named with C:\WERDumps

- Replace iexplore.exe to your own application name and then merge the registry script;

## 使用注册表脚本收集完成 WER DUMP

- 将以下内容复制到 Notepad 中并保存为 WER.reg;

  ```REG
  Windows Registry Editor Version 5.00

  [HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\Windows Error Reporting\LocalDumps\iexplore.exe]
  "DumpFolder"="c:\\WERDumps"
  "DumpType"=dword:00000002
  "DumpCount"=dword:00000003

  [HKEY_LOCAL_MACHINE\Software\Microsoft\Windows\Windows Error Reporting]
  "DontShowUI"=dword:00000001

  [HKEY_LOCAL_MACHINE\SOFTWARE\Wow6432Node\Microsoft\Windows\Windows Error Reporting\LocalDumps\iexplore.exe]
  "DumpFolder"="c:\\WERDumps"
  "DumpType"=dword:00000002
  "DumpCount"=dword:00000003

  [HKEY_LOCAL_MACHINE\Software\Wow6432Node\Microsoft\Windows\Windows Error Reporting]
  "DontShowUI"=dword:00000001
  ```

- 创建文件夹 C:\WERDumps

- 将程序名 iexplore.exe 替换成需要抓取 WER DUMP 的应用程序名，然后将脚本合并至注册表；

## 通过注册表编辑器配置 WER

- 在运行中通过命令 %windir%\regedit.exe 打开注册表编辑器；

- 定位到注册表 HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\Windows Error Reporting\LocalDumps，如果该注册表不存在，则创建该键；

- 在该键下创建子键，键名为应用程序名称，以下以 iexplore.exe 举例；

- 在应用程序名称子健下创建以下三个键值：

  | Value Name | Type          | Value    |
  |------------|---------------|----------|
  | DumpFolder | REG_EXPAND_SZ | C:\Dumps |
  | DumpCount  | REG_DWORD     | 5        |
  | DumpType   | REG_DWORD     | 2        |

  > DumpFolder 根据实际情况选择合适路径即可，在配置注册表前，请先创建该文件夹。

- 在问题复现后，程序崩溃的 DUMP 将会生成在 DumpFolder 键值对应的文件夹下。
