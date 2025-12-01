"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.staffDetails = void 0;
const zod_1 = require("zod");
const errorMessages_1 = require("../../../errors/errorMessages");
const errorTypes_1 = require("../../../errors/errorTypes");
const updateStaffDetails_1 = require("../../../functions/staff/updateStaffDetails");
const staffDetails = async (app) => {
    app.patch('/staffDetails/:id', {
        schema: {
            params: zod_1.z.object({
                id: zod_1.z.string().uuid(errorMessages_1.ERROR_MESSAGES.INVALID_ID),
            }),
            body: zod_1.z.object({
                status: zod_1.z.string().min(1, errorMessages_1.ERROR_MESSAGES.INVALID_STATUS),
                note: zod_1.z.string().nullable(),
                updatedBy: zod_1.z.string().min(1, errorMessages_1.ERROR_MESSAGES.MISSING_UPDATED_BY),
            }),
            response: {
                200: zod_1.z.object({
                    success: zod_1.z.boolean(),
                    message: zod_1.z.string(),
                }),
                400: zod_1.z.object({
                    success: zod_1.z.boolean(),
                    error: zod_1.z.object({
                        code: zod_1.z.string(),
                        message: zod_1.z.string(),
                        details: zod_1.z.any().optional(),
                    }),
                }),
                404: zod_1.z.object({
                    success: zod_1.z.boolean(),
                    error: zod_1.z.object({
                        code: zod_1.z.string(),
                        message: zod_1.z.string(),
                        details: zod_1.z.any().optional(),
                    }),
                }),
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
            const staffId = request.params.id;
            const { status, note, updatedBy } = request.body;
            if (!staffId.trim()) {
                throw new errorTypes_1.ValidationError(errorMessages_1.ERROR_MESSAGES.STAFF_ID_REQUIRED);
            }
            if (!updatedBy.trim()) {
                throw new errorTypes_1.ValidationError(errorMessages_1.ERROR_MESSAGES.MISSING_UPDATED_BY);
            }
            if (!status.trim()) {
                throw new errorTypes_1.ValidationError(errorMessages_1.ERROR_MESSAGES.STAFF_STATUS_REQUIRED);
            }
            const result = await (0, updateStaffDetails_1.updateStaffDetails)({
                id: staffId,
                status: status,
                note: note,
                updatedBy: updatedBy,
            });
            return reply.status(200).send(result);
        }
        catch (error) {
            if (error instanceof errorTypes_1.ValidationError) {
                throw error;
            }
        }
    });
};
exports.staffDetails = staffDetails;
