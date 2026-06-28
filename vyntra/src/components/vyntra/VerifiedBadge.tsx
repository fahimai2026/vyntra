import { motion } from "motion/react";
import { Check } from "lucide-react";
import { useVerification } from "../../hooks/useVerification";

interface VerifiedBadgeProps {
  className?: string;
  size?: number;
  followers?: number;
  legacyVerified?: boolean;
  isVerified?: boolean;
}

export function VerifiedBadge({ className = "", size = 20, followers = 0, legacyVerified = false, isVerified = false }: VerifiedBadgeProps) {
  const { isVerified: calculatedVerified, bgClass, glowClass, tooltip, iconColor } = useVerification(followers, legacyVerified, isVerified);

  if (!calculatedVerified) return null;

  return (
    <div className={`relative inline-flex items-center justify-center tooltip group cursor-help ${className}`} title={tooltip}>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 20 }}
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {/* Glow effect */}
        <div className={`absolute inset-0 ${glowClass} rounded-full blur-[4px] opacity-60 group-hover:opacity-100 transition-opacity`}></div>
        
        {/* Main Badge */}
        <div 
          className={`relative z-10 flex items-center justify-center ${bgClass} rounded-full shadow-md`}
          style={{ width: size, height: size }}
        >
          <Check color={iconColor} size={size * 0.65} strokeWidth={3.5} />
        </div>
      </motion.div>
    </div>
  );
}
