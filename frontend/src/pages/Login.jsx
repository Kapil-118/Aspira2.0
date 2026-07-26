import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Mail, Lock, LogIn, ArrowLeft } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('expired')) {
      toast.warning('Your session has expired. Please login again.', { theme: 'dark' });
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error('Please fill in all credentials.', { theme: 'dark' });
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        toast.success('Welcome back to Aspira!', { theme: 'dark' });
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.unverified) {
        toast.info(err.message || 'Verification needed.', { theme: 'dark' });
        // Redirect to register page with OTP panel trigger, or map local state
        navigate(`/register?verify=true&email=${encodeURIComponent(email)}`);
      } else {
        toast.error(err.message || 'Login failed. Please verify credentials.', { theme: 'dark' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-gray-100 flex flex-col justify-center items-center px-4 relative">
      {/* Background decoration */}
      <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-indigo-400 transition mb-8">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <div className="glass-panel rounded-3xl p-8 shadow-glass border border-white/10 relative overflow-hidden">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Access Account
            </h2>
            <p className="text-gray-400 text-sm mt-2">Connect to your campus dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2 text-left">
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
                  placeholder="your.name@student.edu"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 text-left">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
                <Link to="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition">
                  Forgot Password?
                </Link>
              </div>
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
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transform hover:translate-y-[-1px] transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-gray-500 border-t border-white/5 pt-6">
            <span>New to Aspira? </span>
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition">
              Create an Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
