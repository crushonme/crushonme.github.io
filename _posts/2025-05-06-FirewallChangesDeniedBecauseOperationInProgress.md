---
layout: post
title: Failed to create Azure SQL logical Server using ARM template with Error FirewallChangesDeniedBecauseOperationInProgress.
categories: SQLDB
description: This document explained why we get error FirewallChangesDeniedBecauseOperationInProgress when creating Azure SQL logical server using ARM template.
keywords: vnet rules,Azure SQL Database,sqldb
---

When creating an Azure SQL logical server with numerous VNet rules using an ARM template, you might encounter the error FirewallChangesDeniedBecauseOperationInProgress. This error typically means you have added more than 128 rules to a new server and are trying to add them again.

## Phenomenon

Azure SQL will return timeout when you try to add the 129th rule to the server.
```
11:39:11 PM - The deployment 'test12234311' failed with error(s). Showing 3 out of 90 error(s). Status Message: An unexpected error occured while processing the request. Tracking ID: 'cbd87e2e-8791-459b-a35a-beaaf59a64ff' (Code:InternalServerError)  Status
     | Message: The operation timed out and automatically rolled back. Please retry the operation. (Code:OperationTimedOut)  Status Message: The operation timed out and automatically rolled back. Please retry the operation. (Code:OperationTimedOut)  CorrelationId:
     | 24926cf9-02ee-467b-9542-4670046d51e8
```

And it will return FirewallChangesDeniedBecauseOperationInProgress when you try to add the rule which status is InProgress.
 ```log
 12:05:39 AM - The deployment '456901' failed with error(s). Showing 1 out of 1 error(s). Status Message: Another     operation is in progress on virtual network firewall rule rule-subnet41 on server testvnetrulelimit.
      | (Code:FirewallChangesDeniedBecauseOperationInProgress)  CorrelationId: 7d1ecf49-03bc-4b37-90db-777cc03f9657
 ```


[Virtual Network Rules - Create Or Update](https://learn.microsoft.com/en-us/rest/api/sql/virtual-network-rules/create-or-update?view=rest-sql-2023-08-01&tabs=HTTP#response) documented the error FirewallChangesDeniedBecauseOperationInProgress.

## Reason
It's a race condition issue. Azure SQL does not handle firewall rules well, which results in a race condition when adding more than 129 rules at the same time. In this scenairo, the 129th rule will always be InProgress state.

## Solutions

- Option 1: do not add more than 128 rules at the same time.
- Option 2: Use PowerShell to add them one by one.

## Reproduce Steps
1. Create 129 subnets and enable Microsoft.Sql endpoint for it in one Azure Virtual Network.
2. Adding Vnet firewall rules for these subnets with PowerShell command.And you will see the timeout error.
    ```powershell
    New-AzResourceGroupDeployment -Name $DeployName -ResourceGroupName $RG -TemplateFile $Path
    ```
3. Get SQL Vnet rules and find out the one with status InProgress with below PowerShell.
    ```powershell
    Get-AzSqlServerVirtualNetworkRule -ResourceGroupName $RGName -ServerName $SqlServerName | Where-Object { $_.State -ne "Ready" }
    ```
4. Create a Vnet rule for that subnet again and then we will get the error.
    ```powershell
    New-AzResourceGroupDeployment -Name $DeployName -ResourceGroupName $RG -TemplateFile $Path
    ```

## Resources

We cannot reproduce the issue with PowerShell Script. PowerShell Script will take longer to add vnet rules.

```powershell
$TenantID='xxxxxxxxxxxxxxxxxxxxxxxx'
$SubscriptionID = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
$RG = 'SQL'
$Location = 'southeastasia'
$VnetName = 'testvnet'
$SqlServerName = 'testloginsea'

Write-Host "Try to connect Azure Account"
Connect-AzAccount -Tenant $TenantID
Update-AzConfig -DefaultSubscriptionForLogin $SubscriptionID

# Create 129 subnet in a test vnet
$addressSpace = "10.0.0.0/16"
$subnets = @()
try{
for ($i = 0; $i -lt 129; $i++) {
    $subnetAddressPrefix = "10.0.$i.0/24"
    $subnetConfig = New-AzVirtualNetworkSubnetConfig -Name "subnet$i" -AddressPrefix $subnetAddressPrefix
    $subnets += $subnetConfig
}

Write-Host "Creating virtual network and subnets..."
$vnet = New-AzVirtualNetwork -Name $VnetName `
                             -ResourceGroupName $RG `
                             -Location $Location `
                             -AddressPrefix $addressSpace `
                             -Subnet $subnets

Write-Output "VNet '$VnetName' with 129 subnets created successfully."


foreach ($i in 0..128) {
    $subnetName = "subnet$i"
    $ruleName = "rule-subnet$i"

    $subnet = Get-AzVirtualNetworkSubnetConfig -Name $subnetName -VirtualNetwork $vnet

    Write-Host "Enabling Microsoft.sql endpoint for $subnetName..."
    Add-AzVirtualNetworkServiceEndpointConfig -Name $subnetName -Service "Microsoft.Sql"

    Write-Host "Adding VNet rule for $subnetName..."

    New-AzSqlServerVirtualNetworkRule -ResourceGroupName $RG `
                                      -ServerName $SqlServerName `
                                      -VirtualNetworkRuleName $ruleName `
                                      -VirtualNetworkSubnetId $subnet.Id `
                                      -IgnoreMissingVnetServiceEndpoint
}

Write-Output "All subnets added to SQL Server VNet rules."
} catch {
	# Get all VNet rules for the SQL server
    $vnetRules = Get-AzSqlServerVirtualNetworkRule -ResourceGroupName $RG -ServerName $sqlServerName

    # Remove each VNet rule
    foreach ($vnetRule in $vnetRules) {
	    try {
		    Remove-AzSqlServerVirtualNetworkRule -ResourceGroupName $RG -ServerName $sqlServerName -VirtualNetworkRuleName $vnetRule.VirtualNetworkRuleName
		    Write-Host "vnetrule '$vnetrule' removed successfully."
	    } catch {
		 Write-Host "Error removing vnetrule '$vnetrule': $($_.Exception.Message)"
	    }
    }
		 New-AzVirtualNetwork -Name $VnetName -ResourceGroupName $RG
}

$badrule = Get-AzSqlServerVirtualNetworkRule -ResourceGroupName "SQL" -ServerName "testvnetrulelimit" | Where-Object { $_.State -eq "InProgress" }
Write-Host "Adding the InProgress VNet rule again for $badrule.VirtualNetworkRuleName..."

New-AzSqlServerVirtualNetworkRule -ResourceGroupName $RG `
                                -ServerName $SqlServerName `
                                -VirtualNetworkRuleName $badrule.VitualNetworkRuleName `
                                -VirtualNetworkSubnetId $badrule.VirtualNetworkSubnetId `
                                -IgnoreMissingVnetServiceEndpoint
```



ARM Template to step 1 and 2 

```
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "vnetName": {
      "type": "string",
      "defaultValue": "mytestVnet"
    },
    "location": {
      "type": "string",
      "defaultValue": "southeastasia"
    },
    "addressSpace": {
      "type": "string",
      "defaultValue": "10.0.0.0/16"
    },
    "sqlServerName": {
      "type": "string",
      "defaultValue": "testvnetrulelimit"
    }
  },
  "resources": [
  {
            "type": "Microsoft.Sql/servers",
            "apiVersion": "2021-05-01-preview",
            "name": "[parameters('sqlServerName')]",
            "location": "[parameters('location')]",
            "properties": {
                "version": "12.0",
                "minimalTlsVersion": "1.2",
                "administratorLogin": "sqladmin",
                "administratorLoginPassword": "xxxxxxxxxxxxxxxxxxx"
            }
  },
    {
      "type": "Microsoft.Network/virtualNetworks",
      "apiVersion": "2023-02-01",
      "name": "[parameters('vnetName')]",
      "location": "[parameters('location')]",
      "properties": {
        "addressSpace": {
          "addressPrefixes": [
            "[parameters('addressSpace')]"
          ]
        },
        "subnets": [
          {
            "name": "subnet0",
            "properties": {
              "addressPrefix": "10.0.0.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet1",
            "properties": {
              "addressPrefix": "10.0.1.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet2",
            "properties": {
              "addressPrefix": "10.0.2.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet3",
            "properties": {
              "addressPrefix": "10.0.3.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet4",
            "properties": {
              "addressPrefix": "10.0.4.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet5",
            "properties": {
              "addressPrefix": "10.0.5.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet6",
            "properties": {
              "addressPrefix": "10.0.6.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet7",
            "properties": {
              "addressPrefix": "10.0.7.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet8",
            "properties": {
              "addressPrefix": "10.0.8.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet9",
            "properties": {
              "addressPrefix": "10.0.9.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet10",
            "properties": {
              "addressPrefix": "10.0.10.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet11",
            "properties": {
              "addressPrefix": "10.0.11.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet12",
            "properties": {
              "addressPrefix": "10.0.12.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet13",
            "properties": {
              "addressPrefix": "10.0.13.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet14",
            "properties": {
              "addressPrefix": "10.0.14.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet15",
            "properties": {
              "addressPrefix": "10.0.15.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet16",
            "properties": {
              "addressPrefix": "10.0.16.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet17",
            "properties": {
              "addressPrefix": "10.0.17.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet18",
            "properties": {
              "addressPrefix": "10.0.18.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet19",
            "properties": {
              "addressPrefix": "10.0.19.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet20",
            "properties": {
              "addressPrefix": "10.0.20.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet21",
            "properties": {
              "addressPrefix": "10.0.21.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet22",
            "properties": {
              "addressPrefix": "10.0.22.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet23",
            "properties": {
              "addressPrefix": "10.0.23.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet24",
            "properties": {
              "addressPrefix": "10.0.24.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet25",
            "properties": {
              "addressPrefix": "10.0.25.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet26",
            "properties": {
              "addressPrefix": "10.0.26.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet27",
            "properties": {
              "addressPrefix": "10.0.27.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet28",
            "properties": {
              "addressPrefix": "10.0.28.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet29",
            "properties": {
              "addressPrefix": "10.0.29.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet30",
            "properties": {
              "addressPrefix": "10.0.30.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet31",
            "properties": {
              "addressPrefix": "10.0.31.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet32",
            "properties": {
              "addressPrefix": "10.0.32.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet33",
            "properties": {
              "addressPrefix": "10.0.33.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet34",
            "properties": {
              "addressPrefix": "10.0.34.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet35",
            "properties": {
              "addressPrefix": "10.0.35.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet36",
            "properties": {
              "addressPrefix": "10.0.36.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet37",
            "properties": {
              "addressPrefix": "10.0.37.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet38",
            "properties": {
              "addressPrefix": "10.0.38.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet39",
            "properties": {
              "addressPrefix": "10.0.39.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet40",
            "properties": {
              "addressPrefix": "10.0.40.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet41",
            "properties": {
              "addressPrefix": "10.0.41.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet42",
            "properties": {
              "addressPrefix": "10.0.42.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet43",
            "properties": {
              "addressPrefix": "10.0.43.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet44",
            "properties": {
              "addressPrefix": "10.0.44.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet45",
            "properties": {
              "addressPrefix": "10.0.45.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet46",
            "properties": {
              "addressPrefix": "10.0.46.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet47",
            "properties": {
              "addressPrefix": "10.0.47.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet48",
            "properties": {
              "addressPrefix": "10.0.48.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet49",
            "properties": {
              "addressPrefix": "10.0.49.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet50",
            "properties": {
              "addressPrefix": "10.0.50.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet51",
            "properties": {
              "addressPrefix": "10.0.51.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet52",
            "properties": {
              "addressPrefix": "10.0.52.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet53",
            "properties": {
              "addressPrefix": "10.0.53.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet54",
            "properties": {
              "addressPrefix": "10.0.54.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet55",
            "properties": {
              "addressPrefix": "10.0.55.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet56",
            "properties": {
              "addressPrefix": "10.0.56.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet57",
            "properties": {
              "addressPrefix": "10.0.57.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet58",
            "properties": {
              "addressPrefix": "10.0.58.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet59",
            "properties": {
              "addressPrefix": "10.0.59.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet60",
            "properties": {
              "addressPrefix": "10.0.60.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet61",
            "properties": {
              "addressPrefix": "10.0.61.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet62",
            "properties": {
              "addressPrefix": "10.0.62.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet63",
            "properties": {
              "addressPrefix": "10.0.63.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet64",
            "properties": {
              "addressPrefix": "10.0.64.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet65",
            "properties": {
              "addressPrefix": "10.0.65.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet66",
            "properties": {
              "addressPrefix": "10.0.66.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet67",
            "properties": {
              "addressPrefix": "10.0.67.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet68",
            "properties": {
              "addressPrefix": "10.0.68.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet69",
            "properties": {
              "addressPrefix": "10.0.69.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet70",
            "properties": {
              "addressPrefix": "10.0.70.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet71",
            "properties": {
              "addressPrefix": "10.0.71.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet72",
            "properties": {
              "addressPrefix": "10.0.72.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet73",
            "properties": {
              "addressPrefix": "10.0.73.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet74",
            "properties": {
              "addressPrefix": "10.0.74.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet75",
            "properties": {
              "addressPrefix": "10.0.75.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet76",
            "properties": {
              "addressPrefix": "10.0.76.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet77",
            "properties": {
              "addressPrefix": "10.0.77.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet78",
            "properties": {
              "addressPrefix": "10.0.78.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet79",
            "properties": {
              "addressPrefix": "10.0.79.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet80",
            "properties": {
              "addressPrefix": "10.0.80.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet81",
            "properties": {
              "addressPrefix": "10.0.81.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet82",
            "properties": {
              "addressPrefix": "10.0.82.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet83",
            "properties": {
              "addressPrefix": "10.0.83.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet84",
            "properties": {
              "addressPrefix": "10.0.84.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet85",
            "properties": {
              "addressPrefix": "10.0.85.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet86",
            "properties": {
              "addressPrefix": "10.0.86.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet87",
            "properties": {
              "addressPrefix": "10.0.87.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet88",
            "properties": {
              "addressPrefix": "10.0.88.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet89",
            "properties": {
              "addressPrefix": "10.0.89.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet90",
            "properties": {
              "addressPrefix": "10.0.90.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet91",
            "properties": {
              "addressPrefix": "10.0.91.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet92",
            "properties": {
              "addressPrefix": "10.0.92.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet93",
            "properties": {
              "addressPrefix": "10.0.93.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet94",
            "properties": {
              "addressPrefix": "10.0.94.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet95",
            "properties": {
              "addressPrefix": "10.0.95.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet96",
            "properties": {
              "addressPrefix": "10.0.96.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet97",
            "properties": {
              "addressPrefix": "10.0.97.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet98",
            "properties": {
              "addressPrefix": "10.0.98.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet99",
            "properties": {
              "addressPrefix": "10.0.99.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet100",
            "properties": {
              "addressPrefix": "10.0.100.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet101",
            "properties": {
              "addressPrefix": "10.0.101.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet102",
            "properties": {
              "addressPrefix": "10.0.102.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet103",
            "properties": {
              "addressPrefix": "10.0.103.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet104",
            "properties": {
              "addressPrefix": "10.0.104.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet105",
            "properties": {
              "addressPrefix": "10.0.105.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet106",
            "properties": {
              "addressPrefix": "10.0.106.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet107",
            "properties": {
              "addressPrefix": "10.0.107.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet108",
            "properties": {
              "addressPrefix": "10.0.108.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet109",
            "properties": {
              "addressPrefix": "10.0.109.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet110",
            "properties": {
              "addressPrefix": "10.0.110.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet111",
            "properties": {
              "addressPrefix": "10.0.111.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet112",
            "properties": {
              "addressPrefix": "10.0.112.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet113",
            "properties": {
              "addressPrefix": "10.0.113.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet114",
            "properties": {
              "addressPrefix": "10.0.114.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet115",
            "properties": {
              "addressPrefix": "10.0.115.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet116",
            "properties": {
              "addressPrefix": "10.0.116.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet117",
            "properties": {
              "addressPrefix": "10.0.117.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet118",
            "properties": {
              "addressPrefix": "10.0.118.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet119",
            "properties": {
              "addressPrefix": "10.0.119.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet120",
            "properties": {
              "addressPrefix": "10.0.120.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet121",
            "properties": {
              "addressPrefix": "10.0.121.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet122",
            "properties": {
              "addressPrefix": "10.0.122.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet123",
            "properties": {
              "addressPrefix": "10.0.123.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet124",
            "properties": {
              "addressPrefix": "10.0.124.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet125",
            "properties": {
              "addressPrefix": "10.0.125.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet126",
            "properties": {
              "addressPrefix": "10.0.126.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet127",
            "properties": {
              "addressPrefix": "10.0.127.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet128",
            "properties": {
              "addressPrefix": "10.0.128.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          },
          {
            "name": "subnet129",
            "properties": {
              "addressPrefix": "10.0.129.0/24",
              "serviceEndpoints": [
                {
                  "service": "Microsoft.Sql"
                }
              ]
            }
          }
        ]
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet0')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet0')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet1')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet1')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet2')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet2')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet3')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet3')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet4')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet4')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet5')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet5')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet6')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet6')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet7')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet7')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet8')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet8')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet9')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet9')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet10')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet10')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet11')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet11')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet12')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet12')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet13')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet13')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet14')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet14')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet15')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet15')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet16')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet16')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet17')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet17')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet18')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet18')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet19')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet19')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet20')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet20')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet21')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet21')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet22')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet22')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet23')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet23')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet24')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet24')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet25')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet25')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet26')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet26')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet27')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet27')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet28')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet28')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet29')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet29')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet30')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet30')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet31')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet31')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet32')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet32')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet33')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet33')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet34')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet34')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet35')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet35')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet36')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet36')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet37')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet37')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet38')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet38')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet39')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet39')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet40')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet40')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet41')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet41')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet42')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet42')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet43')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet43')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet44')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet44')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet45')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet45')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet46')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet46')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet47')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet47')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet48')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet48')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet49')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet49')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet50')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet50')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet51')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet51')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet52')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet52')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet53')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet53')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet54')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet54')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet55')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet55')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet56')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet56')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet57')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet57')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet58')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet58')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet59')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet59')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet60')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet60')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet61')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet61')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet62')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet62')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet63')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet63')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet64')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet64')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet65')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet65')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet66')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet66')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet67')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet67')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet68')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet68')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet69')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet69')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet70')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet70')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet71')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet71')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet72')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet72')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet73')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet73')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet74')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet74')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet75')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet75')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet76')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet76')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet77')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet77')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet78')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet78')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet79')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet79')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet80')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet80')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet81')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet81')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet82')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet82')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet83')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet83')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet84')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet84')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet85')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet85')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet86')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet86')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet87')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet87')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet88')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet88')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet89')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet89')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet90')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet90')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet91')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet91')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet92')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet92')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet93')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet93')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet94')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet94')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet95')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet95')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet96')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet96')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet97')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet97')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet98')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet98')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet99')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet99')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet100')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet100')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet101')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet101')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet102')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet102')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet103')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet103')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet104')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet104')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet105')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet105')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet106')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet106')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet107')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet107')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet108')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet108')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet109')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet109')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet110')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet110')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet111')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet111')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet112')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet112')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet113')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet113')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet114')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet114')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet115')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet115')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet116')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet116')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet117')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet117')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet118')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet118')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet119')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet119')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet120')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet120')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet121')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet121')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet122')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet122')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet123')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet123')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet124')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet124')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet125')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet125')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet126')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet126')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet127')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet127')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet128')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet128')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    },
	{
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet129')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]",
		"[resourceId('Microsoft.Sql/servers', parameters('sqlServerName'))]"
      ],
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet129')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    }
  ],
  "variables": {}
}
```

ARM Template to step 4. Before reproduce the issue, update the subnet name and rule name with the return from step 3 in below template.

```
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "vnetName": {
      "type": "string",
      "defaultValue": "mytestVnet"
    },
    "sqlServerName": {
      "type": "string",
      "defaultValue": "testvnetrulelimit"
    }
  },
  "resources": [
    {
      "type": "Microsoft.Sql/servers/virtualNetworkRules",
      "apiVersion": "2022-05-01-preview",
      "name": "[concat(parameters('sqlServerName'), '/rule-subnet41')]",
      "properties": {
        "virtualNetworkSubnetId": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), 'subnet41')]",
        "ignoreMissingVnetServiceEndpoint": true
      }
    }
  ]
}
```
