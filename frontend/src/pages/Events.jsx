import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { 
  Calendar, 
  Clock, 
  Link as LinkIcon, 
  Plus, 
  X, 
  Compass, 
  Check, 
  Award,
  Video
} from 'lucide-react';

import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Events = () => {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mentor Create Event Modal States
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [duration, setDuration] = useState('60');
  const [meetingLink, setMeetingLink] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await API.get('/events/all');
      if (res.data.success) {
        setEvents(res.data.events);
      }
    } catch (err) {
      toast.error('Failed to load active events feed.', { theme: 'dark' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!title || !description || !date) {
      return toast.error('Please fill in title, description and date.', { theme: 'dark' });
    }

    setCreating(true);
    try {
      const res = await API.post('/events/create', {
        title,
        description,
        date,
        duration: parseInt(duration),
        meetingLink
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Event created successfully!', { theme: 'dark' });
        setShowModal(false);
        // Reset form
        setTitle('');
        setDescription('');
        setDate('');
        setDuration('60');
        setMeetingLink('');
        fetchEvents();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule event.', { theme: 'dark' });
    } finally {
      setCreating(false);
    }
  };

  const handleRegisterEvent = async (eventId) => {
    const result = await Swal.fire({
      title: 'Join Workshop',
      text: 'Do you want to register as an attendee for this mentorship event?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4F46E5',
      cancelButtonColor: '#1F2937',
      confirmButtonText: 'Yes, register!',
      background: '#151D30',
      color: '#F3F4F6'
    });

    if (result.isConfirmed) {
      try {
        const res = await API.post(`/events/register/${eventId}`);
        if (res.data.success) {
          toast.success(res.data.message || 'Registered successfully!', { theme: 'dark' });
          fetchEvents();
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Registration failed.', { theme: 'dark' });
      }
    }
  };

  const isMentor = user.role === 'mentor';

  return (
    <div className="flex flex-col gap-8 text-left relative">
      
      {/* Header section */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Campus Events & Workshops</h1>
          <p className="text-gray-400 text-sm mt-1">Participate in mock interviews, career guidance, and tech workshops.</p>
        </div>
        {isMentor && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-5 rounded-xl text-sm flex items-center gap-1.5 transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event Workshop</span>
          </button>
        )}
      </div>

      {/* Events feed list */}
      {loading ? (
        <LoadingSpinner size="large" />
      ) : events.length === 0 ? (
        <div className="glass-panel rounded-2xl py-20 text-center text-gray-500 border border-white/5">
          <Calendar className="w-12 h-12 text-indigo-500/20 mx-auto mb-3" />
          <p className="text-sm">No workshops currently scheduled.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((ev) => {
            const hasJoined = ev.attendees.includes(user._id);
            const isOrganizer = ev.mentorId._id === user._id || ev.mentorId === user._id;

            return (
              <div key={ev._id} className="glass-card rounded-2xl p-5 flex flex-col justify-between h-64 border border-white/5 relative group">
                <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl"></div>

                <div>
                  <div className="flex justify-between items-start gap-4 mb-3.5">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold bg-indigo-500/10 text-indigo-300 border border-indigo-500/5 px-2.5 py-1 rounded-md">
                      {ev.duration} mins
                    </span>
                    {hasJoined && (
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Registered</span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-gray-200 group-hover:text-indigo-400 transition-colors truncate">{ev.title}</h3>
                  <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed mt-2 text-left">{ev.description}</p>
                </div>

                <div className="mt-auto border-t border-white/5 pt-3.5 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{new Date(ev.date).toLocaleDateString()} at {new Date(ev.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {isOrganizer ? (
                    ev.meetingLink ? (
                      <a
                        href={ev.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-indigo-600/10 text-indigo-400 border border-indigo-500/10 text-center py-2 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-indigo-600 hover:text-white transition"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Start Meeting</span>
                      </a>
                    ) : (
                      <span className="text-[10px] text-gray-500 text-center italic py-2">Hosted by you</span>
                    )
                  ) : hasJoined ? (
                    ev.meetingLink ? (
                      <a
                        href={ev.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-center py-2 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Join Session Link</span>
                      </a>
                    ) : (
                      <button disabled className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 cursor-not-allowed w-full py-2 rounded-xl text-xs font-semibold">
                        Registered Successfully
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => handleRegisterEvent(ev._id)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-xl text-xs transition shadow-md"
                    >
                      Register Attendee
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mentor Create Event Dialog Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full rounded-2xl shadow-glass border border-white/10 overflow-hidden transform transition-all">
            <div className="px-6 py-4 bg-darkCard/80 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold text-gray-200">Schedule Event Workshop</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-6 flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Workshop Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="glass-input text-xs"
                  placeholder="e.g. Mock Coding Interviews, WebRTC Relays"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Detailed Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="glass-input text-xs h-20 resize-none"
                  placeholder="e.g. Live coding review sessions for mock interviews, database optimization tips..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="glass-input text-xs"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Duration (Mins)</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="glass-input text-xs cursor-pointer focus:outline-none"
                  >
                    <option value="30">30 Mins</option>
                    <option value="60">60 Mins</option>
                    <option value="90">90 Mins</option>
                    <option value="120">120 Mins</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Meeting Room URL (Google Meet / Zoom)</label>
                <input
                  type="url"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  className="glass-input text-xs"
                  placeholder="https://meet.google.com/xyz-abc"
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md mt-4 transition disabled:opacity-50"
              >
                {creating ? 'Scheduling...' : 'Post Workshop Event'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
