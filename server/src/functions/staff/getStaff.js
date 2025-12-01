"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStaff = getStaff;
const client_1 = require("../../drizzle/client");
const staffTab_1 = require("../../drizzle/schema/staffTab");
const errorMessages_1 = require("../../errors/errorMessages");
const errorTypes_1 = require("../../errors/errorTypes");
async function getStaff() {
    try {
        const query = await client_1.db
            .select({
            id: staffTab_1.staffTab.id,
            name: staffTab_1.staffTab.name,
            email: staffTab_1.staffTab.email,
            department: staffTab_1.staffTab.department,
            jobTitle: staffTab_1.staffTab.jobTitle,
            status: staffTab_1.staffTab.status,
            note: staffTab_1.staffTab.note,
            assetHistoryList: staffTab_1.staffTab.assetHistoryList,
            createdAt: staffTab_1.staffTab.createdAt,
            createdBy: staffTab_1.staffTab.createdBy,
            changeLog: staffTab_1.staffTab.changeLog,
        })
            .from(staffTab_1.staffTab);
        const staffList = query.map(staff => {
            return {
                id: staff.id,
                name: staff.name,
                email: staff.email,
                department: staff.department,
                jobTitle: staff.jobTitle,
                status: staff.status,
                note: staff.note,
                assetHistoryList: staff.assetHistoryList || [],
                createdAt: staff.createdAt,
                createdBy: staff.createdBy,
                changeLog: staff.changeLog,
            };
        });
        return { staffList };
    }
    catch (error) {
        console.error('Error fetching staff:', error);
        throw new errorTypes_1.DatabaseError(errorMessages_1.ERROR_MESSAGES.DATABASE_CONNECTION_ERROR);
    }
}
