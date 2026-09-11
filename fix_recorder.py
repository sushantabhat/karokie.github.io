import sys

with open('/Users/sushant/Documents/karokie_session/src/hooks/useAudioRecorder.ts', 'r') as f:
    content = f.read()

content = content.replace('const [isPaused, \n    micError, setIsPaused] = useState(false);', 'const [isPaused, setIsPaused] = useState(false);')

with open('/Users/sushant/Documents/karokie_session/src/hooks/useAudioRecorder.ts', 'w') as f:
    f.write(content)

