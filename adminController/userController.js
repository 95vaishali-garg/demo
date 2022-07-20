var userModel = require('../models/userTable.js');
var jwt = require('jsonwebtoken');
var authroute = require('../middleware/auth.js');
const userHelper = require('../helper/user');
const ObjectId = require('objectid');

module.exports = {

    addAdmin: async (req, res) => {
        try {
            const { email, password, mobileNumber, name } = req.body;
            const role = req.body.role.toUpperCase();
            if (!email) return res.json({ status: 0, message: 'Email is required.' });
            if (!role) return res.json({ status: 0, message: 'Role is required.' });
            if (!name) return res.json({ status: 0, message: 'Name is required.' });
            if (!password) return res.json({ status: 0, message: 'Password is required.' });
            //if(!status) return res.json({ status: 0, message: 'Status is required.' });
            const newPassword = require('crypto').createHash('sha256').update(password).digest('hex');
            userModel.update({ email: email }, { name: name, email: email, role: role, password: newPassword, mobileNumber: mobileNumber, customerStatus: "Active" }, { upsert: true }, function (err, data) {
                if (err) {
                    return res.json({ status: 0, message: 'Error in role change query.', err: err });
                }
                else {
                    return res.json({ status: 1, message: 'Successfully updated.' })
                }
            });
        } catch (error) {
            return res.json({ status: 0, message: 'Error in add admin', error: error });
        }
    },



    getAllAdminList: async (req, res) => {
        try {
            var verifydata = await authroute.validateAdmin(req.headers);
            if (verifydata == null) {
                return res.status(401).json({ "message": "Not Authorized!", "data": {}, "error": {} });
            }
            userModel.find({ $or: [{ role: "ADMIN" }, { role: "SUBADMIN" }] }, function (err, data) {
                if (err) return res.json({ status: 0, message: 'Error in admin find query' });
                else {
                    return res.json({ status: 1, data: data });
                }
            });
        } catch (error) {
            return res.json({ status: 0, message: 'Error in get all admin list', error: error });
        }
    },


    editAdmin: async (req, res) => {
        try {
            var verifydata = await authroute.validateAdmin(req.headers);
            if (verifydata == null) {
                return res.status(401).json({ "message": "Not Authorized!", "data": {}, "error": {} });
            }
            const { userId, role, permissions, email, password, name, status, mobileNumber } = req.body;
            if (!ObjectId.isValid(userId)) return res.json({ status: 0, message: 'User ID is not valid.' });
            let obj = {};
            if (name) obj.name = name;
            if (role) obj.role = role.toUpperCase();
            if (email) obj.email = email;
            if (status) obj.status = status;
            if (permissions) obj.permissions = permissions;
            if (mobileNumber) obj.mobileNumber = mobileNumber;
            if (password) {
                const newPassword = require('crypto').createHash('sha256').update(password).digest('hex');
                obj.password = newPassword;
            }
            userModel.findOneAndUpdate({ _id: ObjectId(userId) }, { $set: obj }, { new: true }, function (err, data) {
                if (err) return res.json({ status: 0, message: 'Error in admin update query.' });
                else {
                    return res.json({ status: 1, message: 'Successfully updated.', data: data });
                }
            });
        } catch (error) {
            return res.json({ status: 0, message: 'Error in edit admin', error: error });
        }
    },

    adminLogin: async (req, res) => {
        try {
            let data = req.body;
            if (!data.email) {
                return res.status(200).json({ "status": "failure", "message": "Email is required!" });
            }
            if (!data.password) {
                return res.status(200).json({ "status": "failure", "message": "Password is required!" });
            }
            var userc = await userModel.findOne({ email: data.email });

          
            var checkPassword = require('crypto').createHash('sha256').update(data.password).digest('hex');
            if (userc != null && checkPassword === userc.password) {
            console.log("password",data.password)
             userModel.adminLogin(data, async (err, resdata) => {
                console.log(resdata , "resdata");
                if (resdata.length > 0) {
                    let token = jwt.sign({ email: resdata[0].email, mobileNumber: resdata[0].mobileNumber }, 'secret', { expiresIn: "2h" });
                    userModel.updateAdminToken(resdata[0].email, token, async (err, userdata) => {
                        return res.status(200).json({ "status": "success", "message": "Login successful!", data: userdata });
                    });
                } else {
                    return res.status(200).json({ "status": "failure", "message": "Wrong username or password" });
                }
            })
        }else{
                return res.json(helper.showUnathorizedErrorResponse('WRONG_PASSWORD'));

            }
        } catch (error) {
            console.log("aa",err)
            res.status(200).json({ "message": "Internal server Error", "data": {}, "error": error })
        }
    },

    getUserById: async (req, res) => {
        try {
            var verifydata = await authroute.validateAdmin(req.headers);
            var verifysupport = await authroute.validateSupport(req.headers);
            if (verifydata == null && verifysupport == null) {
                return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
            }
            let userId = req.params.userId;
            userModel.getUserById(userId, (err, data) => {
                if (err) {
                    return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                } else {
                    return res.json(helper.showSuccessResponse('USER_DATA', data));
                }
            })
        } catch (error) {
            return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    getUserWithFilter: async (req, res) => {
        try {
            var verifysupport = await authroute.validateSupport(req.headers);
            var verifydata = await authroute.validateAdmin(req.headers);
            if (verifydata == null && verifysupport == null) {
                return res.status(401).json({ "message": "Not Authorized!", "data": {}, "error": {} });
            }
            const data = req.body;
            const pageSize = data.limit || 10;
            const sortByField = data.orderBy || "createdAt";
            const sortOrder = data.order || -1;
            const paged = data.page || 1;
            let obj = {};
            if (data.fieldName && data.fieldValue) obj[data.fieldName] = { $regex: data.fieldValue || '', $options: 'i' };
            if (data.startDate) obj.createdAt = { $gte: new Date(data.startDate) };
            if (data.endDate) obj.createdAt = { $lte: new Date(data.endDate) };
            if (data.filter) {
                obj['$and'] = [];
                obj['$and'].push({ name: { $regex: data.filter || '', $options: 'i' } })
            }
            if (data.newLetterSubscribe) {
                obj.newLetterSubscribe = data.newsLetterSubscribe
            }
            let count = await userModel.aggregate([{ $match: { role: { $ne: "ADMIN" } } }, { $match: obj }, { $group: { _id: null, count: { $sum: 1 } } }]);
            let totalcount = count.length > 0 ? count[0].count : 0;
            userModel.getUsersWithFilter(obj, sortByField, sortOrder, paged, pageSize, (err, data) => {
                if (err) {
                    return res.status(200).json({ "message": "Error in user query", data: {}, "error": err });
                } else {
                    return res.status(200).json({ "message": "All User", totalcount: totalcount, data: data, "error": {} });
                }
            })
        } catch (err) {
            //console.log(err);
            return res.status(500).json({ "message": "Internal server Error", "error": err })
        }
    },

    addUser: async (req, res) => {
        try {
            var data = req.body;
            var userData, driverData;
            var paramsList = [
                { name: 'name', type: 'string' },
                { name: 'mobileNumber', type: 'string' },
                { name: 'email', type: 'string' },
                { name: 'address', type: 'string' },
                { name: 'password', type: 'string' },
                // { name: 'languageId', type: 'string' }
            ];

            helper.checkRequestParams(data, paramsList, async (response) => {
                if (response.status) {

                    // if (!data.languageId) {
                    //     return res.json(helper.showValidationErrorResponse('LANGUAGE_IS_REQUIRED'));
                    // }

                    // var getLanguage = await Language.getLanguageByIdAsync(data.languageId);

                    // if (getLanguage == null) {
                    //     return res.json(helper.showValidationErrorResponse('NOT_VALID_ID'));
                    // }

                    // data.languageDetails = getLanguage;

                    if (!data.name) {
                        return res.json(helper.showValidationErrorResponse('NAME_IS_REQUIRED'));
                    }

                    if (!data.countryCode) {
                        return res.json(helper.showValidationErrorResponse('CC_IS_REQUIRED'));
                    }
                    // if (!data.gender) {
                    //     return res.json(helper.showValidationErrorResponse('GENDER_IS_REQUIRED'));
                    // }
                    if (!data.mobileNumber) {
                        return res.json(helper.showValidationErrorResponse('MOBILE_NUMBER_IS_REQUIRED'));
                    }
                    data.addedBy = "admin";
                    var mobileExist = await userModel.findOne({ countryCode: data.countryCode, mobileNumber: data.mobileNumber });
                    if (mobileExist) {
                        return res.json(helper.showValidationErrorResponse('MOBILE_NUMBER_IS_ALREADY_EXIST'));
                    }

                    if (!data.email) {
                        return res.json(helper.showValidationErrorResponse('EMAIL_IS_REQUIRED'));
                    }

                    if (!data.address) {
                        return res.json(helper.showValidationErrorResponse('ADDRESS_IS_REQUIRED'));
                    }

                    if (!data.password) {
                        return res.json(helper.showValidationErrorResponse('PASSWORD_IS_REQUIRED'));
                    }
                    if (data.referalCodeFrom) {
                        userData = await userModel.findOne({ referalCodeTo: data.referalCodeFrom });
                        driverData = await Driver.findOne({ referalCodeTo: data.referalCodeFrom });
                        if (userData == null && driverData == null) {
                            return res.json(helper.showValidationErrorResponse('INCORRECT_REFERALCODE'));
                        }
                    }

                    var referalCodeCount = await referalCodeModel.findOne({ name: "countReferal" });
                    // console.log("===check counTrip====", countTrip, countTrip.countOrder);
                    data.referalCount = referalCodeCount.referalNumber + 1;
                    var countOrderUpdate = await referalCodeModel.findOneAndUpdate(
                        { name: "countReferal" },
                        { referalNumber: data.referalCount },
                        { new: true })

                    data.referalCodeTo = helper.tokenGenerator(5) + data.referalCount;

                    var countryCode = '';
                    var userc = null;

                    if (data.fbid == '' && data.gid == '' && data.appleid == '') {

                        var verifytempuser = await tempUser.getTempUserOTP(data);

                        if (verifytempuser == null) {
                            return res.json(helper.showValidationErrorResponse('ENTER_CORRECT_OTP'));
                        }

                        countryCode = verifytempuser.countryCode;

                        data.fbid = null;
                        data.gid = null;
                        data.appleid = null;

                        userc = await userModel.findOne({ mobileNumber: data.mobileNumber });

                    } else {
                        countryCode = data.countryCode;
                        //console.log("check the usaedr reciewved >>>>>>>>>>>> ", data.fbid, 'data.gid   ', data.gid);
                        if (data.fbid) {
                            userc = await userModel.findOne({ fbid: data.fbid });
                        } else if (data.gid) {
                            userc = await userModel.findOne({ gid: data.gid });
                        } else if (data.appleid) {
                            userc = await userModel.findOne({ appleid: data.appleid });
                        } else if (data.mobileNumber) {
                            userc = await userModel.findOne({ mobileNumber: data.mobileNumber });
                        }

                        userc = await userModel.findOne({ email: data.email });

                    }

                    // console.log("check the usaedr reciewved >>>>>>>>>>>> ", userc);

                    if (userc != null) {
                        return res.json(helper.showValidationErrorResponse('USER_EXISTS'));
                    } else {
                        var hashedPassword = require('crypto').createHash('sha256').update(data.password).digest('hex');
                        var userd = {
                            name: data.name,
                            email: data.email,
                            password: hashedPassword,
                            countryCode: countryCode,
                            city: data.city,
                            address: data.address,
                            profileImage: data.profileImage,
                            gender: data.gender,
                            description: data.description,
                            mobileNumber: data.mobileNumber,
                            referalCodeTo: data.referalCodeTo,
                            // languageId: data.languageId,
                            fbid: data.fbid || null,
                            gid: data.gid || null,
                            appleid: data.appleid || null,
                            // languageDetails: data.languageDetails,
                            token: jwt.sign(
                                {
                                    email: data.email,
                                    userId: data.password
                                },
                                'secret',
                                {
                                    expiresIn: "9h"
                                }
                            )
                        }

                        userModel.addUser(userd, async (err, user) => {
                            if (err) {
                                return res.json(helper.showValidationErrorResponse('USER_REGISTER'));
                            } else {
                                var pmwallet = await PMs.getPMsByType({ type: "Wallet", name: "Wallet" });
                                var Wallet = {
                                    "customerId": user._id,
                                    "type": "Wallet",
                                    "name": "Wallet",
                                    "lastd": "Wallet",
                                    "token": null,
                                    "detials": "Wallet Payment Method"
                                }
                                Wallet.logo = pmwallet.logo;
                                POs.addPaymentOptions(Wallet, async (err, resdata) => {
                                    if (err) {
                                        console.log("Error in adding wallet payment", err);
                                    } else {
                                        var walletData, wallet;
                                        if (data.referalCodeFrom) {
                                            walletData = await PO.findOne({ customerId: userData._id, type: "Wallet" });
                                            wallet = {
                                                customerId: userData._id,
                                                customerRefId: userData._id,
                                                walletId: walletData._id
                                            }
                                            await userWallet.addReferalPoints(wallet);
                                        }

                                        // wallet.isReferral = false;
                                        var newWalletData = {
                                            customerId: user._id,
                                            customerRefId: user._id,
                                            walletId: resdata._id
                                        }
                                        var walletId = await userWallet.createWallet(newWalletData);
                                        await userModel.findOneAndUpdate({ _id: user._id }, { $set: { userWallet: walletId._id } }, { new: true });
                                        var paypalcard = await PMs.getPMsByType({ type: "PayPal", name: "PayPal" });
                                        var Paypal = {
                                            "customerId": user._id,
                                            "type": "Paypal",
                                            "name": "Paypal",
                                            "lastd": "Paypal",
                                            "token": null,
                                            "detials": "Paypal Payment Method"
                                        }
                                        Paypal.logo = paypalcard.logo;
                                        var Cash = {
                                            "customerId": user._id,
                                            "type": "Cash",
                                            "name": "Cash",
                                            "lastd": "Cash",
                                            "token": null,
                                            "detials": "Cash Payment Method"
                                        }
                                        var [CashPay, paypalcard] = await Promise.all([
                                            PMs.getPMsByType({ type: "Cash", name: "Cash" }),
                                            PMs.getPMsByType({ type: "PayPal", name: "PayPal" })
                                        ])
                                        Paypal.logo = paypalcard.logo;
                                        Cash.logo = CashPay.logo;
                                        await Promise.all([
                                            POs.addPaymentOptionsPaypal(Paypal),
                                            POs.addPaymentOptionsCash(Cash)
                                        ])

                                        if (data.referalCodeFrom) {
                                            if (driverData) {
                                                wallet = {
                                                    driverId: driverData._id,
                                                    driverRefId: driverData._id,
                                                    walletId: driverData.driverWallet
                                                }
                                                console.log("== before adding refral=====>>>", wallet);
                                                await Promise.all([
                                                    driverWalletModel.addReferalPoints(wallet),
                                                    driverPointHistoryModel.earnedPointsNoCallback(
                                                        {
                                                            driverId: driverData._id,
                                                            userId: user._id,
                                                            type: "earned",
                                                            useBy: "user"
                                                        })
                                                ])

                                            }
                                            if (userData) {
                                                await pointHistoryModel.earnedPointsNoCallback(
                                                    {
                                                        userId: userData._id,
                                                        otherId: user._id,
                                                        type: "earned"
                                                    })
                                            }

                                        }
                                    }

                                });

                                return res.json(helper.showSuccessResponse('USER_REGISTERED_SUCCESS', user));
                            }
                        });
                    }
                } else {
                    return res.json(helper.showParamsErrorResponse(response.message));
                }
            });

        } catch (error) {
            return res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },


    editUser: async (req, res) => {
        try {
            var verifydata = await authroute.validateAdmin(req.headers);
            if (verifydata == null) {
                return res.status(401).json({ "message": "Not Authorized!", "data": {}, "error": {} });
            }
            const { userId, name, mobileNumber, email, password, address } = req.body;
            let files = req.files;
            if (!userId) return res.json({ status: 0, message: 'userId is reuired.' });
            if (!ObjectId.isValid(userId)) return res.json({ status: 0, message: 'UserId is not valid.' });
            let obj = {};
            if (name) obj.name = name;
            if (email) obj.email = email;
            if (mobileNumber) obj.mobileNumber = mobileNumber;
            if (address) obj.address = address;
            if (password) {
                let newPassword = require('crypto').createHash('sha256').update(password).digest('hex');
                obj.password = newPassword;
            }
            obj.updatedAt = new Date();
            if (files && Object.keys(files).length !== 0) {
                userHelper.awsImagesSave(files, function (imageResult) {
                    if (imageResult.status == 0) {
                        return res.json({ status: 0, message: 'Error in Image Path.' });
                    }
                    else {
                        obj.profileImage = imageResult.data;
                        userModel.findOneAndUpdate({ _id: userId }, obj, { new: true }, function (err, data) {
                            if (err) {
                                //console.log("Error",err);
                                return res.json({ status: 0, message: 'Error in update query' });
                            }
                            else {
                                return res.json({ status: 1, data: data, message: 'Successfuly updated.' });
                            }
                        });
                    }
                })
            } else {
                userModel.findOneAndUpdate({ _id: userId }, obj, { new: true }, function (err, data) {
                    if (err) {
                        return res.json({ status: 0, message: 'Error in update query' });
                    }
                    else {
                        return res.json({ status: 1, data: data, message: 'Successfuly updated.' });
                    }
                });
            }
        } catch (error) {
            //console.log(error);
            return res.json({ status: 0, message: 'Error in update query' });
        }
    },

    removeUser: async (req, res) => {
        try {
            var verifydata = await authroute.validateAdmin(req.headers);
            if (verifydata == null) {
                return res.status(401).json({ "message": "Not Authorized!", "data": {}, "error": {} });
            }
            userModel.remove({ _id: req.body.id }, function (err) {
                if (!err) {
                    return res.json({ message: 'Successfully deleted.' });
                }
                else {
                    return res.json({ status: 0, message: 'Error in delete query' });
                }
            });
        } catch (error) {
            return res.json({ status: 0, message: 'Error in remove query' });
        }
    },

    blockUnBlockCustomer: async (req, res) => {
        var verifydata = await authroute.validateAdmin(req.headers);
        if (verifydata == null) {
            return res.status(200).json({ "status": "failure", message: "Not Authorized! Please logout and login!", data: {}, error: {} })
        }
        const { customerId, isBlock } = req.body;
        if (!ObjectId.isValid(customerId)) return res.json({ status: 0, message: 'Customer id is not valid' });
        userModel.findOneAndUpdate({ _id: ObjectId(customerId) }, { $set: { isBlocked: isBlock } }, { new: true }, function (err, data) {
            if (err) {
                return res.json({ status: 0, message: 'Error in status change query.' });
            }
            else {
                return res.json({ status: 1, message: 'Successfully updated.', data: data });
            }
        });
    },

    allCustomers: async (req, res) => {
        var verifydata = await authroute.validateAdmin(req.headers);
        if (verifydata == null) {
            return res.status(200).json({ "status": "failure", message: "Not Authorized! Please logout and login!", data: {}, error: {} })
        }
        userModel.getAllUserForNotifcation({}, (err, users) => {
            if (err) {
                return res.json({ status: 0, message: 'Error in get query.' });
            } else {
                return res.json({ status: 1, message: 'All users', data: users });
            }
        })
    },

    adminPermission: async (req, res) => {
        try {
            var data = req.body;
            var verifydata = await authroute.validateAdmin(req.headers);
            if (verifydata == null) {
                return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
            }

            if (!data.adminId) {
                return res.json({ status: 0, message: 'Admin id is required' });
            }

            if (!data.permissions) {
                data.permissions = [];
            }

            userModel.findOneAndUpdate(
                { _id: data.adminId },
                { permissions: data.permissions },
                { new: true }
            ).exec((err, permission) => {
                if (err) {
                    return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                } else {
                    return res.json(helper.showSuccessResponse('DATA_SUCCESS', permission));
                }
            });
        }
        catch (err) {
            return res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    }
}
