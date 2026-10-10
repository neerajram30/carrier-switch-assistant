import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const DEV_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'dev@career-switch.local',
  name: 'Development User',
};

async function main() {
  console.log('🌱 Seeding database...');

  const user = await prisma.user.upsert({
    where: { id: DEV_USER.id },
    update: {
      email: DEV_USER.email,
      name: DEV_USER.name,
    },
    create: {
      id: DEV_USER.id,
      email: DEV_USER.email,
      name: DEV_USER.name,
    },
  });

  console.log(`✅ Seeded valid user: ${user.name} (${user.id})`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
