const express = require('express');
const { registerUser, loginUser, logoutUser, listUser, updateUser, uploadAvatar, deleteAvatar, deleteUser, refreshSession, forgotPassword, resetPassword } = require('../controllers/users');
const validateRequest = require('../middlewares/validateRequest');
const registerUserSchema = require('../schemas/user/add');
const loginSchema = require('../schemas/user/login');
const routes = express();
const multer = require('multer');
const upload = multer({})
const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        message: "Muitas tentativas de login. Tente novamente em 15 minutos.",
        code: "TOO_MANY_REQUESTS",
        status: 429,
    },
});

const authentication = require('../middlewares/authentication');
const updateUserSchema = require('../schemas/user/update');
const { listTasks, registerTask, updateTask, deleteTask, deleteAllTasks } = require('../controllers/tasks');
const addTaskSchema = require('../schemas/task/add');
const updateTaskSchema = require('../schemas/task/update');
const forgotPasswordSchema = require('../schemas/user/forgotpass');
const resetPasswordSchema = require('../schemas/user/resetpass');
const deleteSchema = require('../schemas/user/delete');

routes.post('/user/register', validateRequest(registerUserSchema), registerUser);
routes.post("/user/login", loginLimiter, validateRequest(loginSchema), loginUser);
routes.post("/refresh", refreshSession);
routes.post("/user/forgot-password", validateRequest(forgotPasswordSchema), forgotPassword);
routes.post("/user/reset-password/:token", validateRequest(resetPasswordSchema), resetPassword);

routes.use(authentication)

routes.put('/user/update', validateRequest(updateUserSchema), updateUser);
routes.post('/user/logout', logoutUser);
routes.get('/user', listUser);
routes.put("/user/avatar", upload.single('avatar'), uploadAvatar)
routes.delete("/user/avatar", deleteAvatar)
routes.delete("/user", validateRequest(deleteSchema), deleteUser);

routes.get('/tasks', listTasks);
routes.post('/task', validateRequest(addTaskSchema), registerTask);
routes.put('/task/:id', validateRequest(updateTaskSchema), updateTask);
routes.delete('/task/:id', deleteTask)
routes.delete("/tasks", validateRequest(deleteSchema), deleteAllTasks);

module.exports = routes;