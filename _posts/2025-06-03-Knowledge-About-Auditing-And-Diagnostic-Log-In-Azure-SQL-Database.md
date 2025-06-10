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
[Details of telemetry available for Diagnostic logs for Azure SQL Database](https://learn.microsoft.com/en-us/azure/azure-sql/database/metrics-diagnostic-telemetry-logging-streaming-export-configure?view=azuresql&tabs=azure-portal#basic-logs) provided the schema of different category for Diagnostic log in Log Analytics.

<details><summary><strong>Expand to check sample queries in LAW</strong></summary>

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

- Check Database Diagnostic log for Timeouts

```
AzureDiagnostics
| where Category == "Timeouts"
| where ResourceId == '/SUBSCRIPTIONS/799C164D-xxxx-42DA-8658-489CBFE60EDE/RESOURCEGROUPS/SQL/PROVIDERS/MICROSOFT.SQL/SERVERS/SQLSERVERSEA-xxxx/DATABASES/xxxx'
| project TimeGenerated,error_state_d,query_hash_s,query_plan_hash_s

```

- Check Database Diagnostic log for Blockings

```
AzureDiagnostics
| where Category == "Blocks"
| where ResourceId == '/SUBSCRIPTIONS/799C164D-xxxx-42DA-8658-489CBFE60EDE/RESOURCEGROUPS/SQL/PROVIDERS/MICROSOFT.SQL/SERVERS/SQLSERVERSEA-xxxx/DATABASES/xxxx'
| project TimeGenerated,lock_mode_s,resource_owner_type_s,blocked_process_filtered_s,duration_d

```

- Check Database Diagnostic log for DatabaseWaitStatistics

```
AzureDiagnostics
| where Category == "DatabaseWaitStatistics"
| where ResourceId == '/SUBSCRIPTIONS/799C164D-xxxx-42DA-8658-489CBFE60EDE/RESOURCEGROUPS/SQL/PROVIDERS/MICROSOFT.SQL/SERVERS/SQLSERVERSEA-xxxx/DATABASES/xxxx'
| project TimeGenerated,start_utc_date_t,end_utc_date_t,wait_type_s,delta_max_wait_time_ms_d,delta_signal_wait_time_ms_d,delta_wait_time_ms_d,delta_waiting_tasks_count_d
```

- Check Database Diagnostic log for QueryStoreWaitStatistics

```
AzureDiagnostics
| where Category == "QueryStoreWaitStatistics"
| where ResourceId == '/SUBSCRIPTIONS/799C164D-xxxx-42DA-8658-489CBFE60EDE/RESOURCEGROUPS/SQL/PROVIDERS/MICROSOFT.SQL/SERVERS/SQLSERVERSEA-xxxx/DATABASES/xxxx'
| extend interval_start_time_date = interval_start_time_d / 4294967296
| extend interval_start_time_time = interval_start_time_d - 4294967296 * interval_start_time_date
| extend qdsStatsIntervalStart = datetime(1900-1-1) + time(1d) * interval_start_time_date + time(1s) * (interval_start_time_time / 300.0)
| extend interval_end_time_date = interval_end_time_d / 4294967296
| extend interval_end_time_time = interval_end_time_d - 4294967296 * interval_end_time_date
| extend qdsStatsIntervalEnd = datetime(1900-1-1) + time(1d) * interval_end_time_date + time(1s) * (interval_end_time_time / 300.0)
| project TimeGenerated,LogicalServerName_s,DatabaseName_s,query_hash_s,is_primary_b,qdsStatsIntervalStart,qdsStatsIntervalEnd,exec_type_d,wait_category_s,count_executions_d,total_query_wait_time_ms_d,max_query_wait_time_ms_d,is_parameterizable_s,statement_type_s,query_id_d,statement_key_hash_s,plan_id_d,query_param_type_d,statement_sql_handle_s
```

- Check Database Diagnostic log for QueryStoreRuntimeStatistics

```
AzureDiagnostics
| where Category == "QueryStoreRuntimeStatistics"
| where ResourceId == '/SUBSCRIPTIONS/799C164D-xxxx-42DA-8658-489CBFE60EDE/RESOURCEGROUPS/SQL/PROVIDERS/MICROSOFT.SQL/SERVERS/SQLSERVERSEA-xxxx/DATABASES/xxxx'
| extend interval_start_time_date = interval_start_time_d / 4294967296
| extend interval_start_time_time = interval_start_time_d - 4294967296 * interval_start_time_date
| extend qdsStatsIntervalStart = datetime(1900-1-1) + time(1d) * interval_start_time_date + time(1s) * (interval_start_time_time / 300.0)
| extend interval_end_time_date = interval_end_time_d / 4294967296
| extend interval_end_time_time = interval_end_time_d - 4294967296 * interval_end_time_date
| extend qdsStatsIntervalEnd = datetime(1900-1-1) + time(1d) * interval_end_time_date + time(1s) * (interval_end_time_time / 300.0)
| project  TimeGenerated,LogicalServerName_s,DatabaseName_s,query_hash_s,query_plan_hash_s,is_primary_b,qdsStatsIntervalStart,qdsStatsIntervalEnd,cpu_time_d,max_cpu_time_d,count_executions_d,dop_d,rowcount_d,max_rowcount_d,query_max_used_memory_d,max_query_max_used_memory_d,duration_d,max_duration_d,log_bytes_used_d,max_log_bytes_used_d,execution_type_d,query_id_d,plan_id_d,statement_sql_handle_s,logical_io_reads_d,logical_io_writes_d,max_logical_io_reads_d,max_logical_io_writes_d,physical_io_reads_d,max_physical_io_reads_d
```

- Check Database Diagnostic log for AutomaticTunning

```
AzureDiagnostics
| where Category == "AutomaticTuning"
| where ResourceId == '/SUBSCRIPTIONS/799C164D-xxxx-42DA-8658-489CBFE60EDE/RESOURCEGROUPS/SQL/PROVIDERS/MICROSOFT.SQL/SERVERS/SQLSERVERSEA-xxxx/DATABASES/xxxx'
| project TimeGenerated,OptionName_s,OptionDesiredState_s,OptionActualState_s,OptionDisableReason_s,IsDisabledBySystem_d,DatabaseDesiredMode_s,DatabaseActualMode_s
| summarize StartTime=min(TimeGenerated),EndTime=max(TimeGenerated) by OptionName_s,OptionDesiredState_s,OptionActualState_s,OptionDisableReason_s,IsDisabledBySystem_d,DatabaseDesiredMode_s,DatabaseActualMode_s
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

<details><summary><strong>Expand to get the official content</strong></summary>

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
- AuditName has four possible options and it depends on Auditing Policy and retention policy:

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

<details><summary><strong>Expand to check the examples</strong></summary>

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

