// utils/tokens.js
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const database = require("../connections/database");

const generateAccessToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_KEY, { expiresIn: "15m" });
};

const generateRefreshToken = async (userId) => {
    const token = crypto.randomBytes(64).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

    await database("refresh_tokens").insert({
        user_id: userId,
        token,
        expires_at: expiresAt,
    });

    return token;
};

const deleteRefreshToken = async (token) => {
    await database("refresh_tokens").where({ token }).del();
};

const deleteAllUserRefreshTokens = async (userId) => {
    await database("refresh_tokens").where({ user_id: userId }).del();
};


const cleanExpiredTokens = async () => {
    try {
        const deleted = await database("refresh_tokens").where("expires_at", "<", new Date()).del();
        console.log(`Refresh tokens expirados removidos: ${deleted}`);
    } catch (err) {
        console.error("Erro ao limpar tokens expirados:", err);
    }
};
module.exports = {
    generateAccessToken,
    generateRefreshToken,
    deleteRefreshToken,
    deleteAllUserRefreshTokens,
    cleanExpiredTokens
};