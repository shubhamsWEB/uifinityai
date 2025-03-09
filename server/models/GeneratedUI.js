// server/models/GeneratedUI.js
const mongoose = require('mongoose');

const GeneratedUISchema = new mongoose.Schema({
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
  structuredRequirements: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  matchedComponents: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  layoutData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  styledLayout: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  generatedCode: {
    mainComponent: {
      type: String,
      required: true
    },
    subComponents: {
      type: Map,
      of: String,
      default: {}
    },
    utilityFiles: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    styleDefinitions: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  framework: {
    type: String,
    enum: ['react', 'next'],
    default: 'react'
  },
  styleLibrary: {
    type: String,
    enum: ['tailwind', 'chakra', 'styled-components'],
    default: 'tailwind'
  },
  feedback: {
    type: String
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  refinementHistory: [
    {
      feedback: {
        type: String,
        required: true
      },
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
GeneratedUISchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('GeneratedUI', GeneratedUISchema);