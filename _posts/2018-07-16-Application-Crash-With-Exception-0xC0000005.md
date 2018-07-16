---
layout: post
title: 基于 ATL6.0 的 C# 应用程序在 Windows10 中崩溃
categories: Windbg
description: 本文介绍基于 ATL6.0 的 C# 应用程序在 Windows10 中崩溃的原因。
keywords: Windbg，DEP，ATL
---



最近遇到一个基于 ATL6.0 的COM组件被 C# 应用调用后崩溃的问题，主要现象如下：

- C# 应用调用 基于 ATL 6.0 的 COM 组件， 当调用的 API 中包含了创建窗口时，则应用会崩溃；
- 使用给予 VC6.0 的 C++ 应用调用同样的 API， 应用正常运行；
- 浏览器中调用该 COM 组件中相同的 API, 应用正常运行；
- 应用程序崩溃时会记录 Application  Error日志，其中会包含 0xC0000005 和 0xC000041D的异常；



一般对于这种问题，我们先需要了解异常的含义，然后利用 [WER](https://docs.microsoft.com/zh-cn/windows/desktop/wer/collecting-user-mode-dumps) 或者 [Procdump](https://docs.microsoft.com/en-us/sysinternals/downloads/procdump) 工具抓举 DUMP 分析即可。

- 0xC0000005 表示 Access Violation，即访问违例，一般是由于访问了非法地址 或者被访问的地址不具备读/写/执行等权限；
- 0xC000041D 表示An unhandled exception was encountered during a user callback，即 callback 在调用过程中出现了异常；

当前的问题从 Application Error 中看应用先出现了 AV 异常，然后接着返回 Callback 调用出现异常，因此解决了 AV，后面一个异常也就解决了。



在 DUMP 中可以看到有如下的 Callstack：可以看到调用时在 C# 中通过 Invoke 的方式调用 ATL中的 CWindow::Create, 并在 StartWindowProc 中调用了地址 0x784a658 处的指令：

![ATL CRASH CallStack](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/ATL_CRASH.png)

查看对应的 Exception 和具体指令, 可以看到此处的异常信息为 AV，具体描述为 "Attempt to execute non-executable address 0784a658"，即尝试执行一个不允许执行的地址 0x0784a658;

![Exception Instruction](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/ATL_Exception.png)

查看该地址的保护属性，可以看出该地址对应的保护属性为 PAGE_READWRITE，但奇怪的是此处的确是存在指令；

![](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/ATL_Vprot.png)

结合调用栈我们知道此处为创建窗口时初始化窗口消息处理回掉函数, StartWindowProc 在 ATL 中的定义如下，熟悉 ATL 组件窗口机制的，一般都会了解 ATL 中的 thunk 机制，可以参考文章 [Thunk and Its use](https://www.codeproject.com/articles/27908/thunk-and-its-uses), 在 Thunk 机制中我们会动态生成 thunk 部分代码，而在 ATL7.1 之前的版本中，thunk 部分地址会被初始化成 PAGE_READWRITE 的保护模式。[此时对于 C# 应用，默认情况下会生成 IMAGE_DLLCHARACTERISTICS_NX_COMPAT 标记的可执行文件，则会出现 DEP Violation 的问题。](https://blogs.msdn.microsoft.com/ed_maurer/2007/12/13/nxcompat-and-the-c-compiler/)

```c++
template <class TBase, class TWinTraits>
LRESULT CALLBACK CWindowImplBaseT< TBase, TWinTraits >::StartWindowProc(
	_In_ HWND hWnd,
	_In_ UINT uMsg,
	_In_ WPARAM wParam,
	_In_ LPARAM lParam)
{
	CWindowImplBaseT< TBase, TWinTraits >* pThis = (CWindowImplBaseT< TBase, TWinTraits >*)_AtlWinModule.ExtractCreateWndData();
	ATLASSERT(pThis != NULL);
	if(!pThis)
	{
		return 0;
	}
	pThis->m_hWnd = hWnd;

	// Initialize the thunk.  This is allocated in CWindowImplBaseT::Create,
	// so failure is unexpected here.

	pThis->m_thunk.Init(pThis->GetWindowProc(), pThis);
	WNDPROC pProc = pThis->m_thunk.GetWNDPROC();
	WNDPROC pOldProc = (WNDPROC)::SetWindowLongPtr(hWnd, GWLP_WNDPROC, (LONG_PTR)pProc);
#ifdef _DEBUG
	// check if somebody has subclassed us already since we discard it
	if(pOldProc != StartWindowProc)
		ATLTRACE(atlTraceWindowing, 0, _T("Subclassing through a hook discarded.\n"));
#else
	(pOldProc);	// avoid unused warning
#endif
	return pProc(hWnd, uMsg, wParam, lParam);
}
```



对于该问题，规避方法有以下三种，但最终如果想彻底解决该问题，则需要升级 ATL 组件到更高版本，以便生成 DEP-Aware 的应用：

1. 系统级别禁用 DEP，该方法不推荐，因为禁用全局 DEP，会带来安全隐患；
2. 应用级别移除 IMAGE_DLLCHARACTERISTICS_NX_COMPAT 标识；
3. 通过 [SetProcessDEPPolicy](https://docs.microsoft.com/en-us/windows/desktop/api/WinBase/nf-winbase-setprocessdeppolicy) 修改 DEP 策略；

IE 中使用 SetProcessDEPPolicy 方式来提高对ATL的兼容性，详细参考文章 [Understanding DEP and NX](https://blogs.msdn.microsoft.com/ieinternals/2009/10/10/understanding-depnx/ )



参考文章：

[Data Execution Prevention](https://docs.microsoft.com/en-us/windows/desktop/Memory/data-execution-prevention)

[A detailed description of the Data Execution Prevention (DEP) feature](https://support.microsoft.com/en-us/help/875352/a-detailed-description-of-the-data-execution-prevention-dep-feature-in)

[Psychic debugging: IP on heap](https://blogs.msdn.microsoft.com/oldnewthing/20071114-00/?p=24523)

[In Windows XP, even when DEP is on, it’s still sometimes off](https://blogs.msdn.microsoft.com/oldnewthing/20071116-00/?p=24493)

[NXCOMPAT and the C# compiler](https://blogs.msdn.microsoft.com/ed_maurer/2007/12/13/nxcompat-and-the-c-compiler/)

[To DEP or not to DEP …](https://blogs.technet.microsoft.com/askperf/2008/06/17/to-dep-or-not-to-dep/)