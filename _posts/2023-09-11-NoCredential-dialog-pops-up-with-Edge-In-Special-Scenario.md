---
layout: post
title: No credential dialog pops up with Edge in specified scenario
categories: Browsers
description: N/A
keywords: proxy,proxyoverride
---

When you embed a website which will return 307 to a website which require Windows Authentication, Edge might not prompt for credentials. And we will see "Tracking Prevention blocked access for storage for <URL>"

# Cause


When your proxy hostname is in the list of [disconnect-tracking-protection
/services.json](https://github.com/disconnectme/disconnect-tracking-protection/blob/master/services.json), Edge will use private mode to access the webpage and then it will suppress WIA in 3rd party contexts.

> Reference
>
>  - [Seamless Single Sign-On – text/plain (textslashplain.com)](https://textslashplain.com/2020/08/17/seamless-single-sign-on/#:~:text=Update%20%28Feb%202021%29:-%2cAs%20of%20Chrome/Edge88%2c-%2c%20this%20magic%20trick)
> - [1154281 - BlockThirdPartyCookies policy suppresses Negotiate/NTLM Authentication in 3rd party contexts - chromium](https://bugs.chromium.org/p/chromium/issues/detail?id=1154281#c2)

# Solutions
A few options to resolve this issue:

- Use a customized hostname instead of a hostname which is listed in disconnect-tracking-protection/services.json.
- Disable tracking prevention feature
- Set the prevention feature to Basic

# Repro
1. Download Fiddler Auto Responder rules from [NoCredentialDialogIssue.farx](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/NoCredentialDialogIssue.farx)
1. Access [NoCredentialDialogIssueNormalScenario](https://brave-plant-0ddc21400.3.azurestaticapps.net/NoCredentialDialogIssueNormalScenario.html) and we will see the credential dialog.
1. Access [NoCredentialDialogIssueAbnormalScenario](https://brave-plant-0ddc21400.3.azurestaticapps.net/NoCredentialDialogIssueAbnormalScenario.html) and you will see no credential dialog and we will see error "Tracking Prevention blocked access for storage for <URL>" in F12 Console.

![Repro GIF](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/NoCredentialWithProxy.gif)

>Notes
>
> In this repro, we returned 307 to redirect to a proxy URL. In the abnormal scenario, the proxy URL is proxy.fb.com. And in normal scenario, the proxy URL is proxy.com. fb.com is listed in [disconnect-tracking-protection
/services.json](https://github.com/disconnectme/disconnect-tracking-protection/blob/master/services.json). Then when we try to access proxy.fb.com, we will see below information in net-export log
>
>  ```log
>  t=37 [st=0]        COMPUTED_PRIVACY_MODE
>                     --> privacy_mode = "disabled"
>  ``````