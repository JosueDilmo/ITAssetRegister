"use strict";
// Standard error messages to maintain consistency
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_MESSAGES = void 0;
exports.ERROR_MESSAGES = {
    // Generic errors
    INTERNAL_SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
    // Authorization errors
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    MISSING_CONFIRMATION: 'Confirmation is required to proceed.',
    // Database errors
    DATABASE_CONNECTION_ERROR: 'Database connection error. Please try again later.',
    INTERNAL_DB_ERROR: 'A database internal error occurred. Please try again later.',
    // Asset errors
    ASSET_NOT_FOUND: 'Asset not found.',
    ASSET_ALREADY_EXISTS: 'Asset with this serial number already exists.',
    ASSET_ID_REQUIRED: 'Asset ID is required.',
    ASSET_SERIAL_REQUIRED: 'Asset serial number is required.',
    ASSET_NAME_REQUIRED: 'Asset name is required.',
    ASSET_TYPE_REQUIRED: 'Asset type is required.',
    ASSET_NUMBER_REQUIRED: 'Asset number is required.',
    ASSET_STATUS_REQUIRED: 'Asset status is required.',
    ASSET_UPDATED_BY_REQUIRED: 'Updated by information is required.',
    ASSET_ASSIGNMENT_FAILED: 'Failed to assign asset to staff.',
    ASSET_REMOVAL_FAILED: 'Failed to remove asset assignment.',
    ASSET_UPDATE_FAILED: 'Failed to update asset details.',
    // Staff errors
    STAFF_NOT_FOUND: 'Staff not found.',
    STAFF_ID_REQUIRED: 'Staff ID is required.',
    STAFF_ALREADY_EXISTS: 'Staff with this email already exists.',
    STAFF_EMAIL_REQUIRED: 'Staff email is required.',
    STAFF_UPDATE_FAILED: 'Failed to update staff details.',
    STAFF_NAME_REQUIRED: 'Staff name is required.',
    STAFF_DEPARTMENT_REQUIRED: 'Staff department is required.',
    STAFF_JOB_TITLE_REQUIRED: 'Staff job title is required.',
    STAFF_STATUS_REQUIRED: 'Staff status is required.',
    // Validation errors
    MISSING_UPDATED_BY: 'Updated by information is required.',
    MISSING_REQUIRED_FIELDS: 'Please fill in all required fields.',
    INVALID_EMAIL: 'Please provide a valid email address.',
    INVALID_INPUT: 'Invalid input provided. Please check and try again.',
    INVALID_ID: 'Invalid ID format.',
    INVALID_DATE: 'Please provide a valid date in the format yyyy-mm-dd.',
    INVALID_ASSET_TYPE: 'Please provide a valid ASSET type.',
    INVALID_STATUS: 'Please provide a valid ASSET status.',
    INVALID_NOTE: 'Please provide a valid note (at least 10 characters).',
    INVALID_SERIAL_NUMBER: 'Please provide a valid serial number.',
    INVALID_ASSET_NUMBER: 'Please provide a valid asset number.',
    INVALID_NAME: 'Please provide a valid name.',
    INVALID_ASSIGNED_TO: 'Please provide a valid staff email address.',
    INVALID_DEPARTMENT: 'Please provide a valid department name.',
    INVALID_JOB_TITLE: 'Please provide a valid job title.',
};
