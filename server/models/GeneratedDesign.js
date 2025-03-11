// server/models/GeneratedDesign.js
const mongoose = require('mongoose');

const GeneratedDesignSchema = new mongoose.Schema({
  prompt: {
    type: String,
    required: true
  },
  designSystemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DesignSystem',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requirements: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  design: {
    svg: String,
    width: Number,
    height: Number,
    format: {
      type: String,
      enum: ['svg', 'png', 'json'],
      default: 'svg'
    }
  },
  feedback: {
    type: String
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  regenerationHistory: [
    {
      design: {
        svg: String,
        width: Number,
        height: Number,
        format: String
      },
      prompt: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  minimize: false
});

// Add pre-save hook to update the updatedAt field
GeneratedDesignSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('GeneratedDesign', GeneratedDesignSchema);