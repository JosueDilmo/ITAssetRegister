"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetsByStaffEmail = void 0;
const zod_1 = require("zod");
const errorMessages_1 = require("../../../errors/errorMessages");
const errorTypes_1 = require("../../../errors/errorTypes");
const getAssetsByStaffEmail_1 = require("../../../functions/itAssets/getAssetsByStaffEmail");
const assetsByStaffEmail = async (app) => {
    app.get('/assetByStaffEmail', {
        schema: {
            querystring: zod_1.z.object({
                staffEmail: zod_1.z.string().email(errorMessages_1.ERROR_MESSAGES.INVALID_EMAIL),
            }),
            response: {
                200: zod_1.z.object({
                    success: zod_1.z.boolean(),
                    message: zod_1.z.string(),
                    assetList: zod_1.z.array(zod_1.z.object({
                        id: zod_1.z.string().uuid(),
                        serialNumber: zod_1.z.string(),
                        name: zod_1.z.string(),
                        email: zod_1.z.string().nullable(),
                    })),
                }),
                400: zod_1.z.object({
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
        // Validate query parameters
        try {
            const { staffEmail } = request.query;
            if (!staffEmail.trim()) {
                throw new errorTypes_1.ValidationError(errorMessages_1.ERROR_MESSAGES.STAFF_EMAIL_REQUIRED);
            }
            const result = await (0, getAssetsByStaffEmail_1.getAssetsByStaffEmail)({ staffEmail });
            return reply.status(200).send({
                success: result.success,
                message: result.message,
                assetList: result.assetList.map(asset => ({
                    id: asset.id,
                    serialNumber: asset.serialNumber,
                    name: asset.name,
                    email: asset.email,
                })),
            });
        }
        catch (error) {
            if (error instanceof errorTypes_1.ValidationError) {
                throw error;
            }
            console.log('Error fetching asset by email:', error);
            throw error;
        }
    });
};
exports.assetsByStaffEmail = assetsByStaffEmail;
