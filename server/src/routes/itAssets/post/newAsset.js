"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newAsset = void 0;
const zod_1 = require("zod");
const errorMessages_1 = require("../../../errors/errorMessages");
const errorTypes_1 = require("../../../errors/errorTypes");
const createAsset_1 = require("../../../functions/itAssets/createAsset");
const newAsset = async (app) => {
    app.post('/newAsset', {
        schema: {
            body: zod_1.z.object({
                serialNumber: zod_1.z.string().min(2, errorMessages_1.ERROR_MESSAGES.INVALID_SERIAL_NUMBER),
                name: zod_1.z.string().min(2, errorMessages_1.ERROR_MESSAGES.INVALID_NAME),
                type: zod_1.z.string().min(2, errorMessages_1.ERROR_MESSAGES.INVALID_ASSET_TYPE),
                assignedTo: zod_1.z.string().email().nullable(),
                datePurchased: zod_1.z.string().date(errorMessages_1.ERROR_MESSAGES.INVALID_DATE),
                assetNumber: zod_1.z.string().min(2, errorMessages_1.ERROR_MESSAGES.INVALID_ASSET_NUMBER),
                createdBy: zod_1.z.string().email(),
            }),
            response: {
                201: zod_1.z.object({
                    success: zod_1.z.boolean(),
                    message: zod_1.z.string(),
                    staff: zod_1.z.string().nullable(),
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
            // Extract parameters from request body
            const { serialNumber, name, type, assignedTo, datePurchased, assetNumber, createdBy, } = request.body;
            // Validate required fields
            if (!serialNumber.trim()) {
                throw new errorTypes_1.ValidationError(errorMessages_1.ERROR_MESSAGES.ASSET_SERIAL_REQUIRED);
            }
            if (!name.trim()) {
                throw new errorTypes_1.ValidationError(errorMessages_1.ERROR_MESSAGES.ASSET_NAME_REQUIRED);
            }
            if (!type.trim()) {
                throw new errorTypes_1.ValidationError(errorMessages_1.ERROR_MESSAGES.ASSET_TYPE_REQUIRED);
            }
            if (!assetNumber.trim()) {
                throw new errorTypes_1.ValidationError(errorMessages_1.ERROR_MESSAGES.ASSET_NUMBER_REQUIRED);
            }
            // Call createAsset function with the extracted parameters
            const result = await (0, createAsset_1.createAsset)({
                serialNumber,
                name,
                type,
                assignedTo,
                datePurchased,
                assetNumber,
                createdBy,
            });
            if (!result) {
                throw new errorTypes_1.DatabaseError(errorMessages_1.ERROR_MESSAGES.INTERNAL_DB_ERROR);
            }
            return reply.status(201).send({
                success: result.success,
                message: result.message,
                staff: result.staff,
            });
        }
        catch (error) {
            if (error instanceof errorTypes_1.ValidationError ||
                error instanceof errorTypes_1.DatabaseError) {
                throw error;
            }
            console.log('Error creating new asset:', error);
            throw error;
        }
    });
};
exports.newAsset = newAsset;
