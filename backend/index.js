const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initDB } = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
const studentRoutes = require('./routes/student');
const tutorRoutes = require('./routes/tutor');

app.use('/api/student', studentRoutes);
app.use('/api/tutor', tutorRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await initDB();
});
