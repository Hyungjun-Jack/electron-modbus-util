const { ipcRenderer } = require("electron");
const Modbus = require("jsmodbus");
const hex = require("hexer");
const SerialPort = require("serialport");
const hexOption = { divide: "|", headSep: "|" };

const { addLog, makeSerialPortSelect } = require("./common");

const link = document.querySelector("#import-rtu-master-session");
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
  btnClearLog.addEventListener("click", (event) => {
    log.innerHTML = "";
  });

  const fc = clone.getElementById("fc");
  const startAddress = clone.getElementById("startAddress");
  const quantity = clone.getElementById("quantity");
  const quantityTitle = clone.getElementById("quantityTitle");
  const value = clone.getElementById("value");
  const valueCoil = clone.getElementById("valueCoil");
  const btnSendQuery = clone.getElementById("btnSendQuery");

  const param = { btn, serialPortSelect, slaveAddress, serialPort: null, log, modbusRtu: null, query: { fc, startAddress, quantity, quantityTitle, value, valueCoil } };

  fc.addEventListener("change", (event) => {
    if (fc.selectedIndex === 4 || fc.selectedIndex === 8) {
      value.style.display = "none";
      valueCoil.style.display = "block";
    } else {
      value.style.display = "block";
      valueCoil.style.display = "none";
    }
  });

  clone.getElementById("btnConnectSerialPort").addEventListener("click", (event) => {
    openSerialPort(param);
  });

  btnSendQuery.addEventListener("click", () => {
    let buffer, _quantity, byteCount;

    const {
      modbusRtu,
      query: { fc, startAddress, quantity, value },
    } = param;

    if (modbusRtu === null) {
      addLog(log, "COM가 닫혀 있습니다.");
      return;
    }

    switch (fc.selectedIndex) {
      case 0: // READ COILS (FC 01)
        modbusRtu
          .readCoils(startAddress.value, quantity.value)
          .then((resp, req) => {
            console.log(resp, req);
            const {
              response: {
                address,
                body: { valuesAsArray, valuesAsBuffer },
              },
            } = resp;

            let test = valuesAsArray.map((value, index) => `비트${index}: ${value}\r\n`).join("");
            addLog(log, `readCoils SLAVE ADDRESS ${address}`);
            addLog(log, "\r\n" + test);
            addLog(log, "\r\n" + hex(valuesAsBuffer, hexOption));
          })
          .catch((err) => {
            addLog(log, err.response ? err.response.body.message : err.message);
          });
        break;
      case 1: //READ DISCRETE INPUTS (FC 02)
        modbusRtu
          .readDiscreteInputs(startAddress.value, quantity.value)
          .then((resp, req) => {
            console.log(resp);

            const {
              response: {
                address,
                body: { valuesAsArray, valuesAsBuffer },
              },
            } = resp;

            let test = valuesAsArray.map((value, index) => `비트${index}: ${value}\r\n`).join("");
            addLog(log, `readDiscreteInputs SLAVE ADDRESS ${address}`);
            addLog(log, "\r\n" + test);
            addLog(log, "\r\n" + hex(valuesAsBuffer, hexOption));
          })
          .catch((err) => {
            addLog(log, err.response ? err.response.body.message : err.message);
          });
        break;
      case 2: //READ HOLDING REGISTERS (FC 03)
        modbusRtu
          .readHoldingRegisters(startAddress.value, quantity.value)
          .then((resp) => {
            console.log(resp);
            const {
              response: {
                address,
                body: { valuesAsArray, valuesAsBuffer },
              },
            } = resp;

            addLog(log, `readHoldingRegisters SLAVE ADDRESS ${address}`);

            let test = valuesAsArray.map((value, index) => `레지스터${index}: ${value}\r\n`).join("");
            addLog(log, "\r\n" + test);

            if (valuesAsBuffer.length >= 4) {
              test = "";
              let _u32Count = Math.floor(valuesAsBuffer.length / 4);
              for (let i = 0; i < _u32Count; i++) {
                test += `_u32(${i}): ${valuesAsBuffer.readUInt32BE(4 * i)}\r\n`;
              }
              addLog(log, "\r\n" + test);
            }

            addLog(log, "\r\n" + hex(valuesAsBuffer, hexOption));
          })
          .catch((err) => {
            addLog(log, err.response ? err.response.body.message : err.message);
          });
        break;
      case 3: //READ INPUT REGISTERS (FC 04)
        modbusRtu
          .readInputRegisters(startAddress.value, quantity.value)
          .then((resp) => {
            console.log(resp);
            const {
              response: {
                address,
                body: { valuesAsArray, valuesAsBuffer },
              },
            } = resp;
            console.log(valuesAsArray);
            console.log(hex(valuesAsBuffer, hexOption));

            addLog(log, `readInputRegisters SLAVE ADDRESS ${address}`);

            let test = valuesAsArray.map((value, index) => `레지스터${index}: ${value}\r\n`).join("");
            addLog(log, "\r\n" + test);

            if (valuesAsBuffer.length >= 4) {
              test = "";
              let _u32Count = Math.floor(valuesAsBuffer.length / 4);
              console.log("_u32Count", _u32Count);
              for (let i = 0; i < _u32Count; i++) {
                test += `_u32(${i}): ${valuesAsBuffer.readUInt32BE(4 * i)}\r\n`;
              }
              addLog(log, "\r\n" + test);
            }

            addLog(log, "\r\n" + hex(valuesAsBuffer, hexOption));
          })
          .catch((err) => {
            addLog(log, err.response ? err.response.body.message : err.message);
          });
        break;
      case 4: //WRITE SINGLE COIL (FC 05)
        modbusRtu
          .writeSingleCoil(startAddress.value, valueCoil.value === "1" ? true : false)
          .then((resp) => {
            console.log(resp);
            const {
              response: {
                address,
                body: { valuesAsArray, valuesAsBuffer },
              },
            } = resp;
            addLog(log, `writeSingleCoil SLAVE ADDRESS ${address}`);
            addLog(log, "쿼리 전송 성공");
          })
          .catch((err) => {
            addLog(log, err.response ? err.response.body.message : err.message);
          });
        break;
      case 5: //WRITE SINGLE REGISTER (FC 06)
        buffer = Buffer.from(value.value, "hex");
        if (buffer.length !== 2) {
          ipcRenderer.send("open-error-dialog", "값을 확인하세요.");
          return;
        }

        modbusRtu
          .writeSingleRegister(startAddress.value, buffer.readUInt16BE(0))
          .then((resp) => {
            console.log(resp);
            const {
              response: {
                address,
                body: { valuesAsArray, valuesAsBuffer },
              },
            } = resp;
            addLog(log, `writeSingleRegister SLAVE ADDRESS ${address}`);
            addLog(log, "쿼리 전송 성공");
          })
          .catch((err) => {
            addLog(log, err.response ? err.response.body.message : err.message);
          });
        break;
      case 6: //WRITE MULTIPLE COILS (FC 15)
        _quantity = parseInt(quantity.value, 10);

        if (_quantity === 0 || isNaN(_quantity)) {
          ipcRenderer.send("open-error-dialog", "개수를 확인하세요.");
          return;
        }

        byteCount = _quantity % 8 === 0 ? _quantity / 8 : Math.floor(_quantity / 8) + 1;

        buffer = Buffer.from(value.value, "hex");

        console.log(byteCount, buffer.length);

        if (buffer.length !== byteCount) {
          ipcRenderer.send("open-error-dialog", "값을 확인하세요.");
          return;
        }
        modbusRtu
          .writeMultipleCoils(startAddress.value, buffer, _quantity)
          .then((resp) => {
            console.log(resp);
            const {
              response: {
                address,
                body: { valuesAsArray, valuesAsBuffer },
              },
            } = resp;
            addLog(log, `writeMultipleCoils SLAVE ADDRESS ${address}`);
            addLog(log, "쿼리 전송 성공");
          })
          .catch((err) => {
            addLog(log, err.response ? err.response.body.message : err.message);
          });
        break;
      case 7: //WRITE MULTIPLE REGISTERS (FC 16)
        _quantity = parseInt(quantity.value, 10);

        if (_quantity === 0 || isNaN(_quantity)) {
          ipcRenderer.send("open-error-dialog", "개수를 확인하세요.");
          return;
        }

        byteCount = _quantity * 2;

        buffer = Buffer.from(value.value, "hex");

        // console.log(byteCount, buffer.length);

        if (buffer.length !== byteCount) {
          ipcRenderer.send("open-error-dialog", "값을 확인하세요.");
          return;
        }

        modbusRtu
          .writeMultipleRegisters(startAddress.value, buffer)
          .then((resp) => {
            const {
              response: {
                address,
                body: { valuesAsArray, valuesAsBuffer },
              },
            } = resp;
            console.log(resp);
            addLog(log, `writeMultipleRegisters SLAVE ADDRESS ${address}`);
            addLog(log, "쿼리 전송 성공");
          })
          .catch((err) => {
            addLog(log, err.response ? err.response.body.message : err.message);
          });
        break;
    }
  });

  clone.getElementById("btnDeleteModbusRtuMasterSession").addEventListener("click", (event) => {
    const temp = event.currentTarget.parentNode.parentNode.parentNode;

    if (document.querySelector(".modbus-rtu-ascii-sessions").contains(temp)) {
      if (param.btn.innerHTML === "닫기") {
        param.serialPort.close((err) => {
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
  const { btn, slaveAddress, serialPortSelect, log } = parameters;
  let { serialPort, modbusRtu } = parameters;

  const title = btn.innerHTML;

  const path = serialPortSelect.value;

  const modbusRtuLog = (request) => {
    addLog(log, request.name);
  };

  const openPath = (path, parameters) => {
    parameters.serialPort = new SerialPort(path, { baudRate: 9600, dataBits: 8, stopBits: 1, parity: "none" }, (err) => {
      if (!err) {
        // parameters.modbusRtu = new Modbus.server.RTU(parameters.serialPort, { coils: Buffer.alloc(1) });
      } else {
        addLog(log, err.message);
      }
    });

    parameters.modbusRtu = new Modbus.client.RTU(parameters.serialPort, slaveAddress.value);

    parameters.serialPort.on("open", (err) => {
      console.log(err);
      btn.innerHTML = "닫기";
      addLog(log, `${path} 열기 완료`);
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

document.getElementById("btnAddModbusRtuMasterSession").addEventListener("click", makeRtuSession);
