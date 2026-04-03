const database = require("../connections/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validateError = require("../utils/validateError");

const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const userEmail = await database("users").where({ email }).first();

        if (userEmail) {
            return res.status(409).json({
                message: "Email já cadastrado.",
                code: "EMAIL_ALREADY_EXISTS",
                status: 409,
            });
        }

        const encryptedPassword = await bcrypt.hash(password, 10);

        await database("users").insert({ name, email, password: encryptedPassword });

        return res.status(201).json({
            message: "Usuário cadastrado com sucesso.",
            code: "USER_CREATED",
            status: 201,
        });

    } catch (error) {
        return validateError(error, res);
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const normalizedEmail = email.trim().toLowerCase();

        const user = await database("users")
            .whereRaw("LOWER(email) = ?", [normalizedEmail])
            .first();

        if (!user) {
            return res.status(401).json({
                message: "Credenciais inválidas.",
                code: "INVALID_CREDENTIALS",
                status: 401,
            });
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({
                message: "Credenciais inválidas.",
                code: "INVALID_CREDENTIALS",
                status: 401,
            });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_KEY, { expiresIn: "1d" });

        const isProd = process.env.NODE_ENV === "production";

        res.cookie("access_token", token, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
            domain: isProd ? ".kauanrodrigues.com.br" : undefined,
            maxAge: 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            message: "Login realizado com sucesso.",
            code: "LOGIN_SUCCESS",
            status: 200,
        });
    } catch (error) {
        return validateError(error, res);
    }
};

const logoutUser = (req, res) => {
    const isProd = process.env.NODE_ENV === "production";

    res.clearCookie("access_token", {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        domain: isProd ? ".kauanrodrigues.com.br" : undefined,
    });

    return res.status(200).json({
        message: "Logout realizado com sucesso.",
        code: "LOGOUT_SUCCESS",
        status: 200,
    });
};

const listUser = async (req, res) => {
    return res.status(200).json(req.user)
};

const updateUser = async (req, res) => {
    const { name, email, phoneNumber, currentPassword, newPassword, theme } = req.body;
    const { user } = req;

    const updateData = {};

    try {
        if (newPassword) {
            const validPassword = await bcrypt.compare(currentPassword, user.password);

            if (!validPassword) {
                return res.status(401).json({
                    message: "A senha atual está incorreta.",
                    code: "INVALID_CURRENT_PASSWORD",
                    status: 401,
                });
            }

            updateData.password = await bcrypt.hash(newPassword, 10);
        }

        if (email) {
            const existingEmail = await knex("users")
                .where({ email })
                .whereNot({ id: user.id })
                .first();

            if (existingEmail) {
                return res.status(409).json({
                    message: "Email já cadastrado.",
                    code: "EMAIL_ALREADY_EXISTS",
                    status: 409,
                });
            }

            updateData.email = email;
        }

        if (name) updateData.name = name;
        if (phoneNumber) updateData.phonenumber = phoneNumber;
        if (theme) updateData.theme = theme;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                message: "Nenhuma informação para atualizar.",
                code: "NO_UPDATE_DATA",
                status: 400,
            });
        }

        await database("users").update(updateData).where({ id: user.id });

        return res.status(200).json({
            message: "Usuário atualizado com sucesso.",
            code: "USER_UPDATED",
            status: 200,
        });
    } catch (error) {
        return validateError(error, res);
    }
};

module.exports = { registerUser, loginUser, logoutUser, listUser, updateUser }