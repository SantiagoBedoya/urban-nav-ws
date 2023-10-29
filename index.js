const express = require("express");
const axios = require('axios').default
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: '*',
    methods: '*'
  }
});
require("dotenv").config();

app.use(express.json());

let connections = {}

io.on("connection", (socket) => {
  console.log("Client connected: ", socket.id);
  const userId = socket.handshake.headers.userid;
  const token = socket.handshake.headers.token;

  console.log({userId, token})

  connections[userId] = socket.id;

  socket.on('accept-trip', async (data) => {
    try {
      await axios.get(process.env.BE_URL + `/trips/${data.tripId}/driver-accept`, {
        headers: {
          Authorization: 'Bearer ' + token
        }
      })
    }catch(err) {
      console.log(err)
    }
  })

  socket.on('disconnect', () => {
    delete connections[userId]
    console.log('available connections', connections)
  })
});

app.post("/send-notification", (req, res) => {
  const {recipients, data} = req.body;
  recipients.forEach(recipient => {
    console.log(connections[recipient])
    io.to(connections[recipient]).emit("notifications", data);
  });
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
