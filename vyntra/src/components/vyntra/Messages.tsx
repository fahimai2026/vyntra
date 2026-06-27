import { Settings, Edit, Image as ImageIcon, Smile, Mic, Send, MoreHorizontal, ArrowLeft, Mail, Search, Check, Ban, Trash2, BellOff, Tag, Loader2, Paperclip } from "lucide-react";
import { VerifiedBadge } from "./VerifiedBadge";
import React, { useState, useEffect, useRef } from "react";
import { ChatSkeleton } from "./Skeletons";
import { useAuth } from "../../hooks/useAuth";
import { useMessages } from "../../hooks/useMessages";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase";

export function MessagesView() {
  const { user } = useAuth();
  const { chats, messages, selectedChatId, setSelectedChatId, sendMessage: sendFirestoreMessage, createChat } = useMessages();
  
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [inputText, setInputText] = useState("");
  const [showNewMsgMenu, setShowNewMsgMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedChatId]);

  const handleTextChange = (val: string) => {
    setInputText(val);
  };

  const handleChatSelect = (id: string) => {
    setSelectedChatId(id);
    setIsLoadingChat(true);
    setTimeout(() => setIsLoadingChat(false), 500);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setSelectedImage(ev.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (selectedChatId && user) {
          setIsSending(true);
          try {
             // We can upload audio to firebase storage
             const audioRef = storageRef(storage, `chat_media/${user.uid}/${Date.now()}_audio.webm`);
             const snapshot = await uploadBytes(audioRef, audioBlob);
             const audioUrl = await getDownloadURL(snapshot.ref);
             await sendFirestoreMessage(selectedChatId, "", { type: 'audio', data: audioUrl });
          } catch(err) {
             console.error("Audio upload failed", err);
          } finally {
             setIsSending(false);
          }
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const sendMessage = async () => {
    if ((!inputText.trim() && !selectedFile) || !selectedChatId || !user) return;
    
    setIsSending(true);
    try {
      if (selectedFile) {
        const fileRef = storageRef(storage, `chat_media/${user.uid}/${Date.now()}_${selectedFile.name}`);
        const snapshot = await uploadBytes(fileRef, selectedFile);
        const fileUrl = await getDownloadURL(snapshot.ref);
        const type = selectedFile.type.startsWith('image/') ? 'image' : 
                     selectedFile.type.startsWith('video/') ? 'video' : 'file';
        await sendFirestoreMessage(selectedChatId, inputText, { type, data: fileUrl });
      } else {
        await sendFirestoreMessage(selectedChatId, inputText);
      }
      
      setInputText("");
      setSelectedImage(null);
      setSelectedFile(null);
    } catch (err) {
      console.error("Error sending message", err);
    } finally {
      setIsSending(false);
    }
  };

  const activeConversation = chats.find(c => c.id === selectedChatId);

  const filteredConversations = chats.filter(c => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const cName = c.name || "Unknown User";
    const matchesName = cName.toLowerCase().includes(query);
    return matchesName;
  });

  const generateName = (c: any) => c.name || "Private Chat";
  const generateAvatar = (c: any) => c.avatar || "https://i.pravatar.cc/150?u=" + c.id;

  return (
    <div className="flex-1 h-full w-full flex flex-col md:flex-row bg-vyntra-bg/80 backdrop-blur-md relative">
      
      {/* Chat List (Left) */}
      <div className={`${selectedChatId !== null ? 'hidden md:flex' : 'flex'} w-full md:w-[320px] lg:w-[350px] border-r border-white/5 flex-col h-full bg-transparent flex-shrink-0 relative`}>
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-vyntra-bg/80 backdrop-blur-xl z-20 sticky top-0">
          <h2 className="text-xl font-bold">Messages</h2>
          <div className="flex gap-2 relative">
             <button onClick={() => setShowSettingsMenu(!showSettingsMenu)} className="p-2 hover:bg-white/10 rounded-full transition-colors relative"><Settings size={18}/></button>
             {showSettingsMenu && (
               <div className="absolute top-10 right-8 w-48 bg-[#1A1F2C] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                 <div className="p-3 text-sm text-vyntra-text-sec text-center">Settings</div>
               </div>
             )}
             
             <button onClick={() => setShowNewMsgMenu(!showNewMsgMenu)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><Edit size={18}/></button>
             {showNewMsgMenu && (
               <div className="absolute top-10 right-0 w-48 bg-[#1A1F2C] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                 <div className="p-3 hover:bg-white/10 cursor-pointer text-sm flex items-center gap-2" onClick={async () => {
                   setShowNewMsgMenu(false);
                   const newId = prompt("Enter the user ID to start chat:");
                   if(newId) {
                     const id = await createChat(newId);
                     if (id) setSelectedChatId(id);
                   }
                 }}><Search size={14}/> Start a Chat</div>
               </div>
             )}
          </div>
        </div>

        <div className="p-3">
          <div className="bg-white/5 flex items-center rounded-full px-3 py-1">
             <Search size={16} className="text-vyntra-text-sec" />
             <input 
               type="text" 
               placeholder="Search Direct Messages" 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full bg-transparent border-transparent py-1 pl-2 focus:outline-none text-sm"
             />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          {filteredConversations.length === 0 && <div className="p-4 text-vyntra-text-sec text-center text-sm">No chats found.</div>}
          {filteredConversations.map(c => {
             const cName = generateName(c);
             const cAvatar = generateAvatar(c);
             
             return (
              <div 
                key={c.id} 
                className={`p-4 hover:bg-white/5 transition-colors flex gap-3 items-center group relative ${selectedChatId === c.id ? 'bg-white/5 border-r-2 border-vyntra-primary' : ''}`}
              >
                 <div className="relative cursor-pointer flex-shrink-0" onClick={() => handleChatSelect(c.id)}>
                   <img src={cAvatar} className="w-12 h-12 rounded-full" alt="avatar" />
                 </div>
                 
                 <div className="flex-1 overflow-hidden cursor-pointer" onClick={() => handleChatSelect(c.id)}>
                   <div className="flex items-center justify-between">
                     <div className="font-bold truncate text-[15px] flex items-center gap-1">
                       <span>{cName}</span>
                     </div>
                   </div>
                   <div className="text-vyntra-text-sec text-[14px] truncate">{c.lastMessage || "Start a conversation"}</div>
                 </div>

                 {/* Dropdown overlay */}
                 <div className="flex items-center gap-1 shrink-0 relative">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === c.id ? null : c.id); }} 
                      className="p-1 hover:bg-white/10 rounded-full text-vyntra-text-sec"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {activeMenuId === c.id && (
                      <div className="absolute right-0 top-6 w-36 bg-[#1A1F2C] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden text-sm">
                        <div onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }} className="p-2 hover:bg-white/10 cursor-pointer flex items-center gap-2"><Tag size={14}/> Close</div>
                      </div>
                    )}
                 </div>
              </div>
             );
          })}
        </div>
      </div>

      {/* Chat Area (Right) */}
      <div className={`${selectedChatId === null ? 'hidden md:flex' : 'flex'} flex-1 flex-col h-full bg-vyntra-surface/30 relative`}>
        {selectedChatId === null ? (
          <div className="flex-1 flex flex-col items-center justify-center text-vyntra-text-sec p-8 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <Mail size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Select a message</h2>
            <p className="max-w-xs">Choose from your existing conversations, start a new one, or just keep swimming.</p>
          </div>
        ) : (
          <>
            <div className="p-3 sm:p-4 border-b border-white/5 flex justify-between items-center bg-vyntra-bg/80 backdrop-blur-xl z-10 sticky top-0 shadow-sm relative">
                <div className="flex items-center gap-2">
                  <button className="md:hidden p-2 -ml-2 mr-1 hover:bg-white/10 rounded-full" onClick={() => setSelectedChatId(null)}>
                    <ArrowLeft size={20} />
                  </button>
                  <img src={generateAvatar(activeConversation)} className="w-8 h-8 rounded-full object-cover" alt="av" />
                  <div className="flex flex-col">
                    <div className="font-bold flex items-center gap-1 text-[15px] leading-tight">
                      {generateName(activeConversation)}
                    </div>
                  </div>
                </div>
            </div>

            {isLoadingChat ? (
               <ChatSkeleton />
            ) : (
               <>
                 {/* Message Thread */}
                 <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4 animate-fadeIn">
                    
                    <div className="text-center text-xs text-vyntra-text-sec my-4 font-medium">Chat Started</div>
               
               {messages.map(msg => {
                 const isMe = msg.senderId === (user?.uid || "me");
                 return (
                   <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                     <div className={`flex gap-2 items-end max-w-[85%] sm:max-w-[70%]`}>
                       {!isMe && <img src={generateAvatar(activeConversation)} className="w-6 h-6 rounded-full mb-1 shrink-0" alt="av" />}
                       <div className={`${isMe ? 'bg-gradient-to-br from-vyntra-primary to-vyntra-accent text-white rounded-tr-sm' : 'bg-white/10 text-white rounded-tl-sm'} p-3 rounded-2xl text-[15px] shadow-sm flex flex-col gap-2`}>
                         {msg.attachment?.type === 'image' && (
                            <a href={msg.attachment.data} target="_blank" rel="noopener noreferrer">
                              <img src={msg.attachment.data} className="w-full max-w-[200px] rounded-lg object-cover" alt="attachment" />
                            </a>
                         )}
                         {msg.attachment?.type === 'video' && (
                            <video src={msg.attachment.data} controls className="w-full max-w-[250px] rounded-lg" />
                         )}
                         {msg.attachment?.type === 'file' && (
                            <a href={msg.attachment.data} target="_blank" rel="noopener noreferrer" className="bg-black/30 p-3 rounded-lg flex items-center gap-2 hover:bg-black/40 transition-colors">
                              <Paperclip size={18} />
                              <span className="text-sm underline">Download File</span>
                            </a>
                         )}
                         {msg.attachment?.type === 'audio' && (
                            <audio controls src={msg.attachment.data} className="w-[200px] h-[40px] rounded-full"></audio>
                         )}
                         {msg.text && <span>{msg.text}</span>}
                       </div>
                     </div>
                   </div>
                 );
               })}
               <div ref={endOfMessagesRef} />
             </div>
             </>
            )}

            {/* Composer Box */}
            <div className="p-2 sm:p-3 border-t border-white/5 bg-vyntra-bg/90 backdrop-blur-md">
                {selectedImage && (
                  <div className="relative inline-block mb-3 ml-3">
                    <img src={selectedImage} alt="preview" className="h-20 rounded-xl object-cover" />
                    <button onClick={() => { setSelectedImage(null); setSelectedFile(null); }} className="absolute -top-2 -right-2 bg-vyntra-error text-white rounded-full p-1"><Ban size={12}/></button>
                  </div>
                )}
                {selectedFile && !selectedImage && (
                  <div className="relative inline-block mb-3 ml-3">
                    <div className="bg-black/40 border border-white/10 p-3 rounded-xl flex items-center gap-2 text-sm max-w-[200px]">
                      <Paperclip size={16} />
                      <span className="truncate">{selectedFile.name}</span>
                    </div>
                    <button onClick={() => { setSelectedImage(null); setSelectedFile(null); }} className="absolute -top-2 -right-2 bg-vyntra-error text-white rounded-full p-1"><Ban size={12}/></button>
                  </div>
                )}
                <input type="file" ref={fileInputRef} hidden accept="image/*,video/*,.pdf,.doc,.docx" onChange={handleImageSelect} />

                 <div className="bg-vyntra-surface border border-white/10 rounded-full flex items-center p-1 shadow-inner">
                   <div className="flex gap-1 ml-1 text-vyntra-text-sec">
                     <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-white/10 hover:text-vyntra-primary rounded-full transition-colors"><ImageIcon size={18}/></button>
                     <button 
                       onClick={isRecording ? stopRecording : startRecording} 
                       className={`p-2 hover:bg-white/10 rounded-full transition-colors hidden sm:block ${isRecording ? 'text-red-500 bg-red-500/10 hover:text-red-600 animate-pulse' : 'hover:text-vyntra-primary'}`}
                     >
                       <Mic size={18}/>
                     </button>
                   </div>
                   <input 
                     type="text" 
                     placeholder={isRecording ? "Recording..." : "Start a new message"} 
                     className="flex-1 bg-transparent px-3 py-2 outline-none text-white text-[15px]"
                     value={inputText}
                     onChange={e => handleTextChange(e.target.value)}
                     onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                     disabled={isRecording || isSending}
                   />
                   <button 
                     onClick={sendMessage}
                     disabled={(!inputText.trim() && !selectedFile) || isRecording || isSending}
                     className="mr-1 p-2 bg-vyntra-primary hover:bg-vyntra-primary/90 disabled:opacity-50 disabled:hover:bg-vyntra-primary rounded-full text-white transition-colors shadow-sm flex items-center justify-center"
                   >
                     {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className={(inputText.trim() || selectedFile) ? "ml-0.5" : ""} />}
                   </button>
                 </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
