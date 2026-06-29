import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../hooks/useAuth';
import { Mail, Smartphone, ArrowRight, Check, X, Loader2, Eye, EyeOff, Sun, Moon, Copy, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import emailjs from '@emailjs/browser';
import { createUserWithEmailAndPassword, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../firebase-config';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

const VyntraLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <img src="/logo.png" alt="Vyntra Logo" className={className} />
);

const AppleLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.17.67-2.88 1.48-.62.71-1.16 1.85-1.01 2.96 1.09.09 2.2-.54 2.9-1.38z" />
  </svg>
);

const GoogleLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
  </svg>
);

export function LandingView() {
  const { loginWithEmail, signupWithEmail, signInWithGoogle } = useAuth();
  
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
  const [googleIsLoading, setGoogleIsLoading] = useState(false);
  
  // Legal terms Modal states
  const [activeLegalModal, setActiveLegalModal] = useState<'terms' | 'privacy' | 'cookie' | 'options' | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  
  // Registration logic state
  const [authStep, setAuthStep] = useState<'form' | 'otp'>('form');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [storedOtp, setStoredOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Countdown Timer for OTP Resend
  useEffect(() => {
    if (authStep !== 'otp' || countdown <= 0) return;
    
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [authStep, countdown]);

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

    const delayDebounce = setTimeout(async () => {
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
      try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const { db } = await import('../../firebase-config');
        
        const usernameLower = cleanUsername.toLowerCase();
        const handleWithAt = cleanUsername.startsWith('@') ? cleanUsername : `@${cleanUsername}`;
        const handleVariants = [
          usernameLower,
          `@${usernameLower}`,
          cleanUsername,
          handleWithAt
        ];

        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('handle', 'in', handleVariants));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          setUsernameStatus('taken');
          setUsernameMessage('Already used');
        } else {
          setUsernameStatus('available');
          setUsernameMessage('Username is available');
        }
      } catch (err) {
        console.error("Error checking username:", err);
        setUsernameStatus('idle');
        setUsernameMessage(''); // Clear message on error so it doesn't get stuck
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

  // Real active Google Sign-In with popup using GoogleAuthProvider and signInWithPopup from useAuth
  const handleGoogleSignInWithPopup = async () => {
    if (googleIsLoading) return;
    localStorage.setItem('v_auth_method', 'google');
    setGoogleIsLoading(true);

    try {
      await signInWithGoogle();
      triggerToast("Successfully signed in with Google!", "success");
      // Note: We deliberately DO NOT set googleIsLoading to false here.
      // If we do, the button might flash back to normal right before the SPA unmounts LandingView.
      // The onAuthStateChanged listener in useAuth will catch the login and unmount this view anyway.
    } catch (error: any) {
      console.error("Google Auth failed:", error);
      if (error.code === 'auth/unauthorized-domain') {
        setUnauthorizedDomain(window.location.hostname);
      } else if (error.code === 'auth/popup-closed-by-user') {
        triggerToast("Google Sign-In popup was closed or blocked. Please try again or allow popups.", "error");
      } else {
        triggerToast(error.message || "Google Provider sign in error.", "error");
      }
      setGoogleIsLoading(false);
    }
  };

  // Modular Login Function
  const handleLogin = async () => {
    const userInput = email.trim();
    // Prevent double clicking / validate fields
    if (!userInput || !password) {
      triggerToast("Please fill all fields", "error");
      return;
    }

    setIsLoading(true);
    try {
      // Resolve username or email to actual registered email
      const resolveRes = await fetch(`/api/auth/resolve-identifier?identifier=${encodeURIComponent(userInput)}`);
      
      let data;
      const contentType = resolveRes.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await resolveRes.json().catch(() => ({}));
      } else {
        data = {};
      }

      if (!resolveRes.ok) {
        throw new Error(data.error || "No account found with this username or email.");
      }
      
      const resolvedEmail = data.email;
      if (!resolvedEmail) {
         throw new Error("Invalid response from server.");
      }
      
      await loginWithEmail(resolvedEmail, password);
      triggerToast("Logged in successfully! Welcome back to X.", "success");
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
        message = "Incorrect email, username, or password. Please try again.";
      } else if (errorCode === "auth/too-many-requests") {
        message = "Too many failed attempts. Access temporarily locked. Try again later.";
      } else if (errorCode === "auth/invalid-email") {
        message = "Please enter a valid email address or username.";
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

    // Terms of Service & Privacy agreement validation
    if (!acceptedTerms) {
      triggerToast("You must agree to the Terms of Service and Privacy Policy to create an account.", "error");
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
      
      // 1. Call secure server endpoint to emit OTP and verify
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });
      
      const contentType = response.headers.get("content-type");
      const data = contentType && contentType.includes("application/json") ? await response.json() : {};
      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to trigger security verification.");
      }
      
      if (data.devCode) {
        console.log("Device sandbox code triggered:", data.devCode);
        setGeneratedOtp(data.devCode);
        setStoredOtp(data.devCode);
        triggerToast("Sandbox Activated: Check browser panel console for code.", "info");
      } else {
        setGeneratedOtp("");
        setStoredOtp("");
      }
      
      // Smoothly transition step to show the entry screen
      setAuthStep('otp');
      setOtpCode('');
      setCountdown(60);
      triggerToast("Security confirmation code has been sent to your email inbox!", "success");
    } catch (error: any) {
      console.error("OTP Delivery Exception:", error);
      triggerToast(error.message || "Failed to send verification security code.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Resending OTP
  const handleResendOtp = async () => {
    if (countdown > 0 || isResending) return;
    setIsResending(true);
    try {
      const cleanEmail = email.trim();
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });
      
      const contentType = response.headers.get("content-type");
      const data = contentType && contentType.includes("application/json") ? await response.json() : {};
      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to trigger security verification.");
      }
      
      if (data.devCode) {
        console.log("Device sandbox code triggered:", data.devCode);
        setGeneratedOtp(data.devCode);
        setStoredOtp(data.devCode);
        triggerToast("Sandbox Activated: Check browser panel console for code.", "info");
      } else {
        setGeneratedOtp("");
        setStoredOtp("");
      }
      
      setCountdown(60); // Reset the 60-second limit
      triggerToast("A fresh confirmation code has been sent to your email inbox!", "success");
    } catch (error: any) {
      console.error("OTP Resend Exception:", error);
      triggerToast(error.message || "Failed to resend confirmation code.", "error");
    } finally {
      setIsResending(false);
    }
  };

  // Modular OTP Verification and Registration Function
  const handleValidate = async () => {
    const cleanOtp = otpCode.trim();
    if (!cleanOtp) {
      triggerToast("Please enter the verification code.", "error");
      return;
    }
    
    setIsLoading(true);
    try {
      const cleanEmail = email.trim();
      
      // 1. Secure backend verification: call verify-otp to validate against database and handle rate limiting
      const verifyRes = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, code: cleanOtp })
      });
      
      const contentType = verifyRes.headers.get("content-type");
      const verifyData = contentType && contentType.includes("application/json") ? await verifyRes.json() : {};
      if (!verifyRes.ok || verifyData.status === "OTP_FAILED" || verifyData.status === "BLOCKED") {
        throw new Error(verifyData.message || "Invalid or expired verification code.");
      }
      
      // 2. Trigger the Firebase createUserWithEmailAndPassword(auth, email, password) function
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      
      // 3. Additionally, write the user profile to firestore so they can access Vyntra immediately!
      try {
        const { doc, setDoc } = await import('firebase/firestore');
        const { db } = await import('../../firebase');
        const userRef = doc(db, 'users', userCredential.user.uid);
        const cleanFirstName = sanitizeInput(firstName);
        const cleanLastName = sanitizeInput(lastName);
        const cleanUsername = sanitizeInput(username).toLowerCase();
        const fullName = `${cleanFirstName} ${cleanLastName}`.trim();
        const defaultHandle = cleanUsername || cleanEmail.split('@')[0] || userCredential.user.uid.substring(0, 8);
        
        await setDoc(userRef, {
          uid: userCredential.user.uid,
          email: cleanEmail,
          name: fullName || "Vyntra User",
          handle: defaultHandle.startsWith('@') ? defaultHandle : '@' + defaultHandle,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || "Vyntra User")}&background=6C5CE7&color=fff`,
          bio: "New to Vyntra",
          followersCount: 0,
          followingCount: 0,
          verified: false,
          createdAt: Date.now()
        }, { merge: true });
      } catch (dbErr) {
        console.error("Firestore DB Error during signup registration:", dbErr);
      }
      
      // 4. Nullify client-side OTP variables for stack security and privacy protection
      setGeneratedOtp("");
      setStoredOtp("");
      setOtpCode("");
      
      triggerToast("Success! Your account has been verified and registered.", "success");
      
      // SPA Navigation takes over automatically: useAuth onAuthStateChanged fires and loads dashboard smoothly!
    } catch (authError: any) {
      console.error("Firebase Registration Error in handleValidate:", authError);
      let errMsg = authError.message || "Verification failed. Please try again.";
      if (authError.code === "auth/email-already-in-use") {
        errMsg = "This email address is already in use by another account.";
      } else if (authError.code === "auth/weak-password") {
        errMsg = "The password is too weak. Please choose a stronger password.";
      } else if (authError.code === "auth/invalid-email") {
        errMsg = "Please enter a valid email address.";
      }
      triggerToast(errMsg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Form submit router (Intercepts refresh and decides the logical action based on flow status)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authStep === 'otp') {
      await handleValidate();
    } else if (isLogin) {
      await handleLogin();
    } else {
      await handleSignup();
    }
  };

  const isSubmitDisabled = isLoading;

  return (
    <div className={`flex flex-col lg:flex-row min-h-screen w-full ${
      theme === 'light' ? 'bg-white text-slate-900' : 'bg-black text-white'
    } font-sans overflow-x-hidden relative transition-colors duration-300`}>
      
      {/* Floating Glassmorphic Toaster Container */}
      {createPortal(
        <div className="fixed top-4 right-4 left-4 sm:left-auto sm:top-6 sm:right-6 sm:max-w-sm z-[99999] flex flex-col gap-3 pointer-events-none">
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
        </div>,
        document.body
      )}

      {/* Visual / Logo Side */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-8 lg:p-0 relative z-10 shrink-0">
        <div className="flex flex-col items-center">
          <motion.div 
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="text-slate-900 dark:text-white"
          >
            <VyntraLogo className="w-[120px] h-[120px] lg:w-[360px] lg:h-[360px] select-none" />
          </motion.div>
        </div>
      </div>

      {/* Auth Side */}
      <div className="flex flex-1 flex-col justify-center p-5 sm:p-8 lg:p-16 max-w-[700px] relative z-10">
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-[40px] sm:text-[56px] lg:text-[76px] font-black leading-none tracking-tighter mb-8 lg:mb-12 text-slate-900 dark:text-white select-none"
        >
          Happening now
        </motion.h1>
        <motion.h2 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-[23px] sm:text-[30px] lg:text-[34px] font-bold mb-8 lg:mb-10 text-slate-800 dark:text-slate-100 tracking-tight"
        >
          Join today.
        </motion.h2>

        <div className="flex flex-col gap-3 w-full max-w-[320px]">
          <button 
            type="button"
            onClick={handleGoogleSignInWithPopup}
            disabled={googleIsLoading}
            className={`flex items-center justify-center gap-2.5 ${
              theme === 'light' ? 'bg-white hover:bg-slate-100 text-black border border-slate-200 shadow-sm' : 'bg-white hover:bg-slate-100 text-black border border-transparent'
            } rounded-full py-2.5 px-4 font-bold text-[14px] transition-all duration-200 w-full hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-70 disabled:scale-100`}
          >
            {googleIsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleLogo className="w-5 h-5 flex-shrink-0" />}
            <span>{googleIsLoading ? "Connecting..." : "Sign up with Google"}</span>
          </button>

          <button 
            type="button"
            onClick={() => triggerToast("Sign up with Apple is simulated in development.", "info")}
            className={`flex items-center justify-center gap-2.5 ${
              theme === 'light' ? 'bg-white hover:bg-slate-100 text-black border border-slate-200 shadow-sm' : 'bg-white hover:bg-slate-100 text-black border border-transparent'
            } rounded-full py-2.5 px-4 font-bold text-[14px] transition-all duration-200 w-full hover:scale-[1.01] active:scale-[0.99] cursor-pointer`}
          >
            <AppleLogo className="w-5 h-5 flex-shrink-0 text-black" />
            <span>Sign up with Apple</span>
          </button>

          <div className="flex items-center my-1">
            <hr className="flex-1 border-slate-200 dark:border-zinc-800" />
            <span className="px-3 text-xs font-normal text-slate-500 dark:text-zinc-500 font-sans">or</span>
            <hr className="flex-1 border-slate-200 dark:border-zinc-800" />
          </div>

          <button 
            onClick={() => { setShowEmailForm(true); setIsLogin(false); }}
            className="flex items-center justify-center bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white rounded-full py-2.5 px-4 font-bold text-[14px] transition-all duration-200 w-full hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            Create account
          </button>
          
          <div className="text-[11px] text-slate-500 dark:text-zinc-500 mt-2 pr-2 leading-normal font-normal">
            By signing up, you agree to the <a href="#" onClick={(e) => { e.preventDefault(); setActiveLegalModal('terms'); }} className="text-[#1d9bf0] hover:underline font-bold">Terms of Service</a> and <a href="#" onClick={(e) => { e.preventDefault(); setActiveLegalModal('privacy'); }} className="text-[#1d9bf0] hover:underline font-medium">Privacy Policy</a>, including <a href="#" onClick={(e) => { e.preventDefault(); setActiveLegalModal('cookie'); }} className="text-[#1d9bf0] hover:underline font-bold">Cookie Use</a>.
          </div>

          <div className="mt-10 mb-4">
            <h3 className="font-bold text-[17px] text-slate-900 dark:text-white select-none">Already have an account?</h3>
          </div>

          <button 
            onClick={() => { setShowEmailForm(true); setIsLogin(true); }}
            className={`flex items-center justify-center bg-transparent ${
              theme === 'light' ? 'text-[#1d9bf0] border border-slate-300 hover:bg-[#1d9bf0]/5' : 'text-[#1d9bf0] border border-zinc-800 hover:bg-[#1d9bf0]/10'
            } rounded-full py-2.5 px-4 font-bold text-[14px] transition-all duration-200 w-full hover:scale-[1.01] active:scale-[0.99] cursor-pointer`}
          >
            Sign in
          </button>
        </div>
      </div>

      {/* Email Form Modal (X Dark-Themed Modal) */}
      <AnimatePresence>
        {showEmailForm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 dark:bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.5 }}
              className={`rounded-2xl w-full max-w-[550px] shadow-[0_25px_50px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[90vh] border ${
                theme === 'light' ? 'bg-white text-slate-900 border-slate-200' : 'bg-black text-white border-zinc-800'
              }`}
            >
              {/* Modal Header */}
              <div className={`flex items-center p-3 sm:p-4 border-b relative shrink-0 ${
                theme === 'light' ? 'bg-white border-slate-100' : 'bg-black border-zinc-800'
              }`}>
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
                  className={`p-2 rounded-full transition-all shrink-0 absolute top-3 sm:top-3.5 left-3 sm:left-4 focus:outline-none ${
                    theme === 'light' ? 'hover:bg-slate-100 text-slate-950' : 'hover:bg-zinc-900 text-white'
                  }`}
                >
                  <X size={18} />
                </button>
                <div className="flex-1 flex justify-center py-1">
                  <VyntraLogo className="w-8 h-8 text-slate-900 dark:text-white" />
                </div>
              </div>

              {/* Modal Content Scroll Area */}
              <div className="px-4 py-5 sm:px-6 sm:py-6 overflow-y-auto w-full max-w-[460px] mx-auto flex flex-col custom-scrollbar">
                <h2 className="text-[22px] sm:text-[28px] font-extrabold mb-1 tracking-tight leading-tight text-slate-900 dark:text-white">
                  {isLogin ? 'Sign in to X' : 'Create your account'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-500 mb-5 sm:mb-6 font-medium">
                  {isLogin ? 'Welcome back to X.' : 'Join the conversation today.'}
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
                  {authStep !== 'otp' && (
                    <div className={`flex flex-col gap-2.5 w-full border-b pb-4 mb-2 ${
                      theme === 'light' ? 'border-slate-100' : 'border-zinc-800'
                    }`}>
                      <button 
                        type="button"
                        onClick={() => { handleGoogleSignInWithPopup(); setShowEmailForm(false); }}
                        disabled={googleIsLoading}
                        className={`flex items-center justify-center gap-2.5 ${
                          theme === 'light' ? 'bg-white hover:bg-slate-100 text-black border border-slate-200 shadow-sm' : 'bg-white hover:bg-slate-100 text-black border border-transparent'
                        } rounded-full py-2.5 px-4 font-bold text-[14px] transition-all duration-200 w-full hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-70 disabled:scale-100`}
                      >
                        {googleIsLoading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <GoogleLogo className="w-4.5 h-4.5 flex-shrink-0" />}
                        <span className="text-xs">{googleIsLoading ? 'Connecting...' : (isLogin ? 'Sign in with Google' : 'Sign up with Google')}</span>
                      </button>

                      <button 
                        type="button"
                        onClick={() => triggerToast(isLogin ? "Sign in with Apple is simulated." : "Sign up with Apple is simulated.", "info")}
                        className={`flex items-center justify-center gap-2.5 ${
                          theme === 'light' ? 'bg-white hover:bg-slate-100 text-black border border-slate-200 shadow-sm' : 'bg-white hover:bg-slate-100 text-black border border-transparent'
                        } rounded-full py-2.5 px-4 font-bold text-[14px] transition-all duration-200 w-full hover:scale-[1.01] active:scale-[0.99] cursor-pointer`}
                      >
                        <AppleLogo className="w-4.5 h-4.5 flex-shrink-0 text-black" />
                        <span className="text-xs">{isLogin ? 'Sign in with Apple' : 'Sign up with Apple'}</span>
                      </button>

                      <div className="flex items-center mt-1.5">
                        <hr className="flex-1 border-slate-150 dark:border-zinc-800" />
                        <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500 font-sans">or email</span>
                        <hr className="flex-1 border-slate-150 dark:border-zinc-800" />
                      </div>
                    </div>
                  )}

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
                        <p className="text-slate-500 dark:text-zinc-400 text-sm leading-relaxed">
                          We sent a 6-digit confirmation security code to <span className="font-bold text-[#1d9bf0]">{email}</span>. Please verify your inbox to verify your identity.
                        </p>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            placeholder=" "
                            required
                            maxLength={6}
                            className={`block w-full px-4 pb-3.5 pt-6 text-slate-900 dark:text-white bg-slate-50 dark:bg-zinc-950 border rounded-2xl appearance-none focus:outline-none focus:ring-4 focus:ring-[#1d9bf0]/10 focus:border-[#1d9bf0] peer text-center text-xl tracking-[0.5em] font-mono transition-all ${
                              theme === 'light' ? 'border-slate-200 hover:border-slate-300' : 'border-zinc-850 hover:border-zinc-750'
                            }`}
                          />
                          <label className="absolute text-[13px] text-slate-500 dark:text-slate-400 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#1d9bf0] pointer-events-none font-medium">6-Digit Code</label>
                        </div>

                        {/* OTP Countdown & Resend Option */}
                        <div className={`flex flex-col items-center justify-center gap-3 pt-3 p-4 rounded-2xl border ${
                          theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-zinc-950 border-zinc-900'
                        }`}>
                          <div className="text-xs text-slate-500 dark:text-zinc-500 flex items-center gap-2 font-medium select-none">
                            {countdown > 0 ? (
                              <span className="flex items-center gap-1.5 font-medium text-slate-500 dark:text-zinc-500">
                                Resend code in <strong className="text-[#1d9bf0] font-bold font-mono tracking-wide tabular-nums">{countdown}s</strong>
                              </span>
                            ) : (
                              <span className="text-emerald-500 font-semibold flex items-center gap-1.5 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Fresh code is ready
                              </span>
                            )}
                          </div>
                          
                          <button
                            type="button"
                            disabled={countdown > 0 || isResending}
                            onClick={handleResendOtp}
                            className="w-full py-2.5 px-4 text-xs font-bold rounded-xl border border-vyntra-text/10 bg-vyntra-text/[0.02] hover:bg-vyntra-text/[0.06] text-vyntra-text disabled:opacity-20 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98]"
                          >
                            {isResending ? (
                              <>
                                <Loader2 className="animate-spin text-vyntra-primary" size={13} />
                                <span>Delivering...</span>
                              </>
                            ) : (
                              <span>Resend Verification Code</span>
                            )}
                          </button>
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
                                  className="block w-full px-4 pb-3.5 pt-6 text-slate-900 dark:text-white bg-vyntra-text/[0.03] border border-vyntra-text/15 rounded-2xl appearance-none focus:outline-none focus:ring-4 focus:ring-vyntra-primary/10 focus:border-vyntra-primary peer transition-all hover:border-vyntra-text/25"
                                />
                                <label className="absolute text-[13px] text-slate-500 dark:text-slate-400 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-vyntra-primary pointer-events-none font-medium">First name</label>
                              </div>
                              <div className="relative flex-1">
                                <input 
                                  type="text" 
                                  value={lastName}
                                  onChange={(e) => setLastName(e.target.value)}
                                  placeholder=" "
                                  required
                                  className="block w-full px-4 pb-3.5 pt-6 text-slate-900 dark:text-white bg-vyntra-text/[0.03] border border-vyntra-text/15 rounded-2xl appearance-none focus:outline-none focus:ring-4 focus:ring-vyntra-primary/10 focus:border-vyntra-primary peer transition-all hover:border-vyntra-text/25"
                                />
                                <label className="absolute text-[13px] text-slate-500 dark:text-slate-400 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-vyntra-primary pointer-events-none font-medium">Last name</label>
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
                                   className={`block w-full px-4 pb-3.5 pt-6 rounded-2xl appearance-none focus:outline-none focus:ring-4 peer transition-all ${
                                     usernameStatus === 'available' ? 'bg-emerald-50/70 border-emerald-500 text-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-100 border-2 focus:border-emerald-600 focus:ring-emerald-500/20' :
                                     usernameStatus === 'taken' ? 'bg-red-50/70 border-red-500 text-red-950 dark:bg-red-950/20 dark:text-red-100 border-2 focus:border-red-600 focus:ring-red-500/20' :
                                     usernameStatus === 'invalid' ? 'bg-amber-50/70 border-amber-500 text-amber-950 dark:bg-amber-950/20 dark:text-amber-100 border-2 focus:border-amber-600 focus:ring-amber-500/20' :
                                     'bg-vyntra-text/[0.03] border-vyntra-text/15 text-slate-900 dark:text-white focus:border-vyntra-primary focus:ring-vyntra-primary/10 hover:border-vyntra-text/25 border'
                                   }`}
                                 />
                                 <label className="absolute text-[13px] text-slate-500 dark:text-slate-400 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-vyntra-primary pointer-events-none font-medium">Username</label>
                                
                                {/* STATUS FEEDBACK ICONS INSIDE THE INPUT */}
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                  {isCheckingUsername && (
                                    <Loader2 className="animate-spin text-vyntra-primary" size={18} />
                                  )}
                                  {!isCheckingUsername && usernameStatus === 'available' && (
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-500/20">
                                      <Check className="text-white stroke-[3.5]" size={14} />
                                    </div>
                                  )}
                                  {!isCheckingUsername && usernameStatus === 'taken' && (
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white shadow-sm ring-2 ring-red-500/20">
                                      <X className="text-white stroke-[3.5]" size={14} />
                                    </div>
                                  )}
                                  {!isCheckingUsername && usernameStatus === 'invalid' && (
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/20">
                                      <X className="text-white stroke-[3.5]" size={14} />
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* HELPER CAPTION DISPLAY WITH ✔ AND ✖ */}
                              {username && (
                                <p className={`text-[11px] mt-1.5 px-1.5 font-semibold flex items-center gap-1 leading-none ${
                                  usernameStatus === 'available' ? 'text-emerald-500 dark:text-emerald-400' :
                                  usernameStatus === 'taken' ? 'text-red-500 dark:text-red-400' :
                                  'text-amber-500 dark:text-amber-400'
                                }`}>
                                  {usernameStatus === 'available' && <Check size={11} className="stroke-[3]" />}
                                  {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <X size={11} className="stroke-[3]" />}
                                  {usernameMessage}
                                </p>
                              )}
                            </div>
                          </>
                        )}

                        {/* Email or Username Input Field */}
                        <div className="relative">
                          <input 
                            type={isLogin ? "text" : "email"} 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder=" "
                            required
                            className={`block w-full px-4 pb-3.5 pt-6 text-slate-900 dark:text-white bg-vyntra-text/[0.03] border rounded-2xl appearance-none focus:outline-none focus:ring-4 transition-all ${
                              (!isLogin && email && !isEmailValid) ? 'border-amber-500/60 focus:border-amber-500 focus:ring-amber-500/10' :
                              (!isLogin && email && isEmailValid) ? 'border-emerald-500/40 focus:border-emerald-400 focus:ring-emerald-500/10' :
                              'border-vyntra-text/15 focus:border-vyntra-primary focus:ring-vyntra-primary/10 hover:border-vyntra-text/25'
                            }`}
                          />
                          <label className="absolute text-[13px] text-slate-500 dark:text-slate-400 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-vyntra-primary pointer-events-none font-medium">
                            {isLogin ? "Username or Email address" : "Email address"}
                          </label>
                          {!isLogin && email && !isEmailValid && (
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
                            className={`block w-full px-4 pb-3.5 pt-6 text-slate-900 dark:text-white bg-vyntra-text/[0.03] border rounded-2xl appearance-none focus:outline-none focus:ring-4 transition-all ${
                              password && !isPassValid ? 'border-amber-500/60 focus:border-amber-500 focus:ring-amber-500/10' :
                              password && isPassValid ? 'border-emerald-500/40 focus:border-emerald-400 focus:ring-emerald-500/10' :
                              'border-vyntra-text/15 focus:border-vyntra-primary focus:ring-vyntra-primary/10 hover:border-vyntra-text/25'
                            }`}
                          />
                          <label className="absolute text-[13px] text-slate-500 dark:text-slate-400 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-vyntra-primary pointer-events-none font-medium">Password</label>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors z-20 cursor-pointer pointer-events-auto"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>

                        {/* Dynamic Password Strength Visual Checklist (Only for signup step) */}
                        {!isLogin && password && (
                          <div className="bg-vyntra-text/[0.02] border border-vyntra-text/10 rounded-2xl p-4 space-y-2.5">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-vyntra-text-sec font-bold">Password Strength Check</span>
                              <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                                isPassValid ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/10 text-amber-500'
                              }`}>
                                {isPassValid ? 'Strong' : 'Weak/Inadequate'}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 gap-2 pt-1 border-t border-vyntra-text/10">
                              <div className="flex items-center gap-2 text-xs">
                                <div className={`flex items-center justify-center w-4 h-4 p-0.5 rounded-full ${isPassLengthValid ? 'bg-emerald-500/15 text-emerald-400' : 'bg-vyntra-text/[0.05] text-vyntra-text-sec'}`}>
                                  <Check size={11} className={`stroke-[3.5] ${isPassLengthValid ? 'opacity-100' : 'opacity-30'}`} />
                                </div>
                                <span className={`${isPassLengthValid ? 'text-vyntra-text font-medium' : 'text-vyntra-text-sec'}`}>Minimum 8 characters</span>
                              </div>

                              <div className="flex items-center gap-2 text-xs">
                                <div className={`flex items-center justify-center w-4 h-4 p-0.5 rounded-full ${isPassUpperValid ? 'bg-emerald-500/15 text-emerald-400' : 'bg-vyntra-text/[0.05] text-vyntra-text-sec'}`}>
                                  <Check size={11} className={`stroke-[3.5] ${isPassUpperValid ? 'opacity-100' : 'opacity-30'}`} />
                                </div>
                                <span className={`${isPassUpperValid ? 'text-vyntra-text font-medium' : 'text-vyntra-text-sec'}`}>At least 1 uppercase letter (A-Z)</span>
                              </div>

                              <div className="flex items-center gap-2 text-xs">
                                <div className={`flex items-center justify-center w-4 h-4 p-0.5 rounded-full ${isPassSpecialValid ? 'bg-emerald-500/15 text-emerald-400' : 'bg-vyntra-text/[0.05] text-vyntra-text-sec'}`}>
                                  <Check size={11} className={`stroke-[3.5] ${isPassSpecialValid ? 'opacity-100' : 'opacity-30'}`} />
                                </div>
                                <span className={`${isPassSpecialValid ? 'text-vyntra-text font-medium' : 'text-vyntra-text-sec'}`}>At least 1 special character (e.g. @, #, $, !)</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Confirm Password field with match checker */}
                        {!isLogin && (
                          <>
                            <div className="relative">
                              <input 
                                type={showConfirmPassword ? "text" : "password"} 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder=" "
                                required
                                className={`block w-full px-4 pb-3.5 pt-6 text-slate-900 dark:text-white bg-vyntra-text/[0.03] border rounded-2xl appearance-none focus:outline-none focus:ring-4 transition-all ${
                                  confirmPassword && !doPasswordsMatch ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/10' :
                                  confirmPassword && doPasswordsMatch ? 'border-emerald-500/40 focus:border-emerald-400 focus:ring-emerald-500/10' :
                                  'border-vyntra-text/15 focus:border-vyntra-primary focus:ring-vyntra-primary/10 hover:border-vyntra-text/25'
                                }`}
                              />
                              <label className="absolute text-[13px] text-slate-500 dark:text-slate-400 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-vyntra-primary pointer-events-none font-medium">Confirm Password</label>
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors z-20 cursor-pointer pointer-events-auto"
                              >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                            </div>

                            {/* Terms & Privacy checkbox agreement container */}
                            <div className="flex items-start gap-3 px-1 py-1 select-none">
                              <label className="relative flex items-center justify-center p-0.5 mt-0.5 cursor-pointer group">
                                <input 
                                  type="checkbox" 
                                  checked={acceptedTerms}
                                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                                  className="peer sr-only"
                                />
                                <div className="w-5 h-5 bg-vyntra-text/[0.03] border border-vyntra-text/15 rounded-lg transition-all duration-200 peer-checked:bg-vyntra-primary peer-checked:border-vyntra-primary hover:border-vyntra-primary/50 flex items-center justify-center text-white peer-focus:ring-2 peer-focus:ring-vyntra-primary/15 group-active:scale-95 shadow-inner">
                                  <Check size={13} className="stroke-[3.5] opacity-0 peer-checked:opacity-100 scale-75 peer-checked:scale-100 transition-all duration-200" />
                                </div>
                              </label>
                              <span className="text-[12px] text-slate-600 dark:text-slate-400 leading-normal font-medium">
                                I verify and agree to Vyntra's{' '}
                                <a 
                                  href="#" 
                                  onClick={(e) => { e.preventDefault(); setActiveLegalModal('terms'); }} 
                                  className="text-vyntra-primary hover:underline font-bold"
                                >
                                  Terms of Service
                                </a>{' '}
                                and{' '}
                                <a 
                                  href="#" 
                                  onClick={(e) => { e.preventDefault(); setActiveLegalModal('privacy'); }} 
                                  className="text-vyntra-primary hover:underline font-bold"
                                >
                                  Privacy Policy
                                </a>.
                              </span>
                            </div>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submission triggers with scale-down clicks */}
                  <div className="pt-6 mt-auto">
                    <button 
                      type="submit"
                      disabled={isLoading || (!isLogin && authStep !== 'otp' && !acceptedTerms)}
                      onClick={authStep === 'otp' ? (e) => { e.preventDefault(); handleValidate(); } : undefined}
                      className="w-full bg-vyntra-primary hover:bg-vyntra-primary/95 text-white font-bold py-4 rounded-xl disabled:opacity-30 disabled:pointer-events-none transition-all flex justify-center items-center gap-2 hover:scale-[1.01] active:scale-[0.96] shadow-lg cursor-pointer"
                    >
                      {isLoading && <Loader2 className="animate-spin" size={16} />}
                      {isLoading ? "Processing..." : (authStep === 'otp' ? 'Validate Code' : isLogin ? 'Log in' : 'Create account')}
                    </button>
                    {!isLogin && authStep !== 'otp' && (
                      <p className="mt-5 text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed text-center">
                        By registering, you agree to the <a href="#" onClick={(e) => { e.preventDefault(); setActiveLegalModal('terms'); }} className="text-vyntra-primary hover:underline">Terms of Service</a> and <a href="#" onClick={(e) => { e.preventDefault(); setActiveLegalModal('privacy'); }} className="text-vyntra-primary hover:underline font-semibold">Privacy Policy</a>. Others will be able to find you securely. <a href="#" onClick={(e) => { e.preventDefault(); setActiveLegalModal('options'); }} className="text-vyntra-primary hover:underline font-semibold">Privacy Options</a>
                      </p>
                    )}
                    {isLogin ? (
                      <p className="mt-4 text-[12px] text-slate-600 dark:text-slate-400 font-medium text-center select-none">
                        Don't have an account?{' '}
                        <button 
                          type="button" 
                          onClick={() => { setIsLogin(false); setAuthStep('form'); }} 
                          className="text-vyntra-primary hover:underline font-bold focus:outline-none cursor-pointer"
                        >
                          Sign up
                        </button>
                      </p>
                    ) : (
                      authStep !== 'otp' && (
                        <p className="mt-4 text-[12px] text-slate-600 dark:text-slate-400 font-medium text-center select-none">
                          Already have an account?{' '}
                          <button 
                            type="button" 
                            onClick={() => { setIsLogin(true); setAuthStep('form'); }} 
                            className="text-vyntra-primary hover:underline font-bold focus:outline-none cursor-pointer"
                          >
                            Log in
                          </button>
                        </p>
                      )
                    )}
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* EXQUISITE GOOGLE SIGN-IN SIMULATOR OVERLAY (AUTHENTIC CHROME POPUP MOCKUP) */}
      {/* SECURE LEGAL DOCUMENT MODAL */}
        {activeLegalModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-[#0f111a] text-white border border-white/10 rounded-2xl p-6 md:p-8 max-w-[500px] w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setActiveLegalModal(null)}
                className="absolute top-5 right-5 text-[#8e8e93] hover:text-white transition-colors cursor-pointer p-1.5 rounded-full hover:bg-white/5 active:scale-90"
                id="close-legal-modal"
              >
                <X size={18} />
              </button>

              <div className="mb-6">
                <div className="w-12 h-12 bg-vyntra-primary/10 rounded-xl flex items-center justify-center mb-4 border border-vyntra-primary/20 shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6c5ce7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-check">
                    <path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                </div>
                <h3 className="text-xl font-black tracking-tight text-white mb-1">
                  {activeLegalModal === 'terms' && "Terms of Service"}
                  {activeLegalModal === 'privacy' && "Privacy Policy"}
                  {activeLegalModal === 'cookie' && "Cookie Policy"}
                  {activeLegalModal === 'options' && "Privacy Options"}
                </h3>
                <p className="text-xs text-slate-400">
                  {activeLegalModal === 'terms' && "Overview of your rights and guiding rules at Vyntra."}
                  {activeLegalModal === 'privacy' && "Details on how securely we encrypt and guard your profile details."}
                  {activeLegalModal === 'cookie' && "Full transparency regarding cookies and device preferences cached."}
                  {activeLegalModal === 'options' && "Secure choices for visibility, stealth accounts, and identity protection."}
                </p>
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 max-h-[250px] overflow-y-auto text-[13px] text-slate-300 leading-relaxed font-normal whitespace-pre-wrap antialiased scrollbar-thin">
                {activeLegalModal === 'terms' && "By using Vyntra, you agree to our Terms of Service. These terms govern your use of the Vyntra platform, including any features, services, technologies, or software we offer. We reserve the right to suspend or terminate accounts that violate our community guidelines, spread harmful content, or engage in malicious activities. We may update these terms from time to time, and continued use of the platform constitutes your agreement to the new terms."}
                {activeLegalModal === 'privacy' && "At Vyntra, we deeply respect your privacy. This Privacy Policy outlines what data we collect, how it's used, and how it is shared. All private user data, including direct messages and account settings, is securely stored and encrypted. We do not sell your personal data to unauthorized third parties. By using Vyntra, you consent to our data practices as described in this detailed policy. We aim for full transparency and user control."}
                {activeLegalModal === 'cookie' && "We use cookies and similar tracking technologies to improve your experience, remember your user preferences, ensure platform security, and show more relevant content. Cookies are small pieces of text sent to your browser that help our platform remember information about your visit. You can manage your cookie preferences in your browser settings at any time, though some features of the platform may not function correctly if certain cookies are disabled."}
                {activeLegalModal === 'options' && "Vyntra provides you with multiple tools to control your security, including granular profile discoverability preferences, stealth viewing options, and two-factor authentication. By default, Vyntra blocks unrecognized and untrusted connection requests to keep your data secure. These settings can be fully customized in the account settings page once you are registered and logged in."}
              </div>

              <div className="mt-6 flex gap-3">
                <button 
                  onClick={() => setActiveLegalModal(null)}
                  className="w-full bg-vyntra-primary hover:bg-vyntra-primary/95 text-white font-bold rounded-xl py-3 text-[14px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:translate-y-[-1px] active:translate-y-[1px]"
                >
                  <span>Close Document</span>
                  <Check size={14} />
                </button>
              </div>

              <div className="mt-4 text-center text-[10px] text-slate-500">
                Last updated: June 2026. © Vyntra Corp. Cybersecurity Shield Enabled.
              </div>
            </motion.div>
          </div>
        )}

        {/* FIREBASE AUTH UNAUTHORIZED DOMAIN HELP MODAL */}
        {unauthorizedDomain && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-[#0f111a] text-white border border-white/10 rounded-2xl p-6 md:p-8 max-w-[520px] w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setUnauthorizedDomain(null)}
                className="absolute top-5 right-5 text-[#8e8e93] hover:text-white transition-colors cursor-pointer p-1.5 rounded-full hover:bg-white/5 active:scale-90"
                id="close-unauthorized-modal"
              >
                <X size={18} />
              </button>

              <div className="mb-6">
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4 border border-amber-500/20 shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <h3 className="text-xl font-black tracking-tight text-white mb-1">
                  Domain Authorization Required
                </h3>
                <p className="text-xs text-slate-400">
                  Firebase Authentication restricts Google Sign-In to whitelisted domains.
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1">Your Current Domain</span>
                  <div className="flex items-center justify-between gap-3 bg-black/40 border border-white/10 rounded-lg p-2.5 font-mono text-xs text-amber-400 select-all">
                    <span className="truncate">{unauthorizedDomain}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(unauthorizedDomain || '');
                        triggerToast("Domain copied!", "success");
                      }}
                      className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-white/5 rounded"
                      title="Copy Domain"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 text-[13px] text-slate-300 space-y-3">
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">How to authorize:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-slate-300">
                    <li>Copy your current domain above.</li>
                    <li>
                      Open your{" "}
                      <a 
                        href="https://console.firebase.google.com/project/_/authentication/providers" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-vyntra-primary hover:underline font-bold inline-flex items-center gap-0.5"
                      >
                        Firebase Console <ExternalLink size={11} className="inline" />
                      </a>
                    </li>
                    <li>Go to the <strong className="text-white">Settings</strong> tab at the top.</li>
                    <li>Click <strong className="text-white">Authorized domains</strong> in the sidebar.</li>
                    <li>Click <strong className="text-white">Add domain</strong>, paste the domain, and save.</li>
                    <li><strong className="text-amber-400">Wait a few minutes</strong> for Firebase to update.</li>
                    <li><strong className="text-amber-400">IMPORTANT:</strong> You MUST open this app in a <strong className="text-white">New Tab</strong> (using the button in the top right corner) because Google Sign-In is blocked in embedded previews.</li>
                  </ol>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <a 
                  href="https://console.firebase.google.com/project/_/authentication/providers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-vyntra-primary hover:bg-vyntra-primary/95 text-white font-bold rounded-xl py-3 text-[14px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:translate-y-[-1px] active:translate-y-[1px]"
                >
                  <span>Go to Firebase Console</span>
                  <ExternalLink size={14} />
                </a>
                <button 
                  onClick={() => setUnauthorizedDomain(null)}
                  className="bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl px-5 py-3 text-[14px] transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 text-center text-[10px] text-slate-500">
                Authorized domains prevent unauthorized sites from pretending to be your app.
              </div>
            </motion.div>
          </div>
        )}

      </AnimatePresence>
    </div>
  );
}
