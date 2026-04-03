const express = require('express');
const { registerUser } = require('../controllers/users');
const validateRequest = require('../middlewares/validateRequest');
const registerUserSchema = require('../schemas/user/add');
const routes = express();


routes.post('/user/register', validateRequest(registerUserSchema), registerUser);

module.exports = routes;