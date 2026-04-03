const express = require('express');
const { registerUser, loginUser } = require('../controllers/users');
const validateRequest = require('../middlewares/validateRequest');
const registerUserSchema = require('../schemas/user/add');
const loginSchema = require('../schemas/user/login');
const routes = express();

routes.post('/user/register', validateRequest(registerUserSchema), registerUser);
routes.post('/user/login', validateRequest(loginSchema), loginUser);

module.exports = routes;