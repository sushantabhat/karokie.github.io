import sys

with open('/Users/sushant/Documents/karokie_session/src/components/KaraokeStudio.tsx', 'r') as f:
    content = f.read()

# 1. Update audioRef
content = content.replace('const audioRef = useRef<HTMLAudioElement | null>(null);', 'const audioRef = useRef<any>(null);')

# 2. Add isVideo boolean
trackFile_def = 'const [trackFile, setTrackFile] = useState<File | null>(null);'
new_trackFile_def = trackFile_def + '\n  const isVideo = trackFile && trackFile.type.startsWith(\'video/\');'
content = content.replace(trackFile_def, new_trackFile_def)

# 3. Add Video Player before TELEPROMPTER
teleprompter_comment = '{/* TELEPROMPTER */}'
video_player = '''{/* VIDEO PLAYER */}
            {isVideo && trackUrl && (
              <div className="w-full bg-black rounded-xl overflow-hidden shadow-sm flex items-center justify-center border border-edge/20 light:border-edge relative group">
                <video
                  ref={audioRef}
                  src={trackUrl}
                  playsInline
                  className="w-full max-h-[50vh] md:max-h-[60vh] object-contain"
                  onEnded={() => {
                    if (isRecording) {
                      handleStopRecording();
                    }
                  }}
                />
              </div>
            )}
            
            ''' + teleprompter_comment
content = content.replace(teleprompter_comment, video_player)

# 4. Update the hidden audio element
old_audio = '''      {/* Hidden audio element for synchronized playback DURING recording */}
      {trackUrl && (
        <audio 
          ref={audioRef} 
          src={trackUrl} 
          onEnded={() => {
            if (isRecording) {
              handleStopRecording();
            }
          }} 
        />
      )}'''
new_audio = '''      {/* Hidden audio element for synchronized playback DURING recording */}
      {trackUrl && !isVideo && (
        <audio 
          ref={audioRef} 
          src={trackUrl} 
          onEnded={() => {
            if (isRecording) {
              handleStopRecording();
            }
          }} 
        />
      )}'''
content = content.replace(old_audio, new_audio)

with open('/Users/sushant/Documents/karokie_session/src/components/KaraokeStudio.tsx', 'w') as f:
    f.write(content)
