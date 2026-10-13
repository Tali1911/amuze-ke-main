const fs = require('fs');
const mongoose = require('mongoose');
const colors = require('colors');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: './config/config.env' });

// Load models
const Admin = require('./models/Admin');
const Program = require('./models/Program');
const Announcement = require('./models/Announcement');
const Registration = require('./models/Registration');
const Contact = require('./models/Contact');
const Feature = require('./models/Feature');

// Connect to DB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Read JSON files
const admins = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/admins.json`, 'utf-8')
);

const programs = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/programs.json`, 'utf-8')
);

const announcements = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/announcements.json`, 'utf-8')
);

// Import data into DB
const importData = async () => {
  try {
    await Admin.deleteMany();
    await Program.deleteMany();
    await Announcement.deleteMany();
    await Registration.deleteMany();
    await Contact.deleteMany();
    await Feature.deleteMany();

    const createdAdmins = await Admin.insertMany(admins);

    const admin = createdAdmins[0];

    await Program.insertMany(programs);
    await Announcement.insertMany(announcements);

    // Create default features
    const defaultFeatures = [
      {
        key: 'galleryEnabled',
        name: 'Photo Gallery',
        description: 'Enable or disable the photo gallery on the website.',
        enabled: true,
        updatedBy: admin._id
      },
      {
        key: 'testimonialsEnabled',
        name: 'Testimonials Section',
        description: 'Show or hide testimonials from parents and participants.',
        enabled: true,
        updatedBy: admin._id
      },
      {
        key: 'blogEnabled',
        name: 'Blog',
        description: 'Enable or disable the blog section (coming soon).',
        enabled: false,
        updatedBy: admin._id
      },
      {
        key: 'showRecruitment',
        name: 'Recruitment Section',
        description: 'Show or hide the "Join Our Team" recruitment section.',
        enabled: false,
        updatedBy: admin._id
      }
    ];

    await Feature.insertMany(defaultFeatures);
    console.log('Default features created...'.green.inverse);

    console.log('Data Imported!'.green.inverse);
    process.exit();
  } catch (err) {
    console.error(err);
  }
};

// Delete data from DB
const deleteData = async () => {
  try {
    await Admin.deleteMany();
    await Program.deleteMany();
    await Announcement.deleteMany();
    await Registration.deleteMany();
    await Contact.deleteMany();
    await Feature.deleteMany();
    console.log('Features deleted...'.red.inverse);

    console.log('Data Destroyed!'.red.inverse);
    process.exit();
  } catch (err) {
    console.error(err);
  }
};

if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
}
