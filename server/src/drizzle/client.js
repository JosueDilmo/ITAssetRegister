"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.pg = void 0;
const postgres_js_1 = require("drizzle-orm/postgres-js");
const postgres_1 = __importDefault(require("postgres"));
const env_1 = require("../env");
const assetTab_1 = require("./schema/assetTab");
const staffTab_1 = require("./schema/staffTab");
exports.pg = (0, postgres_1.default)(env_1.env.POSTGRES_URL);
exports.db = (0, postgres_js_1.drizzle)(exports.pg, {
    schema: { staffTab: staffTab_1.staffTab, assetTab: assetTab_1.assetTab },
});
