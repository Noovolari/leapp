const {contextBridge} = require('electron')

contextBridge.exposeInMainWorld('dpApi', require("../src/dpapi-addon/Dpapi"))
