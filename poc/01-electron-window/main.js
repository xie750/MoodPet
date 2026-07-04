const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const path = require("path");

let petWindow;
let panelWindow;

function createPetWindow() {
  petWindow = new BrowserWindow({
    width: 220,
    height: 260,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  petWindow.loadFile("pet.html");
  petWindow.setAlwaysOnTop(true, "floating");

  petWindow.webContents.on("context-menu", () => {
    const menu = Menu.buildFromTemplate([
      { label: "Idle", click: () => sendPetState("idle") },
      { label: "Happy", click: () => sendPetState("happy") },
      { label: "Care", click: () => sendPetState("care") },
      { type: "separator" },
      { label: "Open Panel", click: () => createPanelWindow() },
      { label: "Quit", click: () => app.quit() }
    ]);
    menu.popup({ window: petWindow });
  });
}

function createPanelWindow() {
  if (panelWindow && !panelWindow.isDestroyed()) {
    panelWindow.focus();
    return;
  }

  panelWindow = new BrowserWindow({
    width: 880,
    height: 620,
    title: "Companion Panel PoC",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  panelWindow.loadFile("panel.html");
}

function sendPetState(state) {
  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.webContents.send("pet:stateChanged", state);
  }
}

ipcMain.handle("windows:openPanel", () => {
  createPanelWindow();
  return { ok: true };
});

ipcMain.handle("pet:setState", (_event, state) => {
  if (!["idle", "happy", "care", "sleep"].includes(state)) {
    return { ok: false, error: "Invalid state" };
  }
  sendPetState(state);
  return { ok: true };
});

app.whenReady().then(createPetWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

