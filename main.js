const { app, BrowserWindow } = require("electron");
const path = require("path");

let win; // declare here so it’s in scope

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false, // safer
      contextIsolation: true,
    },
  });

  const startURL = process.env.ELECTRON_START_URL || "http://localhost:3000";

  win.loadURL(startURL);

  // optional: open DevTools
  win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
