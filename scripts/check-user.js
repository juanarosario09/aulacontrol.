const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findFirst({
    where: { email: { equals: 'juanarosario200018@gmail.com', mode: 'insensitive' } }
  });
  console.log('User found:', !!user);
  if (user) {
    console.log('Email in DB:', user.email);
    console.log('Password hash in DB:', user.password.slice(0, 15) + '...');
    const match = await bcrypt.compare('Admin123!', user.password);
    console.log('Password Admin123! matches:', match);
  }
  await prisma.$disconnect();
}
check().catch(console.error);
