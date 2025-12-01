"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignAssetToStaffWithConfirmation = assignAssetToStaffWithConfirmation;
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../../drizzle/client");
const assetTab_1 = require("../../drizzle/schema/assetTab");
const staffTab_1 = require("../../drizzle/schema/staffTab");
const errorMessages_1 = require("../../errors/errorMessages");
const errorTypes_1 = require("../../errors/errorTypes");
async function assignAssetToStaffWithConfirmation({ userConfirmed, staffEmail, assetId, updatedBy, }) {
    // Begin database Transaction
    try {
        return await client_1.db.transaction(async (trx) => {
            // Check if the new email belongs to a staff
            const staff = await trx
                .select()
                .from(staffTab_1.staffTab)
                .where((0, drizzle_orm_1.eq)(staffTab_1.staffTab.email, staffEmail))
                .limit(1);
            if (staff.length === 0) {
                throw new errorTypes_1.NotFoundError(errorMessages_1.ERROR_MESSAGES.STAFF_NOT_FOUND);
            }
            // Find the current asset assignment
            const asset = await trx
                .select()
                .from(assetTab_1.assetTab)
                .where((0, drizzle_orm_1.eq)(assetTab_1.assetTab.id, assetId))
                .limit(1);
            if (asset.length === 0) {
                throw new errorTypes_1.NotFoundError(errorMessages_1.ERROR_MESSAGES.ASSET_NOT_FOUND);
            }
            const previousAssignedTo = asset[0].assignedTo;
            // If the asset was previously assigned and user has not confirmed, return question if wants to reassign asset
            if (previousAssignedTo &&
                previousAssignedTo !== staffEmail &&
                !userConfirmed) {
                return {
                    success: false,
                    message: `Asset is already assigned to ${previousAssignedTo}. Do you want to reassign it?`,
                };
            }
            // Assign asset to new staff (update asset record))
            await trx
                .update(assetTab_1.assetTab)
                .set({ assignedTo: staffEmail, dateAssigned: new Date().toISOString() })
                .where((0, drizzle_orm_1.eq)(assetTab_1.assetTab.id, assetId));
            // Update staff assetHistoryList (append assetID if not already present)
            const currentAssetHistory = Array.isArray(staff[0].assetHistoryList)
                ? staff[0].assetHistoryList
                : [];
            const updatedAssetHistory = currentAssetHistory.includes(assetId)
                ? currentAssetHistory
                : [...currentAssetHistory, assetId];
            await trx
                .update(staffTab_1.staffTab)
                .set({ assetHistoryList: updatedAssetHistory })
                .where((0, drizzle_orm_1.eq)(staffTab_1.staffTab.email, staffEmail));
            // Update Staff changelog
            const prevStaffChangeLog = Array.isArray(staff[0].changeLog)
                ? staff[0].changeLog
                : [];
            const newStaffChangeLog = {
                updatedBy,
                updatedAt: new Date().toISOString(),
                updatedField: 'assetHistoryList',
                previousValue: currentAssetHistory,
                newValue: updatedAssetHistory,
            };
            const updatedStaffChangeLog = [...prevStaffChangeLog, newStaffChangeLog];
            await trx
                .update(staffTab_1.staffTab)
                .set({ changeLog: updatedStaffChangeLog })
                .where((0, drizzle_orm_1.eq)(staffTab_1.staffTab.email, staffEmail));
            // Update Asset changeLog
            const prevChangeLog = Array.isArray(asset[0].changeLog)
                ? asset[0].changeLog
                : [];
            const newChangeLog = {
                updatedBy,
                updatedAt: new Date().toISOString(),
                updatedField: 'assignedTo',
                previousValue: asset[0].assignedTo,
                newValue: staffEmail,
            };
            const updatedChangeLog = [...prevChangeLog, newChangeLog];
            await trx
                .update(assetTab_1.assetTab)
                .set({ changeLog: updatedChangeLog })
                .where((0, drizzle_orm_1.eq)(assetTab_1.assetTab.id, assetId));
            return {
                success: true,
                message: 'Asset assigned successfully',
            };
        });
    }
    catch (error) {
        if (error instanceof errorTypes_1.NotFoundError || error instanceof errorTypes_1.DatabaseError) {
            throw error;
        }
        // Log unexpected errors
        console.error('Error assigning asset:', error);
        throw new errorTypes_1.DatabaseError(errorMessages_1.ERROR_MESSAGES.ASSET_ASSIGNMENT_FAILED, error);
    }
}
