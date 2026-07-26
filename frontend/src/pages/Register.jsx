import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { User, Mail, Lock, UserPlus, ArrowLeft, ArrowRight, ShieldAlert } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const { register, verifyOTP } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Registration form values
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');

  // Multi-step panels state
  const [step, setStep] = useState(1); // 1 = Registration details, 2 = OTP Verification
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If redirected with verification request
    if (searchParams.get('verify') === 'true' && searchParams.get('email')) {
      setEmail(decodeURIComponent(searchParams.get('email')));
      setStep(2);
    }
  }, [searchParams]);

  // Handle register details submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      return toast.error('Please fill in all details', { theme: 'dark' });
    }

    setLoading(true);
    try {
      const res = await register(name, email, password, role);
      if (res.success) {
        toast.success(res.message || 'OTP verification code sent to your email.', { theme: 'dark' });
        setStep(2);
      }
    } catch (err) {
      toast.error(err.message || 'Registration failed. Try again.', { theme: 'dark' });
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP activation submit
  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    if (!otpCode) {
      return toast.error('Please enter the verification OTP.', { theme: 'dark' });
    }

    setLoading(true);
    try {
      const res = await verifyOTP(email, otpCode);
      if (res.success) {
        toast.success('Account verified and logged in successfully!', { theme: 'dark' });
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'OTP verification failed. Check code or expiry.', { theme: 'dark' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-gray-100 flex flex-col justify-center items-center px-4 relative">
      <div className="absolute top-[20%] right-[20%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-indigo-400 transition mb-8">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <div className="glass-panel rounded-3xl p-8 shadow-glass border border-white/10 relative overflow-hidden">
          {step === 1 ? (
            <>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Create Account
                </h2>
                <p className="text-gray-400 text-sm mt-2">Join Aspira mentorship network</p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4 text-left">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                      <User className="w-5 h-5" />
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full glass-input !pl-11 text-sm"
                      placeholder="Jane Doe"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
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
                      placeholder="jane.doe@student.edu"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                      <Lock className="w-5 h-5" />
                    </span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full glass-input !pl-11 text-sm"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>


                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transform hover:translate-y-[-1px] transition-all disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Next Step</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center text-xs text-gray-500 border-t border-white/5 pt-6">
                <span>Already have an account? </span>
                <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition">
                  Sign In
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="bg-indigo-500/10 text-indigo-400 p-3 rounded-full w-fit mx-auto mb-4 border border-indigo-500/20">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-extrabold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Verify Email
                </h2>
                <p className="text-gray-400 text-sm mt-2">Enter the verification code sent to {email}</p>
              </div>

              <form onSubmit={handleOTPSubmit} className="flex flex-col gap-6 text-left">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">
                    6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                    className="w-full glass-input text-center text-2xl font-bold tracking-widest py-3"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transform hover:translate-y-[-1px] transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Verify & Register</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-center text-xs text-gray-500 hover:text-indigo-400 transition py-1"
                >
                  Change details / Restart
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
