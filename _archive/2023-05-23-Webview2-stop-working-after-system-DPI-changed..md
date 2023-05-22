---
layout: post
title: Webview2 stop working after system DPI changed.
categories: dotnet
description: N/A
keywords: webview2
---

# Issue Description

We will see a gray screen in WebView2 when we do not use the application for a long time.
We can easily reproduce the issue with Webview2 sample.

1. Download and compile the sample in [WebView2WpfBrowser](https://github.com/MicrosoftEdge/WebView2Samples/tree/main/SampleApps/WebView2WpfBrowser)
1. Run the WebView2WpfBrowser.exe and change the resolution or Scale in Settings-->System--> Display --> Scale&Layout.
1. Click "Window --> New WebView" in the menu of WebView2WpfBrowser.exe
1. Then we will see WebView2WpfBrowser.exe only show the background of EdgeWebView2-80.jpg instead of HTML content.


# Troubleshooting

Reproduce the issue in local environment.
1. We see that the process and windows changed during the issue. And every time I see the behavior is then I came home and work with a single 1. display RDP session.
1. Customer feedback that they noticed the window resize event every time when they reproduced the issue.
1. We can always reproduce the issue when we reconnect RDP session from multiple displays to single displays.
1. Suggest adding DPI Awareness code following [Setting the default DPI awareness for a process (Windows)](https://learn.microsoft.com/en-us/windows/win32/hidpi/setting-the-default-dpi-awareness-for-a-process#setting-default-awareness-with-the-application-manifest). And we see the issue is gone.

# Cause

The scenario is a unique one that only occurs for System awareness.

Previously, the system DPI was fixed when the user logged on and never changed. But new Windows feature added support for setting current monitors DPI as system DPI for app when the app is launched.

The root cause of this issue is application launch with a system DPI, before creating WebView2 we changed system DPI (with the operation of dock/undock, RDP, or change display settings) , then new created WebView2 will get a new system DPI (different with application DPI).

Because DPI does not match, the WebView2 does not render any of the content.

# Resolution
1.Use PerMonitorV2 DPI awareness mode.

  - Win32: [Setting the default DPI awareness for a process (Windows)](https://learn.microsoft.com/en-us/windows/win32/hidpi/setting-the-default-dpi-awareness-for-a-process)

  - WPF: [WPF-Samples/readme.md at main · microsoft/WPF-Samples (github.com)](https://github.com/microsoft/WPF-Samples/blob/main/PerMonitorDPI/readme.md)

  - Winform: [High DPI support - Windows Forms .NET Framework](https://learn.microsoft.com/en-us/dotnet/desktop/winforms/high-dpi-support-in-windows-forms?view=netframeworkdesktop-4.8)

2.Use the PERPROCESSSYSTEMDPIFORCEOFF AppCompatFlag
  - Find the application .exe and right click on it and select properties
  - Click on the **Compatibility** tab
  - Click on the **Change high DPI setting** button
  - Under **Program DPI**, select the **Use this setting to fix scaling problems for this program instead of the one in Settings**
  - From the **Use the DPI that's set for my main display when: I signed into Windows**
  - Click the **OK** button to save these changes

This will create a new registry String Value under below registry path which containing the the path to the application executable.: 
```
HKEY_CURRENT_USER\Software\Microsoft\Windows NT\CurrentVersion\AppCompatFlags\Layers
``` 

Optimize option:
Add a check in WebView2 that if the dpi is different, notify the user/dev to go and restart the app to fix it.



