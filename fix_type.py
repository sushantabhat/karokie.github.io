import sys

with open('/Users/sushant/Documents/karokie_session/src/components/VoiceChangerTool.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'applyEffectToNode = async (\n    ctx: AudioContext,',
    'applyEffectToNode = async (\n    ctx: BaseAudioContext,'
)

with open('/Users/sushant/Documents/karokie_session/src/components/VoiceChangerTool.tsx', 'w') as f:
    f.write(content)

