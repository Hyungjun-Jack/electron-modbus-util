const { ipcRenderer } = require("electron");
const hex = require("hexer");
const Modbus = require("modbus-stream");
const SerialPort = require("serialport");
const hexOption = { divide: "|", headSep: "|" };

const { addLog, makeSerialPortSelect } = require("./common");

const link = document.querySelector("#import-ascii-master-session");
let template = link.import.querySelector(".add-template");
let clone = document.importNode(template.content, true);
document.querySelector(".make-ascii-session").appendChild(clone);

const makeRtuSession = () => {
  let template = link.import.querySelector(".ascii-session-template");

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

  const param = { btn, serialPortSelect, slaveAddress, slaveAddressValue: 0, serialPort: null, log, modbusAscii: null, query: { fc, startAddress, quantity, quantityTitle, value, valueCoil } };

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

    const { btn, serialPortSelect, log, modbusAscii, slaveAddress, slaveAddressValue } = param;

    if (modbusAscii === null) {
      addLog(log, "COM가 닫혀 있습니다.");
      return;
    }

    switch (fc.selectedIndex) {
      case 0: // READ COILS (FC 01)
        modbusAscii.readCoils({ address: startAddress.value, quantity: quantity.value, extra: { slaveId: slaveAddressValue } }, (err, res) => {
          if (err) {
            // console.log("err", err);
            addLog(log, err.message);
          } else {
            console.log("res", res);
            const {
              slaveId,
              response: { code, data },
            } = res;

            addLog(log, `${code} SLAVE ADDRESS ${slaveId}`);
            let test = data.map((value, index) => `비트${index}: ${value}\r\n`).join("");
            addLog(log, "\r\n" + test);
            addLog(log, "\r\n" + hex(Buffer.from(data), hexOption));
          }
        });
        break;
      case 1: //READ DISCRETE INPUTS (FC 02)
        modbusAscii.readDiscreteInputs({ address: startAddress.value, quantity: quantity.value, extra: { slaveId: slaveAddressValue } }, (err, res) => {
          if (err) {
            // console.log("err", err);
            addLog(log, err.message);
          } else {
            console.log("res", res);
            const {
              slaveId,
              response: { code, data },
            } = res;

            addLog(log, `${code} SLAVE ADDRESS ${slaveId}`);
            let test = data.map((value, index) => `비트${index}: ${value}\r\n`).join("");
            addLog(log, "\r\n" + test);
            addLog(log, "\r\n" + hex(Buffer.from(data), hexOption));
          }
        });
        break;
      case 2: //READ HOLDING REGISTERS (FC 03)
        modbusAscii.readHoldingRegisters({ address: startAddress.value, quantity: quantity.value, extra: { slaveId: slaveAddressValue } }, (err, res) => {
          if (err) {
            // console.log("err", err);
            addLog(log, err.message);
          } else {
            console.log("res", res);
            const {
              slaveId,
              response: { code, data },
            } = res;

            addLog(log, `${code} SLAVE ADDRESS ${slaveId}`);
            let test = data.map((value, index) => `비트${index}: ${value}\r\n`).join("");
            addLog(log, "\r\n" + test);
            addLog(log, "\r\n" + hex(Buffer.from(data), hexOption));
          }
        });
        break;
      case 3: //READ INPUT REGISTERS (FC 04)
        modbusAscii.readInputRegisters({ address: startAddress.value, quantity: quantity.value, extra: { slaveId: slaveAddressValue } }, (err, res) => {
          if (err) {
            // console.log("err", err);
            addLog(log, err.message);
          } else {
            console.log("res", res);
            const {
              slaveId,
              response: { code, data },
            } = res;

            addLog(log, `${code} SLAVE ADDRESS ${slaveId}`);
            let test = data.map((value, index) => `비트${index}: ${value}\r\n`).join("");
            addLog(log, "\r\n" + test);
            addLog(log, "\r\n" + hex(Buffer.from(data), hexOption));
          }
        });
        break;
      case 4: //WRITE SINGLE COIL (FC 05)
        modbusAscii.writeSingleCoil({ address: startAddress.value, value: valueCoil.value === "1" ? true : false, extra: { slaveId: slaveAddressValue } }, (err, res) => {
          if (err) {
            addLog(log, err.message);
          } else {
            console.log("res", res);
            const {
              slaveId,
              response: { code, address, value },
            } = res;

            addLog(log, `${code} SLAVE ADDRESS ${slaveId}`);
            addLog(log, "쿼리 전송 성공");
          }
        });
        break;
      case 5: //WRITE SINGLE REGISTER (FC 06)
        buffer = Buffer.from(value.value, "hex");
        if (buffer.length !== 2) {
          ipcRenderer.send("open-error-dialog", "값을 확인하세요.");
          return;
        }

        modbusAscii.writeSingleRegister({ address: startAddress.value, value: buffer, extra: { slaveId: slaveAddressValue } }, (err, res) => {
          if (err) {
            addLog(log, err.message);
          } else {
            console.log("res", res);
            const {
              slaveId,
              response: { code, address, value },
            } = res;

            addLog(log, `${code} SLAVE ADDRESS ${slaveId}`);
            addLog(log, "쿼리 전송 성공");
          }
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

        if (buffer.length !== byteCount) {
          ipcRenderer.send("open-error-dialog", "값을 확인하세요.");
          return;
        }

        modbusAscii.writeMultipleCoils({ address: startAddress.value, values: buffer, extra: { slaveId: slaveAddressValue } }, (err, res) => {
          if (err) {
            addLog(log, err.message);
          } else {
            console.log("res", res);
            const {
              slaveId,
              response: { code, address, value },
            } = res;

            addLog(log, `${code} SLAVE ADDRESS ${slaveId}`);
            addLog(log, "쿼리 전송 성공");
          }
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

        let values = [];
        for (i = 0; i < byteCount; i += 2) {
          values.push(buffer.subarray(i, i + 2));
        }

        modbusAscii.writeMultipleRegisters({ address: startAddress.value, values, extra: { slaveId: slaveAddressValue } }, (err, res) => {
          if (err) {
            addLog(log, err.message);
          } else {
            console.log("res", res);
            const {
              slaveId,
              response: { code, address, value },
            } = res;

            addLog(log, `${code} SLAVE ADDRESS ${slaveId}`);
            addLog(log, "쿼리 전송 성공");
          }
        });
        break;
    }
  });

  clone.getElementById("btnDeleteModbusAsciiMasterSession").addEventListener("click", (event) => {
    const temp = event.currentTarget.parentNode.parentNode.parentNode;

    if (document.querySelector(".modbus-rtu-ascii-sessions").contains(temp)) {
      if (param.btn.innerHTML === "닫기") {
        param.modbusAscii.close((err) => {
          if (err) {
            addLog(log, err.message);
          }
          modbusAscii = null;
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
  const { btn, serialPortSelect, log, slaveAddress } = parameters;
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
        parameters.slaveAddressValue = slaveAddress.value;
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

document.getElementById("btnAddModbusAsciiMasterSession").addEventListener("click", makeRtuSession);
