const mongoose = require("mongoose");

const DriverSchema = new mongoose.Schema({
    phoneNo: {
        type: Number,
        required: true,
    },
    codeRecieved: {
        type: Number,
        //required: true,
    },
    verifyStatus: {
        type: Boolean,
        default: false
    },
    name: {
        type: String,
        default: ''
    },
    familyName: {
        type: String,
        default: ''
    },
    whatsAppNo: {
        type: Number,
        default: null
    },
    gender: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
    },
    vehicleDetails : [{
        vehicleType : {
            type: String,
            default : ''
        },
        plateNo: {
            type: String,
            default : ''
        },
        plateCode: {
            type: String,
            default : ''
        },
        yearOfManuf: {
            type: String,
            default : ''
        },
        companyOfManuf: {
            type: String,
            default : ''
        },
        vehicleColor: {
            type: String,
            default : ''
        },
    }],
    paymentDetails: {
        _id : false,
        bankName: {
            type: String,
            default : ''
        },
        accountNo: {
            type: String,
            default : ''
        },
        acctHolderName: {
            type: String,
            default : ''
        },
    },
    documnetsDetails: {  // all images
        _id : false,
        idCardFrontPic: {
            type: String,
            default: ''
        },
        idCardBackPic: {
            type: String,
            default: ''
        },
        lisencePic: {
            type: String,
            default: ''
        },
        ownershipPic: {
            type: String,
            default: ''
        },
    },
    pendingOrders: [{
        type: mongoose.Types.ObjectId,
        ref: 'oturqapporders',
    }],
    completedOrders: [{
        type: mongoose.Types.ObjectId,
        ref: 'oturqapporders',
    }],
    availOrders: [{
        type: mongoose.Types.ObjectId,
        ref: 'oturqapporders',
    }],
    ordersDelivered: {
        type: Number,
        default: '0'
    },
    sales: {
        type: Number,
        default: '0'
    },
    ordersRejected: {
        type: Number,
        default: '0'
    },
    ordersRecieved: {
        type: Number,
        default: '0'
    },
    availCash: {
        type: Number,
        default : '0'
    },
    profilePic: {
        type: String,
        default: ''
    },
    rating: {
        type: Number,
    },
    // curntLoc: { // whenever user signs in his current location is setted in his acc.
    //     type: {
    //         type: String,
    //         default: "Point",
    //     },
    //     coordinates: {
    //         type: [Number], //the type is an array of numbers
    //         //index: "2dsphere"
    //     }
    // },
    curntLoc: { // location of driver
        type: Array
    },
    activeStatus: { // location of driver
        type: Boolean,
        default : false
    },
    gotResponseFromCust : [{
        type: mongoose.Types.ObjectId,
        ref: 'oturqapporders',
    }],
}, {
    timestamps: true
});


const OturqAppDrivers = mongoose.model('OturqAppDrivers', DriverSchema);

module.exports = OturqAppDrivers