import { useState, useEffect, useRef } from "react";
import { X, Camera } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

interface EditProfileModalProps {
  onClose: () => void;
  isOpen: boolean;
}

export function EditProfileModal({ onClose, isOpen }: EditProfileModalProps) {
  const { user, updateUserProfile } = useAuth();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [otherSocial, setOtherSocial] = useState("");
  const [avatarParams, setAvatarParams] = useState("");
  const [coverParams, setCoverParams] = useState("");
  const [loading, setLoading] = useState(false);

  const fileInputRefAvatar = useRef<HTMLInputElement>(null);
  const fileInputRefCover = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setBio(user.bio || "");
      setLocation(user.location || "");
      setWebsite(user.website || "");
      setOtherSocial(user.otherSocial || "");
      setAvatarParams(user.avatar || "");
      setCoverParams(user.coverImage || "");
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateUserProfile(name, bio, avatarParams, location, website, otherSocial, coverParams);
      onClose();
    } catch (e) {
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setParams: React.Dispatch<React.SetStateAction<string>>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File is too large. Please choose an image under 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 800;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.8 quality
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          setParams(dataUrl);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0B0F19] w-full max-w-[600px] min-h-[400px] max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl border border-white/10 flex flex-col relative text-white">
        
        {/* Header */}
        <div className="sticky top-0 z-30 bg-[#0B0F19]/90 backdrop-blur px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold">Edit profile</h2>
          </div>
          <button 
            onClick={handleSave}
            disabled={loading || !name.trim()}
            className="bg-white text-black font-bold px-4 py-1.5 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:hover:bg-white"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 relative">
          {/* Cover Photo */}
          <div 
            className="h-48 w-full bg-gradient-to-tr from-vyntra-primary via-[#0B0F19] to-vyntra-accent relative overflow-hidden flex items-center justify-center cursor-pointer group"
            onClick={() => fileInputRefCover.current?.click()}
          >
             {coverParams && <img src={coverParams} alt="Cover" className="absolute inset-0 w-full h-full object-cover z-0" />}
             <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all z-10"></div>
             <div className="relative z-20 bg-black/40 p-3 rounded-full hover:bg-black/60 transition-colors">
                 <Camera size={24} className="text-white" />
             </div>
             <input type="file" ref={fileInputRefCover} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setCoverParams)} />
          </div>

          <div className="px-4 pb-8">
            <div className="flex justify-between items-end -mt-16 mb-4 relative z-20">
              <div 
                  className="relative rounded-full p-1 bg-[#0B0F19] shrink-0 group cursor-pointer"
                  onClick={() => fileInputRefAvatar.current?.click()}
              >
                <img 
                  src={avatarParams || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                  alt="Profile" 
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover shadow-xl bg-[#0B0F19] opacity-100 group-hover:opacity-80 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black/40 p-3 rounded-full hover:bg-black/60 transition-colors mt-2">
                        <Camera size={24} className="text-white" />
                    </div>
                </div>
                <input type="file" ref={fileInputRefAvatar} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setAvatarParams)} />
              </div>
            </div>

            <div className="space-y-4 mt-6">
              <div className="flex flex-col gap-1">
                <label className="text-[13px] text-gray-400 font-medium pl-1">Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full px-3 py-2.5 text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-vyntra-primary transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[13px] text-gray-400 font-medium pl-1">Bio</label>
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="block w-full px-3 py-2.5 text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-vyntra-primary transition-colors resize-none"
                />
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-[13px] text-gray-400 font-medium pl-1">Location</label>
                <input 
                  type="text" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="block w-full px-3 py-2.5 text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-vyntra-primary transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[13px] text-gray-400 font-medium pl-1">Website URL</label>
                <input 
                  type="text" 
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="block w-full px-3 py-2.5 text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-vyntra-primary transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[13px] text-gray-400 font-medium pl-1">Other Social Media (e.g., github.com/user)</label>
                <input 
                  type="text" 
                  value={otherSocial}
                  onChange={(e) => setOtherSocial(e.target.value)}
                  className="block w-full px-3 py-2.5 text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-vyntra-primary transition-colors"
                />
              </div>

               <div className="flex flex-col gap-1">
                <label className="text-[13px] text-gray-400 font-medium pl-1">Avatar URL</label>
                <input 
                  type="text" 
                  value={avatarParams}
                  onChange={(e) => setAvatarParams(e.target.value)}
                  className="block w-full px-3 py-2.5 text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-vyntra-primary transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
