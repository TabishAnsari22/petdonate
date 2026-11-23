import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyDonationToCampaigns,
  calculateDonationSummary,
  calculateFundingProgress,
  computeScrollSceneState,
  filterCampaigns,
  generateDemoReference,
  validateApplicationStep,
  type EmergencyApplicationData,
  type EmergencyCampaign,
} from './sanctuaryLogic';

const SAMPLE_CAMPAIGNS: EmergencyCampaign[] = [
  {
    id: 'barnaby',
    petName: 'Barnaby',
    species: 'Canine',
    breed: 'Golden Retriever',
    age: '9 years',
    location: 'Edinburgh, UK',
    category: 'Critical Surgery',
    urgency: 'Immediate',
    medicalEmergency: 'Splenic mass resection',
    treatmentSummary: 'Emergency laparotomy and ICU care.',
    hospitalName: 'Royal Dick Veterinary Hospital',
    goalAmount: 4800,
    raisedAmount: 3600,
    donorCount: 42,
    image: '/test.jpg',
    imageAlt: 'Barnaby',
    costBreakdown: [{ item: 'Surgery', amount: 4800 }],
    vetNote: 'Stable for procedure.',
  },
  {
    id: 'clara',
    petName: 'Clara',
    species: 'Feline',
    breed: 'British Shorthair Tabby',
    age: '4 years',
    location: 'Lyon, FR',
    category: 'Trauma Care',
    urgency: 'Priority',
    medicalEmergency: 'Pelvic fracture stabilization',
    treatmentSummary: 'Orthopedic pinning and pain management.',
    hospitalName: 'Clinique Vétérinaire Bellecour',
    goalAmount: 3200,
    raisedAmount: 1600,
    donorCount: 19,
    image: '/test2.jpg',
    imageAlt: 'Clara',
    costBreakdown: [{ item: 'Orthopedics', amount: 3200 }],
    vetNote: 'Good prognosis.',
  },
];

const EMPTY_APP: EmergencyApplicationData = {
  ownerFullName: '',
  ownerEmail: '',
  ownerPhone: '',
  ownerCity: '',
  householdIncomeBand: '',
  petName: '',
  petSpecies: '',
  petBreed: '',
  petAge: '',
  petWeightKg: '',
  emergencyType: '',
  onsetDate: '',
  diagnosisSummary: '',
  estimatedCost: '',
  requestedGrant: '',
  hospitalName: '',
  attendingVetName: '',
  hospitalPhone: '',
  hospitalCity: '',
  hospitalInvoiceId: '',
  uploadedFiles: [],
  confirmAccuracy: false,
};

test('filterCampaigns filters by category, species, and text query', () => {
  assert.equal(filterCampaigns(SAMPLE_CAMPAIGNS, '', 'All').length, 2);
  assert.equal(filterCampaigns(SAMPLE_CAMPAIGNS, '', 'Trauma Care').length, 1);
  assert.equal(filterCampaigns(SAMPLE_CAMPAIGNS, 'Barnaby', 'All').length, 1);
  assert.equal(filterCampaigns(SAMPLE_CAMPAIGNS, 'splenic', 'All')[0]?.id, 'barnaby');
  assert.equal(filterCampaigns(SAMPLE_CAMPAIGNS, '', 'All', 'Feline')[0]?.id, 'clara');
});

test('calculateFundingProgress clamps between 0 and 100', () => {
  assert.equal(calculateFundingProgress(3600, 4800), 75);
  assert.equal(calculateFundingProgress(6000, 4800), 100);
  assert.equal(calculateFundingProgress(-100, 4800), 0);
  assert.equal(calculateFundingProgress(100, 0), 0);
});

test('applyDonationToCampaigns increments raisedAmount and donorCount immutably', () => {
  const updated = applyDonationToCampaigns(SAMPLE_CAMPAIGNS, 'clara', 250);
  assert.equal(updated[1].raisedAmount, 1850);
  assert.equal(updated[1].donorCount, 20);
  assert.equal(SAMPLE_CAMPAIGNS[1].raisedAmount, 1600);
});

test('calculateDonationSummary computes monthly annual equivalent and anonymous attribution', () => {
  const monthlyAnon = calculateDonationSummary({
    amount: 50,
    frequency: 'monthly',
    isAnonymous: true,
    donorName: 'Elena Vance',
    selectedCampaignTitle: 'Barnaby',
  });
  assert.equal(monthlyAnon.isValidAmount, true);
  assert.equal(monthlyAnon.annualEquivalent, 600);
  assert.equal(monthlyAnon.attributionLabel, 'Anonymous Benefactor');
  assert.equal(monthlyAnon.designationLabel, 'Directed to Barnaby');

  const invalidSmall = calculateDonationSummary({
    amount: 2,
    frequency: 'one-time',
    isAnonymous: false,
    donorName: 'Marcus',
  });
  assert.equal(invalidSmall.isValidAmount, false);
});

test('validateApplicationStep catches missing fields and validates step transitions', () => {
  const step1Fail = validateApplicationStep(1, EMPTY_APP);
  assert.equal(step1Fail.isValid, false);
  assert.ok(step1Fail.errors.ownerFullName);
  assert.ok(step1Fail.errors.ownerEmail);

  const step1Pass = validateApplicationStep(1, {
    ...EMPTY_APP,
    ownerFullName: 'Claire Moreau',
    ownerEmail: 'claire@example.org',
    ownerPhone: '+33 6 12 34 56 78',
    ownerCity: 'Lyon',
    householdIncomeBand: 'Under $35,000 / year',
  });
  assert.equal(step1Pass.isValid, true);

  const step3OverGrant = validateApplicationStep(3, {
    ...EMPTY_APP,
    emergencyType: 'Trauma Care',
    onsetDate: '2026-11-20',
    diagnosisSummary: 'Acute femoral fracture requiring immediate internal fixation.',
    estimatedCost: '2000',
    requestedGrant: '2500',
  });
  assert.equal(step3OverGrant.isValid, false);
  assert.ok(step3OverGrant.errors.requestedGrant);
});

test('generateDemoReference creates deterministic formatted ID when seeded', () => {
  assert.equal(generateDemoReference('AUR', 4281), 'AUR-2026-5281-DEMO');
});

test('computeScrollSceneState smoothly transitions across scenes 1 through 6', () => {
  const s1 = computeScrollSceneState(0);
  assert.equal(s1.sceneIndex, 1);
  assert.equal(s1.heroContentOpacity, 1);
  assert.equal(s1.missionOverlayOpacity, 0);

  const s3 = computeScrollSceneState(0.4);
  assert.equal(s3.sceneIndex, 3);
  assert.ok(s3.cameraPosition[2] < s1.cameraPosition[2]);

  const s5 = computeScrollSceneState(0.8);
  assert.equal(s5.sceneIndex, 5);
  assert.equal(s5.missionOverlayOpacity, 1);

  const s6 = computeScrollSceneState(1.0);
  assert.equal(s6.sceneIndex, 6);
  assert.equal(s6.missionOverlayOpacity, 0);
});
