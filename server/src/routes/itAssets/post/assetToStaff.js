"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetToStaff = void 0;
const zod_1 = require("zod");
const errorMessages_1 = require("../../../errors/errorMessages");
const errorTypes_1 = require("../../../errors/errorTypes");
const assignAssetToStaffWithConfirmation_1 = require("../../../functions/itAssets/assignAssetToStaffWithConfirmation");
const assetToStaff = async (app) => {
    app.post('/assetToStaff/:email', {
        schema: {
            params: zod_1.z.object({
                email: zod_1.z.string().email(errorMessages_1.ERROR_MESSAGES.INVALID_EMAIL),
            }),
            body: zod_1.z.object({
                assetId: zod_1.z.string().uuid(errorMessages_1.ERROR_MESSAGES.INVALID_ID),
                updatedBy: zod_1.z.string().email(errorMessages_1.ERROR_MESSAGES.MISSING_UPDATED_BY),
                userConfirmed: zod_1.z.boolean().optional(),
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
            const staffEmail = request.params.email;
            const userConfirmed = request.body.userConfirmed || false;
            const assetId = request.body.assetId;
            const updatedBy = request.body.updatedBy;
            if (!staffEmail.trim()) {
                throw new errorTypes_1.ValidationError(errorMessages_1.ERROR_MESSAGES.STAFF_EMAIL_REQUIRED);
            }
            if (!assetId.trim()) {
                throw new errorTypes_1.ValidationError(errorMessages_1.ERROR_MESSAGES.ASSET_ID_REQUIRED);
            }
            if (!updatedBy.trim()) {
                throw new errorTypes_1.ValidationError(errorMessages_1.ERROR_MESSAGES.ASSET_UPDATED_BY_REQUIRED);
            }
            const result = await (0, assignAssetToStaffWithConfirmation_1.assignAssetToStaffWithConfirmation)({
                staffEmail,
                assetId,
                updatedBy,
                userConfirmed,
            });
            return reply.status(200).send({
                success: result.success,
                message: result.message,
            });
        }
        catch (error) {
            if (error instanceof errorTypes_1.ValidationError) {
                throw error;
            }
            throw error;
        }
    });
};
exports.assetToStaff = assetToStaff;
