# SillyTavern Voice & Overlay Connector

An experimental/minimalist speech-to-text (STT) and visual overlay system for SillyTavern. 

Allows you to speak naturally into your microphone to chat with your characters, automatically sends your messages, and displays the character's responses on a transparent, click-through desktop overlay.

This is my first small/medium-scale project and is entirely maintained by me. Don't expect much activity.

## What Does It Do?

* Uses `faster-whisper` (OpenAI's Whisper optimized for CPU/GPU). No cloud APIs.
* Uses Voice Activity Detection so it only listens when you actually speak.
* Automatically triggers SillyTavern message generation.
* Displays responses dynamically on your screen with a shrink-to-fit text engine.
* Bypasses heavy Chrome Native Messaging in favor of a local WebSocket server.

---

## What Do I Need?

Alongside SillyTavern, ensure you have installed:
1. [Node.js](https://nodejs.org/) (For the Electron App)
2. [Python 3.10 or 3.11](https://www.python.org/downloads/) (For the AI Audio Engine)

Use Google Chrome or a Chromium-based browser (For the extension).

---

## How To Set Up?

### Step 1: Install the Browser Extension
1. Open Chrome and navigate to `chrome://extensions/`.
2. Turn on **Developer mode** (top right corner).
3. Click **Load unpacked** (top left corner).
4. Select the `browser-extension` folder inside this repository.

### Step 2: Setup the Python Audio Engine
We need to install the AI models and audio dependencies. It is highly recommended to use a virtual environment.
1. Open a terminal and navigate to the `electron-app/audio-engine` folder.
2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   * **Windows:** `venv\Scripts\activate`
   * **Mac/Linux:** `source venv/bin/activate`
4. Install the requirements:
   ```bash
   pip install -r requirements.txt
   ```
*(Note: Windows users may need to install PyAudio manually if the requirements fail. Run `pip install pipwin` then `pipwin install pyaudio`.)*

### Step 3: Setup the Electron App
1. Navigate to the `electron-app` folder.
2. Install the Node dependencies:
   ```bash
   npm install
   ```

---

## How To Use?

1. Double-click the `start.bat` file located inside the `electron-app` folder (or run `npm start` in your terminal).
2. The transparent overlay will appear at the bottom of your primary monitor.
3. Open or refresh your SillyTavern tab in Chrome.
4. Check your Chrome Developer Console (F12) to ensure it says `[SillyTavern Overlay Injector] Connected to Electron App.`
5. Start talking.

### Configuration & Tuning
If Whisper isn't picking up your voice, or isn't stopping when you finish speaking, you need to configure your microphone.

1. Look at the console output when you run the app. It will list all available microphones by an `Index` number.
2. Open `electron-app/audio-engine/engine.py`.
3. Change `MIC_INDEX = None` to the number of your preferred microphone (e.g., `MIC_INDEX = 2`).
   * *Tip: Use a noise-cancelling microhphone if your hardware can support it.*
4. Adjust `pause_threshold = 1.5` in `engine.py` to change how long the app waits after you stop speaking before it auto-sends the message to SillyTavern.