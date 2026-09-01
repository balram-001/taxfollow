import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';
import { Shield, Mail, Lock, Building, KeyRound, Eye, EyeOff, Loader2 } from 'lucide-react';

interface RegisterProps {
  onLogin: () => void;
}

export default function Register({ onLogin }: RegisterProps) {
  const [step, setStep] = useState<'register' | 'otp'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await API.post('/auth/register', { name, email, password });
      setTimeout(() => {
        setLoading(false);
        setStep('otp');
      }, 1000);
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || 'Registration failed.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await API.post('/auth/verify-otp', { email, otp });
      
      setTimeout(() => {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        onLogin();
        navigate('/');
      }, 1300);
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full shadow-sm">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-emerald-50 rounded-2xl text-emerald-600 mb-3 border border-emerald-100">
            {step === 'register' ? <Shield size={30} /> : <KeyRound size={30} />}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {step === 'register' ? 'Register Firm Account' : 'Verify Email Code'}
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            {step === 'register' 
              ? 'Set up practice management for your tax office' 
              : `Enter the 6-digit OTP sent to ${email}`}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
            {error}
          </div>
        )}

        {step === 'register' ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Firm / CA Name</label>
              <div className="relative">
                <Building className="absolute left-3.5 top-3 text-slate-400" size={16} />
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none disabled:opacity-50 shadow-sm placeholder-slate-400"
                  placeholder="Sharma & Associates"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 text-slate-400" size={16} />
                <input
                  type="email"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none disabled:opacity-50 shadow-sm placeholder-slate-400"
                  placeholder="ca@firm.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 text-slate-400" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none disabled:opacity-50 shadow-sm placeholder-slate-400"
                  placeholder="••••••••"
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
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-medium rounded-lg text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Generating OTP...
                </>
              ) : (
                'Send Verification OTP'
              )}
            </button>
          </form>
        ) : (
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
                  <Loader2 className="animate-spin" size={18} /> Verifying & Entering Dashboard...
                </>
              ) : (
                'Verify & Enter Dashboard'
              )}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => setStep('register')}
              className="w-full text-xs text-slate-500 hover:text-slate-800 transition text-center cursor-pointer mt-1"
            >
              ← Change Details
            </button>
          </form>
        )}

        <p className="text-center text-xs text-slate-500 mt-6">
          Already verified?{' '}
          <Link to="/login" className="text-emerald-700 hover:underline font-semibold">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
}