const { ipcRenderer } = require("electron");
const net = require("net");
const Modbus = require("jsmodbus");
const hex = require("hexer");
const { addLog } = require("./common");

const hexOption = { divide: "|", headSep: "|" };

const link = document.querySelector("#import-tcp-slave-session");
let template = link.import.querySelector(".add-template");
let clone = document.importNode(template.content, true);
document.querySelector(".make-tcp-session").appendChild(clone);

const makeSession = () => {
  let template = link.import.querySelector(".session-template");
  let clone = document.importNode(template.content, true);

  const localPortNumber = clone.getElementById("localPortNubmer");
  const btn = clone.getElementById("btnConnect");

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

  const param = { localPortNumber, serverSocket: null, clientSocket: null, modbus: null, btn, log };

  btnClearLog.addEventListener("click", (event) => {
    log.innerHTML = "";
  });

  clone.getElementById("btnConnect").addEventListener("click", (event) => {
    connect(param);
  });

  clone.getElementById("btnDeleteModbusTcpSlaveSession").addEventListener("click", (event) => {
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
  const { log, host, localPortNumber, btn } = parameters;
  let { serverSocket, clientSocket, modbus } = parameters;

  if (serverSocket !== null) {
    serverSocket.close();
    serverSocket = null;
  }

  if (clientSocket !== null) {
    clientSocket.destroy();
    clientSocket = null;
  }

  if (modbus !== null) {
    modbus = null;
  }

  serverSocket = new net.Server();
  parameters.serverSocket = serverSocket;
  parameters.modbus = new Modbus.server.TCP(serverSocket);

  //------------------------------------------------------
  parameters.modbus.on("postReadCoils", (request, cb) => {
    addLog(log, `${request.name} UNIT ID ${request.unitId}`);
  });
  parameters.modbus.on("postReadDiscreteInputs", (request, cb) => {
    addLog(log, `${request.name} UNIT ID ${request.unitId}`);
  });
  parameters.modbus.on("postReadHoldingRegisters", (request, cb) => {
    addLog(log, `${request.name} UNIT ID ${request.unitId}`);
  });
  parameters.modbus.on("postReadInputRegisters", (request, cb) => {
    addLog(log, `${request.name} UNIT ID ${request.unitId}`);
  });
  parameters.modbus.on("postWriteSingleCoil", (request, cb) => {
    addLog(log, `${request.name} UNIT ID ${request.unitId}`);
  });
  parameters.modbus.on("postWriteSingleRegister", (request, cb) => {
    if (!(request instanceof Buffer)) {
      addLog(log, `${request.name} UNIT ID ${request.unitId}`);
    }
  });
  parameters.modbus.on("postWriteMultipleCoils", (request, cb) => {
    if (!(request instanceof Buffer)) {
      addLog(log, `${request.name} UNIT ID ${request.unitId}`);
    }
  });
  parameters.modbus.on("postWriteMultipleRegisters", (request, cb) => {
    if (!(request instanceof Buffer)) {
      addLog(log, `${request.name} UNIT ID ${request.unitId}`);
    }
  });
  //------------------------------------------------------

  serverSocket.on("close", (what) => {
    addLog(log, "TCP 접속이 종료되었습니다");
    btn.innerHTML = "접속";
  });

  serverSocket.on("error", (error) => {
    serverSocket.close();
    if (parameters.clientSocket) {
      parameters.clientSocket.destroy();
    }
    addLog(log, `TCP 에러. ${error.message}`);
    btn.innerHTML = "접속";
  });

  serverSocket.on("connection", (socket) => {
    parameters.clientSocket = socket;
    const { remoteAddress, remotePort } = socket;

    addLog(log, `접속완료. ${remoteAddress}:${remotePort}`);

    socket.on("end", () => {
      addLog(log, `접속 종료. ${remoteAddress}:${remotePort}`);
    });
  });

  serverSocket.on("listening", (what) => {
    addLog(log, `Listening on ${localPortNumber.value}`);
    btn.innerHTML = "접속종료";
  });

  serverSocket.listen({ host: "0.0.0.0", port: localPortNumber.value, backlog: 1, exclusive: true });
};

const closeConnection = (parameters) => {
  const { btn, log } = parameters;
  let { serverSocket, clientSocket } = parameters;

  if (clientSocket) {
    clientSocket.destroy();
  }

  if (serverSocket) {
    serverSocket.close();
  }
};

document.getElementById("btnAddModbusTcpSlaveSession").addEventListener("click", makeSession);
