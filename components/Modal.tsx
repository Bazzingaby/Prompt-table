import React, { useState, useRef, useEffect } from 'react';
import { Topic, Category } from '../types';
import { GoogleGenAI, Chat } from "@google/genai";

interface ModalProps {
  topic: Topic | null;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'model';
  text: string;
  image?: string;
}

type Tab = 'overview' | 'specs' | 'code' | 'examples';

const Modal: React.FC<ModalProps> = ({ topic, onClose }) => {
  const [generatedBg, setGeneratedBg] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Tutor Mode State
  const [isTutorMode, setIsTutorMode] = useState(false);
  const [tutorMessages, setTutorMessages] = useState<Message[]>([]);
  const [tutorInput, setTutorInput] = useState("");
  const [isTutorLoading, setIsTutorLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const tutorScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tutorScrollRef.current) {
        tutorScrollRef.current.scrollTop = tutorScrollRef.current.scrollHeight;
    }
  }, [tutorMessages, isTutorLoading]);

  if (!topic) return null;

  const getColor = (cat: string) => {
    switch (cat) {
      case Category.UNIVERSAL: return 'text-green-400 border-green-500';
      case Category.GEMINI: return 'text-pink-400 border-pink-500';
      case Category.OPENAI: return 'text-cyan-400 border-cyan-500';
      case Category.CLAUDE: return 'text-orange-400 border-orange-500';
      case Category.GROK: return 'text-gray-100 border-gray-400';
      case Category.PERPLEXITY: return 'text-teal-400 border-teal-500';
      case Category.OPENSOURCE: return 'text-yellow-400 border-yellow-500';
      case Category.COMMAND: return 'text-purple-400 border-purple-500';
      default: return 'text-white border-white';
    }
  };

  const themeColor = getColor(topic.category);
  const details = topic.details;

  // Determine available tabs
  const showSpecs = details?.thinking_levels || details?.when_to_use;
  const showCode = details?.configuration_code;
  const showExamples = details?.examples && details.examples.length > 0;
  
  // Reset state on topic change
  useEffect(() => {
    setActiveTab('overview');
    setIsTutorMode(false);
    setTutorMessages([]);
    setChatSession(null);
  }, [topic]);

  const handleGenerateBackground = async () => {
    if (!process.env.API_KEY) {
       setGeneratedBg("simulated");
       return;
    }

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Abstract, futuristic, neon digital art representing: "${topic.element}". Dark background, cyber aesthetic, high quality, 1k resolution.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
      });

      let imageUrl = null;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
      if (imageUrl) setGeneratedBg(imageUrl);
    } catch (e) {
      console.error(e);
      setGeneratedBg("simulated"); 
    } finally {
      setIsGenerating(false);
    }
  };

  const startTutorMode = async () => {
    setIsTutorMode(true);
    setIsTutorLoading(true);

    if (!process.env.API_KEY) {
        setTutorMessages([{ role: 'model', text: "Simulation: API Key missing. Please provide an API key to generate a real deep dive review and infographic."}]);
        setIsTutorLoading(false);
        return;
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // 1. Init Chat
        const systemInstruction = `You are an expert AI Tutor specialized in Prompt Engineering. 
        Topic: ${topic.element} (${topic.category}).
        
        GOAL: Provide a comprehensive Deep Dive Review of this topic.
        1. EXPLAIN: What is it? (ELI5 + Technical Depth).
        2. IMPORTANCE: Why does it matter?
        3. HOW-TO: Practical usage advice.
        
        Tone: Engaging, Futuristic, Educational. Use formatting.`;

        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction,
                tools: [{ googleSearch: {} }]
            }
        });
        setChatSession(chat);

        // 2. Generate Image (Parallel)
        const imagePromise = ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: `Futuristic neon infographic block diagram explaining the concept of "${topic.element}" in software engineering. Dark background, glowing cyan/purple lines, schematic style, text labels, high tech.` }] }
        });

        // 3. Generate Text (Initial Review)
        const textPromise = chat.sendMessage({ message: "Begin the deep dive review now." });

        const [imageRes, textRes] = await Promise.all([imagePromise, textPromise]);

        let imageUrl = undefined;
        for (const part of imageRes.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                imageUrl = `data:image/png;base64,${part.inlineData.data}`;
                break;
            }
        }

        setTutorMessages([{
            role: 'model',
            text: textRes.text || "Error generating text.",
            image: imageUrl
        }]);

    } catch (e) {
        console.error(e);
        setTutorMessages([{ role: 'model', text: "Error initializing Tutor Mode. Please check console." }]);
    } finally {
        setIsTutorLoading(false);
    }
  };

  const handleTutorSend = async (msgOverride?: string) => {
      const textToSend = msgOverride || tutorInput;
      if (!textToSend.trim() || !chatSession) return;
      
      if (!msgOverride) {
          setTutorMessages(prev => [...prev, { role: 'user', text: textToSend }]);
          setTutorInput("");
      }
      
      setIsTutorLoading(true);

      try {
          const res = await chatSession.sendMessage({ message: textToSend });
          setTutorMessages(prev => [...prev, { role: 'model', text: res.text }]);
      } catch (e) {
          console.error(e);
          setTutorMessages(prev => [...prev, { role: 'model', text: "Error sending message." }]);
      } finally {
          setIsTutorLoading(false);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className={`relative w-full max-w-6xl h-[90vh] overflow-hidden bg-[#0a0a12] border-2 ${themeColor} shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-lg flex flex-col md:flex-row transition-all duration-500`}
        role="dialog"
        style={generatedBg && generatedBg !== 'simulated' ? { 
            backgroundImage: `linear-gradient(rgba(10,10,18,0.95), rgba(10,10,18,0.95)), url(${generatedBg})`,
            backgroundSize: 'cover'
        } : {}}
      >
        {/* Nano Banana Simulated BG */}
        {generatedBg === 'simulated' && (
            <div className="absolute inset-0 z-0 opacity-20 bg-[conic-gradient(at_top,var(--tw-gradient-stops))] from-pink-900 via-purple-900 to-black animate-pulse"></div>
        )}

        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 text-gray-400 hover:text-white bg-black/20 rounded-full hover:bg-black/50 transition-all">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Sidebar */}
        <div className={`p-8 md:w-1/3 border-b md:border-b-0 md:border-r border-gray-800 bg-gradient-to-b from-gray-900/50 to-transparent flex flex-col relative z-10 overflow-y-auto shrink-0`}>
          <div className={`text-7xl font-mono font-bold ${themeColor} opacity-90 mb-2 tracking-tighter`}>
            {topic.symbol}
          </div>
          <h2 className="text-4xl font-bold text-white mb-2 font-[Rajdhani] uppercase tracking-wide leading-none">{topic.element}</h2>
          <span className={`inline-block px-3 py-1 text-xs font-bold border ${themeColor} rounded-full mb-6 self-start uppercase`}>
            {topic.category}
          </span>
          
          <div className="mb-8">
            <h3 className="text-xs uppercase text-gray-500 font-bold mb-2 tracking-widest">Usage Syntax</h3>
            <div className={`font-mono text-sm ${themeColor} bg-white/5 p-3 rounded border border-white/10 break-words`}>
               {topic.usage}
            </div>
          </div>

          <p className="text-gray-300 text-sm leading-relaxed font-mono mb-8">
            {topic.description}
          </p>

          {/* Generator Button for Gemini BG */}
          {topic.category === Category.GEMINI && !generatedBg && (
              <button 
                onClick={handleGenerateBackground}
                disabled={isGenerating}
                className={`mt-auto py-3 px-4 border ${themeColor} text-xs uppercase font-bold tracking-widest hover:bg-white/10 transition-colors flex items-center justify-center gap-2 rounded`}
              >
                 {isGenerating ? "Generating..." : "⚡ Generate Neural BG"}
              </button>
          )}
        </div>

        {/* Main Content Area */}
        <div className="md:w-2/3 flex flex-col bg-[#0f0e17]/50 relative z-10 h-full">
          
          {!isTutorMode ? (
            <>
                {/* Tabs Header */}
                <div className="flex border-b border-gray-800 shrink-0">
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className={`px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'overview' ? 'text-white border-b-2 ' + themeColor.split(' ')[1] : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Overview
                    </button>
                    {showSpecs && (
                        <button 
                            onClick={() => setActiveTab('specs')}
                            className={`px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'specs' ? 'text-white border-b-2 ' + themeColor.split(' ')[1] : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Specs
                        </button>
                    )}
                    {showCode && (
                        <button 
                            onClick={() => setActiveTab('code')}
                            className={`px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'code' ? 'text-white border-b-2 ' + themeColor.split(' ')[1] : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Config
                        </button>
                    )}
                    {showExamples && (
                        <button 
                            onClick={() => setActiveTab('examples')}
                            className={`px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'examples' ? 'text-white border-b-2 ' + themeColor.split(' ')[1] : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Examples
                        </button>
                    )}
                </div>

                {/* Tab Content */}
                <div className="p-8 overflow-y-auto flex-grow custom-scrollbar">
                    
                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 h-full flex flex-col">
                        {details ? (
                            <>
                                <div className="border-l-4 border-gray-700 pl-4">
                                    <h3 className={`text-lg font-bold ${themeColor} uppercase mb-1`}>{details.title || topic.element}</h3>
                                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">{details.subtitle}</p>
                                    <p className="text-gray-300 leading-relaxed">{details.body || topic.description}</p>
                                </div>

                                {details.best_practices && (
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-400 uppercase mb-3">Best Practices</h4>
                                        <ul className="space-y-2">
                                            {details.best_practices.map((bp, i) => (
                                                <li key={i} className="flex items-start text-sm text-gray-300 bg-white/5 p-2 rounded">
                                                    <span className={`mr-2 mt-1 w-1.5 h-1.5 ${themeColor.split(' ')[0].replace('text', 'bg')} rounded-full flex-shrink-0`}></span>
                                                    {bp}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                
                                {details.critical_note && (
                                    <div className="p-4 bg-red-900/20 border border-red-500/30 rounded text-red-200 text-sm flex gap-3">
                                        <span className="text-xl">⚠️</span>
                                        <div>
                                            <strong className="block text-xs uppercase text-red-400 mb-1">Critical Note</strong>
                                            {details.critical_note}
                                        </div>
                                    </div>
                                )}

                                {/* TUTOR MODE BUTTON */}
                                <div className="mt-8 pt-8 border-t border-gray-800">
                                    <button 
                                        onClick={startTutorMode}
                                        className={`w-full py-4 border-2 border-dashed ${themeColor} bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-widest transition-all rounded-lg flex flex-col items-center gap-2 group`}
                                    >
                                        <span className="text-sm">Generate Detailed Review & Infographic</span>
                                        <span className="text-[10px] opacity-60 font-mono group-hover:opacity-100">AI Deep Dive • Research • Visual Learning</span>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <p>No detailed guide available for this element.</p>
                                <button 
                                    onClick={startTutorMode}
                                    className={`mt-4 px-6 py-2 border ${themeColor} rounded hover:bg-white/5 text-xs uppercase font-bold`}
                                >
                                    Force Generate Guide
                                </button>
                            </div>
                        )}
                        </div>
                    )}

                    {/* SPECS TAB */}
                    {activeTab === 'specs' && details && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            {details.thinking_levels && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">Thinking Levels</h3>
                                    <div className="grid gap-3">
                                        {details.thinking_levels.map((level, i) => (
                                            <div key={i} className="bg-white/5 p-3 rounded border border-white/5 flex flex-col md:flex-row gap-4">
                                                <code className={`text-sm font-mono font-bold ${themeColor} whitespace-nowrap`}>{level.keyword}</code>
                                                <p className="text-sm text-gray-300">{level.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {details.when_to_use && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">When to Use</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm text-gray-400">
                                            <thead className="text-xs uppercase bg-white/5 text-gray-200">
                                                <tr>
                                                    <th className="p-2">Level/Mode</th>
                                                    <th className="p-2">Use Case</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-800">
                                                {details.when_to_use.map((item, i) => (
                                                    <tr key={i}>
                                                        <td className={`p-3 font-mono ${themeColor}`}>{item.level}</td>
                                                        <td className="p-3">{item.description || item.use_cases}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* CODE TAB */}
                    {activeTab === 'code' && details && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 h-full flex flex-col">
                            <div className="bg-[#1e1e2e] p-4 rounded-lg border border-gray-700 font-mono text-sm text-blue-300 overflow-x-auto whitespace-pre">
                                {details.configuration_code}
                            </div>
                            <p className="mt-4 text-xs text-gray-500">
                                Copy this configuration into your SDK initialization options.
                            </p>
                        </div>
                    )}

                    {/* EXAMPLES TAB */}
                    {activeTab === 'examples' && details?.examples && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            {details.examples.map((ex, i) => {
                                const isPoor = ex.type.toLowerCase() === 'poor';
                                const colorClass = isPoor ? 'text-red-400 border-red-900/50 bg-red-950/20' : 'text-green-400 border-green-900/50 bg-green-950/20';
                                return (
                                    <div key={i} className="group">
                                        <div className={`flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider ${isPoor ? 'text-red-500' : 'text-green-500'}`}>
                                            <div className={`w-2 h-2 rounded-full ${isPoor ? 'bg-red-500' : 'bg-green-500'} animate-pulse`}></div>
                                            {ex.type} Example
                                        </div>
                                        <div className={`p-4 rounded border font-mono text-sm shadow-inner whitespace-pre-wrap ${colorClass}`}>
                                            {ex.content}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </>
          ) : (
            // --- TUTOR MODE UI ---
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/30">
                    <div>
                        <h3 className={`text-lg font-bold ${themeColor} uppercase tracking-widest`}>AI Tutor Deep Dive</h3>
                        <p className="text-[10px] text-gray-500 font-mono">Gemini 2.5 • Researching • Visualizing</p>
                    </div>
                    <button 
                        onClick={() => handleTutorSend("Regenerate the entire review with a different focus.")}
                        className="text-xs text-gray-400 hover:text-white uppercase font-bold tracking-wider px-3 py-1 border border-gray-700 rounded hover:bg-white/5"
                    >
                        Regenerate
                    </button>
                </div>

                {/* Messages Area */}
                <div 
                    ref={tutorScrollRef}
                    className="flex-grow p-6 overflow-y-auto custom-scrollbar space-y-6 bg-[#0a0a0f]/80 relative"
                >
                    {tutorMessages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            
                            {/* Infographic (Only for Model) */}
                            {msg.image && (
                                <div className="w-full mb-6 rounded-lg overflow-hidden border border-gray-700 relative group animate-in zoom-in-95 duration-700">
                                    <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 text-[10px] uppercase font-bold text-white backdrop-blur-md rounded">Generated Infographic</div>
                                    <img src={msg.image} alt="Tutor Infographic" className="w-full h-auto max-h-[350px] object-cover object-top hover:scale-105 transition-transform duration-700" />
                                </div>
                            )}

                            <div className={`max-w-[95%] rounded-lg p-5 ${msg.role === 'user' ? 'bg-white/10 text-white' : 'bg-transparent text-gray-200'}`}>
                                <div className="prose prose-invert prose-sm max-w-none font-mono whitespace-pre-wrap leading-relaxed">
                                    {msg.text}
                                </div>
                            </div>
                        </div>
                    ))}

                    {isTutorLoading && (
                        <div className="flex items-center gap-4 p-6 bg-black/20 rounded-lg border border-white/5 mx-4 backdrop-blur-sm">
                            <div className="relative w-10 h-10 flex-shrink-0">
                                {/* Outer Ring */}
                                <div className={`absolute inset-0 border-2 ${themeColor.split(' ')[1]} border-t-transparent border-l-transparent rounded-full animate-spin`}></div>
                                {/* Inner Ring */}
                                <div className="absolute inset-2 border-2 border-white/20 border-b-transparent border-r-transparent rounded-full animate-spin-reverse"></div>
                                {/* Core */}
                                <div className={`absolute inset-0 m-auto w-2 h-2 ${themeColor.split(' ')[0].replace('text', 'bg')} rounded-full animate-pulse shadow-[0_0_10px_currentColor]`}></div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className={`text-xs font-bold font-mono ${themeColor} uppercase tracking-widest animate-pulse`}>
                                    Deep Dive in Progress
                                </span>
                                <span className="text-[10px] text-gray-500 font-mono">
                                    // Accessing global knowledge base...
                                    <br/>
                                    // Formatting infographic data...
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-[#0a0a12] border-t border-gray-800">
                    <div className={`flex items-center gap-2 border-2 border-dashed ${themeColor} bg-[#050510] rounded-lg p-1`}>
                        <input 
                            type="text" 
                            value={tutorInput}
                            onChange={(e) => setTutorInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleTutorSend()}
                            placeholder="Ask a follow-up question..."
                            className="flex-1 bg-transparent border-none text-white px-4 py-2 focus:ring-0 text-sm font-mono placeholder-gray-600"
                        />
                        <button 
                            onClick={() => handleTutorSend()}
                            disabled={isTutorLoading}
                            className={`px-4 py-2 ${themeColor.split(' ')[0].replace('text', 'bg')} text-black font-bold uppercase text-xs rounded hover:opacity-90 transition-opacity`}
                        >
                            Send
                        </button>
                    </div>
                </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Modal;