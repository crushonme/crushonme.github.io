---
layout: post
title: None live update output for build pipelines in Devops
categories: Devops
description: 
keywords: TFS,Devops,Azure Devops,Azure Devops Service
---

Sometimes we will get a pop up banner saying "Build live updates have stopped. We're working to restore them. Refresh the page to see any updates" with build pipelines in azure devops. **Usualy we can quickly solve the issue by restarting TFSAgentJob Service on Azure Devops Server side.**

Build live updates feature is based on SignalR and TFSAgentJob Service on Server side works as SignalR server. When we are suffering the issue, we will get below sequence of request from client side:

- _apis/[connectionGUID]/signalr/negotiates?xxxxxx
- _apis/[connectionGUID]/signalr/connect?xxxxxx
- _apis/[connectionGUID]/signalr/abort?xxxxxx

Above sequnce means that the SignalR client tried to connect to SingalR server and failed. So there might be some issue at the SignalR Server side.