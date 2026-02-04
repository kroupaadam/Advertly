import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../AppContext';
import { aiService } from '../services/aiService';
import { 
  Send, Loader2, User, Bot, CheckCircle2, Circle, Sparkles 
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  hasAnimated?: boolean;
}

interface RequiredField {
  key: string;
  label: string;
  isFilled: boolean;
  value?: any;
}

// Předdefinované rychlé odpovědi podle klíče pole, které zrovna chybí
const QUICK_RESPONSES: Record<string, string[]> = {
  industry: ['E-shop', 'Služby', 'Gastro', 'Stavebnictví', 'Reality', 'Technologie', 'Krása a zdraví'],
  targetInvestAmount: ['do 10 000 Kč', 'cca 30 000 Kč', '50 000 - 100 000 Kč', 'nad 100 000 Kč', 'Zatím nevím'],
  yearsOfExperience: ['Začínáme', 'Méně než rok', '1-3 roky', 'Více než 5 let', 'Více než 10 let'],
  toneOfVoice: ['Profesionální', 'Přátelský', 'Luxusní', 'Vtipný', 'Energetický'],
  usp: ['Rychlost dodání', 'Kvalita', 'Nízká cena', 'Osobní přístup', 'Unikátní technologie'],
  location: ['Praha', 'Brno', 'Celá ČR', 'Lokální (okres)', 'Celosvětově']
};

const TypewriterMessage = ({ text, onComplete }: { text: string, onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState('');
  const chunkIndex = useRef(0);
  const chunksRef = useRef<string[]>([]);

  useEffect(() => {
    // Rozdělíme text na slova a mezery, aby se vypisoval plynuleji po slovech
    chunksRef.current = text.split(/(\s+)/);
    chunkIndex.current = 0;
    setDisplayedText('');
    
    // Rychlost: 30-50ms na "kus" (slovo nebo mezeru) působí přirozeně
    const interval = setInterval(() => {
      if (chunkIndex.current < chunksRef.current.length) {
        // Použijeme current index a pak ho zvýšíme
        const currentChunk = chunksRef.current[chunkIndex.current];
        setDisplayedText((prev) => prev + currentChunk);
        chunkIndex.current++;
      } else {
        clearInterval(interval);
        onComplete?.();
      }
    }, 40); 

    return () => clearInterval(interval);
  }, [text, onComplete]);

  return <span className="whitespace-pre-wrap">{displayedText}</span>;
};

const ChatOnboarding: React.FC = () => {
  const { setPage, saveProfile, isAnalyzing, setAnalysisStep, setIsAnalyzing, skipOnboarding } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  
  // State that AI is filling out
  const [profileState, setProfileState] = useState<any>({});

  // Definition of fields we want to track
  const [trackedFields, setTrackedFields] = useState<RequiredField[]>([
    { key: 'companyName', label: 'Název firmy', isFilled: false },
    { key: 'industry', label: 'Obor podnikání', isFilled: false },
    { key: 'productDescription', label: 'Co prodáváte', isFilled: false },
    { key: 'targetInvestAmount', label: 'Marketingový rozpočet', isFilled: false },
    { key: 'yearsOfExperience', label: 'Délka na trhu', isFilled: false },
    { key: 'location', label: 'Lokalita', isFilled: false },
    { key: 'usp', label: 'Hlavní výhoda (USP)', isFilled: false },
    { key: 'toneOfVoice', label: 'Tón komunikace', isFilled: false },
  ]);

  // Zjistíme, které pole je první nevyplněné, abychom nabídli relevantní návrhy
  const currentActiveField = trackedFields.find(f => !f.isFilled);
  const currentSuggestions = currentActiveField ? QUICK_RESPONSES[currentActiveField.key] || [] : [];
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load state from sessionStorage
  useEffect(() => {
    const savedState = sessionStorage.getItem('advertly_onboarding_state');
    if (savedState) {
        try {
            const parsed = JSON.parse(savedState);
            if (parsed.messages && parsed.messages.length > 0) {
                // Restore state and mark all messages as animated to prevent re-typing
                const restoredMessages = parsed.messages.map((m: any) => ({ ...m, hasAnimated: true }));
                setMessages(restoredMessages);
                if (parsed.profileState) setProfileState(parsed.profileState);
                if (parsed.trackedFields) setTrackedFields(parsed.trackedFields);
                return;
            }
        } catch (e) {
            console.error("Failed to restore state", e);
        }
    }
    
    // Initial greeting if no state restored
    setMessages([
        { 
            role: 'assistant', 
            content: 'Dobrý den! Jsem váš osobní marketingový stratég z Advertly. Místo vyplňování dlouhých formulářů si teď spolu popovídáme a já zjistím vše potřebné pro váš růst.\n\nJak se jmenuje vaše firma a v jakém oboru podnikáte?',
            hasAnimated: false 
        }
    ]);
  }, []);

  // Save state to sessionStorage, hasAnimated: false
  useEffect(() => {
    if (messages.length > 0) {
        const stateToSave = {
            messages,
            profileState,
            trackedFields
        };
        sessionStorage.setItem('advertly_onboarding_state', JSON.stringify(stateToSave));
    }
  }, [messages, profileState, trackedFields]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || inputValue;
    if (!textToSend.trim()) return;

    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: textToSend }]);
    setIsLoading(true);

    try {
      // Prepare history for AI
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      history.push({ role: 'user', content: textToSend });

      const response = await aiService.chatOnboarding(history, profileState);

      // Update messages
      if (response.aiResponse) {
        setMessages(prev => [...prev, { role: 'assistant', content: response.aiResponse }]);
      }

      // Update state if we got updates
      if (response.extractedUpdates) {
        setProfileState((prev:any) => {
            const newState = { ...prev, ...response.extractedUpdates };
            
            // Update tracked fields
            setTrackedFields(fields => fields.map(field => ({
                ...field,
                isFilled: !!newState[field.key] || field.isFilled,
                value: newState[field.key]
            })));

            return newState;
        });
      }

      // Check completion
      if (response.isComplete) {
        setIsFinished(true);
        // Wait a bit then start generation
        setTimeout(() => handleCompletion(), 2000);
      }

    } catch (error) {
      console.error('Error in chat:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Omlouvám se, došlo k chybě připojení. Můžete to zkusit znovu?' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompletion = async () => {

      // Set background mode flag
      sessionStorage.setItem('onboarding_background_mode', 'true');

      // Start the analysis process
      setIsAnalyzing(true);

      setAnalysisStep('Hledám informace o konkurenci...');
      
      // Save profile and trigger generation logic
      // We map the state to OnboardingData format if necessary, or pass directly depending on generateStrategy implementation
      // Here we assume saveProfile handles it or we call generate directly
      
      const finalProfile = {
          ...profileState,
          id: `profile-${Date.now()}`,
          createdAt: new Date(),
          pricingModel: 'free_quote', // Default or AI extracted
          strategyPreference: 'quality_leads', // Default
          culture: 'Profesionální', // Default
      };

      // Call saveProfile which triggers completeOnboarding in context
      await saveProfile(finalProfile);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Progress */}
      <div className="w-80 bg-white border-r border-gray-200 p-6 hidden md:flex flex-col">
        <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                Advertly AI
            </h1>
            <p className="text-sm text-gray-500 mt-2">Váš osobní stratég</p>
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                TVOŘÍM VÁŠ PROFIL
            </h3>
            <div className="space-y-3">
                {trackedFields.map((field) => (
                    <div 
                        key={field.key} 
                        className={`
                            flex items-center gap-3 p-2 rounded-lg transition-all duration-300
                            ${field.isFilled ? 'bg-green-50/50 translate-x-1' : 'opacity-70'}
                        `}
                    >
                        <div className={`
                            mt-0.5 transition-colors duration-500
                            ${field.isFilled ? 'text-green-500 scale-110' : 'text-gray-300'}
                        `}>
                            {field.isFilled ? <CheckCircle2 size={20} className="stroke-[3]" /> : <Circle size={20} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium transition-colors ${field.isFilled ? 'text-gray-900' : 'text-gray-500'}`}>
                                {field.label}
                            </p>
                            {field.isFilled && field.value && (
                                <p className="text-xs font-semibold text-indigo-600 mt-0.5 truncate animate-fade-in">
                                    {String(field.value)}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {isFinished && (
                <div className="mt-6 p-4 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
                    <CheckCircle2 size={20} />
                    <span>Mám vše potřebné! Generuji strategii...</span>
                </div>
            )}
        </div>
      </div>
      
      <div className="flex-1 flex flex-col relative">
        
        {/* Header with Skip Button */}
        <div className="absolute top-0 right-0 p-4 z-10 flex gap-2">
            <button
                onClick={() => setShowSkipConfirm(true)}
                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
                Přeskočit
            </button>
        </div>

        {/* Header (Mobile only) */}
        <div className="md:hidden p-4 bg-white border-b flex items-center justify-between">
            <span className="font-bold">Advertly AI</span>
            <button
                onClick={() => setShowSkipConfirm(true)}
                className="text-xs font-medium text-gray-500"
            >
                Přeskočit
            </button>
        </div>


        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
            {messages.map((msg, idx) => (
                <div 
                    key={idx} 
                    className={`flex items-start gap-3 md:gap-4 max-w-3xl ${msg.role === 'user' ? 'flex-row-reverse ml-auto' : ''}`}
                >
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                        msg.role === 'assistant' 
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' 
                            : 'bg-gray-200 text-gray-600'
                    }`}>
                        {msg.role === 'assistant' ? <Sparkles size={18} /> : <User size={18} />}
                    </div>
                    
                    <div className={`
                        max-w-[85%] rounded-2xl px-5 py-3.5 text-sm md:text-base leading-relaxed shadow-sm
                        ${msg.role === 'assistant' 
                            ? 'bg-white border border-gray-100 text-gray-800 rounded-tl-none' 
                            : 'bg-blue-600 text-white rounded-tr-none'
                        }
                    `}>
                        {msg.role === 'assistant' && idx === messages.length - 1 && !msg.hasAnimated ? (
                            <TypewriterMessage 
                                text={msg.content} 
                                onComplete={() => {
                                    scrollToBottom();
                                    setMessages(prev => prev.map((m, i) => 
                                        i === idx ? { ...m, hasAnimated: true } : m
                                    ));
                                }}
                            />
                        ) : (
                            <span className="whitespace-pre-wrap">{msg.content}</span>
                        )}
                    </div>
                </div>
            ))}
            
            {isLoading && (
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Sparkles size={18} />
                    </div>
                     <div className="bg-white border border-gray-100 px-5 py-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-white border-t border-gray-100 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
            <div className="max-w-3xl mx-auto">
                {/* Suggestions / Chips */}
                {!isLoading && !isFinished && currentSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3 animate-fade-in-up">
                        {currentSuggestions.map((suggestion) => (
                            <button
                                key={suggestion}
                                onClick={() => handleSend(suggestion)}
                                className="px-3 py-1.5 text-xs md:text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-full transition-all hover:scale-105 active:scale-95"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}

                <div className="relative flex items-center gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder={isFinished ? "Onboarding dokončen" : "Napište odpověď..."}
                        disabled={isLoading || isFinished}
                        className="w-full pl-5 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm md:text-base shadow-inner"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={isLoading || !inputValue.trim() || isFinished}
                        className="absolute right-2 p-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none transition-all duration-200"
                    >
                        {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                </div>
            </div>
            <p className="text-center text-xs text-gray-400 mt-3">
                AI se může mýlit. Prosím zkontrolujte si důležité informace.
            </p>
        </div>

        {/* Skip Confirmation Modal */}
        {showSkipConfirm && (
            <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl animate-fade-in-scale">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Přeskočit formulář?</h3>
                    <p className="text-gray-600 text-sm mb-6">Bez těchto informací nebudeme schopní vytvořit kvalitní strategii. Opravdu chceš pokračovat bez nich?</p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowSkipConfirm(false)}
                            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            Zpět k chatu
                        </button>
                        <button
                            onClick={() => skipOnboarding()}
                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                        >
                            Přeskočit
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default ChatOnboarding;
