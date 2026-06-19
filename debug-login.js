const { PrismaClient } = require('@prisma/client');
const { createHash } = require('crypto');

const prisma = new PrismaClient();

async function testLogin() {
  try {
    console.log('Testing database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected');
    
    // Check members table
    const memberCount = await prisma.members.count();
    console.log(`✅ Found ${memberCount} members in database`);
    
    // Get first few members for testing
    const members = await prisma.members.findMany({
      take: 3,
      select: { id: true, phone: true, name: true, status: true, login_status: true }
    });
    
    console.log('Sample members:');
    members.forEach(m => {
      console.log(`- ID: ${m.id}, Phone: ${m.phone}, Name: ${m.name}, Status: ${m.status}, LoginStatus: ${m.login_status}`);
    });
    
    // Test password hash
    const testPassword = 'admin123';
    const md5Hash = createHash('md5').update(testPassword).digest('hex');
    console.log(`\nPassword "admin123" MD5 hash: ${md5Hash}`);
    
    // Test login query with demo data
    if (members.length > 0) {
      const testPhone = members[0].phone;
      console.log(`\nTesting login query for phone: ${testPhone}`);
      
      const rows = await prisma.$queryRaw`
        SELECT id, phone, password, status, type, name, login_status 
        FROM members 
        WHERE phone = ${testPhone} 
        LIMIT 1
      `;
      
      console.log('Query result:', rows[0]);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();