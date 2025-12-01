import {
  date,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

export const assetTab = pgTable('asset', {
  id: uuid('id').primaryKey().defaultRandom(),
  serialNumber: text('serialNumber').notNull().unique(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  maker: text('maker').notNull(),
  assignedTo: text('assignedTo'),
  dateAssigned: date('dateAssigned', { mode: 'string' }),
  datePurchased: date('datePurchased', { mode: 'string' }).notNull(),
  assetNumber: text('assetNumber').notNull().unique(),
  status: text('status').notNull().default('ACTIVE'),
  note: text('note').default(''),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  createdBy: text('createdBy').notNull(),
  changeLog: jsonb('changeLog').default([]),
})
