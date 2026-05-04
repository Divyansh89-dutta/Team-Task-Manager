const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    color: {
      type: String,
      default: '#5E6AD2',
      match: /^#[0-9A-Fa-f]{6}$/,
    },
    icon: {
      type: String,
      default: '📋',
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'completed'],
      default: 'active',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['admin', 'member'],
          default: 'member',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    taskCount: {
      type: Number,
      default: 0,
    },
    completedTaskCount: {
      type: Number,
      default: 0,
    },
    identifier: {
      type: String,
      unique: true,
      uppercase: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

projectSchema.index({ owner: 1 });
projectSchema.index({ 'members.user': 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ createdAt: -1 });

projectSchema.virtual('progress').get(function () {
  if (this.taskCount === 0) return 0;
  return Math.round((this.completedTaskCount / this.taskCount) * 100);
});

projectSchema.pre('save', async function (next) {
  if (!this.identifier) {
    const prefix = this.name.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    const rand = Math.floor(Math.random() * 9000) + 1000;
    this.identifier = `${prefix}-${rand}`;
  }
  next();
});

projectSchema.methods.isMember = function (userId) {
  return (
    this.owner.toString() === userId.toString() ||
    this.members.some((m) => m.user.toString() === userId.toString())
  );
};

projectSchema.methods.isAdmin = function (userId) {
  if (this.owner.toString() === userId.toString()) return true;
  const member = this.members.find((m) => m.user.toString() === userId.toString());
  return member?.role === 'admin';
};

module.exports = mongoose.model('Project', projectSchema);
