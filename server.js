const express = require("express");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  pingTimeout: 60000,
});

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

const MESSAGES_FILE = path.join(__dirname, "messages.json");
const MAX_MESSAGES = 200;

// 读取消息文件
function readMessages() {
  try {
    if (!fs.existsSync(MESSAGES_FILE)) return [];
    const data = fs.readFileSync(MESSAGES_FILE, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

// 写入消息文件
function writeMessages(msgs) {
  try {
    // 只保留最近 MAX_MESSAGES 条
    if (msgs.length > MAX_MESSAGES) {
      msgs = msgs.slice(-MAX_MESSAGES);
    }
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(msgs, null, 2), "utf-8");
  } catch (e) {
    console.error("写入消息失败:", e);
  }
}

// 初始化文件
if (!fs.existsSync(MESSAGES_FILE)) {
  writeMessages([]);
}

// API: 获取所有消息
app.get("/api/messages", (req, res) => {
  const msgs = readMessages();
  res.json(msgs);
});

// API: 发送消息
app.post("/api/messages", (req, res) => {
  const msgs = readMessages();
  msgs.push(req.body);
  writeMessages(msgs);
  res.json({ ok: true });
});

// API: 清空消息（可选）
app.post("/api/clear", (req, res) => {
  writeMessages([]);
  io.emit("clear");
  res.json({ ok: true });
});

io.on("connection", (socket) => {
  console.log("用户连接:", socket.id);

  socket.on("join", (data) => {
    const { name, cryptoHash } = data;
    socket.userData = { name, room: "general", cryptoHash };
    socket.join("general");
    io.to("general").emit("system", {
      message: name + " 加入了聊天室",
      type: "system",
    });
  });

  socket.on("message", (data) => {
    const msg = {
      name: socket.userData.name,
      content: data.content,
      type: data.type || "text",
      timestamp: new Date().toISOString(),
    };
    // 写入文件
    const msgs = readMessages();
    msgs.push(msg);
    writeMessages(msgs);
    // 广播给所有在线用户
    io.to("general").emit("chat message", msg);
  });

  socket.on("disconnect", () => {
    if (socket.userData) {
      io.to("general").emit("system", {
        message: socket.userData.name + " 离开了聊天室",
        type: "system",
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("聊天服务运行在端口 " + PORT);
});
