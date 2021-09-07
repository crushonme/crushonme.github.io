---
layout: post
title: How To Disable Agent Downgrade In Azure Devops
categories: azuredevops
description: Try to tell you the background of the agent downgrade in Azure DevOps
keywords: azure devops,devops,tfs,vsts
---

In sometimes we need to use latest Agent published in [Azure Pipelines Agent Relese](https://github.com/microsoft/azure-pipelines-agent/releases). However when we try to run a task in the agent, we will find out that the agent automaticly downgrade to Server matched version stored in the DB. So how can we avoid the automaticly downgrade in Azure DevOps?

Let's follow my steps:

# Downgrade log in _diag/Agent_yyyymmdd-hhmmss-utc.log

```log
[2021-07-30 08:10:47Z INFO MessageListener] Message '134' received from session '71d1d5f9-d7a1-4c32-8126-2c42be6e0d48'.
[2021-07-30 08:10:47Z INFO Agent] Refresh message received, kick-off selfupdate background process.
[2021-07-30 08:10:47Z INFO SelfUpdater] Version '2.170.1' of 'agent' package available in server.
[2021-07-30 08:10:47Z INFO SelfUpdater] Current running agent version is 2.187.2
[2021-07-30 08:10:47Z INFO Terminal] WRITE LINE: Downgrading agent to a lower version. This is usually due to a rollback of the currently published agent for a bug fix. To disable this behavior, set environment variable AZP_AGENT_DOWNGRADE_DISABLED=true before launching your agent.
[2021-07-30 08:10:47Z INFO SelfUpdater] An update is available.
[2021-07-30 08:10:47Z INFO Terminal] WRITE LINE: Agent update in progress, do not shutdown agent.
[2021-07-30 08:10:47Z INFO Terminal] WRITE LINE: Downloading 2.170.1 agent
[2021-07-30 08:10:47Z INFO HostContext] Well known directory 'Bin': '/home/vlog/agent1/bin'
[2021-07-30 08:10:47Z INFO HostContext] Well known directory 'Root': '/home/vlog/agent1'
[2021-07-30 08:10:47Z INFO HostContext] Well known directory 'Work': '/home/vlog/agent1/_work'
[2021-07-30 08:10:47Z INFO SelfUpdater] Attempt 1: save latest agent into /home/vlog/agent1/_work/_update/agent1.tar.gz.
[2021-07-30 08:10:47Z INFO SelfUpdater] Download agent: begin download
[2021-07-30 08:10:48Z WARN SelfUpdater] Failed to get package '/home/vlog/agent1/_work/_update/agent1.tar.gz' from 'https://vstsagentpackage.azureedge.net/agent/2.170.1/vsts-agent-linux-x64-2.170.1.tar.gz'. Exception System.Net.Http.HttpRequestException: Name or service not known
 ---> System.Net.Sockets.SocketException (0xFFFDFFFF): Name or service not known
   at System.Net.Http.ConnectHelper.ConnectAsync(String host, Int32 port, CancellationToken cancellationToken)
   --- End of inner exception stack trace ---
   at System.Net.Http.ConnectHelper.ConnectAsync(String host, Int32 port, CancellationToken cancellationToken)
   at System.Net.Http.HttpConnectionPool.ConnectAsync(HttpRequestMessage request, Boolean allowHttp2, CancellationToken cancellationToken)
   at System.Net.Http.HttpConnectionPool.CreateHttp11ConnectionAsync(HttpRequestMessage request, CancellationToken cancellationToken)
   at System.Net.Http.HttpConnectionPool.GetHttpConnectionAsync(HttpRequestMessage request, CancellationToken cancellationToken)
   at System.Net.Http.HttpConnectionPool.SendWithRetryAsync(HttpRequestMessage request, Boolean doRequestAuth, CancellationToken cancellationToken)
   at System.Net.Http.RedirectHandler.SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
   at System.Net.Http.HttpClient.FinishSendAsyncUnbuffered(Task`1 sendTask, HttpRequestMessage request, CancellationTokenSource cts, Boolean disposeCts)
   at System.Net.Http.HttpClient.FinishGetStreamAsync(Task`1 getTask)
   at Microsoft.VisualStudio.Services.Agent.Listener.SelfUpdater.DownloadLatestAgent(CancellationToken token)
```

# [Code Level](https://github.com/microsoft/azure-pipelines-agent/blob/cac84192090b2f99dafdd6e318e9880ca0e2ef86/src/Agent.Listener/Agent.cs#L394)

[Log with auto update](https://github.com/microsoft/azure-pipelines-agent/blob/cac84192090b2f99dafdd6e318e9880ca0e2ef86/src/Agent.Listener/Agent.cs#L394)

```csharp
if (string.Equals(message.MessageType, AgentRefreshMessage.MessageType, StringComparison.OrdinalIgnoreCase))
{
    if (disableAutoUpdate)
    {
        Trace.Info("Refresh message received, skip autoupdate since environment variable agent.disableupdate is set.");
    }
    else
    {
        if (autoUpdateInProgress == false)
        {
            autoUpdateInProgress = true;
            var agentUpdateMessage = JsonUtility.FromString<AgentRefreshMessage>(message.Body);
            var selfUpdater = HostContext.GetService<ISelfUpdater>();
            selfUpdateTask = selfUpdater.SelfUpdate(agentUpdateMessage, jobDispatcher, !runOnce && HostContext.StartupType != StartupType.Service, HostContext.AgentShutdownToken);
            Trace.Info("Refresh message received, kick-off selfupdate background process.");
        }
        else
        {
            Trace.Info("Refresh message received, skip autoupdate since a previous autoupdate is already running.");
        }
    }
}
```

[Update conditions](https://github.com/microsoft/azure-pipelines-agent/blob/b93f8f1f4e53ddf5d9cd25090db6f71b092d177c/src/Agent.Listener/SelfUpdater.cs#L107)

```csharp
 private async Task<bool> UpdateNeeded(string targetVersion, CancellationToken token)
{
    // when talk to old version tfs server, always prefer latest package.
    // old server won't send target version as part of update message.
    if (string.IsNullOrEmpty(targetVersion))
    {
        var packages = await _agentServer.GetPackagesAsync(_packageType, _platform, 1, token);
        if (packages == null || packages.Count == 0)
        {
            Trace.Info($"There is no package for {_packageType} and {_platform}.");
            return false;
        }
        _targetPackage = packages.FirstOrDefault();
    }
    else
    {
        _targetPackage = await _agentServer.GetPackageAsync(_packageType, _platform, targetVersion, token);
        if (_targetPackage == null)
        {
            Trace.Info($"There is no package for {_packageType} and {_platform} with version {targetVersion}.");
            return false;
        }
    }
    Trace.Info($"Version '{_targetPackage.Version}' of '{_targetPackage.Type}' package available in server.");
    PackageVersion serverVersion = new PackageVersion(_targetPackage.Version);
    Trace.Info($"Current running agent version is {BuildConstants.AgentPackage.Version}");
    PackageVersion agentVersion = new PackageVersion(BuildConstants.AgentPackage.Version);
    if (serverVersion.CompareTo(agentVersion) > 0)
    {
        return true;
    }
    if (AgentKnobs.DisableAgentDowngrade.GetValue(_knobContext).AsBoolean())
    {
        Trace.Info("Agent downgrade disabled, skipping update");
        return false;
    }
    // Always return true for newer agent versions unless they're exactly equal to enable auto rollback (this feature was introduced after 2.165.0)
    if (serverVersion.CompareTo(agentVersion) != 0)
    {
        _terminal.WriteLine(StringUtil.Loc("AgentDowngrade"));
        return true;
    }
    return false;
}
```

# How to Disable Agent Downgrade

## 1. Disable Agent Upgrade/Downgrade globally
Disable Agent update settings in collect Settings.

![image.png](/../images/posts/AgentSettings.png)

> After Disable Agent upgrade/downgrade globally, Server will not send **AgentRefreshMessage** to agent

## 2. Disable Agent Downgrade for specified Agent (Do not affect upgrade)

When you download specific version pipeline agent from [Azure Pipelines Agent Relese](https://github.com/microsoft/azure-pipelines-agent/releases) instead of Azure Devops portal and install, it has a mechanism to downgrade the agent to older version. Use below steps to disable the downgrade.
1). Create a system environment variable AZP_AGENT_DOWNGRADE_DISABLED, set its value as true.
2). Restart the machine to make it takes effect.
3). Install the downloaded agent.
4). Create a pipeline, at Initial job step, you can see the setting AZP_AGENT_DOWNGRADE_DISABLED is set.

![image.png](/../images/posts/AgentDisableDowngradeLog.png)

# How to add System Environment for Linux

1. Create a new file under /etc/profile.d to store the global environment variable(s). The name of the should be contextual so others may understand its purpose. For demonstrations, we will create a permanent environment variable for AZP_AGENT_DOWNGRADE_DISABLED.

    ```bash
    sudo touch /etc/profile.d/AvoidAgentDowngrade.sh
    ```

2. Open the default profile into a text editor.

    ```bash
    sudo vi /etc/profile.d/http_proxy.sh
    ```

3. Add new lines to export the environment variables

    ```bash
    export AZP_AGENT_DOWNGRADE_DISABLED=true
    ```

4. Save your changes and exit the text editor and reboot;