const User = require('../models/userTable.js');

const jwt = require('jsonwebtoken');
const authroute = require('../middleware/auth.js');

const validator = require('validator');
const ObjectId = require('objectid');




module.exports = {

    getUsersList: async (req, res) => {
        try {
            User.getUsers((err, resdata) => {
                if (err) {
                    return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                } else {
                    if (resdata.length === 0) {
                        return res.json(helper.showSuccessResponse('NO_DATA_FOUND', []));
                    } else {
                        return res.json(helper.showSuccessResponse('DATA_SUCCESS', resdata));
                    }
                }
            });
        }
        catch (error) {
            console.log("error ", error);
            return res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },


    userRegister: async (req, res) => {
        try {
            var data = req.body;

            if (data.name) {
                data.name = data.name;
                return res.json(helper.showValidationErrorResponse('NAME_IS_REQUIRED'));
            }
            if (data.mobileNumber) {
                if (!data.countryCode) {
                    return res.json(helper.showValidationErrorResponse('CC_IS_REQUIRED'));
                }
             userc = await User.findOne({ countryCode: data.countryCode, mobileNumber: data.mobileNumber });
            }else {
                return res.json(helper.showValidationErrorResponse('USER_MOBILE_NUMBER_EXISTS', userc));
            }
            if (!data.email) {
                return res.json(helper.showValidationErrorResponse('EMAIL_IS_REQUIRED'));
            }
            data.email = data.email.trim().toLowerCase();

            if (!validator.isEmail(data.email)) {
                return res.json(helper.showValidationErrorResponse('EMAIL_INVALID'));
            }

            if (!data.password) {
                return res.json(helper.showValidationErrorResponse('PASSWORD_IS_REQUIRED'));
            }
           data.password= require('crypto').createHash('sha256').update(data.password).digest('hex');

            var userc = null;

             userc = await User.findOne({ email: data.email });
            if (userc != null) {
                return res.json(helper.showValidationErrorResponse('USER_EMAIL_EXISTS'));
            } else {
                User.addUser(data, async (err, user) => {
                    if (err) {
                        return res.json(helper.showValidationErrorResponse('DATABASE_ERROR'));
                    } else {
                        return res.json(helper.showSuccessResponse('USER_REGISTERED_SUCCESS', user));
                    }
                });
            }
        } catch (error) {
            console.log("==internal server error====", error);
            return res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    userLogin: async (req, res) => {
        try {
            var data = req.body;
            if (!data.mobileNumber && !data.email) {
                return res.json(helper.showValidationErrorResponse('MOBILE_OR_EMAIL_REQUIRED'));
            }

            if (data.mobileNumber) {
                if (!data.countryCode) {
                    return res.json(helper.showValidationErrorResponse('CC_IS_REQUIRED'));
                }
                var userc = await User.findOne({ countryCode: data.countryCode, mobileNumber: data.mobileNumber });

                if (userc != null) {
                   
                        data.token = jwt.sign({
                            mobileNumber: userc.mobileNumber,
                            userId: userc._id
                        },
                            'secret', {
                            expiresIn: "9h"
                        });
                       
                        userc.token = data.token;
                      
                       
                }
                else {
                    return res.json(helper.showValidationErrorResponse('INVALID_MOBILE_NUMBER', userc));
                }
            }

            if (data.email) {
                data.email = data.email.trim().toLowerCase();

                if (!validator.isEmail(data.email)) {
                    return res.json(helper.showValidationErrorResponse('EMAIL_INVALID'));
                }

                var userc = await User.findOne({ email: data.email });

                if (!data.password) {
                    return res.json(helper.showValidationErrorResponse('PASSWORD_IS_REQUIRED'));
                }

                try {
                    var hashedPassword = require('crypto').createHash('sha256').update(data.password).digest('hex');
                } catch (err) {
                    console.log('crypto support is disabled!');
                }

                if (userc == null) {
                    return res.json(helper.showUnathorizedErrorResponse('INVALID_LOGIN_CREDENTIALS'));
                }

                if (userc.isBlocked) {
                    return res.json(helper.showValidationErrorResponse('Your account is blocked by admin!'));
                }

              
                if (userc != null && hashedPassword === userc.password) {

                    userc.token = jwt.sign(
                        {
                            email: userc.email,
                            userId: userc._id
                        },
                        'secret',
                        {
                            expiresIn: "9h"
                        }
                    );

                    var mytoken = await User.updateUserToken(userc);

                    return res.json(helper.showSuccessResponse('LOGIN_SUCCESS', mytoken));
                } else {
                    return res.json(helper.showUnathorizedErrorResponse('WRONG_PASSWORD'));
                }
            }
        }
        catch (error) {
            console.log("error ", error);
            return res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },


    changeUserPassword: async (req, res) => {
        try {
            var data = req.body;

            var paramsList = [
                { name: 'password', type: 'string' },
                { name: 'confirmPassword', type: 'string' },
                { name: 'currentPassword', type: 'string' }
            ];

            helper.checkRequestParams(data, paramsList, async (response) => {
                if (response.status) {
                    var verifydata = await authroute.validateUser(req);
                    if (verifydata == null) {
                        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
                    }

                    if (!data.password) {
                        return res.json(helper.showValidationErrorResponse('PASSWORD_IS_REQUIRED'));
                    }

                    if (!data.confirmPassword) {
                        return res.json(helper.showValidationErrorResponse('CNF_PASSWORD_IS_REQUIRED'));
                    }

                    if (!data.currentPassword) {
                        return res.json(helper.showValidationErrorResponse('CURRENT_PASSWORD_IS_REQUIRED'));
                    }

                    var currentPassword = require('crypto').createHash('sha256').update(data.currentPassword).digest('hex');

                    if (currentPassword != verifydata.password) {
                        return res.json(helper.showValidationErrorResponse('PASSWORD_MISSMATCH'));
                    }

                    var passmain = data.password;

                    data.email = verifydata.email;
                    data.password = require('crypto').createHash('sha256').update(data.password).digest('hex');

                    var upass = await User.updatePassword(data);

                   
                    res.json(helper.showSuccessResponse('PASSWORD_CHANGED_SUCCESS', {}));

                } else {

                    res.json(helper.showParamsErrorResponse(response.message));
                }
            });
        } catch (error) {
            console.log("error ", error);
            res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    userUpdateProfile: async (req, res) => {
        try {
            var data = req.body;

            var verifydata = await authroute.validateUser(req);
            if (verifydata == null) {
                return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
            }
            data.userId = verifydata._id;

            if (data.bio) {
                data.bio = data.bio;
            }

            if (data.name) {
                let checkName = {
                    name: data.name,
                    _id: { $ne: data.userId }
                };
                var checkdata = await User.find(checkName);
                if (checkdata.length > 0) {
                    return res.json(helper.showValidationErrorResponse('NAME_ALREADY_EXIST'));
                } else {
                    data.name = data.name;
                }
            }

            if (data.mobileNumber) {
                if (!data.countryCode) {
                    return res.json(helper.showValidationErrorResponse('CC_IS_REQUIRED'));
                }
                let checkMobile = {
                    mobileNumber: data.mobileNumber,
                    countryCode: data.countryCode,
                    _id: { $ne: data.userId }
                };
                var checkMobiledata = await User.find(checkMobile);
                if (checkMobiledata.length > 0) {
                    return res.json(helper.showValidationErrorResponse('MOBILE_NUMBER_IS_ALREADY_EXIST'));
                } else {
                    data.countryCode = data.countryCode;
                    data.mobileNumber = data.mobileNumber;
                }
            }

            if (data.email) {
                data.email = data.email.trim().toLowerCase();

                if (!validator.isEmail(data.email)) {
                    return res.json(helper.showValidationErrorResponse('EMAIL_INVALID'));
                }
                let emailQuery = {
                    email: data.email,
                    _id: { $ne: data.userId }
                }
                var checkEmail = await User.find(emailQuery);
                if (checkEmail.length > 0) {
                    return res.json(helper.showValidationErrorResponse('EMAIL_ALREADY_EXIST'));
                } else {
                    data.email = data.email;
                }
            }

            if (data.address) {
                data.address = data.address;
            }

            if (data.isLikedPost) {
                data.isLikedPost = data.isLikedPost;
            }

            data._id = verifydata._id;
            var updateProfile = await User.updateUserProfile(data);
            //check follower and following user
            let count = await UserFollower.aggregate([
                { $match: {
                    userId: updateProfile._id.toString()
                }},
                { $group: {
                    _id: null,
                    count: { $sum: 1 }
                } 
            }]);
            let totalcount = count.length>0?count[0].count:0;
            console.log("totalcount===", totalcount);
            let count2 = await UserFollower.aggregate([
                { 
                    $match: {
                        followerId:updateProfile._id.toString() 
                    }
                },
                { 
                    $group: { 
                        _id: null, 
                        count: { $sum: 1 } 
                    } 
                }
            ]);
            let totalcount2 = count2.length>0?count2[0].count:0;
            console.log("totalcount2===,,,", totalcount2);

            updateProfile.followerCount = totalcount;
            updateProfile.followingCount = totalcount2;

            res.json(helper.showSuccessResponse('PROFILE_UPDATE_SUCCESS', updateProfile));

        }
        catch (error) {
            console.log("chgeck error ", error);
            res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },


    userLogout: async (req, res) => {
        try {
            var data = req.body;
            var verifydata = await authroute.validateUser(req);
            if (verifydata == null) {
                return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
            }

            data.email = verifydata.email;
            data._id = verifydata._id;

            User.logout(data, (err, loggedout) => {
                if (err || loggedout == null) {
                    return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                }
                else {
                    res.json(helper.showSuccessResponse('LOGOUT_SUCCESS', loggedout));
                }
            });
        }
        catch (err) {
            console.log("err", err);
            res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },




}





