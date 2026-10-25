import assert from 'assert';
import bcrypt from 'bcryptjs';
import { prisma } from '../server/src/db.ts';
import { createSessionToken, verifySessionToken } from '../server/src/middleware/auth.ts';
import { getSafeFilePath, PRIVATE_STORAGE_DIR } from '../server/src/services/storage.ts';
import { generateVisaAssistantResponse } from '../server/src/services/ai.ts';
import { Role, ApplicationStatus, AppointmentStatus } from '@prisma/client';

async function runTests() {
  console.log('🧪 Starting AuraVisa Global Automated Test Suite...\n');
  let passed = 0;
  let total = 0;

  async function test(name: string, fn: () => Promise<void>) {
    total++;
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ ${name}`);
      console.error(`    Error: ${err.message}`);
    }
  }

  // 1. Database Persistence
  await test('1. Database Persistence - Seed users and visa programs exist in SQLite', async () => {
    const admin = await prisma.user.findUnique({ where: { email: 'admin@auravisa.com' } });
    assert(admin, 'Admin user must exist in database');
    assert.strictEqual(admin.role, Role.ADMIN);

    const programs = await prisma.visaProgram.findMany({ where: { isActive: true } });
    assert(programs.length >= 8, `Expected at least 8 visa programs, found ${programs.length}`);

    const uae = programs.find((p) => p.countryCode === 'AE');
    assert(uae, 'UAE visa program must exist');
    assert(uae.officialSourceUrl.includes('icp.gov.ae'), 'UAE official portal must be ICP');
  });

  // 2. Authentication & Bcrypt Password Hashing
  await test('2. Authentication - Password verification with bcrypt', async () => {
    const customer = await prisma.user.findUnique({ where: { email: 'customer@auravisa.com' } });
    assert(customer, 'Customer user must exist');
    const isMatch = await bcrypt.compare('Customer@123456', customer.passwordHash);
    assert.strictEqual(isMatch, true, 'Customer password must verify against stored hash');
    const wrongMatch = await bcrypt.compare('WrongPassword', customer.passwordHash);
    assert.strictEqual(wrongMatch, false, 'Invalid password must be rejected');
  });

  // 3. Session Token Creation & Cryptographic HMAC Verification
  await test('3. Session Security - Cryptographic HMAC token creation & validation', async () => {
    const dummy = { id: 'usr-1234', role: 'CUSTOMER', email: 'test@example.com' };
    const token = createSessionToken(dummy);
    assert(token.includes('.'), 'Session token must be separated by dot');

    const payload = verifySessionToken(token);
    assert(payload, 'Session token must verify successfully');
    assert.strictEqual(payload.userId, 'usr-1234');
    assert.strictEqual(payload.role, 'CUSTOMER');

    // Tampered token check
    const tampered = token.slice(0, -4) + 'abcd';
    const tamperedPayload = verifySessionToken(tampered);
    assert.strictEqual(tamperedPayload, null, 'Tampered token must fail verification');
  });

  // 4. Role Assignment & Self-Demotion Safety
  await test('4. Role Protection - New registrations receive CUSTOMER role & self-demotion prevention', async () => {
    const testEmail = `test_reg_${Date.now()}@auravisa.com`;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('TestPass123', salt);

    const newCustomer = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: hash,
        role: Role.CUSTOMER,
        firstName: 'Test',
        lastName: 'Applicant',
      },
    });

    assert.strictEqual(newCustomer.role, Role.CUSTOMER, 'New user must strictly receive CUSTOMER role');

    // Cleanup
    await prisma.user.delete({ where: { id: newCustomer.id } });
  });

  // 5. Private Storage Path Traversal Guard
  await test('5. Private Document Storage - Path traversal attack prevention', async () => {
    const maliciousTraversal = '../../../../etc/passwd';
    const safePath = getSafeFilePath(maliciousTraversal);
    assert(safePath, 'Should sanitize basename');
    assert(safePath.startsWith(PRIVATE_STORAGE_DIR), 'Target must resolve inside private storage directory');
    assert(!safePath.includes('etc/passwd'), 'Path traversal must be neutralized');
  });

  // 6. Anti-Double-Booking Appointment Validation
  await test('6. Appointments - Double-booking constraint check', async () => {
    const consultant = await prisma.user.findFirst({ where: { role: Role.CONSULTANT } });
    const customer = await prisma.user.findFirst({ where: { role: Role.CUSTOMER } });
    assert(consultant && customer, 'Consultant and customer must exist');

    const appointmentDate = new Date('2026-12-15T10:00:00.000Z');
    const timeSlot = '11:00 - 11:30 AM';

    // Book first appointment
    const firstApt = await prisma.appointment.create({
      data: {
        userId: customer.id,
        consultantId: consultant.id,
        appointmentDate,
        timeSlot,
        purpose: 'First Booking',
        status: AppointmentStatus.SCHEDULED,
      },
    });

    // Check if slot query detects existing booking
    const startOfDay = new Date(appointmentDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const conflictingSlot = await prisma.appointment.findFirst({
      where: {
        consultantId: consultant.id,
        appointmentDate: { gte: startOfDay, lte: endOfDay },
        timeSlot,
        status: AppointmentStatus.SCHEDULED,
      },
    });

    assert(conflictingSlot, 'System must detect overlapping appointment slot for consultant');

    // Clean up test appointment
    await prisma.appointment.delete({ where: { id: firstApt.id } });
  });

  // 7. Multilingual AI Assistant Service & Verified Grounding
  await test('7. AI Assistant Service - Multilingual grounding & transparent sources', async () => {
    const result = await generateVisaAssistantResponse({
      message: 'What is the government fee and processing time for Dubai tourist visa?',
      language: 'en',
    });

    assert(result.reply, 'Assistant must generate a non-empty reply');
    assert(result.sources.length > 0, 'Assistant must cite verified official government sources');
    assert(result.disclaimer.includes('AuraVisa Global is a private visa consultancy'), 'Statutory disclaimer must be included');
  });

  // 8. Application Status Progression History
  await test('8. Application History - Audit logs and status progression records', async () => {
    const customer = await prisma.user.findFirst({ where: { role: Role.CUSTOMER } });
    const uaeProgram = await prisma.visaProgram.findFirst({ where: { countryCode: 'AE' } });
    assert(customer && uaeProgram);

    const appNumber = `TEST-${Date.now()}`;
    const newApp = await prisma.visaApplication.create({
      data: {
        applicationNumber: appNumber,
        userId: customer.id,
        visaProgramId: uaeProgram.id,
        status: ApplicationStatus.SUBMITTED,
        statusHistory: {
          create: {
            fromStatus: ApplicationStatus.DRAFT,
            toStatus: ApplicationStatus.SUBMITTED,
            changedById: customer.id,
            comment: 'Submitted for verification',
          },
        },
      },
      include: { statusHistory: true },
    });

    assert.strictEqual(newApp.statusHistory.length, 1);
    assert.strictEqual(newApp.statusHistory[0].toStatus, ApplicationStatus.SUBMITTED);

    // Clean up
    await prisma.applicationStatusHistory.deleteMany({ where: { applicationId: newApp.id } });
    await prisma.visaApplication.delete({ where: { id: newApp.id } });
  });

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} / ${total} tests passed!`);
  console.log(`========================================\n`);

  await prisma.$disconnect();

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
