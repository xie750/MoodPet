const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("sqlitePocApi", {
  tasks: {
    listToday: () => ipcRenderer.invoke("tasks:listToday"),
    create: (input) => ipcRenderer.invoke("tasks:create", input),
    complete: (taskId) => ipcRenderer.invoke("tasks:complete", taskId)
  }
});

