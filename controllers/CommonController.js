const Customers = require('../models/CustomerSchema')
const Drivers = require('../models/DriverSchema')
const mongoose = require("mongoose")
const jwt = require('jsonwebtoken');
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY


// Sign Up new User
const addNewUser = async (req, res) => {
    const {
        phoneNo
    } = req.body;

    const {type} = req.params;

    // checking if provided type is correct or not
    if(type !== "customer" && type !== "driver"){
        return res.status(201).json({
            success: false,
            message: 'Provided User Type is InValid'
        })
    }

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

        let check;
        if(type == "customer"){
             check = await Customers.find({
                phoneNo: phoneNo
            })
        }else{
            check = await Drivers.find({
                phoneNo: phoneNo
            })
        }

        if (check.length > 0) {
            return res.json({
                success: false,
                message: 'User Already Exists'
            })
        } else {
            let newUser;
            if (type == "customer") {
                newUser = new Customers({
                    ...req.body
                })
            }else{
                newUser = new Drivers({
                    ...req.body
                })
            }
            
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
    const {type} = req.params;

    // checking if provided type is correct or not
    if(type !== "customer" && type !== "driver"){
        return res.status(201).json({
            success: false,
            message: 'Provided User Type is InValid'
        })
    }

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

            let isExist;
            if (type == "customer") {
                isExist = await Customers.findOne({phoneNo : phoneNo} , {fullname : 1 , lastname : 1 , phoneNo : 1 , whatsAppNo : 1 , profilePic : 1 , verifyStatus : 1})
            }else{
                isExist = await Drivers.findOne({phoneNo : phoneNo} , {name : 1 , familyName : 1 , phoneNo : 1 , whatsAppNo : 1 , profilePic : 1 , verifyStatus : 1})
            }

            if (!isExist) {
                return res.json({
                    success: false,
                    message: "User Not Found"
                })
            }

            if (isExist.verifyStatus == undefined) {
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
const updateUserCode = async (req, res) => {
    const {codeRecieved} = req.body
    const {type , id} = req.params;

    // checking if provided type is correct or not
    if(type !== "customer" && type !== "driver"){
        return res.status(201).json({
            success: false,
            message: 'Provided User Type is InValid'
        })
    }
    if (!codeRecieved || !id) {
        return res.status(201).json({
            success: false,
            message: 'Please Fill All Required Credientials'
        })
    } else {
        let no = codeRecieved.toString()
        if (no.length > 4) {
            return res.json({
                success: false,
                message: "Code Can Not be of More Than 4 Digits"
            });
        }

        let isExist;
        if (type == "customer") {
            isExist = await Customers.findById(id)
        }else{
            isExist = await Drivers.findById(id)
        }

        if (!isExist) {
            return res.json({
                success: false,
                message: 'User Id may be Incorrect'
            })
        } else {
            try {
                isExist.codeRecieved = codeRecieved;

                // checking if user has already been verified
                if (isExist.verifyStatus !== true){
                    isExist.verifyStatus = true;
                    let updatedUser;
                    if (type == "customer") {
                        updatedUser = await Customers.findByIdAndUpdate(id, { $set: isExist}, { new: true})
                    }else{
                        updatedUser = await Drivers.findByIdAndUpdate(id, { $set: isExist}, { new: true})
                    }
    
                    res.status(201).json({
                        success: true,
                        message : "User can Now Sign In"
                    })
                }else{
                    res.status(201).json({
                        success: true,
                        message: "User has Already been Verfied"
                    })
                }
            } catch (error) {
                console.log("Error in updateUserCode and error is : ", error)
                return res.status(201).json({
                    message: '!!! Opps An Error Occured !!!',
                    success: false,
                })
            }
        }
    }
}

// uodate Member  password only
const updateUserPass = async (req, res) => {
    const {
        email
    } = req.params
    if (!email) {
        return res.status(201).json({
            success: false,
            message: 'Email is Required for Updation'
        })
    } else {
        const isExist = await Users.findOne({
            email: email
        })
        if (!isExist) {
            return res.status(201).json({
                success: false,
                message: 'Email is Incorrect'
            })
        } else {
            try {
                if (req.body.password) {
                    req.body.password = await bcrypt.hash(req.body.password, 10); // hashing password
                }

                const updatedUser = await Users.findOneAndUpdate({
                    email: email
                }, {
                    $set: req.body
                }, {
                    new: true
                })
                res.status(201).json({
                    success: true,
                })
            } catch (error) {
                console.log("Error in updateUserPass and error is : ", error)
                return res.status(201).json({
                    message: '!!! Opps An Error Occured !!!',
                    success: false,
                    error
                })
            }
        }
    }
}


///    Admin     Operations      /////




// get all Users
const getAllUsers = async (req, res) => {
    try {
        const allUsers = await Users.find({}, {
            password: 0,
            otpCode: 0,
            codeSentTime: 0,
            orders: 0,
            updatedAt: 0,
            __v: 0
        });
        if (!allUsers) {
            return res.json({
                success: false,
                message: 'No User Found ',
            });
        } else {
            return res.json({
                allUsers,
                success: true,
            });
        }
    } catch (error) {
        console.log("Error in getAllUsers and error is : ", error)
        return res.json({
            error,
            success: false,
        });
    }
}

// get single User for admin
const getSingleUserAmdin = async (req, res) => {
    const {
        id
    } = req.params;
    try {
        const singleUser = await Users.findById(id, {
            password: 0,
            otpCode: 0,
            codeSentTime: 0,
            orders: 0,
            updatedAt: 0,
            __v: 0
        });
        if (!singleUser) {
            return res.json({
                success: false,
                message: 'No User Found ',
            });
        } else {
            return res.json({
                singleUser,
                success: true,
            });
        }
    } catch (error) {
        console.log("Error in getSingleUserAmdin and error is : ", error)
        return res.json({
            error,
            success: false,
        });
    }
}

// get all Recent Users
const getRecentUsers = async (req, res) => {
    try {
        const allUsers = await Users.find({}).limit(4);
        if (!allUsers) {
            return res.json({
                success: false,
                message: 'No Users Found ',
            });
        } else {
            return res.json({
                allUsers,
                success: true
            });
        }
    } catch (error) {
        console.log("Error in getRecentUsers and error is : ", error)
        return res.json({
            error,
            success: false
        });
    }
}

// get Single Users
const getSingleUser = async (req, res) => {
    const {
        id
    } = req.params;

    try {
        const singleUser = await Users.findById(id, {
            otpCode: 0,
            codeSentTime: 0,
            puchasedPlayList: 0,
            orders: 0,
            createdAt: 0,
            updatedAt: 0,
            __v: 0
        })

        if (!singleUser) {
            return res.json({
                success: false,
                message: 'No User Found ',
            });
        } else {
            return res.json({
                singleUser,
                success: true,
            });
        }
    } catch (error) {
        console.log("Error in getSingleUser and error is : ", error)
        return res.json({
            error,
            success: false,
        });
    }
}

// get all Users Count
const getAllUsersCount = async (req, res) => {
    try {
        const count = await Users.find({}).count();
        if (!count) {
            return res.json({
                success: false,
                message: 'No User Found ',
            });
        } else {
            return res.json({
                count,
                success: true,
            });
        }
    } catch (error) {
        console.log("Error in getAllUsersCount and error is : ", error)
        return res.json({
            error,
            success: false,
        });
    }

}

// delete User
const deleteUser = async (req, res) => {
    const {
        id
    } = req.params;
    try {
        const gotUser = await Users.findById(id);
        if (!gotUser) {
            return res.status(201).json({
                success: false,
                message: "No User Found "
            })
        } else {
            // checking if user has any playlist subscription remaining or not
            if (gotUser.puchasedPlayList.length > 0) {
                const curentDate = new Date()
                for (let i = 0; i !== gotUser.puchasedPlayList.length; i++) {
                    if (gotUser.puchasedPlayList[i].endDate > curentDate) {
                        return res.status(403).json({
                            success: false,
                            message: "Sorry, but yu can not delete this User, as User has a Subscription End Date for a PlayList which is greater than Current date. Thanks"
                        })
                    }
                }
            }

            const deletedUser = await Users.findByIdAndDelete(id);
            if (!deletedUser) {
                return res.status(404).json({
                    success: false,
                    message: 'User Not Found ',
                });
            } else {
                return res.status(200).json({
                    success: true,
                });
            }
        }
    } catch (error) {
        console.log("Error in deleteUser and error is : ", error)
        return res.status(504).json({
            success: false,
        });
    }
}


module.exports = {
    addNewUser,
    updateUserCode,
    LogInUser
}