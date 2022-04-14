---
layout: post
title: How To Use Cache Task With Selfhost Agent
categories: azuredevops
description: This article describe the steps to setup Cache Task withSelfhost Agent
keywords: azure devops,devops,tfs,vsts
---

It's very easy to use Azure DevOps Cache Task with Microsoft Hosted agent. For selfhost agent, the document only mentioned the prerequies software in [Required software on self-hosted agent](https://docs.microsoft.com/en-us/azure/devops/pipelines/release/caching?view=azure-devops#required-software-on-self-hosted-agent).

| Archive software / Platform | Windows     | Linux    | Mac      |
|-----------------------------|-------------|----------|----------|
| GNU Tar                     | Required    | Required | No       |
| BSD Tar                     | No          | No       | Required |
| 7-Zip                       | Recommended | No       | No       |

# Description

From above table, it tells us that we must install GNU Tar on Windows and 7-Zip is recommended. Then we will install GNU Tar and 7-Zip in selfhost agent and add the path to PATH environment variable. 

In Cache task will use 7-zip (***only if 7z is installed and is part of PATH variable***) to extract the TAR file on Windows. It will try to launch 7z.exe to check 7z exists. If failed, it will fall back to GNU Tar.

```csharp
private static ProcessStartInfo GetExtractStartProcessInf(AgentTaskPluginExecutionContext context, stringtargetDirectory)
{
    string processFileName, processArguments;
    if (isWindows && CheckIf7ZExists())
    {
        processFileName = "7z";
        processArguments = $"x -si -aoa -o\"{targetDirectory}\" -ttar";
        if (context.IsSystemDebugTrue())
        {
            processArguments = "-bb1 " + processArguments;
        }
    }
    else
    {
        processFileName = GetTar(context);
        processArguments = $"-xf - -C ."; // Instead of targetDirectory, we are providing . to tar, because the tar process is being started from targetDirectory.
        if (context.IsSystemDebugTrue())
        {
            processArguments = "-v " + processArguments;
        }
    }
    ProcessStartInfo processStartInfo = new ProcessStartInfo();
    CreateProcessStartInfo(processStartInfo, processFileName, processArguments, processWorkingDirectory: targetDirectory);
    return processStartInfo;
}
```

In Post Cache Task, it will use Tar.exe to create Tar archive.

```csharp
private static ProcessStartInfo GetCreateTarProcessInf(AgentTaskPluginExecutionContext context, stringarchiveFileName, string inputPath)
{
    var processFileName = GetTar(context);
    inputPath = inputPath.TrimEnd(Path.DirectorySeparatorChar).TrimEnd(Path.AltDirectorySeparatorChar);
    var processArguments = $"-cf \"{archiveFileName}\" -C \"{inputPath}\" ."; // If given the absolute path for the '-cf' option, the GNU tar fails. The workaround is to start the tarring process in the temp directory, and simply speficy 'archive.tar' for that option.
    if (context.IsSystemDebugTrue())
    {
        processArguments = "-v " + processArguments;
    }
    if (isWindows)
    {
        processArguments = "-h " + processArguments;
    }
    
    ProcessStartInfo processStartInfo = new ProcessStartInfo();
    CreateProcessStartInfo(processStartInfo, processFileName, processArguments, processWorkingDirectory: Path.GetTempPath()); // We want to create the archiveFile in temp folder, and hence starting the tar process from TEMP to avoid absolute paths in tar cmd line.
    return processStartInfo;
        }
```

# How to Setup Selfhost Agent for Cache Task

1. Install [7-zip](https://www.7-zip.org/download.html) and [GNU Tar](http://gnuwin32.sourceforge.net/packages/gtar.htm)
2. Add C:\Program Files\7-Zip and C:\Program Files (x86)\GnuWin32\bin to PATH variable in System Environment Variables.
3. Add **VSTS_TAR_EXECUTABLE** environment variable and set its value to  C:\Program Files (x86)\GnuWin32\bin\tar.exe.

  > Notes:System will add a quote for Windows 10 above OS. We should mannually remove the quote by Edit Text of PATH;
  ![Environment](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/environment.png)