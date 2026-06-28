export function useVerification(followers: number, legacyVerified: boolean = false, isVerifiedParam?: boolean) {
  // Strictly display only if the Firestore flags ('isVerified: true' or 'verified: true') are enabled
  const hasFirestoreFlag = isVerifiedParam === true || legacyVerified === true;

  if (!hasFirestoreFlag) {
    return {
      isVerified: false,
      badgeType: "none",
      bgClass: "",
      glowClass: "",
      tooltip: "",
      iconColor: "white",
    };
  }

  let badgeType = "blue";
  let bgClass = "bg-[#1D9BF0]";
  let glowClass = "bg-[#1D9BF0]";
  let tooltip = "Verified Creator";
  let iconColor = "white";

  if (followers >= 100000000) {
    badgeType = "partner";
    bgClass = "bg-gradient-to-tr from-[#9945FF] via-[#14F195] to-[#00C2FF]";
    glowClass = "bg-[#14F195]";
    tooltip = "Vyntra Partner (100M+)";
    iconColor = "#0B0F19";
  } else if (followers >= 50000000) {
    badgeType = "celestial";
    bgClass = "bg-gradient-to-tr from-[#FF00AA] via-[#FF88FF] to-[#AA00FF]";
    glowClass = "bg-[#FF00AA]";
    tooltip = "Celestial Creator Badge (50M+)";
    iconColor = "white";
  } else if (followers >= 1000000) {
    badgeType = "diamond";
    bgClass = "bg-gradient-to-tr from-[#00E1FF] via-[#B9F2FF] to-[#00D4FF]";
    glowClass = "bg-[#00E1FF]";
    tooltip = "Diamond Creator Badge (1M+)";
    iconColor = "#0B0F19";
  } else if (followers >= 100000) {
    badgeType = "platinum";
    bgClass = "bg-gradient-to-tr from-[#E5E4E2] via-[#FFFFFF] to-[#B0B0B0]";
    glowClass = "bg-[#E5E4E2]";
    tooltip = "Platinum Influencer Badge (100K+)";
    iconColor = "#0B0F19";
  } else if (followers >= 50000) {
    badgeType = "gold";
    bgClass = "bg-gradient-to-tr from-[#FFB800] via-[#FFD700] to-[#F1A000]";
    glowClass = "bg-[#FFD700]";
    tooltip = "Gold Verified Badge (50K+)";
  } else if (followers >= 1000) {
    badgeType = "blue";
    bgClass = "bg-[#1D9BF0]";
    glowClass = "bg-[#1D9BF0]";
    tooltip = "Blue Verified Badge (1K+)";
  }

  return {
    isVerified: true,
    badgeType,
    bgClass,
    glowClass,
    tooltip,
    iconColor,
  };
}
