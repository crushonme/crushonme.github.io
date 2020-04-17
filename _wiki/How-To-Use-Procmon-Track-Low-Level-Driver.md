---
layout: wiki
title: How To Use Procmon Track Low Level Driver
categories: Debug
description: 本文描述如何使用 Procmon 抓取底层驱动的行为
keywords: Procmon,Low Level Driver
---
 Procmon is usually used to show real-time file system, Registry and process/thread activity, but you do not get to see the activity of things such as virus scanners and unifiltr because they happen at a lower level than the procmon filter.

 As we know,every minifilter drier must have a unique identifier called altitude, which defines position relative to other minifilter drivers in the I/O stack when the minifilter driver is loaded. So if you need to get Procmon's filter to run below Low level Driver in the filter stack, we can lower the altitude of procmon driver, putting it lower in the filter stack. In doing so we will be able to see all of the activity that we want from any filter driver.

By default, the altitude of procmon driver is 385200. We can get other allocated altitude in document [Allocated Altitudes](https://docs.microsoft.com/en-us/windows-hardware/drivers/ifs/allocated-altitudes). We can change the altitude of procmon with fllowing steps.
> The fllowing steps assumes that the ProcMon registry data lives in a floder called PROCMONxy. This key location can change with each version of Procmon. So we should check to see where it is.

- Run regedit and navigate to registry key [HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\PROCMONxy\Instances\Process Monitor xy Instance].
  ![ProcmonAltitudeRegistry](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/ProcmonAltitudeRegstry.png)

- Change the Altitude value to lower than your driver altitude.

- You must also set the security on the "Process Monitor xy Instance" key and add deny rights for everyone for "delete" and "set value". Reason being that procmon will try to change its value back right away. You will have to uncheck "inherit permissions" in order to be able to set them at the Process Monitor Instance level.

- If you have already started procmon before doing these changes, you will need to restart the machine. If not you should be able to just start procmon.

- From an elevated command prompt, run the command "fltmc instances" and verify that the procmon drivers are running at the altitude that you set.
  ![ProcmonAltitude300000](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/ProcmonAltitude300000.png)

- If the altitude is not what you set and you did not restart the machine, please restart your machine.

> ***Reference***:
> [Load Order Groups and Altitudes for Minifilter Drivers](https://docs.microsoft.com/en-us/windows-hardware/drivers/ifs/load-order-groups-and-altitudes-for-minifilter-drivers)