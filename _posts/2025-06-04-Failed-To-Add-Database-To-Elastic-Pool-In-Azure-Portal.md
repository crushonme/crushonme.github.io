---
layout: post
title: Failed To Add Database To Elastic Pool In Azure Portal.
categories: SQLDB
description: This blog introduced an issue about adding database to Elastic Pool with error 'System' is not a valid database edition in this version of SQL Server.
keywords: sqldb, AzureSQL,Elastic Pool,Azure Portal
---

When we try to add a General Purpose Azure SQL Database to Basic Elastic pool, we got error "'System' is not a valid database edition in this version of SQL Server.". This blog introduced the solutions and troubleshooting steps.

It's a BUG of Azure Portal. The portal caculate the database maxSizeBytes in wrong way. The caculated maxSizeBytes is 53687091200 for a SQLDB_GP_S_Gen5_1 database which is not a valid maxsize for database in basic elastic pool.

# Solutions

Solution 1: Use Azure CLI or PowerShell Command to add the database to Elastic Pool.

<details><summary>Click to get the PowerShell command sample</summary>

```powershell
Set-AzSqlDatabase -ResourceGroupName "rgname" -DatabaseName "dbname" -ServerName "sqlservername" -ElasticPoolName "epname"
```
</details>

Solution 2: Check the database maxsize configuration and make sure that the maxsize is less than the max size of elastic pool. Scale the database max size to lower and then add it to the Elastic Pool.

# Toubleshooting

Azure Portal sends the request of [capabilities/?api-version=2023-05-01-preview&include=supportedElasticPoolEditions](https://learn.microsoft.com/en-us/rest/api/sql/capabilities/list-by-location?view=rest-sql-2023-08-01&tabs=HTTP) to get the basic capabilities of Basic Elastic Pool. And then caculate the next greater SupportedmaxSize than the selected db maxsize for DTU based elastic pool.

    Below is the capabilities response of Basic Elastic Pool from backend.
    ```json
    {
        "performanceLevel": {
            "value": 50.0,
            "unit": "DTU"
        },
        "sku": {
            "name": "BasicPool",
            "tier": "Basic",
            "capacity": 50
        },
        "supportedLicenseTypes": [],
        "maxDatabaseCount": 100,
        "includedMaxSize": {
            "limit": 5000,
            "unit": "Megabytes"
        },
        "supportedMaxSizes": [
            {
                "minValue": {
                    "limit": 5000,
                    "unit": "Megabytes"
                },
                "maxValue": {
                    "limit": 5000,
                    "unit": "Megabytes"
                },
                "scaleSize": {
                    "limit": 0,
                    "unit": "Megabytes"
                },
                "status": "Default"
            }
        ],
        "supportedPerDatabaseMaxSizes": [
            {
                "minValue": {
                    "limit": 100,
                    "unit": "Megabytes"
                },
                "maxValue": {
                    "limit": 100,
                    "unit": "Megabytes"
                },
                "scaleSize": {
                    "limit": 0,
                    "unit": "Megabytes"
                },
                "status": "Available"
            },
            {
                "minValue": {
                    "limit": 500,
                    "unit": "Megabytes"
                },
                "maxValue": {
                    "limit": 500,
                    "unit": "Megabytes"
                },
                "scaleSize": {
                    "limit": 0,
                    "unit": "Megabytes"
                },
                "status": "Available"
            },
            {
                "minValue": {
                    "limit": 1,
                    "unit": "Gigabytes"
                },
                "maxValue": {
                    "limit": 1,
                    "unit": "Gigabytes"
                },
                "scaleSize": {
                    "limit": 0,
                    "unit": "Gigabytes"
                },
                "status": "Available"
            },
            {
                "minValue": {
                    "limit": 2,
                    "unit": "Gigabytes"
                },
                "maxValue": {
                    "limit": 2,
                    "unit": "Gigabytes"
                },
                "scaleSize": {
                    "limit": 0,
                    "unit": "Gigabytes"
                },
                "status": "Default"
            },
            {
                "minValue": {
                    "limit": 50,
                    "unit": "Gigabytes"
                },
                "maxValue": {
                    "limit": 50,
                    "unit": "Gigabytes"
                },
                "scaleSize": {
                    "limit": 0,
                    "unit": "Gigabytes"
                },
                "status": "Visible",
                "reason": "'System' is not a valid database edition in this version of SQL Server."
            }
        ],
        "supportedPerDatabaseMaxPerformanceLevels": [
            {
                "limit": 5.0,
                "unit": "DTU",
                "supportedPerDatabaseMinPerformanceLevels": [
                    {
                        "limit": 0.0,
                        "unit": "DTU",
                        "status": "Default"
                    },
                    {
                        "limit": 5.0,
                        "unit": "DTU",
                        "status": "Available"
                    }
                ],
                "status": "Default"
            }
        ],
        "zoneRedundant": false,
        "supportedMaintenanceConfigurations": [
            {
                "name": "SQL_Default",
                "zoneRedundant": false,
                "status": "Default"
            }
        ],
        "supportedZones": [],
        "status": "Default"
    }
    ```

    Since our database maxsize is greater than 2GB and less than 50 GB, Portal choosed next greater SupportedmaxSize which value is 50GB. From the response we also can see the status is "Visible" and reson is "'System' is not a valid database edition in this version of SQL Server."

    In conclusion, Azure portal should filter the status and throw error when the maxsize of adding database is greater than the maxsize of Elastic Pool.
