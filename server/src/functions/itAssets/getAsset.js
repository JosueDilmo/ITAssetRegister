"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAsset = getAsset;
const client_1 = require("../../drizzle/client");
const assetTab_1 = require("../../drizzle/schema/assetTab");
const errorMessages_1 = require("../../errors/errorMessages");
const errorTypes_1 = require("../../errors/errorTypes");
async function getAsset() {
    try {
        const query = await client_1.db
            .select({
            id: assetTab_1.assetTab.id,
            serialNumber: assetTab_1.assetTab.serialNumber,
            name: assetTab_1.assetTab.name,
            type: assetTab_1.assetTab.type,
            assignedTo: assetTab_1.assetTab.assignedTo,
            dateAssigned: assetTab_1.assetTab.dateAssigned,
            datePurchased: assetTab_1.assetTab.datePurchased,
            assetNumber: assetTab_1.assetTab.assetNumber,
            status: assetTab_1.assetTab.status,
            note: assetTab_1.assetTab.note,
            createdAt: assetTab_1.assetTab.createdAt,
            createdBy: assetTab_1.assetTab.createdBy,
            changeLog: assetTab_1.assetTab.changeLog,
        })
            .from(assetTab_1.assetTab);
        const allAsset = query.map(asset => {
            return {
                id: asset.id,
                serialNumber: asset.serialNumber,
                name: asset.name,
                type: asset.type,
                assignedTo: asset.assignedTo,
                dateAssigned: asset.dateAssigned,
                datePurchased: asset.datePurchased,
                assetNumber: asset.assetNumber,
                status: asset.status,
                note: asset.note,
                createdAt: asset.createdAt,
                createdBy: asset.createdBy,
                changeLog: asset.changeLog,
            };
        });
        return {
            allAsset,
        };
    }
    catch (error) {
        console.error('Error fetching assets:', error);
        throw new errorTypes_1.DatabaseError(errorMessages_1.ERROR_MESSAGES.DATABASE_CONNECTION_ERROR, error);
    }
}
