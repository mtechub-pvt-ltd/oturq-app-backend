const express = require('express');
const router = express.Router();
const {
    addNewUser,
    LogInUser,
    updateUserStatus,
    updateDriver,
    addNewVehicle,
    updateDriverLocation,
    getDriverNotifications,
    getNewlyGotOrderReqs,
} = require('../controllers/DriverController')
const multer = require("multer")
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './driverPics/')
        //cb(null, '../products')
    },
    filename: function (req, file, cb) {
        cb(null, 'driver-' + Date.now() + file.originalname)
    }
})
const upload = multer({
    storage: storage,
});


// uploading documnets
const cpUpload = upload.fields([
    {
        name: 'profilePic',
        maxCount: 1
    },
    {
        name: 'idCardFrontPic',
        maxCount: 1
    },
    {
        name: 'idCardBackPic',
        maxCount: 1
    },
    {
        name: 'lisencePic',
        maxCount: 1
    },
    {
        name: 'ownershipPic',
        maxCount: 1
    },
])


// Sign Up driver
router.post('/api/driver/register', addNewUser)

// Sign In driver
router.post('/api/driver/signin', LogInUser)

// Upadte verification Stataus
router.put('/api/driver/changeStatus/:id', updateUserStatus);

// Update driver's documents
router.put('/api/driver/updateInfo/:id', cpUpload , updateDriver);

// Update driver info
router.put('/api/driver/addNewVehicle/:id', addNewVehicle);

// Update driver location
router.put('/api/driver/updateLocation/:id', updateDriverLocation);

// get driver notofications
router.get('/api/driver/getNotifications/:id', getDriverNotifications)

// get driver request accepted by customers
router.get('/api/driver/getAcceptedrEqFromCust/:id', getNewlyGotOrderReqs)

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