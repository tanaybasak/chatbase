const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { deviceId } = event.queryStringParameters || {};
    
    if (!deviceId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'deviceId is required' })
      };
    }

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { deviceId }
    });

    if (!user) {
      user = await prisma.user.create({
        data: { deviceId }
      });
    }

    switch (event.httpMethod) {
      case 'GET':
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

      case 'POST':
        // Create new document
        const createData = JSON.parse(event.body);
        const newDocument = await prisma.document.create({
          data: {
            ...createData,
            userId: user.id
          }
        });
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(newDocument)
        };

      case 'PUT':
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

      case 'DELETE':
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

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  } finally {
    await prisma.$disconnect();
  }
};
