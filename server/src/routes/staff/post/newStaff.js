"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newStaff = void 0;
const zod_1 = require("zod");
const errorMessages_1 = require("../../../errors/errorMessages");
const errorTypes_1 = require("../../../errors/errorTypes");
const createStaff_1 = require("../../../functions/staff/createStaff");
const newStaff = async (app) => {
    app.post('/newStaff', {
        schema: {
            body: zod_1.z.object({
                name: zod_1.z.string().min(2, errorMessages_1.ERROR_MESSAGES.INVALID_NAME),
                email: zod_1.z.string().email(errorMessages_1.ERROR_MESSAGES.INVALID_EMAIL),
                department: zod_1.z.string().min(2, errorMessages_1.ERROR_MESSAGES.INVALID_DEPARTMENT),
                jobTitle: zod_1.z.string().min(2, errorMessages_1.ERROR_MESSAGES.INVALID_JOB_TITLE),
                createdBy: zod_1.z.string().email(errorMessages_1.ERROR_MESSAGES.MISSING_REQUIRED_FIELDS),
            }),
            response: {
                201: zod_1.z.object({
                    success: zod_1.z.boolean(),
                    message: zod_1.z.string(),
                    staff: zod_1.z.string(),
                }),
                500: zod_1.z.object({
                    success: zod_1.z.boolean(),
                    message: zod_1.z.string(),
                    staff: zod_1.z.string().nullable(),
                }),
            },
        },
    }, async (request, reply) => {
        try {
            const { name, email, department, jobTitle, createdBy } = request.body;
            if (!name.trim()) {
                throw new errorTypes_1.ValidationError(errorMessages_1.ERROR_MESSAGES.STAFF_NAME_REQUIRED);
            }
            if (!email.trim()) {
                throw new errorTypes_1.ValidationError(errorMessages_1.ERROR_MESSAGES.STAFF_EMAIL_REQUIRED);
            }
            if (!department.trim()) {
                throw new errorTypes_1.ValidationError(errorMessages_1.ERROR_MESSAGES.STAFF_DEPARTMENT_REQUIRED);
            }
            if (!jobTitle.trim()) {
                throw new errorTypes_1.ValidationError(errorMessages_1.ERROR_MESSAGES.STAFF_JOB_TITLE_REQUIRED);
            }
            const result = await (0, createStaff_1.createStaff)({
                name,
                email,
                department,
                jobTitle,
                createdBy,
            });
            return reply.status(201).send({
                success: result.success,
                message: result.message,
                staff: result.staff,
            });
        }
        catch (error) {
            if (error instanceof errorTypes_1.ValidationError) {
                throw error;
            }
            console.error('Error creating staff:', error);
            throw error;
        }
    });
};
exports.newStaff = newStaff;
