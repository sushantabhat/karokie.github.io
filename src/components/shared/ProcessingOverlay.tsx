import { Loader2 } from "lucide-react";

interface ProcessingOverlayProps {
  isVisible: boolean;
  text?: string;
  progress?: number;
}

export function ProcessingOverlay({ isVisible, text = "Processing...", progress }: ProcessingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm rounded-[inherit] animate-in fade-in duration-200">
      <div className="bg-panel border border-edge/20 p-8 rounded-2xl shadow-2xl flex flex-col items-center justify-center max-w-sm w-full mx-4">
        <Loader2 className="w-10 h-10 animate-spin text-foreground mb-4" />
        <p className="text-lg font-bold text-foreground mb-2 text-center">{text}</p>
        
        {progress !== undefined && progress > 0 && (
          <div className="w-full mt-4">
            <div className="flex justify-between text-xs font-bold text-secondary uppercase tracking-wider mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-edge/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-foreground transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
