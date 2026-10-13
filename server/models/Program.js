
const mongoose = require('mongoose');

const ProgramSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  ageRange: {
    type: String,
    required: [true, 'Please add an age range'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  iconType: {
    type: String,
    required: [true, 'Please add an icon type'],
    enum: ['TreePine', 'TentTree', 'Bird']
  },
  colorAccent: {
    type: String,
    required: [true, 'Please add a color accent'],
    enum: ['accent-forest', 'accent-earth', 'accent-sky']
  },
  startDate: {
    type: String,
    required: [true, 'Please add a start date']
  },
  duration: {
    type: String,
    required: [true, 'Please add a duration']
  },
  rates: {
    halfDayMorning: {
      type: Number,
      required: [true, 'Please add a half-day morning rate']
    },
    halfDayAfternoon: {
      type: Number,
      required: [true, 'Please add a half-day afternoon rate']
    },
    fullDay: {
      type: Number,
      required: [true, 'Please add a full-day rate']
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Program', ProgramSchema);
