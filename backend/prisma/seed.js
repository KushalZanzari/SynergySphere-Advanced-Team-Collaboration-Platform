const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting to seed the database...');

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'john@example.com' },
      update: {},
      create: {
        email: 'john@example.com',
        name: 'John Doe',
        password: hashedPassword,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
      }
    }),
    prisma.user.upsert({
      where: { email: 'jane@example.com' },
      update: {},
      create: {
        email: 'jane@example.com',
        name: 'Jane Smith',
        password: hashedPassword,
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
      }
    }),
    prisma.user.upsert({
      where: { email: 'mike@example.com' },
      update: {},
      create: {
        email: 'mike@example.com',
        name: 'Mike Johnson',
        password: hashedPassword,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
      }
    })
  ]);

  console.log('✅ Created users');

  // Create channels
  const channels = await Promise.all([
    prisma.channel.upsert({
      where: { name: 'general' },
      update: {},
      create: {
        name: 'general',
        description: 'General discussion channel'
      }
    }),
    prisma.channel.upsert({
      where: { name: 'development' },
      update: {},
      create: {
        name: 'development',
        description: 'Development discussions and code reviews'
      }
    }),
    prisma.channel.upsert({
      where: { name: 'design' },
      update: {},
      create: {
        name: 'design',
        description: 'Design discussions and feedback'
      }
    })
  ]);

  console.log('✅ Created channels');

  // Create projects
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        name: 'SynergySphere MVP',
        description: 'Building the core features of our collaboration platform'
      }
    }),
    prisma.project.create({
      data: {
        name: 'Mobile App',
        description: 'Native mobile application development'
      }
    })
  ]);

  console.log('✅ Created projects');

  // Create tasks
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'Implement user authentication',
        description: 'Set up JWT-based authentication with login/signup',
        status: 'DONE',
        priority: 'HIGH',
        projectId: projects[0].id,
        assigneeId: users[0].id,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      }
    }),
    prisma.task.create({
      data: {
        title: 'Build real-time chat system',
        description: 'Implement Socket.io for real-time messaging',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        projectId: projects[0].id,
        assigneeId: users[1].id,
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days from now
      }
    }),
    prisma.task.create({
      data: {
        title: 'Design Kanban board UI',
        description: 'Create drag-and-drop task board interface',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId: projects[0].id,
        assigneeId: users[2].id,
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // 10 days from now
      }
    }),
    prisma.task.create({
      data: {
        title: 'Implement analytics dashboard',
        description: 'Build charts and metrics for team productivity',
        status: 'TODO',
        priority: 'LOW',
        projectId: projects[0].id,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
      }
    })
  ]);

  console.log('✅ Created tasks');

  // Create events
  const events = await Promise.all([
    prisma.event.create({
      data: {
        title: 'Sprint Planning Meeting',
        description: 'Weekly sprint planning and task assignment',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        userId: users[0].id
      }
    }),
    prisma.event.create({
      data: {
        title: 'Design Review',
        description: 'Review UI/UX designs for mobile app',
        date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
        userId: users[1].id
      }
    }),
    prisma.event.create({
      data: {
        title: 'Code Review Session',
        description: 'Review authentication implementation',
        date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        userId: users[2].id
      }
    })
  ]);

  console.log('✅ Created events');

  // Create sample messages
  const messages = await Promise.all([
    prisma.message.create({
      data: {
        content: 'Welcome to SynergySphere! 🚀',
        userId: users[0].id,
        channelId: channels[0].id
      }
    }),
    prisma.message.create({
      data: {
        content: 'Great to be here! Looking forward to collaborating with everyone.',
        userId: users[1].id,
        channelId: channels[0].id
      }
    }),
    prisma.message.create({
      data: {
        content: 'The authentication system is working perfectly!',
        userId: users[0].id,
        channelId: channels[1].id
      }
    }),
    prisma.message.create({
      data: {
        content: 'I\'ve started working on the chat system. Should have it ready by tomorrow.',
        userId: users[1].id,
        channelId: channels[1].id
      }
    }),
    prisma.message.create({
      data: {
        content: 'The new design mockups look amazing! Can\'t wait to implement them.',
        userId: users[2].id,
        channelId: channels[2].id
      }
    })
  ]);

  console.log('✅ Created sample messages');

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
