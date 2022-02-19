const express = require('express');
const router = express.Router();
const {
    addNewUser,
    updateUserCode,
    LogInUser
} = require('../controllers/CommonController')



// Sign Up User
router.post('/api/user/register/:type', addNewUser)

// Sign In User
router.post('/api/user/signin/:type', LogInUser)

// Upadte verification Stataus
router.put('/api/user/changeStatus/:type/:id', updateUserCode);




module.exports = router;