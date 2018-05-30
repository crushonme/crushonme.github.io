---
layout: post
title: 使用 HTTPS 协议时实时通话系统响应延迟
categories: WEB
description: 基于 .NET Framework 4.5 开发的 CS 架构系统，在使用过程中偶发出现 HTTPS 请求延迟 12 秒左右才到达服务器端
keywords: HTTPS, Proxy
---

问题现象：基于 .NET Framework 4.5 开发的 CS 架构系统，在使用过程中偶发出现 HTTPS 请求延迟 12 秒左右才到达服务器端。


一般而言对于 HTTPS 请求出现响应延迟通常需要抓取网络包分析排查。经过抓包确认，请求在第一时间发出并且 TLS 握手也正常进行，但一直未传送 Application Data，直到 11 秒后才将 Application Data 字段发送给 Server 端。

![HTTPS Delay](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/HTTPS-Delay.jpg)

通过网络包分析发现是由于应用未及时发送 Application Data 导致，想进一步确认问题，则需要抓取 DUMP。当前问题是偶发性问题，为了增加复现问题的概率，我们写了一个测试程序，用于模拟生产环境中的请求并将请求间隔设置为 30 秒（防止 Server 端过载）一个请求，一旦 3秒内未收到响应则触发产生 DUMP。

经过复现并分析 DUMP，发现该问题主要有两个原因：

1. 环境中无法访问外网，导致在完成 SSL 握手后一直无法验证证书的有效性，直至 15秒超时。

   ```
   0:011> kcL
   # 
   00 ntdll!ZwWaitForSingleObject
   01 kernel32!WaitForSingleObjectExImplementation
   02 cryptnet!CryptRetrieveObjectByUrlWithTimeout
   03 cryptnet!CryptRetrieveObjectByUrlW
   04 crypt32!ChainRetrieveObjectByUrlW
   05 crypt32!CCertChainEngine::RetrieveAuthRootAutoUpdateObjectByUrlW
   06 crypt32!CCertChainEngine::GetAuthRootAutoUpdateCtl
   07 crypt32!ChainGetAuthRootAutoUpdateStatus
   08 crypt32!CCertObject::CCertObject
   09 crypt32!ChainCreateCertObject
   0a crypt32!CCertChainEngine::CreateChainContextFromPathGraph
   0b crypt32!CCertChainEngine::GetChainContext
   0c crypt32!CertGetCertificateChain
   ……
   0f System_ni!System.Security.Cryptography.X509Certificates.X509Chain.Build(System.Security.Cryptography.X509Certificates.X509Certificate2)
   10 System_ni!System.Net.Security.SecureChannel.VerifyRemoteCertificate(System.Net.Security.RemoteCertValidationCallback)
   11 System_ni!System.Net.Security.SslState.CompleteHandshake()
   ……
   3f System_ni!System.Net.HttpWebRequest.GetResponse()
   40 HttpsDelayTestDemo!HttpUtil.excute(System.String, EHttpMethod)
   41 HttpsDelayTestDemo!HttpsDelayTestDemo.Form1+<>c__DisplayClass4.<button1_Click>b__2(System.Object, System.Timers.ElapsedEventArgs)
   ……
   5a ntdll!__RtlUserThreadStart
   5b ntdll!_RtlUserThreadStart
   0:011> .frame /r 2;dv
   02 070be75c 6ec96c96 cryptnet!CryptRetrieveObjectByUrlWithTimeout+0x1a3 
   eax=00000000 ebx=00000000 ecx=00000000 edx=00000000 esi=00000724 edi=070be6ec
   eip=6ec971fd esp=070be730 ebp=070be75c iopl=0         nv up ei pl zr na pe nc
   cs=0023  ss=002b  ds=002b  es=002b  fs=0053  gs=002b             efl=00000246
   cryptnet!CryptRetrieveObjectByUrlWithTimeout+0x1a3:
   6ec971fd bf1891ca6e      mov     edi,offset cryptnet!CrobuCriticalSection (6eca9118)
            pwszUrl = 0x00280860 "http://www.download.windowsupdate.com/msdownload/update/v3/static/trustedr/en/authrootstl.cab"
       pszObjectOid = 0x00000000 ""
   dwRetrievalFlags = 0x205004
          dwTimeout = 0x3a98
          ppvObject = 0x070be9a4
           pAuxInfo = 0x070be904
     hCertDiagEvent = 0x00000000
         dwThreadId = 0x8390
            hThread = 0x00000000
              dwErr = 0x6eca9118
            fResult = 0n188
             hToken = 0x00000000
   0:011> ? 0x3a98
   Evaluate expression: 15000 = 00003a98
   ```

   针对于这种情况，我们可以在代码中添加如下部分规避：

   ```
   ServicePointManager.ServerCertificateValidationCallback += (sender, cert, chain, sslPolicyErrors) => true;
   ```

2. 当客户环境中代理有变化或者存在重定向，则需要重新调用 [FindServicePoint](https://referencesource.microsoft.com/#System/net/System/Net/HttpWebRequest.cs,ecdcaa940c7526e4)。而在做  [FindServicePoint](https://referencesource.microsoft.com/#System/net/System/Net/HttpWebRequest.cs,ecdcaa940c7526e4) 的过程中，会调用 [WinHttpGetProxyForUrl](https://msdn.microsoft.com/en-us/library/windows/desktop/aa384097(v=vs.85).aspx)。[WinHttpGetProxyForUrl](https://msdn.microsoft.com/en-us/library/windows/desktop/aa384097(v=vs.85).aspx) 是通过自动检测的方式查找指定的 URL 查找代理设置。而自动检测脚本过程是一个同步阻塞的过程，因此会导致性能问题。详细的可以参考 MSDN 的描述。

   ```
   FindServicePoint:
   This calls the FindServicePoint off of the ServicePointManager
   to determine what ServicePoint to use.  When our proxy changes,
   or there is a redirect, this should be recalled to determine it.
   
   WinHttpGetProxyForUrl：
   This function implements the Web Proxy Auto-Discovery (WPAD) protocol for automatically configuring the proxy settings for an HTTP request. The WPAD protocol downloads a Proxy Auto-Configuration (PAC) file, which is a script that identifies the proxy server to use for a given target URL. PAC files are typically deployed by the IT department within a corporate network environment. The URL of the PAC file can either be specified explicitly or WinHttpGetProxyForUrl can be instructed to automatically discover the location of the PAC file on the local network.
   
   AutoProxy Issues in WinHTTP：Performance Considerations
   The auto-detection process can be slow, possibly as long as several seconds. The WinHttpGetProxyForUrl and WinHttpDetectAutoProxyConfigUrl functions are blocking, synchronous functions. It could be that one particular auto-detection mechanism (such as DHCP) is much slower than the other (such as DNS). If both the WINHTTP_AUTO_DETECT_TYPE_DHCP and WINHTTP_AUTO_DETECT_TYPE_DNS_A auto-detection flags are specified, WinHTTP uses DHCP first, in accordance with the WPAD specification. If no PAC URL is discovered by issuing a DHCP request, then WinHTTP tries to locate the PAC file at a well-known DNS address.
   
   WinHttpGetProxyForUrl uses the WinHTTP Session handle parameter for caching the PAC file and the results of auto-detection. It is best to use the same session handle for multiple WinHttpGetProxyForUrl calls if possible to avoid repeated PAC URL detection and file downloading. The PAC file is cached in-memory only, and is discarded when the application closes the session handle.
   
   Because of the performance impact of autoproxy, it is recommended that only desktop client applications or services use the feature; server-based applications should rely on the server administrator using the "ProxyCfg.exe" utility.
   ```

   针对这种情况，我们可以在代码中创建一个空代理设置，避免自动检查代理设置，详细解释可以参考 [Automatic Proxy Detection](https://docs.microsoft.com/en-us/dotnet/framework/network-programming/automatic-proxy-detection)。

   ```
   public static void DisableForMyRequest (Uri resource)  
   {  
       WebRequest request = WebRequest.Create (resource);  
       request.Proxy = null;  
       WebResponse response = request.GetResponse ();  
   }  
   ```

   

Reference：

- [FindServicePoint](https://referencesource.microsoft.com/#System/net/System/Net/HttpWebRequest.cs,ecdcaa940c7526e4)
- [WinHttpGetProxyForUrl](https://msdn.microsoft.com/en-us/library/windows/desktop/aa384097(v=vs.85).aspx)
- [VerifyRemoteCertificate](https://referencesource.microsoft.com/#System/net/System/Net/_SecureChannel.cs,629d8ef27d758949)
- [CertGetCertificateChain](https://msdn.microsoft.com/en-us/library/windows/desktop/aa376078(v=vs.85).aspx)
- [Automatic Proxy Detection](https://docs.microsoft.com/en-us/dotnet/framework/network-programming/automatic-proxy-detection)