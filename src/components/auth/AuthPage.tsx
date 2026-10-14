import React, { useState } from 'react';
import {
  ArrowLeft,
  AlertCircle,
  ChevronDown,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { countriesList } from '../../data/mockData';
import { Page } from '../../types';
import {
  deriveNameFromEmail,
  deriveCustomerIdFromEmail,
  loginWithEmailAndPassword,
  registerNewUser,
  loginCustomerApi,
  signupCustomerApi,
  getCurrentUser,
} from '../../utils/userAuth';

interface AuthPageProps {
  onSuccess: () => void;
  onNavigate: (page: Page) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess, onNavigate }) => {
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [fullName, setFullName] = useState('John Doe');
  const [email, setEmail] = useState('john@example.com');
  const [phoneCode, setPhoneCode] = useState('+91');
  const [phone, setPhone] = useState('98765 43210');
  const [selectedCountry, setSelectedCountry] = useState('United Arab Emirates');
  const [password, setPassword] = useState('Secret123!');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [phoneCodeDropdownOpen, setPhoneCodeDropdownOpen] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        });
        if (!res.success && res.error) {
          setErrors({ email: res.error });
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await loginCustomerApi(email.trim(), password, deriveNameFromEmail(email.trim()));
        if (!res.success && res.error) {
          setErrors({ email: res.error });
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

  const handleSocialClick = (provider: string) => {
    setFeedbackNotice(
      `Frontend Demo: ${provider} integration will connect during backend authentication phase.`
    );
    setTimeout(() => setFeedbackNotice(null), 3500);
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
            <div className="w-full mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-start gap-2 animate-fadeIn text-left">
              <AlertCircle className="w-4 h-4 text-[#005CE6] shrink-0 mt-0.5" />
              <span className="font-medium">{feedbackNotice}</span>
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
                setErrors({});
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
                setErrors({});
              }}
              className={`relative py-2.5 text-center text-[15px] font-semibold transition-colors flex items-center justify-center cursor-pointer rounded-lg ${
                mode === 'login'
                  ? 'text-blue-600 bg-white shadow-sm font-bold'
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
            onClick={() => handleSocialClick('Google')}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors bg-white font-semibold text-[15px] text-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)] cursor-pointer"
            type="button"
          >
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
            <span>Continue with Google</span>
          </button>

          {/* Continue with Email Button */}
          <button
            onClick={() => handleSocialClick('Email')}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors bg-white font-semibold text-[15px] text-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)] cursor-pointer"
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
        <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="w-full border-none p-0 text-[15px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 bg-transparent"
                  id="fullName"
                  name="fullName"
                  placeholder="John Doe"
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
                className="w-full border-none p-0 text-[15px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 bg-transparent"
                id="email"
                name="email"
                placeholder="john@example.com"
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
                  {/* Indian Flag SVG Replica */}
                  <div className="w-6 h-4 overflow-hidden rounded-[2px] shadow-sm flex flex-col justify-between flex-shrink-0 mr-2 border border-slate-100">
                    <div className="h-[33.33%] bg-[#FF9933]" />
                    <div className="h-[33.33%] bg-white flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full border border-[#000080] flex items-center justify-center">
                        <div className="w-0.5 h-0.5 bg-[#000080] rounded-full" />
                      </div>
                    </div>
                    <div className="h-[33.33%] bg-[#138808]" />
                  </div>
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
                          <span className="text-base">{c.flag}</span>
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
                  {/* UAE Flag (SVG replica) */}
                  <div className="w-6 h-4 flex overflow-hidden rounded-[2px] shadow-sm border border-slate-100 flex-shrink-0">
                    <div className="w-[30%] bg-[#FF0000] h-full" />
                    <div className="w-[70%] flex flex-col h-full">
                      <div className="h-1/3 bg-[#00732F]" />
                      <div className="h-1/3 bg-white" />
                      <div className="h-1/3 bg-black" />
                    </div>
                  </div>
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
                      <span className="text-base">{c.flag}</span>
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
                  onClick={() => handleSocialClick('Password Reset')}
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
                      handleSocialClick('Terms & Conditions');
                    }}
                    className="text-blue-600 hover:underline font-medium cursor-pointer"
                  >
                    Terms &amp; Conditions
                  </span>{' '}
                  and{' '}
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSocialClick('Privacy Policy');
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
              className="w-full py-3.5 px-4 bg-[#005CE6] hover:bg-[#0052cc] active:scale-[0.99] text-white text-[16px] font-bold rounded-xl transition duration-150 shadow-md flex items-center justify-center tracking-wide cursor-pointer"
              type="submit"
            >
              {mode === 'signup' ? 'Create Account' : 'Login'}
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
    </div>
  );
};
