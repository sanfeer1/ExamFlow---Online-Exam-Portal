const express = require('express');
const { pool } = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

// --- EXAMS ---

// Create an exam (Admin only)
router.post('/exams', [authMiddleware, adminMiddleware], async (req, res) => {
    const { title, description, duration_minutes } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO exams (title, description, duration_minutes, created_by) VALUES (?, ?, ?, ?)',
            [title, description, duration_minutes, req.user.id]
        );
        res.status(201).json({ id: result.insertId, title, description, duration_minutes });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update an exam (Admin only)
router.put('/exams/:id', [authMiddleware, adminMiddleware], async (req, res) => {
    const { title, description, duration_minutes } = req.body;
    try {
        const [existing] = await pool.query('SELECT id FROM exams WHERE id = ?', [req.params.id]);
        if (existing.length === 0) return res.status(404).json({ error: 'Exam not found' });

        await pool.query(
            'UPDATE exams SET title = ?, description = ?, duration_minutes = ? WHERE id = ?',
            [title, description, duration_minutes, req.params.id]
        );
        res.json({ message: 'Exam updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete an exam (Admin only)
router.delete('/exams/:id', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        await pool.query('DELETE FROM exams WHERE id = ?', [req.params.id]);
        res.json({ message: 'Exam deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});


// --- QUESTIONS ---

// Add a question to an exam (Admin only)
router.post('/questions', [authMiddleware, adminMiddleware], async (req, res) => {
    const { exam_id, question_text, option_a, option_b, option_c, option_d, correct_option } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [exam_id, question_text, option_a, option_b, option_c, option_d, correct_option]
        );
        res.status(201).json({ id: result.insertId, message: 'Question added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update a question (Admin only)
router.put('/questions/:id', [authMiddleware, adminMiddleware], async (req, res) => {
    const { question_text, option_a, option_b, option_c, option_d, correct_option } = req.body;
    try {
        const [existing] = await pool.query('SELECT id FROM questions WHERE id = ?', [req.params.id]);
        if (existing.length === 0) return res.status(404).json({ error: 'Question not found' });

        await pool.query(
            'UPDATE questions SET question_text = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct_option = ? WHERE id = ?',
            [question_text, option_a, option_b, option_c, option_d, correct_option, req.params.id]
        );
        res.json({ message: 'Question updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete a question (Admin only)
router.delete('/questions/:id', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        await pool.query('DELETE FROM questions WHERE id = ?', [req.params.id]);
        res.json({ message: 'Question deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});


// --- RESULTS ---

// Get all results for a specific exam (Admin only)
router.get('/results/exam/:examId', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        const [results] = await pool.query(`
            SELECT r.*, u.name as student_name, u.email as student_email 
            FROM results r
            JOIN users u ON r.user_id = u.id
            WHERE r.exam_id = ?
            ORDER BY r.score DESC
        `, [req.params.examId]);
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
