---
layout: post
title: Error occur when install application which packaged with CefSharp.Wpf.dll using MSIX Packaging Tool.
categories: VisualStudio
description: 
keywords: VisualStudio,CEFSharp.WPF,MSIX,PRI222,PRI175
---

Error occur when install application which packaged with CefSharp.Wpf.dll using MSIX Packaging Tool.Below is the errors:
1>C:\Program Files (x86)\Windows Kits\10\bin\10.0.18362.0\x64\MakePri.exe New -ProjectRoot obj\x64\Release\PackageLayout\ -ConfigXml obj\x64\Release\filemap.priconfig.xml -OutputFile obj\x64\Release\filemap.pri -IndexName 1be397bb-8ae9-4452-9549-7bcbbde828d9 -MappingFile AppX -Verbose -Overwrite  
1>PRI175: 0x8007000b - Processing Resources failed with error: An attempt was made to load a program with an incorrect format.
1>
1>
1>PRI222: 0xdef00001 - Unspecified error occurred.
## Troubleshotting

- From the output of error, we know that the error occur during the below command. In the command, we know that filemap.priconfig.xml is an input file for MakePri.exe. So there should be some error in the xml file or other temp files in the processing. After checked the xml, we did not find any error.
  ```
  C:\Program Files (x86)\Windows Kits\10\bin\10.0.18362.0\x64\MakePri.exe New -ProjectRoot obj\x64\Release\PackageLayout\ -ConfigXml obj\x64\Release\filemap.priconfig.xml -OutputFile obj\x64\Release\filemap.pri -IndexName 1be397bb-8ae9-4452-9549-7bcbbde828d9 -MappingFile AppX -Verbose -Overwrite  
  ```

- When we get this type of issue, we can change the "MSBuild project build log file verbosity" level from Minimal to Normal/Detail/Dianostic.  So that we can get more details about the error.

  > Note: [Get more details about MSBuild project build log file verbosity level](https://docs.microsoft.com/en-us/visualstudio/ide/how-to-view-save-and-configure-build-log-files?view=vs-2019)

- After enable the Dianostic log, we will get the context of target error. For current issue, we will get below output from build log. So we check the file of filtered.package.layout.resfiles. 
  ```
  1>C:\Program Files (x86)\Windows Kits\10\bin\10.0.18362.0\x64\MakePri.exe New -ProjectRoot obj\x64\Release\PackageLayout\ -ConfigXml obj\x64\Release\filemap.priconfig.xml -OutputFile obj\x64\Release\filemap.pri -IndexName 1be397bb-8ae9-4452-9549-7bcbbde828d9 -MappingFile AppX -Verbose -Overwrite  
  1>Option Verbose specified
  1>Option Overwrite specified
  1>Index Pass Completed: D:\problem\120072026001140\packagebyMSIX\Setup\obj\x64\Release\filtered.package.layout.resfiles
  1>AlternateForm Qualifiers: UNPLATED
  1>Scale Qualifiers: 200
  1>TargetSize Qualifiers: 24
  1>
  1>PRI175: 0x8007000b - Processing Resources failed with error: An attempt was made to load a program with an incorrect format.
  1>
  1>
  1>PRI222: 0xdef00001 - Unspecified error occurred.
  ```

  - In the file of filtered.package.layout.resfiles, there are several path list below. We guessed it should the RCA.
    ```powershell
    Main\.\cef.pak
    Main\.\cef_100_percent.pak
    Main\.\cef_200_percent.pak
    Main\.\cef_extensions.pak
    Main\.\CefSharp.BrowserSubprocess.Core.dll
    Main\.\CefSharp.BrowserSubprocess.exe
    Main\.\CefSharp.Core.dll
    ……
    Main\.\locales\tr.pak
    Main\.\locales\uk.pak
    Main\.\locales\vi.pak
    Main\.\locales\zh-CN.pak
    Main\.\locales\zh-TW.pak
    Main\.\README.txt
    Main\.\snapshot_blob.bin
    Main\.\swiftshader\libEGL.dll
    Main\.\swiftshader\libGLESv2.dll
    Main\.\v8_context_snapshot.bin
    ```

  - So we search "Main\\.\\" in the building log, we got below errors:
    ```
    1>Creating hard link to copy "C:\Users\xxxx\.nuget\packages\cef.redist.x64\83.4.2\CEF\cef.pak" to "obj\x64\Release\PackageLayout\Main\.  \cef.pak".
    1>Creating hard link to copy "C:\Users\xxxx\.nuget\packages\cef.redist.x64\83.4.2\CEF\cef_100_percent.pak" to     "obj\x64\Release\PackageLayout\Main\.\cef_100_percent.pak".
    1>Creating hard link to copy "C:\Users\xxxx\.nuget\packages\cef.redist.x64\83.4.2\CEF\cef_200_percent.pak" to     "obj\x64\Release\PackageLayout\Main\.\cef_200_percent.pak".
    1>Creating hard link to copy "C:\Users\xxxx\.nuget\packages\cef.redist.x64\83.4.2\CEF\cef_extensions.pak" to     "obj\x64\Release\PackageLayout\Main\.\cef_extensions.pak".
    1>Could not use a link to copy "C:\Users\xxxx\.nuget\packages\cef.redist.x64\83.4.2\CEF\cef_200_percent.pak" to     "obj\x64\Release\PackageLayout\Main\.\cef_200_percent.pak". Copying the file instead. The system cannot move the file to a different   disk   drive. (Exception from HRESULT: 0x80070011)
    1>Could not use a link to copy "C:\Users\xxxx\.nuget\packages\cef.redist.x64\83.4.2\CEF\cef.pak" to "obj\x64\Release\PackageLayout\Main\.    \cef.pak". Copying the file instead. The system cannot move the file to a different disk drive. (Exception from HRESULT: 0x80070011)
    1>Could not use a link to copy "C:\Users\xxxx\.nuget\packages\cef.redist.x64\83.4.2\CEF\cef_100_percent.pak" to     "obj\x64\Release\PackageLayout\Main\.\cef_100_percent.pak". Copying the file instead. The system cannot move the file to a different   disk   drive. (Exception from HRESULT: 0x80070011)
    1>Copying file from "C:\Users\xxxx\.nuget\packages\cef.redist.x64\83.4.2\CEF\cef.pak" to     "D:\problem\120072026001140\packagebyMSIX\Setup\obj\x64\Release\PackageLayout\Main\cef.pak".
    1>Copying file from "C:\Users\xxxx\.nuget\packages\cef.redist.x64\83.4.2\CEF\cef_200_percent.pak" to     "D:\problem\120072026001140\packagebyMSIX\Setup\obj\x64\Release\PackageLayout\Main\cef_200_percent.pak".
    1>Could not use a link to copy "C:\Users\xxxx\.nuget\packages\cef.redist.x64\83.4.2\CEF\cef_extensions.pak" to     "obj\x64\Release\PackageLayout\Main\.\cef_extensions.pak". Copying the file instead. The system cannot move the file to a different disk     drive. (Exception from HRESULT: 0x80070011)
    ```
  - Then we replaced all "Main\\.\\" to "Main\\" and then mannually run below command: The command will be successfully competed.
    ```
    MakePri.exe New -ProjectRoot obj\x64\Release\PackageLayout\ -ConfigXml obj\x64\Release\filemap.priconfig.xml -OutputFile obj\x64\Release\filemap.pri -IndexName 1be397bb-8ae9-4452-9549-7bcbbde828d9 -MappingFile AppX -Verbose -Overwrite
    Option Verbose specified
    Option Overwrite specified
    Index Pass Completed: D:\problem\120072026001140\packagebyMSIX\Setup\obj\x64\Release\filtered.package.layout.resfiles
    AlternateForm Qualifiers: UNPLATED
    Scale Qualifiers: 200
    TargetSize Qualifiers: 24
    
    Finished building
    Version: 1.0
    Resource Map Name: 1be397bb-8ae9-4452-9549-7bcbbde828d9
    Named Resources: 361
    
    Resource File: filemap.pri
    Version: 1.0
    Resource Candidates: 362
    AlternateForm Qualifiers: UNPLATED
    Scale Qualifiers: 200
    TargetSize Qualifiers: 24
    
    Successfully Completed
    ```

## Solution

After figuring out the RCA, we can workaround the issue by adding a custom task to remove these unexpected string. Below is the steps:

  - Copy filtered.package.layout.resfiles to your Setup project folder;
  - Replace \.\ to \
  - Add below code to your setup project configuration
    ```xml
    <Target Name="CustomPriFileGeneration" AfterTargets="_CreatePriConfigXmlForMainPackageFileMap" Condition=" '$(Configuration)'=='Release' ">
    <Copy SourceFiles="$(ProjectDir)filtered.package.layout.resfiles" DestinationFolder="$(BaseIntermediateOutputPath)\$(Platform)\$(Configuration)" />
    </Target>
    ```

> Note
>
> Actualy it's a bug of Visual Studio 16.7 and 16.8 Preview 3 fixed the issue.