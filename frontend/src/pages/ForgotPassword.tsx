import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';
import { KeyRound, Mail, Lock, ArrowLeft, CheckCircle2, Eye, EyeOff, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';

interface ForgotPasswordProps {
  onLogin: () => void;
}

export default function ForgotPassword({ onLogin }: ForgotPasswordProps) {
  const [step, setStep] = useState<'email' | 'otp' | 'newPassword'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Processing...');
  const [authData, setAuthData] = useState<{ token: string; user: any } | null>(null);
  const navigate = useNavigate();

  // Step 1: Send OTP to email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setLoadingText('Sending Reset Code...');

    try {
      await API.post('/auth/forgot-password', { email });
      setTimeout(() => {
        setLoading(false);
        setStep('otp');
      }, 1000);
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to send reset code.');
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setLoadingText('Verifying OTP Code...');

    try {
      const res = await API.post('/auth/verify-reset-otp', { email, otp });
      setAuthData({ token: res.data.token, user: res.data.user });
      
      setTimeout(() => {
        setLoading(false);
        setStep('newPassword');
      }, 1200);
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || 'Invalid or expired code.');
    }
  };

  // Step 3: Set New Password & Direct Login
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setLoadingText('Updating Password & Logging In...');

    try {
      const res = await API.post('/auth/reset-password', { email, otp, newPassword });
      setSuccess(res.data.message || 'Password updated successfully!');

      setTimeout(() => {
        if (authData) {
          localStorage.setItem('token', authData.token);
          localStorage.setItem('user', JSON.stringify(authData.user));
          onLogin();
          navigate('/');
        } else {
          navigate('/login');
        }
      }, 1400);
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || 'Error updating password.');
    }
  };

  // Skip Password Reset & Direct Login
  const handleSkipAndLogin = () => {
    setLoading(true);
    setLoadingText('Redirecting to Dashboard...');

    setTimeout(() => {
      if (authData) {
        localStorage.setItem('token', authData.token);
        localStorage.setItem('user', JSON.stringify(authData.user));
        onLogin();
        navigate('/');
      } else {
        navigate('/login');
      }
    }, 1200);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full shadow-sm">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-emerald-50 rounded-2xl text-emerald-600 mb-3 border border-emerald-100">
            {step === 'newPassword' ? <ShieldCheck size={30} /> : <KeyRound size={30} />}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {step === 'email' && 'Forgot Password?'}
            {step === 'otp' && 'Verify Reset Code'}
            {step === 'newPassword' && 'Set New Password'}
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            {step === 'email' && 'Enter your registered email to receive a reset code'}
            {step === 'otp' && `Enter the 6-digit verification code sent to ${email}`}
            {step === 'newPassword' && 'Create a strong new password or skip to enter dashboard'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg font-medium flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" /> {success}
          </div>
        )}

        {/* STEP 1: EMAIL */}
        {step === 'email' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Registered Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 text-slate-400" size={16} />
                <input
                  type="email"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none disabled:opacity-50 shadow-sm"
                  placeholder="ca@firm.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-medium rounded-lg text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> {loadingText}
                </>
              ) : (
                'Send Reset Code'
              )}
            </button>
          </form>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-center">6-Digit Verification Code</label>
              <input
                type="text"
                required
                maxLength={6}
                disabled={loading}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full text-center tracking-[0.5em] text-2xl font-mono py-2.5 bg-white border border-slate-300 rounded-lg text-emerald-700 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none disabled:opacity-50 shadow-sm"
                placeholder="000000"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-medium rounded-lg text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> {loadingText}
                </>
              ) : (
                'Verify Code'
              )}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => setStep('email')}
              className="w-full text-xs text-slate-500 hover:text-slate-800 transition text-center cursor-pointer mt-1"
            >
              ← Change Email
            </button>
          </form>
        )}

        {/* STEP 3: NEW PASSWORD */}
        {step === 'newPassword' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Create New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 text-slate-400" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none disabled:opacity-50 shadow-sm placeholder-slate-400"
                  placeholder="Enter at least 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-medium rounded-lg text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> {loadingText}
                </>
              ) : (
                'Save & Enter Dashboard'
              )}
            </button>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                disabled={loading}
                onClick={handleSkipAndLogin}
                className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 hover:underline transition font-semibold cursor-pointer"
              >
                Skip & Direct Login <ArrowRight size={13} />
              </button>
            </div>
          </form>
        )}

        <div className="text-center mt-6 pt-4 border-t border-slate-100">
          <Link to="/login" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition">
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}