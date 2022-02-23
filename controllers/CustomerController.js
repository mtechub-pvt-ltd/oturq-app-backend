const Customers = require('../models/CustomerSchema')
// const PlayLists = require('../models/PlayListSchema')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const mongoose = require("mongoose")
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const stripe = require('stripe')(process.env.Stripe_Secret_key)
const URL = "http://localhost:8080"



// Sign In user  (New Api)
const SignInUser = async (req, res) => {
    const {
        phoneNo
    } = req.body;

    if (!phoneNo) {
        return res.json({
            success: false,
            message: "Phone No Not Found"
        });
    } else {
        // checking if phone is complete or not
        let no = phoneNo.toString()
        if (no.length > 12) {
            return res.json({
                success: false,
                message: "Phone No is InValid Found"
            });
        }

        let check = await Customers.find({
                phoneNo: phoneNo
            })

        // if customer already exists
        if (check.length > 0) {
            let isExist = await Customers.findOne({phoneNo : phoneNo} , {fullname : 1 , lastname : 1 , phoneNo : 1 , whatsAppNo : 1 , profilePic : 1 , verifyStatus : 1})

            if (isExist.verifyStatus === false) {
                return res.json({
                    success: false,
                    message: "User Can Not Sign In, As User has Not Been Verified Yet"
                })
            }

            const token = jwt.sign({
                id: isExist._id
            }, JWT_SECRET_KEY, {
                expiresIn: '24h'
            }); // gentating token


             return res.json({
                 myResult: isExist,
                 success: true,
                 token
             });
        } else {
            let newUser = new Customers({
                    ...req.body
                })

            try {
                await newUser.save();

                res.status(201).json({
                    succes: true,
                    userId : newUser._id,
                    message: 'User SuccessFully Added'
                })
            } catch (error) {
                console.log("Error in addNewUser and error is : ", error)
                res.status(201).json({
                    success: false,
                    error
                })
            }
        }
    }
}

// Logging In User
const LogInUser = async (req, res) => {
    const {phoneNo} = req.body

    if (!phoneNo) {
        return res.json({
            success: false,
            message: "Phone No Not Found"
        })
    } else {
        try {
            let no = phoneNo.toString()
            if (no.length > 12) {
                return res.json({
                    success: false,
                    message: "InValid Phone No"
                });
            }

            let isExist = await Customers.findOne({phoneNo : phoneNo} , {fullname : 1 , lastname : 1 , phoneNo : 1 , whatsAppNo : 1 , profilePic : 1 , verifyStatus : 1})


            if (!isExist) {
                return res.json({
                    success: false,
                    message: "User Not Found"
                })
            }

            if (isExist.verifyStatus === false) {
                return res.json({
                    success: false,
                    message: "User Can Not Sign In, As User has Not Been Verified Yet"
                })
            }

            const token = jwt.sign({
                id: isExist._id
            }, JWT_SECRET_KEY, {
                expiresIn: '24h'
            }); // gentating token

            return res.json({
                myResult: isExist,
                success: true,
                token
            });
        } catch (error) {
            console.log("Error in LogInUser and error is : ", error)
            return res.json({
                success: false,
                error
            });
        }
    }

}

// uodate user code
const updateUserStatus = async (req, res) => {
    const {id} = req.params;

    if (!id) {
        return res.status(201).json({
            success: false,
            message: 'Customer Id Not found'
        })
    } else {
        let isExist = await Customers.findById(id)

        if (!isExist) {
            return res.json({
                success: false,
                message: 'Customer Id may be Incorrect'
            })
        } else {
            try {
                // checking if user has already been verified
                if (isExist.verifyStatus !== true){
                    isExist.verifyStatus = true;
                    await Customers.findByIdAndUpdate(id, { $set: isExist}, { new: true})

                    res.status(201).json({
                        success: true,
                        message : "User Verification Status Changed. User can Now Sign In"
                    })
                }else{
                    res.status(201).json({
                        success: true,
                        message: "User has Already been Verfied"
                    })
                }
            } catch (error) {
                console.log("Error in updateUserStatus and error is : ", error)
                return res.status(201).json({
                    message: 'Opps An Error Occured',
                    success: false,
                })
            }
        }
    }
}

// uodate Customer Info Only
const updateCustomer = async (req, res) => {
    const {
        id
    } = req.params

    // checking sent file is image or not
    if (req.file) {
        if ((req.file.mimetype !== "image/jpeg" && req.file.mimetype !== "image/jpg" && req.file.mimetype !== "image/webP" && req.file.mimetype !== "image/png")) {
            return res.json({
                success: false,
                message: "Profile Image Not Found"
            });
        }
    }

    // checking if user has sent any data for updating or not
    if ((Object.keys(req.body).length === 0) && (!req.file)) {
        return res.status(201).json({
            success: false,
            message: 'You have not sent any Data for Updation'
        })
    }

    if (!id) {
        return res.status(504).json({
            success: false,
            message: 'Id is Required for Updation '
        })
    } else {
        const isExist = await Customers.findById(id)
        if (!isExist) {
            return res.status(201).json({
                success: false,
                message: 'Customer Id is Incorrect '
            })
        } else {
            try {
                // uploading user profile iamge to multer
                if (req.file) {
                    var lower = req.file.filename.toLowerCase();
                    req.body.profilePic = URL + "/customerPics/" + lower;
                }
                await Customers.findByIdAndUpdate(id, {
                    $set: req.body
                }, {
                    new: true
                })
                res.status(201).json({
                    success: true,
                })

            } catch (error) {
                console.log("Error in updateCustomer and error is : ", error)
                return res.status(504).json({
                    message: 'Opps An Error Occured',
                    success: false
                })
            }
        }
    }
}


// uodate Customer location
const updateCustLocation = async (req, res) => {
    const {
        id
    } = req.params
    const {curntLoc , currentAddress} = req.body;

    // checking if user has sent any data for updating or not
    if ((Object.keys(req.body).length === 0)) {
        return res.status(201).json({
            success: false,
            message: 'You have not sent any Data'
        })
    }

    if (!id || !curntLoc || !currentAddress) {
        return res.status(504).json({
            success: false,
            message: 'Please Provide All Required Credientials'
        })
    } else {
        let  isExist = await Customers.findById(id)
        if (!isExist) {
            return res.status(201).json({
                success: false,
                message: 'Customer Id is Incorrect'
            })
        } else {
            try {
                if (isExist.verifyStatus === false){
                    return res.status(201).json({
                        success: false,
                        message: 'Sorry Operation Could Not Performed as this Customer has not been Verified By this App yet'
                    })
                }
                isExist.curntLoc = curntLoc;
                isExist.currentAddress = currentAddress;
                isExist.activeStatus = true;

                await Customers.findByIdAndUpdate(id, {
                    $set: isExist
                }, {
                    new: true
                })
                res.status(201).json({
                    success: true,
                })

            } catch (error) {
                console.log("Error in updateCustLocation and error is : ", error)
                return res.status(504).json({
                    message: '!!! Opps An Error Occured !!!',
                    success: false
                })
            }
        }
    }
}

// getting customer saved locations
const getUserSavedLocations = async (req, res) => {
    const {
        id
    } = req.params

    if (!id) {
        return res.status(504).json({
            success: false,
            message: 'Customer Id Not Found'
        })
    } else {
        let  isExist = await Customers.findById(id , {myLocations : 1 , _id : 0} )
        if (!isExist) {
            return res.status(201).json({
                success: false,
                message: 'Customer Id is Incorrect'
            })
        } else {
            try {
                res.status(201).json({
                    success: true,
                    locations: isExist
                })

            } catch (error) {
                console.log("Error in getUserSavedLocations and error is : ", error)
                return res.status(504).json({
                    message: '!!! Opps An Error Occured !!!',
                    success: false
                })
            }
        }
    }
}

// getting customer saved locations
const AddUserNewLocations = async (req, res) => {
    const {
        id
    } = req.params
    const {location} = req.body;

    if (!id || !location) {
        return res.status(504).json({
            success: false,
            message: 'Please fill All Required Credientials'
        })
    } else {
        let  isExist = await Customers.findById(id)
        if (!isExist) {
            return res.status(201).json({
                success: false,
                message: 'Customer Id is Incorrect'
            })
        }

        isExist = await Customers.findOne({_id : id , myLocations : { $elemMatch: { $eq : location } }} )
        console.log("isExist : ", isExist)
        if (isExist) {
            return res.status(201).json({
                success: false,
                message: 'Address Already Exists'
            })
        } else {
            try {
                await Customers.findByIdAndUpdate(id , {$push : {myLocations : location}} , {new : true})
                res.status(201).json({
                    success: true,
                })

            } catch (error) {
                console.log("Error in AddUserNewLocations and error is : ", error)
                return res.status(504).json({
                    message: 'Opps An Error Occured',
                    success: false
                })
            }
        }
    }
}


// deleteing from customer saved locations
const updateCustLocations = async (req, res) => {
    const {
        id
    } = req.params
    const {location} = req.body;

    if (!id || !location) {
        return res.status(504).json({
            success: false,
            message: 'Please fill All Required Credientials'
        })
    } else {
        let  isExist = await Customers.findById(id)
        if (!isExist) {
            return res.status(201).json({
                success: false,
                message: 'Customer Id is Incorrect'
            })
        }

        isExist = await Customers.findOne({_id : id , myLocations : { $elemMatch: { $eq : location } }} )
        if (!isExist) {
            return res.status(201).json({
                success: false,
                message: 'This Address Does Not Exist'
            })
        } else {
            try {
                await Customers.findByIdAndUpdate(id , {$pull : {myLocations : location}} , {new : true})
                res.status(201).json({
                    success: true,
                })

            } catch (error) {
                console.log("Error in updateCustLocations and error is : ", error)
                return res.status(504).json({
                    message: 'An Error Occured',
                    success: false
                })
            }
        }
    }
}

// uodate customer location
const updateCustomerLocation = async (req, res) => {
    const {
        id
    } = req.params
    const {curntLoc , currentAddress} = req.body;

    // checking if user has sent any data for updating or not
    if ((Object.keys(req.body).length === 0)) {
        return res.status(201).json({
            success: false,
            message: 'You have not sent any Data'
        })
    }

    if (!id || !curntLoc || !currentAddress) {
        return res.status(504).json({
            success: false,
            message: 'Please Provide All Required Credientials'
        })
    } else {
        let  isExist = await Customers.findById(id)
        if (!isExist) {
            return res.status(201).json({
                success: false,
                message: 'Customer Id is Incorrect'
            })
        } else {
            try {
                if (isExist.verifyStatus === false){
                    return res.status(201).json({
                        success: false,
                        message: 'Sorry Could Not Place Order as this Driver has not been Verified By this App yet'
                    })
                }
                isExist.curntLoc = curntLoc;
                isExist.address = currentAddress;
                isExist.activeStatus = true;

                await Customers.findByIdAndUpdate(id, {
                    $set: isExist
                }, {
                    new: true
                })
                res.status(201).json({
                    success: true,
                })

            } catch (error) {
                console.log("Error in updateCustomerLocation and error is : ", error)
                return res.status(504).json({
                    message: '!!! Opps An Error Occured !!!',
                    success: false
                })
            }
        }
    }
}

// Stripe Payments
const makeStripePayment = async (req, res) => {
    const {
        id,
        duration,
        cardNumber,
        expMM,
        expYY,
        cvv,
        email,
        name
    } = req.body;

    const createdUser = await stripe.customers.create({
        email: email || 'testUser@gmail.com',
        name: name || "123"
    })

    //console.log("createdUser", createdUser)
    if (createdUser) {
        try {
            const token = await stripe.tokens.create({
                card: {
                    number: cardNumber,
                    exp_month: expMM,
                    exp_year: expYY,
                    cvc: cvv
                }
            })
            //console.log("token : ", token)
            const AddingCardToUser = await stripe.customers.createSource(createdUser.id, {
                source: token.id
            })
            //console.log("AddingCardToUser : ", AddingCardToUser)

            let playListPrice = await PlayLists.findById(id, {
                price: 1,
                _id: 0
            });
            let totAmount = 0;
            let cuntDate = new Date();
            let endDate = new Date();
            if (duration === "Monthly") {
                totAmount = playListPrice.price * 30;
                endDate.setDate(cuntDate.getDate() + 30);
            }
            if (duration === "Daily") {
                totAmount = playListPrice.price * 1;
                endDate.setDate(cuntDate.getDate() + 1);
            }
            if (duration === "Quarterly") {
                totAmount = playListPrice.price * 120;
                endDate.setDate(cuntDate.getDate() + 120);
            }
            if (duration === "Yearly") {
                totAmount = playListPrice.price * 365;
                endDate.setDate(cuntDate.getDate() + 365);
            }
            const charge = await stripe.charges.create({
                amount: totAmount * 100,
                description: 'Dream App Service Charges',
                currency: 'USD',
                customer: createdUser.id,
                //card: token.id
            })
            //console.log("SuccessFull Charged : ", charge)
            // const invoice = await stripe.invoices.sendInvoice(charge.id);
            // console.log("invoice", invoice)

            // Sending mail to User
            // step 01
            const transport = nodeMailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.myEmail, //own eamil
                    pass: process.env.myPassword, // own password
                }
            })
            // setp 02
            const mailOption = {
                from: process.env.myEmail, // sender/own eamil
                to: email, // reciver/admin eamil
                subject: "!! E-Learning App !! Pyament for Subscription of a PlayList.",
                text: `Dear User. \n E-learning App has Charged Amount of (${totAmount}) from your stripe account for their subscription. \n Thanks.`
            }
            // step 03
            transport.sendMail(mailOption, (err, info) => {
                if (err) {
                    console.log("Error occured : ", err)
                    return res.json({
                        success: false,
                        mesage: "Error in sending mail",
                        err
                    })
                } else {
                    console.log("Email Sent to user SuccessFully : ", info.response)
                }
            })

            // Sending mail to Admin
            // setp 02
            const mailOptionOne = {
                from: process.env.myEmail, // sender/own eamil
                to: process.env.myEmail, // reciver/admin eamil
                subject: "!! E-Learning App !! Pyament Recieved for Subscription of a PlayList.",
                text: `Dear Admin. \n A User has been Charged Amount of (${totAmount}) for his/her subscription. \n Thanks.`
            }
            // step 03
            transport.sendMail(mailOptionOne, (err, info) => {
                if (err) {
                    console.log("Error occured : ", err)
                    return res.json({
                        success: false,
                        mesage: "Error in sending mail",
                        err
                    })
                } else {
                    console.log("Email Sent to Admin SuccessFully : ", info.response)
                }
            })

            // updating user data
            let puchasedPlayListItem = {
                id: id,
                duration: duration,
                endDate: endDate
            }
            let randomNo = (Math.floor(Math.random() * 1000000) + 1000000).toString().substring(1);
            let myOrder = {
                orderId: randomNo,
                total: totAmount,
            }

            await Users.findOneAndUpdate({
                email: email
            }, {
                $push: {
                    puchasedPlayList: puchasedPlayListItem,
                    orders: myOrder
                }
            }, {
                new: true
            })

            return res.status(201).json({
                success: true,
                message: "Payment Charged Successfully and also a mail has been sent to User as well as Admin."
            });
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
            return res.status(501).json({
                success: false,
                message: `Error in ${error.type} and error is :  ${error.message}`
            });
        }
    }
}


module.exports = {
    SignInUser,
    LogInUser,
    updateUserStatus,
    updateCustomer,
    updateCustLocation,
    updateCustomerLocation,
    AddUserNewLocations,
    getUserSavedLocations,
    updateCustLocations
}