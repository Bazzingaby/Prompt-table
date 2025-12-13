
import React, { useState, useRef, useEffect } from 'react';
import { Topic, Category, PlanData } from '../types';
import { GoogleGenAI, Chat } from "@google/genai";
import { ambientEngine } from '../utils/audioEngine';
import Whiteboard from './Whiteboard';

interface PromptBuilderProps {
  selectedTopics: Topic[];
  onRemove: (topic: Topic) => void;
  onExpandStateChange?: (isExpanded: boolean) => void;
}

interface Message {
  role: 'user' | 'model';
  text: string;
  image?: string;
  plan?: PlanData; // Stores plan data if this message is a plan
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
  const [isConfigOpen, setIsConfigOpen] = useState(false); 
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  // Whiteboard State
  const [whiteboardData, setWhiteboardData] = useState<{ content: string | PlanData, mode: 'text' | 'plan' } | null>(null);
  
  // Configuration State
  const [selectedTech, setSelectedTech] = useState<string[]>([]);
  const [targetModel, setTargetModel] = useState<string>('Gemini 3.0 Pro');
  const [outputType, setOutputType] = useState<string>('Refined Prompt');

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  let currentMode: GenerationMode = 'TEXT';
  if (modifiers.some(t => t.category === Category.VIDEO)) currentMode = 'VIDEO';
  else if (modifiers.some(t => t.category === Category.AUDIO)) currentMode = 'AUDIO';
  else if (modifiers.some(t => t.category === Category.VOICE)) currentMode = 'VOICE';

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

  useEffect(() => {
    if (scrollRef.current && !isConfigOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isBuilding, isExpanded, isConfigOpen]);

  useEffect(() => {
      if (isExpanded && inputRef.current) {
          inputRef.current.focus();
      }
  }, [isExpanded]);

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
    const systemInstruction = `You are an expert AI Prompt Engineer.
    Selected Techniques: ${techniques}
    Stack: ${selectedTech.join(', ') || "None"}
    Target: ${targetModel}`;

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
        const prompt = `Futuristic neon UI block diagram infographic explaining: ${concepts}. Dark background, cyan/purple lines.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] }
        });
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
      } catch (e) { console.error("Infographic error:", e); }
      return null;
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
    }
    setIsBuilding(false);
    setMessages(prev => [...prev, { role: 'model', text: "\n// GENERATION STOPPED BY USER." }]);
    ambientEngine.playSFX('close');
  };

  const handleGenerate = async (isRegen = false, overridePrompt?: string, overrideImage?: string) => {
    const promptText = overridePrompt || userPrompt.trim();
    if (!promptText && !isRegen && !overrideImage) return;

    ambientEngine.playSFX('activate');
    if (!isExpanded) toggleExpand();
    
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsBuilding(true);
    setLoadingMsgIndex(0);
    
    if (!isRegen && !overridePrompt) setUserPrompt('');
    if (!isRegen) {
        setMessages(prev => [...prev, { 
            role: 'user', 
            text: overrideImage ? "Applying visual refinements..." : promptText,
            image: overrideImage
        }]);
    }

    try {
        if (!process.env.API_KEY) {
            setTimeout(() => {
                setMessages(prev => [...prev, { role: 'model', text: "// SIMULATION: API KEY MISSING." }]);
                setIsBuilding(false);
            }, 2000);
            return;
        }

        let chat = chatSession;
        if (!chat || messages.length === 0) {
            const chatInit = await initializeChat();
            if (chatInit) {
                chat = chatInit;
                setChatSession(chat);
            }
        }
        if (!chat) throw new Error("Chat init failed");

        let parts: any[] = [{ text: isRegen ? "Regenerate." : promptText }];
        if (overrideImage) {
            parts = [
                { text: "Here is an annotated feedback image. Please refine the output based on the highlights and notes visible in this image." },
                { inlineData: { mimeType: 'image/png', data: overrideImage.split(',')[1] } }
            ];
        }

        const [textResult, imageResult] = await Promise.all([
            chat.sendMessage({ message: overrideImage ? parts : promptText }), // Simplified message handling for text/multimodal
            (messages.length === 0 && !isRegen && currentMode === 'TEXT') ? generateInfographic() : Promise.resolve(null)
        ]);

        setMessages(prev => [...prev, { 
            role: 'model', 
            text: textResult.text, 
            image: imageResult || undefined 
        }]);

    } catch (e: any) {
        if (e.message !== "Aborted") {
            setMessages(prev => [...prev, { role: 'model', text: "Error: Could not generate content." }]);
        }
    } finally {
        if (abortControllerRef.current === controller) setIsBuilding(false);
    }
  };

  const handleGeneratePlan = async () => {
      if (!process.env.API_KEY) return;
      
      const lastContext = messages.filter(m => m.role === 'model').pop()?.text || userPrompt;
      setIsBuilding(true);
      
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = `Based on this context: "${lastContext.substring(0, 500)}...", generate a step-by-step execution plan as a JSON object.
          Structure: { title: "string", steps: [{ id: "1", label: "string", type: "start|process|decision|end", details: "string" }] }.
          Max 6 steps.`;

          const result = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: { parts: [{ text: prompt }] },
              config: { responseMimeType: 'application/json' }
          });

          const planData = JSON.parse(result.text || "{}");
          
          setMessages(prev => [...prev, { 
              role: 'model', 
              text: "Generating execution blueprint...", 
              plan: planData
          }]);

          // Open whiteboard immediately with plan
          setWhiteboardData({ content: planData, mode: 'plan' });

      } catch (e) {
          console.error("Plan generation failed", e);
          setMessages(prev => [...prev, { role: 'model', text: "Error generating plan structure." }]);
      } finally {
          setIsBuilding(false);
      }
  };

  const handleRefineFromWhiteboard = (image: string, notes: string) => {
      handleGenerate(false, `Refinement notes: ${notes}`, image);
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    ambientEngine.playSFX('click');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

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
      
      {/* Actions */}
      <div className="mt-8 border-t border-gray-800 pt-4">
           <button 
             onClick={handleGeneratePlan}
             disabled={messages.length === 0 || isBuilding}
             className="w-full py-3 bg-cyan-900/30 border border-cyan-500 text-cyan-400 font-bold uppercase text-[10px] tracking-widest rounded hover:bg-cyan-900/50 transition-all mb-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
           >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
              Generate Plan
           </button>
      </div>
    </>
  );

  const collapsedHeight = 'h-[220px] md:h-32'; 

  return (
    <>
    <div className={`fixed bottom-0 left-0 right-0 z-40 border-t border-cyan-500/30 bg-[#050510]/95 backdrop-blur-xl transition-all duration-500 ease-in-out flex flex-col ${isExpanded ? 'h-[85vh]' : collapsedHeight}`}>
      
      {/* Handle */}
      <div 
        className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-[#050510] border border-cyan-500/30 border-b-0 px-8 py-1 rounded-t-xl cursor-pointer flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest hover:bg-cyan-900/20 transition-all"
        onClick={toggleExpand}
      >
        <span>Prompt Builder</span>
        <span className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>▲</span>
      </div>

      {/* Main Container */}
      <div className="container mx-auto h-full flex flex-col p-4 md:p-6 gap-4">
        
        {/* --- REACTION CHAMBER VISUALIZATION --- */}
        <div className="flex-shrink-0 relative bg-[#0a0a12] border border-gray-800 rounded-xl p-3 flex items-center justify-between min-h-[80px] overflow-hidden">
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
                        <div className="absolute inset-y-2 left-0 right-0 bg-gradient-to-r from-cyan-500/20 via-cyan-500 to-cyan-500/20 rounded-full animate-pulse"></div>
                    </div>
                )}
           </div>

           {/* RIGHT: MODIFIER */}
           <div className="flex items-center justify-end gap-2 overflow-x-auto custom-scrollbar px-2 z-10 w-1/3">
                <div className="border-2 border-dashed border-gray-700 rounded-lg px-2 md:px-4 py-2 text-gray-500 text-[10px] md:text-xs font-mono uppercase tracking-widest whitespace-nowrap">
                    {currentMode}
                </div>
           </div>
        </div>

        {/* Middle: Workspace */}
        {isExpanded && (
            <div className="flex-grow flex gap-4 overflow-hidden animate-in fade-in slide-in-from-bottom-4 relative">
                <div 
                    ref={scrollRef}
                    className="flex-1 border-2 border-dashed border-gray-800 bg-[#0a0a12]/50 rounded-lg p-6 overflow-y-auto custom-scrollbar space-y-6 relative"
                >
                    {messages.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 opacity-50 pointer-events-none">
                            <div className="text-6xl mb-4 grayscale opacity-50">🧬</div>
                            <p className="font-mono text-sm uppercase tracking-widest">Workspace Ready</p>
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-4 group`}>
                            <div className={`max-w-[90%] md:max-w-[80%] rounded-lg p-4 relative ${msg.role === 'user' ? 'bg-cyan-900/20 border border-cyan-500/30 text-cyan-100' : 'bg-gray-800/50 border border-gray-700 text-gray-200'}`}>
                                
                                {msg.role === 'model' && (
                                    <div className="absolute top-2 right-2 flex gap-2">
                                        <button 
                                            onClick={() => {
                                                if (msg.plan) setWhiteboardData({ content: msg.plan, mode: 'plan' });
                                                else setWhiteboardData({ content: msg.text, mode: 'text' });
                                            }}
                                            className="p-1.5 text-gray-400 hover:text-cyan-400 bg-black/40 hover:bg-black/60 rounded-md transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                            title="Annotate in Blueprint Mode"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                        <button 
                                            onClick={() => handleCopy(msg.text, idx)}
                                            className="p-1.5 text-gray-400 hover:text-white bg-black/40 hover:bg-black/60 rounded-md transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                        >
                                            {copiedIndex === idx ? <span className="text-[10px] font-bold text-green-400">✓</span> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
                                        </button>
                                    </div>
                                )}

                                {/* Blueprint Plan Card */}
                                {msg.plan && (
                                    <div 
                                        onClick={() => setWhiteboardData({ content: msg.plan!, mode: 'plan' })}
                                        className="mb-4 bg-[#050510] border border-cyan-500/50 rounded p-4 cursor-pointer hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all group/card"
                                    >
                                        <div className="flex items-center gap-3 mb-2 text-cyan-400 uppercase font-bold text-xs tracking-widest">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                                            Algorithm Blueprint
                                        </div>
                                        <div className="text-gray-300 font-bold text-lg mb-2">{msg.plan.title}</div>
                                        <div className="flex gap-2">
                                            {msg.plan.steps.slice(0,3).map(s => (
                                                <div key={s.id} className="w-2 h-2 rounded-full bg-cyan-500/50"></div>
                                            ))}
                                            <span className="text-xs text-gray-500">+{msg.plan.steps.length} Steps</span>
                                        </div>
                                        <div className="mt-3 text-center text-xs text-gray-500 group-hover/card:text-cyan-400 uppercase font-bold tracking-widest">Click to Open Visualizer</div>
                                    </div>
                                )}

                                {msg.image && (
                                    <div className="mb-4 rounded-lg overflow-hidden border border-gray-700 shadow-lg relative group">
                                        <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 text-[10px] uppercase font-bold text-white backdrop-blur-md rounded">Refinement Image</div>
                                        <img src={msg.image} alt="Generated Infographic" className="w-full h-auto max-h-[300px] object-cover" />
                                    </div>
                                )}

                                <div className="prose prose-invert prose-sm max-w-none font-mono whitespace-pre-wrap">
                                    {msg.text}
                                </div>
                            </div>
                        </div>
                    ))}

                    {isBuilding && (
                        <div className="flex items-start animate-in fade-in">
                            <div className="bg-[#0a0a12]/90 border border-cyan-500/40 rounded-lg p-5 flex items-center gap-6 shadow-[0_0_20px_rgba(6,182,212,0.15)] backdrop-blur-md relative overflow-hidden">
                                <div className="relative w-12 h-12 flex-shrink-0">
                                   <svg viewBox="0 0 50 50" className="w-full h-full text-cyan-400" fill="none" stroke="currentColor">
                                        <circle cx="25" cy="25" r="22" strokeWidth="0.5" strokeDasharray="10 4" className="opacity-40 animate-[spin_4s_linear_infinite]" />
                                        <circle cx="25" cy="25" r="14" strokeWidth="1.5" className="text-purple-500 opacity-80 animate-spin-reverse origin-center" style={{ strokeDasharray: '4 8' }} />
                                    </svg>
                                </div>
                                <div className="flex flex-col justify-center h-12 z-10">
                                    <span className="text-xs font-bold font-mono uppercase tracking-widest flex items-center gap-2 mb-1 text-cyan-400">
                                        PROCESSING
                                    </span>
                                    <span className="text-[11px] text-gray-400 font-mono animate-pulse">
                                        {LOADING_MESSAGES[loadingMsgIndex]}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

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
                 >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                 </button>
            )}

            {isBuilding ? (
                 <button onClick={handleStop} className="bg-red-600 hover:bg-red-500 text-white font-bold px-8 rounded-lg uppercase tracking-wider text-xs animate-pulse">STOP</button>
            ) : (
                <button 
                    onClick={() => handleGenerate(false)}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-8 rounded-lg uppercase tracking-wider text-xs transition-all shadow-[0_0_20px_rgba(8,145,178,0.4)]"
                >
                    Generate
                </button>
            )}
        </div>
      </div>
    </div>

    {/* WHITEBOARD MODAL */}
    {whiteboardData && (
        <Whiteboard 
            content={whiteboardData.content} 
            mode={whiteboardData.mode}
            onRefine={handleRefineFromWhiteboard}
            onClose={() => setWhiteboardData(null)} 
        />
    )}
    </>
  );
};

export default PromptBuilder;
