const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@procureflow.com';
  const password = 'password';
  const name = 'Admin User';
  const companyName = 'Demo Corp';

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    console.log('User already exists');
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  
  const organization = await prisma.organization.create({
    data: {
      name: companyName,
      members: {
        create: { email, passwordHash, name, role: 'ADMIN' }
      }
    }
  });

  console.log('Created admin account: admin@procureflow.com / password');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
