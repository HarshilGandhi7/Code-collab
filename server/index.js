require('dotenv').config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

app.use(express.json());

const server = http.createServer(app);

const corsOrigin = process.env.CLIENT_URL || "*";

app.use(
  cors({
    origin: corsOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.send("Socket.io server for Code Collab is running");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date()
  });
});

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const rooms = new Map();
const roomLanguages = new Map();
const roomCodes = new Map();

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  
  socket.on("join-room", ({ roomId, username }, callback) => {
    socket.join(roomId);
    socket.data = { roomId, username };
    if (!rooms.has(roomId)) {
      roomLanguages.set(roomId, "javascript");
      rooms.set(roomId, new Set());
      roomCodes.set(roomId, "");
    }
    rooms.get(roomId).add(username);
    const roomUsers = Array.from(rooms.get(roomId));
    io.to(roomId).emit("user-joined", {
      username,
      language: roomLanguages.get(roomId),
      code: roomCodes.get(roomId),
    });
    io.to(roomId).emit("room-users", roomUsers);
    if (callback) callback();
  });

  socket.on("user-left", ({ roomId, username }) => {
    console.log(`User ${username} left room ${roomId}`);
    if (!rooms.has(roomId)) {
      return;
    }
    const roomUsers = rooms.get(roomId);
    roomUsers.delete(username);
    const updatedUsers = Array.from(roomUsers);
    if (updatedUsers.length === 0) {
      rooms.delete(roomId);
    } else {
      socket.to(roomId).emit("user-left", { username });
      io.to(roomId).emit("room-users", updatedUsers);
    }
    socket.leave(roomId);
  });

  socket.on("language-update", ({ roomId, language }) => {
    socket.to(roomId).emit("language-update", { language });
    roomLanguages.set(roomId, language);
  });

  socket.on("code-update", ({ roomId, code }) => {
    socket.to(roomId).emit("code-update", { code });
    roomCodes.set(roomId, code);
  });

  socket.on("send-message",({roomId,message,username})=>{
    socket.to(roomId).emit("receive-message",{message,username});
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);

    const { roomId, username } = socket.data || {};

    if (roomId && username) {
      console.log(`User ${username} disconnected from room ${roomId}`);

      if (rooms.has(roomId)) {
        const roomUsers = rooms.get(roomId);

        roomUsers.delete(username);

        const updatedUsers = Array.from(roomUsers);
        console.log(`Current users in room ${roomId}:`, updatedUsers);

        if (updatedUsers.length === 0) {
          console.log(`Room ${roomId} is now empty, removing it`);
          rooms.delete(roomId);
        } else {
          socket.to(roomId).emit("user-left", { username });
          io.to(roomId).emit("room-users", updatedUsers);
        }
      }
    }
  });

  socket.on("cursor-update", ({ roomId, username, line, column }) => {
    socket.to(roomId).emit("cursor-update", { username, line, column });
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Socket.io server listening on port: ${PORT}`);
});