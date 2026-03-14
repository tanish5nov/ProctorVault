const mongoose = require('mongoose');
const Test = require('../models/Test');
const Question = require('../models/Question');
const User = require('../models/User');
const TestResult = require('../models/TestResult');

const buildTestPayload = async ({ testId, testName, startTime, endTime, questions, assignedStudents }) => {
  if (!testId || !testName || !startTime || !endTime) {
    return { error: 'Please provide testId, testName, startTime, and endTime' };
  }

  const normalizedTestId = testId.trim().toUpperCase();
  const normalizedTestName = testName.trim();
  const parsedStartTime = new Date(startTime);
  const parsedEndTime = new Date(endTime);

  if (Number.isNaN(parsedStartTime.getTime()) || Number.isNaN(parsedEndTime.getTime())) {
    return { error: 'Please provide valid startTime and endTime values' };
  }

  if (parsedStartTime >= parsedEndTime) {
    return { error: 'End time must be later than start time' };
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return { error: 'Please select at least one question for the test' };
  }

  if (!Array.isArray(assignedStudents) || assignedStudents.length === 0) {
    return { error: 'Please assign at least one student to the test' };
  }

  const normalizedQuestions = [];
  const seenQuestionIds = new Set();

  for (const entry of questions) {
    const questionId = entry?.question;
    const assignedMarks = Number(entry?.assignedMarks);

    if (!questionId || !mongoose.Types.ObjectId.isValid(questionId)) {
      return { error: 'Each selected question must have a valid question ID' };
    }

    if (seenQuestionIds.has(questionId)) {
      return { error: 'The same question cannot be added more than once to a test' };
    }

    if (!Number.isFinite(assignedMarks) || assignedMarks <= 0) {
      return { error: 'Assigned marks must be a positive number for every question' };
    }

    seenQuestionIds.add(questionId);
    normalizedQuestions.push({
      question: questionId,
      assignedMarks,
    });
  }

  const normalizedStudentIds = [...new Set(assignedStudents)];
  for (const studentId of normalizedStudentIds) {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return { error: 'Each assigned student must have a valid student ID' };
    }
  }

  const existingQuestions = await Question.find({
    _id: { $in: normalizedQuestions.map((entry) => entry.question) },
  }).select('_id');

  if (existingQuestions.length !== normalizedQuestions.length) {
    return { error: 'One or more selected questions no longer exist' };
  }

  const students = await User.find({
    _id: { $in: normalizedStudentIds },
    persona: 'Student',
  }).select('_id');

  if (students.length !== normalizedStudentIds.length) {
    return { error: 'One or more assigned users are not valid students' };
  }

  return {
    payload: {
      testId: normalizedTestId,
      testName: normalizedTestName,
      startTime: parsedStartTime,
      endTime: parsedEndTime,
      questions: normalizedQuestions,
      assignedStudents: normalizedStudentIds,
    },
  };
};

const populateTestQuery = (query) =>
  query.populate('createdBy', 'name email').populate('assignedStudents', 'name email').populate({
    path: 'questions.question',
    select: 'questionId statement options correctAnswer subject',
    populate: {
      path: 'subject',
      select: 'subjectId subjectName',
    },
  });

exports.getTests = async (req, res) => {
  try {
    const tests = await populateTestQuery(Test.find().sort({ startTime: 1 }));

    res.status(200).json({
      success: true,
      tests,
    });
  } catch (error) {
    console.error('Get tests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tests',
      error: error.message,
    });
  }
};

exports.createTest = async (req, res) => {
  try {
    const result = await buildTestPayload(req.body);
    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    const duplicate = await Test.findOne({ testId: result.payload.testId });
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: 'Test with the same ID already exists',
      });
    }

    const test = await Test.create({
      ...result.payload,
      createdBy: req.userId,
    });

    const populatedTest = await populateTestQuery(Test.findById(test._id));

    res.status(201).json({
      success: true,
      message: 'Test created successfully',
      test: populatedTest,
    });
  } catch (error) {
    console.error('Create test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating test',
      error: error.message,
    });
  }
};

exports.updateTest = async (req, res) => {
  try {
    const existingTest = await Test.findById(req.params.id).select('startTime');
    if (!existingTest) {
      return res.status(404).json({
        success: false,
        message: 'Test not found',
      });
    }

    if (new Date() >= new Date(existingTest.startTime)) {
      return res.status(400).json({
        success: false,
        message: 'Started tests cannot be edited',
      });
    }

    const result = await buildTestPayload(req.body);
    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    const duplicate = await Test.findOne({
      _id: { $ne: req.params.id },
      testId: result.payload.testId,
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: 'Another test with the same ID already exists',
      });
    }

    const test = await populateTestQuery(
      Test.findByIdAndUpdate(
        req.params.id,
        {
          ...result.payload,
        },
        {
          new: true,
          runValidators: true,
        }
      )
    );

    res.status(200).json({
      success: true,
      message: 'Test updated successfully',
      test,
    });
  } catch (error) {
    console.error('Update test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating test',
      error: error.message,
    });
  }
};

exports.deleteTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found',
      });
    }

    if (new Date() >= new Date(test.startTime)) {
      return res.status(400).json({
        success: false,
        message: 'Started tests cannot be deleted',
      });
    }

    const hasResults = await TestResult.exists({ test: test._id });
    if (hasResults) {
      return res.status(400).json({
        success: false,
        message: 'Test cannot be deleted because results already exist',
      });
    }

    await test.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Test deleted successfully',
    });
  } catch (error) {
    console.error('Delete test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting test',
      error: error.message,
    });
  }
};
