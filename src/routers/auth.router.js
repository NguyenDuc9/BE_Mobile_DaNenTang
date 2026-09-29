const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/register', authMiddleware.register);
router.post('/login', authMiddleware.login);
router.get('/me', authMiddleware.authenticate, authMiddleware.me);

module.exports = router;
