import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { 
  UserCheck, 
  Clock, 
  MessageSquare, 
  Check, 
  X, 
  Mail, 
  Github, 
  Linkedin,
  MapPin,
  GraduationCap
} from 'lucide-react';

import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Connections = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('connections'); // 'connections' or 'requests'
  const [connections, setConnections] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConnectionsData = async () => {
    try {
      setLoading(true);
      const [connRes, reqRes] = await Promise.all([
        API.get('/connections/my-connections'),
        API.get('/connections/my-requests')
      ]);

      if (connRes.data.success) setConnections(connRes.data.connections);
      if (reqRes.data.success) setRequests(reqRes.data.requests);
    } catch (err) {
      toast.error('Failed to load connections datasets.', { theme: 'dark' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectionsData();
  }, []);

  const handleRequestAction = async (requestId, action) => {
    const actionText = action === 'accept' ? 'accept' : 'decline';

    const result = await Swal.fire({
      title: 'Confirm Action',
      text: `Do you wish to ${actionText} this mentorship connection request?`,
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
          toast.success(res.data.message || 'Request updated.', { theme: 'dark' });
          fetchConnectionsData();
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Error updating request.', { theme: 'dark' });
      }
    }
  };

  if (loading) return <LoadingSpinner size="large" />;

  const isMentor = user.role === 'mentor';
  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <div className="flex flex-col gap-8 text-left">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">My Connections</h1>
        <p className="text-gray-400 text-sm mt-1">Manage active connections and pending requests.</p>
      </div>

      {/* Tabs selectors */}
      <div className="flex gap-4 border-b border-white/10 pb-1">
        <button
          onClick={() => setActiveTab('connections')}
          className={`flex items-center gap-2 pb-3.5 text-sm font-semibold border-b-2 transition-all outline-none ${
            activeTab === 'connections'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <UserCheck className="w-4.5 h-4.5" />
          <span>Active Connections ({connections.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 pb-3.5 text-sm font-semibold border-b-2 transition-all outline-none ${
            activeTab === 'requests'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <Clock className="w-4.5 h-4.5" />
          <span>Request Logs ({pendingRequests.length} pending)</span>
        </button>
      </div>

      {/* Active connections Panel */}
      {activeTab === 'connections' ? (
        connections.length === 0 ? (
          <div className="glass-panel rounded-2xl py-16 text-center text-gray-500 border border-white/5">
            <p className="text-sm">No active mentorship connections.</p>
            {!isMentor && (
              <Link to="/mentors" className="text-indigo-400 hover:underline text-xs block mt-2">
                Browse Mentor Directory
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connections.map((conn) => (
              <div key={conn._id} className="glass-card rounded-2xl p-5 flex flex-col justify-between h-56 relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl"></div>
                
                <div>
                  <div className="flex items-center gap-3.5 mb-3.5">
                    {conn.profilePhoto ? (
                      <img
                        src={conn.profilePhoto.startsWith('/uploads/') ? `http://localhost:5000${conn.profilePhoto}` : conn.profilePhoto}
                        alt={conn.name}
                        className="w-12 h-12 rounded-full object-cover border border-white/10"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                        {conn.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="text-left">
                      <h3 className="font-bold text-gray-200">{conn.name}</h3>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 capitalize mt-0.5">
                        <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{conn.department} • Year {conn.year}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-4 text-left">
                    {conn.bio || 'Connected member in Aspira mentorship ecosystem.'}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto">
                  <div className="flex items-center gap-2">
                    {conn.github && (
                      <a href={conn.github} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition">
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                    {conn.linkedin && (
                      <a href={conn.linkedin} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-indigo-400 transition">
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <Link
                    to="/chat"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat Message</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Requests logs Panel */
        requests.length === 0 ? (
          <div className="glass-panel rounded-2xl py-16 text-center text-gray-500 border border-white/5">
            <p className="text-sm">No connection request logs found.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5 max-w-4xl">
            {requests.map((req) => {
              const targetUser = isMentor ? req.studentId : req.mentorId;
              if (!targetUser) return null;

              return (
                <div key={req._id} className="glass-card rounded-xl p-4 flex items-center justify-between flex-wrap gap-4 text-left">
                  <div className="flex items-center gap-3.5">
                    {targetUser.profilePhoto ? (
                      <img
                        src={targetUser.profilePhoto.startsWith('/uploads/') ? `http://localhost:5000${targetUser.profilePhoto}` : targetUser.profilePhoto}
                        alt={targetUser.name}
                        className="w-11 h-11 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                        {targetUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-gray-200">{targetUser.name}</h4>
                      <p className="text-xs text-gray-400 capitalize mt-0.5">
                        {targetUser.department || 'General'} • Year {targetUser.year || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-500 font-semibold self-center">
                      {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Today'}
                    </span>
                    
                    {req.status === 'pending' ? (
                      isMentor ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRequestAction(req._id, 'accept')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1 transition"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => handleRequestAction(req._id, 'reject')}
                            className="bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1 transition"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Decline</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/10 px-2.5 py-1 rounded-lg">
                          Pending Review
                        </span>
                      )
                    ) : req.status === 'accepted' ? (
                      <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 px-2.5 py-1 rounded-lg capitalize">
                        Accepted
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
        )
      )}
    </div>
  );
};

export default Connections;
