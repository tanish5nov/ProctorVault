const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    subjectId: {
      type: String,
      required: [true, 'Please provide a subject ID'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [30, 'Subject ID cannot be more than 30 characters'],
    },
    subjectName: {
      type: String,
      required: [true, 'Please provide a subject name'],
      trim: true,
      maxlength: [120, 'Subject name cannot be more than 120 characters'],
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

module.exports = mongoose.model('Subject', subjectSchema);
