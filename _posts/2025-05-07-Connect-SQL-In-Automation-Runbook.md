---
layout: post
title: How to set up passwordless connection to Azure SQL Database with runbook in Azure Automation?
categories: SQLDB
description: N/A
keywords: Azure SQL Database,sqldb,runbook,Azure automation
---

There are many different solutions for automating Azure SQL database management, such as [Automate management tasks in Azure SQL -- Elastic Job](https://learn.microsoft.com/en-us/azure/azure-sql/database/job-automation-overview?view=azuresql), Power Automation,Azure Automation. This document we will discuss about Hhow ow to set up passwordless connection to Azure SQL Database with runbook in Azure Automation.

# Detail Steps

To set up passwordless connection to Azure SQL Database with runbook in Azure Automation, we can use system assigned mananed identity or user assigned mananged identity.

All steps are the same except for mananged identity setup.

## Mananged Identity Setup

### System Assigned Mananged Identity Setup
If the Automation system managed identity is OFF, pleae sign in to the Azure portal and go to your automation account. Then in the automation account page, under ***Account Settings***, select ***Identity***. Under the ***System assigned*** tab, select the ***Status*** as ***ON***.
![](https://learn.microsoft.com/en-us/azure/automation/media/manage-sql-server-in-automation/system-assigned-managed-identity-status-on-expanded.png#lightbox)

After the System Managed Identity is ON, we need to add role assignment for the system assigned mananged identity and assign ***SQL Database Contributor*** for target SQL Server..
![](https://learn.microsoft.com/en-us/azure/automation/media/manage-sql-server-in-automation/add-role-assignment-expanded.png#lightbox)

### User Assigned Mananged Identity Setup

- Create a User Assigned Mananged Identity if you do not have one according to [Create and assign a User Assigned Managed Identity](https://learn.microsoft.com/en-us/azure/operator-service-manager/how-to-create-user-assigned-managed-identity).
- Add role Assignment for above User assigned mananged identity and assign ***SQL Database Contributor*** for target SQL Server.
![](https://learn.microsoft.com/en-us/azure/automation/media/manage-sql-server-in-automation/add-role-assignment-expanded.png#lightbox)
- Associate the User Assigned Mananged Identity to your Automation account using the Azure portal
![](https://learn.microsoft.com/en-us/azure/automation/media/add-user-assigned-identity/user-assigned-managed-identity.png)


## User Setup at Azure SQL Database side

We need to create a database user for above System assigned mananged identity or user assigned mananged identity and assign minimal roles per your need.

1) In the [Azure portal](https://portal.azure.com), browse to your SQL database and select **Query editor (preview)**.

2) Select **Continue as `<your-username>`** on the right side of the screen to sign into the database using your account.

3) On the query editor view, run the following T-SQL commands:

    ```sql
    -- Get the object id of your mananged identity and replace xxxxxxxxxxxxxxxxxxxxx
    -- Replace IdentityName with your mananged identity name
    CREATE USER [IdentityName] FROM EXTERNAL PROVIDER WITH object_id = 'xxxxxxxxxxxxxxxxxxxxx';
    -- Asssign right role based on your requirements.
    ALTER ROLE db_datareader ADD MEMBER [IdentityName];
    ALTER ROLE db_datawriter ADD MEMBER [IdentityName];
    ALTER ROLE db_ddladmin ADD MEMBER [IdentityName];
    GO
    ```

    ![](https://learn.microsoft.com/en-us/azure/azure-sql/database/media/passwordless-connections/query-editor-user.png?view=azuresql#lightbox)

## Runbook Setup

Below is the sample code to connect Azure SQL Database and get the databases list in that Azure SQL Server.

1. PowerShell runbook
    ```powershell
    param(
            [parameter(Mandatory=$True)]
            [string] $SqlServer,
        
            [parameter(Mandatory=$True)]
            [string] $Database,
            
            [parameter(Mandatory=$False)]
            [int] $FragPercentage = 20,
    
            [parameter(Mandatory=$False)]
            [int] $SqlServerPort = 1433,
            
            [parameter(Mandatory=$False)]
            [boolean] $RebuildOffline = $False,
    
            [parameter(Mandatory=$False)]
            [string] $Table
                      
        )
        # System assigned mananged identity
        $AzureContext = Connect-AzAccount -Identity 
        # $AzureContext = Connect-AzAccount -Identity -AccountId object_id_of_User_assigned_identiy
        "Set and store context"
        $AzureContext = Set-AzContext -SubscriptionName $AzureContext.context.Subscription -DefaultProfile $AzureContexcontext
        $Token = (Get-AZAccessToken -ResourceUrl https://database.windows.net).Token
    
        "Try to connect SQL"
        $SqlConnection = New-Object System.Data.SqlClient.SqlConnection
        $SqlConnection.ConnectionString = "Data Source = tcp:$SqlServer.database.windows.net,$SqlServerPort;Initial Catalog=$Database;Encrypt=True;Application Name=PowerShell Runbook"
        $SqlConnection.AccessToken = $accessToken.access_token
        $SqlConnection.Open()
         
        $sqlcmd = $SqlConnection.CreateCommand()
        $query = "SELECT name, collation_name FROM sys.databases"
        $sqlcmd.CommandText = $query
        $adp = New-Object System.Data.SqlClient.SqlDataAdapter $sqlcmd
        $data = New-Object System.Data.DataSet
        $adp.Fill($data) | out-null
        $data.Tables 
    ```

2. PowerShell Workflow runbook

    ```powershell
    workflow WorkflowRunbook
    {
        param(
            [parameter(Mandatory=$True)]
            [string] $SqlServer,
        
            [parameter(Mandatory=$True)]
            [string] $Database,
                
            [parameter(Mandatory=$False)]
            [int] $FragPercentage = 20,
    
            [parameter(Mandatory=$False)]
            [int] $SqlServerPort = 1433,
            
            [parameter(Mandatory=$False)]
            [boolean] $RebuildOffline = $False,
    
            [parameter(Mandatory=$False)]
            [string] $Table
        )
        if ($($env:computerName) -eq "Client") 
        {"Runbook running on Azure Client sandbox"} 
        else {
            "Runbook running on " + $env:computerName}
        # System assigned mananged identity
        $AzureContext = Connect-AzAccount -Identity 
        # $AzureContext = Connect-AzAccount -Identity -AccountId object_id_of_User_assigned_identiy
        "Set and store context"
        $AzureContext = Set-AzContext -SubscriptionName $AzureContext.context.Subscription -DefaultProfile $AzureContexcontext
        $Token = (Get-AZAccessToken -ResourceUrl https://database.windows.net).Token
    
        "Try to connect SQL"
        $SqlConnection = New-Object System.Data.SqlClient.SqlConnection
        $SqlConnection.ConnectionString = "Data Source = tcp:$SqlServer.database.windows.net,$SqlServerPort;Initial Catalog=$Database;Encrypt=True;Application Name=PowerShell Runbook"
        $SqlConnection.AccessToken = $accessToken.access_token
        $SqlConnection.Open()
         
        $sqlcmd = $SqlConnection.CreateCommand()
        $query = "SELECT name, collation_name FROM sys.databases"
        $sqlcmd.CommandText = $query
        $adp = New-Object System.Data.SqlClient.SqlDataAdapter $sqlcmd
        $data = New-Object System.Data.DataSet
        $adp.Fill($data) | out-null
        $data.Tables 
    }
    ```
> ***NOTES***
>
>  In PowerShell workflow inlinescript, do not forget Using scope modifier before refernce parameters. refer to [InlineScript Variables](https://learn.microsoft.com/en-us/powershell/module/psworkflow/about/about_inlinescript?view=powershell-5.1#inlinescript-variables)

    
# Refernce Resources
- [Using a user-assigned managed identity for an Azure Automation account](https://learn.microsoft.com/en-us/azure/automation/add-user-assigned-identity#assign-a-role-to-a-user-assigned-managed-identity)
- [Using a system-assigned managed identity for an Azure Automation account](https://learn.microsoft.com/en-us/azure/automation/enable-managed-identity-for-automation)
- [Manage databases in Azure SQL database using Azure Automation](https://learn.microsoft.com/en-us/azure/automation/manage-sql-server-in-automation)
- [Manage databases in Azure SQL Database by using Azure Automation](https://learn.microsoft.com/en-us/azure/azure-sql/database/automation-manage?view=azuresql)