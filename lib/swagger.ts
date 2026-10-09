import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: 'app/api', 
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'TrueLern Production API',
        version: '1.0.0',
        description: 'Complete OpenAPI specification for TrueLern Backend. This API serves as the formal contract for Android application development.',
      },
      servers: [
        {
          url: 'https://360api.vnvision.in',
          description: 'Production Server',
        },
        {
          url: 'http://localhost:3000',
          description: 'Development Server',
        },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [],
    },
  });
  return spec;
};
