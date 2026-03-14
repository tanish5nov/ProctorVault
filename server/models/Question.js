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
    options: {
      type: [String],
      default: [],
      validate: {
        validator(options) {
          return Array.isArray(options) && options.every((option) => typeof option === 'string' && option.trim());
        },
        message: 'Question options must be non-empty strings',
      },
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

questionSchema.pre('validate', function (next) {
  if (Array.isArray(this.options)) {
    this.options = this.options.map((option) => option.trim()).filter(Boolean);
  }

  if (this.options.length > 0) {
    const validAnswers = this.options.map((_, index) => String.fromCharCode(65 + index));
    if (!validAnswers.includes(this.correctAnswer)) {
      return next(new Error(`Correct answer must match one of: ${validAnswers.join(', ')}`));
    }
  }

  next();
});

module.exports = mongoose.model('Question', questionSchema);
