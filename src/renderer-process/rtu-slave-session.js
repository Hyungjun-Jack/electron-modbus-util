const { ipcRenderer } = require("electron");
const Modbus = require("jsmodbus");
const hex = require("hexer");
const hexOption = { divide: "|", headSep: "|" };

const { addLog, makeSerialPortSelect } = require("./common");

const link = document.querySelector("#import-rtu-slave-session");
let template = link.import.querySelector(".add-template");
let clone = document.importNode(template.content, true);
document.querySelector(".make-session").appendChild(clone);

const makeRtuSession = () => {
  let template = link.import.querySelector(".rtu-session-template");

  let clone = document.importNode(template.content, true);

  const serialPortDiv = clone.getElementById("serialPortList");
  const serialPortSelect = makeSerialPortSelect(serialPortDiv);

  const btn = clone.getElementById("btnConnectSerialPort");

  const log = clone.getElementById("log");
  log.isScrollBottom = true;
  log.addEventListener("scroll", (event) => {
    if (event.target.scrollHeight - event.target.scrollTop === event.target.clientHeight) {
      log.isScrollBottom = true;
    } else {
      log.isScrollBottom = false;
    }
  });
  const btnClearLog = clone.getElementById("btnClearLog");

  const param = { btn, serialPortSelect, serialPort: null, log, modbusRtu: null };

  clone.getElementById("btnConnectSerialPort").addEventListener("click", (event) => {
    openSerialPort(param);
  });

  btnClearLog.addEventListener("click", (event) => {
    log.innerHTML = "";
  });

  document.querySelector(".modbus-rtu-ascii-sessions").appendChild(clone);
};

const openSerialPort = (parameters) => {
  // console.log("connect", hostElement.value, portElement.value);
  const { btn, serialPortSelect, log } = parameters;
  let { serialPort, modbusRtu } = parameters;

  const title = btn.innerHTML;

  const path = serialPortSelect.value;

  const modbusRtuLog = (request) => {
    addLog(log, request.name);
  };

  const openPath = (path, parameters) => {
    parameters.serialPort = new SerialPort(path, { baudRate: 9600, dataBits: 8, stopBits: 1, parity: "none" }, (err) => {
      if (!err) {
        btn.innerHTML = "닫기";
        addLog(log, `${path} 열기 완료`);
        // parameters.modbusRtu = new Modbus.server.RTU(parameters.serialPort, { coils: Buffer.alloc(1) });
        parameters.modbusRtu = new Modbus.server.RTU(parameters.serialPort);

        parameters.modbusRtu.on("postReadCoils", (request, cb) => {
          console.log(request);
          modbusRtuLog(request);
        });
        parameters.modbusRtu.on("postReadDiscreteInputs", (request, cb) => {
          console.log(request);
          modbusRtuLog(request);
        });
        parameters.modbusRtu.on("postReadHoldingRegisters", (request, cb) => {
          console.log(request);
          modbusRtuLog(request);
        });
        parameters.modbusRtu.on("postReadInputRegisters", (request, cb) => {
          console.log(request);
          modbusRtuLog(request);
        });
        parameters.modbusRtu.on("postWriteSingleCoil", (request, cb) => {
          console.log(request);
          modbusRtuLog(request);
        });
        parameters.modbusRtu.on("postWriteSingleRegister", (request, cb) => {
          console.log(request);
          modbusRtuLog(request);
        });
        parameters.modbusRtu.on("postWriteMultipleCoils", (request, cb) => {
          console.log(request);
          modbusRtuLog(request);
        });
        parameters.modbusRtu.on("postWriteMultipleRegisters", (request, cb) => {
          console.log(request);
          modbusRtuLog(request);
        });
      } else {
        addLog(log, err.message);
      }
    });
  };

  switch (title) {
    case "열기":
      if (serialPort) {
        serialPort.close((err) => {
          openPath(path, parameters);
        });
      } else {
        openPath(path, parameters);
      }
      break;
    case "닫기":
      serialPort.close((err) => {
        if (err) {
          addLog(log, err.message);
        }
        modbusRtu = null;
        btn.innerHTML = "열기";
        addLog(log, `${path} 닫기 완료`);
      });

      break;
  }
};

document.getElementById("btnAddModbusRtuSlaveSession").addEventListener("click", makeRtuSession);

// setTimeout(() => makeRtuSession(), 1000);
