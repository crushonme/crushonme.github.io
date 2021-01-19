---
layout: post
title: 如何通过 C# 给 Set-AdServiceAccount 传入 ServicePrincipalNames 参数 
categories: dotnet
description: 本文记录了解决该问题的完整过程
keywords: Powershell, Powershell Automation
---

最近遇到了一个有意思的问题，在 C# 代码传参数给 Powershell 指令时按照文档中指定的对象类型传参，指令却抛出了异常。为了解决该问题，我们尝试了各种方法，最终通过 TTD 并结合反编译的代码找到了解决方案。

在通过 Set-ADServiceAcount 设置 SPN 时通常使用如下代码来实现,其中 [ServicePrincipalNames](https://docs.microsoft.com/en-us/powershell/module/addsadministration/set-adserviceaccount?view=win10-ps#parameters) 按照文档要求为 HashTable。因此我们在通过 C# 做自动化时，也需要传递 Hashtable 作为参数。

```powershell
Set-ADServiceAccount -Identity ServiceAccount -ServicePrincipalNames @{replace="test0/contoso.com","test1/contoso.com"}
```

然而我们在实际验证后发现如果直接传递一个键值为 String 或者 String[] 类型的 Hashtable 时，参数验证阶段就会抛出报错 "Cannot validate argument on parameter 'ServicePrincipalNames'. Values in the argument colletion should be of Type" 'System.String'"。

```c#
using (PowerShell ps = PowerShell.Create())
{
    List<string> SPNs = new List<string> { "HTTP/test0.contoso.com", "HTTP/test1.contoso.com" };
    ps.AddCommand("Set-ADServiceAccount");
    ps.AddParameter("Identity", "ServiceAccount");

    Hashtable SpnParameters = new Hashtable();
    SpnParameters.Add("replace",SPNs.ToArray());

    ps.AddParameter("ServicePrincipalNames", SpnParameters);
    ps.Invoke();
}
```

在看到异常提示，首先想到的便是直接将键值修改为 System.String 类型，因此我们尝试了以下代码:

```c#
using (PowerShell ps = PowerShell.Create())
{
    List<string> SPNs = new List<string> { "HTTP/test0.contoso.com", "HTTP/test1.contoso.com" };
    ps.AddCommand("Set-ADServiceAccount");
    ps.AddParameter("Identity", "ServiceAccount");

    Hashtable SpnParameters = new Hashtable();
    SpnParameters.Add("replace",String.Join(",",SPNs));

    ps.AddParameter("ServicePrincipalNames", SpnParameters);
    ps.Invoke();
}
```

年轻人， too young , too naive。 再次抛出异常，"The name reference is invalid". 也就是说我们传入的 ServicePrincipalNames 不符合条件，即 HTTP://test0.contoso.com,HTTP://test1.contoso.com 不符合要求。为了凑出符合要求的 SPN ，我们修改成和 PowerShell 命令中形似的字符串：

```c#
using (PowerShell ps = PowerShell.Create())
{
    List<string> SPNs = new List<string> { @"""HTTP/test0.contoso.com""", @"""HTTP/test1.contoso.com""" };
    ps.AddCommand("Set-ADServiceAccount");
    ps.AddParameter("Identity", "ServiceAccount");

    Hashtable SpnParameters = new Hashtable();
    SpnParameters.Add("replace",String.Join(",",SPNs));

    ps.AddParameter("ServicePrincipalNames", SpnParameters);
    ps.Invoke();
}
```

运行后查询到的 SPN 结果如下，可以看到注册的 SPN 并非多个，而是被合并成了一条记录。

```bat
setspn -L ServiceAccount
Registered ServicePrincipalNames for CN=ServiceAccount,CN=Managed Service Accounts,DC=han,DC=com:
        "HTTP/test0.contoso.com","HTTP/contoso.han.com"
```

经过以上测试，我们得出以下结论：

- 当传入多条 SPN 记录时，需要传入的键值必须是数组类型，否则会被合并成一条记录；
- 传入的 SPN 需要符合 SPN 的要求。

为了搞清楚这里面的原理，使用第一个程序段抓取了 TTD，抓取方法可以参考微软的官方文档 [Launch executable (advanced)](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/time-travel-debugging-record#launch-executable-advanced)。

分析步骤主要如下：

- 由于第一个代码段会直接抛出 CLR 的异常，因此我们可以直接通过 TimeLines 功能或者 TTD Query 语句快速定位出问题的现场：

```windbg
# 以下语句可以快速列出 TTD 中所有的异常类型和位置信息
dx -r2 @$curprocess.TTD.Events.Where(t => t.Type == "Exception").Select(e => new { ErrorNumber = e.Exception, Position= e.Position})
```

- 通过位置信息快速跳转至异常上下文，然后通过 mex 插件的 PrintException 命令获取异常信息：

```windbg
!mex.PrintException2 0x1a90d3b8
Address: 0x1a90d3b8
HResult: 0x80131501
Type: System.Management.Automation.ValidationMetadataException
Message: Values in the argument collection should be of Type: 'System.String'
Stack Trace:
SP       IP       Function                                                                                                                                                                                                                         Source
1e18ef94 6eccaae2 Microsoft.ActiveDirectory.Management.Commands.ValidateSetOperationsHashtableAttribute.Validate(System.Object, System.Management.Automation.EngineIntrinsics) 
1e18efd8 6f66f4bf System.Management.Automation.ValidateArgumentsAttribute.InternalValidate(System.Object, System.Management.Automation.EngineIntrinsics)                                                                                          
1e18efe4 6f6332ad System.Management.Automation.ParameterBinderBase.BindParameter(System.Management.Automation.CommandParameterInternal, System.Management.Automation.CompiledCommandParameter, System.Management.Automation.ParameterBindingFlags) 
```

- 从调用栈可以知道抛出异常的上下文在做参数校验，因此我们需要进入 Microsoft.ActiveDirectory.Management.Commands.ValidateSetOperationsHashtableAttribute.Validate 函数中研究此处为什么会抛出异常。

- 使用 ILSPY 反编译 Microsoft.ActiveDirectory.Management.ni 模块

  ```c#
  protected override void Validate(object arguments, EngineIntrinsics engineIntrinsics)
  {
      if (arguments != null && arguments != AutomationNull.Value)
      {
          Hashtable hashtable = arguments as Hashtable;
          if (hashtable != null)
          {
              foreach (object key in hashtable.Keys)
              {
                  if (key.GetType() != typeof(string))
                  {
                      throw new ValidationMetadataException(string.Format(CultureInfo.CurrentCulture, StringResources.InvalidHashtableKeyType));
                  }
                  if (!"Replace".Equals((string)key, StringComparison.OrdinalIgnoreCase) && !"Add".Equals((string)key, StringComparison.OrdinalIgnoreCase) &&   !"Remove".Equals((string)key, StringComparison.OrdinalIgnoreCase))
                  {
                      throw new ValidationMetadataException(string.Format(CultureInfo.CurrentCulture, StringResources.InvalidHashtableKey));
                  }
                  object obj = hashtable[key];
                  if ((obj == null || obj == AutomationNull.Value) && !"Replace".Equals((string)key, StringComparison.OrdinalIgnoreCase))
                  {
                      throw new ValidationMetadataException(string.Format(CultureInfo.CurrentCulture, StringResources.InvalidNullValue));
                  }
                  if (obj != null && obj != AutomationNull.Value)
                  {
                      if (obj.GetType() == typeof(object[]))
                      {
                          object[] array = (object[])obj;
                          foreach (object obj2 in array)
                          {
                              if (obj2 == null || obj2 == AutomationNull.Value)
                              {
                                  throw new ValidationMetadataException(string.Format(CultureInfo.CurrentCulture, StringResources.InvalidNullValue));
                              }
                              if (!IsObjectOfExpectedType(obj2))
                              {
                                  throw new ValidationMetadataException(string.Format(CultureInfo.CurrentCulture, StringResources.ObjectTypeNotEqualToExpectedType,   new object[1]
                                  {
                                      _expectedValueType
                                  }));
                              }
                          }
                      }
                      else if (!IsObjectOfExpectedType(obj))
                      {
                          throw new ValidationMetadataException(string.Format(CultureInfo.CurrentCulture, StringResources.ObjectTypeNotEqualToExpectedType, new   object[1]
                          {
                              _expectedValueType
                          }));
                      }
                  }
              }
          }
      }
  }
  ```

  校验参数部分逻辑如下：

  - 检查参数是否为 null。如果不是，则将参数 cast 为 HashTbale 并检查 Hashtable 是否为 null；
  - 如果 Hashtable 不是 null， 则递归检查其键值对是否满足以下条件：
    - 键名为 string 类型；
    - 键名是否为合法的操作符，即 "Replace"、"Add"、"Remove";
    - 如果键名为 "Add" 或者 "Remove" 时键值不能为 null;
    - 如果键名不是 null， 则检查其类型是否为 object[]或者其他合法的普通类型，否则则抛出异常；

- 通过以上条件，很容易知道我们需要如何修改代码，即当需要传入多个 SPN 时，需要传入 object[]。

  ```c#
  using System;
  using System.Collections;
  using System.Collections.Generic;
  using System.Linq;
  using System.Management.Automation;
  
  namespace SetSPNAutomation
  {
      class Program
      {
          static void Main(string[] args)
          {
              List<string> SPNs = new List<string> { "HTTP/test0.contoso.com", "HTTP/test1.contoso.com" };
              if (args.Length > 0)
              {
                  SPNs.Clear();
                  foreach (var x in args)
                  {
                      SPNs.Add(x.ToString());
                  }
              }
              // Set-ADServiceAccount -Identity ServiceAccount -ServicePrincipalNames $SPNHashTable
              using (PowerShell ps = PowerShell.Create())
              {
                  ps.AddCommand("Set-ADServiceAccount");
                  ps.AddParameter("Identity", "ServiceAccount");
  
                  Hashtable SpnParameters = new Hashtable();
                  if (SPNs.Any())
                  {
                      //SpnParameters.Add("replace",SPNs.ToArray());
                      //SpnParameters.Add("replace",String.Join(",",SPNs));
                      SpnParameters.Add("replace", SPNs.Cast<object>().ToArray());
                      ps.AddParameter("ServicePrincipalNames", SpnParameters);
  
                      try
                      {
                          Console.WriteLine("Try to Invoke Set-ADServiceAccount -Identity Service01 -ServicePrincipalNames {0}", String.Join(" ",SPNs));
                          var commandResults = ps.Invoke();
                          Console.WriteLine("After Invoke Command and get the result ");
                          foreach (PSObject result in commandResults)
                          {
                              Console.WriteLine(result.ToString());
                          }
                      }
                      catch (Exception e)
                      {
                          Console.WriteLine(e.Message);
                      }
                      finally
                      {
                          Console.WriteLine("Press any key to continue");
                          Console.ReadLine();
                      }
  
                  }
              }
          }
      }
  }
  ```
