---
layout: post
title: SSMS throw error Service 'Microsoft.SqlServer.Management.IRegistrationService' not found
categories: dotnet
description: N/A
keywords: SSMS,SQL
---

## issue description

SQL Server Management Studio throw error Service 'Microsoft.SqlServer.Management.IRegistrationService' not found.

The details error:

```log
Microsoft.SqlServer.Management.ServiceNotFoundException: Service 'Microsoft.SqlServer.Management.IRegistrationService' not found
      at Microsoft.SqlServer.Management.ServiceProvider.GetService[T](IServiceProvider serviceProvider, Boolean throwIfNotFound)
      at Microsoft.SqlServer.Management.SqlStudio.Explorer.NavigationService.Initialize()
      at Microsoft.SqlServer.Management.SqlStudio.Explorer.NavigationService.GetView(String urnPath)
      at Microsoft.SqlServer.Management.UI.VSIntegration.ObjectExplorer.NavigableItemBuilder.<GetColumnsFromNavigationService>d__72.MoveNext()
      at Microsoft.SqlServer.Management.UI.VSIntegration.ObjectExplorer.NavigableItemBuilder.AddFields(List`1 list, IEnumerable`1 fields, IDictionary`2 allValidFields, AddFieldsFlags flags)
      at Microsoft.SqlServer.Management.UI.VSIntegration.ObjectExplorer.NavigableItemBuilder.GetFields(INodeInformation source, Dictionary`2& allValidColumns)
      at Microsoft.SqlServer.Management.UI.VSIntegration.ObjectExplorer.NavigableItemBuilder.BuildDynamicItemWithQuery(IList`1 nodes, INodeInformation source, INavigableItem sourceItem, String urnQuery, Boolean registerBuilder, Boolean registerBuiltItems)
      at Microsoft.SqlServer.Management.UI.VSIntegration.ObjectExplorer.IntegrationServicesNavigableItemBuilder.Build(IList`1 nodes, INodeInformation source, INavigableItem sourceItem, IFilterProvider filter)
      at Microsoft.SqlServer.Management.UI.VSIntegration.ObjectExplorer.NavigableItem.RequestChildren(IGetChildrenRequest request)
```

## Troubleshooting

1. Collected Procmon and Try to monitor the first chance exception with procdump.

    ```log
    [17:52:07] Exception: E0434F4D.System.NullReferenceException ("Object referencenot set to an instance of an object.")
    [17:52:07] Exception: E0434F4D.System.InvalidCastException ("Unable to cast COMobject of type 'System.__ComObject' to interface type     'Microsoft.VisualStudio.OLE.Interop.IServiceProvider'. This operation failed because the QueryInterface call on the COM component for the     interface with IID '{6D5140C1-7436-11CE-8034-00AA006009FA}' failed due to the following error: No such interface supported (Exception from     HRESULT: 0x80004002 (E_NOINTERFACE)).")
    [17:52:07] Exception: E0434F4D.System.InvalidCastException ("Unable to cast COMobject of type 'System.__ComObject' to interface type     'Microsoft.VisualStudio.OLE.Interop.IServiceProvider'. This operation failed because the QueryInterface call on the COM component for the     interface with IID '{6D5140C1-7436-11CE-8034-00AA006009FA}' failed due to the following error: No such interface supported (Exception from     HRESULT: 0x80004002 (E_NOINTERFACE)).")
    [17:52:07] Exception: E0434F4D.System.InvalidCastException ("Unable to cast COMobject of type 'System.__ComObject' to interface type     'Microsoft.VisualStudio.OLE.Interop.IServiceProvider'. This operation failed because the QueryInterface call on the COM component for the     interface with IID '{6D5140C1-7436-11CE-8034-00AA006009FA}' failed due to the following error: No such interface supported (Exception from     HRESULT: 0x80004002 (E_NOINTERFACE)).")
    [17:52:07] Exception: E0434F4D.Microsoft.SqlServer.Management.ServiceNotFoundException ("Service 'Microsoft.SqlServer.Management.    IRegistrationService' not found")
    ```

1. Collected TTD trace.

    TTD analysis: From the TTD, we know the issue is caused by COM objects did not return right objects which caused nullreference exception.

    ```log
    6cc4.6930): Access violation - code c0000005 (first/second chance not available)
    First chance exceptions are reported before any exception handling.
    This exception may be expected and handled.
    Time Travel Position: D1D7AC0000001
    eax=00000000 ebx=3bc9db34 ecx=00000000 edx=3bc9db34 esi=3bc9db34 edi=3bc9d9f8
    eip=036272ce esp=3bc9d9d4 ebp=3bc9dacc iopl=0         nv up ei pl zr na pe nc
    cs=0023  ss=002b  ds=002b  es=002b  fs=0053  gs=002b             efl=00000246
    CLRStub[VSD_DispatchStub]@c9b3b000036272ce:
    036272ce 813904c09773    cmp     dword ptr [ecx],offset mscorlib_ni+0x4fc004 (7397c004) ds:002b:00000000=????????
    0:007> dd 7397c004
    7397c004  41020200 00000010 00c10168 00000007
    7397c014  73934444 73481000 73485358 73519988
    7397c024  0000002c 00000000 7397c034 736191d4
    7397c034  73fe56f8 738721d0 738800c0 7387d1bc
    7397c044  7381fdbc 7385fa48 7385fb24 ffe3388c
    7397c054  ffe25118 ffe29bc4 ffe293e8 ffe2991c
    7397c064  ffe293f0 ffe29904 ffe293f8 ffe3387c
    7397c074  000c0000 00000000 08d30160 00000004
    0:007> p-
    Time Travel Position: D1D7A8000009C
    eax=00000000 ebx=3bc9db34 ecx=00000000 edx=3bc9db34 esi=3bc9db34 edi=3bc9d9f8
    eip=1fbcc61a esp=3bc9d9d8 ebp=3bc9dacc iopl=0         nv up ei pl zr na pe nc
    cs=0023  ss=002b  ds=002b  es=002b  fs=0053  gs=002b             efl=00000246
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.Platform.WindowManagement.DocumentObjectSite.QueryService+0x472:
    1fbcc61a ff1590136203    call    dword ptr ds:[3621390h] ds:002b:03621390={CLRStub[VSD_DispatchStub]@c9b3bff0036272ce (036272ce)}
    0:007> ub
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.Platform.WindowManagement.DocumentObjectSite.QueryService+0x45a     [Q:\cmd\35\src\env\shell\WindowManager\DocumentObjectSite.cs @ 623]:
    1fbcc602 33c0            xor     eax,eax
    1fbcc604 eb1a            jmp     Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.Platform.WindowManagement.    DocumentObjectSite.QueryService+0x478 (1fbcc620)
    1fbcc606 b908fc9f1f      mov     ecx,1F9FFC08h
    1fbcc60b e878cdace8      call    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.    GetGlobalService[[System.__Canon, mscorlib],[System.__Canon, mscorlib]]() (08699388)
    1fbcc610 8bc8            mov     ecx,eax
    1fbcc612 ff750c          push    dword ptr [ebp+0Ch]
    1fbcc615 ff7508          push    dword ptr [ebp+8]
    1fbcc618 8bd3            mov     edx,ebx
    0:000> bp 08699388
    0:007> uf 08699388
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]() [Q:\cmd\35\src\env\shell\Common\GlobalServices.cs @ 24]:
       24 08699388 55              push    ebp
       24 08699389 8bec            mov     ebp,esp
       24 0869938b 57              push    edi
       24 0869938c 56              push    esi
       24 0869938d 53              push    ebx
       24 0869938e 50              push    eax
       24 0869938f 894df0          mov     dword ptr [ebp-10h],ecx
       24 08699392 8bf1            mov     esi,ecx
       24 08699394 833d2065010500  cmp     dword ptr ds:[5016520h],0
       24 0869939b 7461            je      Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.    GetGlobalService[[System.__Canon, mscorlib],[System.__Canon, mscorlib]]()+0x76 (086993fe)  Branch
    
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]()+0x15 [Q:\cmd\35\src\env\shell\Common\GlobalServices.cs @ 24]:
       24 0869939d 8b460c          mov     eax,dword ptr [esi+0Ch]
       24 086993a0 8b08            mov     ecx,dword ptr [eax]
       24 086993a2 8b460c          mov     eax,dword ptr [esi+0Ch]
       24 086993a5 8b5004          mov     edx,dword ptr [eax+4]
       24 086993a8 f7c201000000    test    edx,1
       24 086993ae 7405            je      Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.    GetGlobalService[[System.__Canon, mscorlib],[System.__Canon, mscorlib]]()+0x2d (086993b5)  Branch
    
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]()+0x28 [Q:\cmd\35\src\env\shell\Common\GlobalServices.cs @ 24]:
       24 086993b0 8b7aff          mov     edi,dword ptr [edx-1]
       24 086993b3 eb02            jmp     Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.    GetGlobalService[[System.__Canon, mscorlib],[System.__Canon, mscorlib]]()+0x2f (086993b7)  Branch
    
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]()+0x2d [Q:\cmd\35\src\env\shell\Common\GlobalServices.cs @ 24]:
       24 086993b5 8bfa            mov     edi,edx
    
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]()+0x2f [Q:\cmd\35\src\env\shell\Common\GlobalServices.cs @ 24]:
       24 086993b7 f7c201000000    test    edx,1
       24 086993bd 7405            je      Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.    GetGlobalService[[System.__Canon, mscorlib],[System.__Canon, mscorlib]]()+0x3c (086993c4)  Branch
    
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]()+0x37 [Q:\cmd\35\src\env\shell\Common\GlobalServices.cs @ 24]:
       24 086993bf 8b5aff          mov     ebx,dword ptr [edx-1]
       24 086993c2 eb02            jmp     Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.    GetGlobalService[[System.__Canon, mscorlib],[System.__Canon, mscorlib]]()+0x3e (086993c6)  Branch
    
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]()+0x3c [Q:\cmd\35\src\env\shell\Common\GlobalServices.cs @ 24]:
       24 086993c4 8bda            mov     ebx,edx
    
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]()+0x3e [Q:\cmd\35\src\env\shell\Common\GlobalServices.cs @ 24]:
       24 086993c6 8b3520650105    mov     esi,dword ptr ds:[5016520h]
       24 086993cc f7c101000000    test    ecx,1
       24 086993d2 7403            je      Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.    GetGlobalService[[System.__Canon, mscorlib],[System.__Canon, mscorlib]]()+0x4f (086993d7)  Branch
    
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]()+0x4c [Q:\cmd\35\src\env\shell\Common\GlobalServices.cs @ 24]:
       24 086993d4 8b49ff          mov     ecx,dword ptr [ecx-1]
    
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]()+0x4f [Q:\cmd\35\src\env\shell\Common\GlobalServices.cs @ 24]:
       24 086993d7 e8540c2a6c      call    clr!JIT_GetRuntimeType (7493a030)
       24 086993dc 8bd0            mov     edx,eax
       24 086993de 8bce            mov     ecx,esi
       26 086993e0 ff1530046203    call    dword ptr ds:[3620430h]
       26 086993e6 8bd0            mov     edx,eax
       26 086993e8 8bcb            mov     ecx,ebx
       26 086993ea e8c141326c      call    clr!JIT_IsInstanceOfAny (749bd5b0)
       26 086993ef 8bd0            mov     edx,eax
       26 086993f1 8bcf            mov     ecx,edi
       26 086993f3 e848332a6c      call    clr!JIT_ChkCastAny (7493c740)
       29 086993f8 59              pop     ecx
       29 086993f9 5b              pop     ebx
       29 086993fa 5e              pop     esi
       29 086993fb 5f              pop     edi
       29 086993fc 5d              pop     ebp
       29 086993fd c3              ret
    
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]()+0x76 [Q:\cmd\35\src\env\shell\Common\GlobalServices.cs @ 29]:
       29 086993fe 8b460c          mov     eax,dword ptr [esi+0Ch]
       29 08699401 8b08            mov     ecx,dword ptr [eax]
       29 08699403 f7c101000000    test    ecx,1
       29 08699409 7403            je      Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.    GetGlobalService[[System.__Canon, mscorlib],[System.__Canon, mscorlib]]()+0x86 (0869940e)  Branch
    
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]()+0x83 [Q:\cmd\35\src\env\shell\Common\GlobalServices.cs @ 29]:
       29 0869940b 8b49ff          mov     ecx,dword ptr [ecx-1]
    
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]()+0x86 [Q:\cmd\35\src\env\shell\Common\GlobalServices.cs @ 29]:
       29 0869940e e81d0c2a6c      call    clr!JIT_GetRuntimeType (7493a030)
       29 08699413 8bc8            mov     ecx,eax
       29 08699415 8b460c          mov     eax,dword ptr [esi+0Ch]
       29 08699418 8b5004          mov     edx,dword ptr [eax+4]
       29 0869941b f7c201000000    test    edx,1
       29 08699421 7405            je      Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.    GetGlobalService[[System.__Canon, mscorlib],[System.__Canon, mscorlib]]()+0xa0 (08699428)  Branch
    
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]()+0x9b [Q:\cmd\35\src\env\shell\Common\GlobalServices.cs @ 29]:
       29 08699423 8b7aff          mov     edi,dword ptr [edx-1]
       29 08699426 eb02            jmp     Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.    GetGlobalService[[System.__Canon, mscorlib],[System.__Canon, mscorlib]]()+0xa2 (0869942a)  Branch
    
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]()+0xa0 [Q:\cmd\35\src\env\shell\Common\GlobalServices.cs @ 29]:
       29 08699428 8bfa            mov     edi,edx
    
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]()+0xa2 [Q:\cmd\35\src\env\shell\Common\GlobalServices.cs @ 29]:
       29 0869942a f7c201000000    test    edx,1
       29 08699430 7405            je      Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.    GetGlobalService[[System.__Canon, mscorlib],[System.__Canon, mscorlib]]()+0xaf (08699437)  Branch
    
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]()+0xaa [Q:\cmd\35\src\env\shell\Common\GlobalServices.cs @ 29]:
       29 08699432 8b72ff          mov     esi,dword ptr [edx-1]
       29 08699435 eb02            jmp     Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.    GetGlobalService[[System.__Canon, mscorlib],[System.__Canon, mscorlib]]()+0xb1 (08699439)  Branch
    
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]()+0xaf [Q:\cmd\35\src\env\shell\Common\GlobalServices.cs @ 29]:
       29 08699437 8bf2            mov     esi,edx
    
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]()+0xb1 [Q:\cmd\35\src\env\shell\Common\GlobalServices.cs @ 29]:
       29 08699439 ba01000000      mov     edx,1
       29 0869943e e89ddefcfa      call    Microsoft_VisualStudio_Shell_15_0!Microsoft.VisualStudio.Shell.Package.GetGlobalService(System.Type,     Boolean) (036672e0)
       29 08699443 8bd0            mov     edx,eax
       29 08699445 8bce            mov     ecx,esi
       29 08699447 e86441326c      call    clr!JIT_IsInstanceOfAny (749bd5b0)
       29 0869944c 8bd0            mov     edx,eax
       29 0869944e 8bcf            mov     ecx,edi
       29 08699450 e8eb322a6c      call    clr!JIT_ChkCastAny (7493c740)
       29 08699455 59              pop     ecx
       29 08699456 5b              pop     ebx
       29 08699457 5e              pop     esi
       29 08699458 5f              pop     edi
       29 08699459 5d              pop     ebp
       29 0869945a c3              ret
     
    0:007> g-
    Breakpoint 3 hit
    Time Travel Position: C9AAE400033A7
    eax=047fbae8 ebx=3bc9db34 ecx=1f9ffc08 edx=033245b8 esi=3bc9db34 edi=3bc9d9f8
    eip=08699388 esp=3bc9d9dc ebp=3bc9dacc iopl=0         nv up ei pl zr na pe nc
    cs=0023  ss=002b  ds=002b  es=002b  fs=0053  gs=002b             efl=00000246
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]():
    08699388 55              push    ebp
    0:007> pc
    Time Travel Position: C9AAE400033B5
    eax=1f9ffbe0 ebx=3bc9db34 ecx=5f2b1a28 edx=033245b8 esi=1f9ffc08 edi=3bc9d9f8
    eip=0869940e esp=3bc9d9c8 ebp=3bc9d9d8 iopl=0         nv up ei pl zr na pe nc
    cs=0023  ss=002b  ds=002b  es=002b  fs=0053  gs=002b             efl=00000246
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]()+0x86:
    0869940e e81d0c2a6c      call    clr!JIT_GetRuntimeType (7493a030)
    0:007> p
    Time Travel Position: C9AAE400033BF
    eax=0400a994 ebx=3bc9db34 ecx=05002a69 edx=5f2b1a28 esi=1f9ffc08 edi=3bc9d9f8
    eip=08699413 esp=3bc9d9c8 ebp=3bc9d9d8 iopl=0         nv up ei pl nz na po nc
    cs=0023  ss=002b  ds=002b  es=002b  fs=0053  gs=002b             efl=00000202
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]()+0x8b:
    08699413 8bc8            mov     ecx,eax
    0:007> pc
    Time Travel Position: C9AAE400033C9
    eax=1f9ffbe0 ebx=3bc9db34 ecx=0400a994 edx=00000001 esi=5f2b1a28 edi=5f2b1a28
    eip=0869943e esp=3bc9d9c8 ebp=3bc9d9d8 iopl=0         nv up ei pl zr na pe nc
    cs=0023  ss=002b  ds=002b  es=002b  fs=0053  gs=002b             efl=00000246
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]()+0xb6:
    0869943e e89ddefcfa      call    Microsoft_VisualStudio_Shell_15_0!Microsoft.VisualStudio.Shell.Package.GetGlobalService(System.Type,     Boolean) (036672e0)
    0:007> p
    Time Travel Position: C9AB080000168
    eax=04008e14 ebx=3bc9db34 ecx=04008e14 edx=3bc9d99c esi=5f2b1a28 edi=5f2b1a28
    eip=08699443 esp=3bc9d9c8 ebp=3bc9d9d8 iopl=0         nv up ei pl zr na pe nc
    cs=0023  ss=002b  ds=002b  es=002b  fs=0053  gs=002b             efl=00000246
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]()+0xbb:
    08699443 8bd0            mov     edx,eax
    0:007> !mex.do2 04008e14 
    0x04008e14 System.__ComObject [msenv!CGlobalServiceProvider]
      0004 __identity        : NULL
      0008 m_ObjectToDataMap : NULL
    0:007> p
    Time Travel Position: C9AB080000169
    eax=04008e14 ebx=3bc9db34 ecx=04008e14 edx=04008e14 esi=5f2b1a28 edi=5f2b1a28
    eip=08699445 esp=3bc9d9c8 ebp=3bc9d9d8 iopl=0         nv up ei pl zr na pe nc
    cs=0023  ss=002b  ds=002b  es=002b  fs=0053  gs=002b             efl=00000246
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]()+0xbd:
    08699445 8bce            mov     ecx,esi
    0:007> p
    Time Travel Position: C9AB08000016A
    eax=04008e14 ebx=3bc9db34 ecx=5f2b1a28 edx=04008e14 esi=5f2b1a28 edi=5f2b1a28
    eip=08699447 esp=3bc9d9c8 ebp=3bc9d9d8 iopl=0         nv up ei pl zr na pe nc
    cs=0023  ss=002b  ds=002b  es=002b  fs=0053  gs=002b             efl=00000246
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]()+0xbf:
    08699447 e86441326c      call    clr!JIT_IsInstanceOfAny (749bd5b0)
    0:007> 
    Time Travel Position: D1D7A80000085
    eax=00000000 ebx=3bc9db34 ecx=74aa3b8f edx=3bc9d980 esi=5f2b1a28 edi=5f2b1a28
    eip=0869944c esp=3bc9d9c8 ebp=3bc9d9d8 iopl=0         nv up ei pl zr na pe nc
    cs=0023  ss=002b  ds=002b  es=002b  fs=0053  gs=002b             efl=00000246
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]()+0xc4:
    0869944c 8bd0            mov     edx,eax
    Below is a good scenario in the same TTD:
    
    Breakpoint 0 hit
    Time Travel Position: 2A28F80000131
    eax=00000000 ebx=0b962564 ecx=231f2ed4 edx=00000000 esi=04785c38 edi=00d3e268
    eip=08699388 esp=00d3e1b0 ebp=00d3e1b4 iopl=0         nv up ei pl zr na pe nc
    cs=0023  ss=002b  ds=002b  es=002b  fs=0053  gs=002b             efl=00000246
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]():
    08699388 55              push    ebp
    0:005> bp 08699443
    0:005> g
    Breakpoint 1 hit
    Time Travel Position: 2A29CC00003CA
    eax=0b9625a4 ebx=0b962564 ecx=0b9625a4 edx=00fbd028 esi=2320723c edi=2320723c
    eip=08699443 esp=00d3e19c ebp=00d3e1ac iopl=0         nv up ei pl zr na pe nc
    cs=0023  ss=002b  ds=002b  es=002b  fs=0053  gs=002b             efl=00000246
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]()+0xbb:
    08699443 8bd0            mov     edx,eax
    0:005> p
    Time Travel Position: 2A29CC00003CB
    eax=0b9625a4 ebx=0b962564 ecx=0b9625a4 edx=0b9625a4 esi=2320723c edi=2320723c
    eip=08699445 esp=00d3e19c ebp=00d3e1ac iopl=0         nv up ei pl zr na pe nc
    cs=0023  ss=002b  ds=002b  es=002b  fs=0053  gs=002b             efl=00000246
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]()+0xbd:
    08699445 8bce            mov     ecx,esi
    0:005> p
    Time Travel Position: 2A29CC00003CC
    eax=0b9625a4 ebx=0b962564 ecx=2320723c edx=0b9625a4 esi=2320723c edi=2320723c
    eip=08699447 esp=00d3e19c ebp=00d3e1ac iopl=0         nv up ei pl zr na pe nc
    cs=0023  ss=002b  ds=002b  es=002b  fs=0053  gs=002b             efl=00000246
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]()+0xbf:
    08699447 e86441326c      call    clr!JIT_IsInstanceOfAny (749bd5b0)
    0:005> 
    Time Travel Position: 2A29DC00000F6
    eax=0b9625a4 ebx=0b962564 ecx=74aa3b8f edx=00fbd028 esi=2320723c edi=2320723c
    eip=0869944c esp=00d3e19c ebp=00d3e1ac iopl=0         nv up ei pl zr na pe nc
    cs=0023  ss=002b  ds=002b  es=002b  fs=0053  gs=002b             efl=00000246
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]()+0xc4:
    0869944c 8bd0            mov     edx,eax
    0:005> 
    Time Travel Position: 2A29DC00000F7
    eax=0b9625a4 ebx=0b962564 ecx=74aa3b8f edx=0b9625a4 esi=2320723c edi=2320723c
    eip=0869944e esp=00d3e19c ebp=00d3e1ac iopl=0         nv up ei pl zr na pe nc
    cs=0023  ss=002b  ds=002b  es=002b  fs=0053  gs=002b             efl=00000246
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]()+0xc6:
    0869944e 8bcf            mov     ecx,edi
    0:005> 
    Time Travel Position: 2A29DC00000F8
    eax=0b9625a4 ebx=0b962564 ecx=2320723c edx=0b9625a4 esi=2320723c edi=2320723c
    eip=08699450 esp=00d3e19c ebp=00d3e1ac iopl=0         nv up ei pl zr na pe nc
    cs=0023  ss=002b  ds=002b  es=002b  fs=0053  gs=002b             efl=00000246
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]()+0xc8:
    08699450 e8eb322a6c      call    clr!JIT_ChkCastAny (7493c740)
    0:005> 
    Time Travel Position: 2A29E800000F4
    eax=0b9625a4 ebx=0b962564 ecx=74ab68c3 edx=00fbd028 esi=2320723c edi=2320723c
    eip=08699455 esp=00d3e19c ebp=00d3e1ac iopl=0         nv up ei pl zr na pe nc
    cs=0023  ss=002b  ds=002b  es=002b  fs=0053  gs=002b             efl=00000246
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]()+0xcd:
    08699455 59              pop     ecx
    0:005> 
    Time Travel Position: 2A29E800000F5
    eax=0b9625a4 ebx=0b962564 ecx=231f2ed4 edx=00fbd028 esi=2320723c edi=2320723c
    eip=08699456 esp=00d3e1a0 ebp=00d3e1ac iopl=0         nv up ei pl zr na pe nc
    cs=0023  ss=002b  ds=002b  es=002b  fs=0053  gs=002b             efl=00000246
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]()+0xce:
    08699456 5b              pop     ebx
    0:005> pt
    Time Travel Position: 2A29E800000F9
    eax=0b9625a4 ebx=0b962564 ecx=231f2ed4 edx=00fbd028 esi=04785c38 edi=00d3e268
    eip=0869945a esp=00d3e1b0 ebp=00d3e1b4 iopl=0         nv up ei pl zr na pe nc
    cs=0023  ss=002b  ds=002b  es=002b  fs=0053  gs=002b             efl=00000246
    Microsoft_VisualStudio_Platform_WindowManagement!Microsoft.VisualStudio.PlatformUI.GlobalServices.GetGlobalService[[System.__Canon,     mscorlib],[System.__Canon, mscorlib]]()+0xd2:
    0869945a c3              ret
    ```

1. Check Procmon:

    - From the log, we know it's related with CLSID {6D5140C1-7436-11CE-8034-00AA006009FA}. So, we use this as filter to find the relatedcontext.
    - Checking the behavior of the target thread, before the event of CLSID  {6D5140C1-7436-11CE-8034-00AA006009FA}, we know SSMS try to     QueryService based on the stack.Image
    - After access the CLSID， we can see SSMS try to load actxprxy.dll and the file size is zero.ImageImage

## cause

Corrupted actxprxy.dll

## resolution

- Copy actxprxy.dll from good environment.
- Resister actxprxy.dll with below command:

  ```bat
  regsvr32.exe C:\Windows\SysWOW64\actxprxy.dll
  ```
