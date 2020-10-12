---
layout: post
title: 如何扩展 Active Directory Users and Computers 的功能
categories: AD
description: 
keywords: AD,ADUC,ADSI
---

# 如何扩展 Active Directory Users and Computers 的功能

在我们企业级 AD 管理中经常会遇到写重复而繁琐的任务，为了快速便捷的处理，我们可以使用 VBS 来扩展 ADUC 以便将重复而繁琐的任务实现自动化。如 ADUC 自带的重置密码需要自行输入两次密码，在日常工作中，处理起来相对而言比较麻烦，那么我们可以定制脚本，实现自动重置成随机密码，并给对应的用户发送随机密码的邮件。

## 如何配置通过 ADSI Edit 配置 ADUC 自定义菜单

- 打开 ADSI Edit 控制台，并右键选择 ADSI Edit 图标，点击 "Connect to...";
  ![ADSIEdit-Connect](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/ADSIEdit-Connect.png)

- 在弹出的 Connection Settings 中点击 "Select a wellknown Naming Context" 并选择 Configuration;
  ![ADSIEdit-Connect-To-Configuration](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/ADSIEdit-Connect-To-Configuration.png)

- 依次展开 Configuration --> CN=Configuration,…… --> CN=DisplaySpecifiers --> CN=409 ，并选择需要添加菜单的视图，如 CN=user-display；

  > 其中 CN=409 表示语言未 EN-US， 如果是简体中文则选择 CN=804, 其他语言请参考 [Locale ID](https://docs.microsoft.com/en-us/openspecs/office_standards/ms-oe376/6c085406-a698-4e12-9d4d-c3b0ee3dbc4a) ;

- 在需要添加菜单的试图属性中找到 adminContextMenu 属性，并按照 **\<order number>,\<menu text>,\<command>** 的格式添加菜单；

  ![ADSIEdit-Add-Menu](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/ADSIEdit-Add-Menu.png)

  > - 上面的格式分别对应菜单序号，菜单名称，和需要执行的命令或者脚本；更详细的内容可以参考 [Registering a Static Context Menu Item](https://docs.microsoft.com/en-us/windows/win32/ad/registering-a-static-context-menu-item) 的解释。
  >
  > - 测试时 Command 中的脚本可以简单的添加弹窗提示即可，如下
  >
  >   ```vbs
  >    Wscript.echo("Test")
  >    ```

- 重新打开ADUC 并验证功能

  ![ADUC-TestMenu-ForUser](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/ADUC-TestMenu-ForUser.png)
  ![ADUC-TestMenu-ForUser-ShowTest](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/ADUC-TestMenu-ForUser-ShowTest.png)

## 如何通过 VBS 脚本

- 以管理员权限打开 CMD
- 运行命令

  ```DOS
  cscript Addmenu.vbs
  ```

> 以下是脚本的详细内容：

```VBS
' Addmenu.vbs adds the menu item to run Frommenu.vbs 
' from user object's context menu in the admin snap-ins.
On Error Resume Next
Set root= GetObject("LDAP://rootDSE")
If (Err.Number <> 0) Then
    BailOnFailure Err.Number, "on GetObject method"
End If
sConfig = root.Get("configurationNamingContext")

'hardcoded for user class.
sClass = "user"

'hardcoded for US English
sLocale = "409"

sPath = "LDAP://cn=" & sClass & "-Display,cn=" & sLocale & ",cn=DisplaySpecifiers," & sConfig
ShowItems "Display Specifier: " & sPath
Set obj= GetObject(sPath)
If (Err.Number <> 0) Then
    BailOnFailure Err.Number, "on GetObject method"
End If

'TODO--check if this is already there.
'Add the value for the context menu
sValue = "5,Run My Test Script,c:\frommenu.vbs"
vValue = Array(sValue)
obj.PutEx 3, "adminContextMenu", vValue
If (Err.Number <> 0) Then
    BailOnFailure Err.Number, "on IADs::PutEx method"
End If

' Commit the change.
obj.SetInfo
If (Err.Number <> 0) Then
    BailOnFailure Err.Number, "on IADs::SetInfo method"
End If

ShowItems "Success! Added value to adminContextMenu property of user-Display: " & sValue

''''''''''''''''''''
' Display subroutines
''''''''''''''''''''
Sub ShowItems(strText)
    MsgBox strText, vbInformation, "Add admin context menu"
End Sub

Sub BailOnFailure(ErrNum, ErrText)    strText = "Error 0x" & Hex(ErrNum) & " " & ErrText
    MsgBox strText, vbInformation, "ADSI Error"
    WScript.Quit
End Sub
```

```VBS
'Frommenu.vbs is the script run when the menu item is chosen.

''''''''''''''''''''
' Parse the arguments
' First arg is ADsPath of the selected object. Second is Class.
''''''''''''''''''''
On Error Resume Next

Set oArgs = WScript.Arguments
sText = "This script was run from a display specifier context menu." & vbCrLf & "Selected Item:"
If oArgs.Count > 1 Then
    sText = sText & vbCrLf & "  ADsPath: " & oArgs.item(0)
    sText = sText & vbCrLf & "  Class: " & oArgs.item(1)
Else
    sText = sText & vbCrLf & "Arg Count: " & oArgs.Count
End If

ShowItems sText
Err.Number = 0
sBind = oArgs.item(0)
Set dsobj= GetObject(sBind)
If (Err.Number <> 0) Then
    BailOnFailure Err.Number, "on GetObject method"
End If

objname = dsobj.Get("name")
If (Err.Number <> 0) Then
    BailOnFailure Err.Number, "on Get method"
End If
sText = "Use ADsPath from first argument to bind and get RDN (name) property."
sText = sText & vbCrLf & "Name: " & objname
ShowItems sText

''''''''''''''''''''
' Display subroutines
''''''''''''''''''''
Sub ShowItems(strText)
    MsgBox strText, vbInformation, "Script from Context Menu"
End Sub

Sub BailOnFailure(ErrNum, ErrText)    strText = "Error 0x" & Hex(ErrNum) & " " & ErrText
    MsgBox strText, vbInformation, "ADSI Error"
    WScript.Quit
End Sub
```

> **Reference:**
>
> [Example Code for Installing a Static Context Menu Item](https://docs.microsoft.com/en-us/windows/win32/ad/example-code-for-installing-a-static-context-menu-item)

## 如何给 ADUC 添加自动重置密码并提示用户的功能

以下脚本重置选中用户的密码，密码包含大小写字母和数字的密码。发送邮件部分尚未测试,需要基于实际的 SMTP 来配置。

```VBS
'ResetPasswordToRandomAndSendEmail.vbs is the script run when the menu item is chosen.

''''''''''''''''''''
' Parse the arguments
' First arg is ADsPath of the selected object. Second is Class.
''''''''''''''''''''
On Error Resume Next

Set oArgs = WScript.Arguments
sText = "We will reset the password for selected object and send a email." & vbCrLf & "Selected Item:"
If oArgs.Count > 1 Then
    sText = sText & vbCrLf & "  ADsPath: " & oArgs.item(0)
    sText = sText & vbCrLf & "  Class: " & oArgs.item(1)
Else
    sText = sText & vbCrLf & "Arg Count: " & oArgs.Count
End If

ShowItems sText
Err.Number = 0
sBind = oArgs.item(0)
Set dsobj= GetObject(sBind)
If (Err.Number <> 0) Then
    BailOnFailure Err.Number, "on GetObject method"
End If

objname = dsobj.Get("name")
If (Err.Number <> 0) Then
    BailOnFailure Err.Number, "on Get method"
End If

password = GenerateRandomPassword(4)
Wscript.echo password

dsobj.SetPassword(password)
If (Err.Number <> 0) Then
    BailOnFailure Err.Number, "on SetPassword method"
End If

'SendEmail dsobj.mail strPassword
'If (Err.Number <> 0) Then
'    BailOnFailure Err.Number, "on SendEmail method"
'End If

''''''''''''''''''''
' Display subroutines
''''''''''''''''''''
Sub ShowItems(strText)
    MsgBox strText, vbInformation, "Script from Context Menu"
End Sub

Sub BailOnFailure(ErrNum, ErrText)    strText = "Error 0x" & Hex(ErrNum) & " " & ErrText
    MsgBox strText, vbInformation, "ADSI Error"
    WScript.Quit
End Sub

Function  GenerateRandomPassword(Length)
    Dim intMax, iLoop, k, intValue, strChar, strName, intNum

    ' Specify the alphabet of characters to use.
    Const Chars1 = "abcdefghijklmnopqrstuvwxyz"
    Const Chars2 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

    Randomize()

    strName = ""
    For k = 1 To Length
        ' Retrieve random digit between 0 and 25 (26 possible characters).
        intValue = Fix(26 * Rnd())
        ' Convert to character in allowed alphabet.
        strChar = Mid(Chars1, intValue + 1, 1)
        ' Build the name.
        strName = strName & strChar
    Next
    For k = 1 To Length
        ' Retrieve random digit between 0 and 25 (26 possible characters).
        intValue = Fix(26 * Rnd())
        ' Convert to character in allowed alphabet.
        strChar = Mid(Chars2, intValue + 1, 1)
        ' Build the name.
        strName = strName & strChar
    Next
    GenerateRandomPassword = strName & Int((7789 - 7 + 889)*Rnd+999)
End Function

Function SendEmail(To,Password)

    'Create the objects require for sending email using CDO
    Set objMail = CreateObject("CDO.Message")
    Set objConf = CreateObject("CDO.Configuration")
    Set objFlds = objConf.Fields

    'Set various parameters and properties of CDO object
    objFlds.Item("http://schemas.microsoft.com/cdo/configuration/sendusing") = 2 'cdoSendUsingPort

    'your smtp server domain or IP address goes here such as smtp.yourdomain.com
    objFlds.Item("http://schemas.microsoft.com/cdo/configuration/smtpserver") = "smtp.yourdomain.com" 
    objFlds.Item("http://schemas.microsoft.com/cdo/configuration/smtpserverport") = 25 'default port for email

    'uncomment next three lines if you need to use SMTP Authorization
    'objFlds.Item("http://schemas.microsoft.com/cdo/configuration/sendusername") = "your-username"

    'objFlds.Item("http://schemas.microsoft.com/cdo/configuration/sendpassword") = "your-password"

    'objFlds.Item("http://schemas.microsoft.com/cdo/configuration/smtpauthenticate") = 1 'cdoBasic

    objFlds.Update
    objMail.Configuration = objConf
    objMail.From = "fromEmailAddress@yourdomain.com"
    objMail.To = To
    objMail.Subject = "We will reset your password to random code"
    objMail.TextBody = "Your new random password is " & Password
    objMail.Send

    'Set all objects to nothing after sending the email
    Set objFlds = Nothing
    Set objConf = Nothing
    Set objMail = Nothing
End Function
```
