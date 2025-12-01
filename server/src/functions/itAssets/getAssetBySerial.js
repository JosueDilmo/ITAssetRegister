"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAssetBySerial = getAssetBySerial;
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../../drizzle/client");
const assetTab_1 = require("../../drizzle/schema/assetTab");
const errorMessages_1 = require("../../errors/errorMessages");
const errorTypes_1 = require("../../errors/errorTypes");
async function getAssetBySerial({ serialNumber }) {
    try {
        const asset = await client_1.db
            .select()
            .from(assetTab_1.assetTab)
            .where((0, drizzle_orm_1.eq)(assetTab_1.assetTab.serialNumber, serialNumber));
        if (asset.length === 0) {
            throw new errorTypes_1.NotFoundError(errorMessages_1.ERROR_MESSAGES.ASSET_NOT_FOUND);
        }
        const assetList = asset.map(asset => {
            return {
                id: asset.id,
                serialNumber: asset.serialNumber,
                name: asset.name,
                type: asset.type,
                assignedTo: asset.assignedTo,
                datePurchased: asset.datePurchased,
                assetNumber: asset.assetNumber,
                status: asset.status,
                note: asset.note,
                createdAt: asset.createdAt.toString(),
                createdBy: asset.createdBy,
            };
        });
        return {
            success: true,
            message: 'Asset list retrieved successfully',
            assetList,
        };
    }
    catch (error) {
        if (error instanceof errorTypes_1.NotFoundError ||
            error instanceof errorTypes_1.AuthorizationError ||
            error instanceof errorTypes_1.ConflictError ||
            error instanceof errorTypes_1.AuthenticationError) {
            throw error;
        }
        // Log unexpected errors
        console.error('Error assigning asset:', error);
        throw new errorTypes_1.DatabaseError(errorMessages_1.ERROR_MESSAGES.ASSET_ASSIGNMENT_FAILED, error);
    }
}
