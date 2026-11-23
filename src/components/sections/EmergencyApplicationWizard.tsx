import { useState, type ChangeEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  useSanctuary,
  type SubmittedApplicationRecord,
} from '../../context/SanctuaryContext';
import {
  formatCurrency,
  validateApplicationStep,
  type EmergencyApplicationData,
} from '../../lib/sanctuaryLogic';

const STEP_LABELS = [
  { step: 1, label: 'Owner Info' },
  { step: 2, label: 'Pet Profile' },
  { step: 3, label: 'Emergency' },
  { step: 4, label: 'Vet Hospital' },
  { step: 5, label: 'Documents' },
  { step: 6, label: 'Review' },
];

const INITIAL_FORM: EmergencyApplicationData = {
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

export default function EmergencyApplicationWizard() {
  const { recordApplication } = useSanctuary();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<EmergencyApplicationData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedRecord, setSubmittedRecord] =
    useState<SubmittedApplicationRecord | null>(null);

  const updateField = <K extends keyof EmergencyApplicationData>(
    key: K,
    value: EmergencyApplicationData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key as string];
        return next;
      });
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const mapped = files.map((file) => ({
      name: file.name,
      sizeBytes: file.size,
      type: file.type || 'application/octet-stream',
      previewUrl: file.type.startsWith('image/')
        ? URL.createObjectURL(file)
        : undefined,
    }));

    updateField('uploadedFiles', [...formData.uploadedFiles, ...mapped]);
    e.target.value = '';
  };

  const attachSampleDocument = () => {
    updateField('uploadedFiles', [
      ...formData.uploadedFiles,
      {
        name: 'clinic_surgical_estimate_sample.pdf',
        sizeBytes: 184320,
        type: 'application/pdf',
      },
    ]);
  };

  const removeFile = (idx: number) => {
    const next = formData.uploadedFiles.filter((_, i) => i !== idx);
    updateField('uploadedFiles', next);
  };

  const handleNext = () => {
    const res = validateApplicationStep(currentStep, formData);
    if (!res.isValid) {
      setErrors(res.errors);
      return;
    }
    setErrors({});
    setCurrentStep((s) => Math.min(6, s + 1));
  };

  const handlePrev = () => {
    setErrors({});
    setCurrentStep((s) => Math.max(1, s - 1));
  };

  const handleSubmit = () => {
    const res = validateApplicationStep(6, formData);
    if (!res.isValid) {
      setErrors(res.errors);
      return;
    }
    const rec = recordApplication(formData);
    setSubmittedRecord(rec);
  };

  if (submittedRecord) {
    return (
      <div
        data-testid="application-confirmation"
        className="bg-[#F7F4EE] border border-[#183D32]/25 p-8 md:p-12 space-y-6"
      >
        <div className="flex items-start gap-4">
          <CheckCircle2 className="w-8 h-8 text-[#183D32] shrink-0 mt-1" aria-hidden="true" />
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-[#183D32] font-semibold">
              Demo Application Prepared
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-medium text-[#242824]">
              Case file created for {submittedRecord.petName}.
            </h2>
            <p className="text-sm text-[#242824]/75 leading-relaxed max-w-2xl">
              Thank you, {submittedRecord.ownerName}. Your emergency care dossier for{' '}
              <strong>{submittedRecord.hospitalName}</strong> has been generated in local browser state.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 border-y border-[#242824]/12 py-6 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wider text-[#242824]/60">
              Demo Reference Number
            </p>
            <p className="font-mono font-semibold text-[#183D32] text-base mt-1">
              {submittedRecord.reference}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-[#242824]/60">
              Requested Grant
            </p>
            <p className="font-mono font-medium text-[#242824] text-base mt-1">
              {formatCurrency(Number(submittedRecord.requestedGrant) || 0)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-[#242824]/60">
              Session Timestamp
            </p>
            <p className="font-medium text-[#242824] text-base mt-1">
              {submittedRecord.submittedAt} · Local Demo
            </p>
          </div>
        </div>

        <p className="text-xs text-[#242824]/65 leading-relaxed">
          Important Notice: This application workflow operates entirely on the frontend as an interactive demonstration. No medical records were uploaded to a server and no real veterinary grant has been submitted.
        </p>

        <button
          type="button"
          onClick={() => {
            setFormData(INITIAL_FORM);
            setCurrentStep(1);
            setSubmittedRecord(null);
          }}
          className="px-6 py-3 bg-[#183D32] text-[#F7F4EE] text-xs font-semibold uppercase tracking-[0.14em] hover:bg-[#112C24] transition-colors cursor-pointer"
        >
          Start Another Demo Application
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#F7F4EE] border border-[#242824]/14">
      {/* 6-Step Progress Indicator */}
      <div className="border-b border-[#242824]/12 bg-[#EAE5DC]/60 px-6 py-5 overflow-x-auto">
        <ol className="flex items-center justify-between gap-4 min-w-[600px]">
          {STEP_LABELS.map((item) => {
            const isActive = currentStep === item.step;
            const isComplete = currentStep > item.step;
            return (
              <li key={item.step} className="flex items-center gap-2.5">
                <span
                  className={`w-7 h-7 flex items-center justify-center text-xs font-mono tabular-nums border ${
                    isActive
                      ? 'bg-[#183D32] text-[#F7F4EE] border-[#183D32] font-semibold'
                      : isComplete
                        ? 'bg-[#A6B5A0]/45 text-[#183D32] border-[#183D32]/40'
                        : 'bg-white/60 text-[#242824]/60 border-[#242824]/20'
                  }`}
                >
                  0{item.step}
                </span>
                <span
                  className={`text-xs uppercase tracking-[0.12em] whitespace-nowrap ${
                    isActive ? 'text-[#183D32] font-semibold' : 'text-[#242824]/65'
                  }`}
                >
                  {item.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Step Content */}
      <div className="p-6 md:p-10 space-y-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-3xl font-medium text-[#242824]">
                Step 1 · Owner &amp; Guardian Information
              </h2>
              <p className="text-sm text-[#242824]/70 mt-1">
                Primary contact details for emergency triage coordination.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="app-owner-name" className="block text-xs font-medium text-[#242824]/80 mb-1.5">
                  Full Name *
                </label>
                <input
                  id="app-owner-name"
                  type="text"
                  value={formData.ownerFullName}
                  onChange={(e) => updateField('ownerFullName', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#242824]/20 text-sm focus:outline-none focus:border-[#183D32]"
                  placeholder="Claire Moreau"
                />
                {errors.ownerFullName && (
                  <p className="text-xs text-[#9A3412] mt-1">{errors.ownerFullName}</p>
                )}
              </div>
              <div>
                <label htmlFor="app-owner-email" className="block text-xs font-medium text-[#242824]/80 mb-1.5">
                  Email Address *
                </label>
                <input
                  id="app-owner-email"
                  type="email"
                  value={formData.ownerEmail}
                  onChange={(e) => updateField('ownerEmail', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#242824]/20 text-sm focus:outline-none focus:border-[#183D32]"
                  placeholder="claire@example.org"
                />
                {errors.ownerEmail && (
                  <p className="text-xs text-[#9A3412] mt-1">{errors.ownerEmail}</p>
                )}
              </div>
              <div>
                <label htmlFor="app-owner-phone" className="block text-xs font-medium text-[#242824]/80 mb-1.5">
                  Telephone Number *
                </label>
                <input
                  id="app-owner-phone"
                  type="tel"
                  value={formData.ownerPhone}
                  onChange={(e) => updateField('ownerPhone', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#242824]/20 text-sm focus:outline-none focus:border-[#183D32]"
                  placeholder="+1 503 555 0194"
                />
                {errors.ownerPhone && (
                  <p className="text-xs text-[#9A3412] mt-1">{errors.ownerPhone}</p>
                )}
              </div>
              <div>
                <label htmlFor="app-owner-city" className="block text-xs font-medium text-[#242824]/80 mb-1.5">
                  City &amp; Country *
                </label>
                <input
                  id="app-owner-city"
                  type="text"
                  value={formData.ownerCity}
                  onChange={(e) => updateField('ownerCity', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#242824]/20 text-sm focus:outline-none focus:border-[#183D32]"
                  placeholder="Edinburgh, UK"
                />
                {errors.ownerCity && (
                  <p className="text-xs text-[#9A3412] mt-1">{errors.ownerCity}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label htmlFor="app-income-band" className="block text-xs font-medium text-[#242824]/80 mb-1.5">
                  Household Financial Tier *
                </label>
                <select
                  id="app-income-band"
                  value={formData.householdIncomeBand}
                  onChange={(e) => updateField('householdIncomeBand', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#242824]/20 text-sm focus:outline-none focus:border-[#183D32]"
                >
                  <option value="">Select household tier</option>
                  <option value="Under $35,000 / year">Under $35,000 / year</option>
                  <option value="$35,000 – $65,000 / year">$35,000 – $65,000 / year</option>
                  <option value="Fixed Pension / Disability Support">Fixed Pension / Disability Support</option>
                  <option value="Acute Hardship / Unplanned Loss of Income">Acute Hardship / Unplanned Loss of Income</option>
                </select>
                {errors.householdIncomeBand && (
                  <p className="text-xs text-[#9A3412] mt-1">{errors.householdIncomeBand}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-3xl font-medium text-[#242824]">
                Step 2 · Companion Pet Information
              </h2>
              <p className="text-sm text-[#242824]/70 mt-1">
                Identify the companion requiring urgent clinical support.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="app-pet-name" className="block text-xs font-medium text-[#242824]/80 mb-1.5">
                  Pet Name *
                </label>
                <input
                  id="app-pet-name"
                  type="text"
                  value={formData.petName}
                  onChange={(e) => updateField('petName', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#242824]/20 text-sm focus:outline-none focus:border-[#183D32]"
                  placeholder="Barnaby"
                />
                {errors.petName && <p className="text-xs text-[#9A3412] mt-1">{errors.petName}</p>}
              </div>
              <div>
                <label htmlFor="app-pet-species" className="block text-xs font-medium text-[#242824]/80 mb-1.5">
                  Species *
                </label>
                <select
                  id="app-pet-species"
                  value={formData.petSpecies}
                  onChange={(e) =>
                    updateField('petSpecies', e.target.value as EmergencyApplicationData['petSpecies'])
                  }
                  className="w-full px-4 py-2.5 bg-white border border-[#242824]/20 text-sm focus:outline-none focus:border-[#183D32]"
                >
                  <option value="">Select species</option>
                  <option value="Dog">Dog</option>
                  <option value="Cat">Cat</option>
                  <option value="Other">Other Companion</option>
                </select>
                {errors.petSpecies && (
                  <p className="text-xs text-[#9A3412] mt-1">{errors.petSpecies}</p>
                )}
              </div>
              <div>
                <label htmlFor="app-pet-breed" className="block text-xs font-medium text-[#242824]/80 mb-1.5">
                  Breed / Mix *
                </label>
                <input
                  id="app-pet-breed"
                  type="text"
                  value={formData.petBreed}
                  onChange={(e) => updateField('petBreed', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#242824]/20 text-sm focus:outline-none focus:border-[#183D32]"
                  placeholder="Golden Retriever"
                />
                {errors.petBreed && <p className="text-xs text-[#9A3412] mt-1">{errors.petBreed}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="app-pet-age" className="block text-xs font-medium text-[#242824]/80 mb-1.5">
                    Age *
                  </label>
                  <input
                    id="app-pet-age"
                    type="text"
                    value={formData.petAge}
                    onChange={(e) => updateField('petAge', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#242824]/20 text-sm focus:outline-none focus:border-[#183D32]"
                    placeholder="7 years"
                  />
                  {errors.petAge && <p className="text-xs text-[#9A3412] mt-1">{errors.petAge}</p>}
                </div>
                <div>
                  <label htmlFor="app-pet-weight" className="block text-xs font-medium text-[#242824]/80 mb-1.5">
                    Weight (kg)
                  </label>
                  <input
                    id="app-pet-weight"
                    type="text"
                    value={formData.petWeightKg}
                    onChange={(e) => updateField('petWeightKg', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#242824]/20 text-sm focus:outline-none focus:border-[#183D32]"
                    placeholder="28 kg"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-3xl font-medium text-[#242824]">
                Step 3 · Medical Emergency Details
              </h2>
              <p className="text-sm text-[#242824]/70 mt-1">
                Provide the veterinary diagnosis and itemized grant request.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="app-emergency-type" className="block text-xs font-medium text-[#242824]/80 mb-1.5">
                  Emergency Category *
                </label>
                <select
                  id="app-emergency-type"
                  value={formData.emergencyType}
                  onChange={(e) => updateField('emergencyType', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#242824]/20 text-sm focus:outline-none focus:border-[#183D32]"
                >
                  <option value="">Select category</option>
                  <option value="Critical Surgery">Critical Surgery</option>
                  <option value="Trauma Care">Trauma Care</option>
                  <option value="Cardiac Care">Cardiac Care</option>
                  <option value="Oncology">Urgent Oncology</option>
                  <option value="Toxicosis / ICU">Toxicosis &amp; ICU Stabilization</option>
                </select>
                {errors.emergencyType && (
                  <p className="text-xs text-[#9A3412] mt-1">{errors.emergencyType}</p>
                )}
              </div>
              <div>
                <label htmlFor="app-onset-date" className="block text-xs font-medium text-[#242824]/80 mb-1.5">
                  Onset / Admission Date *
                </label>
                <input
                  id="app-onset-date"
                  type="date"
                  value={formData.onsetDate}
                  onChange={(e) => updateField('onsetDate', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#242824]/20 text-sm focus:outline-none focus:border-[#183D32]"
                />
                {errors.onsetDate && (
                  <p className="text-xs text-[#9A3412] mt-1">{errors.onsetDate}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label htmlFor="app-diagnosis" className="block text-xs font-medium text-[#242824]/80 mb-1.5">
                  Clinical Diagnosis &amp; Urgent Procedure Required *
                </label>
                <textarea
                  id="app-diagnosis"
                  rows={3}
                  value={formData.diagnosisSummary}
                  onChange={(e) => updateField('diagnosisSummary', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#242824]/20 text-sm focus:outline-none focus:border-[#183D32]"
                  placeholder="Describe the veterinarian’s findings and proposed surgical or ICU plan..."
                />
                {errors.diagnosisSummary && (
                  <p className="text-xs text-[#9A3412] mt-1">{errors.diagnosisSummary}</p>
                )}
              </div>
              <div>
                <label htmlFor="app-est-cost" className="block text-xs font-medium text-[#242824]/80 mb-1.5">
                  Total Estimated Clinic Cost (USD) *
                </label>
                <input
                  id="app-est-cost"
                  type="number"
                  min={1}
                  value={formData.estimatedCost}
                  onChange={(e) => updateField('estimatedCost', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#242824]/20 text-sm font-mono focus:outline-none focus:border-[#183D32]"
                  placeholder="4200"
                />
                {errors.estimatedCost && (
                  <p className="text-xs text-[#9A3412] mt-1">{errors.estimatedCost}</p>
                )}
              </div>
              <div>
                <label htmlFor="app-grant-req" className="block text-xs font-medium text-[#242824]/80 mb-1.5">
                  Grant Amount Requested (USD) *
                </label>
                <input
                  id="app-grant-req"
                  type="number"
                  min={1}
                  value={formData.requestedGrant}
                  onChange={(e) => updateField('requestedGrant', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#242824]/20 text-sm font-mono focus:outline-none focus:border-[#183D32]"
                  placeholder="3200"
                />
                {errors.requestedGrant && (
                  <p className="text-xs text-[#9A3412] mt-1">{errors.requestedGrant}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-3xl font-medium text-[#242824]">
                Step 4 · Veterinary Hospital Information
              </h2>
              <p className="text-sm text-[#242824]/70 mt-1">
                Grants are wired directly to the treating veterinary hospital.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="app-hosp-name" className="block text-xs font-medium text-[#242824]/80 mb-1.5">
                  Hospital or Referral Clinic Name *
                </label>
                <input
                  id="app-hosp-name"
                  type="text"
                  value={formData.hospitalName}
                  onChange={(e) => updateField('hospitalName', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#242824]/20 text-sm focus:outline-none focus:border-[#183D32]"
                  placeholder="Caledonian Specialist Veterinary Referral Centre"
                />
                {errors.hospitalName && (
                  <p className="text-xs text-[#9A3412] mt-1">{errors.hospitalName}</p>
                )}
              </div>
              <div>
                <label htmlFor="app-vet-name" className="block text-xs font-medium text-[#242824]/80 mb-1.5">
                  Attending Veterinarian *
                </label>
                <input
                  id="app-vet-name"
                  type="text"
                  value={formData.attendingVetName}
                  onChange={(e) => updateField('attendingVetName', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#242824]/20 text-sm focus:outline-none focus:border-[#183D32]"
                  placeholder="Dr. Alistair Finch, MRCVS"
                />
                {errors.attendingVetName && (
                  <p className="text-xs text-[#9A3412] mt-1">{errors.attendingVetName}</p>
                )}
              </div>
              <div>
                <label htmlFor="app-hosp-phone" className="block text-xs font-medium text-[#242824]/80 mb-1.5">
                  Clinic Direct Phone *
                </label>
                <input
                  id="app-hosp-phone"
                  type="tel"
                  value={formData.hospitalPhone}
                  onChange={(e) => updateField('hospitalPhone', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#242824]/20 text-sm focus:outline-none focus:border-[#183D32]"
                  placeholder="+44 131 555 0140"
                />
                {errors.hospitalPhone && (
                  <p className="text-xs text-[#9A3412] mt-1">{errors.hospitalPhone}</p>
                )}
              </div>
              <div>
                <label htmlFor="app-hosp-city" className="block text-xs font-medium text-[#242824]/80 mb-1.5">
                  Hospital City *
                </label>
                <input
                  id="app-hosp-city"
                  type="text"
                  value={formData.hospitalCity}
                  onChange={(e) => updateField('hospitalCity', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#242824]/20 text-sm focus:outline-none focus:border-[#183D32]"
                  placeholder="Edinburgh"
                />
                {errors.hospitalCity && (
                  <p className="text-xs text-[#9A3412] mt-1">{errors.hospitalCity}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label htmlFor="app-invoice-id" className="block text-xs font-medium text-[#242824]/80 mb-1.5">
                  Estimate / Case Reference Number (Optional)
                </label>
                <input
                  id="app-invoice-id"
                  type="text"
                  value={formData.hospitalInvoiceId}
                  onChange={(e) => updateField('hospitalInvoiceId', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#242824]/20 text-sm font-mono focus:outline-none focus:border-[#183D32]"
                  placeholder="EST-99214"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-3xl font-medium text-[#242824]">
                Step 5 · Medical Documents Upload
              </h2>
              <p className="text-sm text-[#242824]/70 mt-1">
                Attach itemized veterinary estimates, diagnostic summaries, or photographs. Preview stays strictly inside your browser.
              </p>
            </div>

            <div className="border border-dashed border-[#183D32]/35 bg-[#EAE5DC]/45 p-8 text-center space-y-4">
              <Upload className="w-7 h-7 text-[#183D32] mx-auto" aria-hidden="true" />
              <div>
                <label
                  htmlFor="medical-docs-upload"
                  className="inline-flex items-center px-5 py-2.5 bg-[#183D32] text-[#F7F4EE] text-xs font-semibold uppercase tracking-[0.14em] hover:bg-[#112C24] transition-colors cursor-pointer"
                >
                  Select Local Files
                </label>
                <input
                  id="medical-docs-upload"
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
                <button
                  type="button"
                  onClick={attachSampleDocument}
                  className="ml-3 inline-flex items-center px-4 py-2.5 border border-[#242824]/25 text-xs font-semibold uppercase tracking-[0.12em] text-[#242824] hover:border-[#183D32] cursor-pointer"
                >
                  Attach Sample Estimate (Demo)
                </button>
              </div>
              <p className="text-xs text-[#242824]/60">
                Accepted formats: PDF, JPG, PNG · Processed locally in browser memory
              </p>
            </div>

            {formData.uploadedFiles.length > 0 && (
              <ul className="space-y-3">
                {formData.uploadedFiles.map((file, idx) => (
                  <li
                    key={`${file.name}-${idx}`}
                    className="flex items-center justify-between gap-4 p-3.5 bg-white border border-[#242824]/12"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {file.previewUrl ? (
                        <img
                          src={file.previewUrl}
                          alt={file.name}
                          className="w-12 h-12 object-cover border border-[#242824]/15 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-[#EAE5DC] flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-[#183D32]" aria-hidden="true" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#242824] truncate">{file.name}</p>
                        <p className="text-xs text-[#242824]/60 font-mono">
                          {Math.max(1, Math.round(file.sizeBytes / 1024))} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      aria-label={`Remove ${file.name}`}
                      className="p-2 text-[#242824]/60 hover:text-[#9A3412] cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {errors.uploadedFiles && (
              <p className="text-xs text-[#9A3412]">{errors.uploadedFiles}</p>
            )}
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-3xl font-medium text-[#242824]">
                Step 6 · Review &amp; Submit (Demo)
              </h2>
              <p className="text-sm text-[#242824]/70 mt-1">
                Verify all clinical and contact details before generating your demonstration case reference.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#EAE5DC]/55 border border-[#242824]/12 p-6 text-sm">
              <div className="space-y-1.5">
                <p className="text-xs uppercase tracking-wider text-[#183D32] font-semibold">
                  Guardian
                </p>
                <p className="font-medium text-[#242824]">{formData.ownerFullName}</p>
                <p className="text-[#242824]/75">{formData.ownerEmail} · {formData.ownerPhone}</p>
                <p className="text-[#242824]/75">{formData.ownerCity} ({formData.householdIncomeBand})</p>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs uppercase tracking-wider text-[#183D32] font-semibold">
                  Companion &amp; Diagnosis
                </p>
                <p className="font-medium text-[#242824]">
                  {formData.petName} · {formData.petSpecies} ({formData.petBreed}, {formData.petAge})
                </p>
                <p className="text-[#242824]/75">{formData.emergencyType} · {formData.onsetDate}</p>
                <p className="text-[#242824]/75">{formData.diagnosisSummary}</p>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs uppercase tracking-wider text-[#183D32] font-semibold">
                  Veterinary Hospital
                </p>
                <p className="font-medium text-[#242824]">{formData.hospitalName}</p>
                <p className="text-[#242824]/75">
                  {formData.attendingVetName} · {formData.hospitalCity}
                </p>
                <p className="text-[#242824]/75">{formData.hospitalPhone}</p>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs uppercase tracking-wider text-[#183D32] font-semibold">
                  Grant Request &amp; Files
                </p>
                <p className="font-mono font-semibold text-[#183D32]">
                  Requested: {formatCurrency(Number(formData.requestedGrant) || 0)} of{' '}
                  {formatCurrency(Number(formData.estimatedCost) || 0)}
                </p>
                <p className="text-[#242824]/75">
                  {formData.uploadedFiles.length} attached document(s)
                </p>
              </div>
            </div>

            <label className="flex items-start gap-3 text-sm text-[#242824] cursor-pointer">
              <input
                type="checkbox"
                checked={formData.confirmAccuracy}
                onChange={(e) => updateField('confirmAccuracy', e.target.checked)}
                className="mt-1 w-4 h-4 accent-[#183D32]"
              />
              <span>
                I understand this is a frontend-only demonstration form and that no information is transmitted to an external server or veterinary board.
              </span>
            </label>
            {errors.confirmAccuracy && (
              <p className="text-xs text-[#9A3412]">{errors.confirmAccuracy}</p>
            )}
          </div>
        )}
          </motion.div>
        </AnimatePresence>

        {/* Wizard Controls */}
        <div className="pt-6 border-t border-[#242824]/12 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="inline-flex items-center gap-2 px-5 py-3 border border-[#242824]/25 text-xs font-semibold uppercase tracking-[0.12em] text-[#242824] disabled:opacity-35 hover:border-[#183D32] cursor-pointer disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Previous
          </button>

          {currentStep < 6 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#183D32] text-[#F7F4EE] text-xs font-semibold uppercase tracking-[0.14em] hover:bg-[#112C24] transition-colors cursor-pointer"
            >
              Continue
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#183D32] text-[#F7F4EE] text-xs font-semibold uppercase tracking-[0.14em] hover:bg-[#112C24] transition-colors cursor-pointer"
            >
              Submit Demo Application
              <CheckCircle2 className="w-4 h-4 text-[#B99A64]" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
