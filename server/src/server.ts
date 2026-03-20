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
import { assetById } from './routes/api/delete/assetById'
import { allAssets } from './routes/api/get/allAssets'
import { allStaff } from './routes/api/get/allStaff'
import { assetBySerial } from './routes/api/get/assetBySerial'
import { assetWithId } from './routes/api/get/assetWithId'
import { assetsByStaffEmail } from './routes/api/get/assetsByStaffEmail'
import { staffById } from './routes/api/get/staffById'
import { assetDetails } from './routes/api/patch/assetDetails'
import { staffDetails } from './routes/api/patch/staffDetails'
import { assetToStaff } from './routes/api/post/assetToStaff'
import { newAsset } from './routes/api/post/newAsset'
import { newStaff } from './routes/api/post/newStaff'

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

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.register(fastifyCors, {
  origin: env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
})

// Register the error handler
app.setErrorHandler(errorHandler)

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
  app.register(fastifySwaggerUi, {
    routePrefix: '/api/docs',
  })
}


// Group all routes into a plugin and register with prefix '/api'
async function routes(app: any) {
  app.register(newAsset)
  app.register(newStaff)
  app.register(allStaff)
  app.register(staffById)
  app.register(allAssets)
  app.register(assetWithId)
  app.register(assetById)
  app.register(assetToStaff)
  app.register(assetDetails)
  app.register(staffDetails)
  app.register(assetBySerial)
  app.register(assetsByStaffEmail)
}

app.register(routes, { prefix: '/api' })

// Start the server
app.listen({ port: env.PORT, host: '0.0.0.0' }).then(() => {
  console.log('HTTP SERVER RUNNING, ON PORT', env.PORT)
})
