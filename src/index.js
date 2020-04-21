const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { description, version } = require("../package");

const log = require("electron-log");
const { autoUpdater } = require("electron-updater");

//-------------------------------------------------------------------
// Logging
//
// THIS SECTION IS NOT REQUIRED
//
// This logging setup is not required for auto-updates to work,
// but it sure makes debugging easier :)
//-------------------------------------------------------------------
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";
log.info("App starting...");

let mainWindow;
const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 920,
    height: 1100,
    title: `${description} ${version}`,
    darkTheme: true,
    backgroundColor: "#eeeeee",
    webPreferences: { nodeIntegration: true },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "index.html"));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
  // createDefaultUpdaetWindow();
  autoUpdater.checkForUpdates();
};

//------------------------------------------------------------
// For auto-update
function sendStatusToWindow(text) {
  mainWindow.webContents.send("message", text);
}

autoUpdater.on("checking-for-update", () => {
  sendStatusToWindow("Checking for update...");
});

autoUpdater.on("update-available", (info) => {
  sendStatusToWindow("Update available.");
});

autoUpdater.on("update-not-available", (info) => {
  sendStatusToWindow("Update not available.");
});

autoUpdater.on("error", (err) => {
  sendStatusToWindow("Error in auto-updater. " + err);
});

autoUpdater.on("download-progress", (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + " - Downloaded " + progressObj.percent + "%";
  log_message = log_message + " (" + progressObj.transferred + "/" + progressObj.total + ")";
  sendStatusToWindow(log_message);
});

autoUpdater.on("update-downloaded", (info) => {
  console.log("Update downloaded");
  const option = {
    type: "question",
    buttons: ["업데이트", "취소"],
    defaultId: 0,
    title: "electron-updater",
    message: "업데이트가 있습니다. 프로그램을 업데이트 하시겠습니까?",
  };
  let btnIndex = dialog.showMessageBoxSync(mainWindow, option);

  if (btnIndex === 0) {
    autoUpdater.quitAndInstall();
  }
});
//------------------------------------------------------------

//------------------------------------------------------------

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
ipcMain.on("open-error-dialog", (event, msg) => {
  dialog.showErrorBox("", msg);
});

ipcMain.on("reload", (event, msg) => {
  console.log("WHARERAE");
  mainWindow.webContents.reload();
});
