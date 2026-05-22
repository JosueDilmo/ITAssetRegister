import fastifyCookie from '@fastify/cookie'
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
import { env } from './env.js'
import { errorHandler } from './errors/errorHandler.js'
import { assetRoutes } from './features/assets/routes.js'
import { assignmentRoutes } from './features/assignments/routes.js'
import { staffRoutes } from './features/staff/routes.js'
import { ticketRoutes } from './features/tickets/routes.js'
import { authenticate } from './hooks/authenticate.js'

const app = fastify({
  logger: {
    transport:
      env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
}).withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.register(fastifyCookie)

app.register(fastifyCors, {
  origin: env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
})

// Register the error handler
app.setErrorHandler(errorHandler)

app.addHook('onRequest', authenticate)

if (env.NODE_ENV === 'development') {
  // Documentation
  app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'IT Asset Register API',
        description:
          'Internal API for managing IT assets and staff assignments. Requires authentication via session cookie.',
        version: '1.0.0',
      },
      tags: [
        {
          name: 'IT Assets',
          description: 'Asset CRUD, search, and assignment operations',
        },
        {
          name: 'Staff',
          description: 'Staff member CRUD and lookup operations',
        },
      ],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'authjs.session-token',
          },
        },
      },
      security: [{ cookieAuth: [] }],
    },
    transform: jsonSchemaTransform,
  })
  app.register(fastifySwaggerUi, {
    routePrefix: '/api/docs',
  })
}


// Group all routes into a plugin and register with prefix '/api'
async function routes(app: any) {
  app.register(assetRoutes)
  app.register(staffRoutes)
  app.register(assignmentRoutes)
  app.register(ticketRoutes)
}

app.register(routes, { prefix: '/api' })

// Start the server
app.listen({ port: env.PORT, host: '0.0.0.0' }).then(() => {
  console.log('HTTP SERVER RUNNING, ON PORT', env.PORT)
})
