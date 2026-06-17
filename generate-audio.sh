#!/usr/bin/env bash
# Generates the voiceover for the Windsor soccer tactical video via ElevenLabs.
# Usage: ELEVENLABS_API_KEY=your_key ./generate-audio.sh
# Voice: Adam (pNInz6obpgDQGcFmaJgB), eleven_turbo_v2_5

set -e

VOICE_ID="pNInz6obpgDQGcFmaJgB"
API_KEY="${ELEVENLABS_API_KEY}"

if [ -z "$API_KEY" ]; then
  echo "ERROR: Set ELEVENLABS_API_KEY env var first."
  echo ""
  echo "=== VOICEOVER SCRIPT (record manually if needed) ==="
  echo "Beat 1 (0–2.5s):   Their left back has a habit. Watch what he does."
  echo "Beat 2 (2.5–7s):   Every time the ball switches to the far side, red three steps up — leaving a gap in behind."
  echo "Beat 3 (7–11s):    They reset. Now watch what happens when we win it."
  echo "Beat 4 (11–15s):   Six gets it in midfield. Red three is already high. That space is open."
  echo "Beat 5 (15–17s):   Two and nine — get in there."
  echo "Beat 6 (17–19s):   Six plays it into the channel."
  echo "Beat 7 (19–21s):   Two versus one in behind. We're in."
  echo "Beat 8 (21–22s):   Wingback, striker, six — when their left back steps up, attack that space."
  exit 1
fi

SCRIPT="Their left back has a habit. Watch what he does. Every time the ball switches to the far side, red three steps up to the halfway line — leaving a huge gap in behind. They reset. Now watch what happens when we win it. Six gets it in midfield. Red three is already high. That space is open. Two and nine — get in there. Six plays it into the channel. Two versus one in behind. We're in. Wingback, striker, six — when their left back steps up, attack that space."

echo "Generating voiceover..."
curl -s -X POST "https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}" \
  -H "xi-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"text\": \"${SCRIPT}\",
    \"model_id\": \"eleven_turbo_v2_5\",
    \"voice_settings\": {
      \"stability\": 0.65,
      \"similarity_boost\": 0.75,
      \"style\": 0.1,
      \"speed\": 0.92
    }
  }" \
  --output public/voiceover.mp3

echo "Saved to public/voiceover.mp3"
