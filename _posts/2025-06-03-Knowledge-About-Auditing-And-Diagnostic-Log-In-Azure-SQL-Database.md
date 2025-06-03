---
layout: post
title: Knowlege about Auditing and Diagnostic log in Azure SQL Database.
categories: SQLDB
description: This blog introduced concepts of Auditing and Diagnostic log in Azure SQL Database.
keywords: sqldb, AzureSQL,auditing,diagnostic
---

Auditing for Azure SQL Database tracks database events and writes them to an audit log in your Azure storage account, Log Analytics workspace, or Event Hubs. And Diagnostic log for Azure SQL Database can help us to identify performance related issue.

This blog serves as a FAQ for Auditing and Diagnostic logs related to Azure SQL Database.

## How to query Auditing Log and Diagnostic log strored in Log Analytics Workspace?

Audit events are written to Log Analytics workspace defined during auditing configuration, to the AzureDiagnostics table with the category SQLSecurityAuditEvents, and table with the category DevOpsOperationsAudit for Microsoft Support Operations.

[Audit log fields](https://learn.microsoft.com/en-us/azure/azure-sql/database/audit-log-format?view=azuresql#subheading-1) provided the schema of auditing log in Log Analytics.

<details><summary>Expand to check sample queries in LAW</summary>

>NOTES
>
> Replace the ResourceId and database_name_s with your acutal resource and database.

- Check SQL exeuction event

```
AzureDiagnostics
| where Category == 'SQLSecurityAuditEvents'
| where ResourceId == '/SUBSCRIPTIONS/799C164D-xxxx-42DA-8658-489CBFE60EDE/RESOURCEGROUPS/SQL/PROVIDERS/MICROSOFT.SQL/SERVERS/SQLSERVERSEA-xxxx/DATABASES/MASTER' and database_name_s == 'xxxxx'
| where action_id_s in('RCM ','BCM ')
| project event_time_t,statement_s,succeeded_s,affected_rows_d,server_principal_name_s,client_ip_s,application_name_s,additional_information_s,data_sensitivity_information_s
| order by event_time_t desc
```

- Check Database AUthetnication Events

```
AzureDiagnostics
| where Category == 'SQLSecurityAuditEvents'
| where ResourceId == '/SUBSCRIPTIONS/799C164D-xxxx-42DA-8658-489CBFE60EDE/RESOURCEGROUPS/SQL/PROVIDERS/MICROSOFT.SQL/SERVERS/SQLSERVERSEA-xxxx/DATABASES/MASTER' and database_name_s == 'xxxxx'
| where action_id_s in('DBAS','DBAF')
| project event_time_t,action_id_s,succeeded_s,server_principal_name_s,client_ip_s,application_name_s,client_tls_version_d,database_name_s,host_name_s
| order by event_time_t desc
```

- Check Database AUthetnication Events Trends

```
AzureDiagnostics
| where Category == 'SQLSecurityAuditEvents'
| where ResourceId == '/SUBSCRIPTIONS/799C164D-xxxx-42DA-8658-489CBFE60EDE/RESOURCEGROUPS/SQL/PROVIDERS/MICROSOFT.SQL/SERVERS/SQLSERVERSEA-xxxx/DATABASES/MASTER' and database_name_s == 'xxxxx'
| where action_id_s in('DBAS','DBAF')
| summarize count() by action_name_s,bin(originalEventTimestamp_t,15m)
| render timechart 
```

- Check Database AUthetnication Failure Events

```
AzureDiagnostics
| where Category == 'SQLSecurityAuditEvents'
| where ResourceId == '/SUBSCRIPTIONS/799C164D-xxxx-42DA-8658-489CBFE60EDE/RESOURCEGROUPS/SQL/PROVIDERS/MICROSOFT.SQL/SERVERS/SQLSERVERSEA-xxxx/DATABASES/MASTER' and database_name_s == 'xxxxx'
| where action_id_s in('DBAF')
| project-reorder event_time_t,action_id_s,succeeded_s,server_principal_name_s,client_ip_s,application_name_s,client_tls_version_name_s,database_name_s,host_name_s,additional_information_s
| order by event_time_t desc
```

</details>

## What's the difference between Auditing and Diagnostic logs for Azure SQL Database

- Purpuse:Just like the difference in the name, Auditing log is used for auditing and Diagnostic log is used for diagnostic.

- File format: Both Auditing log and Diagnostic log comsume from extended events log. However Diagnostic log is stored as json file.

- Container Name: The container name should be sqldbauditlogs for storing audit logs in the Storage Account. For Diagnostic log, the container name format is insights-logs-\<category-name\>, for example insights-log-deadlocks.

- Event Category: Auditing log includes BATCH_COMPLETED_GROUP/SUCCESSFUL_DATABASE_AUTHENTICATION_GROUP/FAILED_DATABASE_AUTHENTICATION_GROUP by default. And in Diagnostic log, there are lots of different category including following: 
  - SQL Insights
  - Automatic tuning
  - Query Store Runtime Statistics
  - Query Store Wait Statistics
  - Errors
  - Database Wait Statistics
  - Timeouts
  - Blocks
  - Deadlocks
  - Basic
  - InstanceAndAppAdvanced
  - WorkloadManagement
  - SQL security Audit Event
  - Devops operations Audit Logs

  > NOTES
  >
  > Enabling the Audit category in the diagnostic settings for Azure SQL Database does not activate auditing for the database. To enable database auditing, you have to enable it from the auditing blade for Azure Database.
  > ***It means we need to enable Database-Level Auditing for "SQL security Audit Event" and "Devops operations Audit Logs".***
  >
  > Reference: [How to enable Auditing in Azure SQL Databases to Storage account and store logs in JSON format](https://techcommunity.microsoft.com/blog/azuresqlblog/how-to-enable-auditing-in-azure-sql-databases-to-storage-account-and-store-logs-/4407354)

## What's the difference between Database Level Auditing and Server Level Auditing

[Auditing policy at the server and database level](https://learn.microsoft.com/en-us/azure/azure-sql/database/auditing-server-level-database-level?view=azuresql)

<details><summary>Expand to get the official content</summary>

- A server policy applies to all existing and newly created databases on the server.

- If server auditing is enabled, it always applies to the database. The database is audited regardless of the database auditing settings.

- When an auditing policy is defined at the database-level to a Log Analytics workspace or an Event Hubs destination, the following operations don't keep the source database-level auditing policy:

    - Database copy

    - Point-in-time restore

    - Geo-replication (secondary database doesn't have database-level auditing)

- Enabling auditing on the database in addition to enabling auditing on the server doesn't override or change any of the settings of the server auditing. Both audits exist side by side. In other words, the database is audited twice in parallel; once by the server policy and once by the database policy.

> NOTES
>
> No matter if it's Database-Level or Server-Level auditing, the log should have the same content for the specific database.
>
> You should avoid enabling both server auditing and database blob auditing together, unless:
>
> - You want to use a different storage account, retention period or Log Analytics Workspace for a specific database.
> - You want to audit event types or categories for a specific database that differ from the rest of the databases on the server. For example, you might have table inserts that need to be audited only for a specific database.
>
> Otherwise, we recommended that you enable only server-level auditing and leave the database-level auditing disabled for all databases.

</details>

## How To Query Auditing Log stored in Storage Account

[sys.fn_get_audit_file](https://learn.microsoft.com/en-us/sql/relational-databases/system-functions/sys-fn-get-audit-file-transact-sql?view=sql-server-ver17&tabs=sqlserver) and [sys.fn_get_audit_file_v2 (recommended)](https://learn.microsoft.com/en-us/sql/relational-databases/system-functions/sys-fn-get-audit-file-v2-transact-sql?view=azuresqldb-current&viewFallbackFrom=sql-server-ver16) are used for query auditing log stored in Azure Storage.

The path pattern should be  \<Storage_endpoint\>\<Container\>\<ServerName\>/\<DatabaseName\>/\<AuditName\>\<CreationDate>/<FileName\>.xel.
- The storage endpoint contains https://\<storagename\>.blob.core.windows.net and we can get the storage name in the audit settings.
- The container name is fixed to sqldbauditlogs.
- Server Name is the name of your logic server.
- AuditName has four possible options:

    | Auditing Policy | Retention | AuditName                             |
    |-----------------|-----------|---------------------------------------|
    | Server-Level    | Yes       | SqlDbAuditing_ServerAudit             |
    | Server-Level    | No        | SqlDbAuditing_ServerAudit_NoRetention |
    | Database-Level  | Yes       | SqlDbAuditing_Audit                   |
    | Database-Level  | No        | SqlDbAuditing_Audit_NoRetention       |

- ***DatabaseName*** should always be the target database name for database level auditing. However there are two possible options for Server-Level Auditing. For new auditing design architecture, the database name of Server-Level Auditing should be master. For classic deprecated ledgency one, the database name is target database name.

> NOTES
>
> file_pattern parameter is used to specify a blob URL (including the storage endpoint and container). While it ***doesn't support an asterisk wildcard***, you can ***use a partial file (blob) name prefix (instead of the full blob name)*** to collect multiple files (blobs) that begin with this prefix.

<details><summary>Expand to check the examples</summary>

### Check all audit files (blobs) for the specific database.

```sql
SELECT *
FROM sys.fn_get_audit_file(
    'https://mystorage.blob.core.windows.net/sqldbauditlogs/ShiraServer/MayaDB/SqlDbAuditing_Audit/2017-07-14/10_45_22_173_1.xel',
    DEFAULT,
    DEFAULT
);
GO
```

### Check all audit files (blobs) from Server-Level Auditig log for specific database.

```sql
SELECT *
FROM sys.fn_get_audit_file(
    'https://mystorage.blob.core.windows.net/sqldbauditlogs/ShiraServer/master/SqlDbAuditing_ServerAudit/',
    DEFAULT,
    DEFAULT
);
GO
```

### Check all audit files (blobs) from Server-Level Auditig log for specific database between 2023-11-17T08:40:40Z and 2023-11-17T09:10:40Z.

```sql
SELECT *
FROM sys. fn_get_audit_file_v2(
    'https://<storage_account>.blob.core.windows.net/sqldbauditlogs/server_name/master/SqlDbAuditing_ServerAudit/',
    DEFAULT,
    DEFAULT,
    '2023-11-17T08:40:40Z',
    '2023-11-17T09:10:40Z')
```

</details>

