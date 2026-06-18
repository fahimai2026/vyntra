import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Settings, RefreshCw, Cpu, Image as ImageIcon, Mic, X, Zap, Globe, Code, Volume2, VolumeX, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../hooks/useAuth';
import Markdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachment?: {
    mimeType: string;
    data: string; // Base64
  };
  groundingMetadata?: any;
}

interface TwinConfig {
  id: number;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  personalityProfile: string | null;
  postCountAnalyzed: number;
}

export function VyntraAIView() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Hello! I am VYNTRA AI. I can help you summarize feeds, translate posts, discover communities, or answer any questions. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTwinSettings, setShowTwinSettings] = useState(false);
  
  // New features
  const [modelType, setModelType] = useState<'flash' | 'pro' | 'lite' | 'pro-thinking' | 'flash-image' | 'pro-image'>('flash');
  const [useSearch, setUseSearch] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [selectedFile, setSelectedFile] = useState<{ mimeType: string, url: string, base64: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const [twinConfig, setTwinConfig] = useState<TwinConfig | null>(null);
  const [loadingTwin, setLoadingTwin] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (showTwinSettings && user) {
      loadTwinConfig();
    }
  }, [showTwinSettings, user]);

  const loadTwinConfig = async () => {
    setLoadingTwin(true);
    try {
      const res = await fetch(`/api/users/${user?.uid}/twin`);
      if (res.ok) {
        const data = await res.json();
        setTwinConfig(data);
        if (data.isSyncing) {
          // Poll if still syncing
          setTimeout(loadTwinConfig, 3000);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTwin(false);
    }
  };

  const syncTwin = async () => {
    if (!user) return;
    setTwinConfig(prev => prev ? { ...prev, isSyncing: true } : null);
    try {
      await fetch(`/api/users/${user.uid}/twin/sync`, { method: 'POST' });
      // Poll to get updated status
      setTimeout(loadTwinConfig, 3000);
    } catch (e) {
      console.error(e);
      setTwinConfig(prev => prev ? { ...prev, isSyncing: false } : null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          const res = evt.target.result as string;
          const data = res.split(',')[1];
          setSelectedFile({
            mimeType: file.type,
            url: res,
            base64: data
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }
    
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Speech recognition not supported in this browser. Please use Chrome/Safari.");
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + text);
        setIsRecording(false);
        // Automatically send the voice query
        handleSend(text);
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setIsRecording(false);
      console.error(err);
    }
  };

  const handleSend = async (voiceTextOverride?: string | any) => {
    const isOverrideStr = typeof voiceTextOverride === 'string';
    const finalInput = isOverrideStr ? voiceTextOverride : input;
    if ((!finalInput.trim() && !selectedFile) || isLoading) return;
    
    const userMessage: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: finalInput.trim(),
      attachment: selectedFile ? { mimeType: selectedFile.mimeType, data: selectedFile.base64 } : undefined
    };
    
    setMessages(prev => [...prev, userMessage]);
    if (!isOverrideStr) setInput('');
    setSelectedFile(null);
    setIsLoading(true);

    try {
      // Build parts payload
      let parts: any[] = [];
      if (userMessage.attachment) {
        parts.push({
          inlineData: { mimeType: userMessage.attachment.mimeType, data: userMessage.attachment.data }
        });
      }
      if (userMessage.content) {
        parts.push({ text: userMessage.content });
      }

      // Format history (exclude the very first greeting dummy since it isn't generated)
      const historyToSend = messages.length > 1 ? messages.slice(1, -1) : [];

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: parts.length === 0 ? "Hello" : undefined,
          parts: parts.length > 0 ? parts : undefined,
          history: historyToSend,
          modelType,
          useSearch,
          imageSize
        })
      });
      
      const data = await response.json();
      
      if (data.error) throw new Error(data.error);
      
      const newMsgId = Date.now().toString();

      // If voice output is desired, we can use speech synthesis (lightweight, client-side TTS)
      if ((voiceMode || isOverrideStr) && data.reply) {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(data.reply);
          // basic clean up for markdown formatting to make speech better
          utterance.text = data.reply.replace(/[*#_`]/g, '');
          
          // Basic auto-detection for TTS based on text content
          if (/[\u0980-\u09FF]/.test(data.reply)) {
            utterance.lang = 'bn-IN';
          } else if (/[\u0900-\u097F]/.test(data.reply)) {
            utterance.lang = 'hi-IN';
          } else if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(data.reply)) {
            utterance.lang = 'ja-JP'; 
          }
          // The browser will attempt to use its default and auto-detect mechanism if not overridden

          utterance.onstart = () => setSpeakingMsgId(newMsgId);
          utterance.onend = () => setSpeakingMsgId(null);
          utterance.onerror = () => setSpeakingMsgId(null);
          // If query was Bengali, we could switch based on detection, but standard browser handles auto if lang allows.
          window.speechSynthesis.speak(utterance);
        }
      }
      
      const assistantMsg: Message = { id: newMsgId, role: 'assistant', content: data.reply || "", groundingMetadata: data.groundingMetadata };
      if (data.outputImage) {
         // Reusing attachment rendering logic for output images
         assistantMsg.attachment = {
            mimeType: "image/png",
            data: data.outputImage.split(',')[1] // extract base64 part
         };
      }
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e: any) {
      console.error(e);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'Sorry, I encountered an error communicating with the server.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (showTwinSettings) {
    return (
      <div className="flex flex-col h-full w-full bg-vyntra-bg relative overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-vyntra-surface/80 backdrop-blur-md border-b border-white/5 p-4 flex items-center gap-3">
          <button onClick={() => setShowTwinSettings(false)} className="text-vyntra-text-sec hover:text-white transition-colors">
            ←
          </button>
          <Cpu className="text-vyntra-primary" size={24} />
          <h2 className="font-bold text-lg tracking-wider text-white">AI TWIN CONFIGURATION</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 text-white custom-scrollbar">
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-4 mb-8">
              <div className="w-20 h-20 bg-vyntra-primary/20 rounded-full flex items-center justify-center mx-auto border border-vyntra-primary/30">
                <Cpu size={40} className="text-vyntra-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Your AI Twin</h3>
                <p className="text-vyntra-text-sec mt-2">Train your personal AI to understand your style, preferences, and content history.</p>
              </div>
            </div>

            {loadingTwin && !twinConfig ? (
              <div className="flex justify-center p-8">
                <Loader2 className="animate-spin text-vyntra-primary" size={32} />
              </div>
            ) : twinConfig ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-vyntra-text-sec uppercase tracking-wider mb-2">Sync Status</h4>
                  <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      {twinConfig.isSyncing ? (
                        <RefreshCw className="text-vyntra-primary animate-spin" size={20} />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                      )}
                      <div>
                        <div className="font-bold">
                          {twinConfig.isSyncing ? "Syncing history..." : "Ready"}
                        </div>
                        <div className="text-xs text-vyntra-text-sec mt-1">
                          {twinConfig.lastSyncedAt ? `Last synced: ${new Date(twinConfig.lastSyncedAt).toLocaleString()}` : "Never synced"}
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={syncTwin}
                      disabled={twinConfig.isSyncing}
                      className="px-4 py-2 bg-vyntra-primary/20 text-vyntra-primary font-bold rounded-lg border border-vyntra-primary/30 hover:bg-vyntra-primary/30 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <RefreshCw size={16} className={twinConfig.isSyncing ? "animate-spin" : ""} />
                      {twinConfig.isSyncing ? "Training..." : "Sync Posts"}
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-vyntra-text-sec uppercase tracking-wider mb-2">Personality Profile</h4>
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                    {twinConfig.personalityProfile ? (
                      <p className="text-sm leading-relaxed">{twinConfig.personalityProfile}</p>
                    ) : (
                      <p className="text-sm text-vyntra-text-sec italic">No profile generated yet. Sync your posts to train your Twin.</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5 text-center">
                    <div className="text-2xl font-bold text-white mb-1">{twinConfig.postCountAnalyzed}</div>
                    <div className="text-xs text-vyntra-text-sec uppercase tracking-wider">Posts Analyzed</div>
                  </div>
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5 text-center">
                    <div className="text-2xl font-bold text-white mb-1">Active</div>
                    <div className="text-xs text-vyntra-text-sec uppercase tracking-wider">Twin Status</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-vyntra-text-sec p-8">Failed to load twin configuration.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-vyntra-bg relative overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-vyntra-surface/80 backdrop-blur-md border-b border-white/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Bot className="text-vyntra-primary" size={24} />
          <h2 className="font-bold text-lg tracking-wider text-white">VYNTRA AI</h2>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
          <div className="flex bg-black/40 rounded-full border border-white/10 p-0.5 shrink-0">
            <button 
              onClick={() => setModelType('flash')}
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-colors ${modelType === 'flash' ? 'bg-vyntra-primary text-white' : 'text-vyntra-text-sec hover:text-white'}`}
              title="general tasks"
            >
              <Zap size={12} /> Flash
            </button>
            <button 
              onClick={() => setModelType('lite')}
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-colors ${modelType === 'lite' ? 'bg-vyntra-primary text-white' : 'text-vyntra-text-sec hover:text-white'}`}
              title="low-latency responses"
            >
              <Zap size={10} /> Lite
            </button>
            <button 
              onClick={() => setModelType('pro')}
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-colors ${modelType === 'pro' ? 'bg-vyntra-secondary text-vyntra-bg' : 'text-vyntra-text-sec hover:text-white'}`}
              title="complex tasks"
            >
              <Code size={12} /> Pro
            </button>
            <button 
              onClick={() => setModelType('pro-thinking')}
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-colors ${modelType === 'pro-thinking' ? 'bg-vyntra-secondary text-vyntra-bg' : 'text-vyntra-text-sec hover:text-white'}`}
              title="high thinking mode"
            >
              <Bot size={12} /> High Thinking
            </button>
            <button 
              onClick={() => setModelType('flash-image')}
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-colors ${modelType === 'flash-image' ? 'bg-vyntra-primary text-white' : 'text-vyntra-text-sec hover:text-white'}`}
              title="Image Gen (Flash)"
            >
              <ImageIcon size={12} /> Img (F)
            </button>
            <button 
              onClick={() => setModelType('pro-image')}
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-colors ${modelType === 'pro-image' ? 'bg-vyntra-secondary text-vyntra-bg' : 'text-vyntra-text-sec hover:text-white'}`}
              title="Image Gen (Pro)"
            >
              <ImageIcon size={12} /> Img (P)
            </button>
          </div>
          {(modelType === 'flash-image' || modelType === 'pro-image') && (
              <select 
                value={imageSize}
                onChange={(e: any) => setImageSize(e.target.value)}
                className="bg-black/50 border border-white/10 text-white text-xs rounded-full px-2 py-1 outline-none"
              >
                <option value="1K">1K</option>
                <option value="2K">2K</option>
                <option value="4K">4K</option>
              </select>
          )}
          <button
            onClick={() => setUseSearch(!useSearch)}
            className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-1 shrink-0 transition-colors ${useSearch ? 'border-vyntra-primary bg-vyntra-primary/20 text-vyntra-primary' : 'border-white/10 text-vyntra-text-sec hover:text-white'}`}
          >
            <Globe size={12} /> Web Search
          </button>
          <button
            onClick={() => setVoiceMode(!voiceMode)}
            className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-1 shrink-0 transition-colors ${voiceMode ? 'border-vyntra-secondary bg-vyntra-secondary/20 text-vyntra-secondary' : 'border-white/10 text-vyntra-text-sec hover:text-white'}`}
          >
            {voiceMode ? <Volume2 size={12} /> : <VolumeX size={12} />} TTS
          </button>
          <button 
            onClick={() => setShowTwinSettings(true)}
            className="p-2 text-vyntra-text-sec hover:text-white hover:bg-white/10 rounded-full transition-colors flex items-center shrink-0 gap-2"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 relative ${msg.role === 'user' ? 'bg-vyntra-secondary' : 'bg-vyntra-primary/20 text-vyntra-primary'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                {speakingMsgId === msg.id && msg.role === 'assistant' && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-vyntra-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-vyntra-primary"></span>
                  </span>
                )}
              </div>
              <div className={`p-4 rounded-2xl text-[15px] leading-relaxed overflow-hidden transition-all duration-300 ${
                msg.role === 'user' 
                  ? 'bg-vyntra-secondary text-vyntra-bg rounded-tr-sm' 
                  : `text-white rounded-tl-sm border markdown-body font-sans ${speakingMsgId === msg.id ? 'bg-vyntra-primary/10 border-vyntra-primary/50 shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'bg-white/5 border-white/10'}`
              }`}>
                {msg.attachment && msg.attachment.mimeType.startsWith('image/') && (
                  <img src={`data:${msg.attachment.mimeType};base64,${msg.attachment.data}`} alt="attachment" className="max-w-[200px] rounded-lg mb-2 object-cover border border-black/10" />
                )}
                {msg.role === 'assistant' ? (
                  <div className="prose prose-invert max-w-none prose-p:my-2 prose-pre:my-2 prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10">
                    <Markdown>{msg.content}</Markdown>
                    {msg.groundingMetadata?.searchEntryPoint?.renderedContent && (
                      <div 
                        className="mt-4 pt-4 border-t border-white/10 text-xs opacity-80"
                        dangerouslySetInnerHTML={{ __html: msg.groundingMetadata.searchEntryPoint.renderedContent }}
                      />
                    )}
                    {msg.groundingMetadata?.webSearchQueries?.length > 0 && !msg.groundingMetadata?.searchEntryPoint?.renderedContent && (
                      <div className="mt-4 pt-4 border-t border-white/10 text-xs text-vyntra-text-sec">
                        <strong>Searched for:</strong> {msg.groundingMetadata.webSearchQueries.join(', ')}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>{msg.content}</div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 max-w-[85%]"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-vyntra-primary/20 text-vyntra-primary">
              <Bot size={16} />
            </div>
            <div className="p-4 rounded-2xl bg-white/5 text-vyntra-text-sec rounded-tl-sm border border-white/10 flex gap-1">
              <span className="w-1.5 h-1.5 bg-vyntra-primary rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-vyntra-primary rounded-full animate-bounce delay-100"></span>
              <span className="w-1.5 h-1.5 bg-vyntra-primary rounded-full animate-bounce delay-200"></span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-vyntra-surface/50 backdrop-blur-md border-t border-white/5 relative">
        {selectedFile && (
          <div className="absolute -top-16 left-4 bg-[#1A1F2C] border border-white/10 rounded-xl p-2 flex items-center gap-2 shadow-2xl z-30">
            {selectedFile.mimeType.startsWith('image/') ? (
              <img src={selectedFile.url} alt="attached" className="h-10 w-10 object-cover rounded shadow" />
            ) : (
              <div className="h-10 w-10 bg-white/10 rounded flex items-center justify-center">File</div>
            )}
            <button onClick={() => setSelectedFile(null)} className="p-1 text-vyntra-text-sec hover:text-white bg-black/50 rounded-full">
              <X size={14} />
            </button>
          </div>
        )}
        
        <div className="relative flex items-center bg-black/30 border border-white/10 rounded-full pl-3 pr-1 py-1 transition-all shadow-inner focus-within:border-vyntra-primary/50">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-vyntra-text-sec hover:text-vyntra-primary transition-colors shrink-0"
          >
            <Paperclip size={18} />
          </button>
          <input type="file" ref={fileInputRef} hidden accept="image/*,video/mp4" onChange={handleFileSelect} />
          
          <button 
            onClick={toggleRecording}
            className={`p-2 transition-colors shrink-0 ${isRecording ? 'text-vyntra-error animate-pulse' : 'text-vyntra-text-sec hover:text-vyntra-primary'}`}
          >
            <Mic size={18} />
          </button>

          {isRecording ? (
            <div className="flex-1 flex items-center px-4 gap-1.5 h-10">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: ["8px", "24px", "8px"],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeInOut"
                  }}
                  className="w-1 bg-vyntra-primary rounded-full"
                />
              ))}
              <span className="ml-3 text-vyntra-text-sec text-sm animate-pulse">Listening...</span>
            </div>
          ) : (
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask VYNTRA AI anything..."
              className="flex-1 bg-transparent py-2 px-2 text-[15px] focus:outline-none text-white placeholder-vyntra-text-sec min-w-0"
            />
          )}
          <button
            onClick={handleSend}
            disabled={(!input.trim() && !selectedFile) || isLoading}
            className="w-10 h-10 shrink-0 ml-1 flex items-center justify-center text-vyntra-bg bg-vyntra-primary hover:bg-vyntra-primary/90 rounded-full transition-colors disabled:opacity-50 disabled:bg-vyntra-text-sec/20 disabled:text-vyntra-text-sec"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
