const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showAll() {
  const users = await prisma.user.findMany();
  console.log('Total usuarios en BD:', users.length);
  users.forEach(u => {
    console.log('- Email:', u.email, '| Nombre:', u.name, '| Rol:', u.role, '| Password prefix:', u.password.slice(0, 15));
  });
  await prisma.$disconnect();
}
showAll().catch(console.error);
