import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedProduction() {
  console.log('🌱 Starting production database seeding...');

  try {
    // Create default admin user if it doesn't exist
    const existingAdmin = await prisma.admin.findUnique({
      where: { username: 'admin' },
    });

    if (!existingAdmin) {
      console.log('👤 Creating default admin user...');
      
      // In production, you should change this password immediately after first login
      const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'ChangeMe123!';
      const hashedPassword = await bcrypt.hash(defaultPassword, 12);

      await prisma.admin.create({
        data: {
          username: 'admin',
          password: hashedPassword,
        },
      });

      console.log('✅ Default admin user created');
      console.log('⚠️  IMPORTANT: Change the default admin password immediately after first login!');
      console.log(`   Default username: admin`);
      console.log(`   Default password: ${defaultPassword}`);
    } else {
      console.log('👤 Admin user already exists, skipping creation');
    }

    // Create sample game for testing (optional in production)
    const existingGame = await prisma.game.findUnique({
      where: { shortName: 'sample-game' },
    });

    if (!existingGame && process.env.CREATE_SAMPLE_GAME === 'true') {
      console.log('🎮 Creating sample game...');
      
      await prisma.game.create({
        data: {
          name: '示例游戏',
          shortName: 'sample-game',
          description: '这是一个示例游戏，用于测试系统功能',
          isActive: true,
        },
      });

      console.log('✅ Sample game created');
    }

    console.log('🎉 Production seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during production seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedProduction()
  .catch((error) => {
    console.error('❌ Production seeding failed:', error);
    process.exit(1);
  });