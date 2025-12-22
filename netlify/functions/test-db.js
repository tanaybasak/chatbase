exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    // Test 1: Check if DATABASE_URL exists
    const hasDbUrl = !!process.env.DATABASE_URL;
    
    // Test 2: Try to load Prisma modules
    let prismaLoaded = false;
    let neonLoaded = false;
    let clientCreated = false;
    let querySuccess = false;
    let error = null;
    let queryError = null;

    try {
      const { PrismaClient } = require('@prisma/client');
      const { neon, neonConfig } = require('@neondatabase/serverless');
      const { PrismaNeon } = require('@prisma/adapter-neon');
      
      prismaLoaded = true;
      neonLoaded = true;

      // Test 3: Try to create client with neon HTTP function
      if (hasDbUrl) {
        neonConfig.fetchConnectionCache = true;
        
        console.log('Using neon HTTP function instead of Pool');
        const sql = neon(process.env.DATABASE_URL);
        const adapter = new PrismaNeon(sql);
        
        const prisma = new PrismaClient({ adapter });
        clientCreated = true;

        // Test 4: Try an actual query
        try {
          console.log('Attempting user count query...');
          const userCount = await prisma.user.count();
          console.log('Query succeeded! User count:', userCount);
          querySuccess = true;
        } catch (qe) {
          console.error('Query failed:', qe);
          queryError = qe.message;
        }
      }
    } catch (e) {
      error = e.message;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        databaseUrlExists: hasDbUrl,
        databaseUrlLength: hasDbUrl ? process.env.DATABASE_URL.length : 0,
        prismaLoaded,
        neonLoaded,
        clientCreated,
        querySuccess,
        error,
        queryError,
        nodeVersion: process.version
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message, stack: error.stack })
    };
  }
};
