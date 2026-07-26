import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Mail, Lock, ArrowLeft, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const ForgotPassword = () => {
  const { forgotPassword, resetPassword } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1 = Request OTP, 2 = Verify and Reset
  const [loading, setLoading] = useState(false);

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      return toast.error('Please enter your registered email address.', { theme: 'dark' });
    }

    setLoading(true);
    try {
      const res = await forgotPassword(email);
      if (res.success) {
        toast.success('Password reset OTP code sent to your email.', { theme: 'dark' });
        setStep(2);
      }
    } catch (err) {
      toast.error(err.message || 'Error sending OTP code.', { theme: 'dark' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) {
      return toast.error('Please fill in all inputs.', { theme: 'dark' });
    }

    setLoading(true);
    try {
      const res = await resetPassword(email, otp, newPassword);
      if (res.success) {
        toast.success('Password has been updated. Please sign in.', { theme: 'dark' });
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to reset password. Verify OTP.', { theme: 'dark' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-gray-100 flex flex-col justify-center items-center px-4 relative">
      <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-indigo-400 transition mb-8">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Login</span>
        </Link>

        <div className="glass-panel rounded-3xl p-8 shadow-glass border border-white/10 relative overflow-hidden">
          {step === 1 ? (
            <>
              <div className="text-center mb-8">
                <div className="bg-indigo-500/10 text-indigo-400 p-3 rounded-full w-fit mx-auto mb-4 border border-indigo-500/20">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-extrabold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Recover Password
                </h2>
                <p className="text-gray-400 text-sm mt-2">Enter your email to receive a verification OTP</p>
              </div>

              <form onSubmit={handleRequestOTP} className="flex flex-col gap-5 text-left">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                      <Mail className="w-5 h-5" />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full glass-input !pl-11 text-sm"
                      placeholder="name@student.edu"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transform hover:translate-y-[-1px] transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Send OTP Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-full w-fit mx-auto mb-4 border border-emerald-500/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-extrabold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Set New Password
                </h2>
                <p className="text-gray-400 text-sm mt-2">Enter the code sent to {email}</p>
              </div>

              <form onSubmit={handleResetPassword} className="flex flex-col gap-4 text-left">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Verification OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full glass-input text-center text-xl font-bold tracking-widest py-2.5"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">New Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                      <Lock className="w-5 h-5" />
                    </span>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full glass-input !pl-11 text-sm"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transform hover:translate-y-[-1px] transition-all disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-center text-xs text-gray-500 hover:text-indigo-400 transition py-1"
                >
                  Restart Request
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
