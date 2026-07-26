import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { 
  Briefcase, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Calendar,
  ExternalLink,
  ChevronRight,
  X,
  FileText,
  DollarSign
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const PlacementTracker = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  
  // Modals & Forms State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  
  // Add Application Form
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');
  const [pkg, setPkg] = useState('');
  const [source, setSource] = useState('Direct');
  const [notes, setNotes] = useState('');
  const [jdLink, setJdLink] = useState('');
  const [referralUsed, setReferralUsed] = useState(false);
  const [referralPerson, setReferralPerson] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Update Status Form
  const [newStatus, setNewStatus] = useState('');
  const [newRound, setNewRound] = useState('');
  const [roundFeedback, setRoundFeedback] = useState('');
  const [roundResult, setRoundResult] = useState('Pending');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Eligibility verification
  const isEligible = ['3', '4', 'Third Year', 'Fourth Year'].includes(user?.year) || user?.role === 'admin';

  const fetchData = async () => {
    if (!isEligible) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [appRes, dashRes] = await Promise.all([
        API.get(`/placement/all?search=${search}&status=${statusFilter}`),
        API.get('/placement/dashboard')
      ]);
      if (appRes.data.success) setApplications(appRes.data.applications);
      if (dashRes.data.success) setDashboardData(dashRes.data);
    } catch (err) {
      console.error('Fetch placement error:', err);
      toast.error('Could not load placement tracker data.', { theme: 'dark' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, statusFilter]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!companyName || !role || !pkg) {
      return toast.error('Please enter Company, Role, and Package.', { theme: 'dark' });
    }

    setSubmitting(true);
    try {
      const res = await API.post('/placement/create', {
        companyName,
        role,
        package: pkg,
        applicationSource: source,
        notes,
        jobDescriptionLink: jdLink,
        referralUsed,
        referralPerson
      });
      if (res.data.success) {
        toast.success(res.data.message, { theme: 'dark' });
        setShowAddModal(false);
        // Clear inputs
        setCompanyName('');
        setRole('');
        setPkg('');
        setNotes('');
        setJdLink('');
        setReferralUsed(false);
        setReferralPerson('');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving application.', { theme: 'dark' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!newStatus) return toast.error('Please select a status.', { theme: 'dark' });

    setUpdatingStatus(true);
    try {
      const timelineEntry = newRound ? {
        round: newRound,
        feedback: roundFeedback,
        result: roundResult,
        date: new Date()
      } : null;

      const res = await API.put(`/placement/update/${selectedApp._id}`, {
        status: newStatus,
        currentRound: newRound || selectedApp.currentRound,
        timelineEntry
      });

      if (res.data.success) {
        toast.success(res.data.message, { theme: 'dark' });
        setSelectedApp(res.data.application);
        // Reset inputs
        setNewRound('');
        setRoundFeedback('');
        setRoundResult('Pending');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating status.', { theme: 'dark' });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteApp = async (appId) => {
    const result = await Swal.fire({
      title: 'Remove Log?',
      text: 'Are you sure you want to delete this placement log?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#1F2937',
      confirmButtonText: 'Yes, Delete',
      background: '#151D30',
      color: '#F3F4F6'
    });

    if (result.isConfirmed) {
      try {
        const res = await API.delete(`/placement/delete/${appId}`);
        if (res.data.success) {
          toast.success(res.data.message, { theme: 'dark' });
          setShowDetailsModal(false);
          fetchData();
        }
      } catch (err) {
        toast.error('Error removing log.', { theme: 'dark' });
      }
    }
  };

  if (loading) return <LoadingSpinner size="large" />;

  if (!isEligible) {
    return (
      <div className="min-h-[70vh] flex flex-col justify-center items-center text-center p-6">
        <AlertTriangle className="w-16 h-16 text-indigo-500/30 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-gray-200">Restricted Section</h2>
        <p className="text-gray-400 text-sm mt-2 max-w-sm">
          Placement Tracker becomes available from Third Year onwards.
        </p>
        <Link to="/dashboard" className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-md">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const stats = dashboardData?.stats || { totalApplications: 0, oaCleared: 0, interviewsCleared: 0, offersReceived: 0, rejections: 0, successRate: 0 };
  const insights = dashboardData?.insights || { highestPackage: 0, averagePackage: 0, mostAppliedCompanies: [], interviewConversionRatio: 0 };
  const charts = dashboardData?.charts || { monthlyTrends: [], statusBreakdown: [] };

  return (
    <div className="flex flex-col gap-8 text-left">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl"></div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            Placement <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Tracker</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1.5 leading-relaxed max-w-xl">
            Monitor application submissions, prepare timelines for OAs/Interviews, and analyze insights.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-glow flex items-center gap-2 focus:outline-none"
        >
          <Plus className="w-4 h-4" />
          <span>Add Application</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card rounded-2xl p-6 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total Applied</span>
            <span className="text-2xl font-extrabold text-white">{stats.totalApplications}</span>
          </div>
          <div className="bg-indigo-500/15 text-indigo-400 p-3 rounded-xl">
            <Briefcase className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">OA Completed</span>
            <span className="text-2xl font-extrabold text-indigo-300">{stats.oaCleared}</span>
          </div>
          <div className="bg-purple-500/15 text-purple-400 p-3 rounded-xl">
            <CheckCircle className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Offers Received</span>
            <span className="text-2xl font-extrabold text-emerald-400">{stats.offersReceived}</span>
          </div>
          <div className="bg-emerald-500/15 text-emerald-400 p-3 rounded-xl">
            <TrendingUp className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Success Rate</span>
            <span className="text-2xl font-extrabold text-amber-400">{stats.successRate}%</span>
          </div>
          <div className="bg-amber-500/15 text-amber-400 p-3 rounded-xl">
            <Clock className="w-5.5 h-5.5" />
          </div>
        </div>
      </div>

      {/* Analytics & Company Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Neon SVG Trends Line Chart & Distribution */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-white/5 flex flex-col gap-6">
          <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Application Analytics Trends</h2>
          
          <div className="h-48 w-full relative border-b border-l border-white/10 flex items-end justify-between px-6 pt-4">
            {/* Custom SVG Line Graph */}
            <svg className="absolute inset-0 h-full w-full p-4 overflow-visible" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="neonGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {charts.monthlyTrends.length > 1 && (
                <>
                  <path
                    d={charts.monthlyTrends.reduce((acc, point, idx) => {
                      const x = (idx / (charts.monthlyTrends.length - 1)) * 100 + '%';
                      const maxVal = Math.max(...charts.monthlyTrends.map(p => p.count), 5);
                      const y = 100 - (point.count / maxVal) * 80 + '%';
                      return acc + `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }, '')}
                    fill="none"
                    stroke="#818CF8"
                    strokeWidth="3.5"
                    className="drop-shadow-[0_0_8px_rgba(129,140,248,0.7)]"
                  />
                  {/* Area fill under path */}
                  <path
                    d={charts.monthlyTrends.reduce((acc, point, idx) => {
                      const x = (idx / (charts.monthlyTrends.length - 1)) * 100 + '%';
                      const maxVal = Math.max(...charts.monthlyTrends.map(p => p.count), 5);
                      const y = 100 - (point.count / maxVal) * 80 + '%';
                      return acc + `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }, '') + ` L 100% 100% L 0% 100% Z`}
                    fill="url(#neonGlow)"
                  />
                </>
              )}
            </svg>
            
            {charts.monthlyTrends.map((point, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1.5 z-10">
                <span className="text-[9px] text-indigo-400 font-bold bg-[#151D30] px-1 py-0.5 rounded border border-white/5">{point.count}</span>
                <span className="text-[10px] text-gray-500 font-medium">{point.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Company Package Insights */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col gap-6 text-left">
          <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Salary & Conversion Matrix</h2>
          
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase">Highest CTC Offered</p>
                <p className="text-xl font-black text-emerald-400 mt-1">{insights.highestPackage} LPA</p>
              </div>
              <DollarSign className="w-8 h-8 text-emerald-500/20" />
            </div>

            <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase">Average CTC</p>
                <p className="text-xl font-black text-indigo-300 mt-1">{insights.averagePackage} LPA</p>
              </div>
              <TrendingUp className="w-8 h-8 text-indigo-500/20" />
            </div>

            {/* Most Applied list */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Most Applied Targets</p>
              {insights.mostAppliedCompanies.length === 0 ? (
                <p className="text-xs text-gray-500 py-2">No target details cataloged.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {insights.mostAppliedCompanies.map((c, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-gray-300 font-medium">{c.company}</span>
                      <span className="bg-indigo-600/20 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold text-[10px]">
                        {c.count} applications
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Application Lists */}
      <div className="glass-panel rounded-3xl p-6 border border-white/5 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company or role..."
              className="w-full glass-input text-xs pl-10"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="glass-input text-xs cursor-pointer focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="Applied">Applied</option>
              <option value="OA Scheduled">OA Scheduled</option>
              <option value="OA Completed">OA Completed</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Technical Interview 1">Tech Interview 1</option>
              <option value="Technical Interview 2">Tech Interview 2</option>
              <option value="HR Round">HR Round</option>
              <option value="Offer Received">Offer Received</option>
              <option value="Rejected">Rejected</option>
              <option value="Withdrawn">Withdrawn</option>
            </select>
          </div>
        </div>

        {/* Application List Table */}
        {applications.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-xs">
            No applications found matching search parameters.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {applications.map((app) => (
              <button
                key={app._id}
                onClick={() => {
                  setSelectedApp(app);
                  setNewStatus(app.status);
                  setShowDetailsModal(true);
                }}
                className="w-full bg-darkCard/30 hover:bg-darkCard/50 border border-white/5 hover:border-white/10 p-4 rounded-2xl flex items-center justify-between text-left transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-500/10 text-indigo-400 p-3 rounded-xl flex-shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{app.companyName}</h3>
                    <p className="text-xs text-gray-400 mt-1">{app.role} • {app.package} LPA</p>
                  </div>
                </div>

                <div className="flex items-center gap-3.5">
                  <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wide ${
                    app.status === 'Offer Received' ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/20' :
                    app.status === 'Rejected' ? 'bg-red-600/20 text-red-300 border border-red-500/20' :
                    app.status === 'Withdrawn' ? 'bg-gray-600/20 text-gray-300 border border-gray-500/20' :
                    'bg-indigo-600/20 text-indigo-300 border border-indigo-500/20'
                  }`}>
                    {app.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Add Application Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 md:p-8 border border-white/10 relative overflow-hidden flex flex-col gap-6 text-left shadow-2xl">
            <button 
              type="button" 
              onClick={() => setShowAddModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white p-2"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-xl font-extrabold text-white">Log Placement Application</h2>
              <p className="text-gray-400 text-xs mt-1">Catalog application steps and track interviews.</p>
            </div>

            <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Google"
                    className="glass-input text-xs"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Role</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="glass-input text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Package (LPA)</label>
                  <input
                    type="number"
                    value={pkg}
                    onChange={(e) => setPkg(e.target.value)}
                    placeholder="e.g. 15"
                    className="glass-input text-xs"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Source</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="glass-input text-xs cursor-pointer focus:outline-none"
                  >
                    <option value="Direct">Direct Career Page</option>
                    <option value="On-Campus">On-Campus Placement</option>
                    <option value="Referral">LinkedIn Referral</option>
                    <option value="Indeed/LinkedIn">Indeed/LinkedIn Jobs</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Job Description Link (Optional)</label>
                <input
                  type="url"
                  value={jdLink}
                  onChange={(e) => setJdLink(e.target.value)}
                  placeholder="https://..."
                  className="glass-input text-xs"
                />
              </div>

              <div className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  id="refCheck"
                  checked={referralUsed}
                  onChange={(e) => setReferralUsed(e.target.checked)}
                  className="rounded border-white/10 bg-darkCard/50 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="refCheck" className="text-xs text-gray-300 cursor-pointer">I used a referral for this application</label>
              </div>

              {referralUsed && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Referral Contact Person</label>
                  <input
                    type="text"
                    value={referralPerson}
                    onChange={(e) => setReferralPerson(e.target.value)}
                    placeholder="e.g. Jane Doe (Alumni / Senior)"
                    className="glass-input text-xs"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Short Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Insert notes about syllabus, required languages..."
                  rows="3"
                  className="glass-input text-xs resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transform hover:translate-y-[-1px] transition-all disabled:opacity-50 mt-2"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <span>Add Log Entry</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Details & Timeline Modal */}
      {showDetailsModal && selectedApp && (
        <div className="fixed inset-0 bg-black/85 z-40 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 md:p-8 border border-white/10 relative flex flex-col gap-6 text-left shadow-2xl my-8">
            <button 
              type="button" 
              onClick={() => setShowDetailsModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white p-2"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex justify-between items-start flex-wrap gap-4 border-b border-white/5 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-white">{selectedApp.companyName}</h2>
                <p className="text-xs text-gray-400 mt-1">{selectedApp.role} • {selectedApp.package} LPA</p>
                <p className="text-[10px] text-indigo-400 mt-1 font-semibold">{selectedApp.applicationSource} Application</p>
              </div>

              <button
                type="button"
                onClick={() => handleDeleteApp(selectedApp._id)}
                className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1 focus:outline-none"
              >
                <span>Delete Log</span>
              </button>
            </div>

            {/* Grid display details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Timeline list */}
              <div className="flex flex-col gap-4 text-left">
                <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Application Timeline History</h3>
                
                {selectedApp.timeline.length === 0 ? (
                  <p className="text-xs text-gray-500">No logs created.</p>
                ) : (
                  <div className="flex flex-col pl-4 border-l-2 border-indigo-600/30 gap-6 relative">
                    {selectedApp.timeline.map((entry, idx) => (
                      <div key={idx} className="relative pl-6 text-xs text-left">
                        <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border border-darkBg z-10 shadow-glow" />
                        <h4 className="font-bold text-gray-200">{entry.round}</h4>
                        <p className="text-[9px] text-gray-500 mt-0.5">{new Date(entry.date).toLocaleDateString()}</p>
                        {entry.feedback && <p className="text-gray-400 mt-1 leading-relaxed text-[11px]">{entry.feedback}</p>}
                        {entry.result && (
                          <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded font-semibold mt-1.5 ${
                            entry.result === 'Passed' ? 'bg-emerald-500/10 text-emerald-400' :
                            entry.result === 'Failed' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            Result: {entry.result}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Update Form */}
              <div className="flex flex-col gap-5 text-left border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-8">
                <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Promote Status & Log Next Round</h3>
                
                <form onSubmit={handleStatusUpdate} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Select New Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="glass-input text-xs cursor-pointer focus:outline-none"
                    >
                      <option value="Applied">Applied</option>
                      <option value="OA Scheduled">OA Scheduled</option>
                      <option value="OA Completed">OA Completed</option>
                      <option value="Shortlisted">Shortlisted</option>
                      <option value="Technical Interview 1">Technical Interview 1</option>
                      <option value="Technical Interview 2">Technical Interview 2</option>
                      <option value="Managerial Round">Managerial Round</option>
                      <option value="HR Round">HR Round</option>
                      <option value="Offer Received">Offer Received</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Withdrawn">Withdrawn</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5 border-t border-white/5 pt-4">
                    <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Add Timeline Entry (Optional)</label>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Round Name</label>
                      <input
                        type="text"
                        value={newRound}
                        onChange={(e) => setNewRound(e.target.value)}
                        placeholder="e.g. Technical Interview 1"
                        className="glass-input text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Result</label>
                      <select
                        value={roundResult}
                        onChange={(e) => setRoundResult(e.target.value)}
                        className="glass-input text-xs cursor-pointer focus:outline-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Passed">Passed</option>
                        <option value="Failed">Failed</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Round Feedback/Notes</label>
                    <textarea
                      value={roundFeedback}
                      onChange={(e) => setRoundFeedback(e.target.value)}
                      placeholder="e.g. Coded solutions for 2 coding graphs puzzles..."
                      rows="2"
                      className="glass-input text-xs resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={updatingStatus}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50 mt-2 text-xs focus:outline-none"
                  >
                    {updatingStatus ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <span>Update Applications logs</span>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementTracker;
