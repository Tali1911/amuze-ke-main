
const mongoose = require('mongoose');

const ChildSchema = new mongoose.Schema({
  childName: {
    type: String,
    required: [true, 'Please add a child name'],
    trim: true
  },
  childAge: {
    type: String,
    required: [true, 'Please add a child age']
  },
  timeSlot: {
    type: String,
    required: [true, 'Please add a time slot'],
    enum: ['morning', 'afternoon', 'fullDay', 'weeklong']
  },
  amount: {
    type: Number,
    required: [true, 'Please add the payment amount for this child']
  },
  programId: {
    type: String,
    required: [true, 'Please add a program ID']
  },
  programName: {
    type: String,
    required: [true, 'Please add a program name']
  },
  ageGroup: {
    type: String
  },
  selectedActivities: [{
    activityId: {
      type: String
    },
    activityName: {
      type: String
    },
    price: {
      type: Number
    }
  }]
});

const RegistrationSchema = new mongoose.Schema({
  parentName: {
    type: String,
    required: [true, 'Please add a parent name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number']
  },
  programId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Program',
    required: [true, 'Please add a program ID']
  },
  children: [ChildSchema],
  totalAmount: {
    type: Number,
    required: [true, 'Please add the total payment amount']
  },
  paymentMethod: {
    type: String,
    required: [true, 'Please add a payment method'],
    enum: ['card', 'mpesa']
  },
  paymentStatus: {
    type: String,
    required: [true, 'Please add a payment status'],
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  paymentId: {
    type: String
  },
  poster: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Registration', RegistrationSchema);
