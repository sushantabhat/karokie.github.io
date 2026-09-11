import sys

with open('/Users/sushant/Documents/karokie_session/src/components/Sidebar.tsx', 'r') as f:
    content = f.read()

# Enable the Recorder link in desktop sidebar
old_desktop = '''          <div className="flex flex-col items-center justify-center w-full py-3 opacity-40 cursor-not-allowed group relative">
            <div className="p-2 rounded-xl mb-1 bg-transparent">
              <CircleDot className="w-5 h-5 text-muted" />
            </div>
            <span className="text-[10px] font-medium text-muted">Recorder</span>
            {/* Coming soon tooltip */}
            <div className="absolute left-full ml-4 px-2 py-1 bg-panel border border-edge/20 rounded-md text-[10px] font-bold text-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Coming Soon
            </div>
          </div>'''

new_desktop = '''          <Link 
            href="/recorder"
            className={`flex flex-col items-center justify-center w-full py-3 transition-all relative border-l-2 ${
              isActive('/recorder') 
                ? 'border-[#38bdf8] bg-[#38bdf8]/5' 
                : 'border-transparent hover:bg-white/5'
            }`}
          >
            <div className={`p-2 rounded-xl mb-1 ${isActive('/recorder') ? 'text-[#38bdf8]' : 'text-muted group-hover:text-foreground'}`}>
              <CircleDot className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-medium ${isActive('/recorder') ? 'text-[#38bdf8]' : 'text-muted group-hover:text-foreground'}`}>
              Recorder
            </span>
          </Link>'''
content = content.replace(old_desktop, new_desktop)

# Enable the Recorder link in mobile sidebar
old_mobile = '''                {/* Coming Soon Card */}
                <div className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-panel border border-edge/20 opacity-40">
                  <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                    <CircleDot className="w-6 h-6 text-muted" />
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-muted">Recorder</div>
                    <div className="text-xs text-muted/60 mt-1">Coming soon</div>
                  </div>
                </div>'''

new_mobile = '''                <Link 
                  href="/recorder"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-panel border transition-all ${
                    isActive('/recorder') ? 'border-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.1)]' : 'border-edge/20 active:bg-white/5'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isActive('/recorder') ? 'bg-[#38bdf8]/10' : 'bg-black/50'}`}>
                    <CircleDot className={`w-6 h-6 ${isActive('/recorder') ? 'text-[#38bdf8]' : 'text-muted'}`} />
                  </div>
                  <span className={`font-bold ${isActive('/recorder') ? 'text-foreground' : 'text-muted'}`}>
                    Voice Changer
                  </span>
                </Link>'''
content = content.replace(old_mobile, new_mobile)

with open('/Users/sushant/Documents/karokie_session/src/components/Sidebar.tsx', 'w') as f:
    f.write(content)

