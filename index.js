
require("dotenv").config();
const AppServer = require("./AppServer");

// Inisialisasi server dengan port dari environment, atau default 3000
const PORT = process.env.PORT; 
const appInstance = new AppServer(PORT);

// Jalankan server
appInstance.start();