export type Role = 'CUSTOMER' | 'CONSULTANT' | 'ADMIN';

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'DOCUMENTS_PENDING'
  | 'RESUBMITTED'
  | 'PROCESSING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';

export type DocumentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type EnquiryStatus = 'NEW' | 'CONTACTED' | 'RESOLVED' | 'CLOSED';

export interface UserProfile {
  id?: string;
  nationality?: string | null;
  passportNumber?: string | null;
  address?: string | null;
  preferredLanguage: string;
}

export interface User {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  phone?: string | null;
  createdAt?: string;
  profile?: UserProfile | null;
}

export interface OfficialVisaSource {
  id: string;
  name: string;
  officialUrl: string;
  portalName: string;
  verifiedDate?: string;
  notes?: string | null;
}

export interface DocumentRequirement {
  id: string;
  visaProgramId?: string;
  name: string;
  description: string;
  isMandatory: boolean;
  allowedMimeTypes: string;
  maxSizeBytes: number;
}

export interface VisaProgram {
  id: string;
  countryCode: string;
  countryName: string;
  flowType: 'WORLD_TO_INDIA' | 'INDIA_TO_WORLD';
  visaType: string;
  category: string;
  entryType: string;
  validity: string;
  processingTimeDays: number;
  officialFeeUSD: number;
  serviceFeeUSD: number;
  description: string;
  eligibleNationalities: string;
  officialSourceUrl: string;
  officialSourceName: string;
  lastVerifiedAt: string;
  isActive: boolean;
  officialSources: OfficialVisaSource[];
  documentRequirements: DocumentRequirement[];
}

export interface PrivateDocument {
  id: string;
  applicationId: string;
  userId: string;
  requirementId?: string | null;
  requirement?: DocumentRequirement | null;
  originalFilename: string;
  storageFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  verificationStatus: DocumentStatus;
  rejectionReason?: string | null;
  uploadedAt: string;
}

export interface ApplicationStatusHistory {
  id: string;
  applicationId: string;
  fromStatus: ApplicationStatus;
  toStatus: ApplicationStatus;
  changedById: string;
  changedBy?: {
    firstName: string;
    lastName: string;
    role: Role;
  };
  comment?: string | null;
  createdAt: string;
}

export interface InternalCaseNote {
  id: string;
  applicationId: string;
  authorId: string;
  author?: {
    firstName: string;
    lastName: string;
    role: Role;
  };
  note: string;
  createdAt: string;
}

export interface VisaApplication {
  id: string;
  applicationNumber: string;
  userId: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
  };
  visaProgramId: string;
  visaProgram: VisaProgram;
  status: ApplicationStatus;
  travelDate?: string | null;
  passportExpiryDate?: string | null;
  applicantName?: string | null;
  applicantPassport?: string | null;
  notes?: string | null;
  assignedConsultantId?: string | null;
  assignedConsultant?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  submittedAt: string;
  updatedAt: string;
  documents?: PrivateDocument[];
  statusHistory?: ApplicationStatusHistory[];
  internalNotes?: InternalCaseNote[];
}

export interface Appointment {
  id: string;
  userId: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
  };
  consultantId?: string | null;
  consultant?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  applicationId?: string | null;
  application?: {
    applicationNumber: string;
    status: ApplicationStatus;
  } | null;
  appointmentDate: string;
  timeSlot: string;
  status: AppointmentStatus;
  purpose: string;
  meetingLink?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface Enquiry {
  id: string;
  userId?: string | null;
  fullName: string;
  email: string;
  phone?: string | null;
  nationality: string;
  destinationCountry: string;
  visaType: string;
  message: string;
  status: EnquiryStatus;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    role: Role;
  } | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  detailsJson?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}
