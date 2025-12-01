"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allAssets = void 0;
const zod_1 = require("zod");
const errorMessages_1 = require("../../../errors/errorMessages");
const getAsset_1 = require("../../../functions/itAssets/getAsset");
const allAssets = async (app) => {
    app.get('/allAssets', {
        schema: {
            querystring: zod_1.z.object({
                id: zod_1.z.string().uuid(errorMessages_1.ERROR_MESSAGES.INVALID_ID).optional(),
            }),
            response: {
                200: zod_1.z.array(zod_1.z.object({
                    id: zod_1.z.string().uuid(),
                    serialNumber: zod_1.z.string(),
                    name: zod_1.z.string(),
                    type: zod_1.z.string(),
                    assignedTo: zod_1.z.string().nullable(),
                    dateAssigned: zod_1.z.string().nullable(),
                    datePurchased: zod_1.z.string(),
                    assetNumber: zod_1.z.string(),
                    status: zod_1.z.string(),
                    note: zod_1.z.string().nullable(),
                    createdAt: zod_1.z.string(),
                    createdBy: zod_1.z.string(),
                    changeLog: zod_1.z.array(zod_1.z.object({
                        updatedBy: zod_1.z.string(),
                        updatedAt: zod_1.z.string(),
                        updatedField: zod_1.z.string(),
                        previousValue: zod_1.z.string().nullable(),
                        newValue: zod_1.z.string().nullable(),
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
            const { allAsset } = await (0, getAsset_1.getAsset)();
            const filteredAsset = id
                ? allAsset.filter(asset => asset.id === id)
                : allAsset;
            return reply.status(200).send(filteredAsset.map(asset => {
                return {
                    id: asset.id,
                    serialNumber: asset.serialNumber,
                    name: asset.name,
                    type: asset.type,
                    assignedTo: asset.assignedTo,
                    dateAssigned: asset.dateAssigned,
                    datePurchased: asset.datePurchased,
                    assetNumber: asset.assetNumber,
                    status: asset.status,
                    note: asset.note,
                    createdAt: asset.createdAt.toString(),
                    createdBy: asset.createdBy,
                    changeLog: asset.changeLog.map(log => ({
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
            console.error('Error fetching assets:', error);
            throw error;
        }
    });
};
exports.allAssets = allAssets;
