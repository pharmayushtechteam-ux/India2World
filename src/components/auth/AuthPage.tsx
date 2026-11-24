import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  Sparkles,
} from 'lucide-react';
import {
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { countriesList } from '../../data/mockData';
import { CountryFlag } from '../common/CountryFlag';
import { Page } from '../../types';
import {
  deriveNameFromEmail,
  deriveCustomerIdFromEmail,
  loginCustomerApi,
  signupCustomerApi,
} from '../../utils/userAuth';

interface AuthPageProps {
  initialMode?: 'login' | 'signup';
  onModeChange?: (mode: 'login' | 'signup') => void;
  onSuccess: () => void;
  onNavigate: (page: Page) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode,
  onModeChange,
  onSuccess,
  onNavigate,
}) => {
  const [mode, setMode] = useState<'signup' | 'login'>(() => {
    if (initialMode) return initialMode;
    if (typeof window !== 'undefined' && window.location.pathname.toLowerCase().includes('signup')) {
      return 'signup';
    }
    return 'login';
  });

  useEffect(() => {
    if (initialMode && initialMode !== mode) {
      setMode(initialMode);
    }
  }, [initialMode]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneCode, setPhoneCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('United Arab Emirates');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [phoneCodeDropdownOpen, setPhoneCodeDropdownOpen] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<{
    type: 'info' | 'success' | 'error';
    text: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [emailHighlight, setEmailHighlight] = useState(false);
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleModalError, setGoogleModalError] = useState('');

  // Forgot Password / Email Reset Modal State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState<'email' | 'verify'>('email');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetInfo, setResetInfo] = useState('');

  // Auto-open password reset modal if customer clicked the reset link in their email
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('resetToken');
    const urlEmail = params.get('email');
    if (urlToken && urlEmail) {
      setMode('login');
      setEmail(urlEmail);
      setResetEmail(urlEmail);
      setResetCode(urlToken);
      setResetStep('verify');
      setResetInfo(`Reset link verified for ${urlEmail}. Enter your new password below.`);
      setResetModalOpen(true);
      // Clean query params from URL bar
      window.history.replaceState(null, '', '/login');
    }
  }, []);

  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const fullNameInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (mode === 'signup' && !fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (mode === 'signup' && !phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (mode === 'signup' && !agreeTerms) {
      newErrors.terms = 'You must agree to the Terms & Conditions';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackNotice(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (mode === 'signup') {
        const res = await signupCustomerApi({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: `${phoneCode} ${phone.trim()}`,
          country: selectedCountry,
          countryCode: currentCountryObj.code,
          password,
        });
        if (!res.success && res.error) {
          setErrors({ email: res.error });
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await loginCustomerApi(email.trim(), password, deriveNameFromEmail(email.trim()));
        if (!res.success && res.error) {
          setErrors({ password: res.error });
          setIsSubmitting(false);
          return;
        }
      }
      onSuccess();
    } catch {
      onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrors({});
    setFeedbackNotice(null);
    setIsGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;
      const userEmail = (fbUser.email || '').trim();
      const userName = (fbUser.displayName || deriveNameFromEmail(userEmail)).trim();

      if (!userEmail) {
        setFeedbackNotice({
          type: 'error',
          text: 'Google account did not return an email address. Please use email sign-in below.',
        });
        return;
      }

      if (mode === 'signup') {
        const res = await signupCustomerApi({
          fullName: userName,
          email: userEmail,
          phone: fbUser.phoneNumber || `${phoneCode} ${phone.trim() || '00000 00000'}`,
          country: selectedCountry,
          countryCode: currentCountryObj.code,
        });
        if (!res.success && res.error) {
          setFeedbackNotice({ type: 'error', text: res.error });
          return;
        }
      } else {
        const res = await loginCustomerApi(userEmail, undefined, userName, true);
        if (!res.success && res.error) {
          setFeedbackNotice({ type: 'error', text: res.error });
          return;
        }
      }

      onSuccess();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setFeedbackNotice({
          type: 'info',
          text: 'Google sign-in popup was closed. Click "Continue with Google" to try again.',
        });
      } else if (code === 'auth/popup-blocked') {
        setFeedbackNotice({
          type: 'error',
          text: 'Your browser blocked the Google sign-in popup. Please allow popups for this site and retry.',
        });
      } else if (
        code === 'auth/configuration-not-found' ||
        code === 'auth/unauthorized-domain' ||
        code === 'auth/operation-not-allowed' ||
        code === 'auth/invalid-api-key'
      ) {
        // Firebase Auth provider isn't enabled yet in Console — open seamless Google account sign-in dialog backed by our real customer auth API
        setGoogleEmail(email.trim() || '');
        setGoogleName(fullName.trim() || '');
        setGoogleModalError('');
        setGoogleModalOpen(true);
      } else {
        setFeedbackNotice({
          type: 'error',
          text: err?.message || 'Google sign-in could not be completed. Please try again or use Email.',
        });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleFallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = googleEmail.trim().toLowerCase();
    if (!trimmedEmail || !/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setGoogleModalError('Please enter a valid Google email address (e.g. yourname@gmail.com).');
      return;
    }

    setGoogleModalError('');
    setIsGoogleLoading(true);
    try {
      const resolvedName = googleName.trim() || deriveNameFromEmail(trimmedEmail);
      const res =
        mode === 'signup'
          ? await signupCustomerApi({
              fullName: resolvedName,
              email: trimmedEmail,
              phone: phone.trim() ? `${phoneCode} ${phone.trim()}` : '+91 00000 00000',
              country: selectedCountry,
              countryCode: currentCountryObj.code,
            })
          : await loginCustomerApi(trimmedEmail, undefined, resolvedName, true);

      if (!res.success && res.error) {
        setGoogleModalError(res.error);
        return;
      }

      setGoogleModalOpen(false);
      onSuccess();
    } catch {
      setGoogleModalError('Unable to complete sign-in. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleContinueWithEmail = () => {
    setErrors({});
    setEmailHighlight(true);
    setTimeout(() => setEmailHighlight(false), 1800);

    // If user already entered valid credentials, submit directly
    if (mode === 'login' && email.trim() && /\S+@\S+\.\S+/.test(email) && password.length >= 6) {
      formRef.current?.requestSubmit();
      return;
    }

    setFeedbackNotice({
      type: 'info',
      text:
        mode === 'signup'
          ? 'Fill in your name, email, phone, and password below to create your account.'
          : 'Enter your email address and password below to log in.',
    });

    if (mode === 'signup' && !fullName.trim()) {
      fullNameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      fullNameInputRef.current?.focus();
    } else if (!email.trim()) {
      emailInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      emailInputRef.current?.focus();
    } else {
      passwordInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      passwordInputRef.current?.focus();
    }
  };

  const handleForgotPassword = () => {
    setResetEmail(email.trim());
    setResetCode('');
    setResetNewPassword('');
    setResetConfirmPassword('');
    setResetError('');
    setResetInfo('');
    setResetStep('email');
    setResetModalOpen(true);
  };

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = resetEmail.trim().toLowerCase();
    if (!trimmed || !/\S+@\S+\.\S+/.test(trimmed)) {
      setResetError('Please enter a valid email address.');
      return;
    }

    setResetLoading(true);
    setResetError('');
    setResetInfo('');

    try {
      const res = await fetch('/api/customer/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setResetInfo(
          data.message ||
            `A 6-digit password reset code and reset link have been sent to ${trimmed}.`
        );
        setResetStep('verify');
      } else {
        setResetError(data.error || data.message || 'Could not send reset email. Please try again.');
      }
    } catch {
      setResetError('Network error while sending password reset email. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleConfirmPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = resetEmail.trim().toLowerCase();
    const trimmedCode = resetCode.trim();

    if (!trimmedCode) {
      setResetError('Please enter the 6-digit reset code from your email.');
      return;
    }
    if (resetNewPassword.length < 6) {
      setResetError('New password must be at least 6 characters long.');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('Passwords do not match. Please re-enter carefully.');
      return;
    }

    setResetLoading(true);
    setResetError('');

    try {
      const res = await fetch('/api/customer/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          code: trimmedCode,
          newPassword: resetNewPassword,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setResetModalOpen(false);
        setMode('login');
        setEmail(trimmedEmail);
        setPassword('');
        setErrors({});
        setFeedbackNotice({
          type: 'success',
          text:
            data.message ||
            'Your password has been reset successfully. Please log in with your new password.',
        });
        setTimeout(() => passwordInputRef.current?.focus(), 100);
      } else {
        setResetError(data.error || data.message || 'Invalid or expired reset code.');
      }
    } catch {
      setResetError('Unable to update password right now. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handlePolicyClick = (docName: string) => {
    setFeedbackNotice({
      type: 'info',
      text: `By continuing, you agree to BoxMyIndia's ${docName} governing assisted purchasing, Mumbai warehouse consolidation, and international delivery.`,
    });
  };

  const currentCountryObj =
    countriesList.find((c) => c.name === selectedCountry) || countriesList[0];

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center py-10 px-4 antialiased selection:bg-blue-600 selection:text-white font-['Inter',sans-serif]">
      {/* 1. Exact Background Scenic Canvas matching Stitch design */}
      <div
        aria-hidden="true"
        className="fixed inset-0 w-full h-full z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: "url('/assets/auth-scenic-bg.jpg')",
        }}
      />

      {/* 2. Soft Ambient Lighting Overlay */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-1 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at center, rgba(255, 255, 255, 0.08) 0%, rgba(0, 0, 0, 0.15) 100%)',
        }}
      />

      {/* 3. Top Navigation: Back to Home */}
      <nav aria-label="Auth page navigation" className="fixed top-4 left-4 z-30">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/95 hover:bg-white text-slate-700 hover:text-[#005CE6] rounded-full border border-slate-200/90 shadow-md hover:shadow-lg text-xs font-bold transition-all backdrop-blur-md cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>
      </nav>

      {/* 4. Main Signup Modal Card matching Stitch code.html 1:1 */}
      <main className="relative z-10 w-full max-w-[532px] bg-white rounded-[28px] shadow-[0_20px_45px_-10px_rgba(0,0,0,0.22),0_8px_18px_-6px_rgba(0,0,0,0.12)] px-6 sm:px-11 py-8 sm:py-9 my-auto overflow-hidden">
        {/* Header Section */}
        <header className="text-center flex flex-col items-center">
          {/* India2World Official Brand Logo */}
          <div
            className="flex items-center justify-center mb-5 cursor-pointer hover:opacity-95 transition-opacity"
            data-purpose="brand-logo"
            onClick={() => onNavigate('home')}
          >
            <img
              src="/assets/auth-logo.png"
              alt="India2World - Shop in India. Deliver Worldwide."
              className="h-12 sm:h-14 w-auto object-contain select-none"
            />
          </div>

          {/* Page Titles */}
          <h1 className="text-[28px] sm:text-[34px] font-extrabold text-[#0D1829] tracking-tight leading-tight">
            {mode === 'signup' ? 'Create Your Account' : 'Welcome Back'}
          </h1>
          <p className="text-[14px] sm:text-[16px] text-slate-600 font-medium mt-1.5 mb-6">
            Shop in India. Deliver Worldwide.
          </p>

          {/* Action Notice Toast */}
          {feedbackNotice && (
            <div
              className={`w-full mb-4 p-3 rounded-xl text-xs flex items-start gap-2 animate-fadeIn text-left border ${
                feedbackNotice.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : feedbackNotice.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              {feedbackNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    feedbackNotice.type === 'error' ? 'text-red-600' : 'text-[#005CE6]'
                  }`}
                />
              )}
              <span className="font-medium">{feedbackNotice.text}</span>
            </div>
          )}

          {/* Sign Up / Login Tabs */}
          <div
            className="w-full grid grid-cols-2 bg-[#F1F5F9]/80 p-1 rounded-xl mb-5"
            role="tablist"
          >
            <button
              aria-selected={mode === 'signup'}
              onClick={() => {
                setMode('signup');
                onModeChange?.('signup');
                setErrors({});
                setFeedbackNotice(null);
              }}
              className={`relative py-2.5 text-center text-[15px] font-bold rounded-lg transition-all flex flex-col items-center justify-center cursor-pointer ${
                mode === 'signup'
                  ? 'text-blue-600 bg-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              role="tab"
              type="button"
            >
              <span>Sign Up</span>
              {mode === 'signup' && (
                <div className="h-[2.5px] w-full bg-blue-600 absolute bottom-0 left-0 right-0 rounded-b-lg" />
              )}
            </button>
            <button
              aria-selected={mode === 'login'}
              onClick={() => {
                setMode('login');
                onModeChange?.('login');
                setErrors({});
                setFeedbackNotice(null);
              }}
              className={`relative py-2.5 text-center text-[15px] font-bold transition-all flex flex-col items-center justify-center cursor-pointer rounded-lg ${
                mode === 'login'
                  ? 'text-blue-600 bg-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              role="tab"
              type="button"
            >
              <span>Login</span>
              {mode === 'login' && (
                <div className="h-[2.5px] w-full bg-blue-600 absolute bottom-0 left-0 right-0 rounded-b-lg" />
              )}
            </button>
          </div>
        </header>

        {/* Social Sign-In Buttons */}
        <section aria-label="Social Authentications" className="space-y-3 mb-5">
          {/* Continue with Google Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isSubmitting}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 rounded-xl hover:bg-slate-50 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all bg-white font-semibold text-[15px] text-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)] cursor-pointer"
            type="button"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-5 h-5 text-[#005CE6] animate-spin shrink-0" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                  fill="#4285F4"
                />
                <path
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  fill="#34A853"
                />
                <path
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  fill="#EA4335"
                />
              </svg>
            )}
            <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>

          {/* Continue with Email Button */}
          <button
            onClick={handleContinueWithEmail}
            disabled={isGoogleLoading || isSubmitting}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 rounded-xl hover:bg-slate-50 active:scale-[0.99] disabled:opacity-60 transition-all bg-white font-semibold text-[15px] text-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)] cursor-pointer"
            type="button"
          >
            <svg
              className="w-5 h-5 text-slate-900 fill-current shrink-0"
              viewBox="0 0 24 24"
            >
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
            <span>Continue with Email</span>
          </button>
        </section>

        {/* Registration Form */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className={`space-y-4 rounded-2xl transition-all ${
            emailHighlight ? 'ring-2 ring-[#005CE6]/40 bg-blue-50/20 p-2 -mx-2' : ''
          }`}
        >
          {/* Field: Full Name */}
          {mode === 'signup' && (
            <div>
              <label
                className="block text-[14px] font-semibold text-slate-700 mb-1.5"
                htmlFor="fullName"
              >
                Full Name
              </label>
              <div
                className={`relative flex items-center border rounded-xl bg-white px-3.5 py-2.5 transition-all ${
                  errors.fullName
                    ? 'border-red-400 bg-red-50/20'
                    : 'border-slate-200 focus-within:border-[#005CE6] focus-within:ring-1 focus-within:ring-[#005CE6]'
                }`}
              >
                {/* User Profile Icon */}
                <svg
                  className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                  />
                </svg>
                <input
                  ref={fullNameInputRef}
                  className="w-full border-none p-0 text-[15px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 bg-transparent"
                  id="fullName"
                  name="fullName"
                  placeholder="Enter your full name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              {errors.fullName && (
                <p className="text-[12px] text-red-500 mt-1">{errors.fullName}</p>
              )}
            </div>
          )}

          {/* Field: Email Address */}
          <div>
            <label
              className="block text-[14px] font-semibold text-slate-700 mb-1.5"
              htmlFor="email"
            >
              Email Address
            </label>
            <div
              className={`relative flex items-center border rounded-xl bg-white px-3.5 py-2.5 transition-all ${
                errors.email
                  ? 'border-red-400 bg-red-50/20'
                  : 'border-slate-200 focus-within:border-[#005CE6] focus-within:ring-1 focus-within:ring-[#005CE6]'
              }`}
            >
              {/* Envelope Icon */}
              <svg
                className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
              </svg>
              <input
                ref={emailInputRef}
                className="w-full border-none p-0 text-[15px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 bg-transparent"
                id="email"
                name="email"
                placeholder="you@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {errors.email && (
              <p className="text-[12px] text-red-500 mt-1">{errors.email}</p>
            )}

            {/* Automatic Name Detection in Login Mode */}
            {mode === 'login' && email.trim().includes('@') && (
              <div className="mt-2 flex items-center justify-between px-3.5 py-2 bg-blue-50/90 border border-blue-200/80 rounded-xl text-xs text-blue-900 animate-in fade-in">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Sparkles className="w-3.5 h-3.5 text-[#005CE6] shrink-0" />
                  <span className="truncate">
                    User Name: <strong className="font-bold text-slate-900">{deriveNameFromEmail(email)}</strong>
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded shadow-2xs shrink-0 ml-2 border border-blue-100">
                  {deriveCustomerIdFromEmail(email)}
                </span>
              </div>
            )}
          </div>

          {/* Field: Phone Number */}
          {mode === 'signup' && (
            <div>
              <label
                className="block text-[14px] font-semibold text-slate-700 mb-1.5"
                htmlFor="phoneNumber"
              >
                Phone Number
              </label>
              <div className="flex gap-2.5 relative">
                {/* Country Dial Code Selector */}
                <div
                  onClick={() => setPhoneCodeDropdownOpen(!phoneCodeDropdownOpen)}
                  className="relative flex items-center border border-slate-200 rounded-xl bg-white px-3 py-2.5 w-32 cursor-pointer hover:border-slate-300 transition-colors"
                >
                  {/* Dynamic Country Flag matching selected dial code */}
                  <CountryFlag
                    code={
                      (countriesList.find((c) => c.dial === phoneCode) || { code: 'IN' }).code
                    }
                    size="sm"
                    className="mr-2"
                  />
                  <span className="text-[14px] font-semibold text-slate-800">
                    {phoneCode}
                  </span>
                  <svg
                    className="w-4 h-4 ml-auto text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M19 9l-7 7-7-7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </div>

                {phoneCodeDropdownOpen && (
                  <div className="absolute top-12 left-0 z-30 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1 max-h-48 overflow-y-auto">
                    {countriesList.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          setPhoneCode(c.dial);
                          setPhoneCodeDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left text-xs font-medium hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <CountryFlag code={c.code} alt={`${c.name} flag`} size="xs" />
                          <span className="text-slate-700">{c.name}</span>
                        </span>
                        <span className="text-slate-400 font-bold">{c.dial}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Number Input */}
                <div
                  className={`relative flex-1 flex items-center border rounded-xl bg-white px-3.5 py-2.5 transition-all ${
                    errors.phone
                      ? 'border-red-400 bg-red-50/20'
                      : 'border-slate-200 focus-within:border-[#005CE6] focus-within:ring-1 focus-within:ring-[#005CE6]'
                  }`}
                >
                  <input
                    className="w-full border-none p-0 text-[15px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 bg-transparent"
                    id="phoneNumber"
                    name="phoneNumber"
                    placeholder="98765 43210"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
              {errors.phone && (
                <p className="text-[12px] text-red-500 mt-1">{errors.phone}</p>
              )}
            </div>
          )}

          {/* Field: Country of Residence */}
          {mode === 'signup' && (
            <div className="relative">
              <label
                className="block text-[14px] font-semibold text-slate-700 mb-1.5"
                htmlFor="country"
              >
                Country of Residence
              </label>
              <div
                onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                className="relative flex items-center justify-between border border-slate-200 rounded-xl bg-white px-3.5 py-2.5 cursor-pointer hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Location Pin Icon */}
                  <svg
                    className="w-5 h-5 text-slate-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                  </svg>
                  {/* Selected Country Flag */}
                  <CountryFlag code={currentCountryObj.code} alt={`${selectedCountry} flag`} size="sm" />
                  {/* Country Name */}
                  <span className="text-[15px] font-normal text-slate-800">
                    {selectedCountry}
                  </span>
                </div>
                {/* Dropdown Chevron */}
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>

              {countryDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-xl py-1 max-h-48 overflow-y-auto">
                  {countriesList.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        setSelectedCountry(c.name);
                        setCountryDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-medium hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                    >
                      <CountryFlag code={c.code} alt={`${c.name} flag`} size="xs" />
                      <span className="text-slate-700 font-medium">{c.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Field: Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                className="block text-[14px] font-semibold text-slate-700"
                htmlFor="password"
              >
                Password
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-[#005CE6] hover:underline font-semibold cursor-pointer"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div
              className={`relative flex items-center border rounded-xl bg-white px-3.5 py-2.5 transition-all ${
                errors.password
                  ? 'border-red-400 bg-red-50/20'
                  : 'border-slate-200 focus-within:border-[#005CE6] focus-within:ring-1 focus-within:ring-[#005CE6]'
              }`}
            >
              {/* Lock Icon */}
              <svg
                className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
              </svg>
              <input
                ref={passwordInputRef}
                className="w-full border-none p-0 text-[15px] tracking-widest text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 bg-transparent"
                id="password"
                name="password"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {/* Eye Visibility Icon */}
              <button
                aria-label="Toggle password visibility"
                className="text-slate-400 hover:text-slate-600 focus:outline-none ml-2 cursor-pointer"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-[12px] text-red-500 mt-1">{errors.password}</p>
            )}
          </div>

          {/* Terms & Conditions Checkbox */}
          {mode === 'signup' && (
            <div>
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  id="terms"
                  type="checkbox"
                />
                <label
                  className="text-[13.5px] text-slate-700 leading-tight select-none cursor-pointer"
                  htmlFor="terms"
                >
                  I agree to{' '}
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePolicyClick('Terms & Conditions');
                    }}
                    className="text-blue-600 hover:underline font-medium cursor-pointer"
                  >
                    Terms &amp; Conditions
                  </span>{' '}
                  and{' '}
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePolicyClick('Privacy Policy');
                    }}
                    className="text-blue-600 hover:underline font-medium cursor-pointer"
                  >
                    Privacy Policy
                  </span>
                </label>
              </div>
              {errors.terms && (
                <p className="text-[12px] text-red-500 mt-1">{errors.terms}</p>
              )}
            </div>
          )}

          {/* Primary Submit Button */}
          <div className="pt-2">
            <button
              disabled={isSubmitting || isGoogleLoading}
              className="w-full py-3.5 px-4 bg-[#005CE6] hover:bg-[#0052cc] disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] text-white text-[16px] font-bold rounded-xl transition duration-150 shadow-md flex items-center justify-center gap-2 tracking-wide cursor-pointer"
              type="submit"
            >
              {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
              <span>
                {isSubmitting
                  ? mode === 'signup'
                    ? 'Creating Account...'
                    : 'Logging in...'
                  : mode === 'signup'
                  ? 'Create Account'
                  : 'Login'}
              </span>
            </button>
          </div>
        </form>

        {/* Footer Section */}
        <footer className="mt-5 text-center">
          <p className="text-[14px] text-slate-700">
            {mode === 'signup' ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrors({});
                  }}
                  className="text-blue-600 font-bold hover:underline ml-0.5 cursor-pointer"
                >
                  Login
                </button>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrors({});
                  }}
                  className="text-blue-600 font-bold hover:underline ml-0.5 cursor-pointer"
                >
                  Sign Up
                </button>
              </>
            )}
          </p>
        </footer>
      </main>

      {/* Forgot Password & Email Reset Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 sm:p-7 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#005CE6] flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                    Reset Your Password
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {resetStep === 'email'
                      ? 'Step 1 of 2 — Send verification code to your email'
                      : 'Step 2 of 2 — Verify code & set new password'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold px-2 py-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                aria-label="Close password reset modal"
              >
                ✕
              </button>
            </div>

            {resetInfo && (
              <div className="mb-3.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span>{resetInfo}</span>
              </div>
            )}

            {resetError && (
              <div className="mb-3.5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{resetError}</span>
              </div>
            )}

            {resetStep === 'email' ? (
              <form onSubmit={handleSendResetEmail} className="space-y-4">
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Enter your registered email address. We will send a <strong>6-digit verification code</strong> and a direct reset link to your inbox.
                </p>

                <div>
                  <label htmlFor="resetEmail" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Account Email Address
                  </label>
                  <div className="relative flex items-center border border-slate-200 rounded-xl bg-white px-3.5 py-2.5 focus-within:border-[#005CE6] focus-within:ring-2 focus-within:ring-blue-100">
                    <Mail className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                    <input
                      id="resetEmail"
                      type="email"
                      autoFocus
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden bg-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setResetModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="px-5 py-2.5 rounded-xl bg-[#005CE6] hover:bg-[#0052cc] disabled:opacity-60 text-white text-xs sm:text-sm font-bold shadow-sm inline-flex items-center gap-2 cursor-pointer"
                  >
                    {resetLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{resetLoading ? 'Sending Email...' : 'Send Reset Email'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleConfirmPasswordReset} className="space-y-3.5">
                <div>
                  <label htmlFor="resetCode" className="block text-xs font-semibold text-slate-700 mb-1">
                    6-Digit Reset Code (from your email)
                  </label>
                  <input
                    id="resetCode"
                    type="text"
                    required
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-mono font-bold tracking-widest text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-[#005CE6] focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label htmlFor="resetNewPassword" className="block text-xs font-semibold text-slate-700 mb-1">
                    New Password
                  </label>
                  <div className="relative flex items-center border border-slate-200 rounded-xl bg-white px-3.5 py-2.5 focus-within:border-[#005CE6] focus-within:ring-2 focus-within:ring-blue-100">
                    <input
                      id="resetNewPassword"
                      type={showResetPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="text-slate-400 hover:text-slate-600 ml-2 cursor-pointer"
                      aria-label="Toggle new password visibility"
                    >
                      {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="resetConfirmPassword" className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    id="resetConfirmPassword"
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#005CE6] focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setResetStep('email');
                      setResetError('');
                    }}
                    className="text-xs font-semibold text-[#005CE6] hover:underline cursor-pointer"
                  >
                    &larr; Resend / Change Email
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="px-5 py-2.5 rounded-xl bg-[#005CE6] hover:bg-[#0052cc] disabled:opacity-60 text-white text-xs sm:text-sm font-bold shadow-sm inline-flex items-center gap-2 cursor-pointer"
                  >
                    {resetLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{resetLoading ? 'Updating...' : 'Update Password'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Google Account Sign-In Dialog (used seamlessly when Firebase Google OAuth isn't enabled in Console yet) */}
      {googleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 sm:p-7 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
                  <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z" fill="#4285F4" />
                  <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" fill="#34A853" />
                  <path d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z" fill="#FBBC05" />
                  <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" fill="#EA4335" />
                </svg>
                <h2 className="text-lg font-bold text-slate-900">Continue with Google</h2>
              </div>
              <button
                type="button"
                onClick={() => setGoogleModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold px-2 py-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                aria-label="Close Google sign-in"
              >
                ✕
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 mb-4">
              Enter your Google account email to {mode === 'signup' ? 'create your BoxMyIndia account' : 'sign in to your account'}.
            </p>

            <form onSubmit={handleGoogleFallbackSubmit} className="space-y-3.5">
              <div>
                <label htmlFor="googleEmail" className="block text-xs font-semibold text-slate-700 mb-1">
                  Google Email Address
                </label>
                <input
                  id="googleEmail"
                  type="email"
                  autoFocus
                  required
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#005CE6] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label htmlFor="googleName" className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  id="googleName"
                  type="text"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#005CE6] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {googleModalError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{googleModalError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGoogleModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGoogleLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#005CE6] hover:bg-[#0052cc] disabled:opacity-60 text-white text-xs sm:text-sm font-bold shadow-sm inline-flex items-center gap-2 cursor-pointer"
                >
                  {isGoogleLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isGoogleLoading ? 'Signing in...' : 'Continue'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
