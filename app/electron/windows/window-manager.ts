import { BrowserWindow, screen } from "electron";
import { join } from "node:path";
import type { PanelRoute } from "../../src/shared/types";

let petWindow: BrowserWindow | null = null;
let panelWindow: BrowserWindow | null = null;

function getPreloadPath() {
  return join(__dirname, "../preload/preload.js");
}

function loadRenderer(window: BrowserWindow, route: string) {
  const devUrl = process.env.ELECTRON_RENDERER_URL;
  if (devUrl) {
    window.loadURL(`${devUrl}/#${route}`);
    return;
  }
  window.loadFile(join(__dirname, "../renderer/index.html"), { hash: route });
}

export function createWindows() {
  createPetWindow();
}

export function createPetWindow() {
  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.focus();
    return petWindow;
  }

  const windowWidth = 320;
  const windowHeight = 360;

  petWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    resizable: false,
    alwaysOnTop: true,
    hasShadow: false,
    skipTaskbar: true,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  petWindow.setAlwaysOnTop(true, "floating");

  const { workArea } = screen.getPrimaryDisplay();
  petWindow.setPosition(workArea.x + workArea.width - windowWidth - 24, workArea.y + workArea.height - windowHeight - 24);

  loadRenderer(petWindow, "/pet");

  petWindow.on("closed", () => {
    petWindow = null;
  });

  return petWindow;
}

export function openPanel(route: PanelRoute = "tasks") {
  if (panelWindow && !panelWindow.isDestroyed()) {
    panelWindow.focus();
    panelWindow.webContents.send("panel:navigate", route);
    return panelWindow;
  }

  panelWindow = new BrowserWindow({
    width: 920,
    height: 680,
    minWidth: 760,
    minHeight: 560,
    title: "Companion Panel",
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  loadRenderer(panelWindow, `/panel/${route}`);

  panelWindow.on("closed", () => {
    panelWindow = null;
  });

  return panelWindow;
}

export function setPetAlwaysOnTop(enabled: boolean) {
  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.setAlwaysOnTop(enabled, "floating");
  }
}
