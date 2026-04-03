const express = require('express');
const { registerUser, loginUser, logoutUser } = require('../controllers/users');
const validateRequest = require('../middlewares/validateRequest');
const registerUserSchema = require('../schemas/user/add');
const loginSchema = require('../schemas/user/login');
const routes = express();

const authentication = require('../middlewares/authentication')

routes.post('/user/register', validateRequest(registerUserSchema), registerUser);
routes.post('/user/login', validateRequest(loginSchema), loginUser);

routes.use(authentication)

routes.post('/user/logout', logoutUser);

module.exports = routes;