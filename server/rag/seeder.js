require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Document = require('../models/Document');

const docFiles = ['math.json', 'science.json', 'history.json', 'coding.json', 'english.json'];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await Document.deleteMany({});
  console.log('Cleared existing documents');

  for (const file of docFiles) {
    const filePath = path.join(__dirname, 'documents', file);
    const docs = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    await Document.insertMany(docs);
    console.log(`Seeded ${docs.length} docs from ${file}`);
  }

  console.log('Seeding complete!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
