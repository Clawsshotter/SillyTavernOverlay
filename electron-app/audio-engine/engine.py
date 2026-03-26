import sys
import json
import io
import speech_recognition as sr
import pyaudio
from faster_whisper import WhisperModel

# config
MIC_INDEX = 2
IGNORED_PHRASES = {
    "you", "thank you", "thanks", "bye", "goodbye", 
    "subtitle by", "amara.org", "subtitles"
}

def log(msg):
    print(json.dumps({"type": "log", "content": msg}), flush=True)

def print_mic_info():
    """Prints all available mics and identifies the active one"""
    mics = sr.Microphone.list_microphone_names()
    log("--- AVAILABLE MICROPHONES ---")
    for i, name in enumerate(mics):
        log(f"[{i}] {name}")
    log("-----------------------------")
    
    if MIC_INDEX is None:
        try:
            p = pyaudio.PyAudio()
            info = p.get_default_input_device_info()
            p.terminate()
            log(f"==> ACTIVE MIC: System Default -> {info.get('name')}")
        except Exception:
            log("==> ACTIVE MIC: System Default (Could not fetch name)")
    else:
        try:
            log(f"==> ACTIVE MIC: Index {MIC_INDEX} -> {mics[MIC_INDEX]}")
        except IndexError:
            log(f"==> ACTIVE MIC: ERROR! Index {MIC_INDEX} does not exist.")

def main():
    log("Initializing Whisper Model (small.en)...")
    model = WhisperModel("small.en", device="cpu", compute_type="int8")
    
    # run the mic diagnostics
    print_mic_info()
    
    recognizer = sr.Recognizer()
    recognizer.dynamic_energy_threshold = False
    recognizer.energy_threshold = 1000  
    recognizer.pause_threshold = 1.5 

    log("Model loaded. Listening...")
    print(json.dumps({"type": "status", "content": "ready"}), flush=True)

    with sr.Microphone(device_index=MIC_INDEX) as source:
        
        # diagnostic check
        log("Testing ambient noise level for 1 second...")
        recognizer.adjust_for_ambient_noise(source, duration=1)
        ambient_noise_level = recognizer.energy_threshold
        
        # immediately reset it
        recognizer.energy_threshold = 1000
        log(f"Room noise level is: {ambient_noise_level:.2f}. Forced threshold locked at: 1000.")
        if ambient_noise_level > 1000:
            log("WARNING: Your room noise is higher than 1000! The mic will never detect silence.")
        # ------------------------

        while True:
            try:
                audio_data = recognizer.listen(source, timeout=None)
                wav_data = io.BytesIO(audio_data.get_wav_data())
                
                segments, info = model.transcribe(
                    wav_data, 
                    beam_size=5, 
                    language="en",
                    condition_on_previous_text=False,
                    vad_filter=True,
                    vad_parameters=dict(min_silence_duration_ms=500)
                )

                full_text = "".join([segment.text for segment in segments]).strip()
                clean_text = full_text.lower().replace(".", "").replace("?", "").replace("!", "").strip()
                
                if not clean_text or clean_text in IGNORED_PHRASES:
                    continue

                output = {
                    "type": "transcription",
                    "text": full_text
                }
                print(json.dumps(output), flush=True)

            except sr.WaitTimeoutError:
                pass
            except Exception as e:
                log(f"Error: {str(e)}")

if __name__ == "__main__":
    main()