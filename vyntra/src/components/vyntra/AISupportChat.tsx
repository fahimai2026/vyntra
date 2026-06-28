import React, { useState, useRef } from 'react';
import { Send, Bot, User, ShieldAlert, CheckCircle, Paperclip, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Markdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  files?: { name: string; type: string; base64: string }[];
}

export function AISupportChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Hello! I am the Vyntra AI Support Agent. I can help resolve your account issues, provide help center articles, or report technical problems. I can also speak any language. How can I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<{ name: string; type: string; base64: string; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          const splitResult = result.split(',');
          const base64 = splitResult.length > 1 ? splitResult[1] : '';
          setSelectedFiles(prev => [...prev, {
            name: file.name,
            type: file.type,
            base64,
            preview: result
          }]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!input.trim() && selectedFiles.length === 0) || isLoading) return;
    
    const currentFiles = [...selectedFiles];
    const userMessage: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: input.trim(),
      files: currentFiles.length > 0 ? currentFiles.map(f => ({ name: f.name, type: f.type, base64: f.base64 })) : undefined
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSelectedFiles([]);
    setIsLoading(true);

    try {
      const historyToSend = messages.length > 1 ? messages.slice(1) : [];
      
      const parts: any[] = [];
      if (currentFiles.length > 0) {
        currentFiles.forEach(f => {
          parts.push({
            inlineData: {
              data: f.base64,
              mimeType: f.type
            }
          });
        });
      }
      
      parts.push({ text: `INSTRUCTIONS FOR AI: You are Vyntra's Official Customer Support AI. You can handle all types of tasks, resolve issues, and act as a comprehensive assistant. If the user reports an issue or shares evidence via files, analyze the files, explain your findings, and mention that you have documented the report and an automatic confirmation email has been dispatched to ${user?.email || 'their connected email'}. IMPORTANT: Always speak in the native language of the user's prompt (e.g. if Bengali, speak Bengali). Respond naturally, quickly, and professionally. User Query: ${userMessage.content}` });

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          parts: parts,
          history: historyToSend.map(m => ({
            role: m.role,
            content: m.content
          })),
          modelType: 'flash',
          useSearch: false
        })
      });
      
      const contentType = response.headers.get("content-type");
      const data = contentType && contentType.includes("application/json") ? await response.json() : {};
      
      if (!response.ok) throw new Error(data.error || "Server connection failed");
      
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: data.reply }]);
    } catch (e: any) {
      console.error(e);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `Ops! Something went wrong. Let me contact human support for you. ` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1A1F2C] rounded-2xl border border-white/10 overflow-hidden">
      <div className="bg-white/5 p-4 border-b border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 bg-vyntra-primary/20 text-vyntra-primary rounded-xl flex items-center justify-center">
          <ShieldAlert size={20} />
        </div>
        <div>
          <h3 className="font-bold">AI Support Agent</h3>
          <p className="text-xs text-vyntra-primary flex items-center gap-1">
            <CheckCircle size={10} /> Online & Active
          </p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
             <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-vyntra-secondary' : 'bg-vyntra-primary/20 text-vyntra-primary'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
             </div>
             <div className={`p-3 rounded-2xl text-[14px] leading-relaxed flex flex-col gap-2 ${
                msg.role === 'user' 
                  ? 'bg-vyntra-secondary text-vyntra-bg rounded-tr-sm' 
                  : 'bg-white/5 border border-white/10 text-white rounded-tl-sm'
              }`}>
                {msg.files && msg.files.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-1">
                    {msg.files.map((f, i) => (
                      f.type.startsWith('image/') ? (
                        <img key={i} src={`data:${f.type};base64,${f.base64}`} alt="attachment" className="h-16 rounded-lg object-cover" />
                      ) : (
                        <div key={i} className="bg-black/20 p-2 rounded-lg text-xs flex items-center gap-1">
                          <Paperclip size={12} /> {f.name}
                        </div>
                      )
                    ))}
                  </div>
                )}
                {msg.role === 'assistant' ? (
                  <div className="prose prose-invert max-w-none prose-p:my-1 prose-sm">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                ) : (
                  <div>{msg.content}</div>
                )}
             </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-vyntra-primary/20 text-vyntra-primary">
              <Bot size={16} />
            </div>
            <div className="p-3 rounded-2xl bg-white/5 text-vyntra-text-sec rounded-tl-sm border border-white/10 flex gap-1">
              <span className="w-1.5 h-1.5 bg-vyntra-primary rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-vyntra-primary rounded-full animate-bounce delay-100"></span>
              <span className="w-1.5 h-1.5 bg-vyntra-primary rounded-full animate-bounce delay-200"></span>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-white/10 bg-black/20 flex flex-col gap-2">
        {selectedFiles.length > 0 && (
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
            {selectedFiles.map((file, i) => (
              <div key={i} className="relative shrink-0">
                {file.type.startsWith('image/') ? (
                   <img src={file.preview} alt="preview" className="h-14 w-14 object-cover rounded-lg border border-white/10" />
                ) : (
                   <div className="h-14 px-3 flex items-center justify-center bg-black/40 rounded-lg border border-white/10 shrink-0 max-w-[120px] truncate text-xs">
                     <Paperclip size={14} className="mr-1" /> {file.name}
                   </div>
                )}
                <button 
                   onClick={() => removeFile(i)}
                   className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border border-[#1A1F2C]"
                >
                  <X size={12} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden" 
            multiple 
            accept="image/*,.pdf,.doc,.docx"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 shrink-0 flex items-center justify-center text-vyntra-text-sec hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10"
          >
            <Paperclip size={18} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Describe your issue or ask for help..."
            className="flex-1 bg-white/5 border border-white/10 rounded-full py-2 px-4 text-sm focus:outline-none focus:border-vyntra-primary text-white placeholder-vyntra-text-sec"
          />
          <button
            onClick={handleSend}
            disabled={(!input.trim() && selectedFiles.length === 0) || isLoading}
            className="w-10 h-10 shrink-0 flex flex-col items-center justify-center text-vyntra-bg bg-vyntra-primary hover:bg-vyntra-primary/90 rounded-full transition-colors disabled:opacity-50"
          >
            <Send size={16} className="ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
