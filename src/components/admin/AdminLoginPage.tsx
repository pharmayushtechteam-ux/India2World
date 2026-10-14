import React, { useState } from 'react';
import { Logo } from '../common/Logo';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AdminLoginPageProps {
  onSuccess: () => void;
  onNavigateHome: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onSuccess, onNavigateHome }) => {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState('admin@india2world.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [autofillNotice, setAutofillNotice] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(email, password, rememberMe);
    setLoading(false);

    if (res.success) {
      onSuccess();
    } else {
      setError(res.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleQuickDemoFill = (e: React.MouseEvent) => {
    e.preventDefault();
    setEmail('admin@india2world.com');
    setPassword('admin123');
    setError(null);
    setAutofillNotice(true);
    setTimeout(() => setAutofillNotice(false), 2500);
  };

  return (
    <div className="min-h-screen w-full bg-[#0B1933] flex flex-col justify-between p-3.5 sm:p-6 lg:p-8 font-['Plus_Jakarta_Sans',sans-serif] relative overflow-hidden bg-[radial-gradient(ellipse_80%_80%_at_10%_-20%,rgba(0,102,255,0.22),transparent),radial-gradient(ellipse_70%_70%_at_90%_110%,rgba(99,102,241,0.18),transparent)]">
      {/* Top Header - Responsive */}
      <div className="w-full max-w-[420px] mx-auto flex items-center justify-between z-10 gap-2 pt-1 sm:pt-0">
        <button
          type="button"
          onClick={onNavigateHome}
          className="text-slate-300 hover:text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer bg-white/5 hover:bg-white/10 active:bg-white/15 px-3 py-2 rounded-xl border border-white/10 touch-manipulation shrink-0"
        >
          <span>&larr;</span>
          <span>Website</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-blue-400 font-semibold bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <ShieldCheck className="w-4 h-4 text-[#0066FF]" />
          <span>Admin Portal</span>
        </div>
      </div>

      {/* Central Login Card */}
      <div className="w-full max-w-[420px] mx-auto my-auto z-10 py-4 sm:py-6">
        <div className="bg-white rounded-3xl shadow-2xl p-5 sm:p-7 md:p-8 border border-slate-100 relative w-full">
          {/* Logo & Heading */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-3">
              <Logo size="lg" />
            </div>
            <div className="inline-block px-3 py-1 bg-slate-100 text-[#0B1933] font-bold text-[11px] sm:text-xs rounded-full uppercase tracking-wider mb-2">
              Staff & Operations
            </div>
            <h1 className="text-2xl sm:text-[26px] font-extrabold text-[#0B1933] tracking-tight">
              Admin Portal Login
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Sign in with your authorized operations credentials.
            </p>
          </div>

          {/* Autofill Notification Pill */}
          {autofillNotice && (
            <div className="mb-4 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[#0066FF] text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <CheckCircle2 className="w-4 h-4" />
              <span>Admin credentials autofilled! Click below to sign in.</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email / Username */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Admin Email or Username
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@india2world.com"
                  className="w-full pl-10 pr-4 py-2.5 text-base sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF] transition-all font-medium text-slate-800"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-semibold text-[#0066FF] hover:underline cursor-pointer touch-manipulation py-0.5"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-2.5 text-base sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF] transition-all font-medium text-slate-800"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-700 active:text-slate-900 cursor-pointer touch-manipulation transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none py-1 touch-manipulation">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-300 text-[#0066FF] focus:ring-[#0066FF] accent-[#0066FF] cursor-pointer"
                />
                <span className="text-xs sm:text-sm text-slate-600 font-medium">Remember this browser</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#0066FF] hover:bg-[#0052cc] active:bg-[#0040a8] text-white font-bold text-sm sm:text-base rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2 touch-manipulation"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo helper with responsive Autofill button */}
          <div className="mt-6 pt-4 border-t border-slate-100 bg-slate-50/70 -mx-5 sm:-mx-7 md:-mx-8 -mb-5 sm:-mb-7 md:-mb-8 p-3.5 sm:p-4 rounded-b-3xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2">
              <div className="min-w-0">
                <span className="font-bold text-slate-700 block">Demo Credentials:</span>
                <span className="text-slate-500 block text-[11px] font-mono">admin@india2world.com / admin123</span>
              </div>
              <button
                type="button"
                onClick={handleQuickDemoFill}
                className="w-full sm:w-auto px-3.5 py-1.5 bg-white hover:bg-slate-100 active:bg-slate-200 text-[#0066FF] font-bold rounded-lg border border-slate-200 text-xs shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0 touch-manipulation text-center"
              >
                Autofill
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-[420px] mx-auto text-center text-[11px] sm:text-xs text-slate-400 z-10 py-2 px-2">
        &copy; {new Date().getFullYear()} India2World Logistics Inc. Authorized Personnel Only.
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          onClick={() => {
            setShowForgotModal(false);
            setResetSent(false);
          }}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 relative"
          >
            <h3 className="text-lg font-bold text-[#0B1933] mb-2">Reset Admin Password</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter your authorized staff email. A reset security token will be dispatched to your registered device.
            </p>

            {resetSent ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Reset link dispatched! Please check your internal inbox.</span>
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                <input
                  type="email"
                  defaultValue={email}
                  placeholder="admin@india2world.com"
                  className="w-full px-3.5 py-2.5 text-base sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-[#0066FF]"
                />
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setResetSent(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 active:bg-slate-200 rounded-xl cursor-pointer touch-manipulation"
              >
                Close
              </button>
              {!resetSent && (
                <button
                  type="button"
                  onClick={() => setResetSent(true)}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#0066FF] hover:bg-[#0052cc] active:bg-[#0040a8] rounded-xl cursor-pointer touch-manipulation transition-all active:scale-95"
                >
                  Send Reset Link
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
