const express = require('express');
const router = express.Router();
const {
    addNewOrder,
    addDriversReponses,
    getDriversReponses,
    acceptDriverRequest,
    orderAcceptByDriver,
    changeOrderStatus,
    orderCompletedByDriver,
} = require('../controllers/OrderController')
const multer = require("multer")
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './ordersPics/')
        //cb(null, '../products')
    },
    filename: function (req, file, cb) {
        cb(null, 'order-' + Date.now() + file.originalname)
    }
})
const upload = multer({
    storage: storage,
});



// Adding new order
router.post('/api/order/addNew', upload.array('orderPhotos', 12), addNewOrder);


// add Driver respinses on order
router.put('/api/order/addResponses/:id', addDriversReponses);

// get Responded Drivers Notification
router.get('/api/order/getResponses/:id', getDriversReponses);

// sending respnse to driver's request
router.put('/api/order/acceptDriverRequest/:id/:driverId', acceptDriverRequest);

// starting order
router.put('/api/order/startOrder/:id/:driverId', orderAcceptByDriver);

// chnage order status
router.put('/api/order/changeStatus/:id/:driverId', changeOrderStatus);

// ordr confirm reached by driver
router.put('/api/order/orderReached/:id/:driverId', upload.single("orderRecieptPic"), orderCompletedByDriver);



module.exports = router;