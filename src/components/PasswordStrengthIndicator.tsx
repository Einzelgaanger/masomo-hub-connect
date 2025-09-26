import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  confirmPassword?: string;
}

interface StrengthRule {
  label: string;
  test: (password: string) => boolean;
  met: boolean;
}

export function PasswordStrengthIndicator({ password, confirmPassword }: PasswordStrengthIndicatorProps) {
  const [rules, setRules] = useState<StrengthRule[]>([]);

  useEffect(() => {
    const newRules: StrengthRule[] = [
      {
        label: 'At least 8 characters',
        test: (pwd) => pwd.length >= 8,
        met: false
      },
      {
        label: 'Contains uppercase letter',
        test: (pwd) => /[A-Z]/.test(pwd),
        met: false
      },
      {
        label: 'Contains lowercase letter',
        test: (pwd) => /[a-z]/.test(pwd),
        met: false
      },
      {
        label: 'Contains number',
        test: (pwd) => /\d/.test(pwd),
        met: false
      },
      {
        label: 'Contains special character',
        test: (pwd) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
        met: false
      }
    ];

    // Update rules based on current password
    const updatedRules = newRules.map(rule => ({
      ...rule,
      met: rule.test(password)
    }));

    setRules(updatedRules);
  }, [password]);

  const allRulesMet = rules.every(rule => rule.met);
  const passwordsMatch = confirmPassword ? password === confirmPassword : true;

  const getStrengthColor = () => {
    const metCount = rules.filter(rule => rule.met).length;
    if (metCount < 2) return 'text-red-500';
    if (metCount < 4) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStrengthText = () => {
    const metCount = rules.filter(rule => rule.met).length;
    if (metCount < 2) return 'Weak';
    if (metCount < 4) return 'Medium';
    return 'Strong';
  };

  const getProgressWidth = () => {
    const metCount = rules.filter(rule => rule.met).length;
    return (metCount / rules.length) * 100;
  };

  if (!password) return null;

  return (
    <div className="space-y-3">
      {/* Password Strength Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Password Strength:</span>
          <span className={`font-medium ${getStrengthColor()}`}>
            {getStrengthText()}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              rules.filter(rule => rule.met).length < 2 ? 'bg-red-500' :
              rules.filter(rule => rule.met).length < 4 ? 'bg-yellow-500' :
              'bg-green-500'
            }`}
            style={{ 
              width: `${getProgressWidth()}%` 
            }}
          />
        </div>
      </div>

      {/* Password Requirements */}
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-700">Password Requirements:</p>
        <div className="space-y-1">
          {rules.map((rule, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              {rule.met ? (
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              ) : (
                <X className="h-4 w-4 text-red-500 flex-shrink-0" />
              )}
              <span className={rule.met ? 'text-green-700' : 'text-red-700'}>
                {rule.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Password Match Indicator */}
      {confirmPassword !== undefined && (
        <div className="flex items-center gap-2 text-sm">
          {passwordsMatch ? (
            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
          ) : (
            <X className="h-4 w-4 text-red-500 flex-shrink-0" />
          )}
          <span className={passwordsMatch ? 'text-green-700' : 'text-red-700'}>
            Passwords match
          </span>
        </div>
      )}

      {/* Overall Status */}
      {allRulesMet && passwordsMatch && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2 rounded-lg">
          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
          <span className="font-medium">Password is strong and ready!</span>
        </div>
      )}
    </div>
  );
}
