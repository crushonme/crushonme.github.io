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

### Actual Scenario - State change from New to Active

Below is the sample. We can see the value of System.State changes from New to Active in the changes history. We can use this change as condition to check "State change from New to Active"

```json
{
      "id": 6,
      "workItemId": 1,
      "rev": 3,
      "revisedBy": {
        "id": "764a73bf-ac8b-41d9-8dee-d4f5f0edf711",
        "name": "Jamal Hartnett <fabrikamfiber4@hotmail.com>",
        "displayName": "Jamal Hartnett",
        "uniqueName": "fabrikamfiber4@hotmail.com",
        "url": "https://vssps.dev.azure.com/fabrikam/_apis/Identities/764a73bf-ac8b-41d9-8dee-d4f5f0edf711",
        "imageUrl": "https://dev.azure.com/fabrikam/_api/_common/identityImage?id=764a73bf-ac8b-41d9-8dee-d4f5f0edf711"
      },
      "revisedDate": "2017-09-04T02:36:25.3Z",
      "fields": {
        "System.Rev": {
          "oldValue": 2,
          "newValue": 3
        },
        "System.AuthorizedDate": {
          "oldValue": "2017-09-04T02:28:56.253Z",
          "newValue": "2017-09-04T02:36:18.75Z"
        },
        "System.RevisedDate": {
          "oldValue": "2017-09-04T02:36:18.75Z",
          "newValue": "2017-09-04T02:36:25.3Z"
        },
        "System.IterationId": {
          "oldValue": 3,
          "newValue": 4
        },
        "System.IterationLevel2": {
          "oldValue": "Iteration 1",
          "newValue": "Iteration 2"
        },
        "System.State": {
          "oldValue": "New",
          "newValue": "Active"
        },
        "System.Reason": {
          "oldValue": "New",
          "newValue": "Approved"
        },
        "System.ChangedDate": {
          "oldValue": "2017-09-04T02:28:56.253Z",
          "newValue": "2017-09-04T02:36:18.75Z"
        },
        "System.Watermark": {
          "oldValue": 8,
          "newValue": 11
        },
        "System.IterationPath": {
          "oldValue": "MyAgilePro1\\Iteration 1",
          "newValue": "MyAgilePro1\\Iteration 2"
        },
        "Microsoft.VSTS.Common.StateChangeDate": {
          "oldValue": "2017-09-04T02:08:16.6Z",
          "newValue": "2017-09-04T02:36:18.75Z"
        },
        "Microsoft.VSTS.Common.ActivatedDate": {
          "newValue": "2017-09-04T02:36:18.75Z"
        },
        "Microsoft.VSTS.Common.ActivatedBy": {
          "newValue": {
            "displayName": "Jamal Hartnett",
            "url": "https://vssps.dev.azure.com/fabrikam/_apis/Identities/d291b0c4-a05c-4ea6-8df1-4b41d5f39eff",
            "_links": {
              "avatar": {
                "href": "https://dev.azure.com/mseng/_apis/GraphProfile/MemberAvatars/aad.YTkzODFkODYtNTYxYS03ZDdiLWJjM2QtZDUzMjllMjM5OTAz"
              }
            },
            "id": "d291b0c4-a05c-4ea6-8df1-4b41d5f39eff",
            "uniqueName": "fabrikamfiber4@hotmail.com",
            "imageUrl": "https://dev.azure.com/fabrikam/_api/_common/identityImage?id=d291b0c4-a05c-4ea6-8df1-4b41d5f39eff",
            "descriptor": "aad.YTkzODFkODYtNTYxYS03ZDdiLWJjM2QtZDUzMjllMjM5OTAz"
          }
        },
        "Microsoft.VSTS.TCM.SystemInfo": {
          "newValue": "step 2"
        },
        "Microsoft.VSTS.TCM.ReproSteps": {
          "newValue": "step 1"
        },
        "System.Tags": {
          "oldValue": "",
          "newValue": "beauty"
        }
      },
      "url": "https://dev.azure.com/fabrikam/6ce954b1-ce1f-45d1-b94d-e6bf2464ba2c/_apis/wit/workItems/1/updates/6"
    }
```