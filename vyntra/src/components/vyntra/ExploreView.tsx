import { useState, useEffect } from "react";
import { Search, User, Users, Hash, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useUsers } from "../../hooks/useUsers";
import { useCommunities } from "../../hooks/useCommunities";
import { useTrending } from "../../hooks/useTrending";

export function ExploreView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<{people: any[], communities: any[], topics: any[]}>({ people: [], communities: [], topics: [] });

  const { users } = useUsers();
  const { communities } = useCommunities();
  const { trendingTags } = useTrending();

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults({ people: [], communities: [], topics: [] });
      return;
    }

    setIsSearching(true);
    const delay = setTimeout(() => {
      const lowerTerm = searchTerm.toLowerCase();
      setResults({
        people: users.filter(p => (p.name || '').toLowerCase().includes(lowerTerm) || (p.handle || '').toLowerCase().includes(lowerTerm)),
        communities: communities.filter(c => (c.name || '').toLowerCase().includes(lowerTerm)),
        topics: trendingTags.filter((t: any) => (t.tag || '').toLowerCase().includes(lowerTerm)),
      });
      setIsSearching(false);
    }, 400);

    return () => clearTimeout(delay);
  }, [searchTerm, users, communities, trendingTags]);

  const hasResults = results.people.length > 0 || results.communities.length > 0 || results.topics.length > 0;

  return (
    <div className="flex-1 h-full overflow-y-auto w-full custom-scrollbar bg-vyntra-bg/80 backdrop-blur-md">
      <div className="sticky top-0 z-30 bg-vyntra-bg/80 backdrop-blur-xl border-b border-vyntra-border p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-vyntra-text-sec" size={20} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search communities, people, topics..." 
            className="w-full bg-white/5 border border-vyntra-border rounded-full py-3 pl-12 pr-10 text-[15px] focus:outline-none focus:border-vyntra-primary focus:bg-transparent focus:ring-1 focus:ring-vyntra-primary transition-all text-white placeholder-vyntra-text-sec"
          />
          {isSearching && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-vyntra-primary animate-spin" size={18} />
          )}
        </div>
      </div>
      
      <div className="p-4">
        {!searchTerm.trim() ? (
          <div className="pt-8 text-center text-vyntra-text-sec flex flex-col items-center">
            <Search size={48} className="mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-white mb-2">Explore the Vyntra network</h3>
            <p className="max-w-[280px]">Find new creators, trending topics, and growing communities.</p>
          </div>
        ) : !hasResults && !isSearching ? (
          <div className="pt-8 text-center text-vyntra-text-sec">
             <p>No results found for "{searchTerm}"</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
             {results.people.length > 0 && (
               <div>
                  <h4 className="text-sm font-bold text-vyntra-text-sec uppercase tracking-wider mb-3 px-2">People</h4>
                  <div className="flex flex-col gap-2">
                    {results.people.map(person => (
                       <button key={person.id} className="flex items-center gap-3 w-full p-2 hover:bg-white/5 rounded-xl transition-colors text-left">
                          <img src={person.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${person.name}&backgroundColor=000000`} alt={person.name} className="w-10 h-10 rounded-full bg-vyntra-surface" />
                          <div>
                            <div className="font-bold text-white text-sm">{person.name}</div>
                            <div className="text-vyntra-text-sec text-xs">{person.handle}</div>
                          </div>
                       </button>
                    ))}
                  </div>
               </div>
             )}

             {results.communities.length > 0 && (
               <div>
                  <h4 className="text-sm font-bold text-vyntra-text-sec uppercase tracking-wider mb-3 px-2">Communities</h4>
                  <div className="flex flex-col gap-2">
                    {results.communities.map(community => (
                       <button key={community.id} className="flex items-center w-full gap-3 p-2 hover:bg-white/5 rounded-xl transition-colors text-left">
                          <div className="w-10 h-10 rounded-xl bg-vyntra-primary/20 text-vyntra-primary flex items-center justify-center shrink-0">
                             <Users size={20} />
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">{community.name}</div>
                            <div className="text-vyntra-text-sec text-xs">{community.members} members</div>
                          </div>
                       </button>
                    ))}
                  </div>
               </div>
             )}

             {results.topics.length > 0 && (
               <div>
                  <h4 className="text-sm font-bold text-vyntra-text-sec uppercase tracking-wider mb-3 px-2">Topics</h4>
                  <div className="flex flex-col gap-2">
                    {results.topics.map(topic => (
                       <button key={topic.id} className="flex items-center gap-3 w-full p-2 hover:bg-white/5 rounded-xl transition-colors text-left">
                          <div className="w-10 h-10 rounded-full bg-white/5 text-vyntra-text-sec flex items-center justify-center shrink-0">
                             <Hash size={20} />
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">{topic.name}</div>
                            <div className="text-vyntra-text-sec text-xs">{topic.posts} posts</div>
                          </div>
                       </button>
                    ))}
                  </div>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
