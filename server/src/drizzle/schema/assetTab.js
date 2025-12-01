"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetTab = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.assetTab = (0, pg_core_1.pgTable)('asset', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    serialNumber: (0, pg_core_1.text)('serialNumber').notNull().unique(),
    name: (0, pg_core_1.text)('name').notNull(),
    type: (0, pg_core_1.text)('type').notNull(),
    assignedTo: (0, pg_core_1.text)('assignedTo'),
    dateAssigned: (0, pg_core_1.date)('dateAssigned', { mode: 'string' }),
    datePurchased: (0, pg_core_1.date)('datePurchased', { mode: 'string' }).notNull(),
    assetNumber: (0, pg_core_1.text)('assetNumber').notNull().unique(),
    status: (0, pg_core_1.text)('status').notNull().default('ACTIVE'),
    note: (0, pg_core_1.text)('note').default(''),
    createdAt: (0, pg_core_1.timestamp)('createdAt').notNull().defaultNow(),
    createdBy: (0, pg_core_1.text)('createdBy').notNull(),
    changeLog: (0, pg_core_1.jsonb)('changeLog').default([]),
});
