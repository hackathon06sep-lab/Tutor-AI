const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true, index: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Enables MongoDB full-text search used by the retriever.
documentSchema.index({ content: 'text', title: 'text', tags: 'text' });

module.exports = mongoose.model('Document', documentSchema);
