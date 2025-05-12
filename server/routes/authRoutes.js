const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /login
router.post('/login', async(req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password required' });
    }
    try {
        const user = await User.findOne({ username, password });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        res.json({ success: true, user: { username: user.username } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;