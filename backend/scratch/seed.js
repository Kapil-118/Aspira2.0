require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const Mentor = require('../models/mentor');
const AlumniProfile = require('../models/alumniProfile');
const connectDB = require('../config/db');

const mentorsData = [
  { 
    name: 'Dr. Aarav Patel', 
    email: 'aarav.patel@aspira.com', 
    department: 'Computer Science', 
    year: '4', 
    bio: 'Senior researcher in Cloud Computing and Virtualization topologies.', 
    skills: ['Docker', 'AWS', 'Kubernetes', 'Go'],
    photo: '/uploads/avatar1.svg'
  },
  { 
    name: 'Priya Sharma', 
    email: 'priya.sharma@aspira.com', 
    department: 'Information Technology', 
    year: '3', 
    bio: 'Full stack web developer specializing in reactive states and state management.', 
    skills: ['React', 'Redux', 'Node.js', 'Express'],
    photo: '/uploads/avatar2.svg'
  },
  { 
    name: 'Rohan Mehta', 
    email: 'rohan.mehta@aspira.com', 
    department: 'Electronics', 
    year: '4', 
    bio: 'IoT firmware architect and micro-controllers designer.', 
    skills: ['Embedded C', 'Raspberry Pi', 'Arduino', 'Python'],
    photo: '/uploads/avatar3.svg'
  },
  { 
    name: 'Sneha Gupta', 
    email: 'sneha.gupta@aspira.com', 
    department: 'Civil', 
    year: '3', 
    bio: 'Structural engineering enthusiast focusing on green architecture frameworks.', 
    skills: ['AutoCAD', 'Structural Design', 'GIS'],
    photo: '/uploads/avatar4.svg'
  },
  { 
    name: 'Amit Verma', 
    email: 'amit.verma@aspira.com', 
    department: 'Mechanical', 
    year: '4', 
    bio: 'CAD/CAM product modeler and automation systems engineer.', 
    skills: ['SolidWorks', 'MATLAB', 'Ansys'],
    photo: '/uploads/avatar5.svg'
  }
];

const alumniData = [
  { 
    name: 'Kunal Joshi', 
    email: 'kunal.joshi@google.com', 
    company: 'Google', 
    designation: 'Software Engineer II', 
    experience: 3, 
    location: 'Bangalore', 
    biography: 'Working in Google Ads team. Happy to guide on DS/Algo prep.', 
    skills: ['Java', 'System Design', 'Algorithms'],
    photo: '/uploads/avatar6.svg'
  },
  { 
    name: 'Anjali Desai', 
    email: 'anjali.desai@amazon.com', 
    company: 'Amazon', 
    designation: 'SDE-2', 
    experience: 4, 
    location: 'Hyderabad', 
    biography: 'Ex-student of Aspira. Focuses on horizontal backend scaling pipelines.', 
    skills: ['Node.js', 'AWS', 'DynamoDB'],
    photo: '/uploads/avatar7.svg'
  },
  { 
    name: 'Vikram Singh', 
    email: 'vikram.singh@microsoft.com', 
    company: 'Microsoft', 
    designation: 'Senior Azure Architect', 
    experience: 6, 
    location: 'Seattle', 
    biography: 'Cloud systems designer. Open for referrals and resume reviews.', 
    skills: ['C#', '.NET Core', 'Azure', 'Kubernetes'],
    photo: '/uploads/avatar8.svg'
  },
  { 
    name: 'Neha Ranade', 
    email: 'neha.ranade@meta.com', 
    company: 'Meta', 
    designation: 'Product Engineer', 
    experience: 5, 
    location: 'London', 
    biography: 'Passionate about frontend performance optimization and system design.', 
    skills: ['React', 'TypeScript', 'GraphQL'],
    photo: '/uploads/avatar9.svg'
  },
  { 
    name: 'Sanjay Nair', 
    email: 'sanjay.nair@netflix.com', 
    company: 'Netflix', 
    designation: 'Principal Architect', 
    experience: 8, 
    location: 'Los Angeles', 
    biography: 'Streaming pipeline expert. Happy to assist with system design reviews.', 
    skills: ['Distributed Systems', 'Go', 'Cassandra'],
    photo: '/uploads/avatar10.svg'
  }
];

const studentsData = [
  { 
    name: 'Aditya Rao', 
    email: 'aditya.rao@aspira.com', 
    department: 'Computer Science', 
    year: '3', 
    bio: 'MERN stack beginner looking to learn advanced backend scaling.',
    photo: '/uploads/avatar11.svg'
  },
  { 
    name: 'Diya Sen', 
    email: 'diya.sen@aspira.com', 
    department: 'Information Technology', 
    year: '3', 
    bio: 'UX/UI developer eager to learn frontend optimization.',
    photo: '/uploads/avatar12.svg'
  },
  { 
    name: 'Kabir Kapoor', 
    email: 'kabir.kapoor@aspira.com', 
    department: 'Electronics', 
    year: '4', 
    bio: 'Looking for firmware engineering mentor connections.',
    photo: '/uploads/avatar13.svg'
  },
  { 
    name: 'Riya Singhal', 
    email: 'riya.singhal@aspira.com', 
    department: 'Civil', 
    year: '3', 
    bio: 'Aspiring green infrastructure modeler.',
    photo: '/uploads/avatar14.svg'
  },
  { 
    name: 'Varun Joshi', 
    email: 'varun.joshi@aspira.com', 
    department: 'Mechanical', 
    year: '4', 
    bio: 'Eager to get referral targets in automotive robotics.',
    photo: '/uploads/avatar15.svg'
  }
];

const seedDB = async () => {
  await connectDB();

  console.log('Clearing old seed data...');
  // Delete previously seeded users to avoid email unique constraints conflicts
  const emailsToDelete = [
    ...mentorsData.map(m => m.email),
    ...alumniData.map(a => a.email),
    ...studentsData.map(s => s.email)
  ];
  await User.deleteMany({ email: { $in: emailsToDelete } });
  
  // Also clear mentor and alumni tables to prevent orphaned records!
  await Mentor.deleteMany({});
  await AlumniProfile.deleteMany({});

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('AspiraPass123!', salt);

  console.log('Seeding Mentors...');
  for (const m of mentorsData) {
    const user = await User.create({
      name: m.name,
      email: m.email,
      password: hashedPassword,
      role: 'mentor',
      isVerified: true,
      isApproved: true,
      department: m.department,
      year: m.year,
      bio: m.bio,
      profilePhoto: m.photo
    });

    await Mentor.create({
      userId: user._id,
      name: user.name,
      bio: user.bio,
      department: user.department,
      year: user.year,
      skills: m.skills,
      profilePhoto: user.profilePhoto,
      isApproved: true
    });
  }

  console.log('Seeding Alumni...');
  for (const a of alumniData) {
    const user = await User.create({
      name: a.name,
      email: a.email,
      password: hashedPassword,
      role: 'alumni',
      isVerified: true,
      isApproved: true,
      bio: a.biography,
      profilePhoto: a.photo
    });

    await AlumniProfile.create({
      userId: user._id,
      company: a.company,
      designation: a.designation,
      experience: a.experience,
      location: a.location,
      linkedin: 'https://linkedin.com',
      github: 'https://github.com',
      skills: a.skills,
      biography: a.biography,
      openForMentorship: true,
      openForReferral: true,
      isApproved: true
    });
  }

  console.log('Seeding Students...');
  for (const s of studentsData) {
    await User.create({
      name: s.name,
      email: s.email,
      password: hashedPassword,
      role: 'student',
      isVerified: true,
      isApproved: true,
      department: s.department,
      year: s.year,
      bio: s.bio,
      profilePhoto: s.photo
    });
  }

  console.log('Database Seeding Completed Successfully!');
  process.exit(0);
};

seedDB().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
