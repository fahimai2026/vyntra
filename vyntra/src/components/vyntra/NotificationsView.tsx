import { Bell, Heart, MessageSquare, UserPlus, CheckCheck, Loader2 } from "lucide-react";
import { useNotifications } from "../../hooks/useNotifications";
import { useAuth } from "../../hooks/useAuth";
import { motion } from "motion/react";

export function NotificationsView() {
  const { user } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAllAsRead, 
    markAsRead 
  } = useNotifications(user?.uid);

  const getIcon = (type: "like" | "comment" | "follow") => {
    switch (type) {
      case "like":
        return <Heart className="text-rose-500 fill-rose-500" size={18} />;
      case "comment":
        return <MessageSquare className="text-teal-400 fill-teal-400" size={18} />;
      case "follow":
        return <UserPlus className="text-sky-400" size={18} />;
    }
  };

  const getFormatText = (type: "like" | "comment" | "follow") => {
    switch (type) {
      case "like":
        return "liked your post";
      case "comment":
        return "commented on your post";
      case "follow":
        return "started following you";
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto w-full custom-scrollbar bg-vyntra-bg/80 backdrop-blur-md">
      <div className="sticky top-0 z-30 bg-vyntra-bg/80 backdrop-blur-xl border-b border-white/10 p-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Notifications</h2>
          {unreadCount > 0 && (
            <p className="text-xs text-vyntra-primary mt-0.5">{unreadCount} unread notification{unreadCount > 1 ? "s" : ""}</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white font-medium transition-all"
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-vyntra-primary" size={32} />
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-8 text-center text-vyntra-text-sec flex flex-col items-center mt-20">
          <div className="relative mb-6">
            <Bell size={64} className="text-vyntra-text-sec opacity-20" />
            <div className="absolute top-0 right-0 w-4 h-4 bg-vyntra-primary rounded-full border-2 border-vyntra-bg" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">You're caught up!</h3>
          <p className="max-w-xs mx-auto">No new notifications right now. Keep shares high and enjoy the network!</p>
        </div>
      ) : (
        <div className="p-4 flex flex-col gap-3">
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              onClick={() => markAsRead(notif.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-4 relative group ${
                notif.read 
                  ? "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]" 
                  : "bg-vyntra-primary/5 border-vyntra-primary/30 shadow-[0_0_15px_rgba(108,92,231,0.1)] hover:bg-vyntra-primary/10"
              }`}
            >
              {/* Unread Indicator Badge Dot */}
              {!notif.read && (
                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-vyntra-primary" />
              )}

              {/* Left Column Avatar & Mini Icon */}
              <div className="relative shrink-0">
                <img 
                  src={notif.senderAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${notif.senderName}&backgroundColor=000000`} 
                  alt={notif.senderName} 
                  className="w-11 h-11 rounded-full border border-white/10"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-vyntra-bg border border-white/10 flex items-center justify-center">
                  {getIcon(notif.type)}
                </div>
              </div>

              {/* Content Column */}
              <div className="flex-1 min-w-0">
                <div className="text-sm">
                  <span className="font-bold text-white hover:underline mr-1">{notif.senderName}</span>
                  <span className="text-vyntra-text-sec">{getFormatText(notif.type)}</span>
                </div>
                
                {notif.postContent && (
                  <p className="text-xs text-white/50 mt-1.5 p-2 bg-black/20 rounded-lg line-clamp-2 border border-white/5 italic">
                    "{notif.postContent}"
                  </p>
                )}

                <span className="text-[10px] text-vyntra-text-sec mt-2 block font-mono">
                  {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(notif.createdAt).toLocaleDateString()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
