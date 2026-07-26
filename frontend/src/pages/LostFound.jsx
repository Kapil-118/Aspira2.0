import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { 
  MapPin, 
  Search, 
  Plus, 
  Trash2, 
  SlidersHorizontal,
  Camera,
  Archive,
  X
} from 'lucide-react';

import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { getMediaUrl } from '../utils/media';

const LostFound = () => {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search/Filter states
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'lost', 'found'

  // Modal / Form state values
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('lost');
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      // Query parameters mapping
      let params = {};
      if (search) params.search = search;
      if (filterType !== 'all') params.type = filterType;

      const res = await API.get('/lostfound/all', { params });
      if (res.data.success) {
        setItems(res.data.posts);
      }
    } catch (err) {
      toast.error('Failed to load Lost & Found feed.', { theme: 'dark' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [filterType]); // Fetch on filter tab switch

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchItems();
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!title || !description || !location || !imageFile) {
      return toast.error('All text inputs and an image file are required.', { theme: 'dark' });
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('location', location);
    formData.append('type', type);
    formData.append('image', imageFile);

    try {
      const res = await API.post('/lostfound/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Report posted successfully!', { theme: 'dark' });
        setShowModal(false);
        // Reset form details
        setTitle('');
        setDescription('');
        setLocation('');
        setImageFile(null);
        fetchItems();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error uploading report.', { theme: 'dark' });
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    const result = await Swal.fire({
      title: 'Confirm Delete',
      text: 'Do you want to permanently delete this report post?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#1F2937',
      confirmButtonText: 'Yes, delete it!',
      background: '#151D30',
      color: '#F3F4F6'
    });

    if (result.isConfirmed) {
      try {
        const res = await API.delete(`/lostfound/delete/${postId}`);
        if (res.data.success) {
          toast.success('Post deleted successfully.', { theme: 'dark' });
          fetchItems();
        }
      } catch (err) {
        toast.error('Could not delete post.', { theme: 'dark' });
      }
    }
  };

  const getImageUrl = (img) => {
    return getMediaUrl(img);
  };

  return (
    <div className="flex flex-col gap-8 text-left relative">
      
      {/* Header bar and Add report trigger */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Campus Lost & Found</h1>
          <p className="text-gray-400 text-sm mt-1">Help fellow students recover lost or found belongings.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-5 rounded-xl text-sm flex items-center gap-1.5 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Item Report</span>
        </button>
      </div>

      {/* Filter and Search header */}
      <form onSubmit={handleSearchSubmit} className="glass-panel rounded-2xl p-4 border border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2.5 border-b border-white/5 md:border-b-0 pb-3 md:pb-0 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
              filterType === 'all' 
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' 
                : 'bg-darkBg/30 border-white/5 text-gray-400 hover:border-white/10'
            }`}
          >
            All Reports
          </button>
          <button
            type="button"
            onClick={() => setFilterType('lost')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
              filterType === 'lost' 
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' 
                : 'bg-darkBg/30 border-white/5 text-gray-400 hover:border-white/10'
            }`}
          >
            Lost Items
          </button>
          <button
            type="button"
            onClick={() => setFilterType('found')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
              filterType === 'found' 
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' 
                : 'bg-darkBg/30 border-white/5 text-gray-400 hover:border-white/10'
            }`}
          >
            Found Items
          </button>
        </div>

        {/* Input search */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full glass-input !pl-10 text-xs py-2"
            placeholder="Search keywords or location..."
          />
        </div>
      </form>

      {/* Main listings Grid */}
      {loading ? (
        <LoadingSpinner size="large" />
      ) : items.length === 0 ? (
        <div className="glass-panel rounded-2xl py-20 text-center text-gray-500 border border-white/5">
          <Archive className="w-12 h-12 text-indigo-500/20 mx-auto mb-3" />
          <p className="text-sm">No items matching filters currently listed on the board.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const isOwnPost = item.userId?._id === user._id || item.userId === user._id;
            return (
              <div key={item._id} className="glass-card rounded-2xl p-4 flex flex-col justify-between border border-white/5 group relative">
                
                {/* Category badge tag */}
                <div className="relative h-44 w-full bg-darkBg rounded-xl overflow-hidden mb-4 border border-white/5 flex items-center justify-center">
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all"
                  />
                  <span className={`absolute top-2.5 right-2.5 text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.75 rounded-md shadow-md ${
                    item.type === 'lost' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
                  }`}>
                    {item.type}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-sm text-gray-200 truncate mb-1">{item.title}</h3>
                  <p className="text-[11px] text-gray-400 line-clamp-3 leading-relaxed mb-4 text-left">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-3.5 mt-auto">
                  <div className="flex items-center gap-1 text-[10px] text-gray-500 truncate">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </div>

                  {isOwnPost ? (
                    <button
                      onClick={() => handleDeletePost(item._id)}
                      className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition"
                      title="Delete Report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="text-[10px] text-gray-500 font-semibold italic">
                      Posted by {item.userId?.name || 'User'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Item Report Modal Dialog Sheet */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full rounded-2xl shadow-glass border border-white/10 overflow-hidden transform transition-all">
            <div className="px-6 py-4 bg-darkCard/80 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold text-gray-200">Post Item Report</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="p-6 flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Report Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setType('lost')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition ${
                      type === 'lost'
                        ? 'bg-red-500/10 border-red-500 text-red-400'
                        : 'bg-darkBg/40 border-white/5 text-gray-400 hover:border-white/10'
                    }`}
                  >
                    Lost Item
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('found')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition ${
                      type === 'found'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                        : 'bg-darkBg/40 border-white/5 text-gray-400 hover:border-white/10'
                    }`}
                  >
                    Found Item
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Item Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="glass-input text-xs"
                  placeholder="e.g. Blue leather wallet, Keys set"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Last Seen Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="glass-input text-xs"
                  placeholder="e.g. Block C cafeteria, Library room 2"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Detailed Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="glass-input text-xs h-20 resize-none"
                  placeholder="e.g. Wallet contains student ID card under name Jane, some cash..."
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Item Photo</label>
                <div className="border border-dashed border-white/10 rounded-lg p-4 flex flex-col items-center justify-center gap-2 hover:border-indigo-500/50 cursor-pointer relative bg-darkBg/40">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    required
                  />
                  <Camera className="w-6 h-6 text-gray-500" />
                  <span className="text-[10px] text-gray-400 font-medium">
                    {imageFile ? imageFile.name : 'Upload JPG, JPEG or PNG'}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md mt-4 transition disabled:opacity-50"
              >
                {uploading ? 'Processing file uploads...' : 'Post Item Report'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LostFound;
