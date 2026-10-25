import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.ts';

export const eligibilityRouter = Router();

const EligibilityCheckSchema = z.object({
  nationality: z.string().min(2, 'Nationality is required'),
  residenceCountry: z.string().min(2, 'Residence country is required'),
  destinationCountry: z.string().min(2, 'Destination country is required'),
  travelPurpose: z.enum(['Tourism', 'Business', 'Conference', 'Medical', 'Employment', 'Transit']),
  visaCategory: z.string().optional(),
  intendedStayDays: z.number().int().positive('Stay duration must be a positive integer'),
  passportValidityMonths: z.number().int().min(0, 'Passport validity is required'),
  hasPreviousRefusals: z.boolean().default(false),
});

// POST /api/v1/eligibility/check
eligibilityRouter.post('/check', async (req: Request, res: Response) => {
  try {
    const parse = EligibilityCheckSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        error: parse.error.issues[0]?.message || 'Invalid questionnaire input.',
      });
    }

    const {
      nationality,
      residenceCountry,
      destinationCountry,
      travelPurpose,
      intendedStayDays,
      passportValidityMonths,
      hasPreviousRefusals,
    } = parse.data;

    // Check matching visa program in database
    const matchedPrograms = await prisma.visaProgram.findMany({
      where: {
        isActive: true,
        countryName: { contains: destinationCountry },
      },
      include: {
        documentRequirements: true,
        officialSources: true,
      },
    });

    let primaryProgram = matchedPrograms.find(
      (p) => p.category.toLowerCase() === travelPurpose.toLowerCase()
    ) || matchedPrograms[0];

    // Determine preliminary eligibility assessment
    let status: 'HIGHLY_ELIGIBLE' | 'CONDITIONAL_REVIEW' | 'REQUIRES_CONSULAR_INTERVIEW' | 'CRITICAL_INELIGIBILITY' = 'HIGHLY_ELIGIBLE';
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check passport validity
    if (passportValidityMonths < 6) {
      status = 'CRITICAL_INELIGIBILITY';
      issues.push('Passport validity is less than 6 months. Most international immigration authorities reject applications if the passport does not have at least 6 months remaining validity from the travel date.');
      recommendations.push('Renew your passport before submitting an electronic visa application.');
    }

    // Check duration against typical eVisa limits
    if (intendedStayDays > 90) {
      if (status !== 'CRITICAL_INELIGIBILITY') status = 'REQUIRES_CONSULAR_INTERVIEW';
      issues.push(`Intended stay of ${intendedStayDays} days exceeds standard tourist e-Visa limits (typically 30 to 90 days).`);
      recommendations.push('A long-term national visa, residence permit, or specialized consulate visa is required for stays beyond 90 days.');
    }

    // Previous refusals flag
    if (hasPreviousRefusals) {
      if (status !== 'CRITICAL_INELIGIBILITY') status = 'CONDITIONAL_REVIEW';
      issues.push('Previous visa refusals require explicit disclosure in statutory declarations to prevent automatic biometric rejection or ban.');
      recommendations.push('Schedule an in-depth consultation with our senior specialist to audit refusal letters and assemble mitigating documentation.');
    }

    const disclaimer =
      'LEGAL DISCLAIMER: This preliminary eligibility assessment is generated solely for informational and planning purposes based on the inputs provided and standard public consular guidelines. It does not constitute legal immigration advice, a promise of visa issuance, or a guarantee of entry. Final visa approval and admission into any sovereign territory rests exclusively within the jurisdiction of that nation’s immigration officers.';

    return res.json({
      success: true,
      assessment: {
        status,
        destination: destinationCountry,
        nationality,
        residenceCountry,
        travelPurpose,
        intendedStayDays,
        issues,
        recommendations,
        matchedProgram: primaryProgram
          ? {
              id: primaryProgram.id,
              name: primaryProgram.visaType,
              country: primaryProgram.countryName,
              validity: primaryProgram.validity,
              entryType: primaryProgram.entryType,
              processingDays: primaryProgram.processingTimeDays,
              officialFeeUSD: primaryProgram.officialFeeUSD,
              serviceFeeUSD: primaryProgram.serviceFeeUSD,
              officialSourceUrl: primaryProgram.officialSourceUrl,
              officialSourceName: primaryProgram.officialSourceName,
              requiredDocuments: primaryProgram.documentRequirements.map((r) => ({
                id: r.id,
                name: r.name,
                description: r.description,
                isMandatory: r.isMandatory,
              })),
              officialSources: primaryProgram.officialSources,
            }
          : null,
        disclaimer,
      },
    });
  } catch (err) {
    console.error('Eligibility check error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to process eligibility check.',
    });
  }
});
