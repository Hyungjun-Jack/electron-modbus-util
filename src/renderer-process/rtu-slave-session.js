const { ipcRenderer } = require("electron");
const Modbus = require("modbus-stream");
const hex = require("hexer");
const hexOption = { divide: "|", headSep: "|" };

const { addLog, makeSerialPortSelect } = require("./common");

const link = document.querySelector("#import-rtu-slave-session");
let template = link.import.querySelector(".add-template");
let clone = document.importNode(template.content, true);
document.querySelector(".make-rtu-session").appendChild(clone);

const makeRtuSession = () => {
  let template = link.import.querySelector(".rtu-session-template");

  let clone = document.importNode(template.content, true);

  const serialPortDiv = clone.getElementById("serialPortList");
  const serialPortSelect = makeSerialPortSelect(serialPortDiv);
  const slaveAddress = clone.getElementById("slaveAddress");

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

  const param = { btn, serialPortSelect, slaveAddress, serialPort: null, log, modbusRtu: null };

  clone.getElementById("btnConnectSerialPort").addEventListener("click", (event) => {
    openSerialPort(param);
  });

  btnClearLog.addEventListener("click", (event) => {
    log.innerHTML = "";
  });

  clone.getElementById("btnDeleteModbusRtuSlaveSession").addEventListener("click", (event) => {
    const temp = event.currentTarget.parentNode.parentNode.parentNode;

    if (document.querySelector(".modbus-rtu-ascii-sessions").contains(temp)) {
      if (param.btn.innerHTML === "닫기") {
        param.modbusRtu.close((err) => {
          if (err) {
            addLog(log, err.message);
          }
          modbusRtu = null;
          btn.innerHTML = "열기";
          addLog(log, `${path} 닫기 완료`);
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
  let { modbusRtu } = parameters;

  const title = btn.innerHTML;

  const path = serialPortSelect.value;

  const openPath = (path, parameters) => {
    Modbus.serial.connect(path, { baudRate: 9600, dataBits: 8, stopBits: 1, parity: "none", debug: "automation-123" }, (err, connection) => {
      if (err) {
        addLog(log, err.message);
      } else {
        btn.innerHTML = "닫기";
        addLog(log, `${path} 열기 완료`);
        // parameters.modbusRtu = new Modbus.server.RTU(parameters.serialPort, { coils: Buffer.alloc(1) });
        parameters.modbusRtu = connection;

        connection.on("read-coils", (req, reply) => {
          console.log(req, reply);

          const {
            slaveId,
            request: { code, address, quantity },
          } = req;

          if (slaveId === parseInt(slaveAddress.value, 10)) {
            addLog(log, `${code} SLAVE ID ${slaveId}`);

            const data = Array(quantity).fill(0);
            // reply(new Error(1), data);
            reply(null, data);
          }
        });

        connection.on("read-discrete-inputs", (req, reply) => {
          console.log(req, reply);

          const {
            slaveId,
            request: { code, address, quantity },
          } = req;

          if (slaveId === parseInt(slaveAddress.value, 10)) {
            addLog(log, `${code} SLAVE ID ${slaveId}`);

            const data = Array(quantity).fill(0);
            // reply(new Error(1), data);
            reply(null, data);
          }
        });

        connection.on("read-holding-registers", (req, reply) => {
          console.log(req, reply);

          const {
            slaveId,
            request: { code, address, quantity },
          } = req;

          if (slaveId === parseInt(slaveAddress.value, 10)) {
            addLog(log, `${code} SLAVE ID ${slaveId}`);

            const data = Buffer.alloc(quantity * 2);
            // reply(new Error(1), data);
            reply(null, data);
          }
        });

        connection.on("read-input-registers", (req, reply) => {
          console.log(req, reply);

          const {
            slaveId,
            request: { code, address, quantity },
          } = req;

          if (slaveId === parseInt(slaveAddress.value, 10)) {
            addLog(log, `${code} SLAVE ID ${slaveId}`);

            const data = Buffer.alloc(quantity * 2);
            // reply(new Error(1), data);
            reply(null, data);
          }
        });

        connection.on("write-single-coil", (req, reply) => {
          console.log(req, reply);

          const {
            slaveId,
            request: { code, address, quantity },
          } = req;

          if (slaveId === parseInt(slaveAddress.value, 10)) {
            addLog(log, `${code} SLAVE ID ${slaveId}`);

            reply(null, null);
          }
        });

        connection.on("write-single-register", (req, reply) => {
          console.log(req, reply);

          const {
            slaveId,
            request: { code, address, value },
          } = req;

          if (slaveId === parseInt(slaveAddress.value, 10)) {
            addLog(log, `${code} SLAVE ID ${slaveId}`);

            reply(null, address, value);
          }
        });

        connection.on("write-multiple-coils", (req, reply) => {
          console.log(req, reply);

          const {
            slaveId,
            request: { code, address, quantity },
          } = req;

          if (slaveId === parseInt(slaveAddress.value, 10)) {
            addLog(log, `${code} SLAVE ID ${slaveId}`);

            reply(null, null);
          }
        });

        connection.on("write-multiple-registers", (req, reply) => {
          console.log(req, reply);

          const {
            slaveId,
            request: { code, address, value },
          } = req;

          if (slaveId === parseInt(slaveAddress.value, 10)) {
            addLog(log, `${code} SLAVE ID ${slaveId}`);

            reply(null, address, value);
          }
        });
      }
    });
  };

  switch (title) {
    case "열기":
      if (modbusRtu) {
        modbusRtu.close((err) => {
          openPath(path, parameters);
        });
      } else {
        openPath(path, parameters);
      }
      break;
    case "닫기":
      modbusRtu.close((err) => {
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
