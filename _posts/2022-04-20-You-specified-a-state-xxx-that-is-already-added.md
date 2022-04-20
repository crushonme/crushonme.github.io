---
layout: post
title: VS403091: You specified a state xxx that is already added
categories: azuredevops
description: This article describe error VS403091 You specified a state xxx that is already added
keywords: azure devops,devops,tfs,vsts
---

In Azure DevOps Server 2020 Update1, coping process will show an error "VS403091: You specified a state 0c926c15-68f7-467f-96c9-a26a19e9d718 that is already added." 

0c926c15-68f7-467f-96c9-a26a19e9d718 is the GUID of one kind of Workitem state. We can use below PowerShell script to know that 0c926c15-68f7-467f-96c9-a26a19e9d718 is Compeleted state.

```powershell
# Replace $ADOBaseUrl with your ADO url
$ADOBaseUrl = 'https://azuredevops.com/DefaultCollection/'
# Replace $PAT with token generated from ADO
$PAT = 'cg7f3lr6v2qvzak6xxxxxx4lr7m72f7dminja'
#$LogFile = "$pwd\logfile.txt"

$Base64PAT = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes(":$PAT"))
$basicAuthValue = "Basic $Base64PAT"
$Headers = @{
    Authorization = $basicAuthValue
}

$ProcessURL = "$ADOBaseUrl" + "_apis/work/processes?api-version=6.0-preview.1“
Write-Debug $ProcessURL
$ProcessCollection = Invoke-RestMethod -Uri $ProcessURL -Method Get  -Headers $Headers -ContentType "application/json"

$ProcessCollection.value | ForEach-Object {
    $ProcessID = $_.typeId
    $ProcessName = $_.name
    #Write-Warning "======================= Process Name: $ProcessName ============================`n"
    #"======================= Process Name: $ProcessName ============================`n" | Out-File -FilePath $LogFile -Append
    $WorkitemURL = "$ADOBaseUrl" + ”/_apis/work/processes/$ProcessID/workitemtypes?api-version=6.0-preview.1“
    $WorkItemCollection = Invoke-RestMethod -Uri $WorkitemURL -Method Get  -Headers $Headers -ContentType "application/json"
    $WorkItemCollection.value | ForEach-Object {
        $WorkItemName = $_.name
        #Write-Warning "--------------- Workitem Name: $WorkItemName -------------`n"
        #"--------------- Workitem Name: $WorkItemName -------------`n" | Out-File -FilePath $LogFile  -Append
        $WorkItemRefName = $_.id
        $WorkItemStateURL = "$ADOBaseUrl" + "_apis/work/processes/$ProcessID/workItemTypes/$WorkItemRefName/states?api-version=6.0-preview.1"
        #Write-Debug $WorkItemStateURL
        $WorkItemStateCollection = Invoke-RestMethod -Uri $WorkItemStateURL -Method Get  -Headers $Headers -ContentType "application/json"
        $WorkItemStateCollection.value | ForEach-Object {
            $WorkItemStateName = $_.name
            $WorkItemStateId = $_.id
            #Write-Host "+ Workitem State Name: $WorkItemStateName ID:$WorkItemStateId`n"
            #"+ Workitem State Name: $WorkItemStateName ID:$WorkItemStateId`n" | Out-File -FilePath $LogFile  -Append
            if ($WorkItemStateId -eq '0c926c15-68f7-467f-96c9-a26a19e9d718') {
                Write-Host "Got the WorkItem State:（$WorkItemStateName) in Process：($ProcessName) with Workitem:($WorkItemName)" -ForegroundColor Red
            }
        }
    }
}
```

After we know which state caused the issue, we can temprorily disable the customized compeleted work item state and try to copy the process again.

Another workaround is changing your language to English. This issue only occurs in other language locale.