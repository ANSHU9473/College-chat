const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const Message = require("./models/Message");
const signupRoute = require("./routes/Signup");
const loginRoute = require("./routes/Login");
const cors = require("cors");
const app = express();
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:3001"], credentials: true }));
app.use(express.json());
app.use("/signup", signupRoute);
app.use("/login", loginRoute);
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3001", "http://localhost:5173"],
    methods: ["GET", "POST"]
  }
});

// ---------------- MongoDB Connect ----------------
mongoose.connect("mongodb://127.0.0.1:27017/collegeChat", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => console.log("❌ MongoDB error:", err));



// ---------------- Signup Route ----------------
app.use("/signup", signupRoute);

// ---------------- API to fetch messages ----------------
app.get("/messages/:sender/:receiver", async (req, res) => {
  try {
    const { sender, receiver } = req.params;
    const messages = await Message.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender }
      ]
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Error fetching messages" });
  }
});

// ---------------- Anonymous Chat Setup ----------------
let waitingUsers = []; // Users waiting for anonymous chat
let activeChats = {};  // roomId -> { user1, user2 }

// ---------------- Socket.IO ----------------
io.on("connection", (socket) => {
  console.log("⚡ New user connected:", socket.id);

  // ---- Normal chat ----
  socket.on("sendMessage", async (data) => {
    try {
      const newMessage = new Message({
        sender: data.sender,
        receiver: data.receiver,
        collegeEmail: data.collegeEmail,
        text: data.text,
      });

      await newMessage.save();
      io.emit("receiveMessage", newMessage);
    } catch (err) {
      console.error("❌ Error saving message:", err);
    }
  });

  // ---- Anonymous chat ----
  socket.on("joinAnonymousChat", () => {
    if (waitingUsers.length > 0) {
      const partnerSocket = waitingUsers.shift();
      const roomId = `room-${socket.id}-${partnerSocket.id}`;

      // Join both sockets to the same room
      socket.join(roomId);
      partnerSocket.join(roomId);

      activeChats[roomId] = { user1: socket.id, user2: partnerSocket.id };

      // Notify both users
      io.to(roomId).emit("chatStarted", { roomId });
    } else {
      waitingUsers.push(socket);
      socket.emit("waitingForPartner");
    }
  });

  socket.on("sendAnonymousMessage", ({ roomId, text }) => {
    io.to(roomId).emit("receiveAnonymousMessage", { text, sender: socket.id });
    // Optional: store in MongoDB if desired
    // const newMessage = new Message({ sender: socket.id, receiver: "anonymous", text });
    // await newMessage.save();
  });

  // ---- Disconnect ----
  socket.on("disconnect", () => {
    // Remove from waiting pool if present
    waitingUsers = waitingUsers.filter(s => s.id !== socket.id);

    // Notify partner if in active chat
    for (const roomId in activeChats) {
      if (activeChats[roomId].user1 === socket.id || activeChats[roomId].user2 === socket.id) {
        socket.to(roomId).emit("partnerDisconnected");
        delete activeChats[roomId];
      }
    }

    console.log("❌ User disconnected:", socket.id);
  });
});

// ---------------- Start Server ----------------
server.listen(5000, () => console.log("🚀 Server running on port 5000"));
