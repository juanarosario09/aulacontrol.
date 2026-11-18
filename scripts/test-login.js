const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function test() {
  const user = await prisma.user.findFirst({
    where: { email: { equals: 'juanarosario200018@gmail.com', mode: 'insensitive' } }
  });
  console.log('User in DB:', user?.email, 'Role:', user?.role);
  if (!user) {
    console.log('USER NOT FOUND');
    return;
  }
  const isMatch1 = await bcrypt.compare('Admin123!', user.password);
  console.log('Match Admin123!:', isMatch1);
  const isMatch2 = await bcrypt.compare('admin123', user.password);
  console.log('Match admin123:', isMatch2);
  const isMatch3 = await bcrypt.compare('Admin123', user.password);
  console.log('Match Admin123:', isMatch3);
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
