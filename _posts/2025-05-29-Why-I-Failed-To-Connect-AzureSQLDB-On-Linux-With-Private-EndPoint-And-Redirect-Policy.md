---
layout: post
title: DAB deployed in AKS failed to connect Azure SQL Database with redirection connection policy when private endpoint enabled.
categories: SQLDB
description: In recent deployments, users have encountered a significant issue with Data API Builder (DAB) failing to connect to Azure SQL Database when hosted in Azure Kubernetes Service (AKS) with redirect connection policy and private endpoint enabled. This blog post will delve into the phenomenon, its root causes, and the proposed solutions.
keywords: sqldb, AzureSQL,SqlClient,SNI,Redirect,Private Endpoint,Linux
---

In recent deployments, users have encountered a significant issue with Data API Builder (DAB) failing to connect to Azure SQL Database when hosted in Azure Kubernetes Service (AKS) with redirect connection policy and private endpoint enabled. This blog post will delve into the phenomenon, its root causes, and the proposed solutions.

# Objectives

- The problem arises when DAB is unable to start due to connectivity issues with the Azure SQL Database in AKS.
- The SQL server's networking is configured with public access blocked, and applications connect through a private endpoint.
- The connection policy is set to 'redirect'.
- The SqlClient version is 5.2.0.

# Investigation and Findings

## Planning

1. Collect network trace
1. The issue occured in AKS. We can test it with Azure VM and Docker with private endpoint and redirection connection policy and same SqlClient version.
1. Since the behavior of connection was controled by SQL driver, it might be related with SqlClient driver. We can colect trace of SqlClient to get Advanced Trace.
1. Create a simple console program to test connection with same environment.

## Observing

### Network trace

In the network trace, we can see DAB send the DNS request at first step and then setup connection with backend gateway. However it did not send the request to backend instance.

### Test in VM and docker

In Azure Windows VM, we failed to reproduce the issue. However we can reproduce the issue in docker.

### SqlClient Trace

Since it's difficult to collect SqlClient trace, we collected it in Docker. For details step, refer to [Collect a .NET Core SQL Driver Trace](https://github.com/microsoft/CSS_SQL_Networking_Tools/wiki/Collect-a-.NET-Core-SQL-Driver-Trace)

In the SqlClient Trace hosted in Docker, we can see Azure SQL Database returned the routine info ***server=tcp:servername-replacement.database.windows.net\e46078f45c73,6817*** and send SSRP request (***SSRP.SendUDPRequest***) to get the port.

> NOTES: What's SSRP?
>
>[SSRP - SQL Server Resolution Protocol](https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-wpo/c67adffd-2740-435d-bda7-dc66fb13f1b7)
>
> [[MC-SQLR]: SQL Server Resolution Protocol](https://learn.microsoft.com/en-us/openspecs/windows_protocols/mc-sqlr/1ea6e25f-bff9-4364-ba21-5dc449a601b7)

```markdown
Microsoft.Data.SqlClient.EventSource/Trace message="<sc|SqlAuthenticationProviderManager|Ctor|Info>Neither SqlClientAuthenticationProviders nor SqlAuthenticationProviders configuration section found." 
Microsoft.Data.SqlClient.EventSource/AdvancedTrace message="<sc.SqlInternalConnectionTds.LoginNoFailover|ADV> 4, host=tcp:servername-replacement.database.windows.net,1433" 
Microsoft.Data.SqlClient.EventSource/AdvancedTrace message="TdsParserStateObject.IncrementPendingCallbacks | ADV | State Object Id 1, after incrementing _pendingCallbacks: 1" 
Microsoft.Data.SqlClient.EventSource/AdvancedTrace message="<sc.SqlInternalConnectionTds.AttemptOneLogin|ADV> 4, timout=29978[msec], server=tcp:servername-replacement.database.windows.net,1433" 
……
Microsoft.Data.SqlClient.EventSource/AdvancedTrace message="<sc.SqlInternalConnectionTds.AttemptOneLogin|ADV> 4, timout=29287[msec], server=tcp:servername-replacement.database.windows.net\e46078f45c73,6817
Microsoft.Data.SqlClient.EventSource/Trace message="TdsParser.Connect | SEC | Connection Object Id 4, Authentication Mode: ActiveDirectoryManagedIdentity" 
Microsoft.Data.SqlClient.EventSource/SNITrace message="SNICommon.GetDnsIpAddresses | INFO | Getting DNS host entries for serverName servername-replacement.database.windows.net within 29285 milliseconds." 
Microsoft.Data.SqlClient.EventSource/SNITrace message="SSRP.SendUDPRequest | INFO | Waiting for UDP Client to fetch Port info." 
Microsoft.Data.SqlClient.EventSource/Trace message="SNIProxy.CreateConnectionHandle | Info | Session Id null, SNI Handle Type: null" 
Microsoft.Data.SqlClient.EventSource/AdvancedTrace message="< sc.TdsParser.ProcessSNIError |ERR|ADV > Error message Detail: " 
Microsoft.Data.SqlClient.EventSource/AdvancedTrace message="<sc.TdsParser.ProcessSNIError |ERR|ADV > Empty error message received from SNI. Error Message = , SNI Error Number =26" 
Microsoft.Data.SqlClient.EventSource/AdvancedTrace message="<sc.TdsParser.ProcessSNIError |ERR|ADV > SNI Native Error Code = 0" 
Microsoft.Data.SqlClient.EventSource/Trace message="SqlError.ctor | ERR | Info Number 0, Error State 0, Error Class 20, Error Message 'A network-related or instance-specific error occurred while establishing a connection to SQL Server. The server was not found or was not accessible. Verify that the instance name is correct and that SQL Server is configured to allow remote connections. (provider: TCP Provider, error: 26 - Error Locating Server/Instance Specified)', Procedure '', Line Number 0, Batch Index -1" 
```

In the SqlClient Trace hosted in Windows VM, we can see Azure SQL Database returned the routine info ***server=tcp:servername-replacement.database.windows.net\e46078f45c73,6817*** and then setup SSL connection with backend instance.

```log
Microsoft.Data.SqlClient.EventSource/Trace message="<sc.TdsParser.Connect|SEC> Prelogin handshake successful" 
Microsoft.Data.SqlClient.EventSource/Trace message="<sc.TdsParser.TdsLogin|SEC> Sending federated authentication feature request & wirte = False" 
Microsoft.Data.SqlClient.EventSource/AdvancedTrace message="<sc.TdsParser.TdsLogin|ADV> 7, TDS Login7 flags = 268436448:" 
Microsoft.Data.SqlClient.EventSource/Trace message="<sc.TdsParser.TdsLogin|SEC> Sending federated authentication feature request" 
Microsoft.Data.SqlClient.EventSource/Trace message="<sc.TdsParser.TdsLogin|SEC> Sending federated authentication feature request & wirte = True" 
Microsoft.Data.SqlClient.EventSource/AdvancedTraceBin message="TdsParser.ReadNetworkPacketAsyncCallback | INFO | ADV | State Object Id 7, Packet read. In Buffer System.Byte[], In Bytes Read: System.Byte[]" 
Microsoft.Data.SqlClient.EventSource/AdvancedTrace message="TdsParserStateObject.TryProcessHeader | ADV | State Object Id 7, Client Connection Id 1e46f94d-b18a-450e-a9d6-996e9e2adb53, Server process Id (SPID) 0" 
Microsoft.Data.SqlClient.EventSource/Trace message="<sc.TdsParser.TryRun|SEC> Received login acknowledgement token" 
Microsoft.Data.SqlClient.EventSource/AdvancedTrace message="<sc.SqlInternalConnectionTds.OnEnvChange|ADV> 9, Received routing info" 
Microsoft.Data.SqlClient.EventSource/AdvancedTrace message="<sc.SqlInternalConnectionTds.OnFeatureExtAck|ADV> 9, Received feature extension acknowledgement for SQLDNSCACHING" 
Microsoft.Data.SqlClient.EventSource/AdvancedTrace message="<sc.SqlInternalConnectionTds.CompleteLogin|ADV> Post-Login Phase: Server connection obtained." 
Microsoft.Data.SqlClient.EventSource/Trace message="<sc.SqlInternalConnectionTds.LoginNoFailover> Routed to tcp:servername-replacement.database.windows.net,1433" 
Microsoft.Data.SqlClient.EventSource/AdvancedTrace message="TdsParserStateObject.DecrementPendingCallbacks | ADV | State Object Id 7, after decrementing _pendingCallbacks: 0" 
Microsoft.Data.SqlClient.EventSource/Trace message="TdsParserStateObjectFactory.CreateTdsParserStateObject | Info | AppContext switch 'Switch.Microsoft.Data.SqlClient.UseManagedNetworkingOnWindows' not enabled, native networking implementation will be used." 
Microsoft.Data.SqlClient.EventSource/AdvancedTrace message="TdsParserStateObject.IncrementPendingCallbacks | ADV | State Object Id 8, after incrementing _pendingCallbacks: 1" 
Microsoft.Data.SqlClient.EventSource/AdvancedTrace message="<sc.SqlInternalConnectionTds.AttemptOneLogin|ADV> 9, timout=29967[msec], server=tcp:servername-replacement.database.windows.net\e46078f45c73,6817" 
Microsoft.Data.SqlClient.EventSource/Trace message="TdsParser.Connect | SEC | Connection Object Id 9, Authentication Mode: ActiveDirectoryManagedIdentity" 
Microsoft.Data.SqlClient.EventSource/Trace message="<sc.TdsParser.Connect|SEC> Sending prelogin handshake" 
```

We also verified that client send SSRP request with port 1434 in the network trace.
Why SqlClient send SSRP requests to get port event though Azure SQL Database has provided the port in routine info? "RTFSC (READ THE FUCKING SOURCE CODE :-)" ^_^

Below is the call tree for SSRP request. 

[CreateTcpHandle](https://github.com/dotnet/SqlClient/blob/1eabf801496a02627daaa933a7d59fa09c45dc7e/src/Microsoft.Data.SqlClient/netcore/src/Microsoft/Data/SqlClient/SNI/SNIProxy.cs#L193)  
|--> [GetPortByInstanceName](https://github.com/dotnet/SqlClient/blob/1eabf801496a02627daaa933a7d59fa09c45dc7e/src/Microsoft.Data.SqlClient/netcore/src/Microsoft/Data/SqlClient/SNI/SSRP.cs#L37)  
|--> |--> [SendUDPRequest](https://github.com/dotnet/SqlClient/blob/1eabf801496a02627daaa933a7d59fa09c45dc7e/src/Microsoft.Data.SqlClient/netcore/src/Microsoft/Data/SqlClient/SNI/SSRP.cs#L171)


In the function CreateTcpHandle, it will send SSRP only when IsSsrpRequired is true.
```csharp
if (details.IsSsrpRequired)
{
    try
    {
        details.ResolvedPort = port = isAdminConnection ?
                SSRP.GetDacPortByInstanceName(hostName, details.InstanceName, timeout, parallel, ipPreference) :
                SSRP.GetPortByInstanceName(hostName, details.InstanceName, timeout, parallel, ipPreference);
    }
    catch (SocketException se)
    {
        SNILoadHandle.SingletonInstance.LastError = new SNIError(SNIProviders.TCP_PROV, SNICommon.ErrorLocatingServerInstance, se);
        return null;
    }
}
else if (details.Port != -1)
{
    port = details.Port;
}
else
{
    port = isAdminConnection ? DefaultSqlServerDacPort : DefaultSqlServerPort;
}
```

[Search IsSsrpRequired in SqlClient source code](https://github.com/search?q=repo%3Adotnet%2FSqlClient%20IsSsrpRequired&type=code)

The default value for IsSsrpRequired is false and SqlClient wil set it to true in the function [InferConnectionDetails](https://github.com/dotnet/SqlClient/blob/1eabf801496a02627daaa933a7d59fa09c45dc7e/src/Microsoft.Data.SqlClient/netcore/src/Microsoft/Data/SqlClient/SNI/SNIProxy.cs#L563-L587). And the processing in function [InferConnectionDetails](https://github.com/dotnet/SqlClient/blob/1eabf801496a02627daaa933a7d59fa09c45dc7e/src/Microsoft.Data.SqlClient/netcore/src/Microsoft/Data/SqlClient/SNI/SNIProxy.cs#L563-L587), it will parse port used by Azure SQL backend instance from datasource passed from routing information.

So the issue becomes to why SqlClient parsed ***server=tcp:servername-replacement.database.windows.net\e46078f45c73,6817*** in a wrong manner within Docker and AKS?

Now I began thinking about why the issue only occurred in Docker and AKS? We've done our best to control all other variables while troubleshooting this issue. So, what exactly sets Docker/AKS apart from a Windows VM?

Yes.The OS version. In Docker and AKS, we used Linux as OS and in Windows VM,it's Windows OS.

### A simple console repro

We created a dotnet core console application and try to reproduce the isue in Linux OS.

```csharp
// See https://aka.ms/new-console-template for more information

using Microsoft.Data.SqlClient;

Console.WriteLine("Press Enter to Start");
Console.ReadLine();
var SERVER = "servername-replacement.database.windows.net,1433";
var DATABASE = "master";
var UID = "xxxxxxxx"; //Client ID of the user assigned manage identity
string connectionString = $$"""SERVER={{SERVER}};Initial Catalog={{DATABASE}};Authentication=Active Directory Managed Identity;User Id={{UID}};Encrypt=yes;TrustServerCertificate=false;Connection Timeout=30;App=UbuntuVM;Pooling=False;""";

Console.WriteLine("Start connect to Azure SQL Database");
string queryString = "SELECT name FROM sys.databases;";
using SqlConnection connection = new(connectionString);
using SqlCommand command = new(queryString, connection);
//    command.CommandTimeout = 5;
command.Connection.Open();
Console.WriteLine("ClientConnectionId: {0}", command.Connection.ClientConnectionId);
SqlDataReader reader = command.ExecuteReader();
while (reader.Read())
{
    var maxColum = reader.FieldCount;
    for (var i = 0; i < maxColum; i++)
    {
        Console.Write(String.Format("{0}\t", reader[i]));
    }
}
// Call Close when done reading.
reader.Close();
Console.WriteLine("ServerVersion: {0}", command.Connection.ServerVersion);
Console.WriteLine("State: {0}", command.Connection.State);
```

Good news is that we reproduced the issue in Ubuntu. Below is the exception callstack and we can see it's similar with the call tree from code review.

```log
Press Enter to Start

Start connect to Azure SQL Database
Unhandled exception. Microsoft.Data.SqlClient.SqlException (0x80131904): A network-related or instance-specific error occurred while establishing a connection to SQL Server. The server was not found or was not accessible. Verify that the instance name is correct and that SQL Server is configured to allow remote connections. (provider: TCP Provider, error: 26 - Error Locating Server/Instance Specified)
 ---> System.Net.Sockets.SocketException (0x80004005): Success
   at Microsoft.Data.SqlClient.SNI.SSRP.GetPortByInstanceName(String browserHostName, String instanceName, TimeoutTimer timeout, Boolean allIPsInParallel, SqlConnectionIPAddressPreference ipPreference)
   at Microsoft.Data.SqlClient.SNI.SNIProxy.CreateTcpHandle(DataSource details, TimeoutTimer timeout, Boolean parallel, SqlConnectionIPAddressPreference ipPreference, String cachedFQDN, SQLDNSInfo& pendingDNSInfo, Boolean tlsFirst, String hostNameInCertificate, String serverCertificateFilename)
   at Microsoft.Data.SqlClient.SqlInternalConnection.OnError(SqlException exception, Boolean breakConnection, Action`1 wrapCloseInAction)
   at Microsoft.Data.SqlClient.TdsParser.ThrowExceptionAndWarning(TdsParserStateObject stateObj, SqlCommand command, Boolean callerHasConnectionLock, Boolean asyncClose)
   at Microsoft.Data.SqlClient.TdsParser.Connect(ServerInfo serverInfo, SqlInternalConnectionTds connHandler, TimeoutTimer timeout, SqlConnectionString connectionOptions, Boolean withFailover)
   at Microsoft.Data.SqlClient.SqlInternalConnectionTds.AttemptOneLogin(ServerInfo serverInfo, String newPassword, SecureString newSecurePassword, TimeoutTimer timeout, Boolean withFailover)
   at Microsoft.Data.SqlClient.SqlInternalConnectionTds.LoginNoFailover(ServerInfo serverInfo, String newPassword, SecureString newSecurePassword, Boolean redirectedUserInstance, SqlConnectionString connectionOptions, SqlCredential credential, TimeoutTimer timeout)
   at Microsoft.Data.SqlClient.SqlInternalConnectionTds.OpenLoginEnlist(TimeoutTimer timeout, SqlConnectionString connectionOptions, SqlCredential credential, String newPassword, SecureString newSecurePassword, Boolean redirectedUserInstance)
   at Microsoft.Data.SqlClient.SqlInternalConnectionTds..ctor(DbConnectionPoolIdentity identity, SqlConnectionString connectionOptions, SqlCredential credential, Object providerInfo, String newPassword, SecureString newSecurePassword, Boolean redirectedUserInstance, SqlConnectionString userConnectionOptions, SessionData reconnectSessionData, Boolean applyTransientFaultHandling, String accessToken, DbConnectionPool pool, Func`3 accessTokenCallback)
   at Microsoft.Data.SqlClient.SqlConnectionFactory.CreateConnection(DbConnectionOptions options, DbConnectionPoolKey poolKey, Object poolGroupProviderInfo, DbConnectionPool pool, DbConnection owningConnection, DbConnectionOptions userOptions)
   at Microsoft.Data.ProviderBase.DbConnectionFactory.CreateNonPooledConnection(DbConnection owningConnection, DbConnectionPoolGroup poolGroup, DbConnectionOptions userOptions)
   at Microsoft.Data.ProviderBase.DbConnectionFactory.TryGetConnection(DbConnection owningConnection, TaskCompletionSource`1 retry, DbConnectionOptions userOptions, DbConnectionInternal oldConnection, DbConnectionInternal& connection)
   at Microsoft.Data.ProviderBase.DbConnectionInternal.TryOpenConnectionInternal(DbConnection outerConnection, DbConnectionFactory connectionFactory, TaskCompletionSource`1 retry, DbConnectionOptions userOptions)
   at Microsoft.Data.ProviderBase.DbConnectionClosed.TryOpenConnection(DbConnection outerConnection, DbConnectionFactory connectionFactory, TaskCompletionSource`1 retry, DbConnectionOptions userOptions)
   at Microsoft.Data.SqlClient.SqlConnection.TryOpen(TaskCompletionSource`1 retry, SqlConnectionOverrides overrides)
   at Microsoft.Data.SqlClient.SqlConnection.Open(SqlConnectionOverrides overrides)
   at Microsoft.Data.SqlClient.SqlConnection.Open()
   at Program.<Main>$(String[] args)
ClientConnectionId:1aa23556-b829-451d-b4b2-7d73b74a574b
Routing Destination:servername-replacement.database.windows.net\e46078f45c73,6817
```

OK. Then let's think about what's the difference of SqlClient between Windows and Linux(Unix).

As we know that SqlClient uses a native implementation of the SNI network interface by default on Windows. To enable the use of a managed SNI implementation, we can set the AppContext switch "***Switch.Microsoft.Data.SqlClient.UseManagedNetworkingOnWindows***" to true at application startup.

Let's add above switch in our sample code.

```csharp
// See https://aka.ms/new-console-template for more information

using Microsoft.Data.SqlClient;

Console.WriteLine("Press Enter to Start");
Console.ReadLine();
var SERVER = "servername-replacement.database.windows.net,1433";
var DATABASE = "master";
var UID = "xxxxxxxx"; //Client ID of the user assigned manage identity
string connectionString = $$"""SERVER={{SERVER}};Initial Catalog={{DATABASE}};Authentication=Active Directory Managed Identity;User Id={{UID}};Encrypt=yes;TrustServerCertificate=false;Connection Timeout=30;App=UbuntuVM;Pooling=False;""";

AppContext.SetSwitch("Switch.Microsoft.Data.SqlClient.UseManagedNetworkingOnWindows", true);
Console.WriteLine("Start connect to Azure SQL Database");
string queryString = "SELECT name FROM sys.databases;";
using SqlConnection connection = new(connectionString);
using SqlCommand command = new(queryString, connection);
//    command.CommandTimeout = 5;
command.Connection.Open();
Console.WriteLine("ClientConnectionId: {0}", command.Connection.ClientConnectionId);
SqlDataReader reader = command.ExecuteReader();
while (reader.Read())
{
    var maxColum = reader.FieldCount;
    for (var i = 0; i < maxColum; i++)
    {
        Console.Write(String.Format("{0}\t", reader[i]));
    }
}
// Call Close when done reading.
reader.Close();
Console.WriteLine("ServerVersion: {0}", command.Connection.ServerVersion);
Console.WriteLine("State: {0}", command.Connection.State);
```

Build above code with SqlClient 5.2.0 and we successfully reproduced the issue in Windows. And when we upgrade the SqlClient to 5.2.3, the issue is gone.

Why?

Since there is no tag or branch for 5.2.0 release, we have to use ILSPY to check the code of 5.2.0 release. OK, let's check below code. Even though it successfuly parses the port in if(num > -1) branch, it will set the IsSsrpRequired to true in the next condition branch.

```csharp
private bool InferConnectionDetails()
{
	string[] array = _dataSourceAfterTrimmingProtocol.Split('\\', ',');
	ServerName = array[0].Trim();
	int num = _dataSourceAfterTrimmingProtocol.IndexOf(',');
	int num2 = _dataSourceAfterTrimmingProtocol.IndexOf('\\');
	if (num > -1)
	{
		string text = ((num2 <= -1) ? array[1].Trim() : ((num > num2) ? array[2].Trim() : array[1].Trim()));
		if (string.IsNullOrEmpty(text))
		{
			ReportSNIError(SNIProviders.INVALID_PROV);
			return false;
		}
		if (_connectionProtocol == Protocol.None)
		{
			_connectionProtocol = Protocol.TCP;
		}
		else if (_connectionProtocol != Protocol.TCP)
		{
			ReportSNIError(SNIProviders.INVALID_PROV);
			return false;
		}
		if (!int.TryParse(text, out var result))
		{
			ReportSNIError(SNIProviders.TCP_PROV);
			return false;
		}
		if (result < 1)
		{
			ReportSNIError(SNIProviders.TCP_PROV);
			return false;
		}
		Port = result;
	}
	if (num2 > -1)  //<-- Here is the BUG. Even though it successfuly parses the port in above code, 
                    //<-- it will set the IsSsrpRequired to true in blow code.
	{
		InstanceName = array[1].Trim();
		if (string.IsNullOrWhiteSpace(InstanceName))
		{
			ReportSNIError(SNIProviders.INVALID_PROV);
			return false;
		}
		if ("mssqlserver".Equals(InstanceName))
		{
			ReportSNIError(SNIProviders.INVALID_PROV);
			return false;
		}
		IsSsrpRequired = true;  //<-- it sets the IsSsrpRequired to true.
	}
	InferLocalServerName();
	return true;
}
```

[Fix | Fix unit test for SPN to include port number with Managed SNI](https://github.com/dotnet/SqlClient/pull/2281) and [](https://github.com/dotnet/SqlClient/pull/2281/files) introduced the BUG. And it was fixed by [Regression | Revert PR #2281 SNIProxy code change](https://github.com/dotnet/SqlClient/pull/2395)

There are several issue reported and here is the list:

- [Errors after upgrading to 5.2.0 from 5.1.5 on Linux](https://github.com/dotnet/SqlClient/issues/2378)
- [Error after upgrading 5.1.5 to 5.2.0 on linux container](https://github.com/dotnet/SqlClient/issues/2385)
- [[Bug]: DAB fails to connect to Azure SQL server](https://github.com/Azure/data-api-builder/issues/2690)

# Additional Questions

## Why it only reproduced with Private Endpoint?
Let's collect SqlClient trace with public network access and redirect connection policy.

In the trace, we can see Azure SQL Database returned backend instance with the format of "tcp:instancename.backend-server-name.database.windows.net,port" for public network access with redirect connection policy.

And for private endpoint, it's "tcp://servername.database.windows.net/instancename,port".

## Why it works normal with Proxy Connection Policy?

For Proxy Connection Policy, the connection to backend instance is created by gateway instead of SQL client. So there is no issue.

# Solution for DAB

[DAB used 5.2.0 version SqlClient in the project configuration.](https://github.com/Azure/data-api-builder/blob/de1477c514cd3aa8fbf15e8344e298c016b7d86b/src/Directory.Packages.props#L36) We can update the SqlClient version to 5.2.3 and create a local build.
