---
layout: post
title: How to decrypt TLS package on Windows?
categories: SQLDB
description: N/A
keywords: Azure SQL Database,sqldb,TDS,tds 7.4,tds 8.0
---

Transport Layer Security (TLS) provides security in the communication between two hosts. It provides integrity, authentication and confidentiality. It is used most commonly in web browsers, but can be used with any protocol that uses TCP as the transport layer.

Since TLS traffic was encoded, it makes troubleshooting traffic issue more difficault. In this document, we summarized the methods to decrypt TLS package on Windows.

## SSLKEYLOGFILE
SSLKEYLOGFILE is a feature provided by Chrome and Firefox that logs the pre-master secret to a file (specified by the SSLKEYLOGFILE environment variable) during TLS negotiation. The format of the file is documented here: [Key Log Format](https://developer.mozilla.org/en-US/docs/Mozilla/Projects/NSS/Key_Log_Format).

For HTTPS trafic, most of web broswers support for SSLKEYLOGFILE, we can follow the document of [TLS Decryption Using the (Pre)-Master-Secret](https://wiki.wireshark.org/TLS#using-the-pre-master-secret) to decrypt HTTPS traffic.

## Applications do not support SSLKEYLOGFILE

However when we want to decode other protocols like TDS, our client application do not support SSLKEYLOGFILE. How to decrypt it?

[Decrypting Schannel TLS traffic. Part 1. Getting secrets from lsass](https://b.poc.fun/decrypting-schannel-tls-part-1) introduced a method to export pre-master secret by hookng LSASS.exe.

[Getting schannel secrets from lsass memory](https://github.com/ngo/win-frida-scripts/tree/master/lsasslkeylog-easy) providd detail steps to export pre-master secret with above method.

> ***NOTES***
>
> LSA protection was enforced on Windows 11 version 22H2 and later. We need to disable it before hooking LSASS.exe.
> 
> ```
> reg add "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Lsa" /v RunAsPPL /t REG_DWORD /d 0 /f
> ```
>
> Refer to [Configure added LSA protection](https://learn.microsoft.com/en-us/windows-server/security/credentials-protection-and-management/configuring-additional-lsa-protection#disable-lsa-protection)