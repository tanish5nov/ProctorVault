const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: [true, 'Please provide a question ID'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [40, 'Question ID cannot be more than 40 characters'],
    },
    statement: {
      type: String,
      required: [true, 'Please provide a question statement'],
      trim: true,
    },
    correctAnswer: {
      type: String,
      required: [true, 'Please provide the correct answer'],
      trim: true,
      uppercase: true,
      maxlength: [200, 'Correct answer cannot be more than 200 characters'],
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Please provide a subject'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Question', questionSchema);
