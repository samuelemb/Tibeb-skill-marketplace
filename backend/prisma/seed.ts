import { PrismaClient, UserRole, JobStatus, ProposalStatus, ContractStatus, JobCategory } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data (optional - comment out if you want to keep existing data)
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.job.deleteMany();
  await prisma.user.deleteMany();

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Clients
  const client1 = await prisma.user.create({
    data: {
      email: 'client1@example.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.CLIENT,
    },
  });

  const client2 = await prisma.user.create({
    data: {
      email: 'client2@example.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      role: UserRole.CLIENT,
    },
  });

  // Create Freelancers
  const freelancer1 = await prisma.user.create({
    data: {
      email: 'freelancer1@example.com',
      password: hashedPassword,
      firstName: 'Alice',
      lastName: 'Johnson',
      role: UserRole.FREELANCER,
    },
  });

  const freelancer2 = await prisma.user.create({
    data: {
      email: 'freelancer2@example.com',
      password: hashedPassword,
      firstName: 'Bob',
      lastName: 'Williams',
      role: UserRole.FREELANCER,
    },
  });

  const freelancer3 = await prisma.user.create({
    data: {
      email: 'freelancer3@example.com',
      password: hashedPassword,
      firstName: 'Charlie',
      lastName: 'Brown',
      role: UserRole.FREELANCER,
    },
  });

  console.log('✅ Created users');

  // Create Jobs
  const job1 = await prisma.job.create({
    data: {
      title: 'Website Redesign for E-commerce Store',
      description: 'I need a complete redesign of my e-commerce website. Looking for a modern, responsive design with improved user experience. The site should be mobile-friendly and have fast loading times.',
      budget: 5000,
      category: JobCategory.WEB_DEVELOPMENT,
      status: JobStatus.OPEN,
      clientId: client1.id,
    },
  });

  const job2 = await prisma.job.create({
    data: {
      title: 'Mobile App Development - iOS & Android',
      description: 'Looking for an experienced mobile developer to build a fitness tracking app. Features include: workout logging, progress tracking, social sharing, and premium subscription integration.',
      budget: 15000,
      category: JobCategory.MOBILE_DEVELOPMENT,
      status: JobStatus.OPEN,
      clientId: client1.id,
    },
  });

  const job3 = await prisma.job.create({
    data: {
      title: 'Logo Design and Brand Identity',
      description: 'Need a professional logo design and complete brand identity package for a new tech startup. Should be modern, minimalist, and work across digital and print media.',
      budget: 800,
      category: JobCategory.DESIGN,
      status: JobStatus.OPEN,
      clientId: client2.id,
    },
  });

  const job4 = await prisma.job.create({
    data: {
      title: 'Content Writing - Blog Posts',
      description: 'Looking for a content writer to create 10 high-quality blog posts about digital marketing. Each post should be 1500+ words, SEO optimized, and include relevant images.',
      budget: 500,
      category: JobCategory.WRITING,
      status: JobStatus.DRAFT,
      clientId: client2.id,
    },
  });

  console.log('✅ Created jobs');

  // Create Proposals
  const proposal1 = await prisma.proposal.create({
    data: {
      jobId: job1.id,
      freelancerId: freelancer1.id,
      message: 'I have 5+ years of experience in web design and have completed similar e-commerce projects. I can deliver a modern, responsive design within 3 weeks. My approach focuses on user experience and conversion optimization.',
      proposedAmount: 4500,
      status: ProposalStatus.PENDING,
    },
  });

  const proposal2 = await prisma.proposal.create({
    data: {
      jobId: job1.id,
      freelancerId: freelancer2.id,
      message: 'I specialize in e-commerce redesigns and can help you increase sales with a better design. I offer unlimited revisions and will ensure the site is fully responsive.',
      proposedAmount: 4800,
      status: ProposalStatus.PENDING,
    },
  });

  const proposal3 = await prisma.proposal.create({
    data: {
      jobId: job2.id,
      freelancerId: freelancer1.id,
      message: 'I have extensive experience in React Native development and have built several fitness apps. I can deliver both iOS and Android versions with all requested features.',
      proposedAmount: 14000,
      status: ProposalStatus.PENDING,
    },
  });

  const proposal4 = await prisma.proposal.create({
    data: {
      jobId: job3.id,
      freelancerId: freelancer3.id,
      message: 'I am a professional graphic designer specializing in brand identity. I can create a complete brand package including logo, color palette, typography, and brand guidelines.',
      proposedAmount: 750,
      status: ProposalStatus.ACCEPTED,
    },
  });

  console.log('✅ Created proposals');

  // Create Contract (from accepted proposal)
  const contract1 = await prisma.contract.create({
    data: {
      jobId: job3.id,
      proposalId: proposal4.id,
      clientId: client2.id,
      freelancerId: freelancer3.id,
      agreedAmount: 750,
      status: ContractStatus.ACTIVE,
    },
  });

  // Update job status to CONTRACTED
  await prisma.job.update({
    where: { id: job3.id },
    data: { status: JobStatus.CONTRACTED },
  });

  console.log('✅ Created contract');

  // Create Messages
  await prisma.message.createMany({
    data: [
      {
        jobId: job1.id,
        senderId: freelancer1.id,
        receiverId: client1.id,
        content: 'Hello! I saw your job posting and I am very interested. I have some questions about the project timeline.',
        isRead: false,
      },
      {
        jobId: job1.id,
        senderId: client1.id,
        receiverId: freelancer1.id,
        content: 'Thanks for your interest! I am looking to complete this within 4 weeks. What is your availability?',
        isRead: true,
      },
      {
        jobId: job1.id,
        senderId: freelancer1.id,
        receiverId: client1.id,
        content: 'I can start immediately and have full availability. I can deliver within 3 weeks.',
        isRead: false,
      },
      {
        contractId: contract1.id,
        senderId: freelancer3.id,
        receiverId: client2.id,
        content: 'I have started working on the logo design. I will send you initial concepts by tomorrow.',
        isRead: false,
      },
      {
        contractId: contract1.id,
        senderId: client2.id,
        receiverId: freelancer3.id,
        content: 'Great! Looking forward to seeing the concepts.',
        isRead: true,
      },
    ],
  });

  console.log('✅ Created messages');

  // Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: client1.id,
        type: 'proposal',
        title: 'New Proposal Received',
        message: 'You received a new proposal for "Website Redesign for E-commerce Store"',
        link: `/proposals/${proposal1.id}`,
        isRead: false,
      },
      {
        userId: client1.id,
        type: 'proposal',
        title: 'New Proposal Received',
        message: 'You received a new proposal for "Website Redesign for E-commerce Store"',
        link: `/proposals/${proposal2.id}`,
        isRead: false,
      },
      {
        userId: client1.id,
        type: 'message',
        title: 'New Message',
        message: 'You have a new message from Alice Johnson',
        link: `/messages/${job1.id}`,
        isRead: false,
      },
      {
        userId: freelancer1.id,
        type: 'message',
        title: 'New Message',
        message: 'You have a new message from John Doe',
        link: `/messages/${job1.id}`,
        isRead: true,
      },
      {
        userId: client2.id,
        type: 'proposal_accepted',
        title: 'Proposal Accepted',
        message: 'Your proposal for "Logo Design and Brand Identity" has been accepted!',
        link: `/contracts/${contract1.id}`,
        isRead: false,
      },
    ],
  });

  console.log('✅ Created notifications');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📝 Demo Credentials:');
  console.log('Clients:');
  console.log('  - client1@example.com / password123');
  console.log('  - client2@example.com / password123');
  console.log('Freelancers:');
  console.log('  - freelancer1@example.com / password123');
  console.log('  - freelancer2@example.com / password123');
  console.log('  - freelancer3@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

