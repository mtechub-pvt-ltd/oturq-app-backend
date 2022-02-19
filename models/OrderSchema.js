const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
    images: [{
        type: String,
        default : ''
    }],
    postedBy: {
        type: mongoose.Types.ObjectId,
        ref: 'oturqappcustomers',
    },
    recieverId: {
        type: mongoose.Types.ObjectId,
        ref: 'oturqappdrivers',
    },
    vehicleType: {
        type: String,
        required : true,
        default: ''
    },
    // pickUpLoc: {
    //     type: {
    //         type: String,
    //         default: "Point",
    //     },
    //     coordinates: {
    //         type: [Number], //the type is an array of numbers
    //         //index: "2dsphere"
    //     },
    //     fromattedAdd: "",
    // },
    pickUpLoc : {
        type : Array
    },
    dropLoc: {
        type: Array
    },
    pickUpAddress: {
        type: String,
        default: ''
    },
    dropAddress: {
        type: String,
        default: ''
    },
    priceOfOrder: {
        type: Number,
        required: true,
        default: '0'
    },
    timeAlloted : {
        type: Number,
    },
    senderPhoneNo: {  // customer phone no
        type: String,
        default: ''
    },
    recieverPhoneNo: {  // this may be some other person to which order is being sent to
        type: String,
        default: ''
    },
    customerNotes: {
        type: String,
        default: ''
    },
    // dropLoc: {
    //     type: {
    //         type: String,
    //         default: "Point",
    //     },
    //     coordinates: {
    //         type: [Number], //the type is an array of numbers
    //         //index: "2dsphere"
    //     },
    //     fromattedAdd: ""
    // },

    respondedDrivers: [{
        id :{
            type: mongoose.Types.ObjectId,
            ref: 'oturqappdrivers',
        },
        rating: {
            type: Number,
            default: '0'
        },
        price : {
            type: Number,
            default : '0'
        },
        estTime: {
            type: String,
            default: ''
        },
    }],
    reviewOfOrder: {
        type: Number,
        default: '0'
    },
    driverGotAmt: {
        type: Number,
        default: '0'
    },
    adminAmt: {
        type: Number,
        default: '0'
    },
    tipAmt: {
        type: Number,
        default: '0'
    },
    orderTravelingStatus: {
        type: String,
        default: ''
    },
    orderStatus: {
        type: String,
        default: ''
    },
    status: { // we will add active , travelling or completed
        type: Boolean,
        default: false
    },
    paymentStatus: {
        type: String,
        default: ''
    },
    ordercancelledByDriver: {
        type: Boolean,
        default: 'false'
    },
    ordercancelledByCustomer: {
        type: Boolean,
        default: 'false'
    },
    orderCancelReason : {
        type: String,
        default: ''
    },
    orderFinalByDriver: {
        type: Boolean,
        default: 'false'
    },
    orderFinalByCustomer: {
        type: Boolean,
        default: 'false'
    },
    orderRecieptPic : {  // pic of order
        type: String,
        default: ''
    },
    confrimOrderReachedByDriver : {
        type: Boolean,
        default: 'false'
    },
    confrimOrderReachedByCust: {
        type: Boolean,
        default: 'false'
    },
}, {
    timestamps: true
});


const OturqAppOrders = mongoose.model('OturqAppOrders', OrderSchema);

module.exports = OturqAppOrders