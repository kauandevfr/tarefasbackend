const knex = require("../connections/database");
const jwt = require("jsonwebtoken");
const validateError = require("../utils/validateError");

const authentication = async (req, res, next) => {
    const bearer = req.headers.authorization;
    const cookieToken = req.cookies?.access_token;
    const token = cookieToken || (bearer && bearer.split(" ")[1]);

    if (!token) {
        return res.status(401).json({
            message: "Acesso negado.",
            code: "TOKEN_MISSING",
            status: 401,
        });
    }

    try {
        const { id } = jwt.verify(token, process.env.JWT_KEY);

        const user = await knex("users").where({ id }).first();

        if (!user) {
            return res.status(401).json({
                message: "Acesso negado.",
                code: "USER_NOT_FOUND",
                status: 401,
            });
        }

        const { password, ...safeUser } = user;
        req.user = safeUser;

        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Token expirado.",
                code: "TOKEN_EXPIRED",
                status: 401,
            });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                message: "Token inválido.",
                code: "TOKEN_INVALID",
                status: 401,
            });
        }

        return validateError(error, res);
    }
};

module.exports = authentication;