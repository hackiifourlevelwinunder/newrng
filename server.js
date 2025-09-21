import express from "express";
import http from "http";
import { Server } from "socket.io";
import crypto from "crypto";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let currentNumber = null;
let nextNumber = null;

// Secure RNG (OpenSSL RAND_bytes equivalent in Node.js)
function generateSecureNumber() {
  const buffer = crypto.randomBytes(1);
  return buffer[0] % 10; // 0-9
}

// Main scheduler
function scheduleNumbers() {
  const now = new Date();
  const seconds = now.getSeconds();

  // हर मिनट की शुरुआत में नया number बनाओ
  if (seconds === 0) {
    currentNumber = nextNumber !== null ? nextNumber : generateSecureNumber();
    nextNumber = generateSecureNumber();
    io.emit("reveal", currentNumber); // final reveal
    console.log("Reveal:", currentNumber);
  }

  // 40s पर next number का preview दिखाओ
  if (seconds === 40) {
    if (nextNumber === null) {
      nextNumber = generateSecureNumber();
    }
    io.emit("preview", nextNumber);
    console.log("Preview:", nextNumber);
  }
}

setInterval(scheduleNumbers, 1000);

io.on("connection", (socket) => {
  console.log("User connected");

  if (currentNumber !== null) {
    socket.emit("reveal", currentNumber);
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
