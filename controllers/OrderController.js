const Customers = require('../models/CustomerSchema')
const Drivers = require('../models/DriverSchema')
const Orders = require('../models/OrderSchema')
const mongoose = require("mongoose")
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const stripe = require('stripe')(process.env.Stripe_Secret_key)


// adding new order
const addNewOrder = async (req, res) => {
    const {
        postedBy,
        vehicleType,
        pickUpLoc,
        dropLoc,
        pickUpAddress,
        dropAddress,
        priceOfOrder,
        timeAlloted,
        senderPhoneNo,
        recieverPhoneNo,
        customerNotes
    } = req.body;


    // checking if sent files are of image type or not
    if (req.files) {
        for (let i = 0; i != req.files.length; i++){
            if ((req.files[i].mimetype !== "image/jpeg" && req.files[i].mimetype !== "image/jpg" && req.files[i].mimetype !== "image/webP" && req.files[i].mimetype !== "image/png")) {
                return res.json({
                    success: false,
                    message: "Image Not Found"
                });
            }
        }
    }


    if (!postedBy || !vehicleType || !pickUpLoc || !dropLoc || !pickUpAddress || !dropAddress || !priceOfOrder || !timeAlloted  ) {
        return res.json({message : "Please fill All required credentials"});
    }else{
        // calculating difernce between locations
        //const distabceBtTwoPoints = calcCrow(pickUpLoc[0], pickUpLoc[1], dropLoc[0], dropLoc[1]);

        const newOrder = new Orders({ ...req.body })
        try {
            const addedOrder = await newOrder.save();
            var id = addedOrder._id.toString()
            console.log("id : ", id)

            // sending request to online drivers in 10 km radius
            let check = await sendDriverNotifications(pickUpLoc[0], pickUpLoc[1], id)
            console.log("check : " , check , "added Order : ", addedOrder)
            if (check !== "Done") {
                return res.status(504).json({success: false,  message: 'Request Not Sent to Drivers' })
            }

            return res.status(201).json({success: true,  message: 'Order Placed SuccessFully, Please wait for Drivers Response.Thanks' })

        }catch (error) {
            console.log("Error in addNewOrder and error is : ", error)
        }
    }
}

// get all active cutomers in loc bewteen
const sendDriverNotifications = async (lat1,long1,id) => {
    var distance;
    try {
        const allDrivers = await Drivers.find({activeStatus : true}); // getting only online drivers

        for (var i = 0; i !== allDrivers.length; i++) {
            distance = await calcCrow(lat1, long1, allDrivers[i].curntLoc[0], allDrivers[i].curntLoc[1]);
            if(distance < 10){ // puts drivers which are less than 10 km in array
                await Drivers.findByIdAndUpdate(allDrivers[i]._id ,{ $push : {availOrders : id }  }  , {new: true} )
            }
            console.log("distance : ", distance)
        }

        return "Done";
  }catch (e) {
    console.log("Errr  is : ", e.message);
    return "Not Done"
  }
}

// adding driver responses
const addDriversReponses = async (req,res) => {
    const {id} = req.params;
    const {price, estTime , orderId} = req.body;

    // checking if user has sent any data for updating or not
    if ((Object.keys(req.body).length === 0)) {
        return res.status(201).json({
            success: false,
            message: 'You have not sent any Data'
        })
    }

    if (!price || !estTime || !orderId || !id) {
        return res.status(201).json({
            success: false,
            message: 'Please fill all Required Credientials'
        })
    }else{
        try {
            let gotOrder = await Orders.findById(orderId);
            if (!gotOrder){
                return res.status(201).json({
                    success: false,
                    message: 'Order Not Found'
                })
            }else{
                if(gotOrder.status === true){
                    return res.status(201).json({
                        success: true,
                        message: 'Sorry, Could Not Send Request as Order has been Started by Some on Else'
                    })
                }
                let respondedDrivers = {};
                respondedDrivers.id = id;
                respondedDrivers.estTime = estTime;
                respondedDrivers.price = price;

                gotOrder.respondedDrivers.push(respondedDrivers)

                await Orders.findByIdAndUpdate(orderId ,{ $set : gotOrder }  , {new: true} )

                return res.status(201).json({
                    success: true,
                    message: 'Request Sent To Customer SuccessFully'
                })
            }
        }catch (e) {
            console.log("Errr  is : ", e.message);
            return res.status(201).json({
                success: true,
                message: 'Could Not Send Request to Customer'
            })
        }
    }

}

// getting driver responses
const getDriversReponses = async (req,res) => {
    const {id} = req.params;

    if (!id) {
        return res.status(201).json({
            success: false,
            message: 'Order Id Not Found'
        })
    }else{
        try {
            let responses = await Orders.aggregate([{
                    $match: {
                        _id: mongoose.Types.ObjectId(id),
                    },
                },
                {
                    $lookup: {
                        from: 'oturqappdrivers',
                        localField: 'respondedDrivers.id',
                        foreignField: '_id',
                        as: 'respondedDrivers'
                    },
                },
            ]).sort({
                respondedDrivers: 0
            });

            return res.status(201).json({
                success: true,
                responses,
            })

        }catch (e) {
            console.log("Errr  is : ", e.message);
            return res.status(201).json({
                success: false,
                message: 'Could Not get Responses'
            })
        }
    }

}

// accepting Driver's Request
const acceptDriverRequest = async (req,res) => {
    const {id , driverId} = req.params;


    if (!id || !driverId) {
        return res.status(403).json({
            success: false,
            message: 'Please Provide All Required Credientials'
        })
    }else{
        try {
            const gotOrder = await Orders.findById(id);
            if (!gotOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'Order Not Found'
                })
            }

            let gotDriver = await Drivers.findById(driverId);
            if (!gotDriver){
                return res.status(404).json({
                    success: false,
                    message: 'Driver Not Found'
                })
            }
            gotDriver.gotResponseFromCust.push(id)

            await Drivers.findByIdAndUpdate(driverId ,{ $set : gotDriver }  , {new: true} )


            return res.status(201).json({
                success: true,
                message : "Response Sent to Driver SuccessFully"
            })

        }catch (e) {
            console.log("Errr in acceptDriverRequest and error  is : ", e.message);
            return res.status(201).json({
                success: false,
                message: 'Could Not get Responses'
            })
        }
    }

}

//  Driver accepting order
const orderAcceptByDriver = async (req,res) => {
    const {id , driverId} = req.params;


    if (!id || !driverId) {
        return res.status(403).json({
            success: false,
            message: 'Please Provide All Required Credientials'
        })
    }else{
        try {
            const gotOrder = await Orders.findById(id);
            if (!gotOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'Order Not Found'
                })
            }

            let gotDriver = await Drivers.findById(driverId);
            if (!gotDriver){
                return res.status(404).json({
                    success: false,
                    message: 'Driver Not Found'
                })
            }
            if(gotOrder.status === true){
                return res.status(201).json({
                    success: false,
                    message: 'Order has Already Been Started'
                })
            }
            gotOrder.status = true;
            gotOrder.recieverId = driverId;
            await Orders.findByIdAndUpdate(id ,{ $set : gotOrder }  , {new: true} )

            gotDriver.pendingOrders.push(id)
            await Drivers.findByIdAndUpdate(driverId ,{ $set : gotDriver }  , {new: true} )

            return res.status(201).json({
                success: true,
                message : "Order has Been Started"
            })

        }catch (e) {
            console.log("Errr in orderAcceptByDriver and error  is : ", e.message);
            return res.status(201).json({
                success: false,
                message: 'Could Not get Responses'
            })
        }
    }

}

// Converts numeric degrees to radians
function toRad(Value) {
    return Value * Math.PI / 180;
}
// functions finds distance bwteen two lats and langs and returns radius in kms
function calcCrow(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = toRad(lat2 - lat1);
    var dLon = toRad(lon2 - lon1);
    var lat1 = toRad(lat1);
    var lat2 = toRad(lat2);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d.toFixed(1);
}

module.exports = {
    addNewOrder,
    addDriversReponses,
    getDriversReponses,
    acceptDriverRequest,
    orderAcceptByDriver
}