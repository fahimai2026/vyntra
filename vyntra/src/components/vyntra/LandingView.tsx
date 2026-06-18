import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Mail, Smartphone, ArrowRight, Check, X, Loader2, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export function LandingView() {
  const { loginWithGoogle, loginWithApple, loginWithEmail, signupWithEmail } = useAuth();
  
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  useEffect(() => {
    const handleThemeChange = () => {
      setTheme(localStorage.getItem('theme') || 'dark');
    };
    window.addEventListener('themechange', handleThemeChange);
    return () => window.removeEventListener('themechange', handleThemeChange);
  }, []);
  
  // Form values state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  
  // UI views state
  const [isLogin, setIsLogin] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Registration logic state
  const [authStep, setAuthStep] = useState<'form' | 'otp'>('form');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Real-time username validation states
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameMessage, setUsernameMessage] = useState('');

  // Toast notifications state
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Function to trigger elegant floating glass toasts
  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Input Validation Rules
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email);

  // Password requirements
  const isPassLengthValid = password.length >= 8;
  const isPassUpperValid = /[A-Z]/.test(password);
  const isPassSpecialValid = /[^A-Za-z0-9]/.test(password);
  const isPassValid = isPassLengthValid && isPassUpperValid && isPassSpecialValid;
  const doPasswordsMatch = password === confirmPassword;

  // Real-time username debounced check (300ms delay)
  useEffect(() => {
    const cleanUsername = username.trim().toLowerCase();
    
    if (!cleanUsername) {
      setUsernameStatus('idle');
      setUsernameMessage('');
      return;
    }

    if (cleanUsername.length < 3) {
      setUsernameStatus('invalid');
      setUsernameMessage('Username must be at least 3 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_.]+$/.test(cleanUsername)) {
      setUsernameStatus('invalid');
      setUsernameMessage('Alphanumeric characters, underscores, or periods only');
      return;
    }

    setIsCheckingUsername(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(cleanUsername)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.available) {
            setUsernameStatus('available');
            setUsernameMessage('Username is available');
          } else {
            setUsernameStatus('taken');
            setUsernameMessage(data.message || 'Username is already taken');
          }
        } else {
          setUsernameStatus('idle');
        }
      } catch (err) {
        console.error("Error checking username:", err);
        setUsernameStatus('idle');
      } finally {
        setIsCheckingUsername(false);
      }
    }, 300); // 300ms delay as requested

    return () => clearTimeout(delayDebounce);
  }, [username]);

  // Clean and sanitize text inputs to prevent HTML injection and trailing junk
  const sanitizeInput = (text: string) => {
    return text.replace(/<[^>]*>/g, '').trim();
  };

  // Modular Login Function
  const handleLogin = async () => {
    // Prevent double clicking / validate fields
    if (!email.trim() || !password) {
      triggerToast("Please fill all fields", "error");
      return;
    }

    setIsLoading(true);
    try {
      const cleanEmail = email.trim();
      await loginWithEmail(cleanEmail, password);
      triggerToast("Logged in successfully! Welcome back to Vyntra.", "success");
      setShowEmailForm(false);
    } catch (error: any) {
      console.error("Login Error:", error);
      const errorCode = error?.code;
      let message = "Failed to log in. Please check your credentials.";
      if (
        errorCode === "auth/user-not-found" ||
        errorCode === "auth/wrong-password" ||
        errorCode === "auth/invalid-credential" ||
        errorCode === "auth/invalid-login-credentials"
      ) {
        message = "Incorrect email or password. Please try again.";
      } else if (errorCode === "auth/too-many-requests") {
        message = "Too many failed attempts. Access temporarily locked. Try again later.";
      } else if (errorCode === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      } else if (error?.message) {
        message = error.message;
      }
      triggerToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Modular Signup Function (Triggers OTP Flow)
  const handleSignup = async () => {
    // Validate empty fields
    if (!firstName.trim() || !lastName.trim() || !username.trim() || !email.trim() || !password || !confirmPassword) {
      triggerToast("Please fill all fields", "error");
      return;
    }

    // Precise validation checks
    if (!isEmailValid) {
      triggerToast("Please enter a valid email address.", "error");
      return;
    }
    if (!isPassValid) {
      triggerToast("Please satisfy all password strength guidelines.", "error");
      return;
    }
    if (!doPasswordsMatch) {
      triggerToast("Your password confirmation does not match.", "error");
      return;
    }
    if (usernameStatus !== 'available') {
      triggerToast("Please select an available username.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const cleanEmail = email.trim();
      
      // Request standard OTP code. Generates code, saves to db/temp, sends via integrated EmailJS template
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to trigger verification OTP");
      }
      
      // Transition step smoothly
      setAuthStep('otp');
      triggerToast("Security Code sent successfully to your email!", "success");
    } catch (error: any) {
      triggerToast(error.message || "Could not complete account request. Please retry.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Modular OTP Verification Function
  const verifyOTP = async () => {
    const cleanOtp = otpCode.trim();
    if (!cleanOtp) {
      triggerToast("Please fill all fields", "error");
      return;
    }
    if (cleanOtp.length !== 6) {
      triggerToast("Please enter the complete 6-digit confirmation code.", "error");
      return;
    }
    
    setIsLoading(true);
    try {
      const cleanEmail = email.trim();
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, code: cleanOtp })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Invalid security code. Please check your inbox.");
      }
      
      const cleanFirstName = sanitizeInput(firstName);
      const cleanLastName = sanitizeInput(lastName);
      const cleanUsername = sanitizeInput(username).toLowerCase();
      const fullName = `${cleanFirstName} ${cleanLastName}`.trim();
      
      await signupWithEmail(cleanEmail, password, fullName, cleanUsername);
      triggerToast("Your account has been verified and registered! Welcome.", "success");
      
      // Cleanup UI views
      setShowEmailForm(false);
      setAuthStep('form');
    } catch (error: any) {
      triggerToast(error.message || "Security verification failed.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Form submit router (Intercepts refresh and decides the logical action based on flow status)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authStep === 'otp') {
      await verifyOTP();
    } else if (isLogin) {
      await handleLogin();
    } else {
      await handleSignup();
    }
  };

  const isSubmitDisabled = isLoading;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full bg-vyntra-bg text-vyntra-text font-sans overflow-x-hidden relative">
      
      {/* Floating Theme Switcher Button */}
      <button 
        onClick={() => {
          if (window.toggleTheme) {
            window.toggleTheme();
          }
        }}
        className="absolute top-6 right-6 z-55 p-3 rounded-full bg-vyntra-surface/90 border border-vyntra-text/15 text-vyntra-text hover:bg-vyntra-text/10 transition-all duration-300 shadow-lg backdrop-blur-md flex items-center justify-center cursor-pointer active:scale-90"
        title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        id="landing-theme-toggle"
      >
        {theme === 'dark' ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-700" />}
      </button>

      {/* Floating Glassmorphic Toaster Container */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className={`pointer-events-auto flex items-start gap-3.5 px-4 py-4 rounded-2xl border text-sm font-semibold shadow-[0_20px_40px_rgba(0,0,0,0.3)] backdrop-blur-xl ${
                toast.type === 'success'
                  ? 'bg-emerald-950/85 border-emerald-500/30 text-emerald-100'
                  : toast.type === 'error'
                  ? 'bg-rose-950/85 border-rose-500/30 text-rose-100'
                  : 'bg-vyntra-surface/90 border-vyntra-text/10 text-vyntra-text'
              }`}
            >
              {toast.type === 'success' ? (
                <div className="flex items-center justify-center p-1 bg-emerald-500/20 rounded-lg shrink-0 mt-0.5">
                  <Check className="text-emerald-400 stroke-[3]" size={16} />
                </div>
              ) : toast.type === 'error' ? (
                <div className="flex items-center justify-center p-1 bg-rose-500/20 rounded-lg shrink-0 mt-0.5">
                  <X className="text-rose-400 stroke-[3]" size={16} />
                </div>
              ) : (
                <div className="flex items-center justify-center p-1 bg-vyntra-primary/20 rounded-lg shrink-0 mt-0.5">
                  <Loader2 className="animate-spin text-vyntra-primary" size={16} />
                </div>
              )}
              <div className="flex-1 leading-normal selection:bg-slate-800 pr-1">{toast.message}</div>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-vyntra-text/30 hover:text-vyntra-text/70 p-1 rounded-lg transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Visual Ambient Background Orbs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-vyntra-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-vyntra-secondary/10 blur-[120px] pointer-events-none" />

      {/* Visual / Logo Side */}
      <div className="flex flex-1 items-center justify-center p-8 lg:p-0 relative z-10 shrink-0">
        <div className="flex flex-col items-center">
          <motion.img 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            src="/logo.png" 
            alt="Vyntra Logo" 
            className="w-[120px] h-auto lg:w-[380px] drop-shadow-[0_0_60px_rgba(108,92,231,0.25)] object-contain select-none animate-float" 
          />
        </div>
      </div>

      {/* Auth Side */}
      <div className="flex flex-1 flex-col justify-center p-8 lg:p-16 max-w-[700px] relative z-10">
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-[44px] sm:text-[68px] font-black leading-none tracking-tight mb-8 text-gradient select-none"
          style={{ textShadow: theme === 'light' ? '0 2px 4px rgba(15, 23, 42, 0.08)' : '0 2px 12px rgba(0,0,0,0.4)' }}
        >
          Happening now.
        </motion.h1>
        <motion.h2 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-[26px] sm:text-[32px] font-bold mb-10 text-vyntra-text font-weight-700 tracking-tight"
          style={{ textShadow: theme === 'light' ? '0 1px 2px rgba(15, 23, 42, 0.05)' : 'none' }}
        >
          Join today.
        </motion.h2>

        <div className="flex flex-col gap-3.5 w-full max-w-[320px]">
          <button 
            onClick={() => loginWithGoogle()}
            className="flex items-center justify-center gap-2.5 bg-vyntra-surface hover:bg-vyntra-text/5 text-vyntra-text border border-vyntra-text/15 rounded-full py-3.5 px-4 font-bold transition-all duration-300 w-full hover:scale-[1.02] active:scale-[0.97] shadow-md cursor-pointer"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 animate-pulse" />
            Continue with Google
          </button>
          
          <button 
            onClick={() => loginWithApple()}
            className="flex items-center justify-center gap-2.5 bg-vyntra-surface hover:bg-vyntra-text/5 text-vyntra-text border border-vyntra-text/15 rounded-full py-3.5 px-4 font-bold transition-all duration-300 w-full hover:scale-[1.02] active:scale-[0.97] shadow-md cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-vyntra-text">
              <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.89-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-1.06.523-2.16 1.183-2.95.736-.88 2.02-1.57 2.982-1.57.126 0 .236.02.3.03zm-1.637 4.54c-1.393.032-2.784.896-3.486.896-.713 0-1.89-1.044-3.328-1.044-1.99 0-3.9 1.41-4.707 3.52-.89 2.37.1 6.37 2.1 8.84 1.05 1.25 2.15 2.45 3.32 2.45 1.34 0 1.94-.8 3.52-.8 1.56 0 2.13.79 3.51.79 1.24.01 2.21-1.07 3.19-2.26 1.11-1.38 1.56-2.73 1.56-2.82-.03-.02-2.61-1.03-2.61-4.05 0-3.05 2.53-4.5 2.59-4.54-1.58-2.31-4.08-2.61-4.66-2.66z"></path>
            </svg>
            Continue with Apple
          </button>

          <div className="flex items-center my-2">
            <hr className="flex-1 border-vyntra-text/10" />
            <span className="px-3.5 text-xs font-bold uppercase tracking-wider text-vyntra-text-sec font-mono">or</span>
            <hr className="flex-1 border-vyntra-text/10" />
          </div>

          <button 
            onClick={() => { setShowEmailForm(true); setIsLogin(false); }}
            className="flex items-center justify-center gap-2 bg-vyntra-primary hover:bg-vyntra-primary/95 text-white rounded-full py-4 px-4 font-bold transition-all duration-300 w-full hover:scale-[1.02] active:scale-[0.97] shadow-[0_0_25px_rgba(108,92,231,0.35)] cursor-pointer"
          >
            Create account
          </button>
          
          <div className="text-[11px] text-vyntra-text-sec mt-2.5 pr-4 leading-relaxed font-medium">
            By signing up, you agree to the <a href="#" className="text-vyntra-primary hover:underline font-bold">Terms of Service</a> and <a href="#" className="text-vyntra-primary hover:underline font-bold">Privacy Policy</a>, including <a href="#" className="text-vyntra-primary hover:underline font-bold">Cookie Use</a>.
          </div>

          <div className="mt-12 mb-3">
            <h3 className="font-bold text-[16px] text-vyntra-text select-none">Already have an account?</h3>
          </div>

          <button 
            onClick={() => { setShowEmailForm(true); setIsLogin(true); }}
            className="flex items-center justify-center gap-2 bg-transparent text-vyntra-primary border border-vyntra-primary/30 rounded-full py-3.5 px-4 font-black hover:bg-vyntra-primary/10 transition-all duration-300 w-full hover:scale-[1.02] active:scale-[0.97] cursor-pointer"
          >
            Sign in
          </button>
        </div>
      </div>

      {/* Email Form Modal (Vyntra Dark-Themed Glassmorphism Modal - #0d1117) */}
      <AnimatePresence>
        {showEmailForm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-vyntra-card rounded-2xl w-full max-w-[550px] shadow-[0_25px_50px_rgba(0,0,0,0.3)] overflow-hidden text-vyntra-text flex flex-col max-h-[90vh] border border-vyntra-text/15"
            >
              {/* Modal Header */}
              <div className="flex items-center p-4 border-b border-vyntra-text/5 relative bg-vyntra-surface shrink-0">
                <button 
                  onClick={() => {
                    setShowEmailForm(false);
                    setUsernameStatus('idle');
                    setUsernameMessage('');
                    setUsername('');
                    setFirstName('');
                    setLastName('');
                    setEmail('');
                    setPassword('');
                    setConfirmPassword('');
                  }}
                  className="p-2.5 bg-vyntra-surface hover:bg-vyntra-text/5 active:scale-90 rounded-full transition-all shrink-0 absolute top-3.5 left-4 border border-vyntra-text/5 focus:outline-none"
                >
                  <X size={16} className="text-vyntra-text" />
                </button>
                <div className="flex-1 flex justify-center py-1">
                  <img src="/logo.png" alt="Vyntra Logo" className="w-8 h-8 object-contain drop-shadow-[0_0_15px_rgba(108,92,231,0.5)]" />
                </div>
              </div>

              {/* Modal Content Scroll Area */}
              <div className="px-6 py-6 overflow-y-auto w-full max-w-[460px] mx-auto flex flex-col custom-scrollbar">
                <h2 className="text-[28px] font-extrabold mb-1 tracking-tight text-vyntra-text leading-tight">
                  {isLogin ? 'Sign in to Vyntra' : 'Create your account'}
                </h2>
                <p className="text-xs text-vyntra-text-sec mb-6 font-medium">
                  {isLogin ? 'Welcome back to the visual creator community.' : 'Join the visual-system social realm of creators.'}
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
                  <AnimatePresence mode="wait">
                    {authStep === 'otp' ? (
                      <motion.div
                        key="otp-screen"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-4"
                      >
                        <p className="text-vyntra-text-sec text-sm leading-relaxed">
                          We sent a 6-digit confirmation security code to <span className="font-bold text-vyntra-primary">{email}</span>. Please verify your inbox to verify your identity.
                        </p>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            placeholder=" "
                            required
                            maxLength={6}
                            className="block w-full px-4 pb-3.5 pt-6 text-vyntra-text bg-vyntra-text/[0.03] border border-vyntra-text/15 rounded-2xl appearance-none focus:outline-none focus:ring-4 focus:ring-vyntra-primary/10 focus:border-vyntra-primary peer text-center text-xl tracking-[0.5em] font-mono transition-all hover:border-vyntra-text/25"
                          />
                          <label className="absolute text-[13px] text-vyntra-text-sec duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-vyntra-primary pointer-events-none font-medium">6-Digit Code</label>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="signup-login-screen"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-4"
                      >
                        {!isLogin && (
                          <>
                            <div className="flex gap-4">
                              <div className="relative flex-1">
                                <input 
                                  type="text" 
                                  value={firstName}
                                  onChange={(e) => setFirstName(e.target.value)}
                                  placeholder=" "
                                  required
                                  className="block w-full px-4 pb-3.5 pt-6 text-vyntra-text bg-vyntra-text/[0.03] border border-vyntra-text/15 rounded-2xl appearance-none focus:outline-none focus:ring-4 focus:ring-vyntra-primary/10 focus:border-vyntra-primary peer transition-all hover:border-vyntra-text/25"
                                />
                                <label className="absolute text-[13px] text-vyntra-text-sec duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-vyntra-primary pointer-events-none font-medium">First name</label>
                              </div>
                              <div className="relative flex-1">
                                <input 
                                  type="text" 
                                  value={lastName}
                                  onChange={(e) => setLastName(e.target.value)}
                                  placeholder=" "
                                  required
                                  className="block w-full px-4 pb-3.5 pt-6 text-vyntra-text bg-vyntra-text/[0.03] border border-vyntra-text/15 rounded-2xl appearance-none focus:outline-none focus:ring-4 focus:ring-vyntra-primary/10 focus:border-vyntra-primary peer transition-all hover:border-vyntra-text/25"
                                />
                                <label className="absolute text-[13px] text-vyntra-text-sec duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-vyntra-primary pointer-events-none font-medium">Last name</label>
                              </div>
                            </div>
                            
                             {/* REAL-TIME USERNAME AVAILABILITY CHECKER */}
                             <div>
                               <div className="relative">
                                 <input 
                                   type="text" 
                                   value={username}
                                   onChange={(e) => setUsername(e.target.value)}
                                   placeholder=" "
                                   required
                                   className={`block w-full px-4 pb-3.5 pt-6 text-vyntra-text bg-vyntra-text/[0.03] border rounded-2xl appearance-none focus:outline-none focus:ring-4 peer transition-all ${
                                     usernameStatus === 'available' ? 'border-emerald-500/70 focus:border-emerald-500 focus:ring-emerald-500/10' :
                                     usernameStatus === 'taken' ? 'border-rose-500/70 focus:border-rose-500 focus:ring-rose-500/10' :
                                     usernameStatus === 'invalid' ? 'border-amber-500/75 focus:border-amber-500 focus:ring-amber-500/10' :
                                     'border-vyntra-text/15 focus:border-vyntra-primary focus:ring-vyntra-primary/10 hover:border-vyntra-text/25'
                                   }`}
                                 />
                                 <label className="absolute text-[13px] text-vyntra-text-sec duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-vyntra-primary pointer-events-none font-medium">Username</label>
                                
                                {/* STATUS FEEDBACK ICONS INSIDE THE INPUT */}
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                  {isCheckingUsername && (
                                    <Loader2 className="animate-spin text-vyntra-primary" size={18} />
                                  )}
                                  {!isCheckingUsername && usernameStatus === 'available' && (
                                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/15">
                                      <Check className="text-emerald-400 stroke-[3]" size={13} />
                                    </div>
                                  )}
                                  {!isCheckingUsername && (usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/15">
                                      <X className="text-rose-400 stroke-[3]" size={13} />
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* HELPER CAPTION DISPLAY WITH ✔ AND ✖ */}
                              {username && (
                                <p className={`text-[11px] mt-1.5 px-1.5 font-semibold flex items-center gap-1 leading-none ${
                                  usernameStatus === 'available' ? 'text-emerald-400' :
                                  usernameStatus === 'taken' ? 'text-rose-400' :
                                  'text-amber-400/95'
                                }`}>
                                  {usernameStatus === 'available' && <Check size={11} className="stroke-[3]" />}
                                  {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <X size={11} className="stroke-[3]" />}
                                  {usernameMessage}
                                </p>
                              )}
                            </div>
                          </>
                        )}

                        {/* Email Input Field */}
                        <div className="relative">
                          <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder=" "
                            required
                            className={`block w-full px-4 pb-3.5 pt-6 text-white bg-white/[0.03] border rounded-2xl appearance-none focus:outline-none focus:ring-4 transition-all ${
                              email && !isEmailValid ? 'border-amber-500/60 focus:border-amber-500 focus:ring-amber-500/10' :
                              email && isEmailValid ? 'border-emerald-500/40 focus:border-emerald-400 focus:ring-emerald-500/10' :
                              'border-white/10 focus:border-vyntra-primary focus:ring-vyntra-primary/10 hover:border-white/20'
                            }`}
                          />
                          <label className="absolute text-[13px] text-slate-400 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-vyntra-primary pointer-events-none font-medium">Email address</label>
                          {email && !isEmailValid && (
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-amber-500/90 font-bold border border-amber-500/20 bg-amber-500/5 px-1.5 py-0.5 rounded">Format Invalid</span>
                          )}
                        </div>
                        
                        {/* Password Input Field with Visibility Toggle */}
                        <div className="relative">
                          <input 
                            type={showPassword ? "text" : "password"} 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder=" "
                            required
                            className={`block w-full px-4 pb-3.5 pt-6 text-white bg-white/[0.03] border rounded-2xl appearance-none focus:outline-none focus:ring-4 transition-all ${
                              password && !isPassValid ? 'border-amber-500/60 focus:border-amber-500 focus:ring-amber-500/10' :
                              password && isPassValid ? 'border-emerald-500/40 focus:border-emerald-400 focus:ring-emerald-500/10' :
                              'border-white/10 focus:border-vyntra-primary focus:ring-vyntra-primary/10 hover:border-white/20'
                            }`}
                          />
                          <label className="absolute text-[13px] text-slate-400 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-vyntra-primary pointer-events-none font-medium">Password</label>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>

                        {/* Dynamic Password Strength Visual Checklist (Only for signup step) */}
                        {!isLogin && password && (
                          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-2.5">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-400 font-bold">Password Strength Check</span>
                              <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                                isPassValid ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                              }`}>
                                {isPassValid ? 'Strong' : 'Weak/Inadequate'}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 gap-2 pt-1 border-t border-white/5">
                              <div className="flex items-center gap-2 text-xs">
                                <div className={`flex items-center justify-center w-4 h-4 p-0.5 rounded-full ${isPassLengthValid ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-slate-500'}`}>
                                  <Check size={11} className={`stroke-[3.5] ${isPassLengthValid ? 'opacity-100' : 'opacity-30'}`} />
                                </div>
                                <span className={isPassLengthValid ? 'text-slate-200' : 'text-slate-500'}>Minimum 8 characters</span>
                              </div>

                              <div className="flex items-center gap-2 text-xs">
                                <div className={`flex items-center justify-center w-4 h-4 p-0.5 rounded-full ${isPassUpperValid ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-slate-500'}`}>
                                  <Check size={11} className={`stroke-[3.5] ${isPassUpperValid ? 'opacity-100' : 'opacity-30'}`} />
                                </div>
                                <span className={isPassUpperValid ? 'text-slate-200' : 'text-slate-500'}>At least 1 uppercase letter (A-Z)</span>
                              </div>

                              <div className="flex items-center gap-2 text-xs">
                                <div className={`flex items-center justify-center w-4 h-4 p-0.5 rounded-full ${isPassSpecialValid ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-slate-500'}`}>
                                  <Check size={11} className={`stroke-[3.5] ${isPassSpecialValid ? 'opacity-100' : 'opacity-30'}`} />
                                </div>
                                <span className={isPassSpecialValid ? 'text-slate-200' : 'text-slate-500'}>At least 1 special character (e.g. @, #, $, !)</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Confirm Password field with match checker */}
                        {!isLogin && (
                          <div className="relative">
                            <input 
                              type={showConfirmPassword ? "text" : "password"} 
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder=" "
                              required
                              className={`block w-full px-4 pb-3.5 pt-6 text-white bg-white/[0.03] border rounded-2xl appearance-none focus:outline-none focus:ring-4 transition-all ${
                                confirmPassword && !doPasswordsMatch ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/10' :
                                confirmPassword && doPasswordsMatch ? 'border-emerald-500/40 focus:border-emerald-400 focus:ring-emerald-500/10' :
                                'border-white/10 focus:border-vyntra-primary focus:ring-vyntra-primary/10 hover:border-white/20'
                              }`}
                            />
                            <label className="absolute text-[13px] text-slate-400 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-vyntra-primary pointer-events-none font-medium">Confirm Password</label>
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                            >
                              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submission triggers with scale-down clicks */}
                  <div className="pt-6 mt-auto">
                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-vyntra-primary hover:bg-vyntra-primary/95 text-white font-bold py-4 rounded-xl disabled:opacity-30 disabled:pointer-events-none transition-all flex justify-center items-center gap-2 hover:scale-[1.01] active:scale-[0.96] shadow-lg cursor-pointer"
                    >
                      {isLoading && <Loader2 className="animate-spin" size={16} />}
                      {isLoading ? "Processing..." : (authStep === 'otp' ? 'Validate Code' : isLogin ? 'Log in' : 'Create account')}
                    </button>
                    {!isLogin && authStep !== 'otp' && (
                      <p className="mt-5 text-[11px] text-[#AAB2C8]/40 leading-relaxed text-center">
                        By registering, you agree to the <a href="#" className="text-vyntra-primary hover:underline">Terms of Service</a> and <a href="#" className="text-vyntra-primary hover:underline font-semibold">Privacy Policy</a>. Others will be able to find you securely. <a href="#" className="text-vyntra-primary hover:underline font-semibold">Privacy Options</a>
                      </p>
                    )}
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
