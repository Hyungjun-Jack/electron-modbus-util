const { ipcRenderer } = require("electron");
const hex = require("hexer");
const Modbus = require("modbus-stream");
const SerialPort = require("serialport");
const hexOption = { divide: "|", headSep: "|" };

const { addLog, makeSerialPortSelect } = require("./common");

const link = document.querySelector("#import-ascii-slave-session");
let template = link.import.querySelector(".add-template");
let clone = document.importNode(template.content, true);
document.querySelector(".make-ascii-session").appendChild(clone);

const makeRtuSession = () => {
  let template = link.import.querySelector(".ascii-session-template");

  let clone = document.importNode(template.content, true);

  const serialPortDiv = clone.getElementById("serialPortList");
  const serialPortSelect = makeSerialPortSelect(serialPortDiv);
  const slaveAddress = clone.getElementById("slaveAddress");
  const changeSlaveId = clone.getElementById("changeSlaveId");

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

  const param = { btn, serialPortSelect, slaveAddress, changeSlaveId, serialPort: null, log, modbusAscii: null };

  clone.getElementById("btnConnectSerialPort").addEventListener("click", (event) => {
    openSerialPort(param);
  });

  btnClearLog.addEventListener("click", (event) => {
    log.innerHTML = "";
  });

  clone.getElementById("btnDeleteModbusAsciiSlaveSession").addEventListener("click", (event) => {
    const temp = event.currentTarget.parentNode.parentNode.parentNode;

    if (document.querySelector(".modbus-rtu-ascii-sessions").contains(temp)) {
      if (param.btn.innerHTML === "닫기") {
        param.modbusAscii.close((err) => {
          if (err) {
            addLog(log, err.message);
          }
          modbusAscii = null;
          btn.innerHTML = "열기";
        });
      }
      document.querySelector(".modbus-rtu-ascii-sessions").removeChild(temp);
    }
  });

  document.querySelector(".modbus-rtu-ascii-sessions").appendChild(clone);
};

const openSerialPort = (parameters) => {
  // console.log("connect", hostElement.value, portElement.value);
  const { btn, serialPortSelect, slaveAddress, log } = parameters;
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

        const makeReply = (req, reply) => {
          // console.log(req, reply);
          let {
            slaveId,
            request: { code, address, quantity, value },
          } = req;

          if (slaveId === parseInt(slaveAddress.value, 10)) {
            if (changeSlaveId.checked) {
              slaveId += 1;
              req.slaveId = slaveId;
            }

            addLog(log, `${code} SLAVE ID ${slaveId}`);

            let data;
            switch (code) {
              case "ReadCoils":
                data = Array(quantity).fill(0);
                break;
              case "ReadHoldingRegisters":
                data = Buffer.alloc(quantity * 2);
                break;
              case "ReadInputRegisters":
                data = Buffer.alloc(quantity * 2);
                break;
              case "WriteSingleCoil":
                break;
              case "WriteSingleRegister":
                reply(null, address, value);
                return;
              case "WriteMultipleCoils":
                break;
              case "WriteMultipleRegisters":
                reply(null, address, value);
                return;
            }
            // reply(new Error(1), data);
            reply(null, data);
          }
        };

        connection.on("read-coils", makeReply);
        connection.on("read-holding-registers", makeReply);
        connection.on("read-input-registers", makeReply);
        connection.on("write-single-coil", makeReply);
        connection.on("write-single-register", makeReply);
        connection.on("write-multiple-coils", makeReply);
        connection.on("write-multiple-registers", makeReply);
      }
    });
  };

  switch (title) {
    case "열기":
      if (modbusAscii) {
        modbusAscii.close((err) => {
          openPath(path, parameters);
        });
      } else {
        openPath(path, parameters);
      }
      break;
    case "닫기":
      modbusAscii.close((err) => {
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

document.getElementById("btnAddModbusAsciiSlaveSession").addEventListener("click", makeRtuSession);
