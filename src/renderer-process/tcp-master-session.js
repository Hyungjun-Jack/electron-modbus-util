const { ipcRenderer } = require("electron");
const net = require("net");
const Modbus = require("jsmodbus");
const hex = require("hexer");
const { addLog } = require("./common");

const hexOption = { divide: "|", headSep: "|" };

const link = document.querySelector("#import-tcp-master-session");
let template = link.import.querySelector(".add-template");
let clone = document.importNode(template.content, true);
document.querySelector(".make-tcp-session").appendChild(clone);

const makeSession = () => {
  let template = link.import.querySelector(".session-template");

  let clone = document.importNode(template.content, true);

  const host = clone.getElementById("deviceAddress");
  const port = clone.getElementById("devicePortNubmer");
  const unitId = clone.getElementById("unitId");
  const log = clone.getElementById("log");
  log.isScrollBottom = true;
  log.addEventListener("scroll", (event) => {
    // console.log("scroll", event.target.offsetHeight, event.target.scrollTop, event.target.scrollHeight);

    if (event.target.scrollHeight - event.target.scrollTop === event.target.clientHeight) {
      // console.log("The scroll arrived at bottom");
      log.isScrollBottom = true;
    } else {
      log.isScrollBottom = false;
    }
  });
  const btnClearLog = clone.getElementById("btnClearLog");
  // const socket = new net.Socket();
  let socket = null;
  // const modbus = new Modbus.client.TCP(socket, 1);
  let modbus = null;
  const btn = clone.getElementById("btnConnect");
  const btnSendQuery = clone.getElementById("btnSendQuery");

  const fc = clone.getElementById("fc");
  const startAddress = clone.getElementById("startAddress");
  const quantity = clone.getElementById("quantity");
  const quantityTitle = clone.getElementById("quantityTitle");
  const value = clone.getElementById("value");
  const valueCoil = clone.getElementById("valueCoil");

  const param = { btn, host, port, unitId, log, socket, modbus, query: { fc, startAddress, quantity, quantityTitle, value, valueCoil } };

  fc.addEventListener("change", (event) => {
    if (fc.selectedIndex === 4 || fc.selectedIndex === 8) {
      value.style.display = "none";
      valueCoil.style.display = "block";
    } else {
      value.style.display = "block";
      valueCoil.style.display = "none";
    }

    if (fc.selectedIndex === 8) {
      quantityTitle.innerHTML = "시간(40 ~ 10,000)";
    } else {
      quantityTitle.innerHTML = "개수";
    }
  });

  btnClearLog.addEventListener("click", (event) => {
    log.innerHTML = "";
  });

  clone.getElementById("btnConnect").addEventListener("click", (event) => {
    connect(param);
  });

  btnSendQuery.addEventListener("click", (event) => {
    let buffer, _quantity, byteCount;

    const { fc, startAddress, quantity, value } = param.query;
    let { socket, modbus } = param;

    if (socket === null || modbus === null) {
      addLog(log, "no connection to modbus server");
      return;
    }

    addLog(log, "QUERY 전송.");

    switch (fc.selectedIndex) {
      case 0: //READ COILS (FC 01)
        modbus
          .readCoils(startAddress.value, quantity.value)
          .then((resp, req) => {
            console.log(resp);

            const {
              response: {
                body: { valuesAsArray, valuesAsBuffer },
              },
            } = resp;

            addLog(log, `readCoils UNIT ID ${resp.response.unitId}`);
            let test = valuesAsArray.map((value, index) => `비트${index}: ${value}\r\n`).join("");
            addLog(log, "\r\n" + test);
            addLog(log, "\r\n" + hex(valuesAsBuffer, hexOption));
          })
          .catch((err) => {
            addLog(log, err.response ? err.response.body.message : err.message);
            // closeConnection(param);
          });
        break;
      case 1: //READ DISCRETE INPUTS (FC 02)
        modbus
          .readDiscreteInputs(startAddress.value, quantity.value)
          .then((resp, req) => {
            console.log(resp);

            const {
              response: {
                body: { valuesAsArray, valuesAsBuffer },
              },
            } = resp;

            addLog(log, `readDiscreteInputs UNIT ID ${resp.response.unitId}`);
            let test = valuesAsArray.map((value, index) => `비트${index}: ${value}\r\n`).join("");
            addLog(log, "\r\n" + test);
            addLog(log, "\r\n" + hex(valuesAsBuffer, hexOption));
          })
          .catch((err) => {
            addLog(log, err.response ? err.response.body.message : err.message);
            // closeConnection(param);
          });
        break;
      case 2: //READ HOLDING REGISTERS (FC 03)
        modbus
          .readHoldingRegisters(startAddress.value, quantity.value)
          .then((resp) => {
            console.log(resp);
            const {
              response: {
                body: { valuesAsArray, valuesAsBuffer },
              },
            } = resp;

            addLog(log, `readHoldingRegisters UNIT ID ${resp.response.unitId}`);
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
            // closeConnection(param);
          });
        break;
      case 3: //READ INPUT REGISTERS (FC 04)
        modbus
          .readInputRegisters(startAddress.value, quantity.value)
          .then((resp) => {
            console.log(resp);
            const {
              response: {
                body: { valuesAsArray, valuesAsBuffer },
              },
            } = resp;
            console.log(valuesAsArray);
            console.log(hex(valuesAsBuffer, hexOption));

            addLog(log, `readInputRegisters UNIT ID ${resp.response.unitId}`);
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
            // closeConnection(param);
          });
        break;
      case 4: //WRITE SINGLE COIL (FC 05)
        modbus
          .writeSingleCoil(startAddress.value, valueCoil.value === "1" ? true : false)
          .then((resp) => {
            console.log(resp);
            addLog(log, `writeSingleCoil UNIT ID ${resp.response.unitId}`);
            addLog(log, "쿼리 전송 성공");
          })
          .catch((err) => {
            addLog(log, err.response ? err.response.body.message : err.message);
            // closeConnection(param);
          });
        break;
      case 5: //WRITE SINGLE REGISTER (FC 06)
        buffer = Buffer.from(value.value, "hex");
        if (buffer.length !== 2) {
          ipcRenderer.send("open-error-dialog", "값을 확인하세요.");
          return;
        }

        modbus
          .writeSingleRegister(startAddress.value, buffer.readUInt16BE(0))
          .then((resp) => {
            console.log(resp);
            addLog(log, `writeSingleRegister UNIT ID ${resp.response.unitId}`);
            addLog(log, "쿼리 전송 성공");
          })
          .catch((err) => {
            addLog(log, err.response ? err.response.body.message : err.message);
            // closeConnection(param);
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
        modbus
          .writeMultipleCoils(startAddress.value, buffer, _quantity)
          .then((resp) => {
            console.log(resp);
            addLog(log, `writeMultipleCoils UNIT ID ${resp.response.unitId}`);
            addLog(log, "쿼리 전송 성공");
          })
          .catch((err) => {
            addLog(log, err.response ? err.response.body.message : err.message);
            // closeConnection(param);
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

        modbus
          .writeMultipleRegisters(startAddress.value, buffer)
          .then((resp) => {
            console.log(resp);
            addLog(log, `writeMultipleRegisters UNIT ID ${resp.response.unitId}`);
            addLog(log, "쿼리 전송 성공");
          })
          .catch((err) => {
            addLog(log, err.response ? err.response.body.message : err.message);
            // closeConnection(param);
          });
        break;
      case 8: //PULSE (FC 105)
        // const request = Buffer.alloc(13);
        // request.writeUInt8(7, 5);
        // request.writeUInt8(1, 6);
        // request.writeUInt8(105, 7);
        // request.writeUInt16BE(parseInt(startAddress.value, 10), 8);
        // request.writeUInt16BE(parseInt(quantity.value, 10), 10);
        // request.writeUInt8(valueCoil.value === "1" ? 0xff : 0, 12);

        // if (socket) {
        //   socket.write(request);
        // } else {
        //   addLog(log, "no connection to modbus server");
        // }
        modbus
          .writeFc105(startAddress.value, quantity.value, valueCoil.value === "1" ? true : false)
          .then((resp) => {
            console.log(resp);
            addLog(log, `writeFc105 UNIT ID ${resp.response.unitId}`);
            addLog(log, "쿼리 전송 성공");
          })
          .catch((err) => {
            addLog(log, err.response ? err.response.body.message : err.message);
            // closeConnection(param);
          });
        break;
    }
  });

  clone.getElementById("btnDeleteModbusTcpMasterSession").addEventListener("click", (event) => {
    const temp = event.currentTarget.parentNode.parentNode.parentNode;

    if (document.querySelector(".modbus-tcp-sessions").contains(temp)) {
      closeConnection(param);
      document.querySelector(".modbus-tcp-sessions").removeChild(temp);
    }
  });

  document.querySelector(".modbus-tcp-sessions").appendChild(clone);
};

const connect = (parameters) => {
  // console.log("connect", hostElement.value, portElement.value);
  const { btn } = parameters;
  const title = btn.innerHTML;

  switch (title) {
    case "접속":
      btn.innerHTML = "접속 시도 중";
      makeConnection(parameters);
      break;
    case "접속종료":
      btn.innerHTML = "접속";
      closeConnection(parameters);
      break;
    case "접속 시도 중":
      return;
  }
};

const makeConnection = (parameters) => {
  console.log("makeConnection", parameters);

  const { log, host, port, unitId, btn } = parameters;
  let { socket, modbus } = parameters;

  addLog(log, "TCP 접속 시도 중...");

  if (socket !== null) {
    socket.destroy();
    socket = null;
  }

  if (modbus !== null) {
    modbus = null;
  }

  socket = new net.Socket();
  parameters.socket = socket;
  parameters.modbus = new Modbus.client.TCP(socket, parseInt(unitId.value, 10));
  // parameters.modbus = new Modbus.client.TCP(socket, 1);

  socket.on("connect", (socket) => {
    console.log("connect");
    addLog(log, "접속 완료");
    btn.innerHTML = "접속종료";
  });

  socket.on("data", (data) => {
    console.log("data:", data, hex(data, hexOption));
  });

  socket.on("end", () => {
    addLog(log, "TCP 접속이 종료되었습니다");
    btn.innerHTML = "접속";
  });

  socket.on("error", (error) => {
    socket.destroy();

    addLog(log, `TCP 에러. ${error.message}`);
    btn.innerHTML = "접속";
  });

  socket.connect({ host: host.value, port: port.value });
};

const closeConnection = (parameters) => {
  const { btn, log } = parameters;
  let { socket } = parameters;

  if (socket) {
    socket.destroy();
  }

  console.log("closeConnection");

  addLog(log, "TCP 접속이 종료되었습니다");

  btn.innerHTML = "접속";
};

document.getElementById("btnAddModbusTcpMasterSession").addEventListener("click", makeSession);
