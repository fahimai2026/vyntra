import { Settings, Shield, Key, Bell, Moon, Smartphone, HelpCircle, LogOut, ArrowLeft, ChevronRight, Check, BarChart2, Sparkles, Sliders, KeyRound, Copy, Download, RefreshCcw } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { PasswordStrengthMeter, evaluatePasswordStrength } from "./PasswordStrengthMeter";
import { usePosts } from "../../hooks/usePosts";
import { EditProfileModal } from "./EditProfileModal";
import { useState, useEffect } from "react";
import { AISupportChat } from "./AISupportChat";
import { auth } from "../../firebase";
import { generateRandomBase32Secret } from "../../utils/totp";

export function SettingsView() {
  const { logout, updateUserPreferences, user } = useAuth();
  const { posts } = usePosts();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeSetting, setActiveSetting] = useState<string | null>(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [privateAccount, setPrivateAccount] = useState((user as any)?.isPrivate || false);
  const [hiddenWordInput, setHiddenWordInput] = useState("");

  // New States for Password Changes
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordStatusMsg, setPasswordStatusMsg] = useState("");
  const [passwordIsSubmitting, setPasswordIsSubmitting] = useState(false);
  const [isPasswordFormVisible, setIsPasswordFormVisible] = useState(false);

  // New States for 2FA
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaOtpauthUrl, setMfaOtpauthUrl] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [mfaStatusMsg, setMfaStatusMsg] = useState("");
  const [mfaIsSubmitting, setMfaIsSubmitting] = useState(false);
  const [is2faFormVisible, setIs2faFormVisible] = useState(false);
  const [isRecoveryCodesVisible, setIsRecoveryCodesVisible] = useState(false);
  const [tempPlainCodes, setTempPlainCodes] = useState<string[] | null>(null);

  // Sync privateAccount when user document updates reactively
  useEffect(() => {
    if (user) {
      setPrivateAccount((user as any).isPrivate || false);
    }
  }, [user]);

  const toggleTopic = async (topic: string) => {
    if (!user) return;
    const currentTopics = user.contentPreferences?.topics || [];
    let newTopics;
    if (currentTopics.includes(topic)) {
      newTopics = currentTopics.filter(t => t !== topic);
    } else {
      newTopics = [...currentTopics, topic];
    }
    await updateUserPreferences({
      contentPreferences: {
        ...user.contentPreferences,
        topics: newTopics
      }
    });
  };

  const addHiddenWord = async () => {
    if (!user || !hiddenWordInput.trim()) return;
    const word = hiddenWordInput.trim();
    const currentWords = user.contentPreferences?.hiddenWords || [];
    if (currentWords.includes(word)) return;
    
    await updateUserPreferences({
      contentPreferences: {
        ...user.contentPreferences,
        hiddenWords: [...currentWords, word]
      }
    });
    setHiddenWordInput("");
  };

  const removeHiddenWord = async (word: string) => {
    if (!user) return;
    const currentWords = user.contentPreferences?.hiddenWords || [];
    await updateUserPreferences({
      contentPreferences: {
        ...user.contentPreferences,
        hiddenWords: currentWords.filter(w => w !== word)
      }
    });
  };

  const handleTogglePrivate = async () => {
    const newValue = !privateAccount;
    setPrivateAccount(newValue);
    if (user) {
      await updateUserPreferences({ isPrivate: newValue } as any);
      alert(`Account is now ${newValue ? 'Private' : 'Public'}`);
    }
  };

  const handleToggleTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  };

  const handleResetPassword = async () => {
    if (!user || !user.email) return;
    try {
      const { sendPasswordResetEmail } = await import("firebase/auth");
      await sendPasswordResetEmail(auth, user.email);
      alert(`Password reset link sent successfully to ${user.email}! Please check your email inbox.`);
    } catch (err: any) {
      alert(`Error sending reset link: ${err.message}`);
    }
  };

  const handleChangePasswordSubmit = async () => {
    if (!auth.currentUser) return;
    if (!currentPassword) {
      setPasswordStatusMsg("Please enter your current password.");
      return;
    }
    const strength = evaluatePasswordStrength(newPassword);
    if (strength.score < 3) {
      setPasswordStatusMsg("Passwords must be at least 'Fair' quality (requires meeting 3 metrics) to register.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordStatusMsg("Passwords do not match.");
      return;
    }

    setPasswordIsSubmitting(true);
    setPasswordStatusMsg("");

    try {
      const userEmail = auth.currentUser.email;
      if (!userEmail) throw new Error("No authenticated email found.");
      
      const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import("firebase/auth");
      const credential = EmailAuthProvider.credential(userEmail, currentPassword);
      
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      
      setPasswordStatusMsg("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      
      setTimeout(() => {
        setIsPasswordFormVisible(false);
      }, 2000);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setPasswordStatusMsg("Incorrect current password.");
      } else {
        setPasswordStatusMsg(err.message || "Failed to update password.");
      }
    } finally {
      setPasswordIsSubmitting(false);
    }
  };

  const generateRecoveryCodes = (count = 8): string[] => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; 
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      let part1 = "";
      let part2 = "";
      for (let j = 0; j < 4; j++) {
        part1 += chars.charAt(Math.floor(Math.random() * chars.length));
        part2 += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      codes.push(`${part1}-${part2}`);
    }
    return codes;
  };

  const handleEnableMfaSubmit = async () => {
    if (!user) return;
    if (otpToken.length !== 6) {
      setMfaStatusMsg("Please enter a valid 6-digit verification code.");
      return;
    }

    setMfaIsSubmitting(true);
    setMfaStatusMsg("");

    try {
      const { verifyTOTP } = await import("../../utils/totp");
      const isValid = await verifyTOTP(otpToken, mfaSecret);
      
      if (!isValid) {
        setMfaStatusMsg("Invalid verification code. Please check your app-time and try again.");
        setMfaIsSubmitting(false);
        return;
      }

      const generatedCodes = generateRecoveryCodes();
      setTempPlainCodes(generatedCodes);
      const { hashRecoveryCode } = await import("../../utils/totp");
      const hashedCodes = await Promise.all(
        generatedCodes.map(code => hashRecoveryCode(code))
      );
      await updateUserPreferences({
        twoFactorEnabled: true,
        twoFactorSecret: mfaSecret,
        twoFactorRecoveryCodes: hashedCodes
      });

      setMfaStatusMsg("Two-Factor Authentication enabled successfully!");
      setOtpToken("");
      sessionStorage.setItem('v_2fa_verified', 'true');

      setTimeout(() => {
        setIs2faFormVisible(false);
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setMfaStatusMsg(err.message || "Failed to enable two factor authentication.");
    } finally {
      setMfaIsSubmitting(false);
    }
  };

  const handleDisableMfaSubmit = async () => {
    if (!user || !(user as any).twoFactorSecret) return;
    if (otpToken.length !== 6) {
      setMfaStatusMsg("Please enter a valid 6-digit verification code.");
      return;
    }

    setMfaIsSubmitting(true);
    setMfaStatusMsg("");

    try {
      const { verifyTOTP } = await import("../../utils/totp");
      const isValid = await verifyTOTP(otpToken, (user as any).twoFactorSecret);
      
      if (!isValid) {
        setMfaStatusMsg("Invalid verification code. Please check your app-time and try again.");
        setMfaIsSubmitting(false);
        return;
      }

      await updateUserPreferences({
        twoFactorEnabled: false,
        twoFactorSecret: "",
        twoFactorRecoveryCodes: []
      });

      setMfaStatusMsg("Two-Factor Authentication disabled successfully.");
      setOtpToken("");
      sessionStorage.removeItem('v_2fa_verified');

      setTimeout(() => {
        setIs2faFormVisible(false);
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setMfaStatusMsg(err.message || "Failed to disable two-factor authentication.");
    } finally {
      setMfaIsSubmitting(false);
    }
  };

  const handleCopyCodes = () => {
    const codes = tempPlainCodes || [];
    if (codes.length === 0) {
      alert("🔒 For security reasons, recovery codes can only be copied when they are first generated. If you did not save them, please click 'Regenerate Codes' to create a new set.");
      return;
    }
    navigator.clipboard.writeText(codes.join("\n"));
    alert("Backup recovery codes copied to clipboard!");
  };

  const handleDownloadCodes = () => {
    const codes = tempPlainCodes || [];
    if (codes.length === 0) {
      alert("🔒 For security reasons, recovery codes can only be downloaded when they are first generated. If you did not save them, please click 'Regenerate Codes' to create a new set.");
      return;
    }
    const content = `==================================================
VYNTRA SECURITY - TWO-FACTOR RECOVERY CODES
==================================================
Keep these backup recovery codes in an extremely safe, offline place.
Each backup recovery code can ONLY be used ONCE.

Active Backup Recovery Codes:
${codes.map((code, idx) => `[ ] Code ${idx + 1}: ${code}`).join("\n")}

Generated on: ${new Date().toLocaleString()}
Account Email: ${user?.email || 'N/A'}
User Handle: ${user?.handle || 'N/A'}
==================================================`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vyntra-backup-recovery-codes.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRegenerateCodes = async () => {
    if (!window.confirm("Are you sure you want to regenerate your recovery codes? This will immediately invalidate all of of your previous recovery codes.")) {
      return;
    }
    const newCodes = generateRecoveryCodes();
    try {
      setTempPlainCodes(newCodes);
      const { hashRecoveryCode } = await import("../../utils/totp");
      const hashedCodes = await Promise.all(
        newCodes.map(code => hashRecoveryCode(code))
      );
      await updateUserPreferences({
        twoFactorRecoveryCodes: hashedCodes
      });
      alert("New backup recovery codes have been generated and saved securely to Cloud Firestore!");
    } catch (err: any) {
      alert(`Error regenerating codes: ${err.message || err}`);
    }
  };

  const handleHelpCenter = () => {
    window.open('https://support.google.com', '_blank');
  };

  const handleContactSupport = () => {
    window.location.href = 'mailto:support@vyntra.com';
  };

  const settingsOptions = [
    { id: "account", icon: UserIcon, title: "Account", desc: "Manage your account settings" },
    { id: "content", icon: Sliders, title: "Content Preferences", desc: "Manage your topics and interests" },
    { id: "privacy", icon: Shield, title: "Privacy & Security", desc: "Control who sees your content" },
    { id: "security", icon: Key, title: "Security", desc: "Password and authentication" },
    { id: "notifications", icon: Bell, title: "Notifications", desc: "Push & email preferences" },
    { id: "display", icon: Moon, title: "Display", desc: "Theme and accessibility" },
    { id: "devices", icon: Smartphone, title: "Devices", desc: "Manage logged in sessions" },
    { id: "support", icon: HelpCircle, title: "Help & Support", desc: "Contact us and FAQs" },
  ];

  if (user && user.followersCount >= 100000000) {
    settingsOptions.splice(1, 0, { id: "partner", icon: Sparkles, title: "Partner Program", desc: "Monetization and advanced creator tools" });
  }

  return (
    <div className="flex-1 h-full w-full bg-vyntra-bg/80 backdrop-blur-md relative flex flex-col">
      <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
      
      {activeSetting ? (
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col w-full h-full">
          <div className="sticky top-0 z-30 bg-vyntra-bg/80 backdrop-blur-xl border-b border-white/10 p-4 pt-6 flex items-center gap-4">
            <button type="button" onClick={() => setActiveSetting(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft size={20} className="text-vyntra-text" />
            </button>
            <h2 className="text-xl font-bold flex items-center gap-2 text-vyntra-text">
              {settingsOptions.find(o => o.id === activeSetting)?.title}
            </h2>
          </div>
          
          <div className="p-4 space-y-4 pb-24 text-vyntra-text flex-1">
            {activeSetting === "partner" && (
              <div className="bg-gradient-to-tr from-[#9945FF]/20 via-[#14F195]/20 to-[#00C2FF]/20 rounded-2xl border border-[#14F195]/30 p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-black/40 z-0"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-[#9945FF] via-[#14F195] to-[#00C2FF] rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(20,241,149,0.5)] mb-6">
                    <Sparkles size={32} className="text-[#0B0F19]" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Vyntra Partner Program</h3>
                  <p className="text-[#AAB2C8] mb-8 max-w-md mx-auto">
                    Congratulations! You have reached 100 Million followers. You now have access to exclusive monetization tools, direct VIP support, and advanced analytics.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                    <div className="bg-black/40 border border-white/10 p-4 rounded-xl">
                      <h4 className="font-bold text-white">Revenue Share</h4>
                      <p className="text-sm text-[#AAB2C8] mt-1">Earn 70% of ad revenue generated from your posts.</p>
                      <button className="mt-3 text-xs bg-[#14F195] text-black font-bold px-3 py-1.5 rounded-lg w-full text-center">Manage Payouts</button>
                    </div>
                    <div className="bg-black/40 border border-white/10 p-4 rounded-xl">
                      <h4 className="font-bold text-white">VIP Agent</h4>
                      <p className="text-sm text-[#AAB2C8] mt-1">Direct access to a human VIP support agent 24/7.</p>
                      <button className="mt-3 text-xs bg-white/10 hover:bg-white/20 text-white font-bold px-3 py-1.5 rounded-lg w-full text-center transition-colors">Contact Agent</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeSetting === "content" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-lg mb-4">Your Interests</h3>
                  <p className="text-sm text-[#AAB2C8] mb-4">Select the topics you want to see more of in your feed.</p>
                  <div className="flex flex-wrap gap-2">
                    {["Technology", "Programming", "Design", "Art", "Crypto", "Gaming", "Music", "Science", "Business", "Fashion", "Sports"].map(topic => {
                      const isActive = user?.contentPreferences?.topics?.includes(topic);
                      return (
                      <button 
                        key={topic}
                        onClick={() => toggleTopic(topic)}
                        id={`topic-${topic}`}
                        className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${isActive ? 'bg-vyntra-primary border-vyntra-primary text-white' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                      >
                        {topic}
                      </button>
                    )})}
                  </div>
                </div>
                <div className="border-t border-white/5 pt-6 mt-6">
                   <h3 className="font-bold text-lg mb-4">Hidden Words</h3>
                   <p className="text-sm text-[#AAB2C8] mb-4">Posts containing these words won't appear in your feed.</p>
                   <div className="flex gap-2 mb-4">
                     <input 
                       type="text" 
                       value={hiddenWordInput}
                       onChange={(e) => setHiddenWordInput(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && addHiddenWord()}
                       placeholder="Add a word or phrase..." 
                       className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-vyntra-primary" 
                     />
                     <button onClick={addHiddenWord} className="bg-vyntra-primary text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50" disabled={!user}>Add</button>
                   </div>
                   <div className="flex flex-wrap gap-2">
                     {user?.contentPreferences?.hiddenWords?.map(word => (
                       <div key={word} className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2">
                         {word}
                         <button onClick={() => removeHiddenWord(word)} className="text-[#AAB2C8] hover:text-white">&times;</button>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            )}
            
            {activeSetting === "privacy" && (
              <div className="bg-white/5 rounded-2xl border border-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-[16px]">Private Account</h3>
                    <p className="text-[13px] text-vyntra-text-sec mt-1">When your account is private, only people you approve can see your posts and followers.</p>
                  </div>
                  <button 
                    onClick={handleTogglePrivate}
                    className={`w-12 h-6 rounded-full transition-colors relative ${privateAccount ? 'bg-vyntra-primary' : 'bg-gray-600'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${privateAccount ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            )}

            {activeSetting === "security" && (
              <div className="space-y-4">
                {/* --- CHANGE PASSWORD SECTION --- */}
                <div className="bg-white/5 rounded-2xl border border-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-[16px]">Change Password</h3>
                      <p className="text-[13px] text-vyntra-text-sec mt-1">Update your password at any time.</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        setIsPasswordFormVisible(!isPasswordFormVisible);
                        setIs2faFormVisible(false);
                        setPasswordStatusMsg("");
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmNewPassword("");
                      }}
                      className="px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-colors"
                    >
                      {isPasswordFormVisible ? "Close" : "Open"}
                    </button>
                  </div>

                  {isPasswordFormVisible && (
                    <div className="border-t border-white/5 pt-4 mt-4 space-y-3">
                      {/* Check if Google auth */}
                      {auth.currentUser?.providerData.some(p => p.providerId === "google.com") ? (
                        <p className="text-sm text-yellow-500/80">
                          Since you are signed in using Google login, your password management is handled directly via Google Account settings. You do not need to configure a separate Vyntra password.
                        </p>
                      ) : (
                        <>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-vyntra-text-sec">Current Password</label>
                            <input 
                              type="password" 
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              placeholder="Enter current password" 
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-vyntra-primary" 
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-vyntra-text-sec">New Password</label>
                            <input 
                              type="password" 
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Enter secure new password" 
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-vyntra-primary" 
                            />
                            
                            <PasswordStrengthMeter password={newPassword} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-vyntra-text-sec">Confirm New Password</label>
                            <input 
                              type="password" 
                              value={confirmNewPassword}
                              onChange={(e) => setConfirmNewPassword(e.target.value)}
                              placeholder="Confirm new password" 
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-vyntra-primary" 
                            />
                          </div>

                          {passwordStatusMsg && (
                            <p className={`text-xs ${passwordStatusMsg.includes("successfully") ? "text-green-500" : "text-vyntra-error"}`}>
                              {passwordStatusMsg}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-2 pt-2">
                            <button 
                              type="button"
                              onClick={handleChangePasswordSubmit} 
                              disabled={passwordIsSubmitting}
                              className="bg-vyntra-primary text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
                            >
                              {passwordIsSubmitting ? "Updating..." : "Update Password"}
                            </button>
                            <button 
                              type="button" 
                              onClick={handleResetPassword}
                              className="px-4 py-2 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors"
                            >
                              Forgot Password? Reset Email
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* --- TWO-FACTOR AUTHENTICATION SECTION --- */}
                <div className="bg-white/5 rounded-2xl border border-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-[16px]">Two-Factor Authentication</h3>
                      <p className="text-[13px] text-vyntra-text-sec mt-1">Add an extra layer of security to your account.</p>
                      {user?.twoFactorEnabled && (
                        <div className="flex items-center gap-1.5 mt-2 bg-[#14F195]/10 text-[#14F195] text-[11px] font-bold px-2.5 py-0.5 rounded-full w-fit">
                          <Check size={12} /> Active (Google Authenticator)
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-vyntra-text-sec">
                        {user?.twoFactorEnabled ? "Active" : "Disabled"}
                      </span>
                      <button 
                        type="button"
                        onClick={async () => {
                          if (user?.twoFactorEnabled) {
                            // Currently enabled, click to disable
                            const targetVisibility = !is2faFormVisible;
                            setIs2faFormVisible(targetVisibility);
                            setIsPasswordFormVisible(false);
                            setMfaStatusMsg(targetVisibility ? "Please enter your 6-digit verification code below to disable 2FA security." : "");
                            setOtpToken("");
                          } else {
                            // Currently disabled, click to enable (setup)
                            const targetVisibility = !is2faFormVisible;
                            setIs2faFormVisible(targetVisibility);
                            setIsPasswordFormVisible(false);
                            setMfaStatusMsg("");
                            setOtpToken("");
                            if (targetVisibility) {
                              try {
                                const response = await fetch("/api/2fa/generate-secret", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ email: user?.email || "user@vyntra.com" }),
                                });
                                if (response.ok) {
                                  const data = await response.json();
                                  setMfaSecret(data.secret);
                                  setMfaOtpauthUrl(data.otpauthUrl);
                                } else {
                                  const fallbackSec = generateRandomBase32Secret();
                                  setMfaSecret(fallbackSec);
                                  setMfaOtpauthUrl(`otpauth://totp/Vyntra:${user?.email || 'user'}?secret=${fallbackSec}&issuer=Vyntra`);
                                }
                              } catch (err) {
                                console.error("Error generating server-side secret:", err);
                                const fallbackSec = generateRandomBase32Secret();
                                setMfaSecret(fallbackSec);
                                setMfaOtpauthUrl(`otpauth://totp/Vyntra:${user?.email || 'user'}?secret=${fallbackSec}&issuer=Vyntra`);
                              }
                            }
                          }
                        }}
                        className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none ${user?.twoFactorEnabled ? 'bg-vyntra-primary' : 'bg-white/10 border border-white/10'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${user?.twoFactorEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  </div>

                  {is2faFormVisible && (
                    <div className="border-t border-white/5 pt-4 mt-4 space-y-4">
                      {!user?.twoFactorEnabled ? (
                        <>
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-white">Setup Google Authenticator</h4>
                            <p className="text-xs text-vyntra-text-sec leading-relaxed">
                              1. Download Google Authenticator or an equivalent TOTP authenticator from App Store or Play Store.<br/>
                              2. Scan the QR code or enter the Secret key manually into your app.
                            </p>
                          </div>

                          <div className="flex flex-col md:flex-row items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/10">
                            {/* QR Code Container */}
                            <div className="bg-white p-2 rounded-xl border border-white/10 flex items-center justify-center shrink-0">
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=0b0f19&bgcolor=ffffff&data=${encodeURIComponent(mfaOtpauthUrl || `otpauth://totp/Vyntra:${user?.email || 'user'}?secret=${mfaSecret}&issuer=Vyntra`)}`}
                                alt="TOTP Setup QR"
                                className="w-[150px] h-[150px] object-contain"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            
                            {/* Plain text key */}
                            <div className="space-y-1.5 flex-1 w-full text-center md:text-left">
                              <span className="text-[11px] font-bold text-vyntra-text-sec block">SECRET SETUP KEY</span>
                              <code className="bg-white/10 px-3 py-1.5 rounded-lg text-sm font-mono block select-all tracking-wider text-white">
                                {mfaSecret.match(/.{1,4}/g)?.join(' ')}
                              </code>
                              <button 
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(mfaSecret);
                                  alert("Setup key copied to clipboard!");
                                }}
                                className="text-xs text-vyntra-primary font-bold hover:underline"
                              >
                                Copy Key
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-vyntra-text-sec block">Verification Code</label>
                            <input 
                              type="text" 
                              maxLength={6}
                              value={otpToken}
                              onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                              placeholder="000000" 
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-center text-lg font-mono tracking-widest focus:outline-none focus:border-vyntra-primary" 
                            />
                            <p className="text-[11px] text-vyntra-text-sec">Enter the 6-digit code showing in your authenticator app.</p>
                          </div>

                          {mfaStatusMsg && (
                            <p className={`text-xs ${mfaStatusMsg.includes("successfully") ? "text-green-500" : "text-vyntra-error"}`}>
                              {mfaStatusMsg}
                            </p>
                          )}

                          <div className="flex gap-2">
                            <button 
                              type="button"
                              onClick={handleEnableMfaSubmit} 
                              disabled={mfaIsSubmitting || otpToken.length !== 6}
                              className="bg-vyntra-primary text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
                            >
                              {mfaIsSubmitting ? "Verifying..." : "Verify & Enable 2FA"}
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-vyntra-error">Disable Two-Factor Authentication</h4>
                            <p className="text-xs text-vyntra-text-sec">
                              To turn off secure two-factor authentication, enter the 6-digit code currently generated by your Google Authenticator app below.
                            </p>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-vyntra-text-sec block">Verification Code</label>
                            <input 
                              type="text" 
                              maxLength={6}
                              value={otpToken}
                              onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                              placeholder="000000" 
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-center text-lg font-mono tracking-widest focus:outline-none focus:border-vyntra-primary" 
                            />
                          </div>

                          {mfaStatusMsg && (
                            <p className={`text-xs ${mfaStatusMsg.includes("successfully") ? "text-green-500" : "text-vyntra-error"}`}>
                              {mfaStatusMsg}
                            </p>
                          )}

                          <div className="flex gap-2">
                            <button 
                              type="button"
                              onClick={handleDisableMfaSubmit} 
                              disabled={mfaIsSubmitting || otpToken.length !== 6}
                              className="bg-vyntra-error text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
                            >
                              {mfaIsSubmitting ? "Disabling..." : "Disable 2FA Security"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* --- Backup Recovery Codes Module if 2FA Active --- */}
                  {user?.twoFactorEnabled && (
                    <div className="border-t border-white/5 pt-4 mt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                            <KeyRound size={15} className="text-vyntra-primary" /> Backup Recovery Codes
                          </h4>
                          <p className="text-xs text-vyntra-text-sec mt-0.5 leading-relaxed">
                            Generate and keep these offline to recover access if you lose your authentication device. Each code can be used exactly once.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsRecoveryCodesVisible(!isRecoveryCodesVisible)}
                          className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white hover:bg-white/10"
                        >
                          {isRecoveryCodesVisible ? "Hide Codes" : "Manage Codes"}
                        </button>
                      </div>

                      {isRecoveryCodesVisible && (
                        <div className="space-y-4 bg-black/40 p-4 rounded-xl border border-white/10 animate-fadeIn">
                          {tempPlainCodes ? (
                            <>
                              <div className="p-3 bg-vyntra-primary/10 border border-vyntra-primary/20 rounded-xl">
                                <p className="text-xs text-vyntra-primary font-bold flex items-center gap-1.5 justify-center">
                                  ⚠️ Write these down / copy them now!
                                </p>
                                <p className="text-[11px] text-vyntra-text-sec text-center mt-1 leading-normal">
                                  For security, these plain text codes are only shown ONCE. Once you close this or refresh/navigate away, they will only be saved as secure hashes in the database.
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {tempPlainCodes.map((code: string, idx: number) => (
                                  <div key={idx} className="bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-center text-xs font-mono font-bold tracking-wider text-green-400 flex items-center justify-between">
                                    <span className="text-vyntra-text-sec text-[10px] uppercase font-bold select-none">Code {idx + 1}</span>
                                    <span>{code}</span>
                                  </div>
                                ))}
                              </div>

                              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                                <button
                                  type="button"
                                  onClick={handleCopyCodes}
                                  className="flex items-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/15 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all"
                                >
                                  <Copy size={13} />
                                  Copy Codes
                                </button>
                                <button
                                  type="button"
                                  onClick={handleDownloadCodes}
                                  className="flex items-center gap-1.5 bg-vyntra-primary/10 border border-vyntra-primary/25 hover:bg-vyntra-primary/20 text-vyntra-primary font-bold text-xs px-3 py-1.5 rounded-lg transition-all"
                                >
                                  <Download size={13} />
                                  Download (*.txt)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTempPlainCodes(null)}
                                  className="flex items-center gap-1.5 bg-[#10b981]/15 border border-[#10b981]/25 hover:bg-[#10b981]/25 text-[#10b981] font-bold text-xs px-3 py-1.5 rounded-lg transition-all ml-auto"
                                >
                                  Done Saving
                                </button>
                              </div>
                            </>
                          ) : user?.twoFactorRecoveryCodes && user.twoFactorRecoveryCodes.length > 0 ? (
                            <>
                              <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                                <p className="text-xs text-vyntra-text font-bold flex items-center gap-1.5 justify-center">
                                  🔒 Hashed & Secured in Firestore
                                </p>
                                <p className="text-[11px] text-vyntra-text-sec text-center mt-1 leading-normal">
                                  {user.twoFactorRecoveryCodes.length} recovery codes remain active. Plain-text versions are hidden for privacy. If you lost them, regenerate below.
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {user.twoFactorRecoveryCodes.map((_: any, idx: number) => (
                                  <div key={idx} className="bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-center text-xs font-mono font-bold tracking-wider text-vyntra-text-sec/45 flex items-center justify-between select-none">
                                    <span className="text-vyntra-text-sec text-[10px] uppercase font-bold select-none">Code {idx + 1}</span>
                                    <span>••••-••••</span>
                                  </div>
                                ))}
                              </div>

                              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                                <span className="text-[10px] text-vyntra-text-sec font-mono font-bold">Stored: SHA-256</span>
                                <button
                                  type="button"
                                  onClick={handleRegenerateCodes}
                                  className="flex items-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-vyntra-text-sec hover:text-white font-bold text-xs px-3 py-1.5 rounded-lg ml-auto transition-all"
                                >
                                  <RefreshCcw size={13} />
                                  Regenerate Codes
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="text-center py-4 space-y-3">
                              <p className="text-xs text-orange-400 font-medium">⚠️ No active recovery codes found. This poses a lockout risk if you lose your phone.</p>
                              <button
                                type="button"
                                onClick={async () => {
                                  const newCodes = generateRecoveryCodes();
                                  try {
                                    setTempPlainCodes(newCodes);
                                    const { hashRecoveryCode } = await import("../../utils/totp");
                                    const hashedCodes = await Promise.all(
                                      newCodes.map(code => hashRecoveryCode(code))
                                    );
                                    await updateUserPreferences({
                                      twoFactorRecoveryCodes: hashedCodes
                                    });
                                    alert("Success! 8 recovery codes have been initialized and saved securely.");
                                  } catch (err: any) {
                                    alert(`Failed to save codes: ${err.message || err}`);
                                  }
                                }}
                                className="bg-vyntra-primary hover:bg-vyntra-primary/95 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
                              >
                                Generate Backup Codes
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSetting === "notifications" && (
              <div className="bg-white/5 rounded-2xl border border-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-[16px]">Push Notifications</h3>
                    <p className="text-[13px] text-vyntra-text-sec mt-1">Receive notifications about activity relevant to you.</p>
                  </div>
                  <button 
                    onClick={() => { setNotificationsEnabled(!notificationsEnabled); alert(notificationsEnabled ? "Push notifications disabled" : "Push notifications enabled"); }}
                    className={`w-12 h-6 rounded-full transition-colors relative ${notificationsEnabled ? 'bg-vyntra-primary' : 'bg-gray-600'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            )}

            {activeSetting === "display" && (
              <div className="bg-white/5 rounded-2xl border border-white/5 p-4">
                <h3 className="font-bold text-[16px] mb-4">Theme</h3>
                <div className="p-4 rounded-xl border border-vyntra-primary bg-vyntra-primary/10 flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#0B0F19] border border-vyntra-primary flex items-center justify-center">
                    <Check size={14} className="text-vyntra-primary" />
                  </div>
                  <span className="font-bold">Dark Theme (Enforced/Default)</span>
                  <p className="text-[11px] text-vyntra-text-sec text-center max-w-sm mt-1">
                    To ensure absolute visibility, high contrast, and eyesafety under Vyntra security directives, the light theme is disabled and the application utilizes dark mode exclusively.
                  </p>
                </div>
              </div>
            )}

            {activeSetting === "devices" && (
              <div className="bg-white/5 rounded-2xl border border-white/5 p-4">
                <h3 className="font-bold text-[16px] mb-4">Active Sessions</h3>
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-xl">
                      <Smartphone size={20} className="text-vyntra-primary" />
                    </div>
                    <div>
                      <div className="font-bold text-[15px]">Windows • Chrome</div>
                      <div className="text-[13px] text-vyntra-primary">Active now</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSetting === "support" && (
              <div className="h-full min-h-[400px]">
                <AISupportChat />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col w-full h-full">
          <div className="sticky top-0 z-30 bg-vyntra-bg/80 backdrop-blur-xl border-b border-white/10 p-4 pt-6">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-vyntra-text">
              <Settings className="text-vyntra-primary" /> Settings
            </h2>
          </div>

          <div className="p-4 space-y-4 pb-24 flex-1">
            <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
              {settingsOptions.map((opt, idx) => {
                 const Icon = opt.icon;
                 return (
                  <button 
                    key={idx}
                    type="button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (opt.id === "account") {
                        setIsEditModalOpen(true);
                      } else {
                        setActiveSetting(opt.id);
                      }
                    }} 
                    className="w-full text-left flex items-center justify-between p-4 hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 last:border-0 group relative overflow-hidden"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/5 rounded-xl text-vyntra-text-sec">
                        <Icon size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-[16px] text-vyntra-text">{opt.title}</div>
                        <div className="text-[13px] text-vyntra-text-sec mt-0.5">{opt.desc}</div>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-vyntra-text-sec group-hover:text-vyntra-text transition-colors" />
                  </button>
                 )
              })}
            </div>

            <button 
              onClick={logout}
              className="w-full flex items-center justify-between p-4 bg-vyntra-error/10 hover:bg-vyntra-error/20 rounded-2xl border border-vyntra-error/20 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-vyntra-error/20 rounded-xl text-vyntra-error group-hover:bg-vyntra-error group-hover:text-white transition-colors">
                  <LogOut size={20} />
                </div>
                <div className="font-bold text-[16px] text-vyntra-error">Log Out</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// evaluatePasswordStrength is imported from "./PasswordStrengthMeter"

function UserIcon(props: any) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
