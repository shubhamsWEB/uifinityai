const mongoose = require('mongoose');

const ComponentSchema = new mongoose.Schema({
  figmaId: { 
    type: String, 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    default: '' 
  },
  type: { 
    type: String, 
    required: true 
  }, // button, input, card, etc.
  properties: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  },
  layout: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  },
  styles: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  },
  variantProperties: { 
    type: mongoose.Schema.Types.Mixed, 
    default: null 
  },
  figmaKey: { 
    type: String, 
    required: true 
  },
  previewUrl: { 
    type: String, 
    default: null 
  }
}, { 
  minimize: false 
});

module.exports = mongoose.model('Component', ComponentSchema);