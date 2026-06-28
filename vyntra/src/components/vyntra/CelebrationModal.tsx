import { motion, AnimatePresence } from "motion/react";
import { Check, X } from "lucide-react";
import { VerifiedBadge } from "./VerifiedBadge";
import { useEffect } from "react";
import confetti from "canvas-confetti";

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: number;
  followersCount: number;
}

export function CelebrationModal({ isOpen, onClose, tier, followersCount }: CelebrationModalProps) {
  
  let title = "Congratulations!";
  let badgeName = "Blue Creator Badge";
  let colorHex = "#1D9BF0";
  let countLabel = "100";

  switch (tier) {
    case 4:
      badgeName = "Diamond Badge";
      colorHex = "#00E1FF";
      countLabel = "100,000";
      title = "Incredible Milestone!";
      break;
    case 3:
      badgeName = "Gold Influencer Badge";
      colorHex = "#FFD700";
      countLabel = "10,000";
      title = "Amazing Achievement!";
      break;
    case 2:
      badgeName = "Premium Verified Badge";
      colorHex = "#6C5CE7";
      countLabel = "1,000";
      break;
    case 1:
    default:
      badgeName = "Blue Creator Badge";
      colorHex = "#1D9BF0";
      countLabel = "100";
      break;
  }

  useEffect(() => {
    if (isOpen) {
      const duration = 3 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: [colorHex, '#ffffff']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: [colorHex, '#ffffff']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isOpen, colorHex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`bg-[#111827] border rounded-3xl p-6 sm:p-8 max-w-sm w-full relative text-center text-white`}
            style={{ 
              borderColor: `${colorHex}40`,
              boxShadow: `0 0 50px ${colorHex}30` 
            }}
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="flex justify-center mb-6">
              <VerifiedBadge size={80} followers={followersCount} />
            </div>

            <h2 className="text-2xl font-bold mb-2">{title}</h2>
            <p className="text-vyntra-text-sec text-[15px] leading-relaxed mb-6">
              You have reached {countLabel} followers and earned the <strong style={{ color: colorHex }}>{badgeName}</strong>. You are now officially recognized at this tier!
            </p>

            <button 
              onClick={onClose}
              className="w-full py-3 text-white font-bold rounded-full transition-all"
              style={{ 
                backgroundColor: colorHex,
                boxShadow: `0 0 20px ${colorHex}60`,
                color: tier === 4 ? "#0B0F19" : "#FFFFFF"
              }}
            >
              Awesome
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
