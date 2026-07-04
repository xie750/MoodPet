import { app } from "electron";
import { initDatabase } from "./db/database";
import { registerIpcHandlers } from "./ipc";
import { createWindows } from "./windows/window-manager";

app.whenReady().then(() => {
  const database = initDatabase();
  registerIpcHandlers(database);
  createWindows();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  createWindows();
});
