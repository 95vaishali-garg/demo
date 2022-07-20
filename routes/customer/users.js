const express = require('express');
const router = express.Router();
const usercontroller = require('../../controller/userController.js');


router.get('/', usercontroller.getUsersList);
router.post('/login', usercontroller.userLogin);
router.post('/register', usercontroller.userRegister);
router.post('/changepassword', usercontroller.changeUserPassword);
router.get('/logout',usercontroller.userLogout);

module.exports = router;


