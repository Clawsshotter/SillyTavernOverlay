const { spawn } = require('child_process');
const path = require('path');
const { broadcastToBrowser } = require('./websocket');

let pythonProcess = null;

function startAudioEngine() {
    console.log("Starting Audio Engine...");
    
    // path to the python script
    const scriptPath = path.join(__dirname, '..', 'audio-engine', 'engine.py');
    
    pythonProcess = spawn('python', ['-u', scriptPath], {
        stdio: ['ignore', 'pipe', 'ignore'], 
        windowsHide: true 
    });

    pythonProcess.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
            if (!line.trim()) return;
            try {
                const json = JSON.parse(line.trim());
                
                if (json.type === 'transcription') {
                    console.log(`Transcribed: ${json.text}`);
                    broadcastToBrowser({
                        type: 'STT_RESULT',
                        text: json.text
                    });
                } else if (json.type === 'log') {
                    console.log(`[AudioEngine] ${json.content}`);
                }
            } catch (e) {
                // ignore parse errors from raw python output
            }
        });
    });

    pythonProcess.on('close', (code) => {
        console.log(`Audio engine exited with code ${code}`);
    });
}

function killAudioEngine() {
    if (pythonProcess) {
        pythonProcess.kill();
    }
}

module.exports = {
    startAudioEngine,
    killAudioEngine
};