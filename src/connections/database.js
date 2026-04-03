require("dotenv").config();

const database = require("knex")({
    client: "pg",
    connection: process.env.DB_URL
});

module.exports = database;