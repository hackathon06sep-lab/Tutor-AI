const mongoose = require('mongoose');

const questionResultSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: { type: [String], default: [] },
    correctAnswer: { type: String, required: true },
    userAnswer: { type: String, default: '' },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false }
);

const quizResultSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    topic: { type: String, required: true },
    score: { type: Number, required: true },
    total: { type: Number, default: 5 },
    questions: { type: [questionResultSchema], default: [] },
    takenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('QuizResult', quizResultSchema);
