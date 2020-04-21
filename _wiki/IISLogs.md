---
layout: wiki
title: Logs for IIS
categories: Debug
description: IIS 相关日志收集
keywords: IIS
---
# Logs for IIS

## IIS log

- Run CMD as administrator and run below command to get website ID, Replace \<SiteName\> to your actual site name;

  ```BAT
  %systemroot%\system32\inetsrv\APPCMD list site <SiteName>
  ```

- IIS log will be saved in folder %SystemDrive%\inetpub\logs\LogFiles\W3SVCn：
  ![IISLog](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IISLOG.png)

---

## IIS 日志

- 在 CMD 中运行如下命令获取站点 ID，其中 \<SiteName\> 使用站点名称替代

  ```BAT
  %systemroot%\system32\inetsrv\APPCMD list site <SiteName>
  ```

- IIS日志保存在 %SystemDrive%\inetpub\logs\LogFiles\W3SVCn 下，如下图：
  ![IISLog](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IISLOG.png)

## HTTP Error Log

- HTTP Error saved in  %SystemRoot%\System32\LogFiles by default;

---

## HTTP 错误日志

- HTTP Error 日志默认保存在 %SystemRoot%\System32\LogFiles

## IIS 失败请求跟踪日志

- 参考以下官方文档开启Tracing功能;
[IIS Tracing Feature](https://docs.microsoft.com/en-us/iis/configuration/system.webserver/tracing/tracefailedrequests/)

- 选择您的站点并 在下方选择 "功能试图"/"Features View"，点击 "失败请求跟踪"/"Failed Request Tacking Rules";
![IIS-FREB](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IIS-FREB.png)

- 点击 "添加"/"Add" 新建规则，在配置规则界面中:

  - "指定要跟踪的内容" 界面选择 "所有内容(\*)(A)"/"All content (*)"，点击 "下一步"/"Next";
  ![IIS-FREB-Rule](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IIS-FREB-Rule.png)

  - "定义跟踪条件" 界面中将 "状态代码"/"Status code" 设置为 400-600，然后点击 "下一步"/"Next";
  ![IIS-FREB-RULE-DF](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IIS-FREB-RULE-DF.png)
  > ***注意：*** 此处根据实际情况设置；跟踪长时请求则配置 "所用时间(秒)(T)"
  - "选择跟踪提供程序" 界面中点击 "完成"/"Finish";
  ![IIS-FREB-RULE-ADD](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IIS-FREB-RULE-ADD.png)

- 点击您的站点返回主界面，然后点击 "失败请求跟踪"/"Failed Request Tracking", 选中 "开启"/"Enable"，并点击 "确定"/"OK" 使用这个规则；
  ![IIS-FREB-RULE-ENABLE](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IIS-FREB-RULE-ENABLE.png)

- 重现问题，然后把%SystemDrive%\inetpub\logs\FailedReqLogFiles下面产生的日志

---

## IIS FREB Log English Version

- Enable Tracing feature;
[IIS Tracing Feature](https://docs.microsoft.com/en-us/iis/configuration/system.webserver/tracing/tracefailedrequests/)

- Select target site and Click "Failed Request Tacking Rules" in "Features View" tab;
![IIS-FREB](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IIS-FREB-EN.png)

- Click "Add" to create new rule，And add rules following below steps:

  - Select "All content (*)" in "Specify Content to Trace" tab, then click "Next";
  ![IIS-FREB-Rule](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IIS-FREB-RULE-DF-EN.png)

  - Select "Status code(s)" and enter 400-600 in "Define Trace Conditions" tab，Then click "Next";
  ![IIS-FREB-RULE-DF](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IIS-FREB-Rule-EN.png)
  > ***Notes:*** Set the rules according to actual scenario;
  ![IIS-FREB-RULE-ADD](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IIS-FREB-RULE-ADD-EN.png)

- Click target site and click "Failed Request Tracking" at right panel, Then click "Enable" --> "OK"；
  ![IIS-FREB-RULE-ENABLE](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IIS-FREB-RULE-ENABLE-EN.png)

- Reproduce the issue and then the log will generate in folder %SystemDrive%\inetpub\logs\FailedReqLogFiles.

## Capture long running DUMP with FREB

- Enable Tracing feature;
[IIS Tracing Feature](https://docs.microsoft.com/en-us/iis/configuration/system.webserver/tracing/tracefailedrequests/)

- Download [Procdump](https://download.sysinternals.com/files/Procdump.zip) and unzip it to a folder;

- Select target site and Click "Failed Request Tacking Rules" in "Features View" tab;
![IIS-FREB](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IIS-FREB-EN.png)

- Click "Add" to create new rule，And add rules following below steps:

  - Select "All content (*)" in "Specify Content to Trace" tab, then click "Next";
  ![IIS-FREB-Rule](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IIS-FREB-RULE-DF-EN.png)

  - Select "Time Taken(in seconds)" and enter 15 in "Define Trace Conditions" tab，Then click "Next";
  ![IIS-FREB-RULE-TIMETAKEN-EN](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IIS-FREB-RULE-TIMETAKEN-EN.png)
  ![IIS-FREB-RULE-ADD](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IIS-FREB-RULE-ADD-EN.png)

- Configure IIS in Server level and select "Configuration Editor":
  ![IIS-FREB-DUMP-MACHINE-CONFIGURE](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IIS-FREB-DUMP-MACHINE-CONFIGURE.png)

  - Select "System.ApplicationHost" --> "Sites" --> "Collection"
    ![IIS-FREB-DUMP-MACHINE-SITES](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IIS-FREB-DUMP-MACHINE-SITES.png)
    ![IIS-FREB-DUMP-MACHINE-SITES-COLLECTION](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IIS-FREB-DUMP-MACHINE-SITES-COLLECTION.png)
  - Select target website and expand "traceFailedRequestsLogging" and set "customActionsEnabled" to ture; Then set "enabled" to true and close the tab and Click "Apply" at right panel;
    ![IIS-FREB-DUMP-MACHINE-TRACE](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IIS-FREB-DUMP-MACHINE-TRACE.png)

- Configure IIS in Website level and select "Configuration Editor"
  ![IIS-FREB-DUMP-SITE-CONFIGURE](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IIS-FREB-DUMP-SITE-CONFIGURE.png)

  - Select "system.webServer" -> "tracing" -> "traceFailedRequests" -> "Collection";
    ![IIS-FREB-DUMP-SITE-TRACE](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IIS-FREB-DUMP-SITE-TRACE.png)
  - Add or Edit the rule, Then close the tab and Click "Apply" at right panel;
    ![IIS-FREB-DUMP-Actions](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IIS-FREB-DUMP-Actions.png)
    > ***NOTE:***
    1. Configure customActionExe to the actual path of procdump.exe;
    2. Replace "C:\dumps" to any exsit folder in cusomActonParams;
    3. We'd better set customActionTriggerLimit more than 5;
    4. Configure path to *  which means any page in website or a target page address, such as "\*test\*.axpx";

- Wait for the issue reproduce and the rule will generate dumps in the target folder;

---

## 使用失败请求跟踪抓取长时请求 DUMP

- 参考以下官方文档开启Tracing功能;
[IIS Tracing Feature](https://docs.microsoft.com/en-us/iis/configuration/system.webserver/tracing/tracefailedrequests/)

- 下载 [Procdump](https://download.sysinternals.com/files/Procdump.zip) 并解压;

- 选择您的站点并 在下方选择 "功能试图"/"Features View"，点击 "失败请求跟踪"/"Failed Request Tacking Rules";
![IIS-FREB](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IIS-FREB.png)

- 点击 "添加"/"Add" 新建规则，在配置规则界面中:

  - "指定要跟踪的内容" 界面选择 "所有内容(\*)(A)"/"All content (*)"，点击 "下一步"/"Next";
  ![IIS-FREB-Rule](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IIS-FREB-Rule.png)

  - "定义跟踪条件" 界面中将 "所用时(秒)(T)"/"Time taken(in Seconds)(T)" 设置为 15，然后点击 "下一步"/"Next";
    ![IIS-FREB-DUMP-TIMETAKEN-CN](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IIS-FREB-DUMP-TIMETAKEN-CN.png)

    ![IIS-FREB-RULE-ADD](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IIS-FREB-RULE-ADD.png)

- 选择 IIS Server, 双击 "配置编辑器"/"Configuration Editor":
  ![IIS-FREB-DUMP-MACHINE-CONFIGURE-CN](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IIS-FREB-DUMP-MACHINE-CONFIGURE-CN.png)
  - 点击 "节"/"Section" 下拉框选择 "sytem.applicationhost" -> "sites" -> "Collection",点击 "集合"/"Collection" 后的 "..."
    ![IIS-FREB-DUMP-MACHINE-SITES-CN](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IIS-FREB-DUMP-MACHINE-SITES-CN.png)
    ![IIS-FREB-DUMP-MACHINE-COLLECTION-CN](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IIS-FREB-DUMP-MACHINE-COLLECTION-CN.png)

  - 在弹出界面中，选则目标站点，然后分别设置 "traceFailedRequestLogging" 和 "CustomActionEnabled" 为 "True";然后关闭弹出界面并点击 "应用"/"Apply"
    ![IIS-FREB-DUMP-MACHINE-TRACE-CN](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IIS-FREB-DUMP-MACHINE-TRACE-CN.png)

- 选择目标站点，双击"配置编辑器"/"Configuration Editor":
  ![IIS-FREB-DUMP-SITE-CONFIGURE-CN](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IIS-FREB-DUMP-SITE-CONFIGURE-CN.png)

  - 依次选择 "Section -> System.webServer -> Tracing -> traceFailedRequests",选择Collection，单击改行尾部的 "...";
    ![IIS-FREB-DUMP-SITE-TRACE-CN](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IIS-FREB-DUMP-SITE-TRACE-CN.png)
    ![IIS-FREB-DUMP-SITE-COLLECTION-CN](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IIS-FREB-DUMP-SITE-COLLECTION-CN.png)

  - 在右侧Actions中点击Add，然后修改其属性值为如下,设置完成后关闭设置窗口并点击 "应用"/"Apply"：

    ```TEXT
    customActionExe: c:\windows\system32\procdump.exe
    customActionParams: -accepteula -ma %1% c:\dumps
    customActionTriggerLimit: 5
    path: test*.aspx
    ```

  > ***注:*** 其中 customActionExe 设置为 Procdump 所在的路径，customActionTriggerLimit 表示抓取 dump 时 procdump 的响应次数; Path 可以设为任意页面*，也可以指定网页地址，比如 \*.aspx ，对当前网站下所有 aspx 页面生效，比如 \*test\*.aspx，只对 [http://…./test1.aspx](http://…./test1.aspx)等页面有效。
  ![IIS-FREB-DUMP-SITE-TRACE-ACTION-CN](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IIS-FREB-DUMP-SITE-TRACE-ACTION-CN.png)

- 等待问题复现，DUMP 会在设置的路径中产生；

## How to flush IIS HTTP and FTP logs to disk

### HTTP

- Run CMD as administrator and run below command

  ```BAT
  netsh http flush logbuffer
  ```

### FTP

- Save below code in FlushFTPLog.PS1 and Replace the parameter $siteName to your FTP site name;

  ```powershell
  Param($siteName = "Default Web Site")

  #Get MWA ServerManager
  [System.Reflection.Assembly]::LoadFrom( "C:\windows\system32\inetsrv\Microsoft.Web.Administration.dll" ) | Out-Null
  $serverManager = new-object Microsoft.Web.Administration.ServerManager

  $config = $serverManager.GetApplicationHostConfiguration()

  #Get Sites Collection
  $sitesSection = $config.GetSection("system.applicationHost/sites")
  $sitesCollection = $sitesSection.GetCollection()

  #Find Site
  foreach ($item in $sitesCollection){

    if ($item.Attributes.Item("Name").Value -eq $siteName){
        $site = $item
    }
  }
  #Validation
  if ($site -eq $null) {
    Write-Host "Site '$siteName' not found"
    return
  }

  #Flush the Logs
  $ftpServer = $site.ChildElements.Item("ftpServer")

  if (!($ftpServer.ChildElements.Count)){
    Write-Host "Site '$siteName' does not have FTP bindings set"
    return
  }

  $ftpServer.Methods.Item("FlushLog").CreateInstance().Execute()
  ```

- Run the powershell with administrator;

## IIS 服务器中禁用 8.3 短名

8.3兼容文件名称是指MS-DOS的文件命名约定。 这些约定将文件名限制为八个字符，并将可选扩展名限制为三个字符。短文件名的存在是为了兼容老的16位 MS-DOS程序，windows会自动为长文件名的文件生成带~的短文件名，成为漏洞的原因是可以在访问站点时使用通配符*来暴力猜测文件名，有被攻击的风险。
可以使用dir /x命令查看所有文件或者目录对应的8.3文件名，如下图所示。当长度超出限制时，系统就会创建短文件名（8.3兼容文件名）

- 参考 [How To Disable 8.3 file name creation on ntfs partitions](https://support.microsoft.com/en-us/help/121007/how-to-disable-8-3-file-name-creation-on-ntfs-partitions ) 先禁止8.3短文件名的创建，针对整个服务器有效，但只是禁止新的文件产生，旧的短文件依然存在

  - 在IIS服务器上用管理员身份启动CMD窗口，运行命令

    ```BAT
    fsutil.exe behavior set disable8dot3 1
    ```

  > ***注意事项：***
  >
  > 当命令中未指定盘符时，命令后的数字含义如下:
  >
  >   - 0 -> Enable 8dot3 name creation on all volumes on the system
  >   - 1 -> Disable 8dot3 name creation on all volumes on the system
  >   - 2 -> Set 8dot3 name creation on a per volume basis
  >   - 3 -> Disable 8dot3 name creation on all volumes except the system volume
  >
  > 当命令中指定盘符时，命令后的数字含义如下: 此时仅当注册表 NtfsDisable8dot3NameCreation 为2 时有含义：
  >   - 0 -> Enable 8dot3 name creation on this volume
  >   - 1 -> Disable 8dot3 name creation on this volume

  - 重启服务器，管理员身份打开CMD窗口，运行如下命令可以检查设置是否成功

    ```BAT
    fsutil.exe behavior query disable8dot3
    ```

  > ***注意事项：***
  >   - 该操作不需要重启电脑；
  >   - 该命令具体含义可以参考 [Fsutil behavior](https://docs.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2012-R2-and-2012/cc785435(v=ws.11))

  ---

  - 打开注册表，定位到如下注册表项HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\FileSystem

  - 设置NtfsDisable8dot3NameCreation值为1

  ![fsutil-8dot3name-REGISTRY](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/fsutil-8dot3name-REGISTRY.jpg)

  - 重启电脑使设置生效，生效以后对于新创建的文件或者目录，系统将不再产生短名,对于已经存在的文件或者目录请参考如下方法取消短名。
    - 复制当前文件夹并重命名为tempNew
    - 重命名当前文件夹为tempOld
    - 重命名tempNew为原始的文件名
  > ****注意****
  >
  > 虽然禁用8.3文件名能提升文件性能，但是一些16bit/32bit/64bit的程序可能找不到长文件/目录名。

- 对于已存在的旧文件，普通的站点，可以通过备份网站，删除原网站目录，再重新创建网站目录，恢复备份回来。如果是Exchange等大型复杂的站点，建议通过如下的命令行方式扫描修复:

  - 管理员身份启动CMD窗口，运行命令(将 "c:\inetpub\wwwroot" 替换为要扫描的网站跟目录)

    ```BAT
    fsutil 8dot3name scan /s /v c:\inetpub\wwwroot
    ```

    ![fsutil-8dot3name](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/fsutil-8dot3name.jpg)
    ![fsutil-8dot3name-result](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/fsutil-8dot3name-result.jpg)

  - 如果上述的扫描中发现有8dot3的文件，则使用下面的命令修复这些命名 (将 "c:\inetpub\wwwroot" 替换为要扫描的网站跟目录)

    ```BAT
    fsutil 8dot3name strip /s /v c:\inetpub\wwwroot
    ```

    ![fsutil-8dot3name-InIISFolder](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/fsutil-8dot3name-InIISFolder.jpg)

  - 修复完成后再使用scan来验证是否还有8dot3的文件存在,运行命令(将 "c:\inetpub\wwwroot" 替换为要扫描的网站跟目录)

    ```BAT
    fsutil 8dot3name scan /s /v c:\inetpub\wwwroot
    ```

    ![fsutil-8dot3name-RESCAN](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/fsutil-8dot3name-RESCAN.jpg)

> ***注意事项：***
>
> - 文件名+文件路径 长度> 260的文件不会删除短名，这可能会保留部分文件的短名，比如找到的带短名的文件有99566个，只修改了99369个。
>
> - 删除文件短名后，如果有注册表键值依赖这些短名，此命令会列出但不修改注册表，这可能会导致某些软件出错，比如无法被卸载。建议执行此命令前对目录或者磁盘做好备份。参考[](https://technet.microsoft.com/en-us/library/ff621566(v=ws.11).aspx)

## ETL trace for IIS

- 将以下命令行保存为 IIS.BAT

  ```BAT
  @echo off
  ECHO These commands will enable tracing:
  @echo on
  logman create trace "iis" -ow -o iis.etl -p "Microsoft-Windows-IIS" 0xffffffffffffffff 0xff -nb 16 16 -bs 1024 -mode Circular -f bincirc -max 4096 -ets
  logman create trace "winhttp_trace" -ow -o winhttp_trace.etl -p {B3A7698A-0C45-44DA-B73D-E181C9B5C8E6} 0xffffffffffffffff 0xff -nb 16 16 -bs 1024 -mode Circular -f bincirc -max 4096 -ets
  logman create trace "winhttp" -ow -o winhttp.etl -p "Microsoft-Windows-WinHttp" 0xffffffffffffffff 0xff -nb 16 16 -bs 1024 -mode Circular -f bincirc -max 4096 -ets

  logman create trace "schannel" -ow -o schannel.etl -p {37D2C3CD-C5D4-4587-8531-4696C44244C8} 0xffffffffffffffff 0xff -nb 16 16 -bs 1024 -mode Circular -f bincirc -max 4096 -ets
  logman update trace "schannel" -p "Microsoft-Windows-Schannel-Events" 0xffffffffffffffff 0xff -ets
  logman update trace "schannel" -p {44492B72-A8E2-4F20-B0AE-F1D437657C92} 0xffffffffffffffff 0xff -ets
  logman update trace "schannel" -p {37D2C3CD-C5D4-4587-8531-4696C44244C8} 0xffffffffffffffff 0xff -ets
  logman update trace "schannel" -p "Schannel" 0xffffffffffffffff 0xff -ets

  logman create trace "network" -ow -o network.etl -p "Microsoft-Windows-Winsock-AFD" 0xffffffffffffffff 0x4 -nb 16 16 -bs 1024 -mode Circular -f bincirc -max 4096 -ets
  logman update trace "network" -p "Microsoft-Windows-TCPIP" 0xffffffffffffffff 0x4 -ets
  logman update trace "network" -p "Microsoft-Windows-WFP" 0xffffffffffffffff 0x4 -ets
  logman update trace "network" -p "Microsoft-Windows-Windows Firewall With Advanced Security" 0xffffffffffffffff 0x5 -ets
  logman update trace "network" -p "Microsoft-Windows-Dhcp-Client" 0xffffffffffffffff 0x4 -ets
  logman update trace "network" -p "Microsoft-Windows-DHCPv6-Client" 0xffffffffffffffff 0x4 -ets
  logman update trace "network" -p "Microsoft-Windows-Dhcp-Nap-Enforcement-Client" 0xffffffffffffffff 0x4 -ets
  logman update trace "network" -p "Microsoft-Windows-NDIS" 0xffffffffffffffff 0x4 -ets
  logman update trace "network" -p "Microsoft-Windows-WWAN-SVC-EVENTS" 0xffffffffffffffff 0x4 -ets
  logman update trace "network" -p "Microsoft-Windows-WWAN-UI-EVENTS" 0xffffffffffffffff 0x4 -ets
  logman update trace "network" -p "Microsoft-Windows-WWAN-MM-EVENTS" 0xffffffffffffffff 0x4 -ets
  logman update trace "network" -p "Microsoft-Windows-WWAN-NDISUIO-EVENTS" 0xffffffffffffffff 0x4 -ets
  logman update trace "network" -p "Microsoft-Windows-NWiFi" 0xffffffffffffffff 0x4 -ets
  logman update trace "network" -p "Microsoft-Windows-VWiFi" 0xffffffffffffffff 0x5 -ets
  logman update trace "network" -p "Microsoft-Windows-L2NACP" 0xffffffffffffffff 0x4 -ets
  logman update trace "network" -p "Microsoft-Windows-WLAN-AutoConfig" 0xffffffffffffffff 0x4 -ets
  logman update trace "network" -p "Microsoft-Windows-EapHost" 0xffffffffffffffff 0x4 -ets
  logman update trace "network" -p "Microsoft-Windows-OneX" 0xffffffffffffffff 0x4 -ets
  logman update trace "network" -p "Microsoft-Windows-Wired-AutoConfig" 0xffffffffffffffff 0x4 -ets
  logman update trace "network" -p "Microsoft-Windows-Iphlpsvc-Trace" 0x800000000000000a 0x4 -ets
  logman update trace "network" -p "Microsoft-Windows-WebIO" 0xffffffffffffffff 0x5 -ets
  logman update trace "network" -p "Microsoft-Windows-BranchCacheEventProvider" 0xffffffffffffffff 0x5 -ets
  logman update trace "network" -p "Microsoft-Windows-BranchCacheClientEventProvider" 0xffffffffffffffff 0x5 -ets
  logman update trace "network" -p "Microsoft-Windows-NCSI" 0xffffffffffffffff 0x4 -ets
  logman update trace "network" -p "Microsoft-Windows-NlaSvc" 0xffffffffffffffff 0x4 -ets
  logman update trace "network" -p "Microsoft-Windows-NetworkProfile" 0xffffffffffffffff 0x4 -ets

  logman create trace "ntlm" -ow -o ntlm.etl -p "Microsoft-Windows-NTLM" 0xffffffffffffffff 0xff -nb 16 16 -bs 1024 -mode Circular -f bincirc -max 4096 -ets
  logman update trace "ntlm" -p "Microsoft-Windows-AuthenticationProvider" 0xffffffffffffffff 0xff -ets
  logman update trace "ntlm" -p {AC69AE5B-5B21-405F-8266-4424944A43E9} 0xffffffffffffffff 0xff -ets
  logman update trace "ntlm" -p {5BBB6C18-AA45-49B1-A15F-085F7ED0AA90} 0xffffffffffffffff 0xff -ets
  logman update trace "ntlm" -p {C92CF544-91B3-4DC0-8E11-C580339A0BF8} 0xffffffffffffffff 0xff -ets

  logman create trace "kerberos" -ow -o kerberos.etl -p {6B510852-3583-4E2D-AFFE-A67F9F223438} 0xffffffffffffffff 0xff -nb 16 16 -bs 1024 -mode Circular -f bincirc -max 4096 -ets
  logman update trace "kerberos" -p {BBA3ADD2-C229-4CDB-AE2B-57EB6966B0C4} 0xffffffffffffffff 0xff -ets
  logman update trace "kerberos" -p "Microsoft-Windows-Security-Kerberos" 0xffffffffffffffff 0xff -ets
  logman update trace "kerberos" -p {24DB8964-E6BC-11D1-916A-0000F8045B04} 0xffffffffffffffff 0xff -ets
  logman update trace "kerberos" -p "Microsoft-Windows-Kerberos-Key-Distribution-Center" 0xffffffffffffffff 0xff -ets
  logman update trace "kerberos" -p "Microsoft-Windows-KDCPW-WPP" 0xffffffffffffffff 0xff -ets
  logman update trace "kerberos" -p "Microsoft-Windows-KPSSVC-WPP" 0xffffffffffffffff 0xff -ets
  logman update trace "kerberos" -p {6C51FAD2-BA7C-49B8-BF53-E60085C13D92} 0xffffffffffffffff 0xff -ets
  logman update trace "kerberos" -p "Microsoft-Windows-AuthenticationProvider" 0xffffffffffffffff 0xff -ets
  logman update trace "kerberos" -p {97A38277-13C0-4394-A0B2-2A70B465D64F} 0xffffffffffffffff 0xff -ets
  logman update trace "kerberos" -p {FACB33C4-4513-4C38-AD1E-57C1F6828FC0} 0xffffffffffffffff 0xff -ets
  logman update trace "kerberos" -p {60A7AB7A-BC57-43E9-B78A-A1D516577AE3} 0xffffffffffffffff 0xff -ets
  logman update trace "kerberos" -p {1BBA8B19-7F31-43C0-9643-6E911F79A06B} 0xffffffffffffffff 0xff -ets

  logman create trace "winlogon" -ow -o winlogon.etl -p "Microsoft-Windows-Winlogon" 0xffffffffffffffff 0xff -nb 16 16 -bs 1024 -mode Circular -f bincirc -max 4096 -ets
  logman update trace "winlogon" -p {D451642C-63A6-11D7-9720-00B0D03E0347} 0xffffffffffffffff 0xff -ets
  logman update trace "winlogon" -p {D9391D66-EE23-4568-B3FE-876580B31530} 0xffffffffffffffff 0xff -ets
  logman update trace "winlogon" -p {63665931-A4EE-47B3-874D-5155A5CFB415} 0xffffffffffffffff 0xff -ets
  logman update trace "winlogon" -p {855ED56A-6120-4564-B083-34CB9D598A22} 0xffffffffffffffff 0xff -ets
  logman update trace "winlogon" -p {D138F9A7-0013-46A6-ADCC-A3CE6C46525F} 0xffffffffffffffff 0xff -ets
  logman update trace "winlogon" -p {C127C1A8-6CEB-11DA-8BDE-F66BAD1E3F3A} 0xffffffffffffffff 0xff -ets
  logman update trace "winlogon" -p {BFA655DC-6C51-11DA-8BDE-F66BAD1E3F3A} 0xffffffffffffffff 0xff -ets
  logman update trace "winlogon" -p {301779E2-227D-4FAF-AD44-664501302D03} 0xffffffffffffffff 0xff -ets
  logman update trace "winlogon" -p {19D78D7D-476C-47B6-A484-285D1290A1F3} 0xffffffffffffffff 0xff -ets
  logman update trace "winlogon" -p {A789EFEB-FC8A-4C55-8301-C2D443B933C0} 0xffffffffffffffff 0xff -ets
  logman update trace "winlogon" -p {C2BA06E2-F7CE-44AA-9E7E-62652CDEFE97} 0xffffffffffffffff 0xff -ets

  logman create trace "dns" -ow -o dns.etl -p "Microsoft-Windows-DNS-Client" 0xffffffffffffffff 0xff -nb 16 16 -bs 1024 -mode Circular -f bincirc -max 4096 -ets
  logman update trace "dns" -p {1540FF4C-3FD7-4BBA-9938-1D1BF31573A7} 0xffffffffffffffff 0xff -ets
  logman update trace "dns" -p {9CA335ED-C0A6-4B4D-B084-9C9B5143AFF0} 0xffffffffffffffff 0xff -ets
  logman update trace "dns" -p {367B7A5F-319C-4E40-A9F8-8856095389C7} 0xffffffffffffffff 0xff -ets
  logman update trace "dns" -p {609151DD-04F5-4DA7-974C-FC6947EAA323} 0xffffffffffffffff 0xff -ets
  logman update trace "dns" -p "Microsoft-Windows-Networking-ServiceDiscovery-Dnssd" 0xffffffffffffffff 0xff -ets

  logman create trace "iis_all" -ow -o iis_all.etl -p "Microsoft-Windows-IIS-Configuration" 0xffffffffffffffff 0xff -nb 16 16 -bs 1024 -mode Circular -f bincirc -max 4096 -ets
  logman update trace "iis_all" -p "Microsoft-Windows-IIS-IisMetabaseAudit" 0xffffffffffffffff 0xff -ets
  logman update trace "iis_all" -p "Microsoft-Windows-IIS-IISReset" 0xffffffffffffffff 0xff -ets
  logman update trace "iis_all" -p "Microsoft-Windows-IIS-W3SVC-WP" 0xffffffffffffffff 0xff -ets
  logman update trace "iis_all" -p "Microsoft-Windows-IIS-W3SVC-PerfCounters" 0xffffffffffffffff 0xff -ets
  logman update trace "iis_all" -p "Microsoft-Windows-WAS-ListenerAdapter" 0xffffffffffffffff 0xff -ets
  logman update trace "iis_all" -p "Microsoft-Windows-WAS" 0xffffffffffffffff 0xff -ets
  logman update trace "iis_all" -p "Microsoft-Windows-IIS-W3SVC" 0xffffffffffffffff 0xff -ets
  logman update trace "iis_all" -p "Microsoft-Windows-IIS-WMSVC" 0xffffffffffffffff 0xff -ets
  logman update trace "iis_all" -p "Microsoft-Windows-IIS-APPHOSTSVC" 0xffffffffffffffff 0xff -ets
  logman update trace "iis_all" -p "Microsoft-Windows-W3LOGSVC" 0xffffffffffffffff 0xff -ets
  logman update trace "iis_all" -p "Microsoft-Windows-IIS-Logging" 0xffffffffffffffff 0xff -ets
  logman update trace "iis_all" -p {3A2A4E84-4C21-4981-AE10-3FDA0D9B0F83} 0xffffffffffffffff 0xff -ets
  logman update trace "iis_all" -p {D55D3BC9-CBA9-44DF-827E-132D3A4596C2} 0xffffffffffffffff 0xff -ets
  logman update trace "iis_all" -p {A1C2040E-8840-4C31-BA11-9871031A19EA} 0xffffffffffffffff 0xff -ets
  logman update trace "iis_all" -p {DC1271C2-A0AF-400F-850C-4E42FE16BE1C} 0xffffffffffffffff 0xff -ets
  logman update trace "iis_all" -p "Microsoft-Windows-IIS-CentralCertificateProvider" 0xffffffffffffffff 0xff -ets
  logman update trace "iis_all" -p {06B94D9A-B15E-456E-A4EF-37C984A2CB4B} 0xffffffffffffffff 0xff -ets
  logman update trace "iis_all" -p "Microsoft-Windows-Application Server-System Services IIS Manager" 0xffffffffffffffff 0xff -ets

  logman create trace "ftp" -ow -o ftp_all.etl -p "Microsoft-Windows-IIS-FTP" 0xffffffffffffffff 0xff -nb 16 16 -bs 1024 -mode Circular -f bincirc -max 4096 -ets
  logman update trace "ftp" -p "Microsoft-Windows-FTPSVC" 0xffffffffffffffff 0xff -ets
  logman update trace "ftp" -p {08AB3B7F-DE13-445E-8331-745FD7183ECB} 0xffffffffffffffff 0xff -ets

  logman create trace "httpsys" -ow -o httpsys.etl -p {DD5EF90A-6398-47A4-AD34-4DCECDEF795F} 0xffffffffffffffff 0xff -nb 16 16 -bs 1024 -mode Circular -f bincirc -max 4096 -ets
  logman update trace "httpsys" -p {B1945E15-4933-460F-8103-AA611DDB663A} 0xffffffffffffffff 0xff -ets
  logman update trace "httpsys" -p {20F61733-57F1-4127-9F48-4AB7A9308AE2} 0xffffffffffffffff 0xff -ets
  logman update trace "httpsys" -p "Microsoft-Windows-HttpLog" 0xffffffffffffffff 0xff -ets
  logman update trace "httpsys" -p "Microsoft-Windows-HttpService" 0xffffffffffffffff 0xff -ets
  logman update trace "httpsys" -p "Microsoft-Windows-HttpEvent" 0xffffffffffffffff 0xff -ets
  logman update trace "httpsys" -p "Microsoft-Windows-Http-SQM-Provider" 0xffffffffffffffff 0xff -ets

  @echo off
  echo
  ECHO Reproduce your issue and enter any key to stop tracing
  @echo on
  pause
  logman stop "iis" -ets
  logman stop "schannel" -ets
  logman stop "network" -ets
  logman stop "ntlm" -ets
  logman stop "kerberos" -ets
  logman stop "dns" -ets
  logman stop "httpsys" -ets
  logman stop "iis_all" -ets
  logman stop "ftp" -ets
  logman stop "winhttp_trace" -ets
  logman stop "winhttp" -ets
  logman stop "winlogon" -ets
  ```

  - 以管理员权限运行该脚本，并复现问题；

  - 问题复现后，按任意键结束收集并等待日志写入文件；

  - 收集结束后日志存放于 C:\Windows\system32 路径中。
