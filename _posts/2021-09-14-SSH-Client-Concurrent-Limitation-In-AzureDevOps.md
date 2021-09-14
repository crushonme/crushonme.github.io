---
layout: post
title: SSH Client concurrent limitation in Azure DevOps
categories: azuredevops
description: MaxConcurrentConnections in Azure DevOps
keywords: azure devops,devops,tfs,vsts
---

In Azure DevOps the default MaxConcurrentConnections is 500 in code. When the user is more than 500, we will get below error:

```log
$ git pull
kex_exchange_identification: Connection closed by remote host
Connection closed by 10.233.93.117 port 22
fatal: Could not read from remote repository. 

```

There are two solution to avoid the issue:

- Configure the value in Azure DevOps Configuration Database.

  ```sql
  EXEC prc_SetRegistryValue @partitionId=1,   @key=N'#\Configuration\SshServer\MaxConcurrentConnections\',   @value=N'700'
  ```
  
  We can use below SQL command to query the configuration of SSH Server:
  
  ```sql
  SELECT [PartitionId]
        ,[ParentPath]
        ,[ChildItem]
        ,[RegValue]
    FROM [AzureDevOps_Configuration].[dbo].[tbl_RegistryItems]
    where ParentPath like '%SshServer%'
  ```

  The SSH configuration logic is defined in Microsoft.TeamFoundation.Ssh.  Server.Core.dll and we can use ILSPY to decompile the code.Below is the code of SSH configuration:
  
  ```csharp
  // Microsoft.TeamFoundation.Ssh.Server.Core.SshOptions
  using System;
  using Microsoft.TeamFoundation.Framework.Server;
  using Microsoft.TeamFoundation.Ssh.Server.Core;
  
  public class SshOptions
  {
  	public static readonly RegistryQuery RegistryQuery = "/  Configuration/SshServer/**";
  
  	public TimeSpan SessionTimeout { get; }
  
  	public int MaxConcurrentConnections { get; }
  
  	public int Port { get; }
  
  	public bool Enabled { get; }
  
  	public KexInitOptions KexInitOptions { get; }
  
  	public SshOptions(TimeSpan? sessionTimeout = null, int?   maxConcurrentConnections = null, int? port = null, bool? enabled =   null, KexInitOptions kexInitOptions = null)
  	{
  		SessionTimeout = sessionTimeout ?? TimeSpan.FromMinutes(5.0);
  		MaxConcurrentConnections = maxConcurrentConnections ?? 500;
  		Port = port ?? 22;
  		Enabled = enabled ?? false;
  		KexInitOptions = kexInitOptions ?? new KexInitOptions();
  	}
  
  	public static SshOptions FromRegistry(IVssRequestContext rc)
  	{
  		RegistryEntryCollection registryEntryCollection = rc.  GetService<IVssRegistryService>().ReadEntries(rc, RegistryQuery)  ;
  		RegistryEntry entry;
  		return new SshOptions(registryEntryCollection.TryGetValue  ("SessionTimeoutSeconds", out entry) ? new TimeSpan?(TimeSpan.  FromSeconds(entry.GetValue<int>())) : null,   registryEntryCollection.GetValueFromPath<int?>  ("MaxConcurrentConnections", null), registryEntryCollection.  GetValueFromPath<int?>("Port", null), registryEntryCollection.  GetValueFromPath<bool?>("Enabled", null), KexInitOptions.  FromRegistry(registryEntryCollection));
  	}
  }
  
  ```

- Use HTTP/HTTPS instead of SSH to avoid the issue.

  ```powershell
  # Get the remote name
  git remote

  # Get the remote URL
  git remote get-url --all origin

  # Set the remote URL, use HTTP/HTTPS instead of SSH
  git remote set-url origin https://xxxxx
  git remote set-url --push origin https://xxxx
  ```
