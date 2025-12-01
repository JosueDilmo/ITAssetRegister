"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetDetails = void 0;
const zod_1 = require("zod");
const errorMessages_1 = require("../../../errors/errorMessages");
const errorTypes_1 = require("../../../errors/errorTypes");
const updateAssetDetails_1 = require("../../../functions/itAssets/updateAssetDetails");
const assetDetails = async (app) => {
    app.patch('/assetDetails/:id', {
        schema: {
            params: zod_1.z.object({
                id: zod_1.z.string().uuid(errorMessages_1.ERROR_MESSAGES.INVALID_ID),
            }),
            body: zod_1.z.object({
                status: zod_1.z.string().min(2, errorMessages_1.ERROR_MESSAGES.INVALID_STATUS),
                note: zod_1.z.string().min(10, errorMessages_1.ERROR_MESSAGES.INVALID_NOTE).nullable(),
                updatedBy: zod_1.z.string().email(errorMessages_1.ERROR_MESSAGES.MISSING_UPDATED_BY),
            }),
            response: {
                201: zod_1.z.object({
                    success: zod_1.z.boolean(),
                    message: zod_1.z.string(),
                }),
                500: zod_1.z.object({
                    success: zod_1.z.boolean(),
                    message: zod_1.z.string(),
                }),
            },
        },
    }, async (request, reply) => {
        try {
            const assetID = request.params.id;
            const { status, note, updatedBy } = request.body;
            if (!status.trim()) {
                throw new errorTypes_1.ValidationError(errorMessages_1.ERROR_MESSAGES.ASSET_STATUS_REQUIRED);
            }
            if (!updatedBy.trim()) {
                throw new errorTypes_1.ValidationError(errorMessages_1.ERROR_MESSAGES.MISSING_UPDATED_BY);
            }
            const result = await (0, updateAssetDetails_1.updateAssetDetails)({
                id: assetID,
                status: status,
                note: note,
                updatedBy: updatedBy,
            });
            return reply
                .status(201)
                .send({ success: result.success, message: result.message });
        }
        catch (error) {
            if (error instanceof errorTypes_1.ValidationError) {
                throw error;
            }
            console.error('Error in editing asset details', error);
            throw error;
        }
    });
};
exports.assetDetails = assetDetails;
