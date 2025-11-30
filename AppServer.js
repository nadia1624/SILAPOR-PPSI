const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const morgan = require("morgan");
const http = require("http");
const socketIO = require("socket.io");
const livereload = require("livereload");
const connectLivereload = require("connect-livereload");

class AppServer {
    constructor(port) {
        this.app = express();
        this.port = port || 3000;
        this.server = http.createServer(this.app);
        this.io = socketIO(this.server);
        
        this.#setupLivereload();
        this.#setupMiddleware();
        this.#setupViewEngine();
        this.#setupRoutes();
        this.#setupSocketIO();
        this.#setupErrorHandling();
    }

    #setupLivereload() {
        if (process.env.NODE_ENV !== "production") {
            const liveReloadServer = livereload.createServer();
            liveReloadServer.watch([
                path.join(__dirname, "public"),
                path.join(__dirname, "views"),
            ]);
            
            liveReloadServer.server.once("connection", () => {
                setTimeout(() => {
                    liveReloadServer.refresh("/");
                }, 100);
            });
            
            this.app.use(connectLivereload());
        }
    }

    #setupMiddleware() {
        this.app.use(morgan("dev"));
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(cookieParser());
        this.app.use(
            session({
                secret: process.env.SESSION_SECRET || "silapor-secret-key",
                resave: false,
                saveUninitialized: false,
                cookie: {
                    secure: process.env.NODE_ENV === "production",
                    httpOnly: true,
                    maxAge: 1000 * 60 * 60 * 24, // 24 hours
                },
            })
        );
        
        // Static files
        this.app.use(express.static(path.join(__dirname, "public")));
        this.app.use("/uploads", express.static(path.join(__dirname, "uploads")));
    }

    #setupViewEngine() {
        this.app.set("view engine", "ejs");
        this.app.set("views", path.join(__dirname, "views"));
    }

    #setupRoutes() {
        const authRoute = require("./routes/authRoute");
        const mahasiswaRoute = require("./routes/mahasiswaRoute");
        const adminRoute = require("./routes/adminRoute");
        
        this.app.use("/", authRoute);
        this.app.use("/mahasiswa", mahasiswaRoute);
        this.app.use("/admin", adminRoute);
    }

    #setupSocketIO() {
        this.io.on("connection", (socket) => {
            console.log("User connected:", socket.id);
            
            socket.on("disconnect", () => {
                console.log("User disconnected:", socket.id);
            });
            
            socket.on("newReport", (data) => {
                this.io.emit("reportNotification", data);
            });
            
            socket.on("statusUpdate", (data) => {
                this.io.emit("statusChange", data);
            });
        });
        
        // Make io accessible to routes
        this.app.set("io", this.io);
    }

    #setupErrorHandling() {
        // 404 Handler
        this.app.use((req, res) => {
            res.status(404).render("error", {
                title: "404 - Halaman Tidak Ditemukan",
                message: "Halaman yang Anda cari tidak ditemukan.",
                error: { status: 404 },
            });
        });
        
        // Error Handler
        this.app.use((err, req, res, next) => {
            console.error("Error:", err);
            res.status(err.status || 500).render("error", {
                title: "Error",
                message: err.message || "Terjadi kesalahan pada server.",
                error: process.env.NODE_ENV === "development" ? err : {},
            });
        });
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`\n🚀 Server SILAPOR running on http://localhost:${this.port}`);
            console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
            console.log(`🔥 Livereload: ${process.env.NODE_ENV !== "production" ? "enabled" : "disabled"}`);
        });
    }

    getApp() {
        return this.app;
    }

    getServer() {
        return this.server;
    }

    getIO() {
        return this.io;
    }
}

module.exports = AppServer;
