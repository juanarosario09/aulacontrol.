const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_ad5imgGtb0fA@ep-jolly-glade-bcc9vt5v-pooler.c-16.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
    }
  }
});
p.user.count()
  .then(c => console.log('Count from explicit URL:', c))
  .catch(console.error)
  .finally(() => p.$disconnect());
