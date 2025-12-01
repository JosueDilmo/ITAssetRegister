"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeAssetAssignment = removeAssetAssignment;
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../../drizzle/client");
const assetTab_1 = require("../../drizzle/schema/assetTab");
const errorMessages_1 = require("../../errors/errorMessages");
const errorTypes_1 = require("../../errors/errorTypes");
async function removeAssetAssignment({ userConfirmed, assetId, updatedBy, }) {
    // Begin Transaction
    try {
        return await client_1.db.transaction(async (trx) => {
            // Get the asset to be removed
            const assetResult = await trx
                .select()
                .from(assetTab_1.assetTab)
                .where((0, drizzle_orm_1.eq)(assetTab_1.assetTab.id, assetId))
                .limit(1);
            if (assetResult.length === 0) {
                throw new errorTypes_1.NotFoundError(errorMessages_1.ERROR_MESSAGES.ASSET_NOT_FOUND);
            }
            const asset = assetResult[0];
            const prevAssignedTo = asset.assignedTo;
            if (!userConfirmed) {
                return {
                    success: false,
                    message: 'Are you sure you want to remove this asset assignment?',
                };
            }
            // Unassign the asset (clear assignedTo and dateAssigned)
            const assetRemoved = await trx
                .update(assetTab_1.assetTab)
                .set({ assignedTo: null, dateAssigned: null })
                .where((0, drizzle_orm_1.eq)(assetTab_1.assetTab.id, assetId))
                .returning();
            // Update the asset's changeLog (appen new entry)
            const prevChangeLog = Array.isArray(asset.changeLog)
                ? asset.changeLog
                : [];
            const newChangeLog = {
                updatedBy,
                updatedAt: new Date().toISOString(),
                updatedField: 'assignedTo',
                previousValue: prevAssignedTo,
                newValue: 'EMPTY - Asset removed from previous user and date assigned cleared',
            };
            const updatedChangeLog = [...prevChangeLog, newChangeLog];
            await trx
                .update(assetTab_1.assetTab)
                .set({
                changeLog: updatedChangeLog,
            })
                .where((0, drizzle_orm_1.eq)(assetTab_1.assetTab.id, assetId));
            //Update Staff changelog?
            // Return result
            if (assetRemoved.length === 0) {
                throw new errorTypes_1.DatabaseError(errorMessages_1.ERROR_MESSAGES.ASSET_REMOVAL_FAILED);
            }
            return {
                success: true,
                message: 'Asset removed successfully',
            };
        });
    }
    catch (error) {
        if (error instanceof errorTypes_1.NotFoundError || error instanceof errorTypes_1.DatabaseError) {
            throw error;
        }
        console.error('Error removing asset assignment:', error);
        throw new errorTypes_1.DatabaseError(errorMessages_1.ERROR_MESSAGES.ASSET_REMOVAL_FAILED, error);
    }
}
