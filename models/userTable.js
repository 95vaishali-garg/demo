var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    countryName: { type: String },
    countryCode: { type: String },
    mobileNumber: { type: String },
    dob: { type: String, default: "" },
    password: { type: String, default: null },
    address: { type: String },
    profileImage: { type: String, default: "none" },
    OTP: { type: String },
    OTPexp: { type: Date },
    token: { type: String },

    createdAt: { type: Date },
    UpdatedAt: { type: Date },

    isBlocked: { type: Boolean, default: false },
    role: { type: String, enum: ["USER", "ADMIN", "SUPPERADMIN"], default: 'USER' },

    timezone: { type: String, default: null },
    fbid: { type: String, default: null }, //facebook id
    gid: { type: String, default: null }, //google id
    appleid: { type: String, default: null }, //apple id
    instaid: { type: String, default: null }, //Insta id
    tid: { type: String, default: null }, //Twiter id
    instagramConnect: { type: String, default: null },
    firebaseToken: { type: String, default: null },
    socketId: { type: String },
    socketConnectedAt: { type: Date },
    socketStatus: { type: String, enum: ["yes", "no"], default: "no" },
    socialLogin: { type: String, enum: ["yes", "no"], default: "no" },
    userStatus: { type: String, default: "offline" },
    userLocation: {
        type: { type: String, enum: ['Point'], default: "Point" },
        coordinates: { type: [Number] }
    },
},
    {
        versionKey: false // You should be aware of the outcome after set to false
    });

userSchema.index({ userLocation: "2dsphere" });
const User = module.exports = mongoose.model('User', userSchema);




//get all users
module.exports.getUsers = function (callback, limit) {
    User.find(callback).limit(limit);
}

//add admin
module.exports.addAdmin = function (data, callback) {

    var query = { email: data.email };
    var update = {
        name: data.name,
        email: data.email,
        password: data.password,
        token: data.token,
        role: data.role,
        createdAt: new Date()
    }

    User.findOneAndUpdate(query, update, { upsert: true, fields: { password: 0 }, new: true }, callback)
}

module.exports.adminLogin = function (data, callback) {
    var query = { email: data.email, role: "ADMIN" };
    User.find(query, callback);
}



module.exports.updateAdminToken = function (email, token, callback) {
    var query = { email: email };
    var update = {
        token: token
    }
    User.findOneAndUpdate(query, update, { upsert: true, fields: { password: 0 }, new: true }, callback)
}

module.exports.getUsersWithFilter = function (obj, sortByField, sortOrder, paged, pageSize, callback) {
    User.aggregate([{ $match: obj },
    { $match: { role: { $ne: "ADMIN" } } },
    { $sort: { [sortByField]: parseInt(sortOrder) } },
    { $skip: (paged - 1) * pageSize },
    { $limit: parseInt(pageSize) },
    ], callback);
}

//add user 
module.exports.addUser = function (data, callback) {
    console.log("Inside update", data);
    var query = { mobileNumber: data.mobileNumber };
    var update = {
        name: "User" + Math.floor(100000 + Math.random() * 900000),
        email: data.email,
        mobileNumber: data.mobileNumber,
        password: data.password,
        address: data.address,

        countryCode: data.countryCode,

        token: data.token,
        createdAt: new Date(),
        role: "USER",
        socialLogin: data.socialLogin || "no"
    }
    console.log("update=======", update)

    User.findOneAndUpdate(query, update, { upsert: true, fields: { password: 0 }, new: true }, callback)
}


//edit user profile
module.exports.getUserById = (id, callback) => {
    User.findById(id).populate('userWallet').exec(callback);
}
module.exports.getUserByIdAsync = (id, callback) => {
    return User.findById(id, callback);
}

//get user by email
module.exports.getUserByEmail = (data, callback) => {
    var query = { email: data.email };
    return User.findOne(query, callback);
}

// Updating user
module.exports.updateUser = (id, data, options, callback) => {
    var query = { _id: id };
    var update = {
        firstName: data.firstName,
        lastName: data.lastName,
        profileImage: data.profileImage,
    }
    update.updatedAt = new Date(); // change it later
    return User.findOneAndUpdate(query, update, { fields: { password: 0 } }, callback);
}

module.exports.updateUserWalletCredit = (data, callback) => {
    var query = { _id: data.customerId };
    var update = {
        walletCredit: data.walletCredit,
        updatedAt: new Date()
    }
    return User.findOneAndUpdate(query, update, { fields: { password: 0, trips: 0 } }, callback);
}


module.exports.updateUserProfile = (data) => {
    console.log("data========", data);
    var query = { _id: data._id };
    data.updatedAt = new Date();
    return User.findOneAndUpdate(query, data, { "fields": { password: 0, followerCount: 0, followingCount: 0 }, "new": true })
        .populate('userWallet')
        .exec();

}


module.exports.removeUser = (id, callback) => {
    var query = { _id: id };
    User.remove(query, callback);
}

module.exports.updatePassword = (data, options, callback) => {
    var query = { email: data.email };
    var update = {
        password: data.password,
        updatedAt: new Date()
    }
    return User.findOneAndUpdate(query, update, options, callback);
}


module.exports.updateToken = (data) => {
    var query = { mobileNumber: data.mobileNumber };
    var update = {
        token: data.token,
        firebaseToken: data.firebaseToken
    }
    return User.findOneAndUpdate(query, update, { "fields": { password: 0 }, "new": true })
        .populate('userWallet')
        .exec()
}
module.exports.updateUserToken = (data) => {
    var query = { email: data.email };
    var update = {
        token: data.token,
        firebaseToken: data.firebaseToken
    }
    return User.findOneAndUpdate(query, update, { "fields": { password: 0 }, "new": true })
        .populate('userWallet')
        .exec()
}

module.exports.custAuth = (data) => {
    return User.findOne({ _id: data.customerid, token: data.token });
}

module.exports.adminAuth = (data) => {
    return User.findOne({ _id: data.adminid, token: data.token, role: { $in: ["ADMIN", "SUPERADMIN"] } });
}






module.exports.changePassword = (password, userid, callback) => {
    var query = { _id: userid };
    const update = {
        password: password
    }
    User.findOneAndUpdate(query, update, { new: true }, callback)
}

module.exports.logout = (data, callback) => {
    var query = { _id: data._id };
    var update = {
        token: null,
        UpdatedAt: new Date()
    }
    User.findOneAndUpdate(query, update, { new: true }, callback);
}