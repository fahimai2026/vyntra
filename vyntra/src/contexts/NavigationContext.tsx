import React, { createContext, useContext, useState } from 'react';
import { trackPageView } from '../utils/analytics';

interface NavigationContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  profileUserId: string | null;
  navigateProfile: (userId: string | null) => void;
  activePostId: string | null;
  navigateToPost: (postId: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState('feed');
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [activePostId, setActivePostId] = useState<string | null>(null);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('post');
    const tab = urlParams.get('tab');
    if (postId) {
      setActivePostId(postId);
      setActiveTab('post');
    } else if (tab) {
      setActiveTab(tab);
    }
  }, []);

  React.useEffect(() => {
    trackPageView(activeTab, `Vyntra - ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`);
  }, [activeTab]);

  const navigateProfile = (userId: string | null) => {
    setProfileUserId(userId);
    setActiveTab('profile');
    window.history.pushState({}, '', `/?tab=profile${userId ? `&user=${userId}` : ''}`);
  };

  const navigateToPost = (postId: string) => {
    setActivePostId(postId);
    setActiveTab('post');
    window.history.pushState({}, '', `/?post=${postId}`);
  };

  const handleSetActiveTab = (tab: string) => {
    setActiveTab(tab);
    if (tab !== 'post' && tab !== 'profile') {
      window.history.pushState({}, '', `/?tab=${tab}`);
    }
  };

  return (
    <NavigationContext.Provider value={{ activeTab, setActiveTab: handleSetActiveTab, profileUserId, navigateProfile, activePostId, navigateToPost }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
