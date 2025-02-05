const { spawn } = require("child_process");
require('dotenv').config();
 
let activePythonProcesses = []; // Track active processes

function runPythonScript(scriptPath, args = []) {
    return new Promise((resolve, reject) => {

        const pythonExecutable = process.env.PATH_TO_PYTHON_EXE; // Use python3 for Linux
        const pythonProcess = spawn(pythonExecutable, [scriptPath, ...args]);

        activePythonProcesses.push(pythonProcess); // Store process

        let conversions = "";
        let errorOutput = "";

        pythonProcess.stdout.on("data", (data) => {
            console.log("Python output", data.toString());
            conversions = JSON.parse(data.toString());
        });

        pythonProcess.stderr.on("data", (data) => {
            errorOutput += data.toString();
            console.log("Error", data.toString());

        });

        pythonProcess.on("close", (code) => {
            // Remove from active processes when finished
            activePythonProcesses = activePythonProcesses.filter(p => p !== pythonProcess);

            if (code === 0) {
                resolve(conversions);
            } else {
                reject(new Error(`Script exited with code ${code}: ${errorOutput}`));
            }
        });

        pythonProcess.on("error", (err) => {
            reject(err);
        });
    });
}

// Handle server shutdown properly
process.on("SIGINT", () => {
    console.log("Received SIGINT, shutting down...");

    activePythonProcesses.forEach(p => {
        console.log("Killing Python process...");
        p.kill("SIGINT"); // Send SIGINT to terminate process
    });

    process.exit(0);
});

process.on("SIGTERM", () => {
    console.log("Received SIGTERM, shutting down...");
    
    activePythonProcesses.forEach(p => {
        console.log("Killing Python process...");
        p.kill("SIGINT"); // Ensure Python processes exit
    });

    process.exit(0);
});

module.exports = { runPythonScript };
