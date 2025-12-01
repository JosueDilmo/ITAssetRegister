"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAssetsByStaffEmail = getAssetsByStaffEmail;
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../../drizzle/client");
const assetTab_1 = require("../../drizzle/schema/assetTab");
const errorMessages_1 = require("../../errors/errorMessages");
const errorTypes_1 = require("../../errors/errorTypes");
async function getAssetsByStaffEmail({ staffEmail }) {
    try {
        const asset = await client_1.db
            .select()
            .from(assetTab_1.assetTab)
            .where((0, drizzle_orm_1.eq)(assetTab_1.assetTab.assignedTo, staffEmail));
        if (asset.length === 0) {
            return {
                success: false,
                message: 'No asset found',
                assetList: [],
            };
        }
        const assetList = asset.map(asset => {
            return {
                id: asset.id,
                serialNumber: asset.serialNumber,
                name: asset.name,
                email: asset.assignedTo,
            };
        });
        return {
            success: true,
            message: 'Asset list retrieved successfully',
            assetList,
        };
    }
    catch (error) {
        throw new errorTypes_1.DatabaseError(errorMessages_1.ERROR_MESSAGES.DATABASE_CONNECTION_ERROR, error);
    }
}
