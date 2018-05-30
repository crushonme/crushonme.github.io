---
layout: wiki
title: Windows 驱动调试相关资料
categories: Windows Driver
description: Windows 驱动调试相关资料汇总
keywords: Driver, Debug
---

1. UMDF 相关的debug tips: 

- [Debugging a WDF driver](https://docs.microsoft.com/en-us/windows-hardware/drivers/wdf/debugging-a-wdf-driver)
- [UMDF Metadata in WER](https://docs.microsoft.com/en-us/windows-hardware/drivers/wdf/accessing-umdf-metadata-in-wer-reports)
- [How to attach user-mode debugger](https://docs.microsoft.com/en-us/windows-hardware/drivers/wdf/attaching-a-user-mode-debugger)
- [Avoid Reboot when updating a UMDF driver](https://docs.microsoft.com/en-us/windows-hardware/drivers/wdf/avoiding-reboot-when-updating-a-umdf-driver)
- [inf copyfiles directive](https://docs.microsoft.com/en-us/windows-hardware/drivers/install/inf-copyfiles-directive)
- [How to trouble shoot UMDF driver leak](https://docs.microsoft.com/en-us/windows-hardware/drivers/wdf/determining-if-a-driver-leaks-framework-objects)
- [How to get the state of UMDF](https://docs.microsoft.com/en-us/windows-hardware/drivers/wdf/determining-the-state-of-a-umdf-device)
- [How to debug the application request do not complete](https://docs.microsoft.com/en-us/windows-hardware/drivers/wdf/determining-why-an-application-request-does-not-complete)
- [Debug UMDF driver loading/Starting issue](https://docs.microsoft.com/en-us/windows-hardware/drivers/wdf/determining-why-the-umdf-driver-fails-to-load-or-the-umdf-device-fails)
- [Debug UMDF outstanding files at device removal time](https://docs.microsoft.com/en-us/windows-hardware/drivers/wdf/determining-why-umdf-indicates-outstanding-files-at-device-removal-tim)
- [Analyze the installation of UMDF driver](https://blogs.msdn.microsoft.com/iliast/2009/06/09/analyzing-the-installation-of-wdf-1-7-and-1-9-drivers/) 
- [Debugging driver installation](https://docs.microsoft.com/en-us/windows-hardware/drivers/wdf/debugging-driver-installation)
- [Devive pooling in UMDF](https://docs.microsoft.com/en-us/windows-hardware/drivers/wdf/using-device-pooling-in-umdf-drivers)
- [How UMDF handles failures](https://docs.microsoft.com/en-us/windows-hardware/drivers/wdf/how-umdf-handles-driver-failures)
- [How UMDF handles application failures](https://docs.microsoft.com/en-us/windows-hardware/drivers/wdf/how-umdf-handles-application-failures)
- [How UMDF reports errors](https://docs.microsoft.com/en-us/windows-hardware/drivers/wdf/how-umdf-reports-errors)
2. Devcon related document:
- [Devcon Source code](https://github.com/Microsoft/Windows-driver-samples/tree/master/setup/devcon)
- [Devcon general command](https://docs.microsoft.com/en-us/windows-hardware/drivers/devtest/devcon-general-commands)
- [Devcon Command Samples](https://docs.microsoft.com/en-us/windows-hardware/drivers/devtest/devcon-examples)

3. Windbg 相关命令解释：
- [Debug Command Summary](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/debugger-commands)
- [Windbg Kernel mode extension](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/kernel-mode-extensions)
- [Windbg User mode extension](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/user-mode-extensions)
- [Userful extensions](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/specialized-extensions)
- [USB 2.0 Extension](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/usb-2-0-extensions)
- [USB 3.0 Extension](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/usb-3-extensions)
- [NDIS Extension](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/ndis-extensions--ndiskd-dll-)
- [WDF framework Extension](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/kernel-mode-driver-framework-extensions--wdfkd-dll-)
- [UMDF driver extension](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/user-mode-driver-framework-extensions--wudfext-dll-)
- [Symbols related document](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/symbols)
- [How to parse traceview log from ETL to txt](https://technet.microsoft.com/en-us/library/cc732700(v=ws.11).aspx)

4. Kernel memory Pool / Handle related document:
- [ExAllocatePoolWithTag](https://msdn.microsoft.com/en-us/library/windows/hardware/ff544520(v=vs.85).aspx)
- [POOL TYPE](https://msdn.microsoft.com/en-us/library/windows/hardware/ff559707(v=vs.85).aspx)
- [DPC class](https://msdn.microsoft.com/en-us/library/windows/desktop/aa964748(v=vs.85).aspx)
- [Guidelines for Writing DPC Routines](https://docs.microsoft.com/en-us/windows-hardware/drivers/kernel/guidelines-for-writing-dpc-routines)
- [Introduction to DPC Objects](https://docs.microsoft.com/en-us/windows-hardware/drivers/kernel/introduction-to-dpc-objects)
- [Handle](https://msdn.microsoft.com/en-us/library/windows/desktop/ms724176(v=vs.85).aspx)

5. TTD related document:
- [TTD overview](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/time-travel-debugging-overview)
- [TTD FAQ](https://blogs.msdn.microsoft.com/windbg/2017/10/20/time-travel-debugging-faq/)

6. Calling Conventions: We just need to focus on _STDCALL/_THISCALL/_CDECL/_FASTCALL
 [Argument Passing and Naming Conventions](https://msdn.microsoft.com/en-us/library/984x0h58.aspx)

7. Tools related document:
- https://docs.microsoft.com/zh-cn/windows-hardware/drivers/devtest/index-of-windows-driver-kit-tools 
- [Process  Monitor]( https://docs.microsoft.com/en-us/sysinternals/downloads/procmon)
- [Procdump](https://docs.microsoft.com/en-us/sysinternals/downloads/procdump)
- [Process Explore](https://docs.microsoft.com/en-us/sysinternals/downloads/process-explorer)
- [NotMyfault]( https://docs.microsoft.com/en-us/sysinternals/downloads/notmyfault)
- [Debug View](https://docs.microsoft.com/en-us/sysinternals/downloads/debugview)
- [Debugdiag](https://www.microsoft.com/en-us/download/details.aspx?id=49924)
- [Poolmon](https://support.microsoft.com/en-us/help/177415/how-to-use-memory-pool-monitor-poolmon-exe-to-troubleshoot-kernel-mode)
- [WER DUMP](https://msdn.microsoft.com/en-us/library/windows/desktop/bb787181(v=vs.85).aspx)