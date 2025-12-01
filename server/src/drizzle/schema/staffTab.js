"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.staffTab = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.staffTab = (0, pg_core_1.pgTable)('staff', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.text)('name').notNull(),
    email: (0, pg_core_1.text)('email').notNull().unique(),
    department: (0, pg_core_1.text)('department').notNull(),
    jobTitle: (0, pg_core_1.text)('jobTitle').notNull(),
    status: (0, pg_core_1.text)('status').notNull().default('ACTIVE'),
    note: (0, pg_core_1.text)('note').default(''),
    assetHistoryList: (0, pg_core_1.jsonb)('assetHistoryList').default([]),
    createdAt: (0, pg_core_1.timestamp)('createdAt').notNull().defaultNow(),
    createdBy: (0, pg_core_1.text)('createdBy').notNull(),
    changeLog: (0, pg_core_1.jsonb)('changeLog').default([]),
});
