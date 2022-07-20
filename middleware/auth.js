var user = require('../models/userTable.js');
var jwt = require('jsonwebtoken');

module.exports.validateRoute = async (req, res, next) => {
    //console.log("check routing ");
    var headerData = req.headers;

    var token = headerData.token;

    if (token == config.key.token) {
        return next();
    }

  

}

module.exports.validateUser = async (req) => {

    var userid = req.get('userid');
    var token = req.get('token');
    
    if (userid != undefined && token != undefined) {
        try {
            var myuser = await user.custAuth({ userid: userid, token: token });

           

            return myuser;

        } catch (err) {
            var myuser = null
            return myuser
        }
    } else {
        var myuser = null
        return myuser;
    }
}



module.exports.validateAdmin = async(data) => {
    var headerData = data;
    var adminid   = headerData.adminid;
    var token      = headerData.token;
    if(adminid != null){
        try{
            var myuser = await user.adminAuth({adminid:adminid,token:token});
            //console.log(myuser);
            return myuser
        }catch(err){
            var myuser = null
            return myuser
        }
    }else{
        var myuser = null
        return myuser;
    }
}


