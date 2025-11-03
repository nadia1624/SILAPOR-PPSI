// AppServer.js

const express = require("express");
const http = require("http");
const path = require("path");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");

// Import Routes
const authRoutes = require("./routes/auth");
const mahasiswaRoutes = require("./routes/mahasiswaRoutes");
const adminRoutes = require("./routes/adminRoute");

class AppServer {
  constructor(port = process.env.PORT || 3000) {
    // 1. Inisialisasi properti
    this.port = port;
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new Server(this.server);

    // 2. Memanggil metode konfigurasi
    this.configMiddleware();
    this.configViewEngine();
    this.configSocketIO();
    this.configRoutes();
  }

  // Metode untuk konfigurasi Middleware
  configMiddleware() {
    this.app.use(morgan("dev"));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());
    
    // Konfigurasi file statis (public dan uploads)
    this.app.use(express.static(path.join(__dirname, "public")));
    this.app.use("/uploads", express.static(path.join(__dirname, "uploads")));
  }

  // Metode untuk konfigurasi View Engine
  configViewEngine() {
    this.app.set("view engine", "ejs");
    this.app.set("views", path.join(__dirname, "views"));
  }

  // Metode untuk konfigurasi Routes
  configRoutes() {
    // Menyimpan instance io ke app untuk diakses di route handlers jika diperlukan
    this.app.set("io", this.io);
    
    this.app.use("/", authRoutes);
    this.app.use("/mahasiswa", mahasiswaRoutes);
    this.app.use("/admin", adminRoutes);
  }
  

  configSocketIO() {
    this.io.on("connection", (socket) => {
      console.log("a user connected:", socket.id);

      socket.emit("notif", {
        title: "Welcome!",
        message: "Kamu berhasil terhubung ke server.",
      });

      socket.on("disconnect", () => {
        console.log("user disconnected:", socket.id);
      });
    });
  }

  // Metode untuk menjalankan server
  start() {
    this.server.listen(this.port, () =>
      console.log(`SILAPOR running at http://localhost:${this.port}`)
    );
  }
}

module.exports = AppServer;