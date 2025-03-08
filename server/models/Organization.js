const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      role: {
        type: String,
        enum: ['owner', 'admin', 'member'],
        default: 'member'
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Cascade delete design systems when an organization is deleted
OrganizationSchema.pre('remove', async function(next) {
  await this.model('DesignSystem').deleteMany({ organizationId: this._id });
  next();
});

module.exports = mongoose.model('Organization', OrganizationSchema);