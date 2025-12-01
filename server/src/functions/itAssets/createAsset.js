"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAsset = createAsset;
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../../drizzle/client");
const assetTab_1 = require("../../drizzle/schema/assetTab");
const staffTab_1 = require("../../drizzle/schema/staffTab");
const errorMessages_1 = require("../../errors/errorMessages");
const errorTypes_1 = require("../../errors/errorTypes");
async function createAsset({ serialNumber, name, type, assignedTo, datePurchased, assetNumber, createdBy, }) {
    try {
        // Check if staff exists when assignedTo is provided
        if (assignedTo) {
            const checkAssignedTo = await client_1.db
                .select()
                .from(staffTab_1.staffTab)
                .where((0, drizzle_orm_1.eq)(staffTab_1.staffTab.email, assignedTo))
                .limit(1);
            if (checkAssignedTo.length === 0) {
                throw new errorTypes_1.NotFoundError(`Staff with email ${assignedTo} not found`);
            }
        }
        // Check if asset already registered
        const alreadyRegistered = await client_1.db
            .select()
            .from(assetTab_1.assetTab)
            .where((0, drizzle_orm_1.eq)(assetTab_1.assetTab.serialNumber, serialNumber))
            .limit(1);
        if (alreadyRegistered.length > 0) {
            return {
                success: true,
                message: 'Asset already registered',
                staff: alreadyRegistered[0].assignedTo,
            };
        }
        // Create new asset
        await client_1.db.transaction(async (tx) => {
            const newAsset = await tx
                .insert(assetTab_1.assetTab)
                .values({
                serialNumber,
                name,
                type,
                assignedTo,
                dateAssigned: assignedTo ? new Date().toISOString() : null,
                datePurchased,
                assetNumber,
                createdBy,
            })
                .returning();
            // Check if asset creation was successful
            if (newAsset.length === 0) {
                throw new errorTypes_1.DatabaseError(errorMessages_1.ERROR_MESSAGES.DATABASE_CONNECTION_ERROR);
            }
            // Update staff history and changelod
            if (assignedTo) {
                const staff = await client_1.db.transaction(async (trx) => {
                    return await trx
                        .select()
                        .from(staffTab_1.staffTab)
                        .where((0, drizzle_orm_1.eq)(staffTab_1.staffTab.email, assignedTo))
                        .limit(1);
                });
                // Update staff assetHistoryList (append assetID if not already present)
                const currentAssetHistory = Array.isArray(staff[0].assetHistoryList)
                    ? staff[0].assetHistoryList
                    : [];
                const updatedAssetHistory = currentAssetHistory.includes(newAsset[0].id)
                    ? currentAssetHistory
                    : [...currentAssetHistory, newAsset[0].id];
                await tx
                    .update(staffTab_1.staffTab)
                    .set({ assetHistoryList: updatedAssetHistory })
                    .where((0, drizzle_orm_1.eq)(staffTab_1.staffTab.email, assignedTo));
                // Update Staff changeLog
                const staffChangeLog = Array.isArray(staff[0].changeLog)
                    ? staff[0].changeLog
                    : [];
                const newStaffChangeLog = {
                    updatedBy: createdBy,
                    updatedAt: new Date().toISOString(),
                    updatedField: 'assetHistoryList',
                    previousValue: JSON.stringify({
                        assetHistoryList: staff[0].assetHistoryList,
                    }),
                    newValue: JSON.stringify({ assetHistoryList: updatedAssetHistory }),
                };
                const updatedStaffChangeLog = [...staffChangeLog, newStaffChangeLog];
                await client_1.db
                    .update(staffTab_1.staffTab)
                    .set({
                    changeLog: updatedStaffChangeLog,
                })
                    .where((0, drizzle_orm_1.eq)(staffTab_1.staffTab.id, staff[0].id));
                // Update Asset changeLog
                const prevChangeLog = Array.isArray(newAsset[0].changeLog)
                    ? newAsset[0].changeLog
                    : [];
                const newChangeLog = {
                    updatedBy: createdBy,
                    updatedAt: new Date().toISOString(),
                    updatedField: 'assignedTo',
                    previousValue: newAsset[0].assignedTo,
                    newValue: assignedTo,
                };
                const updatedChangeLog = [...prevChangeLog, newChangeLog];
                await tx
                    .update(assetTab_1.assetTab)
                    .set({ changeLog: updatedChangeLog })
                    .where((0, drizzle_orm_1.eq)(assetTab_1.assetTab.id, newAsset[0].id));
                // Return success message with assigned staff if applicable
                return {
                    success: true,
                    message: 'Asset registered successfully',
                    staff: newAsset[0].assignedTo,
                };
            }
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
