import sys

with open('/Users/sushant/Documents/karokie_session/src/components/VoiceChangerTool.tsx', 'r') as f:
    content = f.read()

# Replace the alert
content = content.replace(
    '''alert("Microphone access is blocked!\\n\\nTo fix on iPhone/Safari:\\n1. Tap the 'aA' icon in the web address bar.\\n2. Tap 'Website Settings'.\\n3. Set Microphone to 'Allow'.\\n4. Refresh the page.");''',
    '''setMicError("Microphone access is blocked!\\n\\nTo fix on iPhone/Safari:\\n1. Tap the 'aA' icon in the web address bar.\\n2. Tap 'Website Settings'.\\n3. Set Microphone to 'Allow'.\\n4. Refresh the page.");'''
)

# Add state
content = content.replace(
    'const [isProcessing, setIsProcessing] = useState(false);',
    'const [isProcessing, setIsProcessing] = useState(false);\n  const [micError, setMicError] = useState<string | null>(null);'
)

# Render it right after Header
error_ui = '''        {/* Header */}
        
        {micError && (
          <div className="bg-[#ef4444] text-white p-4 rounded-xl shadow-lg animate-in slide-in-from-top-4 mb-4">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-lg mb-1">Microphone Blocked 🎤</h3>
              <button onClick={() => window.location.reload()} className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-bold transition-colors">Reload Page</button>
            </div>
            <p className="text-sm whitespace-pre-wrap">{micError}</p>
          </div>
        )}
'''
content = content.replace('        {/* Header */}', error_ui)

with open('/Users/sushant/Documents/karokie_session/src/components/VoiceChangerTool.tsx', 'w') as f:
    f.write(content)

