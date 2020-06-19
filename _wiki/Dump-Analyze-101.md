---
layout: wiki
title: Dump Analyze 101
categories: DEBUG
description: 本篇文章主要包含分析 DUMP 时我们需要掌握的基础知识以及常见场景下的 DUMP 分析方法。
keywords: Windbg, DUMP
---

# DUMP 分析基础知识

本篇文章主要包含分析 DUMP 时我们需要掌握的基础知识以及常见场景下的 DUMP 分析方法。

## 调试符号 / Symbol

[调试符号 / Symbol](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/public-and-private-symbols) 是编译器编译时生成的调试信息数据库。通常在 DUMP 分析的最早执行的命令就是设置调试符号路径。调试符号一般分成私有调试符 (Private Symbol) 和公有调试符 (Public Symbol) 。

- Private Symbol

  一般而言 Private Symbol 包含了方法名地址映射、数据类型和结构定义、变量的名称类型地址及作用域（包含本地变量和全局变量）、每个指令对应的源代码行数。

- Public Symbol

  Public Symbol 一般包含非静态方法名地址映射、标记为 extern 的全局变量名（通常不包含变量类型）。

  > VS 默认会生成全量的符号文件 (Full Symbol Files)，我们通常称之为 "Private Symbol"。 但实际 Full Symbols Files 中包含了 Private Symbol 和 Public Symbol。 我们可以通过 [PDBCopy](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/using-pdbcopy) 工具从 Full Symbol Files 中移除 Private Symbol,生成 Public Symbol。

在大部分场景下使用 Public Symbol 就可以分析 DUMP。以下是几个常用的 Public Symbol Server 地址：

- Microsoft Symbol Server:  [https://msdl.microsoft.com/download/symbols](https://msdl.microsoft.com/download/symbols)
- [Google Chrome Symbol Server](https://www.chromium.org/developers/how-tos/debugging-on-windows): [https://chromium-browser-symsrv.commondatastorage.googleapis.com](https://chromium-browser-symsrv.commondatastorage.googleapis.com)
- [Firefox Symbol Server](https://developer.mozilla.org/en-US/docs/Mozilla/Using_the_Mozilla_symbol_server): [https://symbols.mozilla.org/](https://symbols.mozilla.org/)
- Intel Symbol Server: [https://software.intel.com/sites/downloads/symbols/](https://software.intel.com/sites/downloads/symbols/)
- AMD Symbol Server: [https://download.amd.com/dir/bin](https://download.amd.com/dir/bin)
- Nvida Symbol Server: [https://driver-symbols.nvidia.com/](https://driver-symbols.nvidia.com/)
- [Citrix Symbol Server](https://support.citrix.com/article/CTX118622): [http://ctxsym.citrix.com/symbols](http://ctxsym.citrix.com/symbols)
- [LibOffice Symbol Server](https://wiki.documentfoundation.org/How_to_get_a_backtrace_with_WinDbg): [http://dev-downloads.libreoffice.org/symstore/symbols](http://dev-downloads.libreoffice.org/symstore/symbols)

在使用 Windbg 时常用的与 Symbol 相关的命令如下：

- 默认设置 C:\symbols 为 Symbols 缓存

  ```Windbg
  .symfix C:\symbols
  ```

- 添加 symbol Server 或者缓存

  ```Windbg
  /*添加本地路径 D:\project\debug\*/
  .sympath+ D:\project\debug\

  /* 添加 UNC Symbol Cache 路径 \\SymCache\Symbols */
  .sympath+ \\SymCache\symbols

  /* 添加 Chromium Symbol Server 并缓存至 C:\symbols */
  .sympath+ C:\symbols*https://www.chromium.org/developers/how-tos/debugging-on-windows
  ```

- 如果加载 Symbol 失败，可以开启调试模式，在加载 Symbol 时会输出相应的日志：

```Windbg
/* 开启调试模式 */
!sym noisy
或者
.symopt+0x80000000

/*关闭调试模式*/
!sym quiet
或者
.symopt-0x80000000
```

对于经常会使用的 Symbol Server 或者缓存路径，可以通过设置环境变量 _NT_SYMBOL_PATH 来指定，这样启动调试器时会自动加载对应的 Symbol 路径。

> 引用文档
>
> [Symbol path for Windows debuggers](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/symbol-path)
>
> [Public Symbols and Private Symbols](https://docs.microsoft.com/en-us/windows-hardware/drivers/devtest/public-symbols-and-private-symbols)

## 常用 Windbg 命令

常用的 Windbg 内置命令可以参考 [Common Windbg Commands](http://windbg.info/doc/1-common-cmds.html)

## Windbg Extension

Windbg Extension 是 Windbg 的扩展插件，用户可以根据自己的需求来实现相关功能，简化调试过程。根据实现方式不同可以分成以下

- [DBG Engine Extension](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/writing-dbgeng-extensions)

- [WdbgExts Extension](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/writing-wdbgexts-extensions)

### 如何使用 Windbg Extension

- 配置 Extension 路径
  - 配置环境变量 _NT_DEBUGGER_EXTENSION_PATH
  - 使用.extpath+ 命令

- 加载 Extension

  - 如果插件位于默认的路径或者配置的插件路径，则可以直接使用 !ExtensionName.Command 的方式自动加载；

  - 如果插件为与其他路径，则可以使用如下方式加载：

    ```Windbg
    .load path\ExtensionName.dll
    ```

- 查看插件顺序

  ```Windbg
  .chain
  ```

- 查看命令匹配的插件，如果多个插件实现了相同的命令，则可以通过该方法查看其匹配的命令，如下例，mex 和 exts 均实现了 gflag 命令，当前匹配的顺序则按照插件的排列顺序:

  ```Windbg
  0:019> .extmatch gflag
  !mex.gflag
  !exts.gflag
  ```

### 常用的 Windbg Extension

- [Mex](https://download.microsoft.com/download/0/C/4/0C4C45E3-BF02-49BF-8D68-6FA611F442E6/Mex.exe) 微软出品的插件，包含了很多非常有用的功能；
- [SOS](https://docs.microsoft.com/en-us/dotnet/framework/tools/sos-dll-sos-debugging-extension) Dotnet/Dotnet Core 内置的调试插件，功能强大；
- [Netext](https://github.com/rodneyviana/netext) 开源的 .NET 调试插件，Rodney Viana 开发，目前就职于微软；
- [SOSEX](http://www.stevestechspot.com/) Steve Johnson开发的 .NET 调试插件，是对 SOS 的很强大的补充，在他的博客 [STEVE'S TECHSPOT](http://www.stevestechspot.com/default.aspx)中有详细的使用介绍。
- [pykd](https://githomelab.ru/pykd/pykd/-/releases) PYKD 为 windbg 提供了 python 接口，可以使用 python 开发自动化分析脚本；
- ~~psscor2/psscor4~~ 现已废弃
- 内置的Extensions:
  - JSprovider: 为 Windbg 提供了 js 接口，方便使用 js 脚本开发自动化分析脚本；
  - TTDExt: 用于 WindbgX 中新增功能 [TTD](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/time-travel-debugging-overview) 分析；
  - exts/uext/ntsdexts/kdexts/ext/dbghelp/Kernel Mode/User Mode/Spechialized Extension 该部分可以参考 [Gerneral Extensions](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/general-extensions)

## 汇编指令 / Assymbly Instructions

在分析 Native 应用时，如果没有源码，我们通常都需要接触汇编指令，因此我们需要熟悉常见的汇编指令。

- X86 的汇编指令相关信息可以参考 [x86 Instructions](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/x86-instructions)

> 常见的汇编优化指令
>
> - xor eax,eax   将 eax 置零，等同于 mov eax,0，该指令效率更高，详细解释可以参考[What is the best way to set a register to zero in x86 assembly: xor, mov or and?](https://stackoverflow.com/questions/33666617/what-is-the-best-way-to-set-a-register-to-zero-in-x86-assembly-xor-mov-or-and)
>
> - mov edi,edi   用于热补丁的占位符，可以参考[Why does the compiler generate a MOV EDI, EDI instruction at the beginning of functions](https://docs.microsoft.com/en-us/archive/blogs/ishai/why-does-the-compiler-generate-a-mov-edi-edi-instruction-at-the-beginning-of-functions)
>
> - test eax,eax  判断 eax 是否为零，效果等同于cmp eax,0，但效率更高。
>

- X64 的汇编指令相关信息可以参考 [x64 Instructions](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/x64-instructions),如果想了解更详细的内容可以参考 Intel 的官方手册 [Introduction to x64 Assembly](https://software.intel.com/content/www/us/en/develop/articles/introduction-to-x64-assembly.html)

- ARM64/AArch64 的汇编指令相关信息可以参考 [ARM® and Thumb®-2 Instruction Set Quick Reference Card](http://infocenter.arm.com/help/topic/com.arm.doc.qrc0001m/QRC0001_UAL.pdf)

> 当前Windows 10 支持 ARM64/AArch64, 参考 [Windows 10 on ARM](https://docs.microsoft.com/en-us/windows/uwp/porting/apps-on-arm)。在调试 ARM64 的应用时使用 ARM64 版本的 Windbg，而调试 ARM64 处理器上运行的 X86 应用，则需要使用 X86 版本的 Windbg。指令集也需要跟随应用切换。
>
> .effmach x86: Switch to and see x86 context, simulating the effect of using x86 WinDbg.
>
> .effmach arm64: Switch to and see ARM64 context
>
> .effmach chpe: Switch to and see CHPE context.

## 调用约定 / Calling Convention

在调试 Native 应用时，如果没有 Private Symbol, 则我们需要依赖调用约定来获取参数值，因此我们需要熟悉不同处理器下的调用约定。

- X86 的调用约定可以参考 [X86 Calling Convention](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/x86-architecture#calling-conventions);

  函数必须保存除 **eax, ecx, and edx** 和 **esp** 以外的所有寄存器, 其中 **eax, ecx, and edx** 可以在函数间改变， **esp** 则需要根据调用约定来更新；

  **eax** 用于保存函数返回值，如果函数返回值为 64 位，则使用 **edx:eax** 来保存。
  - Win32 (__stdcall)

    **函数参数通过栈来传递，压栈顺序为从右往左，由函数体( callee)清栈**

  - Native C++ Call (thiscall)

    **函数参数通过栈来传递，压栈顺序为从右往左， this 指针通过 ecx 寄存器传递，由函数体( callee)清栈**

  - COM (__stdcall for C++)

    **函数参数通过栈来传递，压栈顺序为从右往左， this 指针通过 ecx 寄存器传递，由函数体( callee)清栈**

  - __fastcall

    **前两个 DWORD 型参数通过 ECX 和EDX 传递，剩下的参数通过栈传递，压栈顺序为从右往左，由函数体( callee)清栈**

  - __cdecl

    **函数参数通过栈来传递，压栈顺序为从右往左，由函数调用方( caller)清栈。函数定义中包含可变长度的参数，均为 __cdecl 函数调用**

- X64 的调用约定可以参考 [X64 Calling Convention](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/x64-architecture#calling-conventions);

  X64 调用约定相对简单，其调用过程中通过 **rcx,rdx,r8,r9** 传递前四个整形参数或者指针，如果前四个参数中包含浮点数，则使用对应的 **xmm0-xmm3**替代即可。其余参数均通过栈来传递。整型数或者整型指针返回值保存在 **rax** 中，如果是浮点数，则保存在 **xmm0** 中。对于含有 this 指针的，则传递方法和第一个参数相同，即 **rcx** 或者 **xmm0**。

- ARM 的调用约定可以参考 [Overview of ARM32 ABI conventions](https://docs.microsoft.com/en-us/cpp/build/overview-of-arm-abi-conventions?view=vs-2019);
- ARM64 的调用约定可以参考 [Overview of ARM64 ABI conventions](https://docs.microsoft.com/en-us/cpp/build/arm64-windows-abi-conventions?view=vs-2019);

## 函数的序言和尾声/Prologue and Epilogue

在函数调用中，我们通常需要在起始处分配栈空间，保存非易失性寄存器，或者使用异常处理等；在退出函数前，则需要释放分配的栈空间，从栈空间弹出保存的非易失性寄存器。

对于 x86 和 x64 常见的序言和尾声参考如下：

```ASM
X86 函数的序言和尾声示例
    /* Prologue */
    push ebp       //保存基地址
    mov ebp, esp   //将当前栈地址保存到基地址寄存器
    sub esp, N     //为本地变量和临时变量保留栈空间
    push edi       //保存 edi
    push esi       //保存 esi
    push ebx       //保存ebx，如果函数体中使用到的非易失性寄存器，也需要依次保存
    ...
    /*Epilogue*/
    pop ebx        //还原 ebx，如果函数体中使用到的非易失性寄存器，则还原顺序与序言中顺序相反
    pop esi        //还原 esi
    pop edi        //还原 edi
    add esp,N      //清空本地变量和临时变量的保留栈，通常不需要，会被优化
    mov esp, ebp   //还原栈顶指针，该指令会释放本地变量和临时变量保留栈空间
    pop ebp        //还原基地址
    ret

X64 函数的序言和尾声示例
    /* Prologue */
    mov    [RSP + 8], RCX
    push   R15     //保存 R15
    push   R14     //保存 R14
    push   R13     //保存 R13
    ...            //保存其他函数体中使用到的非易失性寄存器
    mov    RAX,  fixed-allocation-size
    call   __chkstk  //检查栈溢出
    sub    RSP, RAX  //为本地变量和临时变量保留栈空间
    lea    R13, 128[RSP]

    ......

    /*Epilogue*/
    lea      RSP, -128[R13]
    ; epilogue proper starts here
    add      RSP, fixed-allocation-size  //清空本地变量和临时变量的保留栈空间
    ...            //依次还原函数体中使用到的非易失性寄存器，与序言中顺序相反
    pop      R13   //还原 R13
    pop      R14   //还原 R14
    pop      R15   //还原 R15
    ret
```
