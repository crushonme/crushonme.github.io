---
layout: post
title: Unable to delete Azure SQL database.
categories: SQLDB
description: 
keywords: sqldb, AzureSQL,Elastic Job,Job Database
---

When you delete Azure SQL Database, Portal might return error with "The database xxx on server xxxx is used by job account xxxx. Database cannot be deleted or renamed while associated with job account;".

Just like the error message mentioned, the database cannot be deleted or renamed while associated with job account. So you should search the job account name in your Azure Portal and delete the ELastic Job agent first. Then you can delete the database now.

> ***NOTES: PLEASE MAKE SURE THAT THE JOB AGENT IS NOT NEEDED.***

[Waht's Elastic Job](https://learn.microsoft.com/en-us/azure/azure-sql/database/elastic-jobs-overview?view=azuresql#elastic-jobs-overview)

In SQL Server, we have [SQL Server Agent](https://learn.microsoft.com/en-us/ssms/agent/sql-server-agent) which provide the feature of scheduled tasks,aka jobs.

To provide similar feature in Azure SQL Database, Microsoft developped Elastic Jobs, which provide job scheduling services that execute custom jobs on one or many databases in Azure SQL Database or Azure SQL Database elastic pools.