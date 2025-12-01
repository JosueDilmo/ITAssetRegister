"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allStaff = void 0;
const zod_1 = require("zod");
const errorMessages_1 = require("../../../errors/errorMessages");
const getStaff_1 = require("../../../functions/staff/getStaff");
const allStaff = async (app) => {
    app.get('/allStaff', {
        schema: {
            querystring: zod_1.z.object({
                id: zod_1.z.string().uuid(errorMessages_1.ERROR_MESSAGES.INVALID_ID).optional(),
            }),
            response: {
                200: zod_1.z.array(zod_1.z.object({
                    id: zod_1.z.string(),
                    name: zod_1.z.string(),
                    email: zod_1.z.string(),
                    department: zod_1.z.string(),
                    jobTitle: zod_1.z.string(),
                    status: zod_1.z.string(),
                    note: zod_1.z.string().nullable(),
                    assetHistoryList: zod_1.z.array(zod_1.z.string()),
                    createdAt: zod_1.z.string(),
                    createdBy: zod_1.z.string(),
                    changeLog: zod_1.z.array(zod_1.z.object({
                        updatedBy: zod_1.z.string(),
                        updatedAt: zod_1.z.string(),
                        updatedField: zod_1.z.string(),
                        previousValue: zod_1.z.string(),
                        newValue: zod_1.z.string(),
                    })),
                })),
                500: zod_1.z.object({
                    success: zod_1.z.boolean(),
                    error: zod_1.z.object({
                        code: zod_1.z.string(),
                        message: zod_1.z.string(),
                        details: zod_1.z.any().optional(),
                    }),
                }),
            },
        },
    }, async (request, reply) => {
        try {
            const { id } = request.query;
            const { staffList } = await (0, getStaff_1.getStaff)();
            const filteredStaffList = id
                ? staffList.filter(staff => staff.id === id)
                : staffList;
            return reply.status(200).send(filteredStaffList.map(staff => {
                return {
                    id: staff.id,
                    name: staff.name,
                    email: staff.email,
                    department: staff.department,
                    jobTitle: staff.jobTitle,
                    status: staff.status,
                    note: staff.note,
                    assetHistoryList: staff.assetHistoryList,
                    createdAt: staff.createdAt.toString(),
                    createdBy: staff.createdBy,
                    changeLog: staff.changeLog.map(log => ({
                        updatedBy: log.updatedBy,
                        updatedAt: log.updatedAt.toString(),
                        updatedField: log.updatedField,
                        previousValue: log.previousValue,
                        newValue: log.newValue,
                    })),
                };
            }));
        }
        catch (error) {
            console.error('Error fetching staff:', error);
            throw error;
        }
    });
};
exports.allStaff = allStaff;
