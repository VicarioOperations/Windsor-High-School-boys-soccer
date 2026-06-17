#!/usr/bin/env bash
# Generates voiceover for Windsor soccer tactical video.
# Voice: Liam (AZnzlk1XvdvUeBnXmlld) — upbeat, direct, serious
# Usage: ELEVENLABS_API_KEY=your_key ./generate-audio.sh

set -e

VOICE_ID="AZnzlk1XvdvUeBnXmlld"
API_KEY="${ELEVENLABS_API_KEY}"

if [ -z "$API_KEY" ]; then
  echo "ERROR: Set ELEVENLABS_API_KEY."
  exit 1
fi

echo "Generating voiceover (Liam)..."
python3 - <<'PYEOF'
import json, os, subprocess

script = """Their left back has a habit. Every time the ball goes to the far side, he steps up. He leaves the channel wide open.

Watch what we do with it. Six wins the ball in midfield. Their three is already high. That space is right there.

Two. Nine. Go. Attack the channel.

Six plays it in. Two versus one. We are in behind their defense.

Know your role. Wingback, run that channel. Striker, get in behind. Six, play the ball on time. The second their left back steps up, that is your trigger.

This is how we score."""

payload = {
    "text": script,
    "model_id": "eleven_turbo_v2_5",
    "voice_settings": {
        "stability": 0.42,
        "similarity_boost": 0.80,
        "style": 0.38,
        "speed": 1.0,
        "use_speaker_boost": True
    }
}

voice_id = "AZnzlk1XvdvUeBnXmlld"
api_key = os.environ["ELEVENLABS_API_KEY"]

cmd = [
    "curl", "-s", "-X", "POST",
    f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
    "-H", f"xi-api-key: {api_key}",
    "-H", "Content-Type: application/json",
    "-d", json.dumps(payload),
    "--output", "public/voiceover.mp3"
]
subprocess.run(cmd, check=True)
print("Saved to public/voiceover.mp3")
PYEOF
