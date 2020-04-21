const { ipcRenderer } = require("electron");

const addLog = (div, message) => {
  // console.log("addLog", message);
  const date = new Date();
  const formattedTime = date.getHours() + ":" + ("0" + date.getMinutes()).substr(-2) + ":" + ("0" + date.getSeconds()).substr(-2);

  div.innerHTML += `(${formattedTime}) ${message}\r\n`;
  if (div.isScrollBottom) {
    div.scrollTop = div.scrollHeight;
  }
};

const makeSerialPortSelect = (container) => {
  const select = document.createElement("SELECT");
  select.setAttribute("id", "serialPort");
  container.appendChild(select);

  serialPortList.forEach((element) => {
    const { path, menufacturer } = element;
    const option = document.createElement("option");
    option.setAttribute("value", path);
    const text = document.createTextNode(`${path}`);
    option.appendChild(text);
    select.appendChild(option);
  });

  return select;
};

// const btnClear = document.getElementById("btnClear");
// console.log(btnClear);
// btnClear.addEventListener("click", () => {
//   ipcRenderer.send("reload");
// });

ipcRenderer.on("message", function (event, text) {
  console.log(text);
});

module.exports = { addLog, makeSerialPortSelect };
