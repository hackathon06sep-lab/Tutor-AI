require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/pdf',  require('./routes/pdf'));

// MongoDB connection + server start
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.info('MongoDB connected');
    app.listen(process.env.PORT || 5000, () => {
      console.info(`Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
