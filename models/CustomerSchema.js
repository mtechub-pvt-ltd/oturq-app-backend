const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema({
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
        //required: true,
        default : false
    },
    fullname: {
        type: String,
        default : ''
    },
    lastname: {
        type: String,
        default: ''
    },
    whatsAppNo: {
        type: Number,
        default: null
    },
    orders: [{
        type: mongoose.Types.ObjectId,
        ref: 'oturqapporders',
    }],
    myLocations: {
        type: [String],
    },
    profilePic: {
        type: String,
        default: ''
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
    curntLoc: { // location of user
        type: Array
    },
    currentAddress: {
        type: String,
        default: ''
    },
}, {
    timestamps: true
});


const OturqAppCustomers = mongoose.model('OturqAppCustomers', CustomerSchema);

module.exports = OturqAppCustomers