---
layout: post
title: How to Solve Exception 0xC000041D
categories: Windbg
description: How to handle exception 0xC000041D, which means An unhandled exception was encountered during a user callback.
keywords: 0xC000041D, ProcDump
---

Exception 0xC000041D means that an unhandled exception was encountered during a user callback. It means that 0xC000041D is a second chance exception. So we should capture the first chance exception ,if we want to know the root cause.  Usually it's occurred in system defined callback context on Windows, for example message handling context. And customized callback will not throw the exception

# How to Simulate Exception throw in user call back?

Check below console application sample. It will throw first chance exception of 0xC0000005 and then throw second chance exception of 0xC000041D.

```c++
#include "pch.h"
#include <iostream>
#include <Windows.h>

#pragma comment(lib, "user32")

WNDPROC OriginalProc = NULL;

LRESULT CALLBACK NewProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam)
{
	int* p = nullptr;
	*p = 1;
	return OriginalProc(hwnd, uMsg, wParam, lParam);
}
int main()
{
	system("pause");
	HWND hWnd = CreateWindowEx(0,TEXT("SampleOfUserCallbackException"),TEXT("0xC000041D"),
		WS_OVERLAPPEDWINDOW | WS_VISIBLE,
		CW_USEDEFAULT, CW_USEDEFAULT, CW_USEDEFAULT, CW_USEDEFAULT,
		NULL, NULL, NULL, NULL);
	OriginalProc = (WNDPROC)SetWindowLongPtr(hWnd, GWLP_WNDPROC, (LONG_PTR)NewProc);

	UpdateWindow(hWnd);
	system("pause");
}

```

# How to Capture the original exception?

We can use [procdump](https://docs.microsoft.com/en-us/sysinternals/downloads/procdump) to capture the original first chance exception with below command:

```
procdump -e 1 -f "" processname
```

For example: In below picture, we can see the first chance exception is 0xC0000005, Access Violation.

![0xC000041DWithAV](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/0xC000041DWithAV.png)

