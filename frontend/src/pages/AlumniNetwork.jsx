import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { 
  Users, 
  Search, 
  MapPin, 
  Linkedin, 
  Github, 
  Briefcase, 
  FileText, 
  Check, 
  X, 
  Send,
  MessageSquare,
  Award,
  ChevronRight,
  ExternalLink,
  Plus
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { getMediaUrl } from '../utils/media';

const AlumniNetwork = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('directory'); // 'directory', 'requests'
  
  // Lists
  const [directory, setDirectory] = useState([]);
  const [requestsList, setRequestsList] = useState([]);

  // Search/Filters
  const [search, setSearch] = useState('');

  // Modals & Application Form States
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [targetAlumni, setTargetAlumni] = useState(null);
  const [appStatus, setAppStatus] = useState('none'); // 'none', 'pending', 'approved'
  
  // Alumni Registration Fields
  const [company, setCompany] = useState('');
  const [designation, setDesignation] = useState('');
  const [experience, setExperience] = useState('');
  const [location, setLocation] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [skills, setSkills] = useState('');
  const [bio, setBio] = useState('');
  const [ctc, setCtc] = useState('');
  const [submittingApply, setSubmittingApply] = useState(false);

  // Referral Request Fields
  const [resumeLink, setResumeLink] = useState('');
  const [message, setMessage] = useState('');
  const [submittingReferral, setSubmittingReferral] = useState(false);

  const fetchAlumniData = async () => {
    setLoading(true);
    try {
      // Check application status
      const statusRes = await API.get('/alumni/application-status');
      if (statusRes.data.success) {
        setAppStatus(statusRes.data.status);
      }

      // Fetch directory & requests
      const [dirRes, reqRes] = await Promise.all([
        API.get(`/alumni/directory?search=${search}`),
        API.get('/alumni/requests')
      ]);

      if (dirRes.data.success) setDirectory(dirRes.data.directory);
      if (reqRes.data.success) setRequestsList(reqRes.data.requests);
    } catch (err) {
      console.error('Fetch alumni profiles error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlumniData();
  }, [search]);

  const handleRegisterAlumni = async (e) => {
    e.preventDefault();
    if (!company || !designation || !experience || !location) {
      return toast.error('Please enter Company, Designation, Experience, and Location.', { theme: 'dark' });
    }

    setSubmittingApply(true);
    try {
      const res = await API.post('/alumni/apply', {
        company,
        designation,
        experience,
        location,
        linkedin,
        github,
        skills,
        biography: bio,
        currentCTC: ctc
      });

      if (res.data.success) {
        toast.success(res.data.message, { theme: 'dark' });
        setShowApplyModal(false);
        fetchAlumniData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving alumni application.', { theme: 'dark' });
    } finally {
      setSubmittingApply(false);
    }
  };

  const handleSendReferralRequest = async (e) => {
    e.preventDefault();
    if (!resumeLink) {
      return toast.error('Please provide a Google Drive / PDF resume link.', { theme: 'dark' });
    }

    setSubmittingReferral(true);
    try {
      const res = await API.post('/alumni/referral-request', {
        alumniId: targetAlumni.userId._id,
        resumeLink,
        message
      });

      if (res.data.success) {
        toast.success(res.data.message, { theme: 'dark' });
        setShowReferralModal(false);
        setResumeLink('');
        setMessage('');
        fetchAlumniData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error sending request.', { theme: 'dark' });
    } finally {
      setSubmittingReferral(false);
    }
  };

  const handleActionRequest = async (reqId, action) => {
    const titleText = action === 'Approved' ? 'Approve Referral?' : 'Decline Referral?';
    
    const result = await Swal.fire({
      title: titleText,
      text: `Are you sure you want to resolve this referral status to: ${action.toLowerCase()}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: action === 'Approved' ? '#10B981' : '#EF4444',
      cancelButtonColor: '#1F2937',
      confirmButtonText: `Yes, ${action}`,
      background: '#151D30',
      color: '#F3F4F6'
    });

    if (result.isConfirmed) {
      try {
        const res = await API.put(`/alumni/referral-action/${reqId}`, { action });
        if (res.data.success) {
          toast.success(res.data.message, { theme: 'dark' });
          fetchAlumniData();
        }
      } catch (err) {
        toast.error('Error resolving request.', { theme: 'dark' });
      }
    }
  };

  if (loading) return <LoadingSpinner size="large" />;

  const isAlumni = user?.role === 'alumni';

  return (
    <div className="flex flex-col gap-8 text-left">
      {/* Header Panel */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl"></div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            Alumni <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Network</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1.5 leading-relaxed max-w-xl">
            {isAlumni 
              ? 'Review candidate profiles, approve corporate referrals, and guide active juniors.' 
              : 'Connect with senior alumni working in top tech companies for referrals, reviews, and guidance.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Tab Buttons */}
          <div className="flex bg-black/30 border border-white/5 rounded-xl p-1 gap-1">
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'directory' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Users className="w-3.5 h-3.5 inline mr-1.5" />
              Directory
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'requests' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <FileText className="w-3.5 h-3.5 inline mr-1.5" />
              {isAlumni ? 'Incoming Requests' : 'My Requests'}
            </button>
          </div>

          {/* Apply Button for students */}
          {!isAlumni && user?.role === 'student' && appStatus === 'none' && (
            <button
              onClick={() => setShowApplyModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 focus:outline-none"
            >
              <Plus className="w-4 h-4" />
              <span>Apply as Alumni</span>
            </button>
          )}

          {appStatus === 'pending' && (
            <span className="bg-amber-600/20 text-amber-300 border border-amber-500/20 px-3.5 py-2 rounded-xl text-xs font-bold animate-pulse">
              Verification Pending
            </span>
          )}
        </div>
      </div>

      {activeTab === 'directory' && (
        <div className="flex flex-col gap-6">
          {/* Search bar */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by company, role, skills..."
              className="w-full glass-input text-xs pl-10"
            />
          </div>

          {/* Directory Listings */}
          {directory.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-xs">
              No alumni found in the directory.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {directory.map((alumni) => (
                <div key={alumni._id} className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col justify-between gap-4 text-left">
                  <div className="flex gap-4">
                    <img
                      src={alumni.userId?.profilePhoto ? getMediaUrl(alumni.userId.profilePhoto) : `https://ui-avatars.com/api/?name=${encodeURIComponent(alumni.userId?.name || 'Alumni')}&background=121824&color=fff`}
                      alt="Photo"
                      className="w-12 h-12 rounded-full border border-white/10 object-cover flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-white leading-snug truncate">{alumni.userId?.name}</h3>
                      <p className="text-xs text-gray-400 mt-1 leading-snug flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                        <span className="truncate">{alumni.designation} at {alumni.company}</span>
                      </p>
                      <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-indigo-400" />
                        <span>{alumni.location} • {alumni.experience} Years Exp</span>
                      </p>
                    </div>
                  </div>

                  {alumni.biography && (
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {alumni.biography}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    {alumni.skills.map((skill, idx) => (
                      <span key={idx} className="bg-white/5 border border-white/5 text-[9px] px-2 py-0.5 rounded text-gray-400">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
                    <div className="flex gap-3">
                      {alumni.linkedin && (
                        <a href={alumni.linkedin} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition">
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                      {alumni.github && (
                        <a href={alumni.github} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition">
                          <Github className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/chat?userId=${alumni.userId?._id}`)}
                        className="bg-black/40 hover:bg-black/60 border border-white/10 text-gray-300 p-2 rounded-xl text-xs flex items-center gap-1 focus:outline-none transition-colors"
                        title="Chat"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      {!isAlumni && alumni.openForReferral && (
                        <button
                          onClick={() => {
                            setTargetAlumni(alumni);
                            setShowReferralModal(true);
                          }}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3.5 py-1.5 rounded-xl text-[10px] uppercase tracking-wider transition shadow-md focus:outline-none"
                        >
                          Request Referral
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="max-w-3xl mx-auto w-full glass-panel rounded-3xl p-6 border border-white/5 flex flex-col gap-6 text-left">
          <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">
            {isAlumni ? 'Incoming Candidate Request Profiles' : 'My Referral Submissions'}
          </h2>

          {requestsList.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-8">No referral logs created.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {requestsList.map((req) => {
                const targetUser = isAlumni ? req.studentId : req.alumniId;
                if (!targetUser) return null;

                return (
                  <div key={req._id} className="bg-black/20 border border-white/5 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex gap-4">
                      <img
                        src={targetUser.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(targetUser.name || 'User')}&background=121824&color=fff`}
                        alt="Photo"
                        className="w-10 h-10 rounded-full border border-white/10 object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white">{targetUser.name}</h4>
                        {!isAlumni && <p className="text-[10px] text-gray-400 mt-0.5">Alumni Profile</p>}
                        {isAlumni && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {targetUser.department || 'General'} • Year {targetUser.year || 'N/A'}
                          </p>
                        )}
                        {req.message && <p className="text-[10px] text-gray-500 mt-2 bg-black/30 p-2 rounded italic font-medium">{req.message}</p>}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3.5 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                      <a
                        href={req.resumeLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Resume Drive Link</span>
                      </a>

                      <span className={`text-[9px] px-2.5 py-0.5 rounded font-bold uppercase tracking-wider border ${
                        req.status === 'Approved' ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/20' :
                        req.status === 'Rejected' ? 'bg-red-600/20 text-red-300 border-red-500/20' :
                        'bg-amber-600/20 text-amber-300 border-amber-500/20'
                      }`}>
                        {req.status}
                      </span>

                      {isAlumni && req.status === 'Pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleActionRequest(req._id, 'Approved')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-xl text-xs flex items-center justify-center focus:outline-none transition-colors"
                            title="Approve"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleActionRequest(req._id, 'Rejected')}
                            className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-xl text-xs flex items-center justify-center focus:outline-none transition-colors"
                            title="Reject"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => navigate(`/chat?userId=${targetUser._id}`)}
                        className="bg-black/40 hover:bg-black/60 border border-white/10 text-gray-300 p-2 rounded-xl text-xs flex items-center gap-1 focus:outline-none transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Apply as Alumni Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 md:p-8 border border-white/10 relative flex flex-col gap-6 text-left shadow-2xl my-8">
            <button 
              type="button" 
              onClick={() => setShowApplyModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white p-2"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-xl font-extrabold text-white font-bold">Apply as Alumni Profile</h2>
              <p className="text-gray-400 text-xs mt-1">Submit validation details to verify corporate emails and experience.</p>
            </div>

            <form onSubmit={handleRegisterAlumni} className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Company</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Google"
                    className="glass-input text-xs"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Software Engineer-II"
                    className="glass-input text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Exp (Years)</label>
                  <input
                    type="number"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. 3"
                    className="glass-input text-xs"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">CTC (LPA - Optional)</label>
                  <input
                    type="number"
                    value={ctc}
                    onChange={(e) => setCtc(e.target.value)}
                    placeholder="e.g. 24"
                    className="glass-input text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Bangalore"
                    className="glass-input text-xs"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Skills (Comma separated tags)</label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="React, Node.js, System Design, SQL"
                  className="glass-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">LinkedIn URL</label>
                  <input
                    type="url"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className="glass-input text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">GitHub URL</label>
                  <input
                    type="url"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    placeholder="https://github.com/..."
                    className="glass-input text-xs"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Short Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Describe your current tech stack expertise and how you can guide juniors..."
                  rows="3"
                  className="glass-input text-xs resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingApply}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transform hover:translate-y-[-1px] transition-all disabled:opacity-50 mt-2"
              >
                {submittingApply ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <span>Submit Alumni Application</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Request Referral Modal */}
      {showReferralModal && targetAlumni && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-white/10 relative flex flex-col gap-6 text-left shadow-2xl">
            <button 
              type="button" 
              onClick={() => setShowReferralModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white p-2"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-lg font-bold text-white font-bold">Apply for Referral</h2>
              <p className="text-gray-400 text-xs mt-1">Submit request to {targetAlumni.userId?.name} for referral at {targetAlumni.company}.</p>
            </div>

            <form onSubmit={handleSendReferralRequest} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Resume Drive Link (Google Drive / PDF)</label>
                <input
                  type="url"
                  value={resumeLink}
                  onChange={(e) => setResumeLink(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="glass-input text-xs"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Cover Note / Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. Hi Siddharth, I am applying for the SDE intern role (Job ID: 123). I have built MERN projects and would appreciate a referral."
                  rows="3"
                  className="glass-input text-xs resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReferral}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50 mt-2 text-xs focus:outline-none"
              >
                {submittingReferral ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Referral Application</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlumniNetwork;
