---
layout: post
title: Multiple calls to SQLDriverConnect function causes application crash
categories: dotnet
description: N/A
keywords: crash,odbc,SQL
---

## Issue Description

Multiple calls to SQLDriverConnect function causes application crash.

Below is the sample code to reproduce the issue:

```cpp
// NewDSN.cpp : This file contains the 'main' function. Program execution begins and ends there.
// The main logic coming from the below link
// https://learn.microsoft.com/en-us/sql/odbc/reference/syntax/sqldriverconnect-function?view=sql-server-ver16#connection-attributes

#include <iostream>
// SQLDriverConnect_ref.cpp
// compile with: odbc32.lib user32.lib
#include <windows.h>
#include <sqlext.h>

int main() {
  SQLHENV henv;
  SQLHDBC hdbc;
  SQLHSTMT hstmt;
  SQLRETURN retcode;

  SQLWCHAR OutConnStr[255];
  SQLSMALLINT OutConnStrLen;

  HWND desktopHandle = GetDesktopWindow(); // desktop's window handle

  for (int i = 0; i < 15; i++) {
    // Allocate environment handle
    retcode = SQLAllocHandle(SQL_HANDLE_ENV, SQL_NULL_HANDLE, &henv);

    // Set the ODBC version environment attribute
    if (retcode == SQL_SUCCESS || retcode == SQL_SUCCESS_WITH_INFO) {
      retcode = SQLSetEnvAttr(henv, SQL_ATTR_ODBC_VERSION, (SQLPOINTER*)SQL_OV_ODBC3, 0);

      // Allocate connection handle
      if (retcode == SQL_SUCCESS || retcode == SQL_SUCCESS_WITH_INFO) {
        retcode = SQLAllocHandle(SQL_HANDLE_DBC, henv, &hdbc);

        // Set login timeout to 5 seconds
        if (retcode == SQL_SUCCESS || retcode == SQL_SUCCESS_WITH_INFO) {
          SQLSetConnectAttr(hdbc, SQL_LOGIN_TIMEOUT, (SQLPOINTER)5, 0);

          retcode = SQLDriverConnect( // SQL_NULL_HDBC
            hdbc,
            desktopHandle,
            (SQLWCHAR*)"driver=SQL Server",
            _countof("driver=SQL Server"),
            OutConnStr,
            255,
            &OutConnStrLen,
            SQL_DRIVER_PROMPT);

          // Allocate statement handle
          if (retcode == SQL_SUCCESS || retcode == SQL_SUCCESS_WITH_INFO) {
            retcode = SQLAllocHandle(SQL_HANDLE_STMT, hdbc, &hstmt);

            // Process data
            if (retcode == SQL_SUCCESS || retcode == SQL_SUCCESS_WITH_INFO) {
              SQLFreeHandle(SQL_HANDLE_STMT, hstmt);
            }

            SQLDisconnect(hdbc);
          }

          SQLFreeHandle(SQL_HANDLE_DBC, hdbc);
        }
      }
    }
    SQLFreeHandle(SQL_HANDLE_ENV, henv);
  }
}
```

Below is the repro steps:

1. Build and Run the sample NewDSN.exe

1. Click **"New""** in **"Select Data Source"** Windows and then select **"SQL Server"** and click Next.

1. Click **"Next"** in **"Create New Data Source"** Window and then ignore the error of **"The filename entered is invalid"**. And cancel the window.

1. Then click Cancel in the *"Select Data Source"** Window.

1. Wait for new **"Select Data Source"** window and repeat step 2-4 until the application crashing.

## Troubleshooting

Collect Dump and TTD trace.

In the TTD trace, we found that ODBC32.dll set the global variable of ODBC32!g_hInstallDLL after loading ODBCCP32.dll Module with the function call of ODBC32!LoadLibraryPD in ODBC32!NewDSN. And ODBC32!SQLFreeHandle freed the ODBCCP32.dll module.

In next calling to NewDSN, ODBC32.dll will not assign new location of ODBCCP32.dll to ODBC32!g_hInstallDLL if the base address of ODBCCP32.dll is different with last loading. Then the address of callback function ODBC32!pfnCreateDataSource will be invalid. If the program try to call the callback, we will get AccessViolation Exception and the application will crash.

## Cause

BUG in ODBC32

## Resolution

The dm (odbc32.dll) is only unloaded when the last ODBC env is freed (SQLFreeHandle). It is not always necessary to free the ENV handle. So we can just re-use the same ENV handle to workaround the issue.

```cpp
// NewDSN.cpp : This file contains the 'main' function. Program execution begins and ends there.
// The main logic coming from the below link
// https://learn.microsoft.com/en-us/sql/odbc/reference/syntax/sqldriverconnect-function?view=sql-server-ver16#connection-attributes

#include <iostream>
// SQLDriverConnect_ref.cpp
// compile with: odbc32.lib user32.lib
#include <windows.h>
#include <sqlext.h>

int main() {
  SQLHENV henv;
  SQLHDBC hdbc;
  SQLHSTMT hstmt;
  SQLRETURN retcode;

  SQLWCHAR OutConnStr[255];
  SQLSMALLINT OutConnStrLen;

  HWND desktopHandle = GetDesktopWindow(); // desktop's window handle

  // Allocate environment handle
  retcode = SQLAllocHandle(SQL_HANDLE_ENV, SQL_NULL_HANDLE, &henv);
  for (int i = 0; i < 15; i++) {

    // Set the ODBC version environment attribute
    if (retcode == SQL_SUCCESS || retcode == SQL_SUCCESS_WITH_INFO) {
      retcode = SQLSetEnvAttr(henv, SQL_ATTR_ODBC_VERSION, (SQLPOINTER*)SQL_OV_ODBC3, 0);

      // Allocate connection handle
      if (retcode == SQL_SUCCESS || retcode == SQL_SUCCESS_WITH_INFO) {
        retcode = SQLAllocHandle(SQL_HANDLE_DBC, henv, &hdbc);

        // Set login timeout to 5 seconds
        if (retcode == SQL_SUCCESS || retcode == SQL_SUCCESS_WITH_INFO) {
          SQLSetConnectAttr(hdbc, SQL_LOGIN_TIMEOUT, (SQLPOINTER)5, 0);

          retcode = SQLDriverConnect( // SQL_NULL_HDBC
            hdbc,
            desktopHandle,
            (SQLWCHAR*)"driver=SQL Server",
            _countof("driver=SQL Server"),
            OutConnStr,
            255,
            &OutConnStrLen,
            SQL_DRIVER_PROMPT);

          // Allocate statement handle
          if (retcode == SQL_SUCCESS || retcode == SQL_SUCCESS_WITH_INFO) {
            retcode = SQLAllocHandle(SQL_HANDLE_STMT, hdbc, &hstmt);

            // Process data
            if (retcode == SQL_SUCCESS || retcode == SQL_SUCCESS_WITH_INFO) {
              SQLFreeHandle(SQL_HANDLE_STMT, hstmt);
            }

            SQLDisconnect(hdbc);
          }

          SQLFreeHandle(SQL_HANDLE_DBC, hdbc);
        }
      }
    }
  }
  SQLFreeHandle(SQL_HANDLE_ENV, henv);
}
```