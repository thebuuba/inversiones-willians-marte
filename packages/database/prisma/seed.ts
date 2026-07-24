import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
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
          name: 'Préstamo Comercial',
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

  const anyUser = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });

  if (anyUser) {
    const taskCount = await prisma.task.count();
    if (taskCount === 0) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      await prisma.task.createMany({
        data: [
          {
            title: 'Revisión de cartera de préstamos',
            description: 'Actualizar estado de pagos de la cartera activa',
            dueDate: today,
            time: '09:00',
            priority: 'HIGH',
            category: 'oficina',
            status: 'PENDING',
            createdById: anyUser.id,
          },
          {
            title: 'Cobro a Juan Pérez - Cuota #3',
            description: 'Llamar para recordar vencimiento de cuota',
            dueDate: today,
            time: '11:30',
            priority: 'URGENT',
            category: 'cobro',
            status: 'PENDING',
            createdById: anyUser.id,
          },
          {
            title: 'Reunión con inversionista',
            description: 'Presentar rendimientos del portafolio',
            dueDate: today,
            time: '14:00',
            priority: 'HIGH',
            category: 'reunion',
            status: 'PENDING',
            createdById: anyUser.id,
          },
          {
            title: 'Desembolso préstamo comercial',
            description: 'Pérez Comercial SRL - RD$ 150,000',
            dueDate: today,
            time: '10:00',
            priority: 'URGENT',
            category: 'prestamo',
            status: 'PENDING',
            createdById: anyUser.id,
          },
          {
            title: 'Actualizar expedientes de clientes',
            description: 'Digitalizar documentos pendientes',
            dueDate: today,
            time: null,
            priority: 'MEDIUM',
            category: 'admin',
            status: 'PENDING',
            createdById: anyUser.id,
          },
          {
            title: 'Llamar a proveedor de seguridad',
            description: 'Cotizar sistema de alarmas para oficina',
            dueDate: today,
            time: '16:00',
            priority: 'LOW',
            category: 'oficina',
            status: 'PENDING',
            createdById: anyUser.id,
          },
          {
            title: 'Solicitud de préstamo - María Gómez',
            description: 'Revisar documentos y aprobar solicitud',
            dueDate: tomorrow,
            time: '09:30',
            priority: 'HIGH',
            category: 'prestamo',
            status: 'PENDING',
            createdById: anyUser.id,
          },
          {
            title: 'Reporte mensual de cobros',
            description: 'Generar reporte de cobros del mes',
            dueDate: yesterday,
            time: null,
            priority: 'MEDIUM',
            category: 'oficina',
            status: 'COMPLETED',
            createdById: anyUser.id,
          },
          {
            title: 'Enviar estado de cuenta a cliente',
            description: 'Cliente: Pedro Ramírez',
            dueDate: yesterday,
            time: '15:00',
            priority: 'MEDIUM',
            category: 'admin',
            status: 'COMPLETED',
            createdById: anyUser.id,
          },
          {
            title: 'Renovación de seguro vehicular',
            description: 'Vence el próximo mes - preparar documentación',
            dueDate: tomorrow,
            time: null,
            priority: 'LOW',
            category: 'oficina',
            status: 'PENDING',
            createdById: anyUser.id,
          },
        ],
      });
      console.log('Tasks created');
    }
  }

  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
