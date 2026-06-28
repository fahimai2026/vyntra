import { BrainCircuit, Settings2, ShieldCheck, Activity, Search } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export function AICopilot() {
  const { user } = useAuth();
  
  if (!user) return null;
  
  const aiTwinName = user.name ? `${user.name.split(' ')[0]}-01` : "User-01";

  // Simulate minimal AI metrics dynamically based on uid
  const trustScore = 90 + Math.floor(user.uid.charCodeAt(0) % 10);
  const repliesHandled = Math.floor(user.uid.charCodeAt(1) % 15);

  return (
    <div className="hidden xl:flex flex-col w-80 glass-panel border-l-0 border-white/5 p-4 space-y-6 flex-shrink-0 h-full overflow-y-auto">
      
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-vyntra-text-sec" size={18} />
        <input 
          type="text" 
          placeholder="Ask AI or search intents..." 
          className="w-full bg-vyntra-surface/50 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-vyntra-secondary/50 focus:bg-vyntra-surface transition-all text-white placeholder-vyntra-text-sec"
        />
      </div>

      {/* AI Twin Status */}
      <div className="glass-card rounded-2xl p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-vyntra-primary/20 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none"></div>
        <div className="flex items-center justify-between mb-4 relative z-10">
          <h3 className="font-bold flex items-center gap-2 text-sm tracking-wide">
            <BrainCircuit size={16} className="text-vyntra-secondary" />
            {aiTwinName} Co-Pilot
          </h3>
          <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-vyntra-success bg-vyntra-success/10 px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-vyntra-success animate-pulse"></span> Active
          </span>
        </div>
        
        <div className="space-y-3 relative z-10">
          <div className="bg-vyntra-bg/40 rounded-xl p-3 border border-white/5 text-xs">
            <div className="text-vyntra-text-sec mb-1 flex justify-between">
              <span>Auto-Replies Handled</span>
              <span className="text-white">{repliesHandled} today</span>
            </div>
            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-vyntra-primary to-vyntra-secondary w-3/4 h-full"></div>
            </div>
          </div>
          
          <div className="bg-vyntra-bg/40 rounded-xl p-3 border border-white/5 text-xs">
            <div className="text-vyntra-primary font-medium mb-1">Current Action:</div>
            <p className="text-vyntra-text-sec">Analyzing network intents and summarizing your customized feed.</p>
          </div>
          
          <button className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold transition-colors border border-white/10 flex items-center justify-center gap-2">
            <Settings2 size={14} /> Configure Twin Protocol
          </button>
        </div>
      </div>

      {/* Trust & Identity Context */}
      <div className="glass-card rounded-2xl p-4">
        <h3 className="font-bold text-sm tracking-wide mb-4 text-vyntra-text-sec uppercase">Identity Node</h3>
        
        <div className="flex items-end gap-2 mb-2">
          <span className="text-4xl font-light text-gradient-accent">{trustScore}</span>
          <span className="text-sm text-vyntra-text-sec mb-1">Trust Score</span>
        </div>
        
        <div className="space-y-2 mt-4">
          <div className="flex items-center gap-2 text-sm text-white">
            <ShieldCheck size={16} className="text-vyntra-success" />
            <span>ZK Humanity Proof Valid</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white">
            <Activity size={16} className="text-vyntra-secondary" />
            <span>Reputation: Active Member</span>
          </div>
        </div>
      </div>

      {/* Local Subgraph Suggestions */}
      <div className="glass-card rounded-2xl p-4 flex-1">
        <h3 className="font-bold text-sm tracking-wide mb-4 text-vyntra-text-sec uppercase flex justify-between items-center">
          Network Intents
          <span className="text-[10px] text-vyntra-secondary cursor-pointer hover:underline">View Graph</span>
        </h3>
        
        <div className="space-y-3">
          {[
            { tag: "#WebUI", match: "99%", users: 142 },
            { tag: "#LiveUpdates", match: "94%", users: 89 },
            { tag: "#RealTimeSync", match: "88%", users: 312 },
          ].map((intent, i) => (
            <div key={i} className="group cursor-pointer bg-vyntra-bg/30 p-2.5 rounded-xl border border-transparent hover:border-vyntra-secondary/30 transition-colors">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-white">{intent.tag}</span>
                <span className="text-xs font-mono text-vyntra-accent">{intent.match}</span>
              </div>
              <div className="text-[11px] text-vyntra-text-sec">{intent.users} nodes clustered nearby</div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center text-[10px] text-vyntra-text-sec opacity-50 flex flex-wrap justify-center gap-2 pb-4">
        <a href="#" className="hover:opacity-100">Terms</a>
        <a href="#" className="hover:opacity-100">Privacy Map</a>
        <a href="#" className="hover:opacity-100">AI Ethics</a>
        <a href="#" className="hover:opacity-100">Protocol 2026</a>
        <span>© Vyntra</span>
      </div>

    </div>
  );
}
