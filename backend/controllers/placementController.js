const PlacementApplication = require('../models/placementApplication');

// @desc    Get all placement applications with filters and search
// @route   GET /api/placement/all
// @access  Private
const getApplications = async (req, res) => {
  const studentId = req.user._id;
  const { status, role, company, search } = req.query;

  try {
    let query = { studentId };

    if (status) query.status = status;
    if (role) query.role = new RegExp(role, 'i');
    if (company) query.companyName = new RegExp(company, 'i');
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { companyName: searchRegex },
        { role: searchRegex }
      ];
    }

    const applications = await PlacementApplication.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (error) {
    console.error('Fetch placement applications error:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Create new placement application
// @route   POST /api/placement/create
// @access  Private
const createApplication = async (req, res) => {
  const studentId = req.user._id;
  const { companyName, role, package, applicationSource, notes, jobDescriptionLink, referralUsed, referralPerson } = req.body;

  try {
    if (!companyName || !role || !package) {
      return res.status(400).json({ success: false, message: 'Company Name, Role, and Package are required.' });
    }

    const newApp = await PlacementApplication.create({
      studentId,
      companyName,
      role,
      package: parseFloat(package),
      applicationSource,
      notes,
      jobDescriptionLink,
      referralUsed: !!referralUsed,
      referralPerson,
      status: 'Applied',
      timeline: [{
        round: 'Applied',
        date: new Date(),
        feedback: 'Applied to the position.',
        result: 'Pending'
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Placement Application added successfully!',
      application: newApp
    });
  } catch (error) {
    console.error('Create placement application error:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Update placement application and timeline logs
// @route   PUT /api/placement/update/:id
// @access  Private
const updateApplication = async (req, res) => {
  const { id } = req.params;
  const { status, currentRound, notes, interviewDate, result, timelineEntry } = req.body;

  try {
    const app = await PlacementApplication.findOne({ _id: id, studentId: req.user._id });
    if (!app) {
      return res.status(404).json({ success: false, message: 'Placement application not found.' });
    }

    if (status) app.status = status;
    if (currentRound) app.currentRound = currentRound;
    if (notes !== undefined) app.notes = notes;
    if (interviewDate) app.interviewDate = interviewDate;
    if (result) app.result = result;

    // Push entry to timeline array if provided
    if (timelineEntry && timelineEntry.round) {
      app.timeline.push({
        round: timelineEntry.round,
        date: timelineEntry.date || new Date(),
        feedback: timelineEntry.feedback || '',
        result: timelineEntry.result || 'Pending'
      });
    }

    await app.save();

    res.status(200).json({
      success: true,
      message: 'Placement Application updated successfully!',
      application: app
    });
  } catch (error) {
    console.error('Update placement application error:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Delete placement application
// @route   DELETE /api/placement/delete/:id
// @access  Private
const deleteApplication = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await PlacementApplication.findOneAndDelete({ _id: id, studentId: req.user._id });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Placement application not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Placement Application removed successfully!'
    });
  } catch (error) {
    console.error('Delete placement application error:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Fetch placement dashboard aggregates, monthly trends, and charts analytics
// @route   GET /api/placement/dashboard
// @access  Private
const getDashboardData = async (req, res) => {
  const studentId = req.user._id;

  try {
    const applications = await PlacementApplication.find({ studentId });

    const totalApplications = applications.length;

    // OA Cleared counts (timeline contains 'OA Completed' with result 'Passed' or status moved past OA)
    const oaCleared = applications.filter(app => {
      const hasPassedOA = app.timeline.some(t => t.round === 'OA Completed' && t.result === 'Passed');
      const isPastOA = ['Shortlisted', 'Technical Interview 1', 'Technical Interview 2', 'Managerial Round', 'HR Round', 'Offer Received'].includes(app.status);
      return hasPassedOA || isPastOA;
    }).length;

    // Interviews Cleared counts
    const interviewsCleared = applications.filter(app => {
      const clearedRound = app.timeline.some(t => t.round.startsWith('Technical') && t.result === 'Passed');
      const isOffer = app.status === 'Offer Received';
      return clearedRound || isOffer;
    }).length;

    const offersReceived = applications.filter(app => app.status === 'Offer Received').length;
    const rejections = applications.filter(app => app.status === 'Rejected').length;
    const successRate = totalApplications > 0 ? Math.round((offersReceived / totalApplications) * 100) : 0;

    // Company insights analytics
    let highestPackage = 0;
    let sumPackage = 0;
    const companyCounts = {};

    applications.forEach(app => {
      if (app.package > highestPackage) highestPackage = app.package;
      sumPackage += app.package;
      companyCounts[app.companyName] = (companyCounts[app.companyName] || 0) + 1;
    });

    const averagePackage = totalApplications > 0 ? parseFloat((sumPackage / totalApplications).toFixed(2)) : 0;
    
    // Sort companies by applied frequency
    const mostAppliedCompanies = Object.entries(companyCounts)
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Monthly trends mapping
    const monthlyTrends = {};
    applications.forEach(app => {
      const date = new Date(app.createdAt);
      const monthYear = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyTrends[monthYear] = (monthlyTrends[monthYear] || 0) + 1;
    });

    const monthlyTrendsArray = Object.entries(monthlyTrends).map(([month, count]) => ({
      month,
      count
    }));

    // Status breakdown distribution counts
    const statusCounts = {};
    applications.forEach(app => {
      statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
    });

    const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count
    }));

    res.status(200).json({
      success: true,
      stats: {
        totalApplications,
        oaCleared,
        interviewsCleared,
        offersReceived,
        rejections,
        successRate
      },
      insights: {
        highestPackage,
        averagePackage,
        mostAppliedCompanies,
        interviewConversionRatio: totalApplications > 0 ? parseFloat((interviewsCleared / totalApplications).toFixed(2)) : 0
      },
      charts: {
        monthlyTrends: monthlyTrendsArray,
        statusBreakdown
      }
    });
  } catch (error) {
    console.error('Fetch placement dashboard error:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = {
  getApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  getDashboardData
};
