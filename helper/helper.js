
module.exports = {
    tokenGenerator: (length) => {
        if (typeof length == "undefined"){
            length = 32;
        }
        var token = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        for (var i = 0; i < length; i++){
            token += possible.charAt(Math.floor(Math.random() * possible.length));
        }  
        return token;
    },

    generatorRandomChar: (length) => {

        if (typeof length == "undefined")
            length = 2;
        var token = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (var i = 0; i < length; i++)
            token += possible.charAt(Math.floor(Math.random() * possible.length));
        return token;
    },


    showParamsErrorResponse: (message) => {
        var resData = { "status": "failure", "status_code": 200, "error_code": 5001, "error_description": "Missing Params or Params data type error!", "message": message, "data": {}, "error": {} };
        return resData;
    },

    showValidationErrorResponse: (message) => {
        var resData = { "status": "failure", "status_code": 200, "error_code": 5002, "error_description": "Validation Error!", "message": __(message), "data": {}, "error": {} };
        return resData;
    },

    showInternalServerErrorResponse: (message) => {
        /*errmodel.addError(message,function(err,data){*/
        var resData = { "status": "failure", "status_code": 200, "error_code": 5003, "error_description": "Internal Coding error or Params Undefined!", "message": message, "data": {}, "error": {} };
        return resData;
        /*})*/

    },

    // showUnathorizedErrorResponse: (message) => {
    //     /*errmodel.addError(message,function(err,data){*/
    //     var resData = { "status": "failure", "status_code": 200, "error_code": 5004, "error_description": "Invalid Login Credential!", "message": __(message), "data": {}, "error": {} };
    //     return resData;
    //     /*});*/

    // },
    showUnathorizedErrorResponse: (message) => {
        /*errmodel.addError(message,function(err,data){*/
        var resData = { "status": "failure", "status_code": 200, "error_code": 5004, "error_description": "Invalid Login Credential!", "message": __(message), "data": {}, "error": {} };
        return resData;
        /*});*/

    },

    showDatabaseErrorResponse: (message, error) => {
        /*errmodel.addError(error,function(err,data){*/
        var resData = { "status": "failure", "status_code": 200, "error_code": 5005, "error_description": "Database error!", "message": __(message), "data": {}, "error": error };
        return resData;
        /*}); */
    },

    showAWSImageUploadErrorResponse: (message, error) => {
        /*errmodel.addError(message,function(err,data){*/
        var resData = { "status": "failure", "status_code": 200, "error_code": 5006, "error_description": "AWS error!", "message": __(message), "data": {}, "error": error };
        return resData;
        /*});*/

    },

    showSuccessResponse: (message, data) => {
        var resData = { "status": "success", "status_code": 200, "message": __(message), "data": data };
        return resData;
    },

}