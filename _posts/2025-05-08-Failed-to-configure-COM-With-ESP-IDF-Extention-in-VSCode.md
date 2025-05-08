---
layout: post
title: Failed to configure COM with ESP IDF extention in VSCode.
categories: ESP32
description: N/A
keywords: ESP32-S3,ESP IDF,IDF
---

When we try to configure COM with ESP IDF extention in VSCode, it might return error "no such file or directory, stat 'c:\Users\ag\esp\v5.1\esp-idf\components\esptool_py\esptool\esptool.py'"

# Troubleshooting
When we search esptool.py in [espressif/vscode-esp-idf-extension github repo](https://github.com/search?q=repo%3Aespressif%2Fvscode-esp-idf-extension%20esptool.py&type=code), we will see the extention used enviroment variable of IDF_PATH to locate the file.


# Resolution

Configure "ESP-IDF" version which will initialize IDF_PATH environment variable before select COM.