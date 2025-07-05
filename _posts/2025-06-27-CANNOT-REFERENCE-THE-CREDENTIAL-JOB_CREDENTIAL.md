---
layout: post
title: Adding Step will throw error "Elastic jobs management operation failed. Cannot reference the credential 'job_credential', because it does not exist or you do not have permission." from Azure Portal.
categories: SQLDB
description: This blog introduced an issue about adding stpes for elastic job in Azure Portal.
keywords: sqldb, AzureSQL,Elastic job,Azure Portal
---

When we setup Elastic jobs from Azure Portal, you might see the error of "Elastic jobs management operation failed. Cannot reference the credential 'job_credential', because it does not exist or you do not have permission.". In this blog, I will introduce how to troubleshoot and resolve this issue.

# Reproduce Steps

1. Setup an Elastic Job agent
1. Setup a Job Database and a target Database
1. Create  database-scoped credentials in each database
1. Create a target group
1. Create a Job and add elastic job step in Azure Portal. Then we will see "Elastic jobs management operation failed. Cannot reference the credential 'job_credential', because it does not exist or you do not have permission.".

# Troubleshooting

1. Collect F12 network trace and found that the request of [Job Steps - Create Or Update - REST API (Azure SQL Database) | Microsoft Learn](https://learn.microsoft.com/en-us/rest/api/sql/job-steps/create-or-update?view=rest-sql-2021-11-01&tabs=HTTP) returns 400 with error “Elastic jobs management operation failed. Cannot reference the credential 'job_credential', because it does not exist or you do not have permission.”

2. Checking the stored procedure for elastic job in job database. And found one possible possible code which returned the error: [jobs_internal].sp_add_jobstep_data
It seems that HAS_PERMS_BY_NAME(@credential_name, 'DATABASE SCOPED CREDENTIAL', 'REFERENCES') returned wrong value when the request was initialized from Azure Portal.

# Workaround

1. Adding elastic job steps with T-SQL.
2. Using User assigned mananged identity(UMI).

# Solution

Grant database scoped credential access to jobs_resource_manager.
```sql
ALTER AUTHORIZATION ON DATABASE SCOPED CREDENTIAL::<credential-name> TO jobs_resource_manager
```

# Root Cause

When creating a job step, we validate that the user has permissions to the credential. When using REST APIs, or any clients (Portal, Powershell), Azure SQL Database will impersonate the user role ***jobs_resource_manager*** that is created as part of jobs db initialization. Therefore when the Azure SQL Database backend service creates any credentials, it will give access to this user role so that it can manage database scoped credentials. It does this by running the follow T-SQL command

```sql
ALTER AUTHORIZATION ON DATABASE SCOPED CREDENTIAL::<credential-name> TO jobs_resource_manager
```

Since we create the credential through T-SQL, the jobs_resource_manager does not have access to the credential; therefore Portal also does not have access to it. Which is causing this permission issue.
 
This issue does not occur when creating job step through T-SQL API because we are logged in as a different user role that already has access to the credential.

# Reference

[Grant permission to Elastic jobs database](https://elasticjobsmanager.azureops.org/docs/grant-permission.html)

[Post from Cody Konior](https://x.com/codykonior/status/1891361272584687720)