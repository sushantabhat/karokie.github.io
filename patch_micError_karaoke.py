import sys

with open('/Users/sushant/Documents/karokie_session/src/components/KaraokeStudio.tsx', 'r') as f:
    content = f.read()

# Destructure micError
content = content.replace(
    'isRecording, isPaused: isRecPaused,',
    'isRecording, isPaused: isRecPaused, micError,'
)

# Render micError UI
error_ui = '''
      {/* Mic Error Banner */}
      {micError && (
        <div className="absolute top-20 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[600px] bg-[#ef4444] text-white p-4 rounded-xl shadow-2xl z-50 animate-in slide-in-from-top-4">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg mb-1">Microphone Blocked 🎤</h3>
            <button onClick={() => window.location.reload()} className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-bold transition-colors">Reload Page</button>
          </div>
          <p className="text-sm whitespace-pre-wrap">{micError}</p>
        </div>
      )}

      {/* HEADER */}'''

content = content.replace('      {/* HEADER */}', error_ui)

with open('/Users/sushant/Documents/karokie_session/src/components/KaraokeStudio.tsx', 'w') as f:
    f.write(content)

