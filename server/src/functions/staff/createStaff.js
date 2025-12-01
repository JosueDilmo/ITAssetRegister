"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStaff = createStaff;
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../../drizzle/client");
const staffTab_1 = require("../../drizzle/schema/staffTab");
const errorMessages_1 = require("../../errors/errorMessages");
const errorTypes_1 = require("../../errors/errorTypes");
async function createStaff({ name, email, department, jobTitle, createdBy, }) {
    try {
        const alreadyRegistered = await client_1.db
            .select()
            .from(staffTab_1.staffTab)
            .where((0, drizzle_orm_1.eq)(staffTab_1.staffTab.email, email));
        if (alreadyRegistered.length > 0) {
            return {
                success: true,
                message: 'Staff is already register',
                staff: alreadyRegistered[0].email,
            };
        }
        const newRegistered = await client_1.db
            .insert(staffTab_1.staffTab)
            .values({ name, email, department, jobTitle, createdBy })
            .returning();
        if (newRegistered.length === 0) {
            throw new errorTypes_1.DatabaseError(errorMessages_1.ERROR_MESSAGES.INTERNAL_DB_ERROR);
        }
        return {
            success: true,
            message: 'Staff registered successfully',
            staff: newRegistered[0].email,
        };
    }
    catch (error) {
        if (error instanceof errorTypes_1.DatabaseError) {
            throw error;
        }
        console.error('Error creating staff:', error);
        throw new errorTypes_1.DatabaseError(errorMessages_1.ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
    }
}
