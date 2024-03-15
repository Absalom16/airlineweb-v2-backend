const WebSocket = require("ws");
const fs = require("fs");

const wss = new WebSocket.Server({ port: 8080 });

//watch for changes to db.json and send updates to connected clients
fs.watch("db.json", (eventType, filename) => {
  if (eventType == "rename") {
    wss.clients.forEach((client) => {
      if (client.readyState == WebSocket.OPEN) {
        client.send("db_change");
      }
    });
  }
});

//handle websocket connections
wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    console.log(`Received message: ${message}`);
  });

  ws.send("connected");
});
