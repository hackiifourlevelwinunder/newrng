import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// serve static frontend
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// RNG function using OpenSSL RAND_bytes
function generateDigit() {
  const buf = crypto.randomBytes(1);
  return buf[0] % 10; // 0-9 digit
}

let nextDigit = null;

// schedule every minute
function scheduleDigit() {
  const now = new Date();
  const msToNextMinute = 60000 - (now.getSeconds() * 1000 + now.getMilliseconds());

  setTimeout(() => {
    nextDigit = generateDigit();

    // send preview 40s before reveal
    setTimeout(() => {
      io.emit("preview", { digit: nextDigit });
    }, 20000); // 60s - 40s = 20s

    // send reveal at exact minute
    setTimeout(() => {
      io.emit("reveal", { digit: nextDigit });
      scheduleDigit();
    }, 60000);
  }, msToNextMinute);
}

scheduleDigit();

io.on("connection", (socket) => {
  console.log("Client connected");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
