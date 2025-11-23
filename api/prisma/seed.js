const { faker } = require('@faker-js/faker');
const bcrypt = require('bcrypt');

const prisma = require('../services/connect-db');
const logger = require('../utils/logger');

const fakeUser = () => {
  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();
  const fullName = `${firstName} ${lastName}`;
  const email = faker.internet.email(firstName, lastName).toLowerCase();
  const username = faker.internet.userName(firstName, lastName).toLowerCase();
  return {
    name: fullName,
    email,
    username,
  };
};

async function main() {
  const fakerRounds = 250;
  logger.info('Seeding....');
  const hashedPassword = await bcrypt.hash('password', 12);
  for (let i = 0; i < fakerRounds; i += 1) {
    const user = fakeUser();
    // eslint-disable-next-line no-await-in-loop
    await prisma.user.create({
      data: {
        username: user.username,
        email: user.email,
        hashedPassword,
        provider: 'email',
        profile: {
          create: {
            name: user.name,
          },
        },
      },
    });
  }


  const vnr = await prisma.organization.upsert({
    where: { domain: 'vnrvjiet.in' },
    update: {},
    create: {
      name: 'VNR VJIET',
      domain: 'vnrvjiet.in',
      country: 'India',
      is_active: true,
    },
  });

  await prisma.department.upsert({
    where: { id: 'some-uuid' },
    update: {},
    create: {
      organization_id: vnr.id,
      name: 'Computer Science & Engineering',
      is_active: true,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    logger.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
