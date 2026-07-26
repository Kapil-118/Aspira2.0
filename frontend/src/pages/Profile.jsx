import React, { useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';
import { User, Github, Linkedin, Mail, GraduationCap, FileImage, Save, ArrowLeft } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { getMediaUrl } from '../utils/media';

const Profile = () => {
  const { user, updateProfile } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [fetchingMentorData, setFetchingMentorData] = useState(false);

  // Form values state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [skills, setSkills] = useState(''); // Comma separated for Mentors
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setPushEnabled(!!sub);
        });
      });
    }
  }, []);

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const handlePushToggle = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.warning('Push notifications are not supported in your browser.', { theme: 'dark' });
      return;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      
      if (pushEnabled) {
        // Unsubscribe
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          await API.post('/push/unsubscribe', { endpoint: sub.endpoint });
        }
        setPushEnabled(false);
        toast.info('Push notifications disabled.', { theme: 'dark' });
      } else {
        // Request Permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          toast.error('Notification permission denied.', { theme: 'dark' });
          return;
        }

        // Fetch Public VAPID Key from backend
        const keyRes = await API.get('/push/vapid-public-key');
        if (!keyRes.data.success || !keyRes.data.publicKey) {
          throw new Error('VAPID public key not found on server.');
        }

        const convertedKey = urlBase64ToUint8Array(keyRes.data.publicKey);
        const newSub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey
        });

        // Register on backend
        await API.post('/push/subscribe', { subscription: newSub });
        setPushEnabled(true);
        toast.success('Push notifications enabled successfully!', { theme: 'dark' });
      }
    } catch (err) {
      console.error('Push notification toggle error:', err);
      toast.error(err.message || 'Failed to toggle push notifications.', { theme: 'dark' });
    }
  };

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setDepartment(user.department || '');
      setYear(user.year || '');
      setGithub(user.github || '');
      setLinkedin(user.linkedin || '');
      
      const photo = user.profilePhoto;
      if (photo) {
        setPhotoPreview(getMediaUrl(photo));
      }

      // If user is a mentor, fetch their specific skills tags from the mentor profile DB!
      if (user.role === 'mentor') {
        const fetchMentorProfile = async () => {
          setFetchingMentorData(true);
          try {
            const res = await API.get(`/mentor/${user._id}`);
            if (res.data.success && res.data.mentor) {
              const mentor = res.data.mentor;
              if (mentor.skills) {
                setSkills(mentor.skills.join(', '));
              }
            }
          } catch (err) {
            console.error('Error fetching mentor skills:', err.message);
          } finally {
            setFetchingMentorData(false);
          }
        };
        fetchMentorProfile();
      }
    }
  }, [user]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('bio', bio);
    formData.append('department', department);
    formData.append('year', year);
    formData.append('github', github);
    formData.append('linkedin', linkedin);
    
    if (photoFile) {
      formData.append('profilePhoto', photoFile);
    }
    
    if (user.role === 'mentor') {
      formData.append('skills', skills);
    }

    try {
      const res = await updateProfile(formData);
      if (res.success) {
        toast.success(res.message || 'Profile saved successfully!', { theme: 'dark' });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update profile details.', { theme: 'dark' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 text-left max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Profile Customization</h1>
        <p className="text-gray-400 text-sm mt-1">Manage details, tags, profile picture and social portfolios.</p>
      </div>

      {fetchingMentorData ? (
        <LoadingSpinner size="large" />
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Avatar and file picker columns */}
          <div className="md:col-span-1 flex flex-col gap-6">
            <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col items-center gap-5 text-center">
              <div className="relative group cursor-pointer">
                <img
                  src={photoPreview || 'https://img.icons8.com/color/144/user.png'}
                  alt={name}
                  className="w-32 h-32 rounded-full object-cover border border-white/10 group-hover:border-indigo-500/50 transition"
                />
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <FileImage className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-200">{name || 'Your Name'}</h3>
                <span className="text-[10px] uppercase font-bold text-indigo-400 mt-1 block tracking-wider">{user?.role}</span>
              </div>
            </div>
          </div>

          {/* Form details columns */}
          <div className="md:col-span-2 glass-panel rounded-2xl p-6 md:p-8 border border-white/5 flex flex-col gap-5">
            <h2 className="text-base font-bold text-gray-200 border-b border-white/5 pb-3">Personal details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="glass-input text-xs"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  className="glass-input text-xs opacity-50 cursor-not-allowed"
                  disabled
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  disabled={!!user?.department}
                  className={`glass-input text-xs focus:outline-none ${user?.department ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <option value="">Select Department</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Information and Communication Technology">Information and Communication Technology</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Civil">Civil</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Academic Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="glass-input text-xs cursor-pointer focus:outline-none"
                >
                  <option value="">Select Year</option>
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                  <option value="4">Year 4</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Short Biography</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="glass-input text-xs h-20 resize-none"
                placeholder="Write a brief professional summary..."
              />
            </div>

            {/* Mentor Skills matrix */}
            {user?.role === 'mentor' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Technical Skills (Comma separated)
                </label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="glass-input text-xs"
                  placeholder="e.g. React, Node.js, Express, MongoDB, Docker, Python"
                />
              </div>
            )}

            <h2 className="text-base font-bold text-gray-200 border-b border-white/5 pb-3 mt-4">System Alerts</h2>
            <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5">
              <div>
                <p className="text-xs font-semibold text-gray-200">Push Notifications</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Receive native OS desktop alerts for messages and approvals.</p>
              </div>
              <button
                type="button"
                onClick={handlePushToggle}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center focus:outline-none ${
                  pushEnabled ? 'bg-indigo-600' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`w-4 h-4 bg-white rounded-full transition-transform absolute shadow-md ${
                    pushEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <h2 className="text-base font-bold text-gray-200 border-b border-white/5 pb-3 mt-4">Professional portfolios</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Github className="w-3.5 h-3.5" />
                  <span>GitHub URL</span>
                </label>
                <input
                  type="url"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  className="glass-input text-xs"
                  placeholder="https://github.com/username"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Linkedin className="w-3.5 h-3.5" />
                  <span>LinkedIn URL</span>
                </label>
                <input
                  type="url"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  className="glass-input text-xs"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl text-xs flex items-center justify-center gap-2 self-end mt-4 shadow-md transition disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Profile;
