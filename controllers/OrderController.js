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

        for (let i = 0; i !== req.files.length; i++) {
            var lower = req.files[i].filename.toLowerCase();
            req.body.images = []
            req.body.images.push(lower);
        }

        const newOrder = new Orders({ ...req.body })
        try {
            const addedOrder = await newOrder.save();
            var id = addedOrder._id.toString()

            // sending request to online drivers in 10 km radius
            let check = await sendDriverNotifications(pickUpLoc[0], pickUpLoc[1], id)

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
                await Orders.findByIdAndUpdate(id ,{ $push : {availDrivers : allDrivers[i]._id }  }  , {new: true} )
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
                        as: 'respondedDriver'
                    },
                },
                {$unwind: "$respondedDriver"},
                    {
                        $project: {
                            _id: "$respondedDriver._id",
                            name: "$respondedDriver.name",
                            //rating: "$respondedDriver.rating",
                            OfferedPrice  : "$respondedDrivers.price",
                            EstimatedTime: "$respondedDrivers.estTime",
                            picture: "$respondedDriver.profilePic",
                            // extimatedPrice : "$respondedDrivers.priceOfOrder",
                            // pickUpAddress: "$respondedDrivers.pickUpAddress",
                            // dropAddress: "$respondedDrivers.dropAddress",
                        }
                    }
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

           
            // pulling our order from avail drivers notifications
            for (let i = 0; i !== gotOrder.availDrivers.length; i++){
                //console.log("gotOrder.availDrivers[i] : ", gotOrder.availDrivers[i])
                await Drivers.findByIdAndUpdate(gotOrder.availDrivers[i] ,{ $pull : {availOrders : id }  }  , {new: true} )
            }


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

//  Change order status time by time
const changeOrderStatus = async (req,res) => {
    const {id , driverId} = req.params;
    const {orderStatus} = req.body;

    if (!id || !driverId || !orderStatus) {
        return res.status(403).json({
            success: false,
            message: 'Please Provide All Required Credientials'
        })
    }else{
        try {
            let gotDriver = await Drivers.findById(driverId);
            if (!gotDriver) {
                return res.status(404).json({
                    success: false,
                    message: 'Driver Not Found'
                })
            }

            const gotOrder = await Orders.findOne({_id : id , recieverId : driverId});
            if (!gotOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'Order Not Found'
                })
            }

            if(gotOrder.status === false){
                return res.status(201).json({
                    success: false,
                    message: 'Order has Not Started Yet'
                })
            }

            gotOrder.orderStatus = orderStatus;
            await Orders.findByIdAndUpdate(id ,{ $set : gotOrder }  , {new: true} )

            return res.status(201).json({
                success: true,
                message : "Order Status Changed"
            })

        }catch (e) {
            console.log("Errr in changeOrderStatus and error  is : ", e.message);
            return res.status(201).json({
                success: false,
                message: 'Could Not Update Status'
            })
        }
    }

}

// Order Completed By driver
const orderCompletedByDriver = async (req,res) => {
    const {id , driverId} = req.params;

     // checking if sent files are of image type or not
     if (!req.file) {
        return res.json({
            success: false,
            message: "Reaching Reciept is necessary for order completion"
        });
     }

    // checking if sent files are of image type or not
    if (req.file) {
        if ((req.file.mimetype !== "image/jpeg" && req.file.mimetype !== "image/jpg" && req.file.mimetype !== "image/webP" && req.file.mimetype !== "image/png")) {
            return res.json({
                success: false,
                message: "Image Not Found"
            });
        }
    }


    if (!id || !driverId || !req.file) {
        return res.status(403).json({
            success: false,
            message: 'Please Provide All Required Credientials'
        })
    }else{
        try {
            let gotDriver = await Drivers.findById(driverId);
            if (!gotDriver) {
                return res.status(404).json({
                    success: false,
                    message: 'Driver Not Found'
                })
            }

            const gotOrder = await Orders.findOne({_id : id , recieverId : driverId});
            if (!gotOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'Order Not Found'
                })
            }

            if (gotOrder.orderStatus == "Completed"){
                return res.status(404).json({
                    success: false,
                    message: 'order has already been completed'
                })
            }

            if(gotOrder.status === false){
                return res.status(201).json({
                    success: false,
                    message: 'Order has Not Started Yet'
                })
            }

            if (req.file) {
                var lower = req.file.filename.toLowerCase();
                gotOrder.orderRecieptPic = lower;
            }
            gotOrder.confrimOrderReachedByDriver = true;
            gotOrder.orderStatus = "Completed";
            await Orders.findByIdAndUpdate(id ,{ $set : gotOrder }  , {new: true} )


            gotDriver.completedOrders.push(id)
            await Drivers.findByIdAndUpdate(id ,{ $set : gotDriver }  , {new: true} )

            return res.status(201).json({
                success: true,
                message : "Order has been Reached SuccessFully"
            })

        }catch (e) {
            console.log("Errr in orderCompletedByDriver and error  is : ", e.message);
            return res.status(201).json({
                success: false,
                message: 'Could Not Update Status'
            })
        }
    }

}

// getting all orders of a customer
const getAllOrdersOfCustomer = async (req,res) => {
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
                        postedBy: mongoose.Types.ObjectId(id),
                    },
                },
                {
                    $project: {
                        id : "$_id",
                        orderId: "$orderId",
                        orderStatus: "$orderStatus",
                        timeAlloted: "$timeAlloted",
                        priceOfOrder: "$priceOfOrder",
                        pickUpAddress: "$pickUpAddress",
                        dropAddress: "$dropAddress",
                        _id : 0
                    }
                }
            ]).sort({
                createdAt: 0
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

// getting Single order of a customer
const getSingleOrderOfCustomer = async (req,res) => {
    const {id , postedBy } = req.params;

    if (!id) {
        return res.status(201).json({
            success: false,
            message: 'Order Id Not Found'
        })
    }else{
        try {
            let responses = await Orders.aggregate([{
                    $match: {
                        postedBy: mongoose.Types.ObjectId(postedBy),
                        _id: mongoose.Types.ObjectId(id)
                    },
                },
                {
                    $lookup: {
                        from: 'oturqappdrivers',
                        localField: 'respondedDrivers.id',
                        foreignField: '_id',
                        as: 'respondedDriver'
                    },
                }, {
                    $unwind: "$respondedDriver"
                },
                {
                    $project: {
                        id : "$_id",
                        DriverName: "$respondedDriver.name",
                        ratingOfDriver: "$respondedDriver.rating",
                        DriverPhoto: "$respondedDriver.profilePic",
                        timeAlloted: "$timeAlloted",
                        vehicleType: "$vehicleType",
                        priceOfOrder: "$priceOfOrder",
                        pickUpAddress: "$pickUpAddress",
                        dropAddress: "$dropAddress",
                        customerNotes: "$customerNotes",
                        orderStatus: "$orderStatus",
                        _id : 0
                    }
                }
            ]).sort({
                createdAt: 0
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

// getting Single order for driver
const getSingleOrderforDriver = async (req, res) => {
    const {
        id,
    } = req.params;

    if (!id) {
        return res.status(201).json({
            success: false,
            message: 'Order Id Not Found'
        })
    } else {
        try {
            let responses = await Orders.aggregate([{
                    $match: {
                        _id: mongoose.Types.ObjectId(id)
                    },
                },
                {
                    $project: {
                        id: "$_id",
                        timeAlloted: "$timeAlloted",
                        vehicleType: "$vehicleType",
                        priceOfOrder: "$priceOfOrder",
                        pickUpAddress: "$pickUpAddress",
                        dropAddress: "$dropAddress",
                        customerNotes: "$customerNotes",
                        orderStatus: "$orderStatus",
                        _id: 0
                    }
                }
            ]).sort({
                createdAt: 0
            });

            return res.status(201).json({
                success: true,
                responses,
            })

        } catch (e) {
            console.log("Errr  is : ", e.message);
            return res.status(201).json({
                success: false,
                message: 'Could Not get Responses'
            })
        }
    }

}

//  delete any order
const deleteSingeleOrder = async (req,res) => {
    const {id , postedBy} = req.params;

    if (!id || !postedBy) {
        return res.status(403).json({
            success: false,
            message: 'Please Provide All Required Credientials'
        })
    }else{
        try {
            let gotCustomer = await Customers.findById(postedBy);
            if (!gotCustomer) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer Not Found'
                })
            }

            const gotOrder = await Orders.findOne({_id : id , postedBy : postedBy});
            if (!gotOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'Order Not Found'
                })
            }

            if(gotOrder.status === true){
                if (gotOrder.orderStatus !== '' && gotOrder.orderStatus !== 'Completed') {
                    return res.status(201).json({
                        success: false,
                        message: 'Order has Not Started and Now can not be Deleted Untill It Reaches its Destination.'
                    })
                }
            }

            await Orders.findByIdAndDelete(id)

            return res.status(201).json({
                success: true,
                message : "Order Deleted SuccessFully"
            })

        }catch (e) {
            console.log("Errr in deleteSingeleOrder and error  is : ", e.message);
            return res.status(201).json({
                success: false,
                message: 'Could Not Delete Order'
            })
        }
    }

}


// getting all Pending orders of a deriver
const getAllPendingOrdersOfDriver = async (req,res) => {
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
                        recieverId: mongoose.Types.ObjectId(id),
                        orderStatus : "Pending"
                    },
                },
                {
                    $project: {
                        id : "$_id",
                        orderId: "$orderId",
                        orderStatus: "$orderStatus",
                        timeAlloted: "$timeAlloted",
                        priceOfOrder: "$priceOfOrder",
                        pickUpAddress: "$pickUpAddress",
                        dropAddress: "$dropAddress",
                        _id : 0
                    }
                }
            ]).sort({
                createdAt: 0
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

// getting all cancelled orders of a deriver
const getAllCancelledOrdersOfDriver = async (req,res) => {
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
                        recieverId: mongoose.Types.ObjectId(id),
                        orderStatus : "Cancelled"
                    },
                },
                {
                    $project: {
                        id : "$_id",
                        orderId: "$orderId",
                        orderStatus: "$orderStatus",
                        timeAlloted: "$timeAlloted",
                        priceOfOrder: "$priceOfOrder",
                        pickUpAddress: "$pickUpAddress",
                        dropAddress: "$dropAddress",
                        _id : 0
                    }
                }
            ]).sort({
                createdAt: 0
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


// Stripe Payments
const makeStripePayment = async (req,res) => {
    const { id, cardNumber, expMM, expYY, cvv , email , name} = req.body;
    //console.log("In Stripe : ", id, cardNumber, expMM, expYY, cvv , email , name )

    let gotOrder = await Orders.findById(id);
    if (!gotOrder) {
        return res.json({message: 'Order Does Not Exists'});
    }

    const createdUser = await stripe.customers.create({
        email: email || 'testUser@gmail.com',
        name: name || "123"
    })

    //console.log("createdUser", createdUser)
    if (createdUser)
    {
        try {
            const token = await stripe.tokens.create({ card: {
                number: cardNumber, exp_month: expMM, exp_year: expYY, cvc: cvv } })
           //console.log("token : ", token)
            const AddingCardToUser = await stripe.customers.createSource(createdUser.id, { source: token.id })
            //console.log("AddingCardToUser : ", AddingCardToUser)
            let amtCharged = Math.round(gotOrder.priceOfOrder);
            //console.log("gotOrder.finalAm", gotOrder.finalAmt  , "New Amount : ", amtCharged)
           const charge = await stripe.charges.create({
                amount: amtCharged * 100,
                description: 'Tracakza Trading Services Order Charges',
                currency: 'USD',
                customer: createdUser.id,
                //card: token.id
            })
            //console.log("SuccessFull Charged : ", charge)
            // const invoice = await stripe.invoices.sendInvoice(charge.id);
            // console.log("invoice", invoice)
            let driver = await Drivers.findById(gotOrder.recieverId);
            let drieverAmount = ( priceOfOrder - 25 ) * 100;
            let adminAmt = priceOfOrder - drieverAmount;
            driver.availCash = drieverAmount;
            await Drivers.findByIdAndUpdate(gotOrder.recieverId ,{ $set:  { ...driver} } , {new: true} )

            gotOrder.paymentStatus = true;
            gotOrder.driverGotAmt = drieverAmount;
            gotOrder.adminAmt = adminAmt;
            await Orders.findByIdAndUpdate(id ,{ $set:  { ...gotOrder} } , {new: true} )
            console.log("going to return")
            return res.json({success: true , message : "Payment Charged Successfully"});
        } catch (error) {
            switch (error.type) {
                case 'StripeCardError':
                    // A declined card error
                    console.log(`Error in ${error.type} and error is : `, error.message)
                    error.message; // => e.g. "Your card's expiration year is invalid."
                    break;
                case 'StripeInvalidRequestError':
                    console.log(`Error in ${error.type} and error is : `, error.message)
                    // Invalid parameters were supplied to Stripe's API
                    break;
                case 'StripeAPIError':
                    console.log(`Error in ${error.type} and error is : `, error.message)
                    // An error occurred internally with Stripe's API
                    break;
                case 'StripeConnectionError':
                    console.log(`Error in ${error.type} and error is : `, error.message)
                    // Some kind of error occurred during the HTTPS communication
                    break;
                case 'StripeAuthenticationError':
                    console.log(`Error in ${error.type} and error is : `, error.message)
                    // You probably used an incorrect API key
                    break;
                case 'StripeRateLimitError':
                    console.log(`Error in ${error.type} and error is : `, error.message)
                    // Too many requests hit the API too quickly
                    break;
            }
            return `Error in ${error.type} and error is :  ${error.message}`
        }
    }
}

// calculate and add final amounts
const calacFinalAmt = async (id) => {
    try {
        const gotOrder = await Orders.findById(id);
        if (!gotOrder) {
            return 'Order Does Not Exists'
        }else{
            if (gotOrder.ordercancelledByCustomer === true) {
                    let aw = await orderCancelledByCust(id);
                    if (aw !== "Done") {
                        return ' error Occured while cancelling order from Customer '
                    }
                } else if (gotOrder.ordercancelledByDriver === true) {
                    let ww =  await orderCancelledByDriver(id);
                    if (ww !== "Done") {
                        return  ' error Occured while cancelling order from Driver '
                    }
                }else{
                    let admnAndDriverAmt = await calcAdminAmt(id);
                        if (admnAndDriverAmt !== "Done") {
                            return '!!! error Occured while calculating admin amount !!!'
                        }

                        let adminAmt = await addAmtToAdmin(id);
                        if (adminAmt !== "Done") {
                            return '!!! error Occured while adding amount to Admin !!!'
                        }

                        let driverAmt = await addDriverAmt(id);
                        if (driverAmt !== "Done") {
                            return '!!! error Occured while adding amount to driver !!!'
                        }
                }
            }
    } catch (error) {
        console.log("Error in deductAmtfromCust and error is : ", error)
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
    orderAcceptByDriver,
    changeOrderStatus,
    orderCompletedByDriver,
    getAllOrdersOfCustomer,
    getSingleOrderOfCustomer,
    deleteSingeleOrder,
    getSingleOrderforDriver,
    getAllPendingOrdersOfDriver,
    getAllCancelledOrdersOfDriver,
    makeStripePayment
}