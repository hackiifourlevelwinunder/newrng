import express from "express";
import http from "http";
import { Server } from "socket.io";
import crypto from "crypto";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let currentNumber = null;
let nextNumber = generateSecureNumber();

let lastSecond = -1;

// ✅ Secure RNG (OpenSSL RAND_bytes)
function generateSecureNumber() {
  const buf = crypto.randomBytes(1);
  return buf[0] % 10; // 0–9
}

function scheduler() {
  const now = new Date();
  const sec = now.getSeconds();

  // Prevent skip: only act when sec actually changes
  if (sec === lastSecond) return;
  lastSecond = sec;

  // :00 → Final
  if (sec === 0) {
    currentNumber = nextNumber;
    io.emit("reveal", currentNumber);
    console.log("✅ Final:", currentNumber);

    // अगली बार के लिए नया number तैयार करो
    nextNumber = generateSecureNumber();
  }

  // :20 → Preview
  if (sec === 20) {
    io.emit("preview", nextNumber);
    console.log("⏳ Preview:", nextNumber);
  }
}

setInterval(scheduler, 200); // हर 0.2 सेकंड चेक → कोई skip नहीं

io.on("connection", (socket) => {
  console.log("🔗 User connected");
  if (currentNumber !== null) {
    socket.emit("reveal", currentNumber);
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
