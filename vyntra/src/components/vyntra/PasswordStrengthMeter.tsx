import React from "react";
import { Check } from "lucide-react";

export interface PasswordStrengthResult {
  score: number; // 0 to 5
  label: string; // Weak, Fair, Good, Strong, etc.
  colorClass: string;
  bgClass: string;
  checks: {
    length: boolean;
    upper: boolean;
    lower: boolean;
    number: boolean;
    special: boolean;
  };
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  if (!password) {
    return {
      score: 0,
      label: "None",
      colorClass: "text-[#AAB2C8]",
      bgClass: "bg-white/10",
      checks,
    };
  }

  let score = 0;
  // Criteria 1: Minimum length of 6 (very weak starting tier)
  if (password.length >= 6) score += 1;
  // Criteria 2: Desired minimum length of 8
  if (checks.length) score += 1;
  // Criteria 3: Uppercase and Lowercase letters
  if (checks.upper && checks.lower) score += 1;
  // Criteria 4: Numbers
  if (checks.number) score += 1;
  // Criteria 5: Symbols/Special chars
  if (checks.special) score += 1;

  let label = "Weak";
  let colorClass = "text-red-500";
  let bgClass = "bg-red-500";

  if (score <= 1) {
    label = "Very Weak";
    colorClass = "text-red-500";
    bgClass = "bg-red-500";
  } else if (score === 2) {
    label = "Weak";
    colorClass = "text-orange-500";
    bgClass = "bg-orange-500";
  } else if (score === 3) {
    label = "Fair";
    colorClass = "text-yellow-500";
    bgClass = "bg-yellow-500";
  } else if (score === 4) {
    label = "Good";
    colorClass = "text-indigo-400";
    bgClass = "bg-indigo-500";
  } else {
    label = "Strong";
    colorClass = "text-[#14F195]";
    bgClass = "bg-[#14F195]";
  }

  return {
    score,
    label,
    colorClass,
    bgClass,
    checks,
  };
}

interface PasswordStrengthMeterProps {
  password: string;
  onStrengthEvaluated?: (result: PasswordStrengthResult) => void;
}

export function PasswordStrengthMeter({ password, onStrengthEvaluated }: PasswordStrengthMeterProps) {
  const result = evaluatePasswordStrength(password);

  React.useEffect(() => {
    if (onStrengthEvaluated) {
      onStrengthEvaluated(result);
    }
  }, [password]);

  if (!password) return null;

  return (
    <div className="mt-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-vyntra-text-sec">Strength Meter:</span>
        <span className={`font-black uppercase tracking-wider ${result.colorClass}`}>
          {result.label}
        </span>
      </div>
      
      {/* 5-segment Progress bar indicating security tiers */}
      <div className="grid grid-cols-5 gap-1 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => {
          const isActive = i < result.score;
          return (
            <div 
              key={i} 
              className={`h-full rounded-full transition-all duration-300 ${isActive ? result.bgClass : "bg-white/10"}`} 
            />
          );
        })}
      </div>
      
      <div className="space-y-1.5 pt-1 text-[11px]">
        {/* Requirement 1: Min 8 chars */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0">
            {result.checks.length ? (
              <Check size={11} className="text-[#14F195]" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            )}
          </div>
          <span className={result.checks.length ? "text-slate-200 font-medium" : "text-[#AAB2C8]"}>
            Minimum 8 characters (highly secure)
          </span>
        </div>

        {/* Requirement 2: Uppercase Letters */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0">
            {result.checks.upper ? (
              <Check size={11} className="text-[#14F195]" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            )}
          </div>
          <span className={result.checks.upper ? "text-slate-200 font-medium" : "text-[#AAB2C8]"}>
            At least one uppercase letter (A-Z)
          </span>
        </div>

        {/* Requirement 3: Lowercase Letters */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0">
            {result.checks.lower ? (
              <Check size={11} className="text-[#14F195]" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            )}
          </div>
          <span className={result.checks.lower ? "text-slate-200 font-medium" : "text-[#AAB2C8]"}>
            At least one lowercase letter (a-z)
          </span>
        </div>

        {/* Requirement 4: Numbers */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0">
            {result.checks.number ? (
              <Check size={11} className="text-[#14F195]" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            )}
          </div>
          <span className={result.checks.number ? "text-slate-200 font-medium" : "text-[#AAB2C8]"}>
            At least one number (0-9)
          </span>
        </div>

        {/* Requirement 5: Symbols / Special characters */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0">
            {result.checks.special ? (
              <Check size={11} className="text-[#14F195]" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            )}
          </div>
          <span className={result.checks.special ? "text-slate-200 font-medium" : "text-[#AAB2C8]"}>
            At least one special character (!@#$%^&*)
          </span>
        </div>
      </div>
    </div>
  );
}
