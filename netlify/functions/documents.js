const { PrismaClient } = require('@prisma/client');
const { neonConfig } = require('@neondatabase/serverless');
const { PrismaNeon } = require('@prisma/adapter-neon');
const { Pool } = require('@neondatabase/serverless');

// Configure Neon for serverless
neonConfig.fetchConnectionCache = true;

// Lazy initialization of Prisma
let prisma;

function getPrismaClient() {
  if (prisma) return prisma;

  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set');
    throw new Error('DATABASE_URL environment variable is required');
  }

  console.log('Initializing Prisma with DATABASE_URL');

  // Create connection pool
  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaNeon(pool);

  // Initialize Prisma Client with Neon adapter
  prisma = new PrismaClient({ adapter });
  
  return prisma;
}

exports.handler = async (event, context) => {
  // Set callbackWaitsForEmptyEventLoop to false to prevent Lambda from waiting
  context.callbackWaitsForEmptyEventLoop = false;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    console.log('Request:', event.httpMethod, event.path);
    console.log('Query params:', event.queryStringParameters);

    // Initialize Prisma client
    const prisma = getPrismaClient();

    const { deviceId } = event.queryStringParameters || {};
    
    if (!deviceId) {
      console.error('No deviceId provided');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'deviceId is required' })
      };
    }

    console.log('Looking for user with deviceId:', deviceId);

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { deviceId }
    });

    if (!user) {
      console.log('User not found, creating new user');
      user = await prisma.user.create({
        data: { deviceId }
      });
      console.log('Created user:', user.id);
    } else {
      console.log('Found user:', user.id);
    }

    // Handle different HTTP methods
    switch (event.httpMethod) {
      case 'GET': {
        // Get all documents for user
        const documents = await prisma.document.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' }
        });
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(documents)
        };
      }

      case 'POST': {
        // Create new document
        const createData = JSON.parse(event.body);
        console.log('Creating document:', createData);
        const newDocument = await prisma.document.create({
          data: {
            ...createData,
            userId: user.id
          }
        });
        console.log('Document created:', newDocument.id);
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(newDocument)
        };
      }

      case 'PUT': {
        // Update document
        const updateData = JSON.parse(event.body);
        const { id, ...updates } = updateData;
        const updatedDocument = await prisma.document.update({
          where: { id },
          data: updates
        });
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(updatedDocument)
        };
      }

      case 'DELETE': {
        // Delete document
        const { id: deleteId } = JSON.parse(event.body);
        await prisma.document.delete({
          where: { id: deleteId }
        });
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true })
        };
      }

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Error in handler:', error);
    console.error('Error stack:', error.stack);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        details: error.toString()
      })
    };
  }
};
