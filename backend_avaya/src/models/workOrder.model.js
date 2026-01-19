import mongoose from 'mongoose';

const workOrderSchema = new mongoose.Schema({
  // Visit & Installation Date
  visitInstDate: {
    type: Date,
    index: true
  },

  // Types of Work Order
  workOrderType: {
    type: String,
    trim: true,
    maxlength: [100, 'Work order type cannot exceed 100 characters'],
    index: true
  },

  // Work Order Number (Manual Entry)
  workOrderNumber: {
    type: String,
    uppercase: true
  },

  // Customer Name
  customerName: {
    type: String,
    trim: true,
    maxlength: [200, 'Customer name cannot exceed 200 characters'],
    index: 'text'
  },

  // Customer Phone
  customerPhone: {
    type: String,
    trim: true
  },

  // Area
  area: {
    type: String,
    trim: true,
    index: true,
    maxlength: [100, 'Area name cannot exceed 100 characters']
  },

  // Description
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
    index: 'text'
  },

  // Area Code
  areaCode: {
    type: String,
    trim: true,
    uppercase: true,
    index: true,
    maxlength: [20, 'Area code cannot exceed 20 characters']
  },

  // Supervisor
  supervisor: {
    type: String,
    trim: true,
    maxlength: [100, 'Supervisor name cannot exceed 100 characters'],
    index: true
  },

  // Technician
  technician: {
    type: String,
    trim: true,
    maxlength: [100, 'Technician name cannot exceed 100 characters'],
    index: true
  },

  // Hours (decimal value for work duration)
  hours: {
    type: Number,
    min: [0, 'Hours cannot be negative'],
    max: [100, 'Hours cannot exceed 100'],
    default: 0
  },

  // Work Order Status
  workOrderStatus: {
    type: String,
    enum: {
      values: [
        'Completed',
        'Quotation',
        'Need Tomorrow',
        'Need S.V',
        'Under Observ.',
        'Pending',
        'preventive pending',
        'S.N.R / Un Comp.',
        'No Body At Site',
        'Cancel / No Need',
        'No Answer',
        'Will Call Later',
        'Need Other Day'
      ],
      message: '{VALUE} is not a valid work order status'
    },
    default: 'Pending',
    index: true
  },

  // Reschedule Reason & Remarks
  rescheduleReason: {
    type: Date
  },

  // Job Status
  jobStatus: {
    type: String,
    enum: {
      values: [
        'Attend',
        'Not Attend'
      ],
      message: '{VALUE} is not a valid job status'
    },
    default: 'Not Attend',
    index: true
  },

  // Distribution (Auto-updated based on assignment)
  distribution: {
    type: String,
    default: '',
    index: true
  },

  // Agent Name (User who created the work order)
  agentName: {
    type: String,
    trim: true,
    maxlength: [100, 'Agent name cannot exceed 100 characters'],
    index: true
  },

  // Completion Date
  completionDate: {
    type: Date
  },

  // Attachments
  attachments: [{
    url: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Audit Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Soft Delete
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },

  deletedAt: {
    type: Date
  },

  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// ═══════════════════════════════════════════════════════════
// Compound Indexes for Performance
// ═══════════════════════════════════════════════════════════
workOrderSchema.index({ workOrderStatus: 1, visitInstDate: -1 });
workOrderSchema.index({ supervisor: 1, visitInstDate: -1 });
workOrderSchema.index({ technician: 1, visitInstDate: -1 });
workOrderSchema.index({ area: 1, areaCode: 1 });
workOrderSchema.index({ isDeleted: 1, createdAt: -1 });

// Text index for search
workOrderSchema.index({ customerName: 'text', description: 'text' });

// ═══════════════════════════════════════════════════════════
// Virtual Properties
// ═══════════════════════════════════════════════════════════

// Check if work order is overdue
workOrderSchema.virtual('isOverdue').get(function() {
  if (this.workOrderStatus === 'Completed' || this.workOrderStatus === 'Cancelled') {
    return false;
  }
  return this.visitInstDate < new Date();
});

// Calculate days until due
workOrderSchema.virtual('daysUntilDue').get(function() {
  if (this.workOrderStatus === 'Completed' || this.workOrderStatus === 'Cancelled') {
    return null;
  }
  const now = new Date();
  const diff = this.visitInstDate - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// ═══════════════════════════════════════════════════════════
// Instance Methods
// ═══════════════════════════════════════════════════════════

// Check if status transition is allowed
workOrderSchema.methods.canTransitionTo = function(newStatus) {
  const allowedTransitions = {
    'Pending': ['In Progress', 'Cancelled', 'Rescheduled'],
    'In Progress': ['Completed', 'On Hold', 'Cancelled', 'Rescheduled'],
    'On Hold': ['In Progress', 'Cancelled', 'Rescheduled'],
    'Rescheduled': ['Pending', 'Cancelled'],
    'Completed': [],
    'Cancelled': []
  };

  const allowed = allowedTransitions[this.workOrderStatus] || [];
  return allowed.includes(newStatus);
};

// Assign technician
workOrderSchema.methods.assignTechnician = async function(technicianId, userId) {
  this.technician = technicianId;
  this.updatedBy = userId;
  await this.save();
  return this;
};

// Complete work order
workOrderSchema.methods.complete = async function(completionData, userId) {
  if (!this.canTransitionTo('Completed')) {
    throw new Error(`Cannot complete work order from status: ${this.workOrderStatus}`);
  }

  this.workOrderStatus = 'Completed';
  this.jobStatus = 'Completed';
  this.completionDate = completionData.completionDate || new Date();
  
  this.updatedBy = userId;
  await this.save();
  return this;
};

// Reschedule work order
workOrderSchema.methods.reschedule = async function(newDate, reason, userId) {
  if (!this.canTransitionTo('Rescheduled')) {
    throw new Error(`Cannot reschedule work order from status: ${this.workOrderStatus}`);
  }

  this.workOrderStatus = 'Rescheduled';
  this.visitInstDate = newDate;
  this.rescheduleReasonRemarks = reason;
  this.updatedBy = userId;
  await this.save();
  return this;
};

// ═══════════════════════════════════════════════════════════
// Static Methods
// ═══════════════════════════════════════════════════════════

// Find overdue work orders
workOrderSchema.statics.findOverdue = function() {
  return this.find({
    visitInstDate: { $lt: new Date() },
    workOrderStatus: { $nin: ['Completed', 'Cancelled'] },
    isDeleted: false
  }).sort({ visitInstDate: 1 });
};

// Find work orders by date range
workOrderSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    visitInstDate: {
      $gte: startDate,
      $lte: endDate
    },
    isDeleted: false
  }).sort({ visitInstDate: 1 });
};

// Get statistics by status
workOrderSchema.statics.getStatsByStatus = async function(filters = {}) {
  const matchStage = { isDeleted: false, ...filters };
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$workOrderStatus',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        status: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]);
};

// Get statistics by technician
workOrderSchema.statics.getStatsByTechnician = async function(technicianId) {
  return this.aggregate([
    { 
      $match: { 
        technician: technicianId,
        isDeleted: false 
      } 
    },
    {
      $group: {
        _id: '$workOrderStatus',
        count: { $sum: 1 }
      }
    }
  ]);
};

// ═══════════════════════════════════════════════════════════
// Middleware - Pre Save
// ═══════════════════════════════════════════════════════════

// Validation for status-specific required fields
workOrderSchema.pre('save', function(next) {
  // Completed requires completionDate
  if (this.workOrderStatus === 'Completed' && !this.completionDate) {
    this.completionDate = new Date();
  }

  next();
});

// ═══════════════════════════════════════════════════════════
// Middleware - Post Operations
// ═══════════════════════════════════════════════════════════

// Ensure virtuals are included in JSON/Object conversion
workOrderSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    // Remove sensitive/internal fields
    delete ret.__v;
    return ret;
  }
});

workOrderSchema.set('toObject', { virtuals: true });

const WorkOrder = mongoose.model('WorkOrder', workOrderSchema);

export default WorkOrder;
