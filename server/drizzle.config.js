"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("./src/env");
exports.default = {
    schema: './src/drizzle/schema/*',
    out: './src/drizzle/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: env_1.env.POSTGRES_URL,
    },
};
