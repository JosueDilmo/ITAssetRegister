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
import { assetById } from './routes/delete/assetById'
import { allAssets } from './routes/get/allAssets'
import { allStaff } from './routes/get/allStaff'
import { assetBySerial } from './routes/get/assetBySerial'
import { assetWithId } from './routes/get/assetWithId'
import { assetsByStaffEmail } from './routes/get/assetsByStaffEmail'
import { staffById } from './routes/get/staffById'
import { assetDetails } from './routes/patch/assetDetails'
import { staffDetails } from './routes/patch/staffDetails'
import { assetToStaff } from './routes/post/assetToStaff'
import { newAsset } from './routes/post/newAsset'
import { newStaff } from './routes/post/newStaff'

const app = fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
}).withTypeProvider<ZodTypeProvider>()

// Register error handler
app.register(errorHandler)

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.register(fastifyCors, {
  origin: env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
})

if (process.env.NODE_ENV === 'development') {
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
}

app.register(newAsset) // post route to add a new asset
app.register(newStaff) // post route to add a new staff
app.register(allStaff) // get route to fetch all staffs
app.register(staffById) // get route to fetch staff by ID
app.register(allAssets) // get route to fetch all assets
app.register(assetWithId) // get route to fetch an asset by ID
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
