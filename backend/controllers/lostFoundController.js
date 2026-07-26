const LostFound = require('../models/lostfound');
const fs = require('fs');
const path = require('path');

// @desc    Create a new Lost/Found item post
// @route   POST /api/lostfound/create
// @access  Private
const createPost = async (req, res) => {
  const { title, description, location, type } = req.body;
  const userId = req.user._id;

  try {
    if (!title || !description || !location || !type) {
      return res.status(400).json({ success: false, message: 'All text fields are required' });
    }

    if (!req.file || !req.file.url) {
      return res.status(400).json({ success: false, message: 'Please upload an item image' });
    }

    const post = await LostFound.create({
      title,
      description,
      location,
      type,
      image: req.file.url, // Filled by handleImageUpload middleware
      userId
    });

    res.status(201).json({
      success: true,
      message: 'Item post created successfully!',
      post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Get all Lost & Found items (support search and filters)
// @route   GET /api/lostfound/all
// @access  Private
const getAllPosts = async (req, res) => {
  const { search, type } = req.query;

  try {
    let query = {};

    if (type && ['lost', 'found'].includes(type)) {
      query.type = type;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex }
      ];
    }

    const posts = await LostFound.find(query)
      .populate('userId', 'name email profilePhoto department year')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: posts.length,
      posts
    });
  } catch (error) {
    console.error('Fetch posts error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Get posts uploaded by the current user
// @route   GET /api/lostfound/my-posts
// @access  Private
const getMyPosts = async (req, res) => {
  const userId = req.user._id;

  try {
    const posts = await LostFound.find({ userId })
      .populate('userId', 'name email profilePhoto')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: posts.length,
      posts
    });
  } catch (error) {
    console.error('Fetch my posts error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Delete post
// @route   DELETE /api/lostfound/delete/:id
// @access  Private
const deletePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    const post = await LostFound.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Verify ownership
    if (post.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'You do not have permission to delete this post' });
    }

    // If local file storage, delete the local file
    if (post.image && post.image.startsWith('/uploads/')) {
      const filepath = path.join(__dirname, '../public', post.image);
      if (fs.existsSync(filepath)) {
        try {
          fs.unlinkSync(filepath);
        } catch (fileErr) {
          console.warn('Could not delete local file:', filepath, fileErr.message);
        }
      }
    }

    await LostFound.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getMyPosts,
  deletePost
};
