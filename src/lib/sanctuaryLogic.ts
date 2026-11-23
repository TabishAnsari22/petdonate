export type CampaignCategory =
  | 'All'
  | 'Critical Surgery'
  | 'Trauma Care'
  | 'Oncology'
  | 'Cardiac Care';

export type DonationFrequency = 'one-time' | 'monthly';

export interface EmergencyCampaign {
  id: string;
  petName: string;
  species: 'Canine' | 'Feline';
  breed: string;
  age: string;
  location: string;
  category: Exclude<CampaignCategory, 'All'>;
  urgency: 'Immediate' | 'Priority' | 'Stabilizing';
  medicalEmergency: string;
  treatmentSummary: string;
  hospitalName: string;
  goalAmount: number;
  raisedAmount: number;
  donorCount: number;
  image: string;
  imageAlt: string;
  costBreakdown: { item: string; amount: number }[];
  vetNote: string;
}

export interface DonationCalculationInput {
  amount: number;
  frequency: DonationFrequency;
  isAnonymous: boolean;
  donorName: string;
  selectedCampaignTitle?: string;
}

export interface DonationSummaryResult {
  amount: number;
  isValidAmount: boolean;
  frequency: DonationFrequency;
  annualEquivalent: number;
  attributionLabel: string;
  designationLabel: string;
  estimatedCareHours: number;
}

export interface EmergencyApplicationData {
  // Step 1: Owner Information
  ownerFullName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerCity: string;
  householdIncomeBand: string;
  // Step 2: Pet Information
  petName: string;
  petSpecies: 'Dog' | 'Cat' | 'Other' | '';
  petBreed: string;
  petAge: string;
  petWeightKg: string;
  // Step 3: Emergency Details
  emergencyType: string;
  onsetDate: string;
  diagnosisSummary: string;
  estimatedCost: string;
  requestedGrant: string;
  // Step 4: Veterinary Hospital Information
  hospitalName: string;
  attendingVetName: string;
  hospitalPhone: string;
  hospitalCity: string;
  hospitalInvoiceId: string;
  // Step 5: Medical Documents Upload
  uploadedFiles: { name: string; sizeBytes: number; type: string; previewUrl?: string }[];
  // Step 6: Review & Submit
  confirmAccuracy: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface ScrollSceneKeyframe {
  sceneIndex: number;
  title: string;
  subtitle: string;
  cameraPosition: [number, number, number];
  lookAtTarget: [number, number, number];
  missionOverlayOpacity: number;
  heroContentOpacity: number;
}

export function filterCampaigns(
  campaigns: EmergencyCampaign[],
  query: string,
  category: CampaignCategory,
  speciesFilter: 'All' | 'Canine' | 'Feline' = 'All',
): EmergencyCampaign[] {
  const normalizedQuery = query.trim().toLowerCase();
  return campaigns.filter((c) => {
    const matchesCategory = category === 'All' || c.category === category;
    const matchesSpecies = speciesFilter === 'All' || c.species === speciesFilter;
    if (!matchesCategory || !matchesSpecies) return false;
    if (!normalizedQuery) return true;
    const haystack = [
      c.petName,
      c.breed,
      c.medicalEmergency,
      c.hospitalName,
      c.location,
      c.category,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}

export function calculateFundingProgress(raisedAmount: number, goalAmount: number): number {
  if (goalAmount <= 0) return 0;
  const pct = Math.round((raisedAmount / goalAmount) * 100);
  return Math.max(0, Math.min(100, pct));
}

export function applyDonationToCampaigns(
  campaigns: EmergencyCampaign[],
  campaignId: string | null,
  amount: number,
): EmergencyCampaign[] {
  if (!campaignId || amount <= 0 || !Number.isFinite(amount)) return campaigns;
  return campaigns.map((campaign) => {
    if (campaign.id !== campaignId) return campaign;
    return {
      ...campaign,
      raisedAmount: campaign.raisedAmount + Math.round(amount),
      donorCount: campaign.donorCount + 1,
    };
  });
}

export function calculateDonationSummary(
  input: DonationCalculationInput,
): DonationSummaryResult {
  const cleanAmount = Number.isFinite(input.amount) ? Math.max(0, input.amount) : 0;
  const isValidAmount = cleanAmount >= 5 && cleanAmount <= 250000;
  const annualEquivalent =
    input.frequency === 'monthly' ? cleanAmount * 12 : cleanAmount;
  const trimmedName = input.donorName.trim();
  const attributionLabel = input.isAnonymous
    ? 'Anonymous Benefactor'
    : trimmedName || 'Private Benefactor';
  const designationLabel = input.selectedCampaignTitle
    ? `Directed to ${input.selectedCampaignTitle}`
    : 'Aurelia Rapid Emergency Care Fund';
  const estimatedCareHours = Math.max(1, Math.round(cleanAmount / 25));

  return {
    amount: cleanAmount,
    isValidAmount,
    frequency: input.frequency,
    annualEquivalent,
    attributionLabel,
    designationLabel,
    estimatedCareHours,
  };
}

export function validateApplicationStep(
  step: number,
  data: EmergencyApplicationData,
): ValidationResult {
  const errors: Record<string, string> = {};

  if (step === 1) {
    if (!data.ownerFullName.trim()) {
      errors.ownerFullName = 'Please enter the primary guardian full name.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.ownerEmail.trim())) {
      errors.ownerEmail = 'Please provide a valid email address.';
    }
    if (data.ownerPhone.replace(/\D/g, '').length < 7) {
      errors.ownerPhone = 'Please enter a valid contact telephone number.';
    }
    if (!data.ownerCity.trim()) {
      errors.ownerCity = 'Please specify your city and region.';
    }
    if (!data.householdIncomeBand) {
      errors.householdIncomeBand = 'Please select a household financial tier.';
    }
  } else if (step === 2) {
    if (!data.petName.trim()) {
      errors.petName = 'Please enter your companion’s name.';
    }
    if (!data.petSpecies) {
      errors.petSpecies = 'Please select species.';
    }
    if (!data.petBreed.trim()) {
      errors.petBreed = 'Please enter breed or mix description.';
    }
    if (!data.petAge.trim()) {
      errors.petAge = 'Please provide approximate age.';
    }
  } else if (step === 3) {
    if (!data.emergencyType) {
      errors.emergencyType = 'Please select the primary emergency category.';
    }
    if (!data.onsetDate) {
      errors.onsetDate = 'Please indicate when symptoms or injury occurred.';
    }
    if (data.diagnosisSummary.trim().length < 15) {
      errors.diagnosisSummary =
        'Please describe the clinical diagnosis or emergency condition (at least 15 characters).';
    }
    const cost = Number(data.estimatedCost);
    const grant = Number(data.requestedGrant);
    if (!Number.isFinite(cost) || cost <= 0) {
      errors.estimatedCost = 'Please enter the estimated veterinary invoice total.';
    }
    if (!Number.isFinite(grant) || grant <= 0) {
      errors.requestedGrant = 'Please enter the emergency grant amount requested.';
    } else if (Number.isFinite(cost) && cost > 0 && grant > cost) {
      errors.requestedGrant = 'Requested grant cannot exceed total estimated treatment cost.';
    }
  } else if (step === 4) {
    if (!data.hospitalName.trim()) {
      errors.hospitalName = 'Please provide the treating veterinary hospital name.';
    }
    if (!data.attendingVetName.trim()) {
      errors.attendingVetName = 'Please enter the attending veterinarian’s name.';
    }
    if (data.hospitalPhone.replace(/\D/g, '').length < 7) {
      errors.hospitalPhone = 'Please provide the clinic’s direct phone number.';
    }
    if (!data.hospitalCity.trim()) {
      errors.hospitalCity = 'Please specify the hospital city.';
    }
  } else if (step === 5) {
    if (data.uploadedFiles.length === 0) {
      errors.uploadedFiles =
        'Please attach at least one veterinary estimate, invoice, or diagnostic summary.';
    }
  } else if (step === 6) {
    if (!data.confirmAccuracy) {
      errors.confirmAccuracy =
        'Please confirm that all clinical and household details are accurate for demonstration review.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function generateDemoReference(prefix = 'AUR', seed?: number): string {
  const randomCode =
    typeof seed === 'number'
      ? String(Math.abs(Math.floor(seed)) % 9000 + 1000)
      : String(Math.floor(1000 + Math.random() * 9000));
  return `${prefix}-2026-${randomCode}-DEMO`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

const SCENE_KEYFRAMES: {
  t: number;
  sceneIndex: number;
  title: string;
  subtitle: string;
  pos: [number, number, number];
  target: [number, number, number];
}[] = [
  {
    t: 0.0,
    sceneIndex: 1,
    title: 'Scene I — Sanctuary Arrival',
    subtitle: 'Golden hour across the limestone courtyard',
    pos: [0.08, 1.24, 4.15],
    target: [0.46, 0.68, 0.22],
  },
  {
    t: 0.2,
    sceneIndex: 2,
    title: 'Scene II — Quiet Approach',
    subtitle: 'Stepping gently onto the sunlit terrace',
    pos: [0.42, 1.00, 2.55],
    target: [0.80, 0.72, 0.34],
  },
  {
    t: 0.4,
    sceneIndex: 3,
    title: 'Scene III — Recognition & Gaze',
    subtitle: 'Warm eye contact, natural breathing, and poised calm',
    pos: [0.54, 0.92, 1.82],
    target: [0.80, 0.80, 0.38],
  },
  {
    t: 0.6,
    sceneIndex: 4,
    title: 'Scene IV — Companion Perspective',
    subtitle: 'Low orbital sweep illuminating the feline companion',
    pos: [2.38, 0.68, 1.72],
    target: [1.56, 0.44, 0.54],
  },
  {
    t: 0.8,
    sceneIndex: 5,
    title: 'Scene V — Our Mandate',
    subtitle: 'Because love should never come with a price tag',
    pos: [0.35, 1.56, 4.95],
    target: [0.65, 0.68, 0.25],
  },
  {
    t: 1.0,
    sceneIndex: 6,
    title: 'Scene VI — Into the Mission',
    subtitle: 'Entering the Aurelia editorial archive',
    pos: [0.52, 2.20, 5.55],
    target: [0.86, 0.62, 0.20],
  },
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep01(x: number): number {
  const c = Math.max(0, Math.min(1, x));
  return c * c * (3 - 2 * c);
}

export function computeScrollSceneState(progress: number): ScrollSceneKeyframe {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));

  let startIdx = 0;
  for (let i = 0; i < SCENE_KEYFRAMES.length - 1; i++) {
    if (clamped >= SCENE_KEYFRAMES[i].t) {
      startIdx = i;
    }
  }
  const endIdx = Math.min(SCENE_KEYFRAMES.length - 1, startIdx + 1);
  const start = SCENE_KEYFRAMES[startIdx];
  const end = SCENE_KEYFRAMES[endIdx];

  const span = end.t - start.t;
  const localT = span > 0 ? smoothstep01((clamped - start.t) / span) : 0;

  const cameraPosition: [number, number, number] = [
    lerp(start.pos[0], end.pos[0], localT),
    lerp(start.pos[1], end.pos[1], localT),
    lerp(start.pos[2], end.pos[2], localT),
  ];

  const lookAtTarget: [number, number, number] = [
    lerp(start.target[0], end.target[0], localT),
    lerp(start.target[1], end.target[1], localT),
    lerp(start.target[2], end.target[2], localT),
  ];

  const active = localT > 0.5 ? end : start;

  // Fade hero headline & scrim cleanly between t=0.02 and t=0.17 so close-ups have zero ghosting
  const heroContentOpacity =
    clamped <= 0.02
      ? 1
      : clamped < 0.17
        ? Math.max(0, 1 - smoothstep01((clamped - 0.02) / 0.15))
        : 0;

  const missionOverlayOpacity =
    clamped >= 0.68 && clamped <= 0.96
      ? clamped < 0.77
        ? smoothstep01((clamped - 0.68) / 0.09)
        : clamped > 0.87
          ? Math.max(0, 1 - smoothstep01((clamped - 0.87) / 0.09))
          : 1
      : 0;

  return {
    sceneIndex: active.sceneIndex,
    title: active.title,
    subtitle: active.subtitle,
    cameraPosition,
    lookAtTarget,
    missionOverlayOpacity,
    heroContentOpacity,
  };
}
