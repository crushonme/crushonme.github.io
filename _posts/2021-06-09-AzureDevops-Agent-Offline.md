---
layout: post
title: Agent offline in Azure Devops
categories: azuredevops
description: 
keywords: azure devops,devops,tfs,vsts
---

# Failed to connect server with error of "ERROR_WINHTTP_SECURE_FAILURE"

If you are using self-signed certificate, we may see that the agent is not online. Checked the agent log, we will see below logs:

```log
[2021-06-09 11:38:38Z INFO MessageListener] Connecting to the Agent Server...
[2021-06-09 11:38:38Z INFO AgentServer] Establish connection with 60 seconds timeout.
[2021-06-09 11:38:39Z INFO VisualStudioServices] Starting operation Location.GetConnectionData
[2021-06-09 11:38:39Z INFO AgentServer] Establish connection with 60 seconds timeout.
[2021-06-09 11:38:39Z INFO VisualStudioServices] Starting operation Location.GetConnectionData
[2021-06-09 11:38:39Z INFO AgentServer] Establish connection with 60 seconds timeout.
[2021-06-09 11:38:39Z INFO VisualStudioServices] Starting operation Location.GetConnectionData
[2021-06-09 11:38:39Z WARN VisualStudioServices] Attempt 1 of GET request to https://azuredevops/_apis/connectionData?connectOptions=0&lastChangeId=18&lastChangeId64=18 failed (WinHttp Error: ERROR_WINHTTP_SECURE_FAILURE). The operation will be retried in 11.079716 seconds.
[2021-06-09 11:38:39Z WARN VisualStudioServices] Attempt 1 of GET request to https://azuredevops/_apis/connectionData?connectOptions=0&lastChangeId=18&lastChangeId64=18 failed (WinHttp Error: ERROR_WINHTTP_SECURE_FAILURE). The operation will be retried in 10.8464117 seconds.
[2021-06-09 11:38:39Z WARN VisualStudioServices] Attempt 1 of GET request to https://azuredevops/_apis/connectionData?connectOptions=0&lastChangeId=18&lastChangeId64=18 failed (WinHttp Error: ERROR_WINHTTP_SECURE_FAILURE). The operation will be retried in 10.8157251 seconds.
[2021-06-09 11:38:50Z WARN VisualStudioServices] Attempt 2 of GET request to https://azuredevops/_apis/connectionData?connectOptions=0&lastChangeId=18&lastChangeId64=18 failed (WinHttp Error: ERROR_WINHTTP_SECURE_FAILURE). The operation will be retried in 12.7025349 seconds.
[2021-06-09 11:38:50Z WARN VisualStudioServices] Attempt 2 of GET request to https://azuredevops/_apis/connectionData?connectOptions=0&lastChangeId=18&lastChangeId64=18 failed (WinHttp Error: ERROR_WINHTTP_SECURE_FAILURE). The operation will be retried in 13.0866097 seconds.
[2021-06-09 11:38:50Z WARN VisualStudioServices] Attempt 2 of GET request to https://azuredevops/_apis/connectionData?connectOptions=0&lastChangeId=18&lastChangeId64=18 failed (WinHttp Error: ERROR_WINHTTP_SECURE_FAILURE). The operation will be retried in 13.0360894 seconds.
[2021-06-09 11:39:02Z WARN VisualStudioServices] Attempt 3 of GET request to https://azuredevops/_apis/connectionData?connectOptions=0&lastChangeId=18&lastChangeId64=18 failed (WinHttp Error: ERROR_WINHTTP_SECURE_FAILURE). The operation will be retried in 17.8503279 seconds.
[2021-06-09 11:39:03Z WARN VisualStudioServices] Attempt 3 of GET request to https://azuredevops/_apis/connectionData?connectOptions=0&lastChangeId=18&lastChangeId64=18 failed (WinHttp Error: ERROR_WINHTTP_SECURE_FAILURE). The operation will be retried in 16.2570128 seconds.
[2021-06-09 11:39:03Z WARN VisualStudioServices] Attempt 3 of GET request to https://azuredevops/_apis/connectionData?connectOptions=0&lastChangeId=18&lastChangeId64=18 failed (WinHttp Error: ERROR_WINHTTP_SECURE_FAILURE). The operation will be retried in 18.1869217 seconds.
[2021-06-09 11:39:19Z ERR  VisualStudioServices] Attempt 4 of GET request to https://azuredevops/_apis/connectionData?connectOptions=0&lastChangeId=18&lastChangeId64=18 failed (WinHttp Error: ERROR_WINHTTP_SECURE_FAILURE). The maximum number of attempts has been reached.
[2021-06-09 11:39:19Z INFO VisualStudioServices] Finished operation Location.GetConnectionData
[2021-06-09 11:39:19Z INFO AgentServer] Catch exception during connect. 4 attempt left.
[2021-06-09 11:39:19Z ERR  AgentServer] System.Net.Http.HttpRequestException: An error occurred while sending the request.
 ---> System.Net.Http.WinHttpException (80072F8F, 12175): Error 12175 calling WINHTTP_CALLBACK_STATUS_REQUEST_ERROR, 'A security error occurred'.
   at System.Threading.Tasks.RendezvousAwaitable`1.GetResult()
   at System.Net.Http.WinHttpHandler.StartRequestAsync(WinHttpRequestState state)
   --- End of inner exception stack trace ---
   at Microsoft.VisualStudio.Services.Common.VssHttpRetryMessageHandler.SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
   at System.Net.Http.HttpClient.FinishSendAsyncBuffered(Task`1 sendTask, HttpRequestMessage request, CancellationTokenSource cts, Boolean disposeCts)
   at Microsoft.VisualStudio.Services.WebApi.VssHttpClientBase.SendAsync(HttpRequestMessage message, HttpCompletionOption completionOption, Object userState, CancellationToken cancellationToken)
   at Microsoft.VisualStudio.Services.WebApi.VssHttpClientBase.SendAsync[T](HttpRequestMessage message, Object userState, CancellationToken cancellationToken)
   at Microsoft.VisualStudio.Services.Location.Client.LocationHttpClient.GetConnectionDataAsync(ConnectOptions connectOptions, Int64 lastChangeId, CancellationToken cancellationToken, Object userState)
   at Microsoft.VisualStudio.Services.WebApi.Location.VssServerDataProvider.GetConnectionDataAsync(ConnectOptions connectOptions, Int32 lastChangeId, CancellationToken cancellationToken)
   at Microsoft.VisualStudio.Services.WebApi.Location.VssServerDataProvider.ConnectAsync(ConnectOptions connectOptions, CancellationToken cancellationToken)
   at Microsoft.VisualStudio.Services.Agent.AgentServer.EstablishVssConnection(Uri serverUrl, VssCredentials credentials, TimeSpan timeout)
```

Even though we try to restart the agent service or update to latest agent. We will get a certificate warning when access the request in browsers. So we will try to add the self-signed certificate to my Trust Root Certificate Authorities. However the status is still offline. We tried to start the agent interactively and will see the status of agent will change to online.

The agent service run as service account. It will use machine certificate store to get the certificate. So we should add the certificate to machine level.

**Solution**
We should do below configuration:

- Add the certificate to **Machine Trust Root Certificate Authorities**
- Restart the Agent Service to take effect.

# Failed to connect to Server with error "HTTP Status: Redirect"

After we changed the Server URL to HTTPS and deprecated HTTP, we will see the status of agent changes to offline. In the log ,we will see below information

```log
[2021-06-09 10:24:19Z INFO MessageListener] Attempt to create session.
[2021-06-09 10:24:19Z INFO MessageListener] Connecting to the Agent Server...
[2021-06-09 10:24:19Z INFO AgentServer] Establish connection with 60 seconds timeout.
[2021-06-09 10:24:19Z INFO VisualStudioServices] Starting operation Location.GetConnectionData
[2021-06-09 10:24:19Z INFO AgentServer] Establish connection with 60 seconds timeout.
[2021-06-09 10:24:19Z INFO VisualStudioServices] Starting operation Location.GetConnectionData
[2021-06-09 10:24:19Z INFO AgentServer] Establish connection with 60 seconds timeout.
[2021-06-09 10:24:19Z INFO VisualStudioServices] Starting operation Location.GetConnectionData
[2021-06-09 10:24:19Z ERR  VisualStudioServices] GET request to http://azuredevops/_apis/connectionData?connectOptions=1&lastChangeId=-1&lastChangeId64=-1 failed. HTTP Status: Redirect
[2021-06-09 10:24:19Z ERR  VisualStudioServices] GET request to http://azuredevops/_apis/connectionData?connectOptions=1&lastChangeId=-1&lastChangeId64=-1 failed. HTTP Status: Redirect
[2021-06-09 10:24:19Z ERR  VisualStudioServices] GET request to http://azuredevops/_apis/connectionData?connectOptions=1&lastChangeId=-1&lastChangeId64=-1 failed. HTTP Status: Redirect
[2021-06-09 10:24:19Z INFO VisualStudioServices] Finished operation Location.GetConnectionData
[2021-06-09 10:24:19Z INFO VisualStudioServices] Finished operation Location.GetConnectionData
[2021-06-09 10:24:19Z INFO VisualStudioServices] Finished operation Location.GetConnectionData
[2021-06-09 10:24:19Z INFO AgentServer] Catch exception during connect. 4 attempt left.
[2021-06-09 10:24:19Z INFO AgentServer] Catch exception during connect. 4 attempt left.
[2021-06-09 10:24:19Z INFO AgentServer] Catch exception during connect. 4 attempt left.
[2021-06-09 10:24:19Z ERR  AgentServer] Microsoft.VisualStudio.Services.WebApi.VssServiceResponseException: Found
   at Microsoft.VisualStudio.Services.WebApi.VssHttpClientBase.HandleResponseAsync(HttpResponseMessage response, CancellationToken cancellationToken)
   at Microsoft.VisualStudio.Services.WebApi.VssHttpClientBase.SendAsync(HttpRequestMessage message, HttpCompletionOption completionOption, Object userState, CancellationToken cancellationToken)
   at Microsoft.VisualStudio.Services.WebApi.VssHttpClientBase.SendAsync[T](HttpRequestMessage message, Object userState, CancellationToken cancellationToken)
   at Microsoft.VisualStudio.Services.Location.Client.LocationHttpClient.GetConnectionDataAsync(ConnectOptions connectOptions, Int64 lastChangeId, CancellationToken cancellationToken, Object userState)
   at Microsoft.VisualStudio.Services.WebApi.Location.VssServerDataProvider.GetConnectionDataAsync(ConnectOptions connectOptions, Int32 lastChangeId, CancellationToken cancellationToken)
   at Microsoft.VisualStudio.Services.WebApi.Location.VssServerDataProvider.ConnectAsync(ConnectOptions connectOptions, CancellationToken cancellationToken)
   at Microsoft.VisualStudio.Services.Agent.AgentServer.EstablishVssConnection(Uri serverUrl, VssCredentials credentials, TimeSpan timeout)
[2021-06-09 10:24:19Z ERR  AgentServer] Microsoft.VisualStudio.Services.WebApi.VssServiceResponseException: Found
   at Microsoft.VisualStudio.Services.WebApi.VssHttpClientBase.HandleResponseAsync(HttpResponseMessage response, CancellationToken cancellationToken)
   at Microsoft.VisualStudio.Services.WebApi.VssHttpClientBase.SendAsync(HttpRequestMessage message, HttpCompletionOption completionOption, Object userState, CancellationToken cancellationToken)
   at Microsoft.VisualStudio.Services.WebApi.VssHttpClientBase.SendAsync[T](HttpRequestMessage message, Object userState, CancellationToken cancellationToken)
   at Microsoft.VisualStudio.Services.Location.Client.LocationHttpClient.GetConnectionDataAsync(ConnectOptions connectOptions, Int64 lastChangeId, CancellationToken cancellationToken, Object userState)
   at Microsoft.VisualStudio.Services.WebApi.Location.VssServerDataProvider.GetConnectionDataAsync(ConnectOptions connectOptions, Int32 lastChangeId, CancellationToken cancellationToken)
   at Microsoft.VisualStudio.Services.WebApi.Location.VssServerDataProvider.ConnectAsync(ConnectOptions connectOptions, CancellationToken cancellationToken)
   at Microsoft.VisualStudio.Services.Agent.AgentServer.EstablishVssConnection(Uri serverUrl, VssCredentials credentials, TimeSpan timeout)
[2021-06-09 10:24:19Z ERR  AgentServer] Microsoft.VisualStudio.Services.WebApi.VssServiceResponseException: Found
   at Microsoft.VisualStudio.Services.WebApi.VssHttpClientBase.HandleResponseAsync(HttpResponseMessage response, CancellationToken cancellationToken)
   at Microsoft.VisualStudio.Services.WebApi.VssHttpClientBase.SendAsync(HttpRequestMessage message, HttpCompletionOption completionOption, Object userState, CancellationToken cancellationToken)
   at Microsoft.VisualStudio.Services.WebApi.VssHttpClientBase.SendAsync[T](HttpRequestMessage message, Object userState, CancellationToken cancellationToken)
   at Microsoft.VisualStudio.Services.Location.Client.LocationHttpClient.GetConnectionDataAsync(ConnectOptions connectOptions, Int64 lastChangeId, CancellationToken cancellationToken, Object userState)
   at Microsoft.VisualStudio.Services.WebApi.Location.VssServerDataProvider.GetConnectionDataAsync(ConnectOptions connectOptions, Int32 lastChangeId, CancellationToken cancellationToken)
   at Microsoft.VisualStudio.Services.WebApi.Location.VssServerDataProvider.ConnectAsync(ConnectOptions connectOptions, CancellationToken cancellationToken)
   at Microsoft.VisualStudio.Services.Agent.AgentServer.EstablishVssConnection(Uri serverUrl, VssCredentials credentials, TimeSpan timeout)
```

So there might be a configuration or registry to record the serviceUrl. We can capture Process Monitor log and use the network package to identify the cotext. Then we will see Agent.Listener.exe accessed the .agent and .service files in agent work directory. After checking these two files, we will see that serverUrl stored in .agent.

**Solution**

To fix the issue we should do below change:

- Change the explore view to show hidden objects;
- Edit .agent file with notepad and replace the http in serverUrl to https

    ```config
    {
      "agentId": 7,
      "agentName": "WENCHM392VM",
      "poolId": 1,
      "poolName": "Default",
      "serverUrl": "http://azuredevops/",
      "workFolder": "_work"
    }
   ```

- Restart the Agent service