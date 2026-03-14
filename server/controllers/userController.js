const User = require('../models/User');

exports.getStudents = async (req, res) => {
  try {
    const students = await User.find({ persona: 'Student' })
      .select('name email persona createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      students,
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.message,
    });
  }
};
