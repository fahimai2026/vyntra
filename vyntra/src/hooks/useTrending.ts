import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { PostData } from './usePosts';

export interface TrendingTag {
  tag: string;
  postsCount: number;
  category: string;
}

export function useTrending() {
  const [trendingTags, setTrendingTags] = useState<TrendingTag[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch server-side ranked posts
  useEffect(() => {
    const fetchRanked = async () => {
      try {
        const res = await fetch("/api/posts/trending-ranking");
        if (res.ok) {
          const data = await res.json();
          setTrendingPosts(data.slice(0, 10)); // Take top 10 trending posts
        }
      } catch (err) {
        console.error("Failed to fetch server-side gravity ranked posts:", err);
      }
    };
    
    fetchRanked();
    // Re-fetch every 2 minutes
    const interval = setInterval(fetchRanked, 120000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // 2 days ago
    const twoDaysAgo = Date.now() - (2 * 24 * 60 * 60 * 1000);
    
    // Fetch recent posts ordered by createdAt desc
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => doc.data() as PostData);
      
      const recentPosts = posts.filter(p => (p.createdAt || 0) >= twoDaysAgo);
      
      // Extract hashtags
      const tagMap: Record<string, number> = {};
      
      recentPosts.forEach(post => {
        const content = post.content || '';
        // Match words starting with #
        const matches = content.match(/#[a-zA-Z0-9_\u0980-\u09FF]+/g);
        if (matches) {
          // unique tags per post
          const uniqueTagsInPost = new Set(matches.map(t => t.toLowerCase()));
          uniqueTagsInPost.forEach(tag => {
            tagMap[tag] = (tagMap[tag] || 0) + 1;
            // Weigh likes/comments
            tagMap[tag] += (post.likesCount || 0) * 2;
            tagMap[tag] += (post.commentsCount || 0) * 3;
            tagMap[tag] += (post.repostsCount || 0) * 4;
          });
        }
      });
      
      const sortedTags: TrendingTag[] = Object.keys(tagMap)
        .map(tag => ({
          tag,
          postsCount: tagMap[tag],
          category: 'Trending'
        }))
        .sort((a, b) => b.postsCount - a.postsCount)
        .slice(0, 10);
      
      setTrendingTags(sortedTags);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching trending posts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { trendingTags, trendingPosts, loading };
}
