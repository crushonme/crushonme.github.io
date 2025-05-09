---
layout: post
title: Django MigrationSchemaMissing Error With MSSQL
categories: SQLDB
description: guide to resolving the MigrationSchemaMissing error when using Django’s mssql-django backend with MSSQL(including Azure SQL Database).
keywords: sqldb, AzureSQL, django
---

Here’s a comprehensive guide to resolving the MigrationSchemaMissing error when using Django’s mssql-django backend with MSSQL(including Azure SQL Database):



## Background
When you migrate from an individual database user to  a Microsoft Entra group user or an AD group user, you might see below error if you run "python manage.py migrate":

```
raise MigrationSchemaMissing(
django.db.migrations.exceptions.MigrationSchemaMissing: Unable to create the django_migrations table (('42000', '[42000] [Microsoft][ODBC Driver 17 for SQL Server][SQL Server]The specified schema name "<db_user>@<azure_tenant_id>" either does not exist or you do not have permission to use it. (2760) (SQLExecDirectW)'))
```

## Root cause of MigrationSchemaMissing
Django’s SQL Server backend (mssql-django) uses the connected user’s default schema when creating migration tables. On Azure SQL, by default, the default_schema for Microsoft Entra group user or an AD group user is NULL, which means it has no default schema assigned. So SQL Server falls back to using the login name (e.g. <db_user>@<azure_tenant_id>) as the schema. Since that schema doesn’t exist, the table creation fails and Django raises MigrationSchemaMissing.
If we create an individual user instead of Microsoft Entra group user or an AD group user, there will be a default_schema. Then there is no error.

## How to confirm it?

We can run below T-SQL to verify:
```sql
select name,type,type_desc,default_schema_name,create_date,modify_date from sys.database_principals
where type = 'E' or type='X'
```

Possible results:

| name                    | type | type_desc      | default_schema_name | create_date             | modify_date             |
|-------------------------|------|----------------|---------------------|-------------------------|-------------------------|
| dbo                     | E    | EXTERNAL_USER  | dbo                 | 2003-04-08 09:10:42.287 | 2024-07-17 15:50:28.290 |
| MicrosoftEntraGroupName | X    | EXTERNAL_GROUP | NULL                | 2025-04-23 08:53:46.617 | 2025-04-23 08:53:46.617 |
|                         |      |                |                     |                         |                         |

Solution:

Assign a default schema to Microsoft Entra group user or an AD group user with below T-SQL statement (replace dbo with proper schema name):

```sql
ALTER USER [MicrosoftEntraGroupName] WITH DEFAULT_SCHEMA = dbo;
```

Connect the database with a user which is in the Microsoft Entra group user or an AD group user and then run below T-SQL to verify the change:

```sql
SELECT SCHEMA_NAME();
```

Alternative approaches:
If you do not use Django framework, we can easily resolve this issue by adding Model-level db_table prefixes. We can hard-code schema names per model:

```python
class MyModel(models.Model):
    # …
    class Meta:
        db_table = '[custom_schema].[my_model]'
```
Currently,however，mssql-django does not expose a global schema option in its OPTIONS settings, so database-level schema management is required .

## Conclusion
By explicitly setting a default schema, you empower Django to manage its migration history and application tables on Azure SQL without encountering MigrationSchemaMissing .