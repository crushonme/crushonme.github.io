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

<ul>
{% for website in site.data.social %}
<li>{{ website.sitename }}： <a href="{{ website.url }}" target="_blank">@{{ website.name }}</a></li>
{% endfor %}
{% if site.url contains 'crushonme' %}
<li>
微信公众号：<br />
<img style="height:192px;width:192px;border:1px solid lightgrey;" src="{{ assets_base_url }}/assets/images/qrcode.jpg" alt="路遥之家" />
</li>
{% endif %}
</ul>


## Skill Keywords

{% for skill in site.data.skills %}
### {{ skill.name }}
<div class="btn-inline">
{% for keyword in skill.keywords %}
<button class="btn btn-outline" type="button">{{ keyword }}</button>
{% endfor %}
</div>
{% endfor %}
