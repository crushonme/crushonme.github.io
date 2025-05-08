---
layout: post
title: Failed to configure ESP IDF in VSCode.
categories: ESP32
description: N/A
keywords: ESP32-S3,ESP IDF,IDF
---

When we setup ESP IDF Tools with VSCode, we might get error of "C:\Espressif\tools\idf-python\3.11.2\python.exe -m pip" is not valid. (ERROR_INVALID_PIP).

# Troubleshooting
Acording to [Troubleshooting - ESP IDF Extention for VSCode Latest](https://docs.espressif.com/projects/vscode-esp-idf-extension/en/latest/troubleshooting.html), we can check the log file located at:

```
Windows: %USERPROFILE%\.vscode\extensions\espressif.esp-idf-extension-VERSION\esp_idf_vsc_ext.log
macOS/Linux: $HOME/.vscode/extensions/espressif.esp-idf-extension-VERSION/esp_idf_vsc_ext.log
```
In the log we will see below errors:
```json
{
    "command": "C:\\Espressif\\tools\\idf-python\\3.11.2\\python.exe",
    "message": "Command failed: C:\\Espressif\\tools\\idf-python\\3.11.2\\python.exe -m pip --version\nC:\\Espressif\\tools\\idf-python\\3.11.2\\python.exe: No module named pip\r\n",
    "stack": "Error: Command failed: C:\\Espressif\\tools\\idf-python\\3.11.2\\python.exe -m pip --version\nC:\\Espressif\\tools\\idf-python\\3.11.2\\python.exe: No module named pip\r\n\n\tat genericNodeError (node:internal/errors:984:15)\n\tat wrappedFn (node:internal/errors:538:14)\n\tat ChildProcess.exithandler (node:child_process:423:12)\n\tat ChildProcess.emit (node:events:518:28)\n\tat maybeClose (node:internal/child_process:1104:16)\n\tat ChildProcess._handle.onexit (node:internal/child_process:304:5)",
    "category": "utils execChildProcess",
    "level": "error",
    "timestamp": "2025-05-08T12:32:01.829Z"
}
{
    "message": "Command failed: C:\\Espressif\\tools\\idf-python\\3.11.2\\python.exe -m pip --version\nC:\\Espressif\\tools\\idf-python\\3.11.2\\python.exe: No module named pip\r\n",
    "stack": "Error: Command failed: C:\\Espressif\\tools\\idf-python\\3.11.2\\python.exe -m pip --version\nC:\\Espressif\\tools\\idf-python\\3.11.2\\python.exe: No module named pip\r\n\n\tat genericNodeError (node:internal/errors:984:15)\n\tat wrappedFn (node:internal/errors:538:14)\n\tat ChildProcess.exithandler (node:child_process:423:12)\n\tat ChildProcess.emit (node:events:518:28)\n\tat maybeClose (node:internal/child_process:1104:16)\n\tat ChildProcess._handle.onexit (node:internal/child_process:304:5)",
    "category": "pythonManager checkPipExists",
    "level": "error",
    "timestamp": "2025-05-08T12:32:01.831Z"
}
{
    "user": true,
    "message": "\"C:\\Espressif\\tools\\idf-python\\3.11.2\\python.exe -m pip\" is not valid. (ERROR_INVALID_PIP)",
    "stack": "Error: \"C:\\Espressif\\tools\\idf-python\\3.11.2\\python.exe -m pip\" is not valid. (ERROR_INVALID_PIP)\n\tat ko (\\dist\\extension.js:2:1542092)\n\tat process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n\tat async \\dist\\extension.js:2:1552486",
    "category": "SetupPanel error handler",
    "level": "error",
    "timestamp": "2025-05-08T12:32:01.833Z"
}
```

It means extention tried to run command "C:\Espressif\tools\idf-python\3.11.2\python.exe -m pip --version" and it returned error "No module named pip".If we run the command in CMD and we will get same error.

It indicate that ESP IDF did not install PIP tools for the build-in Python enviorment.

# Resolution

To resolve it, run below command to install PIP:
```
C:\Espressif\tools\idf-python\3.11.2\python.exe -m ensurepip
```

Then reconfigure the Tool.