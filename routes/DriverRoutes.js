const express = require('express');
const router = express.Router();
const {
    signInDriver,
    updateUserStatus,
    addDriverDocs,
    addNewVehicle,
    updateDriverLocation,
    getDriverNotifications,
    getNewlyGotOrderReqs,
    addDriverDetails,
    updateDriverCarDetails,
    addDriverPaymentDetails,
    getDriverPaymentDetails,
    getDriverPersonelDetails,
    getDriverVehiclesDetails,
    getDriverSingleVehicleDetails,
    updateDriverProfile,
    updateDriverSingleVehicleDetails,
    getDriverProfile,
    updateDriverDetails,
    getDriverDocs,
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
router.post('/api/driver/signin', signInDriver)


// Upadte verification Stataus
router.put('/api/driver/changeVerifyStatus/:id', updateUserStatus);

// Update driver's documents
router.put('/api/driver/addDocuments/:id', cpUpload, addDriverDocs);

// getting driver's documents
router.get('/api/driver/getDocuments/:id', getDriverDocs);

// Update driver info
router.put('/api/driver/addVehicle/:id', addNewVehicle);

// adding driver profile Info
router.put('/api/driver/addOwnerDetails/:id', addDriverDetails);

// updating driver profile Info
router.put('/api/driver/updateOwnerDetails/:id', updateDriverDetails);

// Update driver car details info
router.put('/api/driver/updateCarDetails/:id', updateDriverCarDetails);

// Update driver payment details
router.put('/api/driver/addPaymentDetails/:id', addDriverPaymentDetails);

// Update driver payment details
router.get('/api/driver/getPaymentDetails/:id', getDriverPaymentDetails);

// Update driver location
router.put('/api/driver/updateLocation/:id', updateDriverLocation);

// Update driver vehicle detail Single
router.put('/api/driver/updateVehicleDetails/:id/:owner', updateDriverSingleVehicleDetails);

// get driver perosnel details
router.get('/api/driver/getPersonelDetails/:id', getDriverPersonelDetails)

// get driver vehicle details
router.get('/api/driver/getVehicleDetails/:id', getDriverVehiclesDetails)

// get driver single vehicle detail
router.get('/api/driver/getSingleVehicleDetails/:id/:owner', getDriverSingleVehicleDetails)

// get driver notofications
router.get('/api/driver/getNotifications/:id', getDriverNotifications)

// get driver request accepted by customers
router.get('/api/driver/getAcceptedReqsFromCust/:id', getNewlyGotOrderReqs)

// Update driver profile
router.put('/api/driver/updateProfile/:id', upload.single("profilePic") , updateDriverProfile);

// getting driver profile info
router.get('/api/driver/getProfileDetails/:id', getDriverProfile);


module.exports = router;