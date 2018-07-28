---
layout: post
title: 如何在内核启动期间做内核调试
categories: Windbg
description: 本文介绍如何在内核启动期间做内核调试。
keywords: Windbg，GFLAG
---

当我们在调试内核启动期间加载的 DLL 或者应用时通常需要在内核启动期间就需要断点，此时我们可以在使用 Windbg Kernel Debug 期间按下 [CTRL-ALT-K](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/ctrl-k--change-post-reboot-break-state-)，开启 Post-Reboot 断点。譬如我们在调试 Credential Provider 或者 Security Provider 时则需要使用这种方式。

Post-Reboot 断点一共有以下三种状态，多次按下则会在此三种状态中依次切换：

- No Break
- Break on Boot 等同于 windbg -b
- Break on First Module Load 等同于 windbg -d

当我们在内核调试时通常需要开启[内核加载 Symbol ](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/enable-loading-of-kernel-debugger-symbols)的功能，即：

```
gflag +ksl
gflag -ksl
```

实际调试过程中，如果需要确认 DLL 是否正常加载，可以开启 [Show loader snaps](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/show-loader-snaps) 特性，以便我们检查加载 DLL 的状态：

```
gflag + sls
gflag -sls
```

以我们调试 Security Provider为例，以下为我们实际调试时的输出：

```
kd> .reboot
Shutdown occurred at (Wed Jul 25 21:34:14.874 2018 (UTC + 8:00))...unloading all symbol tables.
Waiting to reconnect...
Connected to Windows 10 17134 x64 target at (Wed Jul 25 21:34:26.826 2018 (UTC + 8:00)), ptr64 TRUE
Kernel Debugger connection established.

************* Path validation summary **************
Response                         Time (ms)     Location
……
Symbol search path is: *****
Executable search path is: 
Windows 10 Kernel Version 17134 MP (1 procs) Free x64
Built by: 17134.1.amd64fre.rs4_release.180410-1804
Machine Name:
Kernel base = 0xfffff803`7f207000 PsLoadedModuleList = 0xfffff803`7f5c11f0
System Uptime: 0 days 0:00:00.000
nt!DebugService2+0x5:
fffff803`7f3a70e5 cc              int     3
kd> !gflag +ksl
New NtGlobalFlag contents: 0x00040000
    ksl - Enable loading of kernel debugger symbols
kd> sxe ld:lsasrv.dll
kd> g
KDTARGET: Refreshing KD connection
nt!DebugService2+0x5:
fffff803`7f3a70e5 cc              int     3
kd> !process 0 0 lsass.exe
PROCESS ffff998dcfb8b080
    SessionId: 0  Cid: 0270    Peb: ca3647000  ParentCid: 01ec
    DirBase: 10800002  ObjectTable: ffffd701ecfff380  HandleCount:  35.
    Image: lsass.exe

kd> .process -i ffff998dcfb8b080
You need to continue execution (press 'g' <enter>) for the context
to be switched. When the debugger breaks in again, you will be in
the new process context.
kd> g
Break instruction exception - code 80000003 (first chance)
nt!DbgBreakPointWithStatus:
fffff803`7f3a7090 cc              int     3
kd> sxe ld:SampleSSP.dll
kd> g
nt!DebugService2+0x5:
fffff803`7f3a70e5 cc              int     3
kd> k
 # Child-SP          RetAddr           Call Site
00 ffff8306`1a8535d8 fffff803`7f37b5aa nt!DebugService2+0x5 
……
10 0000000c`a387f650 00007ffc`f604bdbc KernelBase!LoadLibraryExW+0x17b 
……
18 0000000c`a387fb20 00007ff6`84a14108 lsass!wmain+0x111 
……
1b 0000000c`a387fbb0 00000000`00000000 ntdll!RtlUserThreadStart+0x21 
kd> dx -id 0,0,ffff998dcfb8b080 -r1 ((ntdll!_LDRP_DLL_PATH *)0xca387f590)
((ntdll!_LDRP_DLL_PATH *)0xca387f590)                 : 0xca387f590 [Type: _LDRP_DLL_PATH *]
    [+0x000] DllPath          : 0x1720e606230 : "C:\Windows\system32;C:\Windows\SYSTEM32;C:\Windows\system;C:\Windows;.;C:\Windows\System32" [Type: wchar_t *]
……
    [+0x020] RootDllName      : 0x1720e6073b0 : "SampleSSP" [Type: wchar_t *]
……
kd> dx -id 0,0,ffff998dcfb8b080 -r1 ((lsasrv!wchar_t * *)0x1720e6140a0)
((lsasrv!wchar_t * *)0x1720e6140a0)                 : 0x1720e6140a0 [Type: wchar_t * *]
    0x1720e607340 : "kerberos" [Type: wchar_t *]
kd> dx -id 0,0,ffff998dcfb8b080 -r1 ((lsasrv!wchar_t * *)0x1720e607af0)
((lsasrv!wchar_t * *)0x1720e607af0)                 : 0x1720e607af0 [Type: wchar_t * *]
    0x1720e6068f0 : "msv1_0" [Type: wchar_t *]
kd> bp 00007ffc`f604ba9c
kd> g
Breakpoint 0 hit
lsasrv!LoadPackages+0x194:
0033:00007ffc`f604ba9c 85c0            test    eax,eax
kd> r
rax=0000000000000000 rbx=0000000000000000 rcx=f2f4832f61100000
rdx=0000000000000023 rsi=0000000000000001 rdi=0000000000000001
rip=00007ffcf604ba9c rsp=0000000ca387f770 rbp=0000000ca387f870
 r8=fffcffffffffffff  r9=000001720e654000 r10=0000000000000018
r11=0000000ca387f030 r12=000001720e6140a0 r13=0000000000000003
r14=00007ffcf61634f0 r15=000001720e606ba0
iopl=0         nv up ei pl zr na po nc
cs=0033  ss=002b  ds=002b  es=002b  fs=0053  gs=002b             efl=00000246
lsasrv!LoadPackages+0x194:
0033:00007ffc`f604ba9c 85c0            test    eax,eax
kd> dv
             ppszPackages = 0x00000172`0e6140a0
              ppszOldPkgs = 0x00000172`0e607af0
             pszPreferred = 0x00000000`00000000 ""
            pszDefaultTLS = 0x00000172`0e606ba0 "SampleSSP"
              ……
kd> !gle
LastErrorValue: (Win32) 0x7e (126) - The specified module could not be found.
LastStatusValue: (NTSTATUS) 0xc0000135 - The code execution cannot proceed because %hs was not found. Reinstalling the program may fix this problem.
kd> g
```

