---
layout: post
title: 使用 NetFileEnum 无法获取文件列表
categories: Win32
description: 当 NAS Session 较多时，使用 NetFileEnum 无法获取文件列表，并且网络包中 SAMBA 2.1 协议返回状态为 STATUS_BUFFER_OVERFLOW。
keywords: NetFileEnum，NAS
---

当我们使用 NetFileEnum 枚举当前打开的网络文件时，如果文件较多，此时抓取网络包会出现 STATUS_BUFFER_OVERFLOW 的现象。这种现象是正常行为，表示服务端返回的数据未读完，我们需要通过多次调用 NetFileEnum 来读取所有数据。此时 NetFileEnum 的返回值一般为 ERROR_MORE_DATA。

![SAMBA STATUS_BUFFER_OVERFLOW](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/SAMBA.png)

在 SAMBA  协议中 STATUS_BUFFER_OVERFLOW 实际对应于 ERRmoredata，更多错误码可以参考 [SAMBA Server Resonse](https://msdn.microsoft.com/en-us/library/cc246310.aspx)

| SMB error class   | SMB error code       | NT status code                      | Description                                                  |
| :-------------- | -------------------- | ----------------------------------- | ------------------------------------------------------------ |
| ERRSRV (0x02)     | ERRmoredata (0x00EA) | STATUS_BUFFER_OVERFLOW (0x80000005) | The number of bytes of changed data exceeded the MaxParameterCount field in the client request. |

正确的使用方法如下：

```c++
int wmain(int argc, wchar_t *argv[])
{
    //NetFile Enum, using 3 Level.
    NET_API_STATUS fStatus;
    LPFILE_INFO_3 pFile = NULL;
    LPFILE_INFO_3 pTmpFile;
    DWORD dfLevel = 3;
    LPTSTR flServerName = NULL;
    LPTSTR flUserName = NULL;
    LPTSTR flBasePath = NULL;
    DWORD fwPrefMaxLen = MAX_PREFERRED_LENGTH;
    DWORD fwEntriesRead = 0;
    DWORD fwTotalEntries = 0;
    DWORD fwResumeHandle = 0;
    DWORD fi;
    //
    // Check command line arguments.
    // Dont need this currently.
    //
    do
    {
        fStatus = NetFileEnum(flServerName,
        flBasePath,
        flUserName,
        dfLevel,
        (LPBYTE*)&pFile,
        fwPrefMaxLen,
        &fwEntriesRead,
        &fwTotalEntries,
        &fwResumeHandle);
        if ((fStatus == NERR_Success) || (fStatus == ERROR_MORE_DATA))
        {
            if ((pTmpFile = pFile) != NULL)
            {
                for (fi=0; fi < fwEntriesRead; fi++)
                {
                    assert(pTmpFile != NULL);
                    if (pTmpFile == NULL)
                    {
                        fprintf(stderr, "An access violation has occurred\n");
                        break;
                    }
                    printf("\n\tComputer: %S", pTmpFile->fi3_username);
                    printf("\n\tid: %d", pTmpFile->fi3_id);
                    printf("\n\tpath: %s", pTmpFile->fi3_pathname);
                    printf("\n\tLocks: %d\n", pTmpFile->fi3_num_locks);
                    pTmpFile++;
                    fwTotalEntries++;
                }
            }
        }
        else
        fprintf(stderr, "A system error has occurred: %d\n", fStatus);
        //
        // Free the allocated memory.
        //
        if (pFile != NULL)
        {
            NetApiBufferFree(pFile);
            pFile = NULL;
        }
    }
    //
    // Continue to call NetFilEnum while
    //  there are more entries.
    //
    while (fStatus == ERROR_MORE_DATA);
    if (pFile != NULL)
    NetApiBufferFree(pFile);
    return 0;
}
```

如果使用 C# Invoke 需要注意给 NetFileEnum 传入的最后一个参数 resume_handle 需要为 REF 类型，否则会出现无限循环并无法读取到完整信息。

[^注]: 在使用 NetFileEnum 循环读取信息时不能使用断点调试，否则容易出现超时，导致连接断开，进而无法读取正确的值。 

