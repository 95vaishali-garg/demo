const express = require('express');
const router = express.Router();
const usercontroller = require('../../adminController/userController');


router.get('/', usercontroller.getAllAdminList);
router.post('/login', usercontroller.adminLogin);
router.post('/register', usercontroller.addAdmin);
router.post('/removeUser', usercontroller.removeUser);
router.post('/adminPermission',usercontroller.adminPermission);

module.exports = router;


