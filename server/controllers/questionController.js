const mongoose = require('mongoose');
const Question = require('../models/Question');
const Subject = require('../models/Subject');

const normalizeOptions = (options) =>
  Array.isArray(options) ? options.map((option) => String(option).trim()).filter(Boolean) : [];

const validateOptionAnswer = (options, correctAnswer) => {
  if (options.length === 0) {
    return null;
  }

  const validAnswers = options.map((_, index) => String.fromCharCode(65 + index));
  if (!validAnswers.includes(correctAnswer)) {
    return `Correct answer must match one of: ${validAnswers.join(', ')}`;
  }

  return null;
};

exports.getQuestions = async (req, res) => {
  try {
    const query = {};

    if (req.query.subject) {
      if (!mongoose.Types.ObjectId.isValid(req.query.subject)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid subject filter',
        });
      }
      query.subject = req.query.subject;
    }

    const questions = await Question.find(query)
      .populate('subject', 'subjectId subjectName')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      questions,
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching questions',
      error: error.message,
    });
  }
};

exports.createQuestion = async (req, res) => {
  try {
    const { questionId, statement, correctAnswer, subject, options = [] } = req.body;

    if (!questionId || !statement || !correctAnswer || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Please provide questionId, statement, correctAnswer, and subject',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(subject)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subject',
      });
    }

    const subjectExists = await Subject.findById(subject);
    if (!subjectExists) {
      return res.status(404).json({
        success: false,
        message: 'Selected subject not found',
      });
    }

    const normalizedQuestionId = questionId.trim().toUpperCase();
    const normalizedStatement = statement.trim();
    const normalizedCorrectAnswer = correctAnswer.trim().toUpperCase();
    const normalizedOptions = normalizeOptions(options);
    const optionsValidationError = validateOptionAnswer(normalizedOptions, normalizedCorrectAnswer);

    if (optionsValidationError) {
      return res.status(400).json({
        success: false,
        message: optionsValidationError,
      });
    }

    const existingQuestion = await Question.findOne({ questionId: normalizedQuestionId });
    if (existingQuestion) {
      return res.status(400).json({
        success: false,
        message: 'Question with the same ID already exists',
      });
    }

    const question = await Question.create({
      questionId: normalizedQuestionId,
      statement: normalizedStatement,
      options: normalizedOptions,
      correctAnswer: normalizedCorrectAnswer,
      subject,
      createdBy: req.userId,
    });

    const populatedQuestion = await question.populate([
      { path: 'subject', select: 'subjectId subjectName' },
      { path: 'createdBy', select: 'name email' },
    ]);

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      question: populatedQuestion,
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating question',
      error: error.message,
    });
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { questionId, statement, correctAnswer, subject, options = [] } = req.body;

    if (!questionId || !statement || !correctAnswer || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Please provide questionId, statement, correctAnswer, and subject',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(subject)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subject',
      });
    }

    const subjectExists = await Subject.findById(subject);
    if (!subjectExists) {
      return res.status(404).json({
        success: false,
        message: 'Selected subject not found',
      });
    }

    const normalizedQuestionId = questionId.trim().toUpperCase();
    const normalizedStatement = statement.trim();
    const normalizedCorrectAnswer = correctAnswer.trim().toUpperCase();
    const normalizedOptions = normalizeOptions(options);
    const optionsValidationError = validateOptionAnswer(normalizedOptions, normalizedCorrectAnswer);

    if (optionsValidationError) {
      return res.status(400).json({
        success: false,
        message: optionsValidationError,
      });
    }

    const duplicateQuestion = await Question.findOne({
      _id: { $ne: id },
      questionId: normalizedQuestionId,
    });

    if (duplicateQuestion) {
      return res.status(400).json({
        success: false,
        message: 'Another question with the same ID already exists',
      });
    }

    const question = await Question.findByIdAndUpdate(
      id,
      {
        questionId: normalizedQuestionId,
        statement: normalizedStatement,
        options: normalizedOptions,
        correctAnswer: normalizedCorrectAnswer,
        subject,
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate([
      { path: 'subject', select: 'subjectId subjectName' },
      { path: 'createdBy', select: 'name email' },
    ]);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Question updated successfully',
      question,
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating question',
      error: error.message,
    });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const Test = require('../models/Test');
    const TestResult = require('../models/TestResult');

    const questionInTest = await Test.exists({
      'questions.question': req.params.id,
    });

    if (questionInTest) {
      return res.status(400).json({
        success: false,
        message: 'Question cannot be deleted because it is already used in a test',
      });
    }

    const questionInResult = await TestResult.exists({
      'answers.question': req.params.id,
    });

    if (questionInResult) {
      return res.status(400).json({
        success: false,
        message: 'Question cannot be deleted because it exists in submitted test results',
      });
    }

    const question = await Question.findByIdAndDelete(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting question',
      error: error.message,
    });
  }
};
