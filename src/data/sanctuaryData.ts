import type { EmergencyCampaign } from '../lib/sanctuaryLogic';

export const GENERATED_IMAGES = {
  heroFallback: '/src/assets/images/hero_sanctuary_fallback_1795452493238.jpg',
  missionPortrait: '/src/assets/images/mission_editorial_portrait_1795452493598.jpg',
  caseBarnaby: '/src/assets/images/case_barnaby_retriever_1795452493894.jpg',
  caseClara: '/src/assets/images/case_clara_cat_1795452493939.jpg',
  caseAtlas: '/src/assets/images/case_atlas_shepherd_1795452493901.jpg',
  caseOliver: '/src/assets/images/case_oliver_cat_1795452494506.jpg',
  storyRecovery: '/src/assets/images/story_recovery_editorial_1795452493848.jpg',
  vetSanctuary: '/src/assets/images/vet_hospital_care_1795452493881.jpg',
} as const;

export const INITIAL_CAMPAIGNS: EmergencyCampaign[] = [
  {
    id: 'barnaby-retriever',
    petName: 'Barnaby',
    species: 'Canine',
    breed: 'Golden Retriever',
    age: '9 years',
    location: 'Edinburgh, United Kingdom',
    category: 'Critical Surgery',
    urgency: 'Immediate',
    medicalEmergency: 'Acute Splenic Mass & Internal Hemorrhage Stabilization',
    treatmentSummary:
      'Emergency exploratory laparotomy, splenectomy, 48-hour intensive transfusion support, and histopathology monitoring.',
    hospitalName: 'Caledonian Specialist Veterinary Referral Centre',
    goalAmount: 5400,
    raisedAmount: 4180,
    donorCount: 64,
    image: GENERATED_IMAGES.caseBarnaby,
    imageAlt: 'Barnaby, a mature Golden Retriever resting on a cream wool blanket in morning light',
    costBreakdown: [
      { item: 'Emergency Surgical Team & Anesthesia', amount: 2650 },
      { item: 'Whole Blood Transfusion & ICU Monitoring (48h)', amount: 1750 },
      { item: 'Diagnostic Ultrasound & Pathology Panel', amount: 1000 },
    ],
    vetNote:
      'Barnaby arrived alert but anemic. Immediate surgical intervention carries a strong recovery outlook given his sound cardiac baseline.',
  },
  {
    id: 'clara-tabby',
    petName: 'Clara',
    species: 'Feline',
    breed: 'Domestic Shorthair Tabby',
    age: '4 years',
    location: 'Lyon, France',
    category: 'Trauma Care',
    urgency: 'Immediate',
    medicalEmergency: 'Bilateral Pelvic Fracture & Diaphragmatic Hernia Repair',
    treatmentSummary:
      'Micro-orthopedic internal fixation, thoracic stabilization, and six-week assisted physiotherapy.',
    hospitalName: 'Clinique Vétérinaire Saint-Jean',
    goalAmount: 3800,
    raisedAmount: 2740,
    donorCount: 41,
    image: GENERATED_IMAGES.caseClara,
    imageAlt: 'Clara, a grey-brown tabby cat resting calmly on warm ivory linen',
    costBreakdown: [
      { item: 'Thoracic & Orthopedic Micro-Surgery', amount: 2100 },
      { item: 'Oxygen Therapy & Post-Op Analgesia', amount: 1100 },
      { item: 'Follow-up Radiographs & Rehab', amount: 600 },
    ],
    vetNote:
      'Clara was rescued after a balcony fall. Her respiratory effort has stabilized under oxygen support and she is cleared for orthopedic repair.',
  },
  {
    id: 'atlas-shepherd',
    petName: 'Atlas',
    species: 'Canine',
    breed: 'Australian Shepherd',
    age: '5 years',
    location: 'Portland, Oregon',
    category: 'Cardiac Care',
    urgency: 'Priority',
    medicalEmergency: 'Balloon Valvuloplasty for Severe Pulmonic Stenosis',
    treatmentSummary:
      'Minimally invasive interventional cardiology catheterization and continuous telemetry recovery.',
    hospitalName: 'Willamette Valley Veterinary Cardiology',
    goalAmount: 6200,
    raisedAmount: 3890,
    donorCount: 52,
    image: GENERATED_IMAGES.caseAtlas,
    imageAlt: 'Atlas, a brown and white Australian Shepherd sitting attentively in a sunlit limestone courtyard',
    costBreakdown: [
      { item: 'Catheterization Suite & Fluoroscopy', amount: 3400 },
      { item: 'Balloon Valvuloplasty Consumables', amount: 1850 },
      { item: 'Echocardiography & Telemetry Stay', amount: 950 },
    ],
    vetNote:
      'Atlas lives with an elderly retired teacher. This one-time catheter procedure will restore full exercise tolerance and normal lifespan.',
  },
  {
    id: 'oliver-ginger',
    petName: 'Oliver',
    species: 'Feline',
    breed: 'Ginger Domestic Shorthair',
    age: '7 years',
    location: 'Zurich, Switzerland',
    category: 'Oncology',
    urgency: 'Stabilizing',
    medicalEmergency: 'Localized Mandibular Tumor Excision & Reconstruction',
    treatmentSummary:
      'CT surgical planning, clean-margin excision, feeding tube nutritional support, and recovery care.',
    hospitalName: 'Zürich Tiermedizinisches Zentrum',
    goalAmount: 4400,
    raisedAmount: 3420,
    donorCount: 49,
    image: GENERATED_IMAGES.caseOliver,
    imageAlt: 'Oliver, a ginger cat sitting gracefully beside a warm timber window',
    costBreakdown: [
      { item: '3D CT Imaging & Biopsy Staging', amount: 1250 },
      { item: 'Reconstructive Oral Surgery', amount: 2350 },
      { item: 'Nutritional Support & Ward Care', amount: 800 },
    ],
    vetNote:
      'Staging scans show zero metastasis. Early clean-margin surgery gives Oliver an excellent chance at complete remission.',
  },
];

export interface SuccessStory {
  id: string;
  petName: string;
  species: string;
  guardianName: string;
  location: string;
  year: string;
  headline: string;
  excerpt: string;
  narrative: string[];
  outcomeStat: string;
  hospitalPartner: string;
  image: string;
  imageAlt: string;
}

export const SUCCESS_STORIES: SuccessStory[] = [
  {
    id: 'winston-meadow',
    petName: 'Winston',
    species: 'Golden Retriever · Age 6',
    guardianName: 'Margaret & Julian Mercer',
    location: 'Bath, United Kingdom',
    year: '2026',
    headline: 'Forty-Eight Hours Between Critical Gastric Torsion and a Morning Walk Home',
    excerpt:
      'When midnight gastric dilatation-volvulus struck while Margaret was between pension disbursements, Aurelia wired direct surgical guarantees within twenty-two minutes.',
    narrative: [
      'Gastric dilatation-volvulus leaves less than two hours before tissue necrosis becomes irreversible. At 11:40 PM, Margaret Mercer carried Winston into our Bath partner hospital facing an immediate $4,900 surgical deposit.',
      'Our overnight veterinary triage desk verified Winston’s vitals directly with the on-call surgeon and issued an electronic guarantee of payment before midnight—allowing the team to scrub in without delay.',
      'Six weeks later, Winston returned to his morning path across the Somerset meadows. Every suture healed cleanly, and his follow-up blood panel shows full vitality.',
    ],
    outcomeStat: '22 min triage approval · Full recovery in 6 weeks',
    hospitalPartner: 'Avon Specialist Emergency Hospital',
    image: GENERATED_IMAGES.storyRecovery,
    imageAlt: 'Winston walking happily along a golden morning meadow path with his guardian',
  },
  {
    id: 'clara-courtyard',
    petName: 'Saffron',
    species: 'Domestic Shorthair · Age 3',
    guardianName: 'Dr. Henri Laurent (Guardian: Lucie Delacroix)',
    location: 'Annecy, France',
    year: '2026',
    headline: 'Micro-Orthopedic Precision Restored a Quiet Companion After Winter Trauma',
    excerpt:
      'Direct clinic-to-clinic settlement covered specialized titanium plating so a single-income music conservator never had to choose between rent and lifesaving surgery.',
    narrative: [
      'When Lucie Delacroix’s three-year-old cat Saffron sustained a complex comminuted fracture, local clinics quoted $3,600 for specialized feline orthopedics.',
      'Within four hours of receiving radiographs through our veterinary partner portal, Aurelia underwrote 90% of the surgical invoice directly with Clinique Vétérinaire Saint-Jean.',
      'Today Saffron leaps effortlessly onto Lucie’s sunlit timber windowsill during morning cello rehearsals.',
    ],
    outcomeStat: '90% grant underwritten · Full mobility restored',
    hospitalPartner: 'Clinique Vétérinaire Saint-Jean',
    image: GENERATED_IMAGES.caseOliver,
    imageAlt: 'Recovered ginger cat resting calmly on a sunlit timber windowsill',
  },
  {
    id: 'barnaby-seniors',
    petName: 'Hector',
    species: 'Australian Shepherd · Age 8',
    guardianName: 'Arthur Pendelton',
    location: 'Vermont, United States',
    year: '2025',
    headline: 'Keeping a Veteran and His Service Companion Together Through Cardiac Crisis',
    excerpt:
      'When sudden pericardial effusion threatened eight-year-old Hector, regional philanthropy bridged a critical specialist shortfall in under an hour.',
    narrative: [
      'Retired cartographer Arthur Pendelton relied on Hector for daily companionship and mobility steadiness after losing his spouse.',
      'Through Aurelia’s Senior Companion Shield program, emergency pericardiocentesis and biopsy monitoring were funded in full directly at the cardiology center.',
      'Hector remains at Arthur’s heel every afternoon in their courtyard garden.',
    ],
    outcomeStat: '100% emergency coverage · Zero family debt',
    hospitalPartner: 'New England Veterinary Cardiology',
    image: GENERATED_IMAGES.caseAtlas,
    imageAlt: 'Hector sitting calmly in a limestone courtyard surrounded by sage plants',
  },
];

export const HOW_WE_HELP_PILLARS = [
  {
    index: '01',
    title: 'Emergency Assistance',
    subtitle: 'Rapid Direct-to-Hospital Guarantees',
    description:
      'When acute trauma, obstruction, or organ crisis strikes, families face impossible deposit demands. We review clinical estimates within hours and settle funds directly with the treating veterinary hospital.',
    metric: 'Avg. 4-hour triage turnaround (demo benchmark)',
    ctaLabel: 'Apply for Emergency Help',
    ctaTo: '/apply',
  },
  {
    index: '02',
    title: 'Veterinary Partnerships',
    subtitle: 'Accredited Clinical Alliance',
    description:
      'Over 140 vetted specialist and 24-hour emergency hospitals collaborate with Aurelia under preferred charitable fee schedules, ensuring every donated dollar unlocks disproportionate medical care.',
    metric: '18–25% partner clinical discount rate (demo)',
    ctaLabel: 'Explore Vet Network',
    ctaTo: '/veterinary-partners',
  },
  {
    index: '03',
    title: 'Community Support',
    subtitle: 'Continuity Beyond Discharge',
    description:
      'Lifesaving surgery is only chapter one. Our sanctuary circles fund post-operative medications, prescription nutrition, mobility rehabilitation, and respite fostering for recovering guardians.',
    metric: '6-week post-op follow-up protocol',
    ctaLabel: 'Join the Sanctuary',
    ctaTo: '/get-involved',
  },
];

export const DEMO_IMPACT_STATS = [
  {
    label: 'Animals Treated (Demo Metric)',
    value: 1842,
    suffix: '+',
    detail: 'Emergency surgeries and ICU admissions funded since inception',
  },
  {
    label: 'Direct Care Ratio (Demo Metric)',
    value: 91,
    suffix: '%',
    detail: 'Of every contribution directed straight to hospital invoices',
  },
  {
    label: 'Partner Hospitals (Demo Metric)',
    value: 146,
    suffix: '',
    detail: 'Accredited 24-hour emergency and specialty clinics worldwide',
  },
  {
    label: 'Median Approval Window (Demo)',
    value: 3.8,
    suffix: ' hrs',
    detail: 'From veterinary estimate upload to clinic payment guarantee',
  },
];

export const PARTNER_HOSPITALS = [
  {
    id: 'caledonian',
    name: 'Caledonian Specialist Veterinary Referral Centre',
    city: 'Edinburgh, United Kingdom',
    specialties: 'Soft Tissue Surgery · Critical Care · Transfusion Medicine',
    tier: 'Founding 24/7 Partner',
  },
  {
    id: 'saint-jean',
    name: 'Clinique Vétérinaire Saint-Jean',
    city: 'Lyon, France',
    specialties: 'Feline Micro-Orthopedics · Thoracic Trauma · ICU',
    tier: 'Accredited Trauma Partner',
  },
  {
    id: 'willamette',
    name: 'Willamette Valley Veterinary Cardiology',
    city: 'Portland, United States',
    specialties: 'Interventional Cardiology · Echocardiography · Telemetry',
    tier: 'Specialty Alliance',
  },
  {
    id: 'zurich-tz',
    name: 'Zürich Tiermedizinisches Zentrum',
    city: 'Zurich, Switzerland',
    specialties: 'Oncologic Surgery · 3D CT Planning · Reconstructive Care',
    tier: 'Founding 24/7 Partner',
  },
];

export const FAQ_ITEMS = [
  {
    category: 'Emergency Assistance',
    question: 'Who is eligible to apply for an Aurelia emergency veterinary grant?',
    answer:
      'Any devoted pet guardian facing an unexpected, life-threatening veterinary emergency—such as trauma, acute surgical obstruction, toxicosis, or urgent cardiac stabilization—whose household financial capacity cannot meet the immediate hospital deposit.',
  },
  {
    category: 'Emergency Assistance',
    question: 'Are funds paid to the pet guardian or directly to the veterinary hospital?',
    answer:
      'To preserve complete transparency and speed clinical intake, Aurelia issues payment guarantees and settlements directly to the accredited treating veterinary hospital upon invoice verification.',
  },
  {
    category: 'Donations & Transparency',
    question: 'Does this frontend website process real credit card payments or store personal records?',
    answer:
      'No. This application is a frontend demonstration showcase. All donation receipts, campaign progress updates, and emergency application reference numbers exist solely in local browser state with no external payment gateway or database transmission.',
  },
  {
    category: 'Donations & Transparency',
    question: 'What happens if an individual pet campaign exceeds its funding goal?',
    answer:
      'In our real-world operating model, any surplus above the final settled hospital invoice is automatically held in the Rapid Emergency Reserve to immediately underwrite the next critical triage patient.',
  },
  {
    category: 'Veterinary Partners',
    question: 'How does a veterinary clinic join the Aurelia Partner Alliance?',
    answer:
      'Licensed emergency, specialty, and general veterinary practices can submit an inquiry through our Veterinary Partners page. Partner clinics commit to transparent itemized estimates and direct electronic invoicing.',
  },
  {
    category: '3D Experience',
    question: 'Can external rigged GLB/GLTF animal models be plugged into the Hero scene?',
    answer:
      'Yes. The hero 3D engine includes a clean replaceable asset configuration (src/config/models.ts) wired for GLTFLoader, DRACOLoader, and AnimationMixer bone rigging, falling back cleanly to our articulated procedural anatomical sculptures when no external GLB URL is configured.',
  },
];
