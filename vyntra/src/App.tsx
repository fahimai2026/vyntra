/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { Navigation } from './components/vyntra/Navigation';
import { Feed } from './components/vyntra/Feed';
import { RightPanel } from './components/vyntra/RightPanel';
import { ProfileView } from './components/vyntra/Profile';
import { MessagesView } from './components/vyntra/Messages';
import { SettingsView } from './components/vyntra/SettingsView';
import { ExploreView } from './components/vyntra/ExploreView';
import { NotificationsView } from './components/vyntra/NotificationsView';
import { BookmarksView } from './components/vyntra/BookmarksView';
import { AnalyticsDashboard } from './components/vyntra/AnalyticsDashboard';
import { CommunitiesView } from './components/vyntra/CommunitiesView';
import { VyntraAIView } from './components/vyntra/VyntraAIView';
import { SinglePostView } from './components/vyntra/SinglePostView';
import { ComposerModal } from './components/vyntra/ComposerModal';
import { MobileNav } from './components/vyntra/MobileNav';
import { SplashScreen } from './components/vyntra/SplashScreen';
import { LegalView } from './components/vyntra/LegalView';
import { SecurityLogsView } from './components/vyntra/SecurityLogsView';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';
import { LandingView } from './components/vyntra/LandingView';
import { useAuth } from './hooks/useAuth';
import { BrainCircuit, KeyRound, LogOut, Copy, Check } from 'lucide-react';
import { NetworkStatusBadge } from './components/vyntra/NetworkStatusBadge';
import { verifyTOTP, hashRecoveryCode } from './utils/totp';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Helmet } from 'react-helmet-async';

function DynamicSEO({ activeTab }: { activeTab: string }) {
  let title = "Vyntra - What's Happening Now";
  let description = "Vyntra is the next generation social media platform. Share your thoughts, connect with people, and discover what's happening around the world.";

  switch (activeTab) {
    case 'feed':
      title = "Home | Vyntra";
      description = "Check out the latest posts and trending topics on your Vyntra feed.";
      break;
    case 'profile':
      title = "Your Profile | Vyntra";
      description = "View your Vyntra profile, posts, and network connections.";
      break;
    case 'explore':
      title = "Explore | Vyntra";
      description = "Discover new people, trending hashtags, and global conversations on Vyntra.";
      break;
    case 'messages':
      title = "Messages | Vyntra";
      description = "Chat privately with your Vyntra connections.";
      break;
    case 'communities':
      title = "Communities | Vyntra";
      description = "Join and engage with topic-based communities on Vyntra.";
      break;
    case 'vyntra-ai':
      title = "VN ai | Vyntra";
      description = "Get intelligent assistance from Vyntra's built-in AI.";
      break;
  }

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}

function TwoFactorVerification({ user, onVerified, onLogout }: { user: any, onVerified: () => void, onLogout: () => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 - (Math.floor(Date.now() / 1000) % 30));

  useEffect(() => {
    if (useRecoveryCode) return;
    const interval = setInterval(() => {
      setTimeLeft(30 - (Math.floor(Date.now() / 1000) % 30));
    }, 1000);
    return () => clearInterval(interval);
  }, [useRecoveryCode]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!useRecoveryCode) {
      if (code.length !== 6) {
        setError('Please enter a 6-digit verification code.');
        return;
      }
      setLoading(true);
      setError('');
      try {
        const isValid = await verifyTOTP(code, user.twoFactorSecret);
        if (isValid) {
          onVerified();
        } else {
          setError('Incorrect verification code. Please check your system clock.');
        }
      } catch (err) {
        console.error(err);
        setError('An error occurred during verification.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!code.trim()) {
        setError('Please enter a backup recovery code.');
        return;
      }
      setLoading(true);
      setError('');
      try {
        const cleanEnteredCode = code.trim().toUpperCase();
        const enteredHash = await hashRecoveryCode(cleanEnteredCode);
        const currentCodes = user.twoFactorRecoveryCodes || [];
        const matchedIndex = currentCodes.findIndex((c: string) => {
          const cleanC = c.toUpperCase();
          if (cleanC === enteredHash) return true;
          // Backward compatibility fallback for legacy unhashed codes
          return cleanC === cleanEnteredCode || cleanC.replace(/-/g, '') === cleanEnteredCode.replace(/-/g, '');
        });

        if (matchedIndex !== -1) {
          const updatedCodes = currentCodes.filter((_: any, idx: number) => idx !== matchedIndex);
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, { twoFactorRecoveryCodes: updatedCodes });
          onVerified();
        } else {
          setError('Invalid or already used backup code. Please enter a valid, unused recovery code.');
        }
      } catch (err: any) {
        console.error(err);
        setError(`Recovery verification failed: ${err.message || err}`);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#030712] flex items-center justify-center p-4">
      <div className="fixed top-[-20%] left-[-20%] w-[60%] h-[60%] bg-[#6c5ce7]/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-[#00d4ff]/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#0F1424]/90 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 shadow-2xl relative z-10 text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-[#6c5ce7]/10 rounded-2xl flex items-center justify-center text-[#6c5ce7] border border-[#6c5ce7]/20 animate-pulse">
          <KeyRound size={32} />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-white">
            {useRecoveryCode ? "Emergency Recovery" : "Two-Factor Authentication"}
          </h2>
          <p className="text-sm text-[#AAB2C8] leading-relaxed">
            {useRecoveryCode 
              ? "Use an 8-character backup recovery code to log in. Each code can only be used once."
              : "Your account is protected with Two-Factor Security. Please open your Google Authenticator or Microsoft Authenticator app to view and enter your 6-digit verification code."
            }
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-4">
            {useRecoveryCode ? (
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setError('');
                  }}
                  placeholder="XXXX-XXXX"
                  className="w-full text-center bg-black/40 border border-white/10 rounded-2xl py-3 pl-4 pr-12 text-xl font-mono tracking-wider text-white focus:outline-none focus:border-[#6c5ce7] transition-colors"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    if (code) {
                      navigator.clipboard.writeText(code);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }
                  }}
                  disabled={!code}
                  className="absolute right-3.5 text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  title="Copy recovery code"
                >
                  {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, ''));
                    setError('');
                  }}
                  placeholder="000000"
                  className="w-full text-center bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-2xl font-mono tracking-[0.5em] text-white focus:outline-none focus:border-[#6c5ce7] transition-colors pr-0 pl-[0.5em]"
                  autoFocus
                />
                
                {/* 30-second TOTP token validity progress bar */}
                <div className="pt-2">
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden relative">
                    <div 
                      className={`h-full transition-all duration-1000 ease-linear ${timeLeft <= 5 ? "bg-red-500 animate-pulse" : "bg-[#6c5ce7]"}`}
                      style={{ width: `${(timeLeft / 30) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5 font-mono">
                    <span>TOKEN VALIDITY WINDOW</span>
                    <span className={timeLeft <= 5 ? "text-red-400 font-bold" : "text-[#8a94ad]"}>
                      {timeLeft}s remaining
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs text-[#FF3B30] font-medium bg-[#FF3B30]/10 py-2.5 px-3 rounded-xl border border-[#FF3B30]/20">
              {error}
            </p>
          )}

          <div className="pt-2 flex gap-3">
            <button
              type="submit"
              disabled={loading || (!useRecoveryCode && code.length !== 6) || (useRecoveryCode && !code.trim())}
              className="flex-1 bg-[#6c5ce7] hover:bg-[#6c5ce7]/95 text-white py-3 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? 'Verifying...' : 'Secure Login'}
            </button>
            
            <button
              type="button"
              onClick={onLogout}
              className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white transition-all flex items-center justify-center gap-1.5"
              title="Sign Out"
            >
              <LogOut size={18} />
              <span className="text-sm font-bold">Cancel</span>
            </button>
          </div>
        </form>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              setCode('');
              setError('');
              setUseRecoveryCode(!useRecoveryCode);
            }}
            className="text-xs text-[#6c5ce7] font-bold hover:underline transition-all"
          >
            {useRecoveryCode ? "Back to Authenticator Code" : "Lost active device? Use Backup Recovery Code"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { activeTab, setActiveTab } = useNavigation();
  const { user, loading: authLoading, logout } = useAuth();
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayTab, setDisplayTab] = useState(activeTab);
  
  const [isTwoFactorVerified, setIsTwoFactorVerified] = useState(() => {
    return sessionStorage.getItem('v_2fa_verified') === 'true';
  });
  
  const prevUserRef = useRef<string | null>(null);

  useEffect(() => {
    // When the user state changes from null to a valid user, they just logged in.
    // Force them to the feed tab so they aren't stuck on a blank screen.
    if (!prevUserRef.current && user?.uid) {
      setActiveTab('feed');
    }
    prevUserRef.current = user?.uid || null;
  }, [user?.uid, setActiveTab]);

  useEffect(() => {
    if (!user) {
      setIsTwoFactorVerified(false);
      sessionStorage.removeItem('v_2fa_verified');
    } else if (!user.twoFactorEnabled) {
      setIsTwoFactorVerified(true);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab !== displayTab) {
      setIsTransitioning(true);
      const t = setTimeout(() => {
        setDisplayTab(activeTab);
        setIsTransitioning(false);
      }, 300); // 300ms transition
      return () => clearTimeout(t);
    }
  }, [activeTab, displayTab]);

  if (authLoading) {
    return <SplashScreen onComplete={() => {}} />;
  }

  if (!user) {
    return <LandingView />;
  }

  if (user.twoFactorEnabled && !isTwoFactorVerified) {
    return (
      <TwoFactorVerification 
        user={user} 
        onVerified={() => {
          setIsTwoFactorVerified(true);
          sessionStorage.setItem('v_2fa_verified', 'true');
        }}
        onLogout={() => logout()}
      />
    );
  }

  return (
    <>
      <DynamicSEO activeTab={activeTab} />
      <div className="flex flex-col sm:flex-row h-screen bg-vyntra-bg text-vyntra-text font-sans overflow-hidden opacity-100">
        {/* Dynamic Background Effects */}
        <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-vyntra-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="fixed bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-vyntra-secondary/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div 
          className="flex w-full max-w-7xl mx-auto h-full relative z-10 pb-[env(safe-area-inset-bottom)] sm:!pb-0"
        >
          <div className="flex w-full h-[calc(100%-70px)] sm:h-full relative overflow-hidden">
          <Navigation activeTab={activeTab} setActiveTab={setActiveTab} onOpenComposer={() => setIsComposerOpen(true)} />
          
          <main className={`flex-1 flex min-w-0 border-white/5 relative z-10 w-full bg-vyntra-bg sm:border-l sm:border-r shadow-xl ${displayTab === 'messages' ? 'lg:max-w-none' : 'lg:max-w-2xl'}`}>
             {displayTab === 'feed' && <Feed />}
             {displayTab === 'profile' && <ProfileView />}
             {displayTab === 'messages' && <MessagesView />}
             {displayTab === 'explore' && <ExploreView />}
             {displayTab === 'notifications' && <NotificationsView />}
             {displayTab === 'bookmarks' && <BookmarksView />}
             {displayTab === 'analytics' && <AnalyticsDashboard />}
             {displayTab === 'communities' && <CommunitiesView />}
             {displayTab === 'vyntra-ai' && <VyntraAIView />}
             {displayTab === 'security-logs' && <SecurityLogsView />}
             {displayTab === 'more' && <SettingsView />}
             {displayTab === 'post' && <SinglePostView />}
             {displayTab.startsWith('legal-') && <LegalView docType={displayTab.replace('legal-', '')} />}

             {isTransitioning && (
               <div className="absolute inset-0 z-50 bg-vyntra-bg/80 backdrop-blur-md flex flex-col items-center justify-center animate-fadeIn">
                 <img src="/logo.png" className="w-12 h-12 opacity-80 mb-4 animate-[pulse_1s_infinite]" alt="Loading" />
                 <div className="w-8 h-8 rounded-full border-t-2 border-vyntra-primary animate-spin"></div>
               </div>
             )}
          </main>

          {displayTab !== 'messages' && <RightPanel />}
          </div>
        </div>
        
        <MobileNav onOpenComposer={() => setIsComposerOpen(true)} />

        {/* Floating AI Button (Mobile) */}
        <button 
          className="fixed bottom-[85px] right-4 sm:hidden w-12 h-12 bg-vyntra-surface/90 backdrop-blur border border-white/10 rounded-full flex items-center justify-center text-vyntra-secondary shadow-[0_0_15px_rgba(0,212,255,0.3)] z-50 transition-transform active:scale-95"
          onClick={() => setActiveTab('vyntra-ai')}
        >
          <BrainCircuit size={24} />
        </button>

        {isComposerOpen && <ComposerModal onClose={() => setIsComposerOpen(false)} />}
        <NetworkStatusBadge />
      </div>
    </>
  );
}

import { ErrorBoundary } from './components/vyntra/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <NavigationProvider>
        <AppContent />
      </NavigationProvider>
    </ErrorBoundary>
  );
}


