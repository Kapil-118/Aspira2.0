import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Search, SlidersHorizontal, BookOpen, GraduationCap } from 'lucide-react';
import API from '../services/api';
import MentorCard from '../components/MentorCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Mentors = () => {
  const [mentors, setMentors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [skill, setSkill] = useState('');

  const fetchMentorsAndRequests = async () => {
    try {
      setLoading(true);
      // Query parameters
      let params = {};
      if (search) params.search = search;
      if (department) params.department = department;
      if (year) params.year = year;
      if (skill) params.skill = skill;

      const [mentorRes, requestRes] = await Promise.all([
        API.get('/mentor/all', { params }),
        API.get('/connections/my-requests')
      ]);

      if (mentorRes.data.success) {
        setMentors(mentorRes.data.mentors);
      }
      if (requestRes.data.success) {
        setRequests(requestRes.data.requests);
      }
    } catch (err) {
      console.error('Error fetching directory data:', err.message);
      toast.error('Failed to load mentor directory listings.', { theme: 'dark' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentorsAndRequests();
  }, [department, year]); // Automatically trigger fetch on category selection change

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMentorsAndRequests();
  };

  const handleConnect = async (mentorUserId) => {
    try {
      const res = await API.post(`/connections/send/${mentorUserId}`);
      if (res.data.success) {
        toast.success(res.data.message || 'Request sent successfully!', { theme: 'dark' });
        // Refresh connection request state list
        const requestRes = await API.get('/connections/my-requests');
        if (requestRes.data.success) {
          setRequests(requestRes.data.requests);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit connection request.', { theme: 'dark' });
    }
  };

  const getConnectionStatus = (mentorUserId) => {
    if (!mentorUserId) return null;
    // Find matching connection request logs
    const match = requests.find(
      r => (r.mentorId?._id || r.mentorId) === mentorUserId || 
           (r.studentId?._id || r.studentId) === mentorUserId
    );
    return match ? match.status : null;
  };

  return (
    <div className="flex flex-col gap-8 text-left">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Mentor Directory</h1>
        <p className="text-gray-400 text-sm mt-1">Browse, filter, and connect with experienced student mentors.</p>
      </div>

      {/* Filter and Search Panel */}
      <form onSubmit={handleSearchSubmit} className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Main Search Input */}
          <div className="relative flex-1 w-full">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full glass-input !pl-11 text-sm py-2.5"
              placeholder="Search mentors by name, tech skills, or department..."
            />
          </div>
          <div className="flex gap-2.5 w-full md:w-auto">
            {/* Skill Filter Input */}
            <input
              type="text"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              className="glass-input text-sm flex-1 md:w-40 py-2.5"
              placeholder="Skill (e.g. React)"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all shadow-md"
            >
              Search
            </button>
          </div>
        </div>

        {/* Dropdowns Row */}
        <div className="flex flex-wrap gap-4 items-center border-t border-white/5 pt-4">
          <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold uppercase tracking-wider">
            <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
            <span>Category Filters</span>
          </div>

          <div className="flex flex-1 flex-wrap gap-3.5">
            {/* Department dropdown */}
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="glass-input text-xs py-2 px-3 rounded-lg focus:outline-none cursor-pointer"
            >
              <option value="">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Information and Communication Technology">Information and Communication Technology</option>
              <option value="Electronics">Electronics</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Electrical">Electrical</option>
              <option value="Civil">Civil</option>
            </select>

            {/* Academic Year dropdown */}
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="glass-input text-xs py-2 px-3 rounded-lg focus:outline-none cursor-pointer"
            >
              <option value="">All Academic Years</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
            </select>
          </div>

          {(search || department || year || skill) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setDepartment('');
                setYear('');
                setSkill('');
                // Let state hook trigger fetch
                setTimeout(() => fetchMentorsAndRequests(), 50);
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      </form>

      {/* Directory Grid */}
      {loading ? (
        <LoadingSpinner size="large" />
      ) : mentors.length === 0 ? (
        <div className="glass-panel rounded-2xl py-16 text-center text-gray-500 border border-white/5">
          <BookOpen className="w-10 h-10 text-indigo-500/30 mx-auto mb-3" />
          <p className="text-sm">No matching mentors found in the directory.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentors.map((mentor) => (
            <MentorCard
              key={mentor._id}
              mentor={mentor}
              onConnect={handleConnect}
              connectionStatus={mentor.userId ? getConnectionStatus(mentor.userId._id || mentor.userId) : 'none'}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Mentors;
