import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { 
  Users, 
  UserCheck, 
  Clock, 
  MessageSquare, 
  AlertCircle, 
  Check, 
  X, 
  ArrowRight,
  TrendingUp,
  MapPin,
  Calendar
} from 'lucide-react';

import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [connections, setConnections] = useState([]);
  const [lfItems, setLfItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [pendingMentors, setPendingMentors] = useState([]);
  const [pendingAlumni, setPendingAlumni] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mentor Application States
  const [mentorAppStatus, setMentorAppStatus] = useState('none');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applySkills, setApplySkills] = useState('');
  const [applyYear, setApplyYear] = useState('');
  const [applyDept, setApplyDept] = useState('');
  const [applyBio, setApplyBio] = useState('');
  const [submittingApp, setSubmittingApp] = useState(false);

  const fetchDashboardData = async () => {
    try {
      if (user?.role === 'admin') {
        const [adminRes, adminAlumniRes, lfRes, eventRes] = await Promise.all([
          API.get('/admin/pending-mentors'),
          API.get('/admin/pending-alumni'),
          API.get('/lostfound/all?limit=3'),
          API.get('/events/all')
        ]);
        if (adminRes.data.success) setPendingMentors(adminRes.data.pending);
        if (adminAlumniRes.data.success) setPendingAlumni(adminAlumniRes.data.pending);
        if (lfRes.data.success) setLfItems(lfRes.data.posts.slice(0, 3));
        if (eventRes.data.success) setEvents(eventRes.data.events.slice(0, 3));
      } else {
        const [reqRes, connRes, lfRes, eventRes] = await Promise.all([
          API.get('/connections/my-requests'),
          API.get('/connections/my-connections'),
          API.get('/lostfound/all?limit=3'),
          API.get('/events/all')
        ]);

        if (reqRes.data.success) setRequests(reqRes.data.requests);
        if (connRes.data.success) setConnections(connRes.data.connections);
        if (lfRes.data.success) setLfItems(lfRes.data.posts.slice(0, 3));
        if (eventRes.data.success) setEvents(eventRes.data.events.slice(0, 3));

        if (user?.role === 'student') {
          try {
            const appRes = await API.get('/mentor/application-status');
            if (appRes.data.success) {
              setMentorAppStatus(appRes.data.status);
            }
          } catch (err) {
            console.error('Error fetching application status:', err);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard content:', err.message);
      toast.error('Could not refresh dashboard data.', { theme: 'dark' });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRejectAlumni = async (alumniId, action) => {
    const actionText = action === 'approve' ? 'approve' : 'reject';
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to ${actionText} this alumni application?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: action === 'approve' ? '#10B981' : '#EF4444',
      cancelButtonColor: '#1F2937',
      confirmButtonText: `Yes, ${actionText}!`,
      background: '#151D30',
      color: '#F3F4F6'
    });

    if (result.isConfirmed) {
      try {
        if (action === 'approve') {
          const res = await API.put(`/admin/approve-alumni/${alumniId}`);
          if (res.data.success) {
            toast.success(res.data.message, { theme: 'dark' });
          }
        } else {
          const res = await API.delete(`/admin/reject-alumni/${alumniId}`);
          if (res.data.success) {
            toast.success(res.data.message, { theme: 'dark' });
          }
        }
        // Refresh list
        const adminRes = await API.get('/admin/pending-alumni');
        if (adminRes.data.success) {
          setPendingAlumni(adminRes.data.pending);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Error processing request.', { theme: 'dark' });
      }
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRequestAction = async (requestId, action) => {
    const actionText = action === 'accept' ? 'accept' : 'decline';
    
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to ${actionText} this connection request?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4F46E5',
      cancelButtonColor: '#1F2937',
      confirmButtonText: `Yes, ${actionText}!`,
      background: '#151D30',
      color: '#F3F4F6'
    });

    if (result.isConfirmed) {
      try {
        const res = await API.put(`/connections/${action}/${requestId}`);
        if (res.data.success) {
          toast.success(res.data.message, { theme: 'dark' });
          fetchDashboardData(); // Refresh list
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Error processing request.', { theme: 'dark' });
      }
    }
  };

  const handleApproveRejectMentor = async (mentorId, action) => {
    const actionText = action === 'approve' ? 'approve' : 'reject';
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to ${actionText} this mentor application?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: action === 'approve' ? '#10B981' : '#EF4444',
      cancelButtonColor: '#1F2937',
      confirmButtonText: `Yes, ${actionText}!`,
      background: '#151D30',
      color: '#F3F4F6'
    });

    if (result.isConfirmed) {
      try {
        if (action === 'approve') {
          const res = await API.put(`/admin/approve-mentor/${mentorId}`);
          if (res.data.success) {
            toast.success(res.data.message, { theme: 'dark' });
          }
        } else {
          const res = await API.delete(`/admin/reject-mentor/${mentorId}`);
          if (res.data.success) {
            toast.success(res.data.message, { theme: 'dark' });
          }
        }
        // Refresh list
        const adminRes = await API.get('/admin/pending-mentors');
        if (adminRes.data.success) {
          setPendingMentors(adminRes.data.pending);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Error processing request.', { theme: 'dark' });
      }
    }
  };

  const handleApplyMentorSubmit = async (e) => {
    e.preventDefault();
    if (!applySkills || !applyYear || !applyDept || !applyBio) {
      return toast.error('Please fill in all proposed mentor application details.', { theme: 'dark' });
    }

    setSubmittingApp(true);
    try {
      const res = await API.post('/mentor/apply', {
        skills: applySkills,
        year: applyYear,
        department: applyDept,
        bio: applyBio
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Mentor application submitted successfully!', { theme: 'dark' });
        setMentorAppStatus('pending');
        setShowApplyModal(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit mentor application.', { theme: 'dark' });
    } finally {
      setSubmittingApp(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="large" />;
  }

  const isMentor = user.role === 'mentor';
  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <div className="flex flex-col gap-8 text-left">
      {/* Welcome Banner */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden border border-white/15">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl"></div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            Welcome back, <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{user.name}</span>!
          </h1>
          <p className="text-gray-400 text-sm mt-1.5 leading-relaxed max-w-xl">
            {user.role === 'admin'
              ? 'Manage mentor profiles, verify and approve campus senior mentors registrations.'
              : (isMentor 
                ? 'Provide campus guidance, accept incoming student mentorship requests, and participate in mock interviews.'
                : 'Browse senior mentor profiles, send connection requests, analyze your resume, and register for workshops.')}
          </p>
        </div>
        {user.role !== 'admin' && (
          <div className="flex items-center gap-3.5 flex-wrap">
            {user.role === 'student' && mentorAppStatus === 'none' && (
              <button
                type="button"
                onClick={() => setShowApplyModal(true)}
                className="bg-emerald-600/20 text-emerald-300 border border-emerald-500/20 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-emerald-600 hover:text-white transition-all shadow-md focus:outline-none"
              >
                Apply as a Mentor
              </button>
            )}

            {user.role === 'student' && mentorAppStatus === 'pending' && (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/25 px-4 py-2 rounded-xl text-xs font-semibold select-none flex items-center gap-1.5 animate-pulse">
                <Clock className="w-3.5 h-3.5" />
                <span>Mentor Request Pending</span>
              </span>
            )}

            <Link 
              to="/profile" 
              className="bg-indigo-600/20 text-indigo-300 border border-indigo-500/20 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-indigo-600 hover:text-white transition-all shadow-md"
            >
              Customize Profile
            </Link>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {user.role === 'admin' ? 'Pending Mentors' : 'Active Connections'}
            </span>
            <span className="text-3xl font-bold text-white">
              {user.role === 'admin' ? pendingMentors.length : connections.length}
            </span>
          </div>
          <div className="bg-indigo-500/10 text-indigo-400 p-3.5 rounded-xl border border-indigo-500/5">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {user.role === 'admin' ? 'System Events' : (isMentor ? 'Incoming Requests' : 'Requests Sent')}
            </span>
            <span className="text-3xl font-bold text-white">
              {user.role === 'admin' ? events.length : requests.length}
            </span>
          </div>
          <div className="bg-purple-500/10 text-purple-400 p-3.5 rounded-xl border border-purple-500/5">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {user.role === 'admin' ? 'Reported belonging items' : 'Pending Action'}
            </span>
            <span className="text-3xl font-bold text-white">
              {user.role === 'admin' ? lfItems.length : pendingRequests.length}
            </span>
          </div>
          <div className="bg-amber-500/10 text-amber-400 p-3.5 rounded-xl border border-amber-500/5">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Requests on Left, Feed/Items on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Double-Column Panel */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {user.role === 'admin' ? (
            <div className="flex flex-col gap-8">
              {/* Admin Pending Mentors Section */}
              <div className="glass-panel rounded-2xl p-6 border border-white/5">
                <h2 className="text-lg font-bold text-gray-200 mb-5 flex items-center gap-2">
                  <span>Pending Mentor Approvals</span>
                  {pendingMentors.length > 0 && (
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {pendingMentors.length} applications
                    </span>
                  )}
                </h2>

                {pendingMentors.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 text-sm">
                    No pending mentor applications to review.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3.5">
                    {pendingMentors.map((mentor) => {
                      const uId = mentor.userId?._id || mentor.userId;
                      const email = mentor.userId?.email || 'N/A';
                      return (
                        <div 
                          key={mentor._id}
                          className="bg-darkBg/50 border border-white/5 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-left"
                        >
                          <div className="flex items-start gap-3.5 flex-1">
                            {mentor.profilePhoto ? (
                              <img
                                src={mentor.profilePhoto.startsWith('/uploads/') ? `http://localhost:5000${mentor.profilePhoto}` : mentor.profilePhoto}
                                alt={mentor.name}
                                className="w-12 h-12 rounded-full object-cover border border-white/10 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                {mentor.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-gray-200">{mentor.name}</h4>
                              <p className="text-[10px] text-gray-500 mt-0.5">{email}</p>
                              <p className="text-[10px] text-indigo-300 font-semibold mt-1">
                                {mentor.department || 'General'} • {mentor.year || 'N/A'}
                              </p>
                              {mentor.skills && mentor.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {mentor.skills.map((skill, sIdx) => (
                                    <span key={sIdx} className="bg-indigo-500/10 text-indigo-400 text-[9px] px-1.5 py-0.5 rounded-md font-medium">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {mentor.bio && (
                                <p className="text-[10px] text-gray-400 mt-2 bg-black/20 p-2 rounded-lg italic border border-white/5 max-w-md">
                                  "{mentor.bio}"
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 md:self-center">
                            <button
                              onClick={() => handleApproveRejectMentor(uId, 'approve')}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleApproveRejectMentor(uId, 'reject')}
                              className="bg-red-600 hover:bg-red-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Admin Pending Alumni Section */}
              <div className="glass-panel rounded-2xl p-6 border border-white/5">
                <h2 className="text-lg font-bold text-gray-200 mb-5 flex items-center gap-2">
                  <span>Pending Alumni Approvals</span>
                  {pendingAlumni.length > 0 && (
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {pendingAlumni.length} applications
                    </span>
                  )}
                </h2>

                {pendingAlumni.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 text-sm">
                    No pending alumni applications to review.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3.5">
                    {pendingAlumni.map((alumni) => {
                      const uId = alumni.userId?._id || alumni.userId;
                      const email = alumni.userId?.email || 'N/A';
                      const name = alumni.userId?.name || 'Alumni Candidate';
                      return (
                        <div 
                          key={alumni._id}
                          className="bg-darkBg/50 border border-white/5 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-left"
                        >
                          <div className="flex items-start gap-3.5 flex-1">
                            <img
                              src={alumni.userId?.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=121824&color=fff`}
                              alt={name}
                              className="w-12 h-12 rounded-full object-cover border border-white/10 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-gray-200">{name}</h4>
                              <p className="text-[10px] text-gray-500 mt-0.5">{email}</p>
                              <p className="text-[10px] text-indigo-300 font-semibold mt-1">
                                {alumni.designation} at {alumni.company} • {alumni.experience} Years Exp
                              </p>
                              {alumni.skills && alumni.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {alumni.skills.map((skill, sIdx) => (
                                    <span key={sIdx} className="bg-indigo-500/10 text-indigo-400 text-[9px] px-1.5 py-0.5 rounded-md font-medium">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {alumni.biography && (
                                <p className="text-[10px] text-gray-400 mt-2 bg-black/20 p-2 rounded-lg italic border border-white/5 max-w-md">
                                  "{alumni.biography}"
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 md:self-center">
                            <button
                              onClick={() => handleApproveRejectAlumni(uId, 'approve')}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleApproveRejectAlumni(uId, 'reject')}
                              className="bg-red-600 hover:bg-red-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Requests Section */}
              <div className="glass-panel rounded-2xl p-6 border border-white/5">
                <h2 className="text-lg font-bold text-gray-200 mb-5 flex items-center gap-2">
                  <span>{isMentor ? 'Incoming Mentorship Requests' : 'Mentorship Request Logs'}</span>
                  {pendingRequests.length > 0 && (
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {pendingRequests.length} pending
                    </span>
                  )}
                </h2>

                {requests.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 text-sm">
                    No mentorship requests logged yet.
                    {!isMentor && (
                      <Link to="/mentors" className="text-indigo-400 hover:underline block mt-2">
                        Browse Mentor Directory
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3.5">
                    {requests.map((req) => {
                      const targetUser = isMentor ? req.studentId : req.mentorId;
                      if (!targetUser) return null;

                      return (
                        <div 
                          key={req._id}
                          className="bg-darkBg/50 border border-white/5 p-4 rounded-xl flex items-center justify-between flex-wrap gap-4"
                        >
                          <div className="flex items-center gap-3">
                            {targetUser.profilePhoto ? (
                              <img
                                src={targetUser.profilePhoto.startsWith('/uploads/') ? `http://localhost:5000${targetUser.profilePhoto}` : targetUser.profilePhoto}
                                alt={targetUser.name}
                                className="w-11 h-11 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-semibold text-sm">
                                {targetUser.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="text-left">
                              <p className="text-sm font-semibold text-gray-200">{targetUser.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5 capitalize">
                                {targetUser.department || 'General'} • Year {targetUser.year || 'N/A'}
                              </p>
                            </div>
                          </div>

                          {/* Request status badges / buttons */}
                          <div className="flex items-center gap-2">
                            {req.status === 'pending' ? (
                              isMentor ? (
                                <>
                                  <button
                                    onClick={() => handleRequestAction(req._id, 'accept')}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg transition"
                                    title="Accept Request"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleRequestAction(req._id, 'reject')}
                                    className="bg-red-650/20 text-red-400 hover:bg-red-600 hover:text-white p-2 rounded-lg transition"
                                    title="Decline Request"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/10 px-2.5 py-1 rounded-lg">
                                  Pending Review
                                </span>
                              )
                            ) : req.status === 'accepted' ? (
                              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 px-2.5 py-1 rounded-lg capitalize">
                                Connected
                              </span>
                            ) : (
                              <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/10 px-2.5 py-1 rounded-lg capitalize">
                                Declined
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Active Connections List */}
              <div className="glass-panel rounded-2xl p-6 border border-white/5">
                <h2 className="text-lg font-bold text-gray-200 mb-5">Connected Members</h2>
                {connections.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No active connections. Accept requests or browse profiles to connect.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {connections.map((conn) => (
                      <div 
                        key={conn._id}
                        className="bg-darkBg/30 border border-white/5 p-4 rounded-xl flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {conn.profilePhoto ? (
                              <img
                                src={conn.profilePhoto.startsWith('/uploads/') ? `http://localhost:5000${conn.profilePhoto}` : conn.profilePhoto}
                                alt={conn.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                                {conn.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-semibold text-gray-200">{conn.name}</p>
                            <p className="text-[10px] text-gray-500 capitalize">{conn.role}</p>
                          </div>
                        </div>
                        <Link
                          to="/chat"
                          className="bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white p-2 rounded-lg transition"
                          title="Send Message"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Single-Column Sidebar Feed (Lost & Found, AI Helper Shortcuts) */}
        <div className="flex flex-col gap-8">
          
          {/* Lost & Found Mini Feed */}
          <div className="glass-panel rounded-2xl p-6 border border-white/5 text-left">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-gray-400">Lost & Found Board</h2>
              <Link to="/lostfound" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5">
                <span>View Board</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {lfItems.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-xs">
                No items reported yet.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {lfItems.map((item) => (
                  <div key={item._id} className="flex gap-3 bg-darkBg/40 border border-white/5 p-2 rounded-xl">
                    <img
                      src={item.image.startsWith('/uploads/') ? `http://localhost:5000${item.image}` : item.image}
                      alt={item.title}
                      className="w-12 h-12 object-cover rounded-lg border border-white/5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-gray-200 truncate">{item.title}</h4>
                        <span className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.25 rounded-md ${
                          item.type === 'lost' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {item.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-1">
                        <MapPin className="w-3 h-3 text-indigo-400" />
                        <span className="truncate">{item.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Services Panel */}
          <div className="glass-panel rounded-2xl p-6 border border-white/5 text-left bg-gradient-to-br from-indigo-950/20 to-purple-950/20">
            <h3 className="font-bold text-white text-sm mb-2">Smart Campus AI Tools</h3>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              Analyze your developer resume formats, search matching skills matrices, or chat with our career assistant.
            </p>
            <div className="flex flex-col gap-2">
              <Link 
                to="/resume" 
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-center py-2.5 px-4 rounded-xl text-xs font-bold shadow-md hover:shadow-indigo-500/20 transition-all"
              >
                Launch Resume Analyzer
              </Link>
              <Link 
                to="/chatbot" 
                className="bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-center py-2.5 px-4 rounded-xl text-xs font-bold transition-all"
              >
                Ask Career AI Chatbot
              </Link>
            </div>
          </div>

          {/* Upcoming Events Panel */}
          <div className="glass-panel rounded-2xl p-6 border border-white/5 text-left">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-gray-200">Scheduled Workshops</h3>
              <Link to="/events" className="text-xs text-indigo-400 hover:underline">All</Link>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-xs">
                No workshops scheduled.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {events.map((ev) => (
                  <div key={ev._id} className="bg-darkBg/40 border border-white/5 p-3 rounded-xl flex items-start gap-3">
                    <div className="bg-indigo-500/10 text-indigo-400 p-2 rounded-lg">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-gray-200 truncate">{ev.title}</h4>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(ev.date).toLocaleDateString()} at {new Date(ev.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Apply as Mentor Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 md:p-8 border border-white/10 relative overflow-hidden flex flex-col gap-6 text-left shadow-2xl">
            <button 
              type="button" 
              onClick={() => setShowApplyModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white p-2"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-2xl font-extrabold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Apply as a Campus Mentor
              </h2>
              <p className="text-gray-400 text-xs mt-1">Submit proposed credentials for administrator review.</p>
            </div>

            <form onSubmit={handleApplyMentorSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Expertise Skills (comma separated)</label>
                <input
                  type="text"
                  value={applySkills}
                  onChange={(e) => setApplySkills(e.target.value)}
                  placeholder="e.g. React, Node.js, Python, Figma"
                  className="glass-input text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Academic Year</label>
                  <select
                    value={applyYear}
                    onChange={(e) => setApplyYear(e.target.value)}
                    className="glass-input text-xs cursor-pointer focus:outline-none"
                    required
                  >
                    <option value="">Select Year</option>
                    <option value="First Year">First Year</option>
                    <option value="Second Year">Second Year</option>
                    <option value="Third Year">Third Year</option>
                    <option value="Fourth Year">Fourth Year</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Department</label>
                  <select
                    value={applyDept}
                    onChange={(e) => setApplyDept(e.target.value)}
                    className="glass-input text-xs cursor-pointer focus:outline-none"
                    required
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
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Short Bio (proposed highlights)</label>
                <textarea
                  value={applyBio}
                  onChange={(e) => setApplyBio(e.target.value)}
                  placeholder="Share a short summary of your background, experience, or what you want to teach..."
                  rows="4"
                  className="glass-input text-xs resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submittingApp}
                className="w-full bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transform hover:translate-y-[-1px] transition-all disabled:opacity-50 mt-2"
              >
                {submittingApp ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <span>Submit Application</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
