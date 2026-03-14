const mongoose = require('mongoose');
const Test = require('../models/Test');
const TestResult = require('../models/TestResult');

const populateResultQuery = (query) =>
  query
    .populate({
      path: 'test',
      select: 'testId testName startTime endTime',
    })
    .populate({
      path: 'answers.question',
      select: 'questionId statement options correctAnswer subject',
      populate: {
        path: 'subject',
        select: 'subjectId subjectName',
      },
    });

const evaluateResult = async (resultDoc) => {
  await resultDoc.populate({
    path: 'test',
    populate: {
      path: 'questions.question',
      select: 'correctAnswer',
    },
  });

  const markByQuestion = new Map(
    (resultDoc.test?.questions || []).map((entry) => [
      String(entry.question?._id),
      {
        correctAnswer: entry.question?.correctAnswer || '',
        assignedMarks: Number(entry.assignedMarks || 0),
      },
    ])
  );

  let obtainedMarks = 0;
  let totalMarks = 0;

  resultDoc.answers = resultDoc.answers.map((answer) => {
    const answerQuestionId = String(answer.question?._id || answer.question);
    const questionMeta = markByQuestion.get(answerQuestionId);
    const correctAnswer = (questionMeta?.correctAnswer || '').trim().toUpperCase();
    const assignedMarks = Number(questionMeta?.assignedMarks || answer.assignedMarks || 0);
    const selectedAnswer = (answer.selectedAnswer || '').trim().toUpperCase();
    const isCorrect = selectedAnswer !== '' && selectedAnswer === correctAnswer;
    const answerObtainedMarks = isCorrect ? assignedMarks : 0;

    totalMarks += assignedMarks;
    obtainedMarks += answerObtainedMarks;

    return {
      question: answer.question,
      selectedAnswer,
      isCorrect,
      assignedMarks,
      obtainedMarks: answerObtainedMarks,
    };
  });

  resultDoc.totalMarks = totalMarks;
  resultDoc.obtainedMarks = obtainedMarks;
  resultDoc.status = 'Submitted';
  resultDoc.submittedAt = new Date();
};

const buildStudentTestSummary = (test, result) => {
  const now = new Date();
  let availability = 'Upcoming';

  if (now >= new Date(test.startTime) && now <= new Date(test.endTime)) {
    availability = 'Ongoing';
  } else if (now > new Date(test.endTime)) {
    availability = 'Closed';
  }

  return {
    _id: test._id,
    testId: test.testId,
    testName: test.testName,
    startTime: test.startTime,
    endTime: test.endTime,
    questionCount: test.questions.length,
    totalMarks: test.questions.reduce((sum, entry) => sum + Number(entry.assignedMarks || 0), 0),
    availability,
    resultStatus: result?.status || 'NotStarted',
    resultId: result?._id || null,
    obtainedMarks: result?.obtainedMarks ?? null,
  };
};

exports.getAssignedTests = async (req, res) => {
  try {
    const [tests, results] = await Promise.all([
      Test.find({ assignedStudents: req.userId })
        .select('testId testName startTime endTime questions')
        .sort({ startTime: 1 }),
      TestResult.find({ student: req.userId }).select('test status obtainedMarks'),
    ]);

    const resultByTest = new Map(results.map((result) => [String(result.test), result]));
    const payload = tests.map((test) => buildStudentTestSummary(test, resultByTest.get(String(test._id))));

    res.status(200).json({
      success: true,
      tests: payload,
    });
  } catch (error) {
    console.error('Get assigned tests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assigned tests',
      error: error.message,
    });
  }
};

exports.startTest = async (req, res) => {
  try {
    const { testId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid test ID',
      });
    }

    const test = await Test.findById(testId).populate({
      path: 'questions.question',
      select: 'questionId statement options subject',
      populate: {
        path: 'subject',
        select: 'subjectId subjectName',
      },
    });

    if (!test || !test.assignedStudents.some((studentId) => String(studentId) === req.userId)) {
      return res.status(404).json({
        success: false,
        message: 'Assigned test not found',
      });
    }

    const now = new Date();
    if (now < new Date(test.startTime)) {
      return res.status(400).json({
        success: false,
        message: 'This test has not started yet',
      });
    }

    const existingResult = await populateResultQuery(
      TestResult.findOne({ test: test._id, student: req.userId })
    );

    if (existingResult?.status === 'Submitted') {
      return res.status(400).json({
        success: false,
        message: 'This test has already been submitted and cannot be re-entered',
      });
    }

    let result = existingResult;

    if (!result) {
      result = await TestResult.create({
        test: test._id,
        student: req.userId,
        answers: test.questions.map((entry) => ({
          question: entry.question._id,
          selectedAnswer: '',
          isCorrect: false,
          assignedMarks: entry.assignedMarks,
          obtainedMarks: 0,
        })),
        totalMarks: test.questions.reduce((sum, entry) => sum + Number(entry.assignedMarks || 0), 0),
        obtainedMarks: 0,
        startedAt: now,
        status: 'InProgress',
      });

      result = await populateResultQuery(TestResult.findById(result._id));
    }

    if (now > new Date(test.endTime)) {
      await evaluateResult(result);
      await result.save();

      return res.status(400).json({
        success: false,
        message: 'This test has already ended',
      });
    }

    const payload = {
      resultId: result._id,
      test: {
        _id: test._id,
        testId: test.testId,
        testName: test.testName,
        startTime: test.startTime,
        endTime: test.endTime,
        questions: test.questions.map((entry) => {
          const savedAnswer = result.answers.find(
            (answer) => String(answer.question._id || answer.question) === String(entry.question._id)
          );

          return {
            questionId: entry.question._id,
            code: entry.question.questionId,
            statement: entry.question.statement,
            options: entry.question.options || [],
            subject: entry.question.subject,
            assignedMarks: entry.assignedMarks,
            selectedAnswer: savedAnswer?.selectedAnswer || '',
          };
        }),
      },
    };

    res.status(200).json({
      success: true,
      message: 'Test session ready',
      session: payload,
    });
  } catch (error) {
    console.error('Start test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting test',
      error: error.message,
    });
  }
};

exports.saveAnswer = async (req, res) => {
  try {
    const { resultId } = req.params;
    const { questionId, selectedAnswer } = req.body;

    if (!mongoose.Types.ObjectId.isValid(resultId) || !mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid result or question ID',
      });
    }

    const result = await populateResultQuery(
      TestResult.findOne({
        _id: resultId,
        student: req.userId,
      })
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Active test session not found',
      });
    }

    if (result.status === 'Submitted') {
      return res.status(400).json({
        success: false,
        message: 'This test has already been submitted',
      });
    }

    const test = await Test.findById(result.test._id).select('endTime');
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Related test not found',
      });
    }

    if (new Date() > new Date(test.endTime)) {
      await evaluateResult(result);
      await result.save();

      return res.status(400).json({
        success: false,
        message: 'This test has ended and was submitted automatically',
      });
    }

    const answerEntry = result.answers.find((answer) => String(answer.question._id || answer.question) === questionId);
    if (!answerEntry) {
      return res.status(404).json({
        success: false,
        message: 'Question not found in this test session',
      });
    }

    answerEntry.selectedAnswer = (selectedAnswer || '').trim().toUpperCase();
    await result.save();

    res.status(200).json({
      success: true,
      message: 'Answer saved successfully',
    });
  } catch (error) {
    console.error('Save answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving answer',
      error: error.message,
    });
  }
};

exports.submitTest = async (req, res) => {
  try {
    const { resultId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(resultId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid result ID',
      });
    }

    const result = await populateResultQuery(
      TestResult.findOne({
        _id: resultId,
        student: req.userId,
      })
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Test session not found',
      });
    }

    if (result.status === 'Submitted') {
      return res.status(200).json({
        success: true,
        message: 'Test already submitted',
        result,
      });
    }

    await evaluateResult(result);
    await result.save();

    res.status(200).json({
      success: true,
      message: 'Test submitted successfully',
      result,
    });
  } catch (error) {
    console.error('Submit test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting test',
      error: error.message,
    });
  }
};

exports.getMyResults = async (req, res) => {
  try {
    const results = await populateResultQuery(
      TestResult.find({
        student: req.userId,
        status: 'Submitted',
      }).sort({ submittedAt: -1 })
    );

    res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Get my results error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching results',
      error: error.message,
    });
  }
};

exports.getAllResults = async (req, res) => {
  try {
    const query = { status: 'Submitted' };

    if (req.query.test) {
      if (!mongoose.Types.ObjectId.isValid(req.query.test)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid test filter',
        });
      }
      query.test = req.query.test;
    }

    if (req.query.student) {
      if (!mongoose.Types.ObjectId.isValid(req.query.student)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid student filter',
        });
      }
      query.student = req.query.student;
    }

    const results = await populateResultQuery(
      TestResult.find(query)
        .populate('student', 'name email')
        .sort({ submittedAt: -1 })
    );

    res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Get all results error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching all results',
      error: error.message,
    });
  }
};
