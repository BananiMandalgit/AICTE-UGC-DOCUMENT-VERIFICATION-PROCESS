require('dotenv').config(); // Load environment variables from .env file

const express = require("express");
const http = require("http");
//const WebSocket = require("ws");
const cors = require("cors");
const path = require("path");
const prisma = require("./utils/db");

const app = express();
const port = 3100;
const { evaluatorRouter } = require("./routes/evaluator/index"); 
const { InstitueAuth: instituteAuthRouter } = require("./routes/institute/auth");

const InstituteRouter = require("./routes/institute");
const InstitutionsRouter = require("./routes/institutions");
const PlacementRouter = require("./routes/placements");
const { adminRouter } = require("./routes/admin");
const FeedbackRouter = require("./routes/feedback");

app.use(express.json());

// Debug logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5176"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Add CORS headers for static files
app.use("/uploads", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET");
  next();
});

app.use("/documents", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET");
  next();
});

// Serve uploaded files so the frontend can download/view them
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));
app.use("/documents", express.static(path.join(__dirname, "../public/documents")));

// Minimal OTP endpoint returning success JSON
app.post("/api/send-otp", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required." });
  }
  return res.status(200).json({
    success: true,
    message: "OTP sent successfully.",
    otp: "123456"
  });
});

// Mount the institute router at /api/institute
app.use("/api/institute", InstituteRouter);
app.use("/api/institute/auth", instituteAuthRouter);
app.use("/api/institutions", InstitutionsRouter);
app.use("/api/placements", PlacementRouter);
app.use("/api/admin", adminRouter);
app.use("/api/feedback", FeedbackRouter);

app.use("/evaluator", evaluatorRouter);
app.use("/api/evaluator", evaluatorRouter);

// DEV ONLY: list evaluators without passwords
app.get("/api/debug/evaluators", async (req, res) => {
  try {
    const evaluators = await prisma.evaluator.findMany({
      select: {
        evaluator_id: true,
        email: true,
        role: true,
      },
      orderBy: { email: "asc" },
    });
    res.status(200).json({ success: true, data: evaluators });
  } catch (error) {
    console.error("/api/debug/evaluators error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch evaluators" });
  }
});
// Base route for health check
app.get("/", (req, res) => {
  res.send("API is running");
});

// 404 handler - log all unmatched requests
app.use((req, res) => {
  console.log(`[404] ${req.method} ${req.originalUrl} - No handler found`);
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
    method: req.method
  });
});

// Existing WebSocket /chatbot logic unchanged
// const server = http.createServer(app);
// const wss = new WebSocket.Server({ noServer: true });

// wss.on("connection", (ws) => {
//   console.log("Client connected to /chatbot");
//   ws.send("Welcome! How can I help you?");
//   ws.on("message", (message) => {
//     ws.send(`Echo: ${message.toString()}`);
//   });
//   ws.on("close", () => {
//     console.log("Client disconnected");
//   });
// });

// server.on("upgrade", function upgrade(request, socket, head) {
//   const pathname = new URL(request.url, 'http://' + request.headers.host).pathname;
//   if (pathname === "/chatbot") {
//     wss.handleUpgrade(request, socket, head, (ws) => {
//       wss.emit("connection", ws, request);
//     });
//   } else {
//     socket.destroy();
//   }
// });

// server.listen(port, () => 
app.listen(port, () =>{
  //console.log(`Server listening on port ${port}`);
  console.log(`Server listening on port ${port} (WebSockets Disabled)`)
});
