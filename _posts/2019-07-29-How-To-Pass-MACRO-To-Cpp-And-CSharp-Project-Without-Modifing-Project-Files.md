---
layout: post
title: 如何在不修改工程文件的前提下通过 MSBuild 添加宏定义
categories: Visual Studio
description: 本文举例说明如何在不修改工程文件的前提下通过 MSBuild 添加宏定义。
keywords: Msbuild, CI,VisualStudio
---


在某些场景下我们需要通过条件编译宏来控制编译不同的版本，如多平台支持，调试版本等等。在 Visual Studio 中集成了条件编译控制的部分，我们可以通过选择不同的编译平台，添加不同的条件编译宏来控制编译。但对于敏捷开发中，我们通常使用 MSBuild 编译脚本构建自动编译系统进而实现快速编译验证，快速迭代。因此我们需要通过 MSBuild 命令行的方式传递对应的宏定义给 VS 工程文件实现脚本控制条件编译。



# 实现方式

由于条件编译对于 C++ 工程和 C# 工程的实现差异，我们需要考虑分别对于这两种工程做处理。对于 C++ 项目中，条件编译宏是通过 MSVC 的编译选项 [PreprocessorDefinitions](https://docs.microsoft.com/en-us/cpp/build/reference/d-preprocessor-definitions?view=vs-2019) 实现， 而 C# 项目中则是通过 CSC 的编译选项 [Define](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/compiler-options/define-compiler-option) 实现。 

## C++ 工程

对于 C++ 工程，我们可以考虑使用在编译前添加对应的 PreprocessorDefinitions 变量进而实现将条件编译宏传递工程文件，具体实现步骤如下：

- 创建一个props文件，如 Cpp.props，将以下内容添加至该文件,其中 TESTMSBUILD 为我们需要定义的宏

  ```xml
  <?xml version="1.0" encoding="utf-8"?> 
  <Project xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
    <ItemDefinitionGroup>
      <ClCompile>
        <PreprocessorDefinitions>
            %(PreprocessorDefinitions);TESTMSBUILD
        </PreprocessorDefinitions>
      </ClCompile>
    </ItemDefinitionGroup>
  </Project>
  ```

- 使用参数 [ForceImportBeforeCppTargets](https://docs.microsoft.com/en-us/cpp/build/modify-project-properties-without-changing-project-file?view=vs-2019) 将该属性文件中定义的属性导入到工程中：

  ```
  msbuild Test.sln /p:ForceImportBeforeCppTargets="C:\Users\xxx\Cpp.props" /t:rebuild
  ```

- 对应的测试工程可以使用最简单的Win32 程序测试，如下：

  ```c++
  #include "pch.h"
  #include <iostream>
  
  int main()
  {
      #ifdef TESTMSBUILD
          std::cout << "Test Msbuild Hello World!\n";
      #else
          std::cout << "Hello World!\n";
      #endif // TESTMSBUILD
  }
  ```

- 对应的编译结果如下：

  ```
  C:\xx\Test>msbuild Test.sln /p:ForceImportBeforeCppTargets="xx\Cpp.props" /t:rebuild
  Microsoft (R) Build Engine version 15.9.21+g9802d43bc3 for .NET Framework
  Copyright (C) Microsoft Corporation. All rights reserved.
  
  Building the projects in this solution one at a time. To enable parallel build, please add the "/m" switch.
  Build started 2019/7/24 18:23:27.
  Project "C:\xx\Test.sln" on node 1 (rebuild target(s)).
  ValidateSolutionConfiguration:
    Building solution configuration "Debug|x64".
  Project "C:\xx\Test.sln" (1) is building "C:\xx\Test\Test.vcxproj" (2) on node 1 (Rebuild target(s)).
  _PrepareForClean:
    Deleting file "x64\Debug\Test.tlog\Test.lastbuildstate".
  InitializeBuildStatus:
    Creating "x64\Debug\Test.tlog\unsuccessfulbuild" because "AlwaysCreate" was specified.
  ClCompile:
    C:\Program Files (x86)\Microsoft Visual Studio\2017\Enterprise\VC\Tools\MSVC\14.16.27023\bin\HostX86\x64\CL.exe /c /ZI /JMC /nologo /W3 /WX- /diagnostics:classic /sdl /Od /D _DEBUG /D _CONSOLE /D _UNICODE /D UN
    ICODE /D TESTMSBUILD /Gm- /EHsc /RTC1 /MDd /GS /fp:precise /permissive- /Zc:wchar_t /Zc:forScope /Zc:inline /Yc"pch.h" /Fp"x64\Debug\Test.pch" /Fo"x64\Debug\\" /Fd"x64\Debug\vc141.pdb" /Gd /TP /FC /errorReport:
    queue pch.cpp
    pch.cpp
    C:\Program Files (x86)\Microsoft Visual Studio\2017\Enterprise\VC\Tools\MSVC\14.16.27023\bin\HostX86\x64\CL.exe /c /ZI /JMC /nologo /W3 /WX- /diagnostics:classic /sdl /Od /D _DEBUG /D _CONSOLE /D _UNICODE /D UN
    ICODE /D TESTMSBUILD /Gm- /EHsc /RTC1 /MDd /GS /fp:precise /permissive- /Zc:wchar_t /Zc:forScope /Zc:inline /Yu"pch.h" /Fp"x64\Debug\Test.pch" /Fo"x64\Debug\\" /Fd"x64\Debug\vc141.pdb" /Gd /TP /FC /errorReport:
    queue Test.cpp
    Test.cpp
  Link:
    C:\Program Files (x86)\Microsoft Visual Studio\2017\Enterprise\VC\Tools\MSVC\14.16.27023\bin\HostX86\x64\link.exe /ERRORREPORT:QUEUE /OUT:"C:\xx\Test\x64\Debug\Test.exe" /I
    NCREMENTAL /NOLOGO kernel32.lib user32.lib gdi32.lib winspool.lib comdlg32.lib advapi32.lib shell32.lib ole32.lib oleaut32.lib uuid.lib odbc32.lib odbccp32.lib /MANIFEST /MANIFESTUAC:"level='asInvoker' uiAccess
    ='false'" /manifest:embed /DEBUG:FASTLINK /PDB:"C:\xx\Test\x64\Debug\Test.pdb" /SUBSYSTEM:CONSOLE /TLBID:1 /DYNAMICBASE /NXCOMPAT /IMPLIB:"C:\xx\Test\x64\Debug\Test.lib" /MACHINE:X64 x64\Debug\pch.obj
    x64\Debug\Test.obj
    Test.vcxproj -> C:\xx\Test\x64\Debug\Test.exe
  FinalizeBuildStatus:
    Deleting file "x64\Debug\Test.tlog\unsuccessfulbuild".
    Touching "x64\Debug\Test.tlog\Test.lastbuildstate".
  Done Building Project "C:\xx\Test\Test\Test.vcxproj" (Rebuild target(s)).
  
  Done Building Project "C:\xx\Test\Test.sln" (rebuild target(s)).
  
  
  Build succeeded.
      0 Warning(s)
      0 Error(s)
  
  Time Elapsed 00:00:02.86
  ```

  

## C# 工程

对于 C# 工程，则需要通过 [DefineConstants](https://blogs.msdn.microsoft.com/karstenj/2005/06/28/passing-a-preprocessor-directive-to-msbuild-via-the-command-line-instead-of-define-in-code/) 添加条件编译宏，但如果直接通过 msbuild /p:DefineConstants 传入则会直接覆盖工程文件中定义的宏，此时我们可以考虑使用 C++ 中类似的处理方法来实现，具体实现步骤如下：

- 创建一个target文件，如 CSharp.props，将以下内容添加至该文件，其中 TESTMSBUILD 为我们需要定义的宏:

  ```xml
  <?xml version="1.0" encoding="utf-8"?> 
  <Project xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
    <PropertyGroup>
        <DefineConstants>$(DefineConstants);MSBUILDTEST</DefineConstants>
    </PropertyGroup>
  </Project>
  ```

- 使用参数 [CustomBeforeMicrosoftCSharpTargets](https://referencesource.microsoft.com/#MSBuildProperty=CustomBeforeMicrosoftCSharpTargets) 将该属性传递给工程文件：

  ```
  msbuild Console.sln /p:CustomBeforeMicrosoftCSharpTargets="xxx\CSharp.props" /t:rebuild
  ```

- 测试使用最简单的命令行工程：

  ```c#
  using System;
  
  namespace ConsoleApp
  {
      class Program
      {
          static void Main(string[] args)
          {
  #if MSBUILDTEST
              Console.WriteLine("test for MSBUILD CSHAP");
  #else
              Console.WriteLine("test ");
  #endif
          }
      }
  }
  ```

- 对应的编译结果如下：

  ```
  C:\xxx\ConsoleApp>msbuild ConsoleApp.sln /p:CustomBeforeMicrosoftCSharpTargets="C:\xxx\ConsoleApp\CSharp.props" /t:rebuild
  Microsoft (R) Build Engine version 15.9.21+g9802d43bc3 for .NET Framework
  Copyright (C) Microsoft Corporation. All rights reserved.
  ……
  CoreCompile:
    C:\Program Files (x86)\Microsoft Visual Studio\2017\Enterprise\MSBuild\15.0\bin\Roslyn\csc.exe /noconfig /nowarn:1701,1702 /nostdlib+ /platform:anycpu32bitpreferred /errorreport:prompt /warn:4 /define:TRACE;DEBUG;MSBUILDTEST /highentropyva+ /reference:"C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.6.1\Microsoft.CSharp.dll" /referenc
    e:"C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.6.1\mscorlib.dll" /reference:"C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.6.1\System.Core.dll" /reference:"C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.6.1\System.Data.DataSetExtensions.dll" /reference:"C:\Progra
    m Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.6.1\System.Data.dll" /reference:"C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.6.1\System.dll" /reference:"C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.6.1\System.Net.Http.dll" /reference:"C:\Program Files (x86)\Reference Asse
    mblies\Microsoft\Framework\.NETFramework\v4.6.1\System.Xml.dll" /reference:"C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.6.1\System.Xml.Linq.dll" /debug+ /debug:full /filealign:512 /optimize- /out:obj\Debug\ConsoleApp.exe /ruleset:"C:\Program Files (x86)\Microsoft Visual Studio\2017\Enterprise\Team Tools\Static Analysis Tools\\Rule
     Sets\MinimumRecommendedRules.ruleset" /subsystemversion:6.00 /target:exe /utf8output /deterministic+ Program.cs Properties\AssemblyInfo.cs "C:\Users\xxx\AppData\Local\Temp\.NETFramework,Version=v4.6.1.AssemblyAttributes.cs"
    Using shared compilation with compiler from directory: C:\Program Files (x86)\Microsoft Visual Studio\2017\Enterprise\MSBuild\15.0\bin\Roslyn
  _CopyAppConfigFile:
    Copying file from "App.config" to "bin\Debug\ConsoleApp.exe.config".
  CopyFilesToOutputDirectory:
    Copying file from "obj\Debug\ConsoleApp.exe" to "bin\Debug\ConsoleApp.exe".
    ConsoleApp -> C:\xxx\ConsoleApp\ConsoleApp\bin\Debug\ConsoleApp.exe
    Copying file from "obj\Debug\ConsoleApp.pdb" to "bin\Debug\ConsoleApp.pdb".
  Done Building Project "C:\xxx\ConsoleApp\ConsoleApp\ConsoleApp.csproj" (Rebuild target(s)).
  
  Done Building Project "C:\xxx\ConsoleApp\ConsoleApp.sln" (rebuild target(s)).
  
  
  Build succeeded.
      0 Warning(s)
      0 Error(s)
  
  Time Elapsed 00:00:01.30
  ```

  