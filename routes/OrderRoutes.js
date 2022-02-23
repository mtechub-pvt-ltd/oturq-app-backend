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
    getAllOrdersOfCustomer,
    getSingleOrderOfCustomer,
    deleteSingeleOrder,
    getSingleOrderforDriver,
    getAllPendingOrdersOfDriver,
    getAllCompletedOrdersOfDriver,
    makeStripePayment,
    orderCollctedByDriver,
    deleteSingeleOrderByDriver,
    cancelOrderByMerchent,
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

// get All orders of a customer
router.get('/api/order/getOrdersOfCustomers/:id', getAllOrdersOfCustomer);

// get Single order of a customer
router.get('/api/order/getSingleOrderOfCustomer/:postedBy/:id', getSingleOrderOfCustomer);

// get Single order for a driver
router.get('/api/order/getSingleOrderForDriver/:id', getSingleOrderforDriver);

// get all pending orders of a driver
router.get('/api/order/getPendingOrdersOfDriver/:id', getAllPendingOrdersOfDriver);

// get all cancelled orders of a driver
router.get('/api/order/getCompletedOrdersOfDriver/:id', getAllCompletedOrdersOfDriver);

// delete Single order of a customer
router.delete('/api/order/deleteOrderOfCustomer/:postedBy/:id', deleteSingeleOrder);

// sending respnse to driver's request
router.put('/api/order/acceptDriverRequest/:id/:driverId', acceptDriverRequest);

// Order Collected By Driver
router.put('/api/order/orderCollectedByDriver/:id/:recievedBy', orderCollctedByDriver);

// starting order
router.put('/api/order/startOrder/:id/:driverId', orderAcceptByDriver);

// chnage order status
router.put('/api/order/changeStatus/:id/:driverId', changeOrderStatus);

// cancel order by driver
router.put('/api/order/cancelOrderByDriver/:id/:recievedBy', deleteSingeleOrderByDriver);

// cancel order by merchent
router.put('/api/order/cancelOrderByMerchent/:id/:postedBy', cancelOrderByMerchent);

//  make Stripe Pyament
router.put('/api/order/makePayment', makeStripePayment);

// ordr confirm reached by driver
router.put('/api/order/orderReached/:id/:driverId', upload.single("orderRecieptPic"), orderCompletedByDriver);



module.exports = router;