import sys

with open('/Users/sushant/Documents/karokie_session/src/hooks/useAudioRecorder.ts', 'r') as f:
    content = f.read()

# Add micError state
content = content.replace(
    'const [isPaused, setIsPaused] = useState(false);',
    'const [isPaused, setIsPaused] = useState(false);\n  const [micError, setMicError] = useState<string | null>(null);'
)

# Remove the alerts and setMicError instead
content = content.replace(
    '''      console.error('Failed to access microphone', err);\n      alert("Microphone access is blocked!\\n\\nTo fix on iPhone/Safari:\\n1. Tap the 'aA' icon in the web address bar.\\n2. Tap 'Website Settings'.\\n3. Set Microphone to 'Allow'.\\n4. Refresh the page.");''',
    '''      console.error('Failed to access microphone', err);
      setMicError("Microphone access is blocked!\\n\\nTo fix on iPhone/Safari:\\n1. Tap the 'aA' icon in the web address bar.\\n2. Tap 'Website Settings'.\\n3. Set Microphone to 'Allow'.\\n4. Refresh the page.");'''
)

# Return micError
content = content.replace(
    'isPaused,',
    'isPaused,\n    micError,'
)

with open('/Users/sushant/Documents/karokie_session/src/hooks/useAudioRecorder.ts', 'w') as f:
    f.write(content)

