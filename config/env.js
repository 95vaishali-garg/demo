const constants = require("../config/constants.js");
module.exports = () => {

      return {
        MONGODB: constants.MONGODB.LOCALHOST.URL,
        JWTOKEN: constants.JWTOKENLOCAL,
        EXPIRY: constants.key.tokenExpiry       

      };
  
};
