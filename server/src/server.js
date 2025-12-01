Object.defineProperty(exports, '__esModule', { value: true })
const cors_1 = require('@fastify/cors')
const swagger_1 = require('@fastify/swagger')
const swagger_ui_1 = require('@fastify/swagger-ui')
const fastify_1 = require('fastify')
const fastify_type_provider_zod_1 = require('fastify-type-provider-zod')
const env_1 = require('./env')
const errorHandler_1 = require('./errors/errorHandler')
const assetById_1 = require('./routes/itAssets/delete/assetById')
const allAssets_1 = require('./routes/itAssets/get/allAssets')
const assetBySerial_1 = require('./routes/itAssets/get/assetBySerial')
const assetsByStaffEmail_1 = require('./routes/itAssets/get/assetsByStaffEmail')
const assetDetails_1 = require('./routes/itAssets/patch/assetDetails')
const assetToStaff_1 = require('./routes/itAssets/post/assetToStaff')
const newAsset_1 = require('./routes/itAssets/post/newAsset')
const allStaff_1 = require('./routes/staff/get/allStaff')
const staffDetails_1 = require('./routes/staff/patch/staffDetails')
const newStaff_1 = require('./routes/staff/post/newStaff')
const app = (0, fastify_1.fastify)().withTypeProvider()
app.setSerializerCompiler(fastify_type_provider_zod_1.serializerCompiler)
app.setValidatorCompiler(fastify_type_provider_zod_1.validatorCompiler)
// Register error handler
app.register(errorHandler_1.errorHandler)
app.register(cors_1.fastifyCors, {
  origin: env_1.env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
})
// Documentation
app.register(swagger_1.fastifySwagger, {
  openapi: {
    info: {
      title: 'IT Platform',
      version: '0.0.1',
    },
  },
  transform: fastify_type_provider_zod_1.jsonSchemaTransform,
})
// Register routes
app.register(swagger_ui_1.fastifySwaggerUi, {
  routePrefix: '/docs',
})
app.register(newAsset_1.newAsset) // post route to add a new asset
app.register(newStaff_1.newStaff) // post route to add a new staff
app.register(allStaff_1.allStaff) // get route to fetch all staffs
app.register(allAssets_1.allAssets) // get route to fetch all assets
app.register(assetById_1.assetById) // delete route to remove an asset by ID
app.register(assetToStaff_1.assetToStaff) // post route to assign an asset to a staff with confirmation
app.register(assetDetails_1.assetDetails) // patch route to update asset details
app.register(staffDetails_1.staffDetails) // patch route to update staff details
app.register(assetBySerial_1.assetBySerial) // get route to fetch an asset by serial number
app.register(assetsByStaffEmail_1.assetsByStaffEmail) // get route to fetch assets assigned to a staff by email

// Start the server
app.listen({ port: env_1.env.PORT, host: '0.0.0.0' }).then(() => {
  console.log('HTTP SERVER RUNNING, ON PORT', env_1.env.PORT)
})
