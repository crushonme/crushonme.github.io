---
layout: post
title: How to avoid idle connections in Azure SQL Database with proxy connection policy?
categories: SQLDB
description: 
keywords: sqldb, AzureSQL,sql mi,Azure SQL MI,Mananged Instance, idle connection,proxy mode
---

In Azure SQL we have two connections policies:
- Proxy: the default option when you connect from on-premises without any ExpressRoute or Site-to-Site VPN. This policy requires port 1433 to open to connect to the Azure SQL Database gateway.

- Redirect: the default option when you connect within Azure or from On-premises if you have implemented an ExpressRoute or Site-to-Site VPN. This policy requires ports 1433 to connect to the Azure SQL Database gateway and 11000 to 11999 to establish connections directly to the node hosting the database. If you are connecting through a Private Endpoint Connection (Private Link), the port range is 1433 to 65535.

Below is the connetivity architecture of Azure SQL Datbase. For Azure SQL MI, it's more complex and you can refer to [Connectivity architecture for Azure SQL Managed Instance](https://learn.microsoft.com/en-us/azure/azure-sql/managed-instance/connectivity-architecture-overview?view=azuresql)
![Connectivity architecture](https://learn.microsoft.com/en-us/azure/azure-sql/database/media/connectivity-architecture/connectivity-overview.svg?view=azuresql)

In this blog, I will discuss about the solutions for idle connections killed by gateway with Proxy connection policy. [Azure SQL Database idle sessions are killed after about 30 minutes when "Proxy" connection policy](https://techcommunity.microsoft.com/blog/azuredbsupport/azure-sql-database-idle-sessions-are-killed-after-about-30-minutes-when-proxy-co/3268601) provide the steps to reproduce the issue.

The best solution is using redirection connection policy. However it will increase [our networking cost in Azure](https://azure.microsoft.com/en-us/pricing/details/private-link/). Is there any other solutions?

Yes, of course.

With non-pooling database connections, the connection lifecycle generally lasts less than 30 minutes. However, when using a connection pool, the lifecycle can extend beyond 30 minutes. To avoid idle session termination by the gateway after 30 minutes, there are several possible solutions:

1. Send a "keepalive" package to avoid the connection bing idle more than 30 minutes.
2. Remove idle connection more than 30 minutes from conenction pool.
3. We also can manage the lifecycle of the connections within the connection pool to avoid idle more than 30 minutes.

Since different connection pool might have different implemtation, I will provide several samples for different connection pool solutions in the following sections.

## HikariCP
[Configuration of HikariCP (knobs, baby!)](https://github.com/brettwooldridge/HikariCP?tab=readme-ov-file#gear-configuration-knobs-baby)

> ***NOTES***
>
> HikariCP uses *milliseconds* for all time values.

### Manange idleTimeout

idleTimeout property controls the maximum amount of time that a connection is allowed to sit idle in the pool. ***This setting only applies when minimumIdle is defined to be less than maximumPoolSize.*** Idle connections will not be retired once the pool reaches minimumIdle connections. Whether a connection is retired as idle or not is subject to a maximum variation of +30 seconds, and average variation of +15 seconds. A connection will never be retired as idle before this timeout. A value of 0 means that idle connections are never removed from the pool. The minimum allowed value is 10000ms (10 seconds). Default: 600000 (10 minutes)

> NOTES
>
> To use this solution, make sure that minimumIdle is defined to be less than maximumPoolSize.
>
> ***Default value of minimumIdle is same as maximumPoolSize***.
> minimumIdle property controls the minimum number of idle connections that HikariCP tries to maintain in the pool. If the idle connections dip below this value and total connections in the pool are less than maximumPoolSize, HikariCP will make a best effort to add additional connections quickly and efficiently. ***However, for maximum performance and responsiveness to spike demands, we recommend not setting this value and instead allowing HikariCP to act as a fixed size connection pool***

### Manange lifecycle

maxLifetime property controls the maximum lifetime of a connection in the pool. An in-use connection will never be retired, only when it is closed will it then be removed. On a connection-by-connection basis, minor negative attenuation is applied to avoid mass-extinction in the pool. ***We strongly recommend setting this value, and it should be several seconds shorter than any database or infrastructure imposed connection time limit.*** A value of 0 indicates no maximum lifetime (infinite lifetime), subject of course to the idleTimeout setting. The minimum allowed value is 30000ms (30 seconds). Default: 1800000 (30 minutes)

> NOTES
>
> If we use maxLifetime as workaround, make sure that the value is less than 1800000.

### KeepAliveTime

[KeepAliveTime parameter in HikariCP](https://techcommunity.microsoft.com/blog/azuredbsupport/lesson-learned-509-keepalivetime-parameter-in-hikaricp/4256912)

This property controls how frequently HikariCP will attempt to keep a connection alive, in order to prevent it from being timed out by the database or network infrastructure. **This value must be less than the maxLifetime value.** A "keepalive" will only occur on an idle connection. When the time arrives for a "keepalive" against a given connection, that connection will be removed from the pool, "pinged", and then returned to the pool. The 'ping' is one of either: invocation of the JDBC4 *isValid()* method, or execution of the *connectionTestQuery*. Typically, the duration out-of-the-pool should be measured in single digit milliseconds or even sub-millisecond, and therefore should have little or no noticeable performance impact. ***The minimum allowed value is 30000ms (30 seconds), but a value in the range of minutes is most desirable. Default: 120000 (2 minutes)***

## Apache Commons Pool

[Apache Commons Pool BasicDataSource Configuration Parameters](https://commons.apache.org/proper/commons-dbcp/configuration.html)
- Eventually, you'll have connections between *maxTotal* and *maxIdle* closed immediately.
- Connections between *maxIdle* and *minIdle* closed after *minEvictableIdleTimeMillis* .
- Connections between *minIdle* and 0 closed after *softMinEvictableIdleTimeMillis* and reopened immediately. Give or take the eviction check period.

Make sure that the value of *minEvictableIdleTimeMillis*,*softMinEvictableIdleTimeMillis* and *timeBetweenEvictionRunsMillis* is less than ***half of 1800000***.

## Alibaba Druid

### keepAlive

Connections within the *minIdle* count in the connection pool will perform a keepAlive operation if their idle time exceeds *minEvictableIdleTimeMillis*.
> NOTES
>
> *timeBetweenEvictionRunsMillis* controls The number of milliseconds to sleep between runs of the idle connection validation/cleaner thread. 
>
> Make sure that the value of *minEvictableIdleTimeMillis* and *timeBetweenEvictionRunsMillis* is less than ***half of 1800000***.

## Sqlalchemy

[Setting Pool Recycle](https://docs.sqlalchemy.org/en/14/core/pooling.html#setting-pool-recycle)

*pool_recycle* prevents the pool from using a particular connection that has passed a certain age, and is appropriate for database backends such as MySQL that automatically close connections that have been stale after a particular period of time.

```python
from sqlalchemy import create_engine

e = create_engine("mssql+pyodbc://xxxx.database.windows.net:1433/test?driver=ODBC+Driver+17+for+SQL+Server", pool_recycle=1800)
```
