---
layout: page
title: About
description: 路遥知马力，日久见人心
keywords: Robin Chen
comments: true
menu: 关于
permalink: /about/
---

我是 Robin Chen, 涉猎过嵌入式硬件，嵌入式驱动，安卓框架和驱动，目前从事 Windows 开发技术支持。熟悉 Linux 和 Windows 驱动开发，对于 Windows 平台调试技术涉猎较多。

## 联系

{% for website in site.data.social %}
* {{ website.sitename }}：[@{{ website.name }}]({{ website.url }})
{% endfor %}

## Skill Keywords

{% for category in site.data.skills %}
### {{ category.name }}
<div class="btn-inline">
{% for keyword in category.keywords %}
<button class="btn btn-outline" type="button">{{ keyword }}</button>
{% endfor %}
</div>
{% endfor %}
