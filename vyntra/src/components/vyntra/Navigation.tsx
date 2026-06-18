import { Home, Compass, Bell, Mail, Bookmark, Users, User, MoreHorizontal, LogIn, LogOut, Plus, Search, Bot, Shield, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigation } from "../../contexts/NavigationContext";

interface NavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenComposer: () => void;
}

export function Navigation({ activeTab, setActiveTab, onOpenComposer }: NavProps) {
  const { user, loginWithGoogle, logout } = useAuth();
  const { navigateProfile } = useNavigation();
  
  const navItems = [
    { id: "feed", label: "Home", icon: Home },
    { id: "explore", label: "Explore", icon: Search },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "messages", label: "Messages", icon: Mail },
    { id: "bookmarks", label: "Bookmarks", icon: Bookmark },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "communities", label: "Communities", icon: Users },
    { id: "profile", label: "Profile", icon: User },
    { id: "more", label: "More", icon: MoreHorizontal },
    { id: "vyntra-ai", label: "VYNTRA AI", icon: Bot },
  ];

  const handleNavClick = (id: string) => {
    if (!user && id !== 'feed' && id !== 'explore') {
      alert("Please log in to access this feature.");
      return;
    }
    if (id === 'profile') {
      navigateProfile(null);
    } else {
      setActiveTab(id);
    }
  };

  return (
    <nav className="hidden sm:flex flex-col w-20 lg:w-64 h-full py-4 px-2 lg:px-4 z-20 flex-shrink-0">
      <div className="flex items-center justify-center lg:justify-start gap-4 mb-6 px-2 cursor-pointer" onClick={() => handleNavClick('feed')}>
        <img src="/logo.png" alt="Vyntra Logo" className="w-10 sm:w-12 lg:w-14 h-auto object-contain drop-shadow-[0_0_15px_rgba(108,92,231,0.3)] transition-all" />
        <h1 className="text-2xl font-bold text-gradient hidden lg:block tracking-widest">VYNTRA</h1>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-1 hidden-scrollbar lg:pr-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-center lg:justify-start gap-5 p-3 lg:px-4 lg:py-3.5 rounded-full transition-all relative group ${
                isActive ? "text-white font-bold" : "text-vyntra-text hover:bg-white/5"
              }`}
            >
              <Icon size={26} strokeWidth={isActive ? 2.5 : 2} className={`relative z-10 transition-transform group-hover:scale-110 ${isActive ? "text-white" : ""}`} />
              <span className={`relative z-10 text-[19px] hidden lg:block ${isActive ? "font-bold" : "font-normal"}`}>{item.label}</span>
            </button>
          );
        })}
        
        <button 
          onClick={onOpenComposer}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-vyntra-primary to-vyntra-accent hover:opacity-90 text-white p-4 rounded-full transition-all shadow-[0_8px_16px_rgba(108,92,231,0.3)] hover:shadow-[0_12px_24px_rgba(108,92,231,0.5)] transform hover:-translate-y-1 mt-6">
          <Plus size={24} />
          <span className="font-bold text-lg hidden lg:block">Post</span>
        </button>
      </div>

      {user ? (
        <div 
          onClick={() => logout()}
          className="mt-auto pt-4 border-t border-white/5 mx-2 hidden lg:flex items-center justify-between hover:bg-white/5 p-3 rounded-full cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <img src={user.avatar} alt="Me" className="w-10 h-10 rounded-full border border-white/10 flex-shrink-0" />
            <div className="overflow-hidden">
              <div className="font-bold text-[15px] truncate text-white leading-tight">{user.name}</div>
              <div className="text-[14px] text-vyntra-text-sec truncate leading-tight">{user.handle}</div>
            </div>
          </div>
          <LogOut className="text-vyntra-text-sec hover:text-vyntra-error shrink-0" size={20} />
        </div>
      ) : (
        <div className="mt-auto pt-4 border-t border-white/5 mx-2 hidden lg:flex flex-col gap-2">
          <div 
            onClick={loginWithGoogle}
            className="flex items-center gap-3 bg-white text-vyntra-bg hover:bg-gray-200 p-3 rounded-full cursor-pointer transition-colors"
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            </div>
            <div className="font-bold text-[14px] text-vyntra-bg">Google</div>
          </div>
          <div 
            onClick={() => alert("Apple login requires configuration. Use Email login in the feed.")}
            className="flex items-center gap-3 bg-white text-vyntra-bg hover:bg-gray-200 p-3 rounded-full cursor-pointer transition-colors"
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.05 2.26.45 3.09.45.71 0 1.81-.46 3.28-.46 1.86.08 3.19.8 4.02 2.1-3.62 2.04-2.89 6.22-1.01 7.15-.36 1.25-.97 2.45-1.38 3.73zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.36 2.41-2.01 4.38-3.74 4.25z"/></svg>
            </div>
            <div className="font-bold text-[14px] text-vyntra-bg">Apple</div>
          </div>
        </div>
      )}
    </nav>
  );
}
