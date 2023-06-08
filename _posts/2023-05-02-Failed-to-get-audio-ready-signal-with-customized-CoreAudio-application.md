---
layout: post
title: Failed to get audio ready signal with customized CoreAudio application.
categories: dotnet
description: N/A
keywords: audio,CoreAudio
---

# Issue description
CAudioClient::Initialize takes too much time to compelete. Or failed to get audio ready signal with customized CoreAudio Application.

# troubleshooting
Collect dumps of Audio process or WPR trace.
In the dump we will see below callstack

```
222 threads [stats]: 1 2 3 4 5 6 7 8 9 10 ...
    00007ff87494d084 ntdll!ZwWaitForSingleObject+0x14              
    00007ff8721b1ace KERNELBASE!WaitForSingleObjectEx+0x8e          
    00007ff822f2970e maxxaudiocapture64!DllUnregisterServer+0x4f0de 
    00007ff874117034 kernel32!BaseThreadInitThunk+0x14              
    00007ff8749026a1 ntdll!RtlUserThreadStart+0x21 


0:000> lmvmmaxxaudiocapture64
Browse full module list
start             end                 module name
00007ff8`22e80000 00007ff8`269ed000   maxxaudiocapture64   (export symbols)       maxxaudiocapture64.dll
    Loaded symbol image file: maxxaudiocapture64.dll
    Image path: C:\Windows\System32\DriverStore\FileRepository\wavesapo10de.inf_amd64_a9f05e78ea7f646e\maxxaudiocapture64.dll
    Image name: maxxaudiocapture64.dll
    Browse all global symbols  functions  data
    Timestamp:        Wed Mar  3 17:04:27 2021 (603F511B)
    CheckSum:         03BF02F6
    ImageSize:        03B6D000
    File version:     10.5.25.0
    Product version:  10.5.25.0
    File flags:       8 (Mask 3F) Private
    File OS:          40004 NT Win32
    File type:        2.0 Dll
    File date:        00000000.00000000
    Translations:     0409.04b0
    Information from resource tables:
        CompanyName:      Waves Audio Ltd.
        ProductName:      Waves Audio MaxxVoice
        InternalName:     MaxxVoice APO
        OriginalFilename: MaxxVoiceAPO.Dll
        ProductVersion:   10.5.25.0
        FileVersion:      10.5.25.0
        FileDescription:  MaxxVoice APO
        LegalCopyright:   c Waves Audio Ltd. All rights reserved.
        Comments:         Eldad Kuperman
```
In the ETL trace, we will also see maxxaudiocapture64.dll module takes too much time.

# Cause
The main APO processing thread is blocked due to third party components. 

[Audio Processing Object Architecture](https://learn.microsoft.com/en-us/windows-hardware/drivers/audio/audio-processing-object-architecture)

# resolution

Suggest engaging the product vendor to remove/upgrade this MaxxVoice APO and the issue should mitigate (as the main APO processing won’t be blocked any more).

Workaround:
Renames either maxxaudiocapture64.dll or the whole folder then restarts audiosrv can make the headset speaker and headset mic both working fine.
Image
