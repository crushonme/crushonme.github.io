---
layout: post
title: 为 GitHub Pages 添加 PWA 功能
categories: Browsers
description: 本文介绍如何使用为 GitHub Pages 添加 PWA 功能。
keywords: GitHub Pages,PWA,Progressive Web Apps
---

[GitHub Pages](https://help.github.com/categories/github-pages-basics/) 是 GitHub 为提供静态站点提供的托管平台。利用 GitHub Pages 可以方便快捷的部署博客或者企业主页，我的博客站点就是托管在 GitHub Pages。 [PWA](https://en.wikipedia.org/wiki/Progressive_Web_Apps) 是由 Google Chrome 团队提出并推广的网络应用，PWA 利用现代浏览器的 Service Workers 和 Web Apps Manifest 特性，为用户提供免安装且可媲美 Native 应用性能的网络应用。

PWA 主要具有以下特性：

- Progressive: 渐进式体验，即使浏览器不支持 PWA，也不会影响用户体验；
- 兼容性：PWA 是基于浏览器特性实现，因此可以跨平台，只要安装了支持 PWA 特性的浏览器即可使用；
- 离线特性：PWA 基于 Service Workers 特性实现了缓存功能，因此离线也可以正常使用；
- 安全性： PWA 基于 Service Workers 特性，而该特性如果被中间人篡改，则容易受到攻击，因此 PWA 要求所有连接均需要是 HTTPS 的，因此更安全；

# 如何为 GitHub Pages 添加 PWA 功能

## 添加 Web Apps Manifest

[Web Apps Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest) 以 JSON 形式为 PWA 提供了诸如应用名，开发者，图标，应用描述等信息。准备好 manifest 文件后，需要在页面中 head 区域添加其信息：

```
<!-- APP Manifest -->
<link rel="manifest" href="/manifest.json">
```

以下为我的博客中使用的 Manifest:

```json
{
  "dir": "ltr",
  "scope": "/",
  "name": "路遥之家",
  "short_name": "路遥之家",
  "icons": [{
    "src": "images/icons/icon-16x16.png",
      "sizes": "16x16",
      "type": "image/png"
    }, {
      "src": "images/icons/icon-32x32.png",
      "sizes": "32x32",
      "type": "image/png"
    }, {
      "src": "images/icons/icon-48x48.png",
      "sizes": "48x48",
      "type": "image/png"
    }, {
      "src": "images/icons/icon-64x64.png",
      "sizes": "64x64",
      "type": "image/png"
    }, {
      "src": "images/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    }],
  "start_url": "/index.html",
  "display": "standalone",
  "lang": "cn",
  "orientation": "portrait",
  "background_color": "#3E4EB8",
  "theme_color": "#2F3BA2"
}
```

## 添加 Service Worker 脚本 

关于 Service Worker 可以参考 Google 官方文章: [服务工作线程：简介](https://developers.google.com/web/fundamentals/primers/service-workers/?hl=zh-cn)。使用服务工作线程通常需要如下步骤：

- 实现 Service Worker 脚本；

  - 注册 Install 事件；通常在 Install 事件处理中主要实现 缓存所有文件；

    ```
    var CACHE_NAME = 'my-site-cache-v1';
    //需要缓存的内容根据实际情况修改：
    var urlsToCache = [
      '/',
      '/styles/main.css',
      '/script/main.js'
    ];
    
    self.addEventListener('install', function(event) {
      // Perform install steps
      event.waitUntil(
        caches.open(CACHE_NAME)
          .then(function(cache) {
            console.log('Opened cache');
            return cache.addAll(urlsToCache);
          })
      );
    });
    ```

  - 注册 Fetch 事件；通常在 Fetch 事件中判断请求是否缓存，如果未缓存则发起网络请求并将请求结果添加到缓存中；

    ```
    self.addEventListener('fetch', function(event) {
      event.respondWith(
        caches.match(event.request)
          .then(function(response) {
            // Cache hit - return response
            if (response) {
              return response;
            }
            return fetch(event.request);
          }
        )
      );
    });
    ```

  - 注册 Activate 事件；通常在 Activate 事件中检查当前浏览器缓存中是否是最新的文件，如果不是则删除对应的缓存；

    ```
    self.addEventListener('activate', function(event) {
    
      var cacheWhitelist = ['pages-cache-v1', 'blog-posts-cache-v1'];
    
      event.waitUntil(
        caches.keys().then(function(cacheNames) {
          return Promise.all(
            cacheNames.map(function(cacheName) {
              if (cacheWhitelist.indexOf(cacheName) === -1) {
                return caches.delete(cacheName);
              }
            })
          );
        })
      );
    });
    ```

- 注册 Service Worker 脚本；

  ```javascript
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js').then(function(registration) {
        // Registration was successful
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }, function(err) {
        // registration failed :(
        console.log('ServiceWorker registration failed: ', err);
      });
    });
  }
  ```

下图是服务工作线程的生命周期简图：

![服务工作线程生命周期简图](https://mdn.mozillademos.org/files/12636/sw-lifecycle.png)

下图列出了 Service Worker 支持的所有事件:

![服务工作线程支持的事件](https://mdn.mozillademos.org/files/12632/sw-events.png)

通常情况下我们并不需要自己实现 Service Worker 脚本， Google 实现了一个 Node 模块 [sw-precache](https://github.com/GoogleChromeLabs/sw-precache) 用于生成 Service Worker 脚本，该模块支持多种方式生成 Service Worker 脚本。其中最简单快捷的方法只需要添加一个配置文件脚本即可，如下是参考配置：

```javascript
module.exports = {
  staticFileGlobs: [
    'app/css/**.css',
    'app/**.html',
    'app/images/**.*',
    'app/js/**.js'
  ],
  stripPrefix: 'app/',
  runtimeCaching: [{
    urlPattern: /this\\.is\\.a\\.regex/,
    handler: 'networkFirst'
  }]
};
```

使用方法如下：

```
$ npm install --global sw-precache
$ sw-precache --config=sw-precache-config.js --verbose
```

##  调试 PWA

完成前面的步骤后，当使用 Chrome 打开站点时，在设置页面出现安装站点，如下图

![PWA-Demo](/images/blog/pwa-install-setting.png)

如果没有出现该设置，则说明 manifest 或者 Service Worker 脚本有问题，此时可以使用 Chrome Debug tools 中的 Application 组件调试，如果未列出站点应用，则说明 manifest 有问题，如果列出了应用则通常是 Service Worker 有问题，此时可以手动点击 Add to HomeScreen 尝试加载，在 Console 界面中则会提示错误信息。正常情况如下图：

![PWA-Debug](/images/blog/pwa-debug.png)



## 运行效果

![PWA-Demo](/images/blog/pwa-demo.png)