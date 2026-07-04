const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("petPocApi", {
  openPanel: () => ipcRenderer.invoke("windows:openPanel"),
  setPetState: (state) => ipcRenderer.invoke("pet:setState", state),
  onPetStateChanged: (callback) => {
    ipcRenderer.on("pet:stateChanged", (_event, state) => callback(state));
  }
});

