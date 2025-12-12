
import React, { useState, useRef, useEffect } from 'react';
import { Topic, Category } from '../types';
import { GoogleGenAI, Chat } from "@google/genai";
import { ambientEngine } from '../utils/audioEngine';

interface PromptBuilderProps {
  selectedTopics: Topic[];
  onRemove: (topic: Topic) => void;
  onExpandStateChange?: (isExpanded: boolean) => void;
}

interface Message {
  role: 'user' | 'model';
  text: string;
  image?: string;
}

const LOADING_MESSAGES = [
  "// Initializing Neural Link...",
  "// Synthesizing Vectors...",
  "// Retrieving Context Window...",
  "// Optimizing Token Stream...",
  "// Applying Heuristic Filters...",
  "// Generating Response..."
];

const VIDEO_LOADING_MESSAGES = [
    "// Initializing Veo Physics Engine...",
    "// Calculating Light Ray Tracing...",
    "// Interpolating Frames...",
    "// Rendering Motion Blur...",
    "// Encoding MP4 Stream..."
];

const AUDIO_LOADING_MESSAGES = [
    "// Oscillating Waveforms...",
    "// Mixing Spatial Audio...",
    "// Applying Reverb Convolution...",
    "// Mastering Dynamic Range...",
    "// Encoding Audio Stream..."
];

const TECH_STACKS = {
  Frontend: ['React', 'Next.js', 'Vue', 'Tailwind', 'TypeScript', 'Three.js'],
  Backend: ['Node.js', 'Python', 'Go', 'Supabase', 'PostgreSQL', 'Firebase']
};

const TARGET_MODELS = [
  'Gemini 3.0 Pro',
  'Gemini 2.5 Flash',
  'GPT-5 (Preview)',
  'Claude 4 Opus',
  'Llama 4 405B',
  'DeepSeek V3',
  'Grok 3'
];

const OUTPUT_TYPES = [
  'Refined Prompt',
  'System Prompt',
  'Skills File',
  'Reasoning Chain',
  'Eval Rubric',
  'Fine-Tuning JSONL'
];

type GenerationMode = 'TEXT' | 'VIDEO' | 'AUDIO' | 'VOICE';

const PromptBuilder: React.FC<PromptBuilderProps> = ({ selectedTopics, onRemove, onExpandStateChange }) => {
  const [userPrompt, setUserPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [isConfigOpen, setIsConfigOpen] = useState(false); // New state for mobile config toggle
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  // Configuration State
  const [selectedTech, setSelectedTech] = useState<string[]>([]);
  const [targetModel, setTargetModel] = useState<string>('Gemini 3.0 Pro');
  const [outputType, setOutputType] = useState<string>('Refined Prompt');

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // --- REACTION CHAMBER LOGIC ---
  const ingredients = selectedTopics.filter(t => 
      t.category !== Category.VIDEO && 
      t.category !== Category.AUDIO && 
      t.category !== Category.VOICE
  );

  const modifiers = selectedTopics.filter(t => 
      t.category === Category.VIDEO || 
      t.category === Category.AUDIO || 
      t.category === Category.VOICE
  );

  // Determine Mode based on Modifiers
  let currentMode: GenerationMode = 'TEXT';
  let primaryModifier = modifiers[0]; // Take the first one as dominant
  
  if (modifiers.some(t => t.category === Category.VIDEO)) currentMode = 'VIDEO';
  else if (modifiers.some(t => t.category === Category.AUDIO)) currentMode = 'AUDIO';
  else if (modifiers.some(t => t.category === Category.VOICE)) currentMode = 'VOICE';

  // SFX for Mode Switch
  useEffect(() => {
    if (currentMode !== 'TEXT') {
        ambientEngine.playSFX('activate');
    }
  }, [currentMode]);

  const toggleExpand = () => {
      const newState = !isExpanded;
      setIsExpanded(newState);
      if (onExpandStateChange) onExpandStateChange(newState);
      ambientEngine.playSFX('click');
  };

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current && !isConfigOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isBuilding, isExpanded, isConfigOpen]);

  // Focus input when expanded
  useEffect(() => {
      if (isExpanded && inputRef.current) {
          inputRef.current.focus();
      }
  }, [isExpanded]);

  // Cycle loading messages
  useEffect(() => {
    if (!isBuilding) return;
    
    let msgList = LOADING_MESSAGES;
    if (currentMode === 'VIDEO') msgList = VIDEO_LOADING_MESSAGES;
    if (currentMode === 'AUDIO' || currentMode === 'VOICE') msgList = AUDIO_LOADING_MESSAGES;

    const interval = setInterval(() => {
        setLoadingMsgIndex(prev => (prev + 1) % msgList.length);
    }, 800);
    return () => clearInterval(interval);
  }, [isBuilding, currentMode]);

  const toggleTech = (tech: string) => {
    ambientEngine.playSFX('click');
    setSelectedTech(prev => 
      prev.includes(tech) 
        ? prev.filter(t => t !== tech) 
        : [...prev, tech]
    );
  };

  const initializeChat = async () => {
    if (!process.env.API_KEY) return null;

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const techniques = ingredients.map(t => `${t.element} (${t.category})`).join(', ');
    const modifierContext = modifiers.length > 0 ? `\n    ACTIVE MODIFIERS: ${modifiers.map(m => m.element).join(', ')} (MODE: ${currentMode})` : '';
    const techContext = selectedTech.length > 0 ? `\n    TECH STACK PREFERENCE: ${selectedTech.join(', ')}` : '';
    
    const systemInstruction = `You are an expert AI Prompt Engineer and Creative Director.
    
    CONTEXT:
    - User Selected Techniques: ${techniques}
    - Active Modifiers: ${modifierContext}
    - Tech Stack Constraints: ${techContext || "None"}
    - Target Model Optimization: ${targetModel}
    - Desired Output Format: ${outputType}
    - CURRENT MODE: ${currentMode}

    YOUR MISSION:
    1. ANALYZE: How do the selected techniques apply to the current mode?
    2. EXECUTE:
       - IF MODE IS TEXT: Provide the refined prompt or code.
       - IF MODE IS VIDEO: Describe the video generation prompt in detail (Camera, Lighting, Physics) as if instructing Veo/Sora.
       - IF MODE IS AUDIO/VOICE: Describe the soundscape/voice acting directions (BPM, Mood, Prosody).
    
    Tone: Educational, futuristic, encouraging.`;

    return ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      }
    });
  };

  const generateInfographic = async () => {
      if (!process.env.API_KEY) return null;
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const concepts = ingredients.map(t => t.element).join(', ');
        const prompt = `Futuristic neon UI block diagram infographic explaining the concept of: ${concepts}. Dark background, cyan and purple neon lines, schematic style, high tech, detailed.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
      } catch (e) {
          console.error("Infographic error:", e);
      }
      return null;
  };

  const handleGenerate = async (isRegen = false) => {
    const promptText = userPrompt.trim();
    if (!promptText && !isRegen) return;

    ambientEngine.playSFX('activate');
    if (!isExpanded) toggleExpand();
    setIsBuilding(true);
    setLoadingMsgIndex(0);
    
    // Clear input if new message
    if (!isRegen) setUserPrompt('');

    // Optimistic UI for user message
    if (!isRegen) {
        setMessages(prev => [...prev, { role: 'user', text: promptText }]);
    }

    try {
        if (!process.env.API_KEY) {
            // Simulation
            setTimeout(() => {
                let simText = "// SIMULATION: API KEY MISSING.\n";
                if (currentMode === 'VIDEO') simText += "Simulating Video Render... [████████░░] 80%";
                else if (currentMode === 'AUDIO') simText += "Simulating Audio Synthesis... [██████░░░░] 60%";
                else simText += "Please add your API Key to generate real research and infographics.";
                
                setMessages(prev => [...prev, { role: 'model', text: simText }]);
                setIsBuilding(false);
            }, 3000);
            return;
        }

        // Always re-initialize chat on generation to capture updated state
        let chat = chatSession;
        if (!chat || messages.length === 0) {
            chat = await initializeChat();
            setChatSession(chat);
        }

        if (!chat) throw new Error("Could not init chat");

        let msgToSend = isRegen ? "Regenerate the previous response with a different approach." : promptText;
        if (messages.length > 0) {
             msgToSend += `\n\n[UPDATED CONTEXT]\nMode: ${currentMode}\nModifiers: ${modifiers.map(m => m.element).join(', ')}`;
        }

        // Parallel tasks
        const runImageGen = messages.length === 0 && !isRegen && currentMode === 'TEXT';
        
        const [textResult, imageResult] = await Promise.all([
            chat.sendMessage({ message: msgToSend }),
            runImageGen ? generateInfographic() : Promise.resolve(null)
        ]);

        setMessages(prev => [...prev, { 
            role: 'model', 
            text: textResult.text, 
            image: imageResult || undefined 
        }]);

    } catch (e) {
        console.error(e);
        setMessages(prev => [...prev, { role: 'model', text: "Error: Could not generate content. Please try again." }]);
    } finally {
        setIsBuilding(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    ambientEngine.playSFX('click');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Button Visuals
  const getButtonConfig = () => {
      switch(currentMode) {
          case 'VIDEO': return { text: 'RENDER VIDEO', color: 'bg-purple-600 hover:bg-purple-500', shadow: 'shadow-[0_0_20px_rgba(147,51,234,0.4)]', glow: 'purple' };
          case 'AUDIO': return { text: 'SYNTHESIZE AUDIO', color: 'bg-blue-600 hover:bg-blue-500', shadow: 'shadow-[0_0_20px_rgba(37,99,235,0.4)]', glow: 'blue' };
          case 'VOICE': return { text: 'SYNTHESIZE VOICE', color: 'bg-orange-600 hover:bg-orange-500', shadow: 'shadow-[0_0_20px_rgba(234,88,12,0.4)]', glow: 'orange' };
          default: return { text: messages.length > 0 ? 'Send' : 'Generate', color: 'bg-cyan-600 hover:bg-cyan-500', shadow: 'shadow-[0_0_20px_rgba(8,145,178,0.4)]', glow: 'cyan' };
      }
  };
  const btnConfig = getButtonConfig();

  // Reusable Config Panel for Desktop Sidebar and Mobile Overlay
  const ConfigPanel = () => (
    <>
      {/* Target Model Selection */}
      <div>
          <h4 className="text-xs font-bold text-green-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                Target Model
          </h4>
          <div className="flex flex-col gap-2">
              {TARGET_MODELS.map(model => (
                  <button
                      key={model}
                      onClick={() => setTargetModel(model)}
                      className={`px-3 py-2 text-[10px] uppercase font-bold tracking-wide rounded border transition-all duration-300 text-left ${
                          targetModel === model
                          ? 'bg-green-900/40 border-green-400 text-green-100 shadow-[0_0_10px_rgba(74,222,128,0.2)]' 
                          : 'bg-transparent border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300'
                      }`}
                  >
                      {targetModel === model && <span className="mr-2">►</span>}
                      {model}
                  </button>
              ))}
          </div>
      </div>

      {/* Output Type Selection */}
      <div className="mt-6">
          <h4 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                Output Format
          </h4>
          <div className="flex flex-col gap-2">
              {OUTPUT_TYPES.map(type => (
                  <button
                      key={type}
                      onClick={() => setOutputType(type)}
                      className={`px-3 py-2 text-[10px] uppercase font-bold tracking-wide rounded border transition-all duration-300 text-left ${
                          outputType === type
                          ? 'bg-orange-900/40 border-orange-400 text-orange-100 shadow-[0_0_10px_rgba(251,146,60,0.2)]' 
                          : 'bg-transparent border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300'
                      }`}
                  >
                      {outputType === type && <span className="mr-2">■</span>}
                      {type}
                  </button>
              ))}
          </div>
      </div>

      <div className="h-px bg-gray-800 my-6"></div>

      {/* Tech Stacks */}
      <div>
          <h4 className="text-xs font-bold text-cyan-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span>
                Frontend
          </h4>
          <div className="flex flex-wrap gap-2">
              {TECH_STACKS.Frontend.map(tech => (
                  <button
                      key={tech}
                      onClick={() => toggleTech(tech)}
                      className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-wide rounded border transition-all duration-300 ${
                          selectedTech.includes(tech) 
                          ? 'bg-cyan-900/40 border-cyan-400 text-cyan-100 shadow-[0_0_10px_rgba(34,211,238,0.2)]' 
                          : 'bg-transparent border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300'
                      }`}
                  >
                      {tech}
                  </button>
              ))}
          </div>
      </div>

      <div className="mt-6">
          <h4 className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                Backend
          </h4>
          <div className="flex flex-wrap gap-2">
              {TECH_STACKS.Backend.map(tech => (
                  <button
                      key={tech}
                      onClick={() => toggleTech(tech)}
                      className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-wide rounded border transition-all duration-300 ${
                          selectedTech.includes(tech) 
                          ? 'bg-purple-900/40 border-purple-400 text-purple-100 shadow-[0_0_10px_rgba(168,85,247,0.2)]' 
                          : 'bg-transparent border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300'
                      }`}
                  >
                      {tech}
                  </button>
              ))}
          </div>
      </div>
      
      {/* Status Info */}
      <div className="mt-auto pt-4 border-t border-gray-800">
            <p className="text-[10px] text-gray-600 font-mono leading-relaxed">
              Generating <strong>{outputType}</strong> for <strong>{targetModel}</strong>.
            </p>
      </div>
    </>
  );

  // Mobile collapsed height needs to be taller to fit reaction chamber + input
  const collapsedHeight = 'h-[220px] md:h-32'; 

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-40 border-t border-cyan-500/30 bg-[#050510]/95 backdrop-blur-xl transition-all duration-500 ease-in-out flex flex-col ${isExpanded ? 'h-[85vh]' : collapsedHeight}`}>
      
      {/* Handle */}
      <div 
        className={`absolute -top-6 left-1/2 transform -translate-x-1/2 bg-[#050510] border border-${btnConfig.glow}-500/30 border-b-0 px-8 py-1 rounded-t-xl cursor-pointer flex items-center gap-2 text-${btnConfig.glow}-400 text-xs font-bold uppercase tracking-widest hover:bg-${btnConfig.glow}-900/20 transition-all`}
        onClick={toggleExpand}
      >
        <span>Prompt Builder</span>
        <span className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>▲</span>
      </div>

      {/* Main Container */}
      <div className="container mx-auto h-full flex flex-col p-4 md:p-6 gap-4">
        
        {/* --- REACTION CHAMBER VISUALIZATION --- */}
        <div className="flex-shrink-0 relative bg-[#0a0a12] border border-gray-800 rounded-xl p-3 flex items-center justify-between min-h-[80px] overflow-hidden">
           
           {/* Background Grid for Chamber */}
           <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
           
           {/* LEFT: INGREDIENTS */}
           <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar px-2 z-10 w-1/2">
                {ingredients.length === 0 ? (
                     <div className="text-gray-600 text-xs font-mono uppercase tracking-widest animate-pulse whitespace-nowrap">
                        [Select Ingredients]
                     </div>
                ) : (
                    ingredients.map(t => (
                       <div key={t.symbol} className="flex flex-col items-center justify-center w-12 h-12 bg-[#0f0e17] border border-gray-700 rounded animate-in zoom-in duration-300 shrink-0 relative group">
                           <span className="text-cyan-400 font-bold font-mono text-lg">{t.symbol}</span>
                           <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 cursor-pointer" onClick={(e) => { e.stopPropagation(); onRemove(t); }}>
                                <div className="bg-red-500 text-white w-3 h-3 rounded-full flex items-center justify-center text-[8px]">×</div>
                           </div>
                       </div>
                    ))
                )}
           </div>

           {/* CENTER: REACTION FLOW */}
           <div className="flex-shrink-0 flex items-center justify-center px-4 relative z-10">
                {ingredients.length > 0 && (
                    <div className="relative w-16 md:w-24 h-6">
                        {/* Flowing Energy Beam */}
                        <div className={`absolute inset-y-2 left-0 right-0 bg-gradient-to-r from-cyan-500/20 via-${btnConfig.glow}-500 to-${btnConfig.glow}-500/20 rounded-full animate-pulse`}></div>
                        
                        {/* Animated Particles */}
                         <div className={`absolute top-1/2 left-0 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white] animate-[slide-right_1s_infinite_linear]`}></div>
                         <div className={`absolute top-1/2 left-0 w-1 h-1 bg-${btnConfig.glow}-300 rounded-full shadow-[0_0_5px_currentColor] animate-[slide-right_1.5s_infinite_linear_0.5s]`}></div>
                         
                         {modifiers.length > 0 && (
                             <div className="absolute inset-0 flex items-center justify-center">
                                 <span className="text-white font-bold text-xl drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">+</span>
                             </div>
                         )}
                    </div>
                )}
           </div>

           {/* RIGHT: MODIFIER / OUTPUT MODE */}
           <div className="flex items-center justify-end gap-2 overflow-x-auto custom-scrollbar px-2 z-10 w-1/3">
                {modifiers.length === 0 ? (
                    <div className={`border-2 border-dashed border-gray-700 rounded-lg px-2 md:px-4 py-2 text-gray-500 text-[10px] md:text-xs font-mono uppercase tracking-widest whitespace-nowrap ${ingredients.length > 0 ? 'animate-pulse' : ''}`}>
                        [Default: Text]
                    </div>
                ) : (
                    modifiers.map(t => (
                        <div key={t.symbol} className={`flex flex-col items-center justify-center w-14 h-14 bg-${btnConfig.glow}-900/20 border-2 border-${btnConfig.glow}-500 rounded-lg animate-in slide-in-from-right-4 duration-500 shrink-0 relative shadow-[0_0_20px_rgba(0,0,0,0.5)]`}>
                             <span className={`text-${btnConfig.glow}-400 font-bold font-mono text-xl`}>{t.symbol}</span>
                             <span className={`text-[8px] text-${btnConfig.glow}-200 uppercase tracking-wider`}>{currentMode}</span>
                             <div className="absolute -top-2 -right-2 cursor-pointer bg-black rounded-full" onClick={(e) => { e.stopPropagation(); onRemove(t); }}>
                                <div className="bg-gray-700 hover:bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px]">×</div>
                           </div>
                        </div>
                    ))
                )}
           </div>

           <style>{`
               @keyframes slide-right {
                   0% { transform: translateX(0); opacity: 0; }
                   20% { opacity: 1; }
                   80% { opacity: 1; }
                   100% { transform: translateX(100px); opacity: 0; }
               }
           `}</style>
        </div>

        {/* Middle: Dashed Workspace (Chat & Tech Stack) */}
        {isExpanded && (
            <div className="flex-grow flex gap-4 overflow-hidden animate-in fade-in slide-in-from-bottom-4 relative">
                {/* Chat Area */}
                <div 
                    ref={scrollRef}
                    className="flex-1 border-2 border-dashed border-gray-800 bg-[#0a0a12]/50 rounded-lg p-6 overflow-y-auto custom-scrollbar space-y-6 relative"
                >
                    {/* Mobile Config Toggle */}
                    <div className="absolute top-4 right-4 md:hidden z-30">
                        <button
                            onClick={() => { ambientEngine.playSFX('click'); setIsConfigOpen(!isConfigOpen); }}
                            className={`p-2 rounded-lg border shadow-lg transition-all ${isConfigOpen ? 'bg-cyan-900 text-cyan-400 border-cyan-500' : 'bg-[#0a0a12] text-gray-400 border-gray-700'}`}
                            title="Open Configuration"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </button>
                    </div>

                    {/* Mobile Config Overlay */}
                    {isConfigOpen && (
                        <div className="absolute inset-0 z-20 bg-[#050510]/95 backdrop-blur-xl p-6 overflow-y-auto md:hidden animate-in fade-in slide-in-from-right-4">
                             <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-1 h-4 bg-cyan-500 rounded"></span>
                                    Generation Config
                                </h3>
                                <button onClick={() => setIsConfigOpen(false)} className="text-gray-500 hover:text-white px-3 py-1 border border-gray-700 rounded hover:bg-gray-800 text-xs uppercase font-bold">Close</button>
                             </div>
                             <ConfigPanel />
                        </div>
                    )}

                    {messages.length === 0 && !isConfigOpen && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 opacity-50 pointer-events-none">
                            <div className="text-6xl mb-4 grayscale opacity-50">
                                {currentMode === 'VIDEO' ? '🎥' : currentMode === 'AUDIO' ? '🎵' : '🧬'}
                            </div>
                            <p className="font-mono text-sm uppercase tracking-widest">
                                {currentMode === 'TEXT' ? 'Workspace Ready' : `${currentMode} Processor Active`}
                            </p>
                            <p className="text-xs mt-2">Enter a task below to begin generation</p>
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-4 group`}>
                            <div className={`max-w-[90%] md:max-w-[80%] rounded-lg p-4 relative ${msg.role === 'user' ? 'bg-cyan-900/20 border border-cyan-500/30 text-cyan-100' : 'bg-gray-800/50 border border-gray-700 text-gray-200'}`}>
                                
                                {/* Copy Button (Only for Model) */}
                                {msg.role === 'model' && (
                                    <button 
                                        onClick={() => handleCopy(msg.text, idx)}
                                        className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-white bg-black/40 hover:bg-black/60 rounded-md transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 z-10"
                                        title="Copy to clipboard"
                                    >
                                        {copiedIndex === idx ? (
                                            <span className="text-[10px] font-bold text-green-400 flex items-center gap-1">
                                                <span>✓</span> COPIED
                                            </span>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                        )}
                                    </button>
                                )}

                                {/* Infographic Display */}
                                {msg.image && (
                                    <div className="mb-4 rounded-lg overflow-hidden border border-gray-700 shadow-lg relative group">
                                        <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 text-[10px] uppercase font-bold text-white backdrop-blur-md rounded">Generated Infographic</div>
                                        <img src={msg.image} alt="Generated Infographic" className="w-full h-auto max-h-[300px] object-cover hover:scale-105 transition-transform duration-700" />
                                    </div>
                                )}

                                {/* Text Content */}
                                <div className="prose prose-invert prose-sm max-w-none font-mono whitespace-pre-wrap">
                                    {msg.text}
                                </div>
                            </div>
                            <span className="text-[10px] uppercase text-gray-600 mt-1 px-1 font-bold tracking-wider">{msg.role === 'user' ? 'You' : 'Gemini 2.5'}</span>
                        </div>
                    ))}

                    {isBuilding && (
                        <div className="flex items-start animate-in fade-in">
                            <div className="bg-[#0a0a12]/90 border border-cyan-500/40 rounded-lg p-5 flex items-center gap-6 shadow-[0_0_20px_rgba(6,182,212,0.15)] backdrop-blur-md relative overflow-hidden">
                                {/* Scanning Line Effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>

                                {/* SVG Loader based on Mode */}
                                <div className="relative w-12 h-12 flex-shrink-0">
                                    {currentMode === 'TEXT' && (
                                        <svg viewBox="0 0 50 50" className="w-full h-full text-cyan-400" fill="none" stroke="currentColor">
                                            <circle cx="25" cy="25" r="22" strokeWidth="0.5" strokeDasharray="10 4" className="opacity-40 animate-[spin_4s_linear_infinite]" />
                                            <path d="M25 3 A22 22 0 0 1 47 25" strokeWidth="2" strokeLinecap="round" className="animate-spin origin-center" style={{ animationDuration: '1.5s' }} />
                                            <circle cx="25" cy="25" r="14" strokeWidth="1.5" className="text-purple-500 opacity-80 animate-spin-reverse origin-center" style={{ strokeDasharray: '4 8' }} />
                                            <circle cx="25" cy="25" r="4" className="fill-white animate-pulse" />
                                        </svg>
                                    )}
                                    {(currentMode === 'VIDEO' || currentMode === 'AUDIO' || currentMode === 'VOICE') && (
                                        <svg viewBox="0 0 50 50" className={`w-full h-full ${currentMode === 'VIDEO' ? 'text-purple-500' : 'text-orange-500'}`} fill="none" stroke="currentColor">
                                            <rect x="10" y="10" width="30" height="30" strokeWidth="2" className="animate-[spin_3s_linear_infinite]" />
                                            <rect x="15" y="15" width="20" height="20" strokeWidth="1" className="animate-[spin_2s_linear_infinite_reverse]" />
                                            <circle cx="25" cy="25" r="5" className="fill-white animate-pulse" />
                                        </svg>
                                    )}
                                </div>
                                
                                {/* Terminal Text Stream */}
                                <div className="flex flex-col justify-center h-12 z-10">
                                    <span className={`text-xs font-bold font-mono uppercase tracking-widest flex items-center gap-2 mb-1 ${currentMode === 'VIDEO' ? 'text-purple-400' : 'text-cyan-400'}`}>
                                        <span className={`w-2 h-2 rounded-full animate-ping ${currentMode === 'VIDEO' ? 'bg-purple-500' : 'bg-cyan-500'}`}></span>
                                        {currentMode} PROCESSING
                                    </span>
                                    <span className="text-[11px] text-gray-400 font-mono truncate w-56 border-r-2 border-cyan-500/50 pr-2 animate-pulse">
                                        {currentMode === 'VIDEO' ? VIDEO_LOADING_MESSAGES[loadingMsgIndex] : 
                                         (currentMode === 'AUDIO' || currentMode === 'VOICE') ? AUDIO_LOADING_MESSAGES[loadingMsgIndex] : 
                                         LOADING_MESSAGES[loadingMsgIndex]}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tech Stack Sidebar (Visible on Desktop) */}
                <div className="w-64 flex-shrink-0 hidden md:flex flex-col gap-6 p-5 border border-gray-800 bg-[#0a0a12]/50 backdrop-blur-sm rounded-lg overflow-y-auto custom-scrollbar">
                    <ConfigPanel />
                </div>
            </div>
        )}

        {/* Bottom: Input Area */}
        <div className="flex gap-3 h-12 md:h-14 shrink-0">
            <input 
                ref={inputRef}
                type="text" 
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isBuilding && handleGenerate()}
                placeholder={messages.length > 0 ? "Refine..." : "Task (e.g. 'Scrape stocks')"}
                className="flex-1 bg-[#0a0a12] border border-gray-700 rounded-lg px-4 md:px-6 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 font-mono text-sm transition-colors"
            />
            
            {messages.length > 0 && !isBuilding && (
                 <button 
                    onClick={() => handleGenerate(true)}
                    className="px-3 md:px-4 border border-gray-700 hover:border-white text-gray-400 hover:text-white rounded-lg transition-colors flex items-center justify-center"
                    title="Regenerate last response"
                 >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                 </button>
            )}

            <button 
                onClick={() => handleGenerate(false)}
                disabled={isBuilding}
                className={`${btnConfig.color} ${btnConfig.shadow} text-white font-bold px-4 md:px-8 rounded-lg uppercase tracking-wider text-xs transition-all flex items-center gap-2 ${isBuilding ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {isBuilding ? 'Wait' : btnConfig.text}
            </button>
        </div>

      </div>
    </div>
  );
};

export default PromptBuilder;
