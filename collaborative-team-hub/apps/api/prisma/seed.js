const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function main() {
  const prisma = new PrismaClient();
  const password = 'Demo@12345';
  const hash = await bcrypt.hash(password, 10);

  console.log('Seeding demo user...');
  const demo = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: { name: 'Demo User', email: 'demo@example.com', passwordHash: hash }
  });

  console.log('Creating demo workspace and sample data...');
  const ws = await prisma.workspace.upsert({
    where: { id: demo.id },
    update: {},
    create: {
      id: demo.id,
      name: 'Demo Workspace',
      description: 'A demo workspace',
      ownerId: demo.id
    }
  });

  console.log('Seed complete.');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
