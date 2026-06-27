import { Home, Compass, Plus, Mail, User, Sparkles } from "lucide-react";
import { useNavigation } from "../../contexts/NavigationContext";
import { useAuth } from "../../hooks/useAuth";

export function MobileNav({ onOpenComposer }: { onOpenComposer: () => void }) {
  const { activeTab, setActiveTab, navigateProfile } = useNavigation();
  const { user } = useAuth();

  const handleNavClick = (id: string, action: () => void) => {
    if (!user && id !== 'feed' && id !== 'explore') {
      alert("Please log in to access this feature.");
      return;
    }
    action();
  };

  return (
    <nav 
      className="sm:hidden fixed bottom-0 left-0 right-0 bg-vyntra-bg/95 backdrop-blur-xl border-t border-white/10 z-50 px-2 py-1 flex justify-between items-center"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 4px)' }}
    >
      <button onClick={() => handleNavClick('feed', () => setActiveTab('feed'))} className={`p-3 rounded-xl transition-all ${activeTab === 'feed' ? 'text-white' : 'text-vyntra-text-sec hover:text-white hover:bg-white/5'}`}>
        <Home size={24} className={activeTab === 'feed' ? 'fill-current' : ''} />
      </button>
      <button onClick={() => handleNavClick('explore', () => setActiveTab('explore'))} className={`p-3 rounded-xl transition-all ${activeTab === 'explore' ? 'text-white' : 'text-vyntra-text-sec hover:text-white hover:bg-white/5'}`}>
        <Compass size={24} className={activeTab === 'explore' ? 'fill-current' : ''} />
      </button>
      <button 
        onClick={() => handleNavClick('compose', onOpenComposer)}
        className="w-14 h-14 bg-gradient-to-tr from-vyntra-primary to-vyntra-accent rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(108,92,231,0.5)] active:scale-95 transition-transform transform -translate-y-4"
      >
        <Plus size={28} />
      </button>
      <button onClick={() => handleNavClick('messages', () => setActiveTab('messages'))} className={`p-3 rounded-xl transition-all ${activeTab === 'messages' ? 'text-white' : 'text-vyntra-text-sec hover:text-white hover:bg-white/5'}`}>
        <Mail size={24} className={activeTab === 'messages' ? 'fill-current' : ''} />
      </button>
      <button onClick={() => handleNavClick('profile', () => navigateProfile(null))} className={`p-3 rounded-xl transition-all ${activeTab === 'profile' ? 'text-white' : 'text-vyntra-text-sec hover:text-white hover:bg-white/5'}`}>
        <User size={24} className={activeTab === 'profile' ? 'fill-current' : ''} />
      </button>
    </nav>
  );
}
