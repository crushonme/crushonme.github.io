---
layout: post
title: Error SQL72014 When Import BACPAC to Azure SQL Database
categories: SQLDB
description: sqlpackage return error "Error SQL72014:.Net SqlClient Data Provider:Msg 15419, Level 16, State 1, Line 1 Supplied parameter sid should be binary(16)."
keywords: Azure SQL Database,sqldb,sqlpackage
---

Failed to import a bacpac file to an Azure SQL Database with Error SQL72014 and SQL72045. Below is the details
```
Error message:
Error SQL72014: .Net SqlClient Data Provider: Msg 15419, Level 16, State 1, Line 1 Supplied parameter sid should be binary(16).
Error SQL72045: Script execution error.  The executed script:
CREATE USER [medbank-sql-read-users]
   WITH SID = 0xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxAADE, TYPE = X; 
```

It's a bug of sqlpackage refer to [Bug: Import fails with error message 'Supplied parameter sid should be binary(16).' when the database has an AAD user associated with an AAD server login](https://github.com/microsoft/DacFx/issues/260). When the AAD user is created with CREATE USER … FOR LOGIN, the sid of AAD user will have AADE surffix in sid. older version Sqlpackage did not hande it well.

***Solutions:***

Upgrate to latest Sqlpackage to resolve the issue.
Workaround: 
1. If you can export the bacpac again from original database, you can drop the user or recreate the user as a contained user and export the bacpac again. Then import it to Azure SQL Database.

2. If you cannot re-export the bacpac and cannot upgrate to latest Sqlpackage, please consider below workaround:
    - unzip the bacpac to a file.
    - remove the AADE surffix for SID of the SqlUser in model.xml file. Or remove the SqlUser with AADE surffix in SID.
    - calculate the checksum of model.xml with below PowerShell
        ```powershell
        $modelXmlPath = Read-Host "model.xml file path"
        $hasher = [System.Security.Cryptography.HashAlgorithm]::Create("System.Security.Cryptography.    SHA256CryptoServiceProvider")
        $fileStream = new-object System.IO.FileStream ` -ArgumentList @($modelXmlPath, [System.IO.FileMode]::Open)
        $hashbinary = $hasher.ComputeHash($fileStream)
        $hashString = ""
        Foreach ($binary in $hashbinary) { $hashString += $binary.ToString("X2") }
        $fileStream.Close()
        $hashString
        ```
    - Copy the new checksum and override the orignal checksum of model.xml in open origin.xml.
    - Save all xml and zip all the files and rename with bacpac extention.
    - Import the bacpac to a Azure SQL Database.
    - Recreate the AAD user in Azure SQL Database.