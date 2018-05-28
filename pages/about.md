---
layout: page
title: About
description: 路遥知马力，日久见人心
keywords: Robin Chen
comments: true
menu: 关于
permalink: /about/
---

我是Robin, 微软 Dev 技术支持工程师


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
