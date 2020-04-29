const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { description, version } = require("../package");

const log = require("electron-log");
const { autoUpdater } = require("electron-updater");
const ProgressBar = require("electron-progressbar");

//-------------------------------------------------------------------
// Logging
//
// THIS SECTION IS NOT REQUIRED
//
// This logging setup is not required for auto-updates to work,
// but it sure makes debugging easier :)
//-------------------------------------------------------------------
autoUpdater.autoDownload = false;
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";
log.info("App starting...");

let mainWindow, progressBar;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 920,
    height: 1180,
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
  // autoUpdater.checkForUpdatesAndNotify();
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
  const option = {
    type: "question",
    buttons: ["설치", "취소"],
    defaultId: 0,
    title: "electron-updater",
    message: "업데이트가 있습니다. 업데이트를 설치 하시겠습니까?",
  };
  let btnIndex = dialog.showMessageBoxSync(mainWindow, option);

  if (btnIndex === 0) {
    autoUpdater.downloadUpdate();

    progressBar = new ProgressBar({
      indeterminate: false,
      title: "업데이트 다운로드",
      text: "업데이트를 다운로드 중입니다.",
      browserWindow: {
        parent: mainWindow,
        webPreferences: { nodeIntegration: true },
      },
    });

    progressBar
      .on("completed", () => {
        sendStatusToWindow("ProgressBar: completed");
      })
      .on("aborted", () => {})
      .on("progress", (value) => {
        sendStatusToWindow(`ProgressBar: completed(${value})`);
        progressBar.detail = `${value}% 완료`;
      });
  }
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

  let progressValue = Math.round(progressObj.percent);
  sendStatusToWindow(`progressValue:${progressValue}`);
  if (!progressBar.isCompleted()) {
    progressBar.value = progressValue;
  }
  sendStatusToWindow(log_message);
});

autoUpdater.on("update-downloaded", (info) => {
  console.log("Update downloaded");
  // const option = {
  //   type: "question",
  //   buttons: ["업데이트", "취소"],
  //   defaultId: 0,
  //   title: "electron-updater",
  //   message: "업데이트가 다운로드되었습니다. 지금 설치하시겠습니까? 취소를 누르면 프로그램 재 시작 시 자동으로 설치됩니다.",
  // };
  // let btnIndex = dialog.showMessageBoxSync(mainWindow, option);

  // if (btnIndex === 0) {
  //   autoUpdater.quitAndInstall();
  // }
  autoUpdater.quitAndInstall();
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
