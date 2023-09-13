---
layout: post
title: Edge blocked Window if there is a MSGBOX or ALERT before calling to Window.showModalDialog or Window.Open in IE Mode
categories: Browsers
description: N/A
keywords: showModalDialog
---

Edge will block the popup window when we call Window.showModalDialog or Window.Open in IE Mode with below conditions.
1.	The configuration of “Use Pop-up Blocker” is enable in the zone security settings which the URL belongs to.
2.	There is a MSGBOX or ALERT before calling Window.showModalDialog or Window.Open

# Cause:
It should be a bug in IE. 

When there is a MSGBOX or ALERT before calling to Window.showModalDialog or Window.Open in IE Mode, the API [GetAsyncKeyState ](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getasynckeystate) return false. Then the dwFlag used by  EvaluateNewWindow will be 0x24, which means that browser will not treat it as a user-initiated action. So Edge blocked the Window.

# Resolution:
Workaround is adding the URL to local intranet zone where the configuration of “Use Pop-up Blocker” is disable by default.

> Notes:
>> Allow pop-up windows on specific sites does not workaround this issue.

# Repro Steps:
1.	Add brave-plant-0ddc21400.3.azurestaticapps.net to IE Mode List and add the URL to trust site zone. (make sure that “Use Pop-up Blocker” is enabled. By default the configuration is enabled)
2.	Access brave-plant-0ddc21400.3.azurestaticapps.net/TestModalDialog.html and then click "showModalDialog" button.

> Expected behavior: We can see the Modal Dialog.
>
> Actual behavior: The modal dialog is blocked by Edge.


![showModalDialogBlockedByEdge](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/showModalDialogBlockedByEdge.gif)