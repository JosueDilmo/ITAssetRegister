import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '../env.js'
import { assetTab } from './schema/assetTab.js'
import { staffTab } from './schema/staffTab.js'
import { ticketCommentsTab } from './schema/ticketCommentsTab.js'
import { ticketsTab } from './schema/ticketsTab.js'

export const pg = postgres(env.POSTGRES_URL)
export const db = drizzle(pg, {
  logger: true,
  schema: { staffTab, assetTab, ticketsTab, ticketCommentsTab },
})
