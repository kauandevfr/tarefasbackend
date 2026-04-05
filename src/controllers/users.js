const database = require("../connections/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validateError = require("../utils/validateError");
const path = require("path");
const fs = require("fs/promises");
const sharp = require("sharp");
const { deleteRefreshToken, generateAccessToken, generateRefreshToken } = require("../utils/tokens");
const { compileEmail } = require('../connections/resend');
const { Resend } = require("resend");

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
        const resend = new Resend(process.env.EMAIL_KEY)

        const html = compileEmail('firstAccess', {
            nome: name,
            ano: new Date().getFullYear(),
            url_app: process.env.APP_URL
        });

        resend.emails.send({
            from: 'tarefas. <noreply@kauanrodrigues.com.br>',
            to: email,
            subject: 'Bem-vindo ao tarefas.',
            html
        }).catch(err => console.error('Erro ao enviar email de boas-vindas:', err));

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

        const accessToken = generateAccessToken(user.id);
        const refreshToken = await generateRefreshToken(user.id);

        const isProd = process.env.NODE_ENV === "production";

        res.cookie("access_token", accessToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
            domain: isProd ? ".kauanrodrigues.com.br" : undefined,
            maxAge: 15 * 60 * 1000, // 15 min
        });

        res.cookie("refresh_token", refreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
            domain: isProd ? ".kauanrodrigues.com.br" : undefined,
            path: "/refresh",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
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

const logoutUser = async (req, res) => {
    const isProd = process.env.NODE_ENV === "production";
    const refreshToken = req.cookies?.refresh_token;

    if (refreshToken) {
        await deleteRefreshToken(refreshToken);
    }

    res.clearCookie("access_token", {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        domain: isProd ? ".kauanrodrigues.com.br" : undefined,
    });

    res.clearCookie("refresh_token", {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        domain: isProd ? ".kauanrodrigues.com.br" : undefined,
        path: "/refresh",
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
            const existingEmail = await database("users")
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

const uploadAvatar = async (req, res) => {
    const avatar = req.file;
    const { user } = req;

    try {
        if (!avatar) {
            return res.status(400).json({
                message: "O arquivo de avatar é obrigatório.",
                code: "AVATAR_REQUIRED",
                status: 400,
            });
        }

        if (user.avatar) {
            const oldPath = path.join(process.cwd(), "src", "assets", String(user.id));
            try {
                await fs.rm(oldPath, { recursive: true, force: true });
            } catch (err) {
                if (err.code !== "ENOENT") {
                    console.error("Erro ao excluir avatar antigo:", err);
                }
            }
        }

        const dir = path.join(process.cwd(), "src", "assets", String(user.id));
        await fs.mkdir(dir, { recursive: true });

        const filename = `${Date.now()}.webp`;
        const outPath = path.join(dir, filename);

        const buffer = await sharp(avatar.buffer)
            .rotate()
            .webp({ quality: 82 })
            .toBuffer();

        await fs.writeFile(outPath, buffer);

        const publicUrl = `${process.env.PUBLIC_URL}/assets/${user.id}/${filename}`;

        await database("users").where({ id: user.id }).update({ avatar: publicUrl });

        return res.status(200).json({
            message: "Avatar atualizado com sucesso.",
            code: "AVATAR_UPDATED",
            status: 200,
            data: { avatar: publicUrl },
        });
    } catch (error) {
        return validateError(error, res);
    }
};

const deleteAvatar = async (req, res) => {
    try {
        const { id, avatar } = req.user;

        if (!avatar) {
            return res.status(400).json({
                message: "Nenhum avatar para remover.",
                code: "AVATAR_NOT_FOUND",
                status: 400,
            });
        }

        const userDir = path.join(process.cwd(), "src", "assets", String(id));

        try {
            await fs.rm(userDir, { recursive: true, force: true });
        } catch (err) {
            if (err.code !== "ENOENT") {
                console.error("Erro ao excluir avatar:", err);
            }
        }

        await database("users").where({ id }).update({ avatar: null });

        return res.status(200).json({
            message: "Foto removida com sucesso.",
            code: "AVATAR_DELETED",
            status: 200,
        });
    } catch (err) {
        return validateError(err, res);
    }
};

const deleteUser = async (req, res) => {
    const { id, avatar } = req.user;

    try {
        await database.transaction(async (trx) => {
            await trx("tasks").where({ user_id: id }).del();
            await trx("users").where({ id }).del();
        });

        if (avatar) {
            const userDir = path.join(process.cwd(), "src", "assets", String(id));
            try {
                await fs.rm(userDir, { recursive: true, force: true });
            } catch (err) {
                if (err.code !== "ENOENT") {
                    console.error("Erro ao excluir pasta do usuário:", err);
                }
            }
        }

        return res.status(200).json({
            message: "Usuário excluído com sucesso.",
            code: "USER_DELETED",
            status: 200,
        });
    } catch (error) {
        return validateError(error, res);
    }
};

const refreshSession = async (req, res) => {
    const token = req.cookies?.refresh_token;
    console.log("Cookies recebidos:", req.cookies);
    console.log("Refresh token:", token);

    if (!token) {
        return res.status(401).json({
            message: "Refresh token não encontrado.",
            code: "REFRESH_TOKEN_MISSING",
            status: 401,
        });
    }

    try {
        const stored = await database("refresh_tokens").where({ token }).first();

        if (!stored || new Date(stored.expires_at) < new Date()) {
            if (stored) await deleteRefreshToken(token);

            return res.status(401).json({
                message: "Sessão expirada. Faça login novamente.",
                code: "REFRESH_TOKEN_EXPIRED",
                status: 401,
            });
        }

        // Rotation: deleta o antigo e gera um novo
        await deleteRefreshToken(token);

        const newAccessToken = generateAccessToken(stored.user_id);
        const newRefreshToken = await generateRefreshToken(stored.user_id);

        const isProd = process.env.NODE_ENV === "production";

        res.cookie("access_token", newAccessToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
            domain: isProd ? ".kauanrodrigues.com.br" : undefined,
            maxAge: 15 * 60 * 1000,
        });

        res.cookie("refresh_token", newRefreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
            domain: isProd ? ".kauanrodrigues.com.br" : undefined,
            path: "/refresh",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            message: "Sessão renovada com sucesso.",
            code: "SESSION_REFRESHED",
            status: 200,
        });
    } catch (error) {
        return validateError(error, res);
    }
};

module.exports = { registerUser, loginUser, logoutUser, listUser, updateUser, uploadAvatar, deleteAvatar, deleteUser, refreshSession }