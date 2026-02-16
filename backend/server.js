const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/leak', (req, res) => {
    // Uses absolute path logic to find the script
    const scriptPath = path.join(__dirname, 'scripts', 'model_predict.py');
    
    // On Windows, use 'python'. Ensure it is in your Environment Variables (PATH)
    const pythonProcess = spawn('python', [scriptPath]);

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error("Python Error:", errorString);
            return res.status(500).json({ error: "Model script failed", details: errorString });
        }
        try {
            const result = JSON.parse(dataString);
            res.json(result);
        } catch (e) {
            res.status(500).json({ error: "Parse Error", details: dataString });
        }
    });
});

// backend/server.js - Add this new endpoint
app.get('/api/optimization', (req, res) => {
    const scriptPath = path.join(__dirname, 'scripts', 'fuel_predict.py');
    const pythonProcess = spawn('python', [scriptPath]);

    let dataString = '';
    pythonProcess.stdout.on('data', (data) => { dataString += data.toString(); });

    pythonProcess.on('close', (code) => {
        try {
            const result = JSON.parse(dataString);
            res.json(result);
        } catch (e) {
            res.status(500).json({ error: "Parse Error", details: dataString });
        }
    });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`✅ Backend running at http://localhost:${PORT}`);
});