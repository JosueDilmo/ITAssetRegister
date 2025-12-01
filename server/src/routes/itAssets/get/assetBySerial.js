"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetBySerial = void 0;
const zod_1 = require("zod");
const errorMessages_1 = require("../../../errors/errorMessages");
const errorTypes_1 = require("../../../errors/errorTypes");
const getAssetBySerial_1 = require("../../../functions/itAssets/getAssetBySerial");
const assetBySerial = async (app) => {
    app.get('/assetBySerial', {
        schema: {
            querystring: zod_1.z.object({
                serialNumber: zod_1.z.string().min(2, errorMessages_1.ERROR_MESSAGES.INVALID_SERIAL_NUMBER),
            }),
            response: {
                200: zod_1.z.object({
                    success: zod_1.z.boolean(),
                    message: zod_1.z.string(),
                    assetList: zod_1.z.array(zod_1.z.object({
                        id: zod_1.z.string(),
                        serialNumber: zod_1.z.string(),
                        name: zod_1.z.string(),
                        type: zod_1.z.string(),
                        assignedTo: zod_1.z.string().nullable(),
                        datePurchased: zod_1.z.string(),
                        assetNumber: zod_1.z.string(),
                        status: zod_1.z.string(),
                        note: zod_1.z.string().nullable(),
                        createdAt: zod_1.z.string(),
                        createdBy: zod_1.z.string(),
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
            const { serialNumber } = request.query;
            if (!serialNumber.trim()) {
                throw new errorTypes_1.ValidationError(errorMessages_1.ERROR_MESSAGES.ASSET_SERIAL_REQUIRED);
            }
            const { success, message, assetList } = await (0, getAssetBySerial_1.getAssetBySerial)({
                serialNumber,
            });
            return reply.status(200).send({
                success,
                message,
                assetList: assetList.map(asset => ({
                    id: asset.id,
                    serialNumber: asset.serialNumber,
                    name: asset.name,
                    type: asset.type,
                    assignedTo: asset.assignedTo,
                    datePurchased: asset.datePurchased,
                    assetNumber: asset.assetNumber,
                    status: asset.status,
                    note: asset.note,
                    createdAt: asset.createdAt.toString(),
                    createdBy: asset.createdBy,
                })),
            });
        }
        catch (error) {
            if (error instanceof errorTypes_1.ValidationError ||
                error instanceof errorTypes_1.NotFoundError) {
                throw error;
            }
            console.log('Error fetching asset by serial:', error);
            throw error;
        }
    });
};
exports.assetBySerial = assetBySerial;
