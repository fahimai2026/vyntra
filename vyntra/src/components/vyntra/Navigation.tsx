import { Home, Compass, Bell, Mail, Bookmark, Users, User, MoreHorizontal, LogIn, LogOut, Plus, Search, Bot, Shield, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigation } from "../../contexts/NavigationContext";

const VyntraLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <img src="/logo.png" alt="Vyntra Logo" className={className} />
);

interface NavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenComposer: () => void;
}

export function Navigation({ activeTab, setActiveTab, onOpenComposer }: NavProps) {
  const { user, logout } = useAuth();
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
    { id: "vyntra-ai", label: "VN ai", icon: Bot },
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
      <div className="flex items-center justify-center lg:justify-start gap-4 mb-6 px-4 cursor-pointer text-black dark:text-white" onClick={() => handleNavClick('feed')}>
        <VyntraLogo className="w-8 h-8 sm:w-9 sm:h-9" />
        <h1 className="text-2xl font-black hidden lg:block tracking-tight text-slate-900 dark:text-white">Vyntra</h1>
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
                isActive ? "text-[#1d9bf0] font-bold" : "text-vyntra-text hover:bg-slate-100 dark:hover:bg-zinc-900"
              }`}
            >
              <Icon size={26} strokeWidth={isActive ? 2.5 : 2} className={`relative z-10 transition-transform group-hover:scale-105 ${isActive ? "text-[#1d9bf0]" : ""}`} />
              <span className={`relative z-10 text-[19px] hidden lg:block ${isActive ? "font-bold" : "font-normal"}`}>{item.label}</span>
            </button>
          );
        })}
        
        <button 
          onClick={onOpenComposer}
          className="w-full flex items-center justify-center gap-2 bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white p-3.5 rounded-full transition-all shadow-sm transform hover:scale-[1.01] active:scale-[0.99] mt-6">
          <Plus size={24} />
          <span className="font-bold text-lg hidden lg:block">Post</span>
        </button>
      </div>

      {user && (
        <div 
          onClick={() => logout()}
          className="mt-auto pt-4 border-t border-slate-100 dark:border-zinc-800 mx-2 hidden lg:flex items-center justify-between hover:bg-slate-100 dark:hover:bg-zinc-900 p-3 rounded-full cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <img src={user.avatar} alt="Me" className="w-10 h-10 rounded-full border border-slate-200 dark:border-zinc-800 flex-shrink-0" />
            <div className="overflow-hidden">
              <div className="font-bold text-[15px] truncate text-slate-900 dark:text-white leading-tight">{user.name}</div>
              <div className="text-[14px] text-slate-500 dark:text-zinc-500 truncate leading-tight">{user.handle}</div>
            </div>
          </div>
          <LogOut className="text-slate-500 dark:text-zinc-500 hover:text-red-500 shrink-0" size={20} />
        </div>
      )}
    </nav>
  );
}
