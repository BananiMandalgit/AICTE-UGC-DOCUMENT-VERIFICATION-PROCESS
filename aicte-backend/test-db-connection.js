const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
    try {
        await prisma.$connect();
        console.log('✓ Database connection successful!');
        
        // Try to query the database
        const result = await prisma.$queryRaw`SELECT current_database(), current_user;`;
        console.log('✓ Database info:', result);
        
        await prisma.$disconnect();
        process.exit(0);
    } catch (error) {
        console.error('✗ Database connection failed:', error.message);
        process.exit(1);
    }
}

testConnection();
