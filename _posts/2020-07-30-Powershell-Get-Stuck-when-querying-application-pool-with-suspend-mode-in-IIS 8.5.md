---
layout: post
title: Powershell get stuck when querying an application pool in suspend mode in IIS 8.5
categories: IIS
description: Powershell get stuck when querying an application pool in suspend mode in IIS 8.5
keywords: IIS,Suspend mode,IIS8.5,Suspend,Resume
---
# Powershell get stuck when querying an application pool in suspend mode in IIS 8.5

In IIS 8.5 on Windows Server 2012 R2, when we set an application pool to Suspend on timeout idle, and it drops into Suspend mode. Powershell commands that attempt to look at that Application Pool last 2 minutes before completing.

We can easily reproduce the issue on IIS 8.5 with below steps:

- Configuring idle timeout action to suspend, which is a [new feature for IIS 8.5](https://devblogs.microsoft.com/dotnet/asp-net-app-suspend-responsive-shared-net-web-hosting/). To quickly reproduce the issue, we can set the timeout to 1 minute.

  > Windows Server 2012 R2 Preview includes a new feature called IIS Idle Worker Process Page-out. It suspends CPU activity to IIS sites after they have been idle for a given time. Sites that are suspended become candidates for paging to disk via the Windows Virtual Memory Manager, per the normal memory paging behavior in Windows Server. If you’ve seen app suspension for Windows Phone or Windows Store apps, this feature will be familiar, although the details are different on Windows Server.

  > IIS Idle Worker Process Page-out must be enabled by the server admin, so it is opt-in, per app-pool. The given idle time to wait before suspending a site can also be set by the admin. Once the feature is enabled in IIS, ASP.NET will use it without any additional configuration. You can think of ASP.NET app suspension as the .NET Framework implementation of IIS Idle Worker Process Page-out.

- Run below powershell snaptshot

  ```powershell
  Import-Module webadministration
  Get-ItemProperty "IIS:\AppPools\DefaultAppPool"
  ```

From [Enable and monitor ASP.NET App Suspend on Windows Server 2012 R2](https://devblogs.microsoft.com/aspnet/enable-and-monitor-asp-net-app-suspend-on-windows-server-2012-r2/), we know that we can monitor asp.net app suspend when event 2310 from IIS-W3SVC-WP occuring.

So after doing below test, we will find out that IIS 8.5 did not resume from suspend mode when we calling above Powershell script.

- Wait for dropping into suspend mode;

- Reproduce the issue and wait for the completing;

- Then wait for more than idle timeout and check Application log;

- There is no log of Event 2310 from IIS-W3SVC-WP which means that IIS did not resume from suspend mode.
![SuspendAndResumeOnWindows2012](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/SuspendAndResumeOnWindows2012R2.png)

Do the same test on Windows 2016 and we will find that IIS 10 will do resume from suspend mode when we calling above Powershell Script.
![SuspendAndResumeOnWindows2016](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/SuspendAndResumeOnWindows2016.png)

So it should be a code defect or bad design on IIS 8.5. And it was fixed on IIS 10.
