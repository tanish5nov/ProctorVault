const Subject = require('../models/Subject');
const Question = require('../models/Question');

exports.getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      subjects,
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subjects',
      error: error.message,
    });
  }
};

exports.createSubject = async (req, res) => {
  try {
    const { subjectId, subjectName } = req.body;

    if (!subjectId || !subjectName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide subjectId and subjectName',
      });
    }

    const normalizedSubjectId = subjectId.trim().toUpperCase();
    const normalizedSubjectName = subjectName.trim();

    const existingSubject = await Subject.findOne({
      $or: [
        { subjectId: normalizedSubjectId },
        { subjectName: new RegExp(`^${normalizedSubjectName}$`, 'i') },
      ],
    });

    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: 'Subject with the same ID or name already exists',
      });
    }

    const subject = await Subject.create({
      subjectId: normalizedSubjectId,
      subjectName: normalizedSubjectName,
      createdBy: req.userId,
    });

    const populatedSubject = await subject.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      subject: populatedSubject,
    });
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating subject',
      error: error.message,
    });
  }
};

exports.updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { subjectId, subjectName } = req.body;

    if (!subjectId || !subjectName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide subjectId and subjectName',
      });
    }

    const normalizedSubjectId = subjectId.trim().toUpperCase();
    const normalizedSubjectName = subjectName.trim();

    const duplicateSubject = await Subject.findOne({
      _id: { $ne: id },
      $or: [
        { subjectId: normalizedSubjectId },
        { subjectName: new RegExp(`^${normalizedSubjectName}$`, 'i') },
      ],
    });

    if (duplicateSubject) {
      return res.status(400).json({
        success: false,
        message: 'Another subject with the same ID or name already exists',
      });
    }

    const subject = await Subject.findByIdAndUpdate(
      id,
      {
        subjectId: normalizedSubjectId,
        subjectName: normalizedSubjectName,
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate('createdBy', 'name email');

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Subject updated successfully',
      subject,
    });
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating subject',
      error: error.message,
    });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    const questionExists = await Question.exists({ subject: req.params.id });

    if (questionExists) {
      return res.status(400).json({
        success: false,
        message: 'Subject cannot be deleted because questions are linked to it',
      });
    }

    const subject = await Subject.findByIdAndDelete(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Subject deleted successfully',
    });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting subject',
      error: error.message,
    });
  }
};
