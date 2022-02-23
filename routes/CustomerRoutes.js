const express = require('express');
const router = express.Router();
const {
     SignInUser,
     LogInUser,
     updateUserStatus,
    updateCustomer,
    updateCustLocation,
    updateCustomerLocation,
    AddUserNewLocations,
    getUserSavedLocations,
    updateCustLocations
} = require('../controllers/CustomerController')
const multer = require("multer")
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './customerPics/')
        //cb(null, '../products')
    },
    filename: function (req, file, cb) {
        cb(null, 'customer-' + Date.now() + file.originalname)
    }
})
const upload = multer({
    storage: storage,
});

// Sign Up Customer
router.post('/api/customer/signin', SignInUser)

// Upadte verification Stataus
router.put('/api/customer/changeVerifyStatus/:id', updateUserStatus);

// add new location
router.put('/api/customer/saveNewLocation/:id', AddUserNewLocations);

// delete any saved location
router.put('/api/customer/deleteSavedLocation/:id', updateCustLocations);

// getting saved location
router.get('/api/customer/getSavedLocation/:id', getUserSavedLocations);

// Update user info
router.put('/api/customer/updateProfile/:id', upload.single("profilePic"), updateCustomer);

// Update user location
router.put('/api/customer/updateLocation/:id', updateCustomerLocation);

// Update user location
router.put('/api/customer/updateLocation/:id', updateCustLocation);

// // get all users orders only
// router.get('/api/user/getOrdersOnly/:id', getUsersOrders)

// // get all users
// router.get('/api/user/getAll', getAllUsers)

// // get all users recent
// router.get('/api/user/getRecentUsers', getRecentUsers)

// // get all users Count
// router.get('/api/user/getAll/count', getAllUsersCount)

// // get single users
// router.get('/api/user/getSingle/:id', getSingleUser)

// // deleting user
// router.delete('/api/user/deleteUser/:id', deleteUser);


module.exports = router;