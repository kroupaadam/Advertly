import React from 'react';
import { useApp } from '../AppContext';
import { Loader2, X, CheckCircle, Sparkles, FolderOpen, Maximize2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ProgressRadial } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const BackgroundProgressIndicator: React.FC = () => {
  const { isAnalyzing, analysisStep, backgroundGenerationInProgress, generatedStrategy } = useApp() as any;
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const navigate = useNavigate();

  // Show indicator when background generation is in progress
  React.useEffect(() => {
    if (backgroundGenerationInProgress || (isAnalyzing && sessionStorage.getItem('onboarding_background_mode') === 'true')) {
      setIsVisible(true);
      if(!isMinimized) setIsMinimized(false);
    } else {
      // Delay hiding to show completion
      const timeout = setTimeout(() => {
          setIsVisible(false);
          // If finished, we can redirect or show notification, but the user asked for indicator
      }, 5000); 
      return () => clearTimeout(timeout);
    }
  }, [backgroundGenerationInProgress, isAnalyzing]);

  if (!isVisible && !backgroundGenerationInProgress && !isAnalyzing) return null;

  // Calculate progress from step text (simple mapping)
  const getProgressFromStep = (step: string): number => {
    if (!step) return 5;
    const stepLower = step.toLowerCase();
    if (stepLower.includes('ověřuji') || stepLower.includes('formulář')) return 10;
    if (stepLower.includes('scrapuji') || stepLower.includes('konkurenci') || stepLower.includes('hledám')) return 25;
    if (stepLower.includes('analyzuji') || stepLower.includes('odpovědi')) return 40;
    if (stepLower.includes('profil') || stepLower.includes('zákazníka')) return 55;
    if (stepLower.includes('kampaň') || stepLower.includes('reklam')) return 70;
    if (stepLower.includes('dashboard') || stepLower.includes('připravuji')) return 85;
    if (stepLower.includes('připravena') || stepLower.includes('děkujeme')) return 100;
    
    // Auto increment fallback simulation if status is generic
    return 15;
  };

  const progress = generatedStrategy ? 100 : getProgressFromStep(analysisStep);
  const isComplete = progress >= 100;

  // Minimized view - Floating Circle
  if (isMinimized) {
    return (
      <div 
        className="fixed bottom-6 right-6 z-50 cursor-pointer hover:scale-105 transition-transform"
        onClick={() => setIsMinimized(false)}
      >
         <ProgressRadial 
            value={progress} 
            size={64} 
            strokeWidth={6} 
            indicatorClassName={isComplete ? "text-green-500" : "text-primary"}
            trackClassName="text-slate-200 dark:text-slate-800"
        >
            {isComplete ? (
                 <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
                <span className="text-xs font-bold">{Math.round(progress)}%</span>
            )}
        </ProgressRadial>
      </div>
    );
  }

  // Expanded view - Card
  return (
    <Card className={cn(
        "fixed bottom-6 right-6 z-50 w-80 shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom-10 fade-in border-primary/20",
        isComplete ? "border-green-500/50" : "border-primary/20"
    )}>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-full", isComplete ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary")}>
                {isComplete ? <CheckCircle className="w-5 h-5" /> : <Sparkles className="w-5 h-5 animate-pulse" />}
            </div>
            <div>
              <h4 className="font-semibold text-sm">
                  {isComplete ? "Strategie hotova" : "Generuji strategii"}
              </h4>
              <p className="text-xs text-muted-foreground w-40 truncate">
                {isComplete ? "Vše připraveno" : (analysisStep || "Inicializace AI...")}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 -mr-2 -mt-2" 
            onClick={() => setIsMinimized(true)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
             <div className="flex-1">
                 <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Postup</span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                 </div>
                  {/* Using the standard linear progress for the expanded card */}
                 <div className="h-2 w-full bg-secondary/20 rounded-full overflow-hidden">
                     <div 
                        className={cn("h-full transition-all duration-1000 ease-out", isComplete ? "bg-green-500" : "bg-primary")}
                        style={{ width: `${progress}%` }}
                     />
                 </div>
             </div>
        </div>

        {isComplete && (
            <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white" 
                size="sm"
                onClick={() => {
                    setIsVisible(false);
                    // Navigate to dashboard or strategy page
                    navigate('/'); // Assuming home is dashboard or strategy list
                }}
            >
                Zobrazit výsledek
            </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default BackgroundProgressIndicator;
