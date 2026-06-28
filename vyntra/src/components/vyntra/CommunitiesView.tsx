import { useState, useMemo } from "react";
import { Users, Search, Plus } from "lucide-react";
import { useCommunities } from "../../hooks/useCommunities";
import { useAuth } from "../../hooks/useAuth";

export function CommunitiesView() {
  const { user } = useAuth();
  const { communities, loading, createCommunity, joinCommunity } = useCommunities();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const [newCommName, setNewCommName] = useState('');
  const [newCommDesc, setNewCommDesc] = useState('');
  
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please login to create a community");
      return;
    }
    if (!newCommName.trim()) return;
    
    await createCommunity(newCommName.trim(), newCommDesc.trim(), user.uid);
    setNewCommName('');
    setNewCommDesc('');
    setIsCreating(false);
  };
  
  const filteredCommunities = useMemo(() => {
    if (!searchQuery.trim()) return communities;
    const lowerQ = searchQuery.toLowerCase();
    return communities.filter(c => 
      c.name.toLowerCase().includes(lowerQ) || 
      c.description?.toLowerCase().includes(lowerQ)
    );
  }, [communities, searchQuery]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto w-full custom-scrollbar bg-vyntra-bg/80 backdrop-blur-md relative">
      <div className="sticky top-0 z-30 bg-vyntra-bg/80 backdrop-blur-xl border-b border-white/10 p-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Communities</h2>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="text-vyntra-text-sec hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
          title="Create Community"
        >
          <Plus size={24} />
        </button>
      </div>
      
      {/* Search Bar */}
      <div className="p-4 border-b border-white/5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-vyntra-text-sec" size={20} />
          <input 
            type="text" 
            placeholder="Search communities..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-transparent rounded-full py-3.5 pl-12 pr-4 text-[15px] focus:outline-none focus:border-vyntra-primary focus:bg-transparent focus:ring-1 focus:ring-vyntra-primary transition-all text-white placeholder-vyntra-text-sec"
          />
        </div>
      </div>

      {isCreating && (
        <div className="p-4 border-b border-white/5 bg-[#1a1f2c]/50">
          <h3 className="font-bold text-lg mb-4">Create a new Community</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <input 
                type="text" 
                placeholder="Community Name" 
                value={newCommName}
                onChange={(e) => setNewCommName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-vyntra-primary outline-none transition-colors"
                maxLength={50}
                required
              />
            </div>
            <div>
              <textarea 
                placeholder="Description (optional)" 
                value={newCommDesc}
                onChange={(e) => setNewCommDesc(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-vyntra-primary outline-none transition-colors min-h-[80px]"
                maxLength={160}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-full font-bold text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={!newCommName.trim()}
                className="bg-white text-vyntra-bg px-6 py-2 rounded-full font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="p-8 flex justify-center">
          <div className="w-8 h-8 border-t-2 border-vyntra-primary rounded-full animate-spin"></div>
        </div>
      ) : filteredCommunities.length > 0 ? (
        <div className="flex flex-col">
          {filteredCommunities.map((community) => {
            const isJoined = user ? (community.members || []).includes(user.uid) : false;
            return (
              <div key={community.id} className="p-4 hover:bg-white/5 transition-colors border-b border-white/5 flex items-start gap-4 cursor-pointer">
                <div className="w-12 h-12 rounded-xl bg-vyntra-primary/10 text-vyntra-primary flex items-center justify-center shrink-0">
                  <Users size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[16px] truncate">{community.name}</h3>
                  {community.description && (
                    <p className="text-vyntra-text-sec text-[14px] mt-1 line-clamp-2">{community.description}</p>
                  )}
                  <div className="text-vyntra-text-sec text-[13px] mt-2 flex items-center gap-2">
                    <span>{community.membersCount || 0} members</span>
                    <span>·</span>
                    <span>Created recently</span>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!user) { alert("Please login to join"); return; }
                    joinCommunity(community.id, user.uid);
                  }}
                  className={`border rounded-full px-5 py-1.5 font-bold text-[14px] transition-colors shrink-0 flex items-center justify-center min-w-[90px] ${
                    isJoined
                      ? "border-white/30 text-white hover:bg-white/10 hover:border-vyntra-error hover:text-vyntra-error hover:after:content-['Leave'] after:content-['Joined']"
                      : "bg-white text-vyntra-bg hover:bg-gray-200 border-transparent after:content-['Join']"
                  }`}
                >
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center text-vyntra-text-sec flex flex-col items-center mt-10">
          <Users size={64} className="mb-4 opacity-20" />
          <h3 className="text-xl font-bold text-white mb-2">No communities found</h3>
          <p className="max-w-xs mx-auto">Try a different search or create a new community yourself.</p>
        </div>
      )}
    </div>
  );
}
