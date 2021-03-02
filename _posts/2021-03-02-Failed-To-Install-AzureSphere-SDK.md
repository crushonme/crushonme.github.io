---
layout: post
title: Failed to Install AzureSphere SDK
categories: AzureSphere
description: 
keywords: AzureSphere,SDK,TAP,FTDI,0x80070643
---

It's a long story until last AzureSphere SDK update. Recently I want to use AzureSphere to control my IoT device. However when I update the SDK, I got an Error "Failed to install FTDI with error:0x80070643".

```log
[27B8:58F8][2021-03-02T09:45:49]i319: Applied execute package: AzureSphereCore, result: 0x0, restart: None
[31BC:4AE8][2021-03-02T09:45:49]i325: Registering dependency: {f7292493-49e0-4a00-adb5-70839deea2ae} on package provider: {31CFB295-1849-4045-922F-3AE0DFF18949}, package: AzureSphereCore
[31BC:4AE8][2021-03-02T09:45:49]i323: Registering package dependency provider: {013103CE-5DF8-4A9A-A502-2464FC4ACD3F}, version: 2.5, package: TapDriverInstaller
[31BC:4AE8][2021-03-02T09:45:49]i301: Applying execute package: TapDriverInstaller, action: Install, path: C:\ProgramData\Package Cache\{013103CE-5DF8-4A9A-A502-2464FC4ACD3F}v2.5\packages\TapDriverInstaller\TapDriverInstaller.msi, arguments: ' MSIFASTINSTALL="7" VSEXTUI="1" VSFOLDER=""'
[31BC:2888][2021-03-02T09:46:16]i304: Verified existing payload: Sysroot_index1 at path: C:\ProgramData\Package Cache\{C8F9A90E-CE35-450F-A84F-22BF5902777F}v20.10.0.41916\Sysroot7.msi.
[31BC:2888][2021-03-02T09:46:20]i304: Verified existing payload: Sysroot_index2 at path: C:\ProgramData\Package Cache\{1E220028-B120-4A94-B763-B98173601E75}v20.11.1.9373\Sysroot8.msi.
[31BC:2888][2021-03-02T09:46:23]i304: Verified existing payload: Sysroot_index3 at path: C:\ProgramData\Package Cache\{E97AC9BB-1163-4CF0-AE16-B7038D2B6CE4}v20.11.1.9374\Sysroot8Beta2101.msi.
[31BC:2888][2021-03-02T09:46:26]i304: Verified existing payload: NewCliInstaller at path: C:\ProgramData\Package Cache\{5B5002ED-8770-44C4-ABEA-9F6576208F5A}v0.2\NewCliInstaller.msi.
[31BC:4AE8][2021-03-02T09:46:40]e000: Error 0x80070643: Failed to install MSI package.
[31BC:4AE8][2021-03-02T09:46:40]e000: Error 0x80070643: Failed to execute MSI package.
[27B8:58F8][2021-03-02T09:46:40]e000: Error 0x80070643: Failed to configure per-machine MSI package.
[27B8:58F8][2021-03-02T09:46:40]i319: Applied execute package: TapDriverInstaller, result: 0x80070643, restart: None
[27B8:58F8][2021-03-02T09:46:40]e000: Error 0x80070643: Failed to execute MSI package.
[31BC:4AE8][2021-03-02T09:46:40]i318: Skipped rollback of package: TapDriverInstaller, action: Uninstall, already: Absent
[27B8:58F8][2021-03-02T09:46:40]i319: Applied rollback package: TapDriverInstaller, result: 0x0, restart: None
[31BC:4AE8][2021-03-02T09:46:40]i329: Removed package dependency provider: {013103CE-5DF8-4A9A-A502-2464FC4ACD3F}, package: TapDriverInstaller
[31BC:4AE8][2021-03-02T09:46:40]i351: Removing cached package: TapDriverInstaller, from path: C:\ProgramData\Package Cache\{013103CE-5DF8-4A9A-A502-2464FC4ACD3F}v2.5\
[31BC:4AE8][2021-03-02T09:46:40]i326: Removed dependency: {f7292493-49e0-4a00-adb5-70839deea2ae} on package provider: {31CFB295-1849-4045-922F-3AE0DFF18949}, package AzureSphereCore
[31BC:4AE8][2021-03-02T09:46:40]i301: Applying rollback package: AzureSphereCore, action: Uninstall, path: (null), arguments: ' MSIFASTINSTALL="7" VSEXTUI="1" INSTALLFOLDER=""'
[27B8:58F8][2021-03-02T09:46:48]i319: Applied rollback package: AzureSphereCore, result: 0x0, restart: None
[31BC:4AE8][2021-03-02T09:46:48]i329: Removed package dependency provider: {31CFB295-1849-4045-922F-3AE0DFF18949}, package: AzureSphereCore
[31BC:4AE8][2021-03-02T09:46:48]i351: Removing cached package: AzureSphereCore, from path: C:\ProgramData\Package Cache\{31CFB295-1849-4045-922F-3AE0DFF18949}v21.01.1.10482\
[31BC:4AE8][2021-03-02T09:46:48]i372: Session end, registration key: SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\{f7292493-49e0-4a00-adb5-70839deea2ae}, resume: None, restart: None, disable resume: No
[31BC:4AE8][2021-03-02T09:46:48]i330: Removed bundle dependency provider: {f7292493-49e0-4a00-adb5-70839deea2ae}
[31BC:4AE8][2021-03-02T09:46:48]i352: Removing cached bundle: {f7292493-49e0-4a00-adb5-70839deea2ae}, from path: C:\ProgramData\Package Cache\{f7292493-49e0-4a00-adb5-70839deea2ae}\
[31BC:4AE8][2021-03-02T09:46:48]i371: Updating session, registration key: SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\{f7292493-49e0-4a00-adb5-70839deea2ae}, resume: None, restart initiated: No, disable resume: No
[27B8:58F8][2021-03-02T09:46:48]i399: Apply complete, result: 0x80070643, restart: None, ba requested restart:  No

```

0x80070643 is a common error code for MSI package installation. So what's wrong during the installation?

Acturally I have no idea about the error and the installation. So I try to follow the steps list in [Troubleshoot Azure Sphere issues](https://docs.microsoft.com/en-us/azure-sphere/install/troubleshoot-installation):

- Try to uninstall FTDI drivers and reinstall it;

The error is still there after reinstall FTDI driver.

Then I tried to repair the installed AzureSphere SDK. During the reparing, I got an error "Failed to start Azure Sphere Device Communication Service". I tried to start the service mannually and it stopped right away. There might be some exception during the start up. So I checked the event log and find there are lots of recording from AzureSphereDeviceCommunicationService and one of it is "Unexpected exception thrown whilst starting service". 

OK. Here it is!

We can use procdump to capture the unexpected exception. Below is the output log:

```log
D:\DebugTools\SysinternalsSuite>procdump -accepteula -e 1 -f "" -ma SerialSlipToTunService.exe -w

ProcDump v9.0 - Sysinternals process dump utility
Copyright (C) 2009-2017 Mark Russinovich and Andrew Richards
Sysinternals - www.sysinternals.com

Waiting for process named SerialSlipToTunService.exe...

Process:               SerialSlipToTunService.exe (32692)
Process image:         C:\Program Files (x86)\Azure Sphere Device Communication Service\SerialSlipToTunService.exe
CPU threshold:         n/a
Performance counter:   n/a
Commit threshold:      n/a
Threshold seconds:     n/a
Hung window check:     Disabled
Log debug strings:     Disabled
Exception monitor:     First Chance+Unhandled
Exception filter:      [Includes]
                       *
                       [Excludes]
                       *
Terminate monitor:     Disabled
Cloning type:          Disabled
Concurrent limit:      n/a
Avoid outage:          n/a
Number of dumps:       1
Dump folder:           D:\DebugTools\SysinternalsSuite\
Dump filename/mask:    PROCESSNAME_YYMMDD_HHMMSS
Queue to WER:          Disabled
Kill after dump:       Disabled


Press Ctrl-C to end monitoring without terminating the process.

CLR Version: v4.0.30319

[14:28:21] Exception: E0434F4D.System.Security.SecurityException ("Requested registry access is not allowed.")
[14:28:21] Exception: E0434F4D.System.Collections.Generic.KeyNotFoundException ("Tun tap device not found")
[14:28:21] Exception: E0434F4D.SerialSlipToTun.TunInterfaceSetupException ("Error access tun registry settings")
[14:28:21] Exception: E0434F4D.SerialSlipToTun.TunInterfaceSetupException ("Error access tun registry settings")
[14:28:21] Exception: E0434F4D.SerialSlipToTun.TunInterfaceSetupException ("Error access tun registry settings")
[14:28:21] The process has exited.
[14:28:21] Dump count not reached.
```

Ahhh... The service crashed due to the TunInterfaceSetupException. We can dig into the issue by capturing a dump with command of:

```cmd
procdump -accepteula -e 1 -f "TunInterfaceSetupException" -ma SerialSlipToTunService.exe -w
```

From the dump we will know that the TunInterfaceSetupException is a wrapping of KeyNotFoundException. So we can use !mex.pe2 -nested to dump all the nested execptions. Then it tells us that SerialSlipToTun.TunInterfaceWrapper.FindTunTapDeviceGuid() throw an exception while access a registry key.

```cmd
0:008> !mex.PrintException2 01e47bd8 -nested
Address: 0x01e47bd8
HResult: 0x80131500
Type: SerialSlipToTun.TunInterfaceSetupException
Message: Error access tun registry settings
Inner Exception: 0x01e47ac8
Stack Trace:
SP       IP       Function
0464f028 014a29c8 SerialSlipToTun.TunInterfaceWrapper.SetupTunConnection(SerialSlipToTun.TapInterfaceMode) 

Address: 0x01e47ac8
HResult: 0x80131577
Type: System.Collections.Generic.KeyNotFoundException
Message: Tun tap device not found
Inner Exception: 0x01e4492c
Stack Trace:
SP       IP       Function
0464f0b8 014a2bf9 SerialSlipToTun.TunInterfaceWrapper.FindTunTapDeviceGuid() 
0464f0f0 014a28d7 SerialSlipToTun.TunInterfaceWrapper.SetupTunConnection(SerialSlipToTun.TapInterfaceMode) 

Address: 0x01e4492c
HResult: 0x8013150a
Type: System.Security.SecurityException
Message: Requested registry access is not allowed.
Stack Trace:
SP       IP       Function
0464f084 74130cb0 System.ThrowHelper.ThrowSecurityException(System.ExceptionResource) 
0464f094 745fbc7e Microsoft.Win32.RegistryKey.OpenSubKey(System.String, Boolean) 
0464f0b4 739b83fc Microsoft.Win32.RegistryKey.OpenSubKey(System.String)
0464f0b8 014a2a72 SerialSlipToTun.TunInterfaceWrapper.FindTunTapDeviceGuid() 
```

Check the source code of SerialSlipToTun.TunInterfaceWrapper.FindTunTapDeviceGuid() using ILSPY.

```dotnet
private static string FindTunTapDeviceGuid()
{
    string name = "SYSTEM\\CurrentControlSet\\Control\\Class\\{4D36E972-E325-11CE-BFC1-08002BE10318}";
    RegistryKey registryKey = Registry.LocalMachine.OpenSubKey(name);
    Exception ex = null;
    string[] subKeyNames = registryKey.GetSubKeyNames();
    foreach (string name2 in subKeyNames)
    {
        try
        {
            RegistryKey registryKey2 = registryKey.OpenSubKey(name2);
            object value = registryKey2.GetValue("ComponentId");
            object value2 = registryKey2.GetValue("NetCfgInstanceId");
            if (value != null && value2 != null && value.ToString() == "tap0901")
            {
                string text = value2.ToString();
                string name3 = "SYSTEM\\CurrentControlSet\\Control\\Network\\{4D36E972-E325-11CE-BFC1-08002BE10318}\\" + text + "\\Connection";
                RegistryKey registryKey3 = Registry.LocalMachine.OpenSubKey(name3);
                object value3 = registryKey3.GetValue("Name");
                if (Convert.ToString(value3) == "Azure Sphere")
                {
                    return text;
                }
            }
        }
        catch (Exception ex2) when (ex2 is ArgumentNullException || ex2 is ObjectDisposedException || ex2 is SecurityException || ex2 is IOException || ex2 is UnauthorizedAccessException)
        {
            ex = ex2;
        }
    }
    if (ex != null)
    {
        throw new KeyNotFoundException("Tun tap device not found", ex);
    }
    throw new KeyNotFoundException("Tun tap device not found");
}
```

OK, here it is. On my machine, the registry of Connection is "Ethernet" which is not matched to "Azure Sphere". So the solution is change the key of name to "Azure Sphere" under "SYSTEM\CurrentControlSet\Control\Network\{4D36E972-E325-11CE-BFC1-08002BE10318}\ValueofNetCfgInstanceId\Connection".
