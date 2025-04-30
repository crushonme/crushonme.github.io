---
layout: post
title: The ImportExport operation failed because the storage blob already exists.
categories: SQLDB
description: N/A
keywords: export,bacpac,Azure SQL Database,sqldb
---

When attempting to import or export BACPAC from Azure SQL Database, you might encounter the error ***"The ImportExport operation failed because the storage blob already exists."*** with PowerShell or Azure CLI or ***"Failed to export the database: DB_name. ErrorCode: undefined ErrorMessage: undefined"*** with Azure Portal.

Don't worry about it. This usually indicates that public access was disabled for your Azure Storage Account.

There are two solutions for you:
1. Enable access from all network on Azure Storage Account side.
2. Using the export with private link feature. Refer to [Import or export an Azure SQL Database using private link](https://learn.microsoft.com/en-us/azure/azure-sql/database/database-import-export-private-link?view=azuresql)


>NOTES
>
> 1. ***Do not forget to approve the private link for both Azure SQL logical server and Azure Storage Account. Or the import/export operation will be stuck.***
>
> 2. ***Import/Export Private Link should not be used when the user Database or the Azure Storage account are protected by Resource locks.*** Azure SQL Database needs to drop the private endpoint when it finishes the import/export operation. If there are resource locks, it will get stuck.