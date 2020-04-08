const { ipcRenderer } = require("electron");
const hex = require("hexer");
const Modbus = require("modbus-stream");
const SerialPort = require("serialport");
const hexOption = { divide: "|", headSep: "|" };

const { addLog } = require("./common");

const link = document.querySelector("#import-ascii-slave-session");
let template = link.import.querySelector(".add-template");
let clone = document.importNode(template.content, true);
document.querySelector(".make-session").appendChild(clone);

let serialPortList;
SerialPort.list().then(ports => {
  let values = Object.values(ports);
  serialPortList = values
    .filter(value => {
      const { path } = value;
      return path.startsWith("NULL_") === false;
    })
    .sort((a, b) => {
      const { path: path_a } = a;
      const { path: path_b } = b;

      const item1 = parseInt(path_a.replace(/[A-Z]/g, ""), 10);
      const item2 = parseInt(path_b.replace(/[A-Z]/g, ""), 10);

      if (item1 < item2) {
        return -1;
      }
      if (item1 > item2) {
        return 1;
      }
      return 0;
    });

  console.log(serialPortList);
});

const makeSerialPortSelect = container => {
  const select = document.createElement("SELECT");
  select.setAttribute("id", "serialPort");
  container.appendChild(select);

  serialPortList.forEach(element => {
    const { path, menufacturer } = element;
    const option = document.createElement("option");
    option.setAttribute("value", path);
    const text = document.createTextNode(`${path}`);
    option.appendChild(text);
    select.appendChild(option);
  });

  return select;
};

const makeRtuSession = () => {
  let template = link.import.querySelector(".ascii-session-template");

  let clone = document.importNode(template.content, true);

  const serialPortDiv = clone.getElementById("serialPortList");
  const serialPortSelect = makeSerialPortSelect(serialPortDiv);

  const btn = clone.getElementById("btnConnectSerialPort");

  const log = clone.getElementById("log");
  log.isScrollBottom = true;
  const btnClearLog = clone.getElementById("btnClearLog");

  const param = { btn, serialPortSelect, serialPort: null, log, modbusAscii: null };

  clone.getElementById("btnConnectSerialPort").addEventListener("click", event => {
    openSerialPort(param);
  });

  log.addEventListener("scroll", event => {
    if (event.target.scrollHeight - event.target.scrollTop === event.target.clientHeight) {
      log.isScrollBottom = true;
    } else {
      log.isScrollBottom = false;
    }
  });

  btnClearLog.addEventListener("click", event => {
    log.innerHTML = "";
  });

  document.querySelector(".modbus-rtu-ascii-sessions").appendChild(clone);
};

const openSerialPort = parameters => {
  // console.log("connect", hostElement.value, portElement.value);
  const { btn, serialPortSelect, log } = parameters;
  let { modbusAscii } = parameters;

  const title = btn.innerHTML;

  const path = serialPortSelect.value;

  const openPath = (path, parameters) => {
    Modbus.serial.connect(path, { baudRate: 9600, dataBits: 8, stopBits: 1, parity: "none", debug: "automation-123", mode: "ascii" }, (err, connection) => {
      if (err) {
        addLog(log, err.message);
      } else {
        btn.innerHTML = "닫기";
        addLog(log, `${path} 열기 완료`);
        parameters.modbusAscii = connection;
        // console.log(connection._events);
        connection.on("read-coils", (req, reply) => {
          console.log(req, reply);
          const {
            request: { code, address, quantity }
          } = req;
          addLog(log, code);
          const data = Array(quantity).fill(0);
          // reply(new Error(1), data);
          reply(null, data);
        });

        connection.on("read-discrete-inputs", (req, reply) => {
          console.log(req, reply);

          const {
            request: { code, address, quantity }
          } = req;
          addLog(log, code);
          const data = Array(quantity).fill(0);
          // reply(new Error(1), data);
          reply(null, data);
        });
        connection.on("read-holding-registers", (req, reply) => {
          console.log(req, reply);
          const {
            request: { code, address, quantity }
          } = req;
          addLog(log, code);
          const data = Buffer.alloc(quantity * 2);
          // reply(new Error(1), data);
          reply(null, data);
        });
        connection.on("read-input-registers", (req, reply) => {
          console.log(req, reply);
          const {
            request: { code, address, quantity }
          } = req;
          addLog(log, code);
          const data = Buffer.alloc(quantity * 2);
          // reply(new Error(1), data);
          reply(null, data);
        });
        connection.on("write-single-coil", (req, reply) => {
          console.log(req, reply);
          const {
            request: { code, address, quantity }
          } = req;
          addLog(log, code);
          reply(null, null);
        });
        connection.on("write-single-register", (req, reply) => {
          console.log(req, reply);
          const {
            request: { code, address, value }
          } = req;
          addLog(log, code);
          reply(null, address, value);
        });
        connection.on("write-multiple-coils", (req, reply) => {
          console.log(req, reply);
          const {
            request: { code, address, quantity }
          } = req;
          addLog(log, code);
          reply(null, null);
        });
        connection.on("write-multiple-registers", (req, reply) => {
          console.log(req, reply);
          const {
            request: { code, address, value }
          } = req;
          addLog(log, code);
          reply(null, address, value);
        });
      }
    });
  };

  switch (title) {
    case "열기":
      if (modbusAscii) {
        modbusAscii.close(err => {
          openPath(path, parameters);
        });
      } else {
        openPath(path, parameters);
      }
      break;
    case "닫기":
      modbusAscii.close(err => {
        if (err) {
          addLog(log, err.message);
        }
        modbusAscii = null;
        btn.innerHTML = "열기";
        addLog(log, `${path} 닫기 완료`);
      });

      break;
  }
};

document.getElementById("btnAddModbusAsciiSession").addEventListener("click", makeRtuSession);
