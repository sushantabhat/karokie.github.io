import sys

# 1. Patch VoiceChangerTool.tsx
with open('/Users/sushant/Documents/karokie_session/src/components/VoiceChangerTool.tsx', 'r') as f:
    vc = f.read()

vc = vc.replace(
    'alert("Microphone access is required to use the Voice Changer.");',
    'alert("Microphone access is blocked!\\n\\nTo fix on iPhone/Safari:\\n1. Tap the \'aA\' icon in the web address bar.\\n2. Tap \'Website Settings\'.\\n3. Set Microphone to \'Allow\'.\\n4. Refresh the page.");'
)

with open('/Users/sushant/Documents/karokie_session/src/components/VoiceChangerTool.tsx', 'w') as f:
    f.write(vc)

# 2. Patch useAudioRecorder.ts
with open('/Users/sushant/Documents/karokie_session/src/hooks/useAudioRecorder.ts', 'r') as f:
    ar = f.read()

ar = ar.replace(
    "console.error('Failed to access microphone', err);",
    "console.error('Failed to access microphone', err);\n      alert(\"Microphone access is blocked!\\n\\nTo fix on iPhone/Safari:\\n1. Tap the 'aA' icon in the web address bar.\\n2. Tap 'Website Settings'.\\n3. Set Microphone to 'Allow'.\\n4. Refresh the page.\");"
)

with open('/Users/sushant/Documents/karokie_session/src/hooks/useAudioRecorder.ts', 'w') as f:
    f.write(ar)

