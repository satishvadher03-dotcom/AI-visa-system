import { PrismaClient, Role, ApplicationStatus, AppointmentStatus, DocumentStatus, EnquiryStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.internalCaseNote.deleteMany();
  await prisma.applicationStatusHistory.deleteMany();
  await prisma.privateDocument.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.consultantAssignment.deleteMany();
  await prisma.visaApplication.deleteMany();
  await prisma.enquiry.deleteMany();
  await prisma.documentRequirement.deleteMany();
  await prisma.officialVisaSource.deleteMany();
  await prisma.visaProgram.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('Admin@123456', salt);
  const consultantPasswordHash = await bcrypt.hash('Consultant@123456', salt);
  const customerPasswordHash = await bcrypt.hash('Customer@123456', salt);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@auravisa.com',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      firstName: 'Sarah',
      lastName: 'Sterling',
      phone: '+1 (555) 019-2834',
      profile: {
        create: {
          nationality: 'United States',
          preferredLanguage: 'en',
        },
      },
    },
  });

  const consultant1 = await prisma.user.create({
    data: {
      email: 'consultant@auravisa.com',
      passwordHash: consultantPasswordHash,
      role: Role.CONSULTANT,
      firstName: 'Elena',
      lastName: 'Vance',
      phone: '+44 20 7946 0991',
      profile: {
        create: {
          nationality: 'United Kingdom',
          preferredLanguage: 'en',
        },
      },
    },
  });

  const consultant2 = await prisma.user.create({
    data: {
      email: 'consultant2@auravisa.com',
      passwordHash: consultantPasswordHash,
      role: Role.CONSULTANT,
      firstName: 'Rajesh',
      lastName: 'Patel',
      phone: '+91 98250 12345',
      profile: {
        create: {
          nationality: 'India',
          preferredLanguage: 'gu',
        },
      },
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'customer@auravisa.com',
      passwordHash: customerPasswordHash,
      role: Role.CUSTOMER,
      firstName: 'Aarav',
      lastName: 'Sharma',
      phone: '+91 98765 43210',
      profile: {
        create: {
          nationality: 'India',
          passportNumber: 'Z1298475',
          address: '402 Sunset Tower, S.G. Highway, Ahmedabad, Gujarat, India',
          preferredLanguage: 'en',
        },
      },
    },
  });

  console.log('✓ Users created');

  // Visa Programs
  const programsData = [
    // World to India
    {
      countryCode: 'IN',
      countryName: 'India',
      flowType: 'WORLD_TO_INDIA',
      visaType: 'e-Tourist Visa (30 Days)',
      category: 'Tourism',
      entryType: 'Double Entry',
      validity: '30 Days from Date of Arrival',
      processingTimeDays: 3,
      officialFeeUSD: 25.0,
      serviceFeeUSD: 39.0,
      description: 'Official Indian e-Tourist visa for recreation, sightseeing, casual visits to friends or relatives, and short yoga programs. Double entry permitted.',
      eligibleNationalities: '170+ nationalities including USA, UK, Canada, Australia, Japan, EU nations',
      officialSourceUrl: 'https://indianvisaonline.gov.in/evisa/',
      officialSourceName: 'Government of India Ministry of Home Affairs',
      requirements: [
        { name: 'Passport Bio Page Scan', description: 'Clear PDF or JPEG scan of passport biodata page with at least 6 months remaining validity.', isMandatory: true },
        { name: 'Recent Passport Photograph', description: 'Recent square color photograph with plain white background, front view, no glare or shadows.', isMandatory: true },
        { name: 'Return Flight Ticket Confirmation', description: 'Confirmed onward or return ticket booking.', isMandatory: false },
      ],
      sources: [
        { name: 'Bureau of Immigration India', officialUrl: 'https://boi.gov.in', portalName: 'BOI Portal' },
        { name: 'Indian e-Visa Official Portal', officialUrl: 'https://indianvisaonline.gov.in/evisa/', portalName: 'Govt of India e-Visa' },
      ],
    },
    {
      countryCode: 'IN',
      countryName: 'India',
      flowType: 'WORLD_TO_INDIA',
      visaType: 'e-Business Visa (1 Year)',
      category: 'Business',
      entryType: 'Multiple Entry',
      validity: '365 Days',
      processingTimeDays: 4,
      officialFeeUSD: 80.0,
      serviceFeeUSD: 59.0,
      description: 'Designed for foreign professionals entering India for trade discussions, meetings, setting up business ventures, or recruiting manpower.',
      eligibleNationalities: '170+ eligible countries',
      officialSourceUrl: 'https://indianvisaonline.gov.in/evisa/',
      officialSourceName: 'Government of India Ministry of Home Affairs',
      requirements: [
        { name: 'Passport Bio Page Scan', description: 'Clear scan of passport information page valid for at least 6 months.', isMandatory: true },
        { name: 'Digital Photograph', description: 'Square headshot on pure white background.', isMandatory: true },
        { name: 'Business Card or Invitation Letter', description: 'Copy of Indian company invitation letter or applicant business card.', isMandatory: true },
      ],
      sources: [
        { name: 'Indian e-Visa Portal', officialUrl: 'https://indianvisaonline.gov.in/evisa/', portalName: 'Govt of India' },
      ],
    },
    {
      countryCode: 'IN',
      countryName: 'India',
      flowType: 'WORLD_TO_INDIA',
      visaType: 'e-Medical Visa (60 Days)',
      category: 'Medical',
      entryType: 'Triple Entry',
      validity: '60 Days from Date of First Entry',
      processingTimeDays: 2,
      officialFeeUSD: 80.0,
      serviceFeeUSD: 49.0,
      description: 'Expedited e-visa for patients seeking medical treatment from recognized hospitals and healthcare institutions in India.',
      eligibleNationalities: 'All e-Visa eligible countries',
      officialSourceUrl: 'https://indianvisaonline.gov.in/evisa/',
      officialSourceName: 'Government of India Ministry of Home Affairs',
      requirements: [
        { name: 'Passport Bio Page Scan', description: 'Passport with at least 6 months validity.', isMandatory: true },
        { name: 'Digital Photograph', description: 'White background passport photo.', isMandatory: true },
        { name: 'Letter from Recognized Indian Hospital', description: 'Official letter on hospital letterhead indicating doctor recommendation and treatment details.', isMandatory: true },
      ],
      sources: [
        { name: 'Indian e-Visa Portal', officialUrl: 'https://indianvisaonline.gov.in/evisa/', portalName: 'Govt of India' },
      ],
    },
    // India to World
    {
      countryCode: 'AE',
      countryName: 'United Arab Emirates',
      flowType: 'INDIA_TO_WORLD',
      visaType: 'Tourist eVisa (30 Days)',
      category: 'Tourism',
      entryType: 'Single Entry',
      validity: '60 Days to Enter; 30 Days Stay',
      processingTimeDays: 2,
      officialFeeUSD: 105.0,
      serviceFeeUSD: 45.0,
      description: 'Official UAE entry permit for leisure and tourism in Dubai, Abu Dhabi, Sharjah, and other emirates.',
      eligibleNationalities: 'Indian passport holders and international travelers',
      officialSourceUrl: 'https://smartservices.icp.gov.ae',
      officialSourceName: 'Federal Authority for Identity, Citizenship, Customs and Port Security (ICP)',
      requirements: [
        { name: 'Passport Bio & Last Page', description: 'Colored copy of first and observation/last page of passport.', isMandatory: true },
        { name: 'Passport Size Photograph', description: 'Recent white background photograph.', isMandatory: true },
        { name: 'Return Flight Ticket', description: 'Confirmed return flight itinerary.', isMandatory: true },
        { name: 'Hotel Voucher or Sponsor Emirates ID', description: 'Proof of lodging during stay in UAE.', isMandatory: false },
      ],
      sources: [
        { name: 'UAE ICP Smart Services', officialUrl: 'https://smartservices.icp.gov.ae', portalName: 'Federal Authority for Identity' },
        { name: 'GDRFA Dubai Portal', officialUrl: 'https://gdrfad.gov.ae', portalName: 'General Directorate of Residency Dubai' },
      ],
    },
    {
      countryCode: 'SG',
      countryName: 'Singapore',
      flowType: 'INDIA_TO_WORLD',
      visaType: 'e-Visa (30 Days)',
      category: 'Tourism',
      entryType: 'Multiple Entry',
      validity: 'Up to 2 Years (Stay up to 30 days per visit)',
      processingTimeDays: 3,
      officialFeeUSD: 30.0,
      serviceFeeUSD: 40.0,
      description: 'Electronic Visa for Singapore tourism, social visits, and business explorations.',
      eligibleNationalities: 'Indian, Chinese, and Assessment Level I/II nationals',
      officialSourceUrl: 'https://eservices.ica.gov.sg',
      officialSourceName: 'Immigration & Checkpoints Authority (ICA) Singapore',
      requirements: [
        { name: 'Passport Bio Page Scan', description: 'Passport with at least 6 months validity from date of entry.', isMandatory: true },
        { name: 'Digital Color Photograph', description: 'Taken within last 3 months with matte finish on pure white background.', isMandatory: true },
        { name: 'Covering Letter & Travel Plan', description: 'Brief itinerary of stay in Singapore.', isMandatory: true },
        { name: 'Flight Bookings', description: 'Confirmed return or onward air tickets.', isMandatory: false },
      ],
      sources: [
        { name: 'ICA Singapore', officialUrl: 'https://eservices.ica.gov.sg', portalName: 'Immigration & Checkpoints Authority' },
      ],
    },
    {
      countryCode: 'US',
      countryName: 'United States',
      flowType: 'INDIA_TO_WORLD',
      visaType: 'B1/B2 Visitor Visa Prep & Filing',
      category: 'Tourism',
      entryType: 'Multiple Entry',
      validity: '10 Years',
      processingTimeDays: 7,
      officialFeeUSD: 185.0,
      serviceFeeUSD: 149.0,
      description: 'Comprehensive DS-160 review, appointment slot tracking, documentation bundle, and consular interview coaching for US tourist and business travel.',
      eligibleNationalities: 'All international passport holders requiring US nonimmigrant visa',
      officialSourceUrl: 'https://travel.state.gov',
      officialSourceName: 'U.S. Department of State - Bureau of Consular Affairs',
      requirements: [
        { name: 'Passport Bio Page', description: 'Valid for at least 6 months beyond intended stay in US.', isMandatory: true },
        { name: 'US Visa Spec Photo (2x2 in)', description: 'Color photo on white background meeting exact State Department specifications.', isMandatory: true },
        { name: 'Financial & Employment Records', description: 'Income tax returns, pay stubs, bank statements demonstrating financial solvency.', isMandatory: true },
        { name: 'Travel Purpose Document', description: 'Invitation, conference registration, or day-by-day leisure itinerary.', isMandatory: false },
      ],
      sources: [
        { name: 'US Travel State Gov', officialUrl: 'https://travel.state.gov', portalName: 'Department of State Consular Affairs' },
        { name: 'US Travel Docs Portal', officialUrl: 'https://ustraveldocs.com', portalName: 'Appointment Booking System' },
      ],
    },
    {
      countryCode: 'GB',
      countryName: 'United Kingdom',
      flowType: 'INDIA_TO_WORLD',
      visaType: 'Standard Visitor Visa (6 Months)',
      category: 'Tourism',
      entryType: 'Multiple Entry',
      validity: '6 Months',
      processingTimeDays: 15,
      officialFeeUSD: 145.0,
      serviceFeeUSD: 99.0,
      description: 'Official UK Standard Visitor visa consultation and online application dossier preparation for holiday, visiting family, or short business meetings.',
      eligibleNationalities: 'Visa national citizens worldwide including India',
      officialSourceUrl: 'https://www.gov.uk/standard-visitor',
      officialSourceName: 'UK Visas and Immigration (UKVI)',
      requirements: [
        { name: 'Valid Passport Scan', description: 'Scan of current passport with at least 1 blank page.', isMandatory: true },
        { name: 'Bank Statements (6 Months)', description: 'Showing genuine funds to cover total travel costs.', isMandatory: true },
        { name: 'Proof of Employment or Business', description: 'Employer no-objection letter, pay slips, or business registration proof.', isMandatory: true },
        { name: 'Accommodation Proof in the UK', description: 'Hotel booking or letter of invitation from sponsor.', isMandatory: false },
      ],
      sources: [
        { name: 'GOV.UK Visas', officialUrl: 'https://www.gov.uk/standard-visitor', portalName: 'UK Visas and Immigration' },
      ],
    },
    {
      countryCode: 'FR',
      countryName: 'France (Schengen Area)',
      flowType: 'INDIA_TO_WORLD',
      visaType: 'Short-Stay Tourist Visa (Type C)',
      category: 'Tourism',
      entryType: 'Multiple Entry',
      validity: 'Up to 90 Days within 180 Days',
      processingTimeDays: 10,
      officialFeeUSD: 90.0,
      serviceFeeUSD: 89.0,
      description: 'Assistance with Schengen visa application via France-Visas portal, cover letter crafting, mandatory insurance guidelines, and VFS appointment scheduling.',
      eligibleNationalities: 'Citizens of countries without Schengen visa exemption',
      officialSourceUrl: 'https://france-visas.gouv.fr',
      officialSourceName: 'French Ministry of Europe and Foreign Affairs',
      requirements: [
        { name: 'Passport Copy', description: 'Issued within previous 10 years, valid 3 months beyond departure date.', isMandatory: true },
        { name: 'Schengen Standard Photographs', description: '35x45mm color photo on light grey or white background.', isMandatory: true },
        { name: 'Travel Medical Insurance (Min €30,000)', description: 'Coverage for repatriation and emergency medical expenses across all Schengen states.', isMandatory: true },
        { name: 'Day-to-day Travel Itinerary', description: 'Hotels, inter-city transport, and flight reservations.', isMandatory: true },
      ],
      sources: [
        { name: 'France-Visas Official Portal', officialUrl: 'https://france-visas.gouv.fr', portalName: 'France-Visas' },
      ],
    },
    {
      countryCode: 'SA',
      countryName: 'Saudi Arabia',
      flowType: 'INDIA_TO_WORLD',
      visaType: 'Tourist eVisa / Umrah Transit',
      category: 'Tourism',
      entryType: 'Multiple Entry',
      validity: '1 Year (Stay up to 90 days)',
      processingTimeDays: 1,
      officialFeeUSD: 140.0,
      serviceFeeUSD: 45.0,
      description: 'Instant electronic visa for tourism, visiting family, attending festivals, and performing Umrah outside Hajj season.',
      eligibleNationalities: 'Eligible passport holders and GCC residents',
      officialSourceUrl: 'https://visa.visitsaudi.com',
      officialSourceName: 'Saudi Ministry of Tourism and MOFA',
      requirements: [
        { name: 'Passport Bio Page', description: 'Passport with at least 6 months validity.', isMandatory: true },
        { name: 'Digital Photo', description: 'White background, min 200x200 pixels.', isMandatory: true },
        { name: 'Proof of GCC Residency or Valid US/UK/Schengen Visa (if applicable)', description: 'Required for specific nationality fast-track categories.', isMandatory: false },
      ],
      sources: [
        { name: 'Visit Saudi Official Portal', officialUrl: 'https://visa.visitsaudi.com', portalName: 'Visit Saudi' },
      ],
    },
    {
      countryCode: 'VN',
      countryName: 'Vietnam',
      flowType: 'INDIA_TO_WORLD',
      visaType: 'Electronic Visa (eVisa - 30/90 Days)',
      category: 'Tourism',
      entryType: 'Multiple Entry',
      validity: 'Up to 90 Days',
      processingTimeDays: 3,
      officialFeeUSD: 50.0,
      serviceFeeUSD: 35.0,
      description: 'Official Vietnam electronic visa processed directly through the Vietnam National Web Portal on Immigration for all international ports of entry.',
      eligibleNationalities: 'Citizens of all countries and territories worldwide',
      officialSourceUrl: 'https://evisa.xuatnhapcanh.gov.vn',
      officialSourceName: 'Vietnam Immigration Department',
      requirements: [
        { name: 'Passport Biodata Page', description: 'Full page scan with ICAO lines clearly visible.', isMandatory: true },
        { name: 'Portrait Photo (4x6 cm)', description: 'Straight look, no glasses, white background.', isMandatory: true },
      ],
      sources: [
        { name: 'Vietnam National Web Portal on Immigration', officialUrl: 'https://evisa.xuatnhapcanh.gov.vn', portalName: 'Vietnam Immigration Dept' },
      ],
    },
  ];

  const createdPrograms: Record<string, string> = {};

  for (const p of programsData) {
    const { requirements, sources, ...programFields } = p;
    const created = await prisma.visaProgram.create({
      data: {
        ...programFields,
        documentRequirements: {
          create: requirements.map((r) => ({
            name: r.name,
            description: r.description,
            isMandatory: r.isMandatory,
            allowedMimeTypes: 'application/pdf,image/jpeg,image/png',
            maxSizeBytes: 5242880,
          })),
        },
        officialSources: {
          create: sources.map((s) => ({
            name: s.name,
            officialUrl: s.officialUrl,
            portalName: s.portalName,
          })),
        },
      },
      include: {
        documentRequirements: true,
      },
    });

    createdPrograms[`${p.countryCode}_${p.visaType}`] = created.id;
  }

  console.log('✓ Visa Programs & Requirements seeded');

  // Seed sample Visa Applications for Aarav Sharma (Customer)
  const uaeProgramId = Object.entries(createdPrograms).find(([k]) => k.startsWith('AE'))![1];
  const uaeProgram = await prisma.visaProgram.findUnique({
    where: { id: uaeProgramId },
    include: { documentRequirements: true },
  });

  const sampleApp1 = await prisma.visaApplication.create({
    data: {
      applicationNumber: 'AV-2026-00491',
      userId: customer.id,
      visaProgramId: uaeProgramId,
      status: ApplicationStatus.UNDER_REVIEW,
      travelDate: new Date('2026-11-15T00:00:00.000Z'),
      passportExpiryDate: new Date('2031-08-20T00:00:00.000Z'),
      applicantName: 'Aarav Sharma',
      applicantPassport: 'Z1298475',
      notes: 'Family vacation to Dubai and Abu Dhabi. Requesting expedited check.',
      assignedConsultantId: consultant1.id,
      assignments: {
        create: {
          consultantId: consultant1.id,
          notes: 'Assigned for priority document verification and smartservices filing.',
        },
      },
      statusHistory: {
        create: [
          {
            fromStatus: ApplicationStatus.DRAFT,
            toStatus: ApplicationStatus.SUBMITTED,
            changedById: customer.id,
            comment: 'Customer submitted application with initial documents.',
          },
          {
            fromStatus: ApplicationStatus.SUBMITTED,
            toStatus: ApplicationStatus.UNDER_REVIEW,
            changedById: consultant1.id,
            comment: 'Consultant began checking passport bio page clarity and return ticket details.',
          },
        ],
      },
      internalNotes: {
        create: [
          {
            authorId: consultant1.id,
            note: 'Passport has more than 5 years validity. Bio page resolution is excellent (300 DPI). Awaiting hotel voucher confirmation before final ICP submission.',
          },
        ],
      },
    },
  });

  // Create demo private document records
  const req1 = uaeProgram?.documentRequirements[0];
  const req2 = uaeProgram?.documentRequirements[1];

  if (req1) {
    await prisma.privateDocument.create({
      data: {
        applicationId: sampleApp1.id,
        userId: customer.id,
        requirementId: req1.id,
        originalFilename: 'Aarav_Sharma_Passport_Bio.pdf',
        storageFilename: 'demo-passport-aarav-sharma-secure.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 1249820,
        verificationStatus: DocumentStatus.VERIFIED,
      },
    });
  }

  if (req2) {
    await prisma.privateDocument.create({
      data: {
        applicationId: sampleApp1.id,
        userId: customer.id,
        requirementId: req2.id,
        originalFilename: 'Aarav_Sharma_Passport_Photo.jpg',
        storageFilename: 'demo-photo-aarav-sharma-secure.jpg',
        mimeType: 'image/jpeg',
        fileSizeBytes: 421050,
        verificationStatus: DocumentStatus.PENDING,
      },
    });
  }

  // Seed sample Appointments
  await prisma.appointment.create({
    data: {
      userId: customer.id,
      consultantId: consultant1.id,
      applicationId: sampleApp1.id,
      appointmentDate: new Date('2026-10-28T10:00:00.000Z'),
      timeSlot: '10:00 - 10:30 AM',
      status: AppointmentStatus.SCHEDULED,
      purpose: 'Dubai e-Visa Document Verification & Itinerary Guidance',
      meetingLink: 'https://meet.google.com/auravisa-dxb-review',
      notes: 'Customer will have flight booking receipts ready.',
    },
  });

  // Seed sample Enquiry
  await prisma.enquiry.create({
    data: {
      userId: customer.id,
      fullName: 'Aarav Sharma',
      email: 'customer@auravisa.com',
      phone: '+91 98765 43210',
      nationality: 'India',
      destinationCountry: 'United Kingdom',
      visaType: 'Standard Visitor Visa (6 Months)',
      message: 'Planning to attend a digital marketing conference in London next February. Looking for guidance on bank statements and sponsorship letters.',
      status: EnquiryStatus.NEW,
    },
  });

  // Seed sample Notification
  await prisma.notification.create({
    data: {
      userId: customer.id,
      title: 'Document Verified by Consultant',
      message: 'Your Passport Bio Page scan has been approved by Elena Vance for application AV-2026-00491.',
      link: '/customer/applications',
    },
  });

  // Seed sample Audit Log
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'SYSTEM_INITIALIZATION',
      resourceType: 'System',
      resourceId: 'INIT-001',
      detailsJson: JSON.stringify({ message: 'AuraVisa database initialized with verified visa programs and seed users.' }),
      ipAddress: '127.0.0.1',
      userAgent: 'AuraVisa Seed Runner / Node.js',
    },
  });

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
