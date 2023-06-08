---
layout: post
title: IDebugDocumentText::GetText returns "The stub returns bad data" when pstaTextAttr is NULL.
categories: dotnet
description: N/A
keywords: GetText,IDebugDocumentText
---

# Issue description

Calling [IDebugDocumentText::GetText](https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/windows-scripting/reference/idebugdocumenttext-gettext) with setting third parameter pstaTextAttr to NULL, it will return "The stub returns bad data". Error code is 0x6f7 or 1783.

# Troubleshooting
1. Capture TTD trace and analyze

    ```log
     # Child-SP Return   Call Site                                                                                            Info
     0 22bfeb3c 761db925 RPCRT4!NdrpValidateCorrelatedValue+0x31c26
     1 (Inline) -------- RPCRT4!NdrCorrelationPass+0x22 
     2 22bfeb60 761c4cf6 RPCRT4!NdrpServerUnMarshal+0x865 
     3 22bfebc4 77073cd2 RPCRT4!NdrStubCall2+0x2a6 
     4 22bfeff4 761fe47a combase!CStdStubBuffer_Invoke+0x92
     5 22bff03c 77073aa2 RPCRT4!CStdStubBuffer_Invoke+0x2a
     6 (Inline) -------- combase!InvokeStubWithExceptionPolicyAndTracing::__l6::<lambda_ee1df801181086a03fa4f8f75bd5617f>::operator()+0x29
     7 22bff054 77073576 combase!ObjectMethodExceptionHandlingAction<<lambda_ee1df801181086a03fa4f8f75bd5617f> >+0x4e
     8 (Inline) -------- combase!InvokeStubWithExceptionPolicyAndTracing+0x13b
     9 22bff0a8 770f5921 combase!DefaultStubInvoke+0x2b6 
     a (Inline) -------- combase!SyncStubCall::Invoke+0x7 
     b (Inline) -------- combase!SyncServerCall::StubInvoke+0xa
     c (Inline) -------- combase!StubInvoke+0x2b8 
     d 22bff18c 7707b74a combase!ServerCall::ContextInvoke+0x471
     e (Inline) -------- combase!CServerChannel::ContextInvoke+0x126
     f (Inline) -------- combase!DefaultInvokeInApartment+0x126
    10 22bff3d8 770f81ad combase!ReentrantSTAInvokeInApartment+0x16a
    11 (Inline) -------- combase!AppInvoke+0x1020 
    12 22bff414 770abe62 combase!ComInvokeWithLockAndIPID+0x191d                                                              ClientPID: 0x658
    13 (Inline) -------- combase!ComInvoke+0x230 
    14 (Inline) -------- combase!ThreadDispatch+0x2cd 
    15 22bff69c 775d0fcb combase!ThreadWndProc+0x452 
    16 22bff734 775c7f9a USER32!_InternalCallWinProc+0x2b 
    17 (Inline) -------- USER32!InternalCallWinProc+0x1b 
    18 22bff760 775c5cfa USER32!UserCallWinProcCheckWow+0x33a
    19 22bff844 775c5ac0 USER32!DispatchMessageWorker+0x22a
    1a 22bff8b8 771124fd USER32!DispatchMessageW+0x10 
    1b (Inline) -------- combase!CCliModalLoop::MyDispatchMessage+0xa
    1c 22bff8c4 77112594 combase!CCliModalLoop::PeekRPCAndDDEMessage+0x4d
    1d 22bff8f8 77112239 combase!CCliModalLoop::FindMessage+0x37
    1e 22bff92c 770adee8 combase!CCliModalLoop::HandleWakeForMsg+0x4c
    1f 22bff990 7707bb84 combase!CCliModalLoop::BlockFn+0x21e
    20 22bff9fc 7707b5b7 combase!ClassicSTAThreadWaitForHandles+0xb4
    21 22bffab8 22d28aec combase!CoWaitForMultipleHandles+0x77
    22 22bffae4 22d28cbc pdm!CDebuggerThread::CallableWaitForMultiple+0x72
    23 22bffb94 22d28c5b pdm!CDebuggerThread::ThreadEntry+0x60
    24 22bffbb8 7603fa29 pdm!DebuggerThreadEntry+0xb 
    25 22bffbc0 77d67a7e KERNEL32!BaseThreadInitThunk+0x19
    26 22bffbd0 77d67a4e ntdll!__RtlUserThreadStart+0x2f 
    27 22bffc2c 00000000 ntdll!_RtlUserThreadStart+0x1b 
    0:100> g
    (658.1fec): Unknown exception - code 000006f7 (first/second chance not available)
    (658.1fec): Unknown exception - code 000006f7 (first/second chance not available)
    (658.2cd0): Unknown exception - code 800706f7 (first/second chance not available)
    (658.1fec): Unknown exception - code 000006f7 (first/second chance not available)
    (658.1fec): Unknown exception - code 000006f7 (first/second chance not available)
    (658.2cd0): Unknown exception - code 800706f7 (first/second chance not available)
    ```

2. After checking the issue is caused by new feature of "correlation consistency checking" in RPC module.

# Cause

Bug in RPC module. 

We can easily reproduce the issue with sample in [Introduction to RPC - Part 1](https://www.codeproject.com/Articles/4837/Introduction-to-RPC-Part-1) by modifying below code:

1. Add “,size_is(10),ptr” in Example1.idl

1. Replace Output("Hello Implicit RPC World!") with Output(NULL)

1. Rebuild the sample, Then Run Example1Server.exe and Example1Client.exe in two different CMD
1. We will get below error:

    |  Hex  |  Dec | Symbolic Name       | Error Description           | Header     |
    |:-----:|:----:|---------------------|-----------------------------|------------|
    | 0x6f7 | 1783 | RPC_X_BAD_STUB_DATA | The stub received bad data. | winerror.h |

# Soltuion

Use non-Null value for pstaTextAttr
