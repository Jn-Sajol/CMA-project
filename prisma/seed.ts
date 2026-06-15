import { PrismaClient, BloodGroup, Profession, HelpSector, Role, Urgency, RequestStatus, SosType, PostType, JobCategory } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data...');

  // Create 12 members
  const users = [
    { name: 'Rahim Uddin', phone: '01711111111', city: 'Dhaka', bloodGroup: BloodGroup.B_POS, profession: Profession.ENGINEER, workplace: 'Tech Corp', role: Role.MEMBER, verified: true },
    { name: 'Karim Hasan', phone: '01722222222', city: 'Chittagong', bloodGroup: BloodGroup.O_POS, profession: Profession.BUSINESS, workplace: 'Trade Inc', role: Role.MEMBER, verified: true },
    { name: 'Sabina Yasmin', phone: '01733333333', city: 'Sylhet', bloodGroup: BloodGroup.A_POS, profession: Profession.TEACHER, workplace: 'Sylhet School', role: Role.MEMBER, verified: true },
    { name: 'Jamal Bhuiyan', phone: '01744444444', city: 'Rajshahi', bloodGroup: BloodGroup.B_POS, profession: Profession.DOCTOR, workplace: 'Rajshahi Hospital', role: Role.ADMIN, verified: true },
    { name: 'Fatema Begum', phone: '01755555555', city: 'Khulna', bloodGroup: BloodGroup.O_POS, profession: Profession.LAWYER, workplace: 'Khulna Court', role: Role.MEMBER, verified: true },
    { name: 'Abdul Alim', phone: '01766666666', city: 'Dhaka', bloodGroup: BloodGroup.A_POS, profession: Profession.STUDENT, workplace: 'Dhaka University', role: Role.MEMBER, verified: true, lastDonationDate: new Date('2026-05-01') },
    { name: 'Nasrin Akter', phone: '01777777777', city: 'Chittagong', bloodGroup: BloodGroup.AB_POS, profession: Profession.GOVERNMENT, workplace: 'City Corp', role: Role.MEMBER, verified: true },
    { name: 'Kamrul Islam', phone: '01788888888', city: 'Sylhet', bloodGroup: BloodGroup.B_NEG, profession: Profession.ENGINEER, workplace: 'Build Co', role: Role.MEMBER, verified: true, lastDonationDate: new Date('2026-04-15') },
    { name: 'Sonia Rahman', phone: '01799999999', city: 'Rajshahi', bloodGroup: BloodGroup.O_NEG, profession: Profession.BUSINESS, workplace: 'Fashion BD', role: Role.MEMBER, verified: true },
    { name: 'Habib Wahid', phone: '01811111111', city: 'Khulna', bloodGroup: BloodGroup.AB_NEG, profession: Profession.OTHER, workplace: 'Music Studio', role: Role.MEMBER, verified: true },
    { name: 'Tahsan Khan', phone: '01822222222', city: 'Dhaka', bloodGroup: BloodGroup.A_NEG, profession: Profession.TEACHER, workplace: 'Private Uni', role: Role.MEMBER, verified: true, lastDonationDate: new Date('2026-03-20') },
    { name: 'Mehzabien Chowdhury', phone: '01833333333', city: 'Chittagong', bloodGroup: BloodGroup.B_POS, profession: Profession.DOCTOR, workplace: 'Medical College', role: Role.MEMBER, verified: true },
  ];

  for (const u of users) {
    let availableAfter = null;
    if (u.lastDonationDate) {
      availableAfter = new Date(u.lastDonationDate);
      availableAfter.setDate(availableAfter.getDate() + 120);
    }

    await prisma.user.upsert({
      where: { phone: u.phone },
      update: {},
      create: {
        ...u,
        availableAfter,
        helpSectors: [HelpSector.MEDICAL, HelpSector.EDUCATION],
      },
    });
  }

  const allUsers = await prisma.user.findMany();

  // Create 2 open blood requests
  await prisma.bloodRequest.create({
    data: {
      bloodGroup: BloodGroup.B_POS,
      hospital: 'Dhaka Medical College',
      contactNumber: '01911111111',
      urgency: Urgency.CRITICAL,
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
      requesterId: allUsers[0].id,
      patientAge: 45,
      patientGender: 'Male',
    }
  });

  await prisma.bloodRequest.create({
    data: {
      bloodGroup: BloodGroup.O_POS,
      hospital: 'Square Hospital',
      contactNumber: '01922222222',
      urgency: Urgency.NORMAL,
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
      requesterId: allUsers[1].id,
      patientAge: 30,
      patientGender: 'Female',
    }
  });

  // Create 1 SOS request
  await prisma.sosRequest.create({
    data: {
      sosType: SosType.MEDICAL,
      description: 'Need urgent ambulance at Mirpur 10',
      city: 'Dhaka',
      contactNumber: '01933333333',
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
      requesterId: allUsers[2].id,
    }
  });

  // Create notices
  await prisma.notice.create({
    data: {
      title: 'Welcome to the Community',
      body: 'Please complete your profile to help others.',
      pinned: true,
      postType: PostType.IMPORTANT,
      authorId: allUsers[3].id,
    }
  });

  await prisma.notice.create({
    data: {
      title: 'Upcoming Blood Donation Camp',
      body: 'Join us next week for a mega blood donation event.',
      postType: PostType.EVENT,
      authorId: allUsers[3].id,
    }
  });

  // Create 3 job posts
  await prisma.jobPost.create({
    data: {
      category: JobCategory.JOB_REFERRAL,
      title: 'Software Engineer Needed',
      description: 'Looking for a React developer with 2 years of experience.',
      profession: Profession.ENGINEER,
      authorId: allUsers[0].id,
    }
  });

  await prisma.jobPost.create({
    data: {
      category: JobCategory.PROFESSIONAL_HELP,
      title: 'Need Legal Advice regarding Property',
      description: 'Looking for a lawyer to consult regarding a land dispute.',
      profession: Profession.LAWYER,
      authorId: allUsers[4].id,
    }
  });

  await prisma.jobPost.create({
    data: {
      category: JobCategory.GENERAL,
      title: 'Math Tutor required',
      description: 'Need a tutor for class 10 student in Dhanmondi.',
      profession: Profession.TEACHER,
      authorId: allUsers[2].id,
    }
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
