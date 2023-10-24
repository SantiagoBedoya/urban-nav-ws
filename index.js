const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
require("dotenv").config();

app.use(express.json());

let connections = {};

io.on("connection", (socket) => {
  console.log("Client connected: ", socket.id);
  const userId = socket.handshake.headers.userid;
  connections[userId] = socket.id;

  socket.on('disconnect', (reason) => {
    delete connections[userId]
    console.log('available connections', connections)
  })
});

app.post("/send-notification", (req, res) => {
  const body = req.body;
  io.to(connections[body.userId]).emit("notifications", body.message);
  return res.sendStatus(200);
});

const srv = server.listen(process.env.PORT, () => {
  console.log("Server on port:", process.env.PORT);
});

process.on("SIGINT", () => {
  io.close();
  console.log("Shutting down...");
  srv.close((err) => {
    if (err) {
      console.log("Error:", err);
      process.exit(1);
    }
  });
});
