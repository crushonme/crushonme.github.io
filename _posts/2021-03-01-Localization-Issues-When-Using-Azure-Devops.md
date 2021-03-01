---
layout: post
title: Localization issues when using Azure Devops
categories: Devops
description: 
keywords: TFS,Devops,Azure Devops,Azure Devops Service
---

# Issues For Deutsch

New Feed in Project shows "unknown Error in this page area." after update from Devops Server 2019 to 2020 when the language setting is Deutsch. In the console of browsers, we will see below errors:

```
Error: Index in the format can only be used once, recurring index is 1
    at t.ComponentsFormatFormat.FormatComponent (ms.vss-web.platform-content.es6.DLNo8_bXX05JI4SX.min.js:1)
    at tn (ms.vss-web.core-content.es6.nCtjs_VzHiWCElJ3.min.js:1)
    at Gu (ms.vss-web.core-content.es6.nCtjs_VzHiWCElJ3.min.js:1)
    at Tr (ms.vss-web.core-content.es6.nCtjs_VzHiWCElJ3.min.js:1)
    at _r (ms.vss-web.core-content.es6.nCtjs_VzHiWCElJ3.min.js:1)
    at mr (ms.vss-web.core-content.es6.nCtjs_VzHiWCElJ3.min.js:1)
    at ms.vss-web.core-content.es6.nCtjs_VzHiWCElJ3.min.js:1
    at unstable_runWithPriority (ms.vss-web.core-content.es6.nCtjs_VzHiWCElJ3.min.js:1)
    at bt (ms.vss-web.core-content.es6.nCtjs_VzHiWCElJ3.min.js:1)
    at xt (ms.vss-web.core-content.es6.nCtjs_VzHiWCElJ3.min.js:1)
Hn @ ms.vss-web.core-content.es6.nCtjs_VzHiWCElJ3.min.js:1
o.componentDidCatch.n.callback @ ms.vss-web.core-content.es6.nCtjs_VzHiWCElJ3.min.js:1
Ft @ ms.vss-web.core-content.es6.nCtjs_VzHiWCElJ3.min.js:1
Jn @ ms.vss-web.core-content.es6.nCtjs_VzHiWCElJ3.min.js:1
(anonymous) @ ms.vss-web.core-content.es6.nCtjs_VzHiWCElJ3.min.js:1
unstable_runWithPriority @ ms.vss-web.core-content.es6.nCtjs_VzHiWCElJ3.min.js:1
bt @ ms.vss-web.core-content.es6.nCtjs_VzHiWCElJ3.min.js:1
Cr @ ms.vss-web.core-content.es6.nCtjs_VzHiWCElJ3.min.js:1
mr @ ms.vss-web.core-content.es6.nCtjs_VzHiWCElJ3.min.js:1
(anonymous) @ ms.vss-web.core-content.es6.nCtjs_VzHiWCElJ3.min.js:1
unstable_runWithPriority @ ms.vss-web.core-content.es6.nCtjs_VzHiWCElJ3.min.js:1
bt @ ms.vss-web.core-content.es6.nCtjs_VzHiWCElJ3.min.js:1
xt @ ms.vss-web.core-content.es6.nCtjs_VzHiWCElJ3.min.js:1
_t @ ms.vss-web.core-content.es6.nCtjs_VzHiWCElJ3.min.js:1
Ei @ ms.vss-web.core-content.es6.nCtjs_VzHiWCElJ3.min.js:1
(anonymous) @ ms.vss-web.core-content.es6.nCtjs_VzHiWCElJ3.min.js:1
```

It's a known issue of Azure devops 2020. We can workaround the issue with changing language settings to other launguage instead. Or create a ticket to Microsoft Support team to get a hotfix.


# Issues For ZH-CN

当 Azure Devops 2019 1.0 版本中使用中文配置，那么我们会遇到在创建或者更新 PR 时无法获取邮件通知的问题。

如果参考 [How to enable subscription logging for troubleshooting](https://docs.microsoft.com/en-us/azure/devops/notifications/use-subscription-logging?view=azure-devops-2020) 配置订阅诊断，我们将会得到类似如下报错：

```
{
  "id": 227318,
  "result": "ErrFormat",
  "eventId": 1024627,
  "eventType": "GitPullRequestEvent",
  "subscriptionId": "ms.vss-code.pull-request-updated-subscription",
  "stats": {},
  "recipients": {
    "e32ae257-5b7b-454d-af0d-6dc96e5db9ea": {
      "recipient": {
        "id": "e32ae257-5b7b-454d-af0d-6dc96e5db9ea",
        "displayName": "张三"
      },
      "status": null
    }
  },
  "messages": [
    {
      "level": 1,
      "time": "09:22:59.1570532",
      "message": "设置电子邮件格式时出错。将改为发送一条错误消息。\r\nMustacheExpressionInvalidException:对于表达式“stringFormat“在 {0} 中打开”event.secondaryToolName”找不到帮助程序“stringFormat“在”\r\n@MustacheTemplatedExpression..ctor:0\r\n@MustacheExpression.Parse:0\r\n@ContributedTemplateServiceBase`1.ParseFieldToken:0\r\n@ContributedTemplateServiceBase`1.ParseFieldToken:0\r\n@ContributedTemplateServiceBase`1.ParseFieldToken:0\r\n@ContributedTemplateServiceBase`1.ParseFieldToken:0\r\n"
    }
  ]
}
```

该问题是 Azure Devops 2019 的已知问题，可以通过升级至  Azure Devops 2019 1.1 或者 Azure Devops 2020 来解决该问题。如果无法升级，则可以联系微软技术支持协助解决该问题。