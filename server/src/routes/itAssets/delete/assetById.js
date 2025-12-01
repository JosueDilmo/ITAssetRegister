"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetById = void 0;
const zod_1 = require("zod");
const errorMessages_1 = require("../../../errors/errorMessages");
const errorTypes_1 = require("../../../errors/errorTypes");
const removeAssetAssignment_1 = require("../../../functions/itAssets/removeAssetAssignment");
const assetById = async (app) => {
    app.delete('/assetBy/:id', {
        schema: {
            params: zod_1.z.object({
                id: zod_1.z.string().uuid(errorMessages_1.ERROR_MESSAGES.INVALID_ID),
            }),
            body: zod_1.z.object({
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
            const assetId = request.params.id;
            const updatedBy = request.body.updatedBy;
            const userConfirmed = request.body.userConfirmed || false;
            if (!assetId) {
                throw new errorTypes_1.ValidationError(errorMessages_1.ERROR_MESSAGES.ASSET_ID_REQUIRED);
            }
            const result = await (0, removeAssetAssignment_1.removeAssetAssignment)({
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
            console.error('Error removing asset assignment:', error);
            throw error;
        }
    });
};
exports.assetById = assetById;
