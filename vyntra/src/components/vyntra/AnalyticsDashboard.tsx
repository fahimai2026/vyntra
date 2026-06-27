import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, MessageSquareText, Activity, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

export function AnalyticsDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // States for metrics
  const [reachData, setReachData] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [sentimentData, setSentimentData] = useState<any[]>([]);
  
  const [totalReach, setTotalReach] = useState(0);
  const [totalPosts, setTotalPosts] = useState(0);
  
  useEffect(() => {
    if (!user) return;
    
    // Fetch data for analytics
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        // 1. Fetch user's posts
        const postsRef = collection(db, 'posts');
        const q = query(postsRef, where('authorId', '==', user.uid));
        const snippet = await getDocs(q);
        
        const posts = snippet.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        
        setTotalPosts(posts.length);
        
        // --- Process Post Reach over time (Likes + Comments) ---
        // For line chart
        const reachByDate: Record<string, number> = {};
        let totalEngagement = 0;
        
        // --- Process Activity Frequency ---
        const activityByDate: Record<string, number> = {};
        
        posts.forEach(post => {
           const date = new Date(post.createdAt);
           const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
           
           const engagement = (post.likesCount || 0) + (post.commentsCount || 0) + (post.repostsCount || 0);
           totalEngagement += engagement;
           
           reachByDate[dateStr] = (reachByDate[dateStr] || 0) + engagement;
           activityByDate[dateStr] = (activityByDate[dateStr] || 0) + 1;
        });
        
        setTotalReach(totalEngagement);
        
        // Format for recharts
        // Ensure some baseline data dates even if empty for visual
        const formattedReach = Object.keys(reachByDate).slice(0, 7).map(date => ({
           date,
           reach: reachByDate[date]
        }));
        
        const formattedActivity = Object.keys(activityByDate).slice(0, 7).map(date => ({
           date,
           posts: activityByDate[date]
        }));
        
        // If empty, add dummy structure
        if (formattedReach.length === 0) {
            const today = new Date();
            for(let i=6; i>=0; i--) {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                const ds = `${d.getMonth()+1}/${d.getDate()}`;
                formattedReach.push({ date: ds, reach: 0 });
                formattedActivity.push({ date: ds, posts: 0 });
            }
        }
        
        setReachData(formattedReach);
        setActivityData(formattedActivity);
        
        // --- Process Engagement Breakdown ---
        let totalLikes = 0;
        let totalComments = 0;
        let totalReposts = 0;

        posts.forEach(post => {
           totalLikes += (post.likesCount || 0);
           totalComments += (post.commentsCount || 0);
           totalReposts += (post.repostsCount || 0);
        });

        const totalInteractions = totalLikes + totalComments + totalReposts;
        
        let likesPct = 0;
        let commentsPct = 0;
        let repostsPct = 0;

        if (totalInteractions > 0) {
          likesPct = Math.round((totalLikes / totalInteractions) * 100);
          commentsPct = Math.round((totalComments / totalInteractions) * 100);
          repostsPct = 100 - likesPct - commentsPct;
        } else {
          likesPct = 100; // default for 0 interactions
        }

        setSentimentData([
          { name: 'Likes', value: likesPct, color: '#00d2ff' }, // vyntra-primary
          { name: 'Comments', value: commentsPct, color: '#3a3a4c' },  // vyntra-surface
          { name: 'Reposts', value: repostsPct, color: '#ff3b30' }  // vyntra-error
        ]);
        
        setLoading(false);
      } catch (e) {
        console.error("Error fetching analytics:", e);
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [user]);

  if (!user) {
     return (
       <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
         <AlertCircle className="w-16 h-16 text-vyntra-text-sec mb-4" />
         <h2 className="text-xl font-bold mb-2">Analytics Requires Login</h2>
         <p className="text-vyntra-text-sec">Please sign in to view your personalized dashboard.</p>
       </div>
     );
  }

  if (loading) {
     return (
       <div className="flex-1 flex items-center justify-center h-full">
         <div className="w-8 h-8 rounded-full border-t-2 border-vyntra-primary animate-spin"></div>
       </div>
     );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col relative w-full h-full pb-20 sm:pb-0 relative z-10">
      <div className="sticky top-0 z-20 bg-vyntra-bg/80 backdrop-blur-md border-b border-white/5 p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
           <TrendingUp className="text-vyntra-primary" />
           Analytics Dashboard
        </h1>
      </div>
      
      <div className="p-4 sm:p-6 space-y-6">
         {/* Top KPI Cards */}
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-vyntra-surface border border-white/5 p-4 rounded-2xl flex items-center gap-4"
            >
               <div className="w-12 h-12 rounded-full bg-vyntra-primary/10 flex items-center justify-center text-vyntra-primary">
                  <Users size={24} />
               </div>
               <div>
                  <div className="text-vyntra-text-sec text-sm">Total Engagement Reach</div>
                  <div className="text-2xl font-bold text-white">{totalReach}</div>
               </div>
            </motion.div>
            
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
               className="bg-vyntra-surface border border-white/5 p-4 rounded-2xl flex items-center gap-4"
            >
               <div className="w-12 h-12 rounded-full bg-vyntra-accent/10 flex items-center justify-center text-vyntra-accent">
                  <Activity size={24} />
               </div>
               <div>
                  <div className="text-vyntra-text-sec text-sm">Total Posts Authored</div>
                  <div className="text-2xl font-bold text-white">{totalPosts}</div>
               </div>
            </motion.div>
         </div>
         
         {/* Charts Layout */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Post Reach Chart */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-vyntra-surface border border-white/5 p-5 rounded-2xl col-span-1 lg:col-span-2"
            >
               <h2 className="text-[16px] font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp size={18} className="text-vyntra-primary" />
                  Engagement Reach Over Time
               </h2>
               <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={reachData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                           <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00d2ff" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#00d2ff" stopOpacity={0}/>
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="date" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                        <RechartsTooltip 
                           contentStyle={{ backgroundColor: '#1c1c24', border: '1px solid #ffffff10', borderRadius: '12px', color: '#fff' }} 
                           itemStyle={{ color: '#00d2ff' }}
                        />
                        <Area type="monotone" dataKey="reach" stroke="#00d2ff" strokeWidth={3} fillOpacity={1} fill="url(#colorReach)" />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
            </motion.div>

            {/* Activity Frequency Chart */}
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.3 }}
               className="bg-vyntra-surface border border-white/5 p-5 rounded-2xl"
            >
               <h2 className="text-[16px] font-bold text-white mb-4 flex items-center gap-2">
                  <Activity size={18} className="text-vyntra-accent" />
                  Activity Frequency
               </h2>
               <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="date" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                        <RechartsTooltip 
                           cursor={{fill: '#ffffff05'}}
                           contentStyle={{ backgroundColor: '#1c1c24', border: '1px solid #ffffff10', borderRadius: '12px', color: '#fff' }} 
                        />
                        <Bar dataKey="posts" fill="#6c5ce7" radius={[4, 4, 0, 0]} />
                     </BarChart>
                  </ResponsiveContainer>
               </div>
            </motion.div>

            {/* Sentiment Analysis Chart */}
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.4 }}
               className="bg-vyntra-surface border border-white/5 p-5 rounded-2xl"
            >
               <h2 className="text-[16px] font-bold text-white mb-4 flex items-center gap-2">
                  <MessageSquareText size={18} className="text-vyntra-success" />
                  Engagement Breakdown
               </h2>
               <div className="h-[200px] w-full flex items-center">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                           data={sentimentData}
                           cx="50%"
                           cy="50%"
                           innerRadius={60}
                           outerRadius={80}
                           paddingAngle={5}
                           dataKey="value"
                           stroke="none"
                        >
                           {sentimentData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                           ))}
                        </Pie>
                        <RechartsTooltip 
                           contentStyle={{ backgroundColor: '#1c1c24', border: '1px solid #ffffff10', borderRadius: '12px', color: '#fff' }} 
                           itemStyle={{ color: '#fff' }}
                        />
                     </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Legend next to pie */}
                  <div className="flex flex-col gap-3 pr-4">
                     {sentimentData.map((entry, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                           <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                           <div className="text-sm font-medium text-white">{entry.name}</div>
                           <div className="text-xs text-vyntra-text-sec ml-auto">{entry.value}%</div>
                        </div>
                     ))}
                  </div>
               </div>
            </motion.div>
            
         </div>
      </div>
    </div>
  );
}
