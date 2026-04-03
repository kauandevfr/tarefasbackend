const express = require('express');
const { registerUser, loginUser, logoutUser, listUser, updateUser, uploadAvatar } = require('../controllers/users');
const validateRequest = require('../middlewares/validateRequest');
const registerUserSchema = require('../schemas/user/add');
const loginSchema = require('../schemas/user/login');
const routes = express();
const multer = require('multer');
const upload = multer({})

const authentication = require('../middlewares/authentication');
const updateUserSchema = require('../schemas/user/update');

routes.post('/user/register', validateRequest(registerUserSchema), registerUser);
routes.post('/user/login', validateRequest(loginSchema), loginUser);

routes.use(authentication)

routes.put('/user/update', validateRequest(updateUserSchema), updateUser);
routes.post('/user/logout', logoutUser);
routes.get('/user', listUser);
routes.put("/user/avatar", upload.single('avatar'), uploadAvatar)

module.exports = routes;