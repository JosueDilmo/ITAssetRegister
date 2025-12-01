"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStaffDetails = updateStaffDetails;
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../../drizzle/client");
const staffTab_1 = require("../../drizzle/schema/staffTab");
const errorMessages_1 = require("../../errors/errorMessages");
const errorTypes_1 = require("../../errors/errorTypes");
async function updateStaffDetails({ id, status, note, updatedBy, }) {
    try {
        const staff = await client_1.db
            .select()
            .from(staffTab_1.staffTab)
            .where((0, drizzle_orm_1.eq)(staffTab_1.staffTab.id, id))
            .limit(1);
        if (staff.length === 0) {
            throw new errorTypes_1.NotFoundError(errorMessages_1.ERROR_MESSAGES.STAFF_NOT_FOUND);
        }
        // Update the staff's status and note in the database
        return await client_1.db.transaction(async (tx) => {
            await tx
                .update(staffTab_1.staffTab)
                .set({ status: status, note: note })
                .where((0, drizzle_orm_1.eq)(staffTab_1.staffTab.id, id));
            // Log the change in the changeLog
            const changeLog = Array.isArray(staff[0].changeLog)
                ? staff[0].changeLog
                : [];
            const newChangeLog = {
                updatedBy,
                updatedAt: new Date().toISOString(),
                updatedField: 'status and note',
                previousValue: JSON.stringify({
                    status: staff[0].status,
                    note: staff[0].note,
                }),
                newValue: JSON.stringify({ status, note }),
            };
            const updatedChangeLog = [...changeLog, newChangeLog];
            await client_1.db
                .update(staffTab_1.staffTab)
                .set({
                changeLog: updatedChangeLog,
            })
                .where((0, drizzle_orm_1.eq)(staffTab_1.staffTab.id, id));
            return {
                success: true,
                message: 'Staff details updated successfully',
            };
        });
    }
    catch (error) {
        if (error instanceof errorTypes_1.NotFoundError) {
            throw error;
        }
        // Handle other errors
        console.error('Error updating staff details:', error);
        throw new errorTypes_1.DatabaseError(errorMessages_1.ERROR_MESSAGES.INTERNAL_DB_ERROR);
    }
}
