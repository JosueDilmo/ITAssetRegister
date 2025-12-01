import { fastifyCors } from '@fastify/cors'
import { fastifySwagger } from '@fastify/swagger'
import { fastifySwaggerUi } from '@fastify/swagger-ui'
import { fastify } from 'fastify'
import {
  type ZodTypeProvider,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { env } from './env'
import { errorHandler } from './errors/errorHandler'
import { assetById } from './routes/itAssets/delete/assetById'
import { allAssets } from './routes/itAssets/get/allAssets'
import { assetBySerial } from './routes/itAssets/get/assetBySerial'
import { assetsByStaffEmail } from './routes/itAssets/get/assetsByStaffEmail'
import { assetDetails } from './routes/itAssets/patch/assetDetails'
import { assetToStaff } from './routes/itAssets/post/assetToStaff'
import { newAsset } from './routes/itAssets/post/newAsset'
import { allStaff } from './routes/staff/get/allStaff'
import { staffDetails } from './routes/staff/patch/staffDetails'
import { newStaff } from './routes/staff/post/newStaff'

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

// Register error handler
app.register(errorHandler)

app.register(fastifyCors, {
  origin: env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
})

// Documentation
app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'IT Platform',
      version: '0.0.1',
    },
  },
  transform: jsonSchemaTransform,
})

// Register routes
app.register(fastifySwaggerUi, {
  routePrefix: '/docs',
})

app.register(newAsset) // post route to add a new asset
app.register(newStaff) // post route to add a new staff
app.register(allStaff) // get route to fetch all staffs
app.register(allAssets) // get route to fetch all assets
app.register(assetById) // delete route to remove an asset by ID
app.register(assetToStaff) // post route to assign an asset to a staff with confirmation
app.register(assetDetails) // patch route to update asset details
app.register(staffDetails) // patch route to update staff details
app.register(assetBySerial) // get route to fetch an asset by serial number
app.register(assetsByStaffEmail) // get route to fetch assets assigned to a staff by email

// Start the server
app.listen({ port: env.PORT, host: '0.0.0.0' }).then(() => {
  console.log('HTTP SERVER RUNNING, ON PORT', env.PORT)
})
