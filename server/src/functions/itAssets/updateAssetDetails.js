"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAssetDetails = updateAssetDetails;
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../../drizzle/client");
const assetTab_1 = require("../../drizzle/schema/assetTab");
const errorMessages_1 = require("../../errors/errorMessages");
const errorTypes_1 = require("../../errors/errorTypes");
async function updateAssetDetails({ id, status, note, updatedBy, }) {
    // Begin database Transaction
    try {
        return await client_1.db.transaction(async (trx) => {
            const asset = await trx
                .select()
                .from(assetTab_1.assetTab)
                .where((0, drizzle_orm_1.eq)(assetTab_1.assetTab.id, id))
                .limit(1);
            if (asset.length === 0) {
                throw new errorTypes_1.NotFoundError(errorMessages_1.ERROR_MESSAGES.ASSET_NOT_FOUND);
            }
            // Update the staff's status and note in the database
            await client_1.db
                .update(assetTab_1.assetTab)
                .set({ status: status, note: note })
                .where((0, drizzle_orm_1.eq)(assetTab_1.assetTab.id, id));
            // Log the change in the changeLog
            const changeLog = Array.isArray(asset[0].changeLog)
                ? asset[0].changeLog
                : [];
            const newChangeLog = {
                updatedBy,
                updatedAt: new Date().toISOString(),
                updatedField: 'status and note',
                previousValue: JSON.stringify({
                    status: asset[0].status,
                    note: asset[0].note,
                }),
                newValue: JSON.stringify({ status, note }),
            };
            const updatedChangeLog = [...changeLog, newChangeLog];
            await client_1.db
                .update(assetTab_1.assetTab)
                .set({
                changeLog: updatedChangeLog,
            })
                .where((0, drizzle_orm_1.eq)(assetTab_1.assetTab.id, id));
            return {
                success: true,
                message: 'Asset details updated successfully',
            };
        });
    }
    catch (error) {
        if (error instanceof errorTypes_1.NotFoundError) {
            throw error;
        }
        console.error('Error in updating asset details', error);
        throw new errorTypes_1.DatabaseError(errorMessages_1.ERROR_MESSAGES.ASSET_UPDATE_FAILED, error);
    }
}
