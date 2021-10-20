---
layout: post
title: Faild To Activate RDP ActiveX Automatically in IE11
categories: Browsers
description: 
keywords: RDP,ActiveX,IE11,MsRdpClient
---

In recent, one of our customer is suffering an issue about failed to activate RDP ActiveX automatically in IE11 on Windows 10 RS5 (1809). There original issue is in CyberArk Remote Desktop Manager. And we simplified the webpage to below snapshot.

```html
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width" />
    <meta charset="UTF-8">
    <meta http-equiv="x-ua-compatible" content="IE=8">
    <title>MsRdpClient</title>
    <style type="text/css">
        body {
            padding: 0;
            margin: 0;
        }
    </style>
</head>
<body>
    <script type="text/javascript">
        function RdpConnect() {
            var userName, pwd, server, domain, port;
            userName = "testUser";
            pwd = "abcd1234";
            server = "192.168.1.100"
            port = 3389;
            if (!MsRdpClient.Connected) {
                try {
                    document.getElementById("connectArea").style.display = "block"; 
                    MsRdpClient.Server = server; 
                    try {
                        MsRdpClient.AdvancedSettings2.RedirectDrives = false;
                        MsRdpClient.AdvancedSettings2.PinConnectionBar = true;
                        MsRdpClient.AdvancedSettings2.RedirectPrinters = false;
                        MsRdpClient.AdvancedSettings2.RedirectPrinters = false;
                        MsRdpClient.AdvancedSettings2.RedirectClipboard = true;
                        MsRdpClient.AdvancedSettings2.RedirectSmartCards = false;
                    } catch (ex) {
                    };

                    MsRdpClient.ConnectingText = "Try to connecting，waiting...";
                    MsRdpClient.UserName = userName;
                    MsRdpClient.AdvancedSettings2.RDPPort = port;
                    MsRdpClient.AdvancedSettings2.ClearTextPassword = pwd;
                    MsRdpClient.ColorDepth = 32;
                    MsRdpClient.FullScreen = 0;
                    try {
                        MsRdpClient.AdvancedSettings7.EnableCredSspSupport = true;
                        MsRdpClient.AdvancedSettings5.AuthenticationLevel = 2;
                    } catch (ex) {
                    } finally {
                        MsRdpClient.Connect(); 
                        document.getElementById("connectArea").focus();
                    }
                } catch (ex) {
                    alert("Error:" + ex.message + "Please refresh to reconnect。");
                };
            } else {
                alert("Connected！");
            };
        };
        function closeWindow() {
            location.reload();
        };
    </script>
    <div>
        <p>Click Connect to connect your RDP</p>
        <input type="button" id="connectbutton" value="Connect" onclick="RdpConnect();" />
    </div>
    <div id="connectArea" style="display: none;">
        <table>
            <tr>
                <td>
                    <object id="MsRdpClient"
                            classid="CLSID:7584c670-2274-4efb-b00b-d6aaba6d3850"
                            codebase="msrdp.cab#version=5,2,3790,0" width="1024px" height="768px"></object>
                </td>
            </tr>
            <script type="text/javascript">
                function MsRdpClient::OnDisconnected(disconnectCode) {
                    document.getElementById("connectArea").style.display = "none";

                    closeWindow();
                }
            </script>
        </table>
    </div>
</body>
</html> 
```

If you use similar code in your webpage, you might have to click the connectArea to mannualy activate the RDP ActiveX to pop up the RDP connection.

Solution:
Installing latest system update will fix the issue.

> Actually you should install [April 22, 2021-KB5001384 (OS Build 17763.1911)](https://support.microsoft.com/en-us/topic/april-22-2021-kb5001384-os-build-17763-1911-preview-e471f445-59be-42cb-8c57-5db644cbc698)
>
> In the *Improvements and fixes* section, you will see "Addresses an issue that might prevent an application screen from working when using a Remote Desktop ActiveX control that is embedded in an HTML page."
