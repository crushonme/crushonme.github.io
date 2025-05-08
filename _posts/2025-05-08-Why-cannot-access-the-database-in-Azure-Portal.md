---
layout: post
title: Why cannot access the database in Azure Portal?
categories: SQLDB
description: N/A
keywords: Azure SQL Database,sqldb
---

Sometimes when we navigate to target database in Azure Portal, it might return "URI malformed" error with below callstack:
```
"URIError: URI malformed
    at decodeURIComponent (<anonymous>)
    at https://ms.portal.azure.com/Content/Dynamic/-CDJTGN00vty.js:1:40037
    at Array.forEach (<anonymous>)
    at new e (https://ms.portal.azure.com/Content/Dynamic/-CDJTGN00vty.js:1:39938)
    at new t (https://ms.portal.azure.com/Content/Dynamic/-CDJTGN00vty.js:1:41390)
    at t.batch (https://ms.portal.azure.com/Content/Dynamic/MYbNINXhLuLV.js:61:508)
    at https://ms.portal.azure.com/Content/Dynamic/MYbNINXhLuLV.js:140:3630
    at https://ms.portal.azure.com/Content/Dynamic/MYbNINXhLuLV.js:2:4295
    at Object.next (https://ms.portal.azure.com/Content/Dynamic/MYbNINXhLuLV.js:2:4400)
    at a (https://ms.portal.azure.com/Content/Dynamic/MYbNINXhLuLV.js:2:3034)"
```

If we use SSMS or Azure Data Studio to connect the Azure SQL Server, we can see the database and the data within the database though.

In Azure we have different naming rules and restrictions for different Azure resources, referring to [Naming rules and restrictions for Azure resources](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/resource-name-rules#microsoftsql). The naming rules and restrictions for Azure SQL Database listed below:
1. the name lenghth should be less than 128
2. can't use:<>*%&:\/? or control characters.
3. can't end with period or space.

However if we create the database in SSMS or Azure Data Studio with CREATE DATABASE statement, the limitation is differnt, refer to [Database identifiers](https://learn.microsoft.com/en-us/sql/relational-databases/databases/database-identifiers?view=azuresqldb-current).

For example, we can create database with name of "TestAzureNaming%RulesAndRestrictions" with below T-SQL statement:
```sql
CREATE DATABASE [TestAzureNaming%RulesAndRestrictions] ( EDITION = 'Basic');
```

***Solutions:***

[Rename a Database](https://learn.microsoft.com/en-us/sql/relational-databases/databases/rename-a-database?view=sql-server-ver16)
```sql
ALTER DATABASE [TestAzureNaming%RulesAndRestrictions]  MODIFY NAME = [TestAzureNamingRulesAndRestrictions];
```