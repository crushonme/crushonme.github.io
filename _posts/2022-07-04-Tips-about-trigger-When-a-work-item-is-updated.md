---
layout: post
title: Tips about trigger "When a work item is updated" in Power Platform
categories: powerautomate
description: This article describe Tips about trigger "When a work item is updated" in Power Platform
keywords: azure devops,devops,powerautomate,logic app,power automate
---

There are four triggers about Azure DevOps work item. What we most use is "When a work item is updated". It's very useful to customize different updates in Azure DevOps work item.

> Refer to [Azure DevOps Triggers in Power Automate](https://docs.microsoft.com/en-us/connectors/visualstudioteamservices/#triggers)
>
> You can replace below "Trigger Conditions" to Condition Actions in all below tips.

Below we listed several different scenario:

## When work item state changes

we usually can use below condition to check work item state changes

```
# Prefer
@equals(formatDateTime(triggerOutputs()?['body/fields']['Microsoft_VSTS_Common_StateChangeDate'], 'yyyy-MM-dd-hh-mm'),formatDateTime(triggerOutputs()?['body/fields']['System_ChangedDate'], 'yyyy-MM-dd-hh-mm'))
```
or
```
@equals(formatDateTime(triggerOutputs()?['body/fields']['Microsoft_VSTS_Common_StateChangeDate'], 'yyyy-MM-dd-hh-mm'),formatDateTime(utcNow(), 'yyyy-MM-dd-hh-mm'))
```

## When work item state changes to active

```
@and(equals(formatDateTime(triggerOutputs()?['body/fields']['Microsoft_VSTS_Common_StateChangeDate'], 'yyyy-MM-dd-hh-mm'),formatDateTime(utcNow(), 'yyyy-MM-dd-hh-mm')),equals(triggerOutputs()?['body/fields']['System_State'], 'Active'))
```

## More complexed changes

For more complexed changes we can use [List work item updates](https://docs.microsoft.com/en-us/rest/api/azure/devops/wit/updates/list?view=azure-devops-rest-5.1) to get all updates and [Get work item updates](https://docs.microsoft.com/en-us/rest/api/azure/devops/wit/updates/get?view=azure-devops-rest-5.1) to get latest updates.

Then we can use the "Condition Actions" to detect the changes.

Below is the sample:
1. Create a "Send an HTTP request to Azure DevOps" action and use the REST API in [List work item updates](https://docs.microsoft.com/en-us/rest/api/azure/devops/wit/updates/list?view=azure-devops-rest-5.1) and replace the {id} with ID from "When a work item is updated" trigger
![](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/ListAllWorkItemUpdates.png)

1. Create a "Parse Json" action and use the Body from last steps. Generate Json Schema use the sample from [List of work item updates Sample Response](https://docs.microsoft.com/en-us/rest/api/azure/devops/wit/updates/list?view=azure-devops-rest-5.1#list-of-work-item-updates)
![](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/ParseAllWorkItemUpdatesToGetTheCount.png)

1. Create a "Initialize a variable" action and use the "count" from last steps
![](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/InitializeLastUpdateNumberFromJsonResult.png)

1. Create another "Send an HTTP request to Azure DevOps" action 
    - use the REST API in [Get work item updates](https://docs.microsoft.com/en-us/rest/api/azure/devops/wit/updates/get?view=azure-devops-rest-5.1)
    - replace the {id} with ID from "When a work item is updated" trigger
    - replace the {updateNumber} with LastUpdateNumber from step 3.

    ![](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/GetLatestWorkItemUpdate.png)
1. Now we can add a condition to check the result in last changes.