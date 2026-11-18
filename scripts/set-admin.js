const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function setAdmin() {
  const hash = await bcrypt.hash('Admin123!', 12);
  const email = 'juanarosario200018@gmail.com';
  
  let school = await prisma.school.findFirst();
  if (!school) {
    school = await prisma.school.create({
      data: { name: 'Escuela Primaria San Juan' }
    });
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: 'ADMIN',
      password: hash,
      name: 'Juana Rosario'
    },
    create: {
      email,
      name: 'Juana Rosario',
      password: hash,
      role: 'ADMIN'
    }
  });

  await prisma.schoolMember.upsert({
    where: {
      userId_schoolId: {
        userId: user.id,
        schoolId: school.id
      }
    },
    update: { role: 'ADMIN' },
    create: {
      userId: user.id,
      schoolId: school.id,
      role: 'ADMIN'
    }
  });

  console.log('EXITO: Usuario creado/actualizado correctamente:');
  console.log('Email:', user.email);
  console.log('Nombre:', user.name);
  console.log('Rol:', user.role);

  await prisma.$disconnect();
}

setAdmin().catch(console.error);
