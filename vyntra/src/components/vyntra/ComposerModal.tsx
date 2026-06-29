import React, { useState, useRef, useEffect } from "react";
import { Image as ImageIcon, Smile, X, Film, Mic, BarChart2, PlusCircle, Loader2 } from "lucide-react";
import { usePosts } from "../../hooks/usePosts";
import { useAuth } from "../../hooks/useAuth";
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { useUpload } from "../../hooks/useUpload";
import { useUsers } from "../../hooks/useUsers";

interface ComposerModalProps {
  onClose: () => void;
}

export function ComposerModal({ onClose }: ComposerModalProps) {
  const { createPost } = usePosts();
  const { user } = useAuth();
  const { users } = useUsers();
  const { uploadFile, isUploading: isFileUploading, error: uploadError } = useUpload();
  
  const suggestedUsers = users.filter(u => u.id !== user?.uid).map(u => ({
      id: u.id,
      name: u.name,
      handle: u.handle.replace('@', ''),
      avatar: u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}&backgroundColor=000000`
  }));
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mentions
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionCursorPos, setMentionCursorPos] = useState<number>(0);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const maxWords = 600;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMediaFile(file);
    // determine type
    if (file.type.startsWith('video/')) {
        setMediaType('video');
    } else {
        setMediaType('image');
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setMediaPreviewUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // reset
  };

  const onEmojiClick = (emojiObject: any) => {
    setContent(prev => prev + emojiObject.emoji);
  };

  const handlePost = async () => {
    if (!user || (!content.trim() && !mediaFile) || wordCount > maxWords) return;
    
    setIsUploading(true);
    let finalMediaUrl: string | undefined = undefined;
    
    try {
      if (mediaFile) {
        const uploadResult = await uploadFile(mediaFile, user.uid);
        if (uploadResult) {
          finalMediaUrl = uploadResult.url;
        } else {
          throw new Error("File upload failed.");
        }
      }
      
      await createPost(user.uid, content, finalMediaUrl, mediaType || undefined);
      onClose();
    } catch (err) {
      console.error("Error creating post:", err);
      alert("Error: Failed to publish the post. Please check files and try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);

    // Mentions logic
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const match = textBeforeCursor.match(/@(\w*)$/);

    if (match) {
      setMentionQuery(match[1]);
      setMentionCursorPos(cursorPosition);
      setSelectedIndex(0);
    } else {
      setMentionQuery(null);
    }
  };

  const filteredUsers = mentionQuery !== null 
    ? suggestedUsers.filter(u => 
        u.handle.toLowerCase().includes(mentionQuery.toLowerCase()) || 
        u.name.toLowerCase().includes(mentionQuery.toLowerCase())
      )
    : [];

  const handleSelectMention = (userHandle: string) => {
    const textBefore = content.substring(0, mentionCursorPos - (mentionQuery?.length || 0) - 1);
    const textAfter = content.substring(mentionCursorPos);
    
    const newContent = `${textBefore}@${userHandle} ${textAfter}`;
    setContent(newContent);
    setMentionQuery(null);
    
    // Focus textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = textBefore.length + userHandle.length + 2;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mentionQuery !== null && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredUsers.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSelectMention(filteredUsers[selectedIndex].handle);
      } else if (e.key === 'Escape') {
        setMentionQuery(null);
      }
    }
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-vyntra-bg border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-visible relative flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-white/5">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-4">
            <button className="text-vyntra-primary font-medium text-sm flex items-center gap-1 hover:underline">
              Everyone can reply
            </button>
            <button 
              onClick={handlePost}
              disabled={(!content.trim() && !mediaFile) || wordCount > maxWords || isUploading}
              className="bg-vyntra-primary hover:bg-vyntra-primary/90 text-white px-5 py-1.5 rounded-full font-bold transition-all disabled:opacity-50 text-[15px] flex items-center gap-2"
            >
              {isUploading && <Loader2 size={16} className="animate-spin" />}
              Post
            </button>
          </div>
        </div>
        
        <div className="p-4 flex gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <img src={user.avatar} alt="Avatar" className="w-12 h-12 rounded-full border border-white/10 shrink-0 object-cover mt-1" />
          <div className="flex-1 min-w-0">
            <textarea 
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              placeholder="What is your intent today? (Include #hashtags and @mentions)" 
              className="w-full bg-transparent text-vyntra-text placeholder-vyntra-text-sec/70 outline-none resize-none text-xl min-h-[150px] pt-1"
              autoFocus
            />
            
            {mentionQuery !== null && filteredUsers.length > 0 && (
              <div className="absolute top-[160px] left-16 z-50 w-64 bg-vyntra-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                {filteredUsers.map((u, index) => (
                  <button
                    key={u.id}
                    onClick={() => handleSelectMention(u.handle)}
                    className={`w-full flex items-center gap-3 p-3 text-left transition-colors cursor-pointer ${index === selectedIndex ? 'bg-white/10' : 'hover:bg-white/5'}`}
                  >
                    <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full bg-vyntra-bg" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-vyntra-text truncate">{u.name}</div>
                      <div className="text-xs text-vyntra-text-sec truncate">@{u.handle}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {mediaPreviewUrl && (
              <div className="relative mt-2 mb-4 rounded-2xl overflow-hidden border border-white/10 max-h-[300px]">
                <button 
                  onClick={() => { setMediaPreviewUrl(null); setMediaFile(null); setMediaType(null); }}
                  className="absolute top-2 right-2 bg-black/70 hover:bg-black p-1.5 rounded-full text-white transition-colors z-10"
                >
                  <X size={16} />
                </button>
                {mediaType === 'video' ? (
                   <video src={mediaPreviewUrl} controls className="w-full h-full object-cover" />
                ) : (
                   <img src={mediaPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-4 pb-4 pt-2 border-t border-white/5 relative bg-vyntra-bg rounded-b-2xl z-20">
          <div className="flex items-center justify-between ml-[64px]">
            <div className="flex gap-1 text-vyntra-primary">
              <input 
                type="file" 
                accept="image/*,video/*" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-vyntra-primary/10 rounded-full transition-colors tooltip flex items-center justify-center relative"
                title="Media"
              >
                <ImageIcon size={20} />
              </button>
              <button className="p-2 hover:bg-vyntra-primary/10 rounded-full transition-colors tooltip flex items-center justify-center" title="Voice Post">
                <Mic size={20} />
              </button>
              <button className="p-2 hover:bg-vyntra-primary/10 rounded-full transition-colors tooltip flex items-center justify-center" title="Poll">
                <BarChart2 size={20} />
              </button>
              <button className="hidden sm:flex p-2 hover:bg-vyntra-primary/10 rounded-full transition-colors tooltip items-center justify-center" title="Thread">
                <PlusCircle size={20} />
              </button>
              <div className="relative">
                <button 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-2 rounded-full transition-colors tooltip flex items-center justify-center ${showEmojiPicker ? 'bg-vyntra-primary/20 text-vyntra-primary' : 'hover:bg-vyntra-primary/10'}`}
                  title="Emoji"
                >
                  <Smile size={20} />
                </button>
                {showEmojiPicker && (
                  <div className="absolute top-[100%] left-0 mt-2 z-[60]" onClick={e => e.stopPropagation()}>
                    <EmojiPicker 
                      theme={Theme.DARK} 
                      onEmojiClick={onEmojiClick}
                      lazyLoadEmojis={true}
                      searchDisabled={true}
                      width={300}
                      height={400}
                    />
                  </div>
                )}
              </div>
            </div>
            <span className={`text-xs font-mono font-medium ${wordCount > maxWords ? 'text-vyntra-error' : 'text-vyntra-text-sec'}`}>
              {wordCount}/{maxWords} words
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
