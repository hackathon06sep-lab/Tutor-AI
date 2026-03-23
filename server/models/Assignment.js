const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    topic: { type: String, required: true },
    gradeLevel: { type: String, default: 'Secondary' },
    assignmentType: { type: String, default: 'Worksheet' },
    content: { type: String, default: '' },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
