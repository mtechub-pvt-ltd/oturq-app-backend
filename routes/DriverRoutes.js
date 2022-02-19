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
    updateDriverDetails,
    updateDriverCarDetails,
    updateDriverPaymentDetails,
    getDriverPersonelDetails,
    getDriverVehiclesDetails,
    getDriverSingleVehicleDetails,
    updateDriverProfile,
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
        name: 'idcardfromfront',
        maxCount: 1
    },
    {
        name: 'idcardfromback',
        maxCount: 1
    },
    {
        name: 'driversLisence',
        maxCount: 1
    },
    {
        name: 'vehicleownership',
        maxCount: 1
    },
])


// Sign Up driver
router.post('/api/driver/register', addNewUser)

// Sign In driver
router.post('/api/driver/signin', LogInUser)

// Upadte verification Stataus
router.put('/api/driver/changeVerifyStatus/:id', updateUserStatus);

// Update driver's documents
router.put('/api/driver/addDocuments/:id', cpUpload , updateDriver);

// Update driver info
router.put('/api/driver/addVehicle/:id', addNewVehicle);

// Update driver profile Info
router.put('/api/driver/addOwnerDetails/:id', updateDriverDetails);

// Update driver car details info
router.put('/api/driver/updateCarDetails/:id', updateDriverCarDetails);

// Update driver payment details
router.put('/api/driver/addPaymentDetails/:id', updateDriverPaymentDetails);

// Update driver location
router.put('/api/driver/updateLocation/:id', updateDriverLocation);

// get driver perosnel details
router.get('/api/driver/getPersonelDetails/:id', getDriverPersonelDetails)

// get driver vehicle details
router.get('/api/driver/getVehicleDetails/:id', getDriverVehiclesDetails)

// get driver single vehicle detail
router.get('/api/driver/getSingleVehicleDetails/:id', getDriverSingleVehicleDetails)

// get driver notofications
router.get('/api/driver/getNotifications/:id', getDriverNotifications)

// get driver request accepted by customers
router.get('/api/driver/getAcceptedReqsFromCust/:id', getNewlyGotOrderReqs)

// Update driver profile
router.put('/api/driver/updateProfile/:id', upload.single("profilePic") , updateDriverProfile);

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