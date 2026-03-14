const mongoose = require('mongoose');

const testQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    assignedMarks: {
      type: Number,
      required: true,
      min: [0, 'Assigned marks cannot be negative'],
    },
  },
  {
    _id: false,
  }
);

const testSchema = new mongoose.Schema(
  {
    testId: {
      type: String,
      required: [true, 'Please provide a test ID'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [40, 'Test ID cannot be more than 40 characters'],
    },
    testName: {
      type: String,
      required: [true, 'Please provide a test name'],
      trim: true,
      maxlength: [150, 'Test name cannot be more than 150 characters'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startTime: {
      type: Date,
      required: [true, 'Please provide a start time'],
    },
    endTime: {
      type: Date,
      required: [true, 'Please provide an end time'],
    },
    questions: {
      type: [testQuestionSchema],
      default: [],
    },
    assignedStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Test', testSchema);
