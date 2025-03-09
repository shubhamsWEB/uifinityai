const mongoose = require('mongoose');

const DesignSystemSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    default: '' 
  },
  figmaFileKey: { 
    type: String, 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  organizationId: { 
    type: String, 
    default: null 
  },
  tokens: {
    colors: { 
      type: Map, 
      of: mongoose.Schema.Types.Mixed, 
      default: {} 
    },
    typography: { 
      type: Map, 
      of: mongoose.Schema.Types.Mixed, 
      default: {} 
    },
    spacing: { 
      type: Map, 
      of: mongoose.Schema.Types.Mixed, 
      default: {} 
    },
    shadows: { 
      type: Map, 
      of: mongoose.Schema.Types.Mixed, 
      default: {} 
    },
    borders: { 
      type: Map, 
      of: mongoose.Schema.Types.Mixed, 
      default: {} 
    }
  },
  components: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Component' 
  }],
  componentSets: { 
    type: Map, 
    of: mongoose.Schema.Types.Mixed, 
    default: {} 
  },
  version: { 
    type: String, 
    default: '1.0.0' 
  },
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

module.exports = mongoose.model('DesignSystem', DesignSystemSchema);