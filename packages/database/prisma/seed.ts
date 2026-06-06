import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { resolveAdminSeedConfig } from './seed-config';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const {
    email: adminEmail,
    username: adminUsername,
    password: adminPassword,
  } = resolveAdminSeedConfig(process.env);
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existing) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        name: 'Administrador',
        username: adminUsername,
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
      },
    });
    console.log(`Admin user created: ${adminEmail}`);
  } else {
    if (!existing.username) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { username: adminUsername },
      });
    }
    console.log('Admin user already exists');
  }

  const productCount = await prisma.loanProduct.count();
  if (productCount === 0) {
    await prisma.loanProduct.createMany({
      data: [
        {
          name: 'Préstamo Personal (Interés Fijo)',
          interestType: 'FIXED',
          interestRate: 5,
          paymentFrequency: 'MONTHLY',
          maxTerm: 24,
          minAmount: 1000,
          maxAmount: 500000,
        },
        {
          name: 'Préstamo Diario (Flat)',
          interestType: 'FLAT',
          interestRate: 10,
          paymentFrequency: 'DAILY',
          maxTerm: 30,
          minAmount: 500,
          maxAmount: 50000,
        },
        {
          name: 'Préstamo Comercial (Reducing)',
          interestType: 'REDUCING',
          interestRate: 18,
          paymentFrequency: 'MONTHLY',
          maxTerm: 60,
          minAmount: 10000,
          maxAmount: 5000000,
        },
      ],
    });
    console.log('Loan products created');
  }

  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
