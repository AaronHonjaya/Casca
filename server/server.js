const express = require('express');
const cors = require('cors');
const path = require('path');

const uploadRoutes = require('./routes/upload');
const analyzeRoutes = require('./routes/analyze');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Define routes
app.use('/upload', uploadRoutes);
app.use('/analyze', analyzeRoutes);

const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
const shutdown = () => {
    console.log("Shutting down server...");
    if (server) {
        server.close(() => {
            console.log("Server closed.");
            process.exit(0);
        });
    }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

module.exports = app;
