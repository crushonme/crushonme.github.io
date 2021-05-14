---
layout: post
title: Failed Add Microsoft ActiveX Data Objects Library as Reference
categories: dotnet
description: 
keywords: ADO,Reference,COM
---

Sometimes we will get a yellow exclamation mark when we add Microsoft ActiveX Data Object Library (or other COM library) as Referrence. And we usuarly will get error **"The 'ResolveComReference' task returned false but did not log an error."** When we build the project.

![YellowMarkWithReference](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/YellowMarkWithReference.png)
![Error](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/errer.png)

## Anlaysis

When we got these issues, we should know what's the subject and get objects from our test and logs. After collect all subject and object, we can make assumption and use the assumption to test the objects. If all objects get Yes answer with the assumption, the reason should be most possible reason.

### Subject

- There is a yellow exclamation mask on the icon;
- Error occur when build the project;
- The issue only occur on part of machine;

### Object

- ResolveComReference task returned false and did not log an error; it means that we can get more details from the msbuild verborse log;
  - Set the msbuild log level to verborse and check the log. We get below error logs:

    ```log
    1>  Resolving COM reference for item "ADODB" with a wrapper "primary".
    1>  Determining dependencies of the COM reference "ADODB".
    1>  Resolving COM reference dependency "00020430-0000-0000-c000-000000000046" version 2.0.
    1>  Resolved COM reference dependency "00020430-0000-0000-c000-000000000046" version 2.0:     "C:\WINDOWS\assembly\GAC\stdole\7.0.3300.0__b03f5f7f11d50a3a\stdole.dll"
    1>  C:\Program Files (x86)\Microsoft Visual Studio\2019\Community\MSBuild\Current\Bin\Microsoft.    Common.CurrentVersion.targets(2805,5): warning MSB3283: 
    2>  Cannot find wrapper assembly for type library "ADODB". Verify that (1) the COM component is registered correctly and (2) your target platform is the same as the bitness of the COM     component. For example, if the COM component is 32-bit, your target platform must not be 64-bit.
    1>C:\Program Files (x86)\Microsoft Visual Studio\2019\Community\MSBuild\Current\Bin\Microsoft.    Common.CurrentVersion.targets(2805,5): error MSB4181: The "ResolveComReference" task returned     false but did not log an error.
    ```

  - Msbuild log without issue:

    ```log
    1>  Resolving COM reference for item "ADODB" with a wrapper "primary". (TaskId:22)
    1>  Determining dependencies of the COM reference "ADODB". (TaskId:22)
    1>  Resolving COM reference dependency "00020430-0000-0000-c000-000000000046" version 2.0.     (TaskId:22)
    1>  Resolved COM reference dependency "00020430-0000-0000-c000-000000000046" version 2.0:     "C:\WINDOWS\assembly\GAC\stdole\7.0.3300.0__b03f5f7f11d50a3a\stdole.dll" (TaskId:22)
    1>  Resolved COM reference for item "ADODB": "C:\WINDOWS\assembly\GAC\ADODB\7.0.3300.    0__b03f5f7f11d50a3a\ADODB.dll". (TaskId:22)
    ```

  > **Aanalysis:** After comparing the msbuild logs, we can see the error occur after resolving the dependence of stdole.dll. It tried to solve the COM reference of ADODB.dll and then the error occur. It suggest us to check below condition:
  >
  > - The COM component is registered correctly
  > - Target platform is the same as the bitness of the COM     component (bitness and platform).
  >
  > So how to check above two condition?
  > ***We can check it from Process Monitor logs.***

- During compare the project with none issue machine, we found that the wrappertool property of COMReference is **tlbimp**.

> **Note:** Default wrappertool property is **primary**.

- On the bad machine, we can modify the wrappertool property to tlbimp to workaround the issue.

### Assumption

- As we can reference other none-COM library and the issue is not reproable on most of machine, it should be related with COM object installation or configuration.
  - Registry corruption or missing
  - Failed to registering (This assumption did not meet the fact of the issue can be workaround with changing wrappertool property to tlbimp.)

### Planning

From above analysis, we should capture Process Monitor log when the issue reproduced.

### Result

After comparing the difference from Process Monitor log, we got below result: There is no **Primary**InteropAssemblyName for Microsoft Activex Object 2.7 Library.
![PrimaryInteropAssemblyName](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/PrimaryInteropAssemblyName.png)

## Confirm the issue

- Back up registry key in  HKCR\TypeLib\{EF53050B-882E-4776-B643-EDA472E8E3F2} and then delete the PrimaryInteropAssemblyName registry key under **HKCR\TypeLib\{EF53050B-882E-4776-B643-EDA472E8E3F2}\2.7**
- Create a blank C# console project and add Microsoft ActiveX Data Objects 2.6 Library as COM reference.
![ReferenceManager](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/ReferenceManager.png)

- Then we will see the issue reproduced.

## Summary

There are lots of same issue recording in google researcher. However none of them addressed the root cause.This blog recorded the process of troubleshotting error during add ADO 2.6 as COM reference. Maybe your issue did not have same root cause with it. However you can use the same process to figure out the root cause. Hope it's helpful. Good Luck!
