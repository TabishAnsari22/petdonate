import { createContext, useContext, useState, type ReactNode } from 'react';
import { INITIAL_CAMPAIGNS } from '../data/sanctuaryData';
import {
  applyDonationToCampaigns,
  generateDemoReference,
  type DonationFrequency,
  type EmergencyApplicationData,
  type EmergencyCampaign,
} from '../lib/sanctuaryLogic';

export interface DonationRecord {
  id: string;
  reference: string;
  amount: number;
  frequency: DonationFrequency;
  campaignId: string | null;
  campaignTitle: string;
  donorLabel: string;
  isAnonymous: boolean;
  timestamp: string;
}

export interface SubmittedApplicationRecord {
  reference: string;
  petName: string;
  ownerName: string;
  hospitalName: string;
  requestedGrant: string;
  submittedAt: string;
}

export interface PartnerSubmissionRecord {
  reference: string;
  clinicName: string;
  city: string;
  medicalDirector: string;
  submittedAt: string;
}

interface SanctuaryContextValue {
  campaigns: EmergencyCampaign[];
  recentDonations: DonationRecord[];
  submittedApplications: SubmittedApplicationRecord[];
  partnerSubmissions: PartnerSubmissionRecord[];
  recordDonation: (params: {
    amount: number;
    frequency: DonationFrequency;
    campaignId: string | null;
    donorName: string;
    isAnonymous: boolean;
  }) => DonationRecord;
  recordApplication: (data: EmergencyApplicationData) => SubmittedApplicationRecord;
  recordPartnerRegistration: (params: {
    clinicName: string;
    city: string;
    medicalDirector: string;
  }) => PartnerSubmissionRecord;
}

const SanctuaryContext = createContext<SanctuaryContextValue | null>(null);

export function SanctuaryProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<EmergencyCampaign[]>(INITIAL_CAMPAIGNS);
  const [recentDonations, setRecentDonations] = useState<DonationRecord[]>([
    {
      id: 'seed-1',
      reference: 'AUR-2026-4109-DEMO',
      amount: 250,
      frequency: 'one-time',
      campaignId: 'barnaby-retriever',
      campaignTitle: 'Barnaby · Golden Retriever',
      donorLabel: 'Eleanor & James Whitmore',
      isAnonymous: false,
      timestamp: 'Today · Illustrative Demo Gift',
    },
    {
      id: 'seed-2',
      reference: 'AUR-2026-3892-DEMO',
      amount: 100,
      frequency: 'monthly',
      campaignId: 'clara-tabby',
      campaignTitle: 'Clara · Domestic Shorthair Tabby',
      donorLabel: 'Anonymous Benefactor',
      isAnonymous: true,
      timestamp: 'Yesterday · Illustrative Demo Gift',
    },
  ]);
  const [submittedApplications, setSubmittedApplications] = useState<
    SubmittedApplicationRecord[]
  >([]);
  const [partnerSubmissions, setPartnerSubmissions] = useState<PartnerSubmissionRecord[]>(
    [],
  );

  const recordDonation = (params: {
    amount: number;
    frequency: DonationFrequency;
    campaignId: string | null;
    donorName: string;
    isAnonymous: boolean;
  }): DonationRecord => {
    const targetCampaign = campaigns.find((c) => c.id === params.campaignId) ?? null;
    const reference = generateDemoReference('DON');
    const donorLabel = params.isAnonymous
      ? 'Anonymous Benefactor'
      : params.donorName.trim() || 'Private Benefactor';

    const record: DonationRecord = {
      id: `${Date.now()}`,
      reference,
      amount: Math.round(params.amount),
      frequency: params.frequency,
      campaignId: params.campaignId,
      campaignTitle: targetCampaign
        ? `${targetCampaign.petName} · ${targetCampaign.breed}`
        : 'Aurelia Rapid Emergency Fund',
      donorLabel,
      isAnonymous: params.isAnonymous,
      timestamp: 'Just now · Local Demo Session',
    };

    if (params.campaignId) {
      setCampaigns((prev) =>
        applyDonationToCampaigns(prev, params.campaignId, params.amount),
      );
    }
    setRecentDonations((prev) => [record, ...prev]);
    return record;
  };

  const recordApplication = (
    data: EmergencyApplicationData,
  ): SubmittedApplicationRecord => {
    const rec: SubmittedApplicationRecord = {
      reference: generateDemoReference('EMG'),
      petName: data.petName,
      ownerName: data.ownerFullName,
      hospitalName: data.hospitalName,
      requestedGrant: data.requestedGrant,
      submittedAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setSubmittedApplications((prev) => [rec, ...prev]);
    return rec;
  };

  const recordPartnerRegistration = (params: {
    clinicName: string;
    city: string;
    medicalDirector: string;
  }): PartnerSubmissionRecord => {
    const rec: PartnerSubmissionRecord = {
      reference: generateDemoReference('VET'),
      clinicName: params.clinicName,
      city: params.city,
      medicalDirector: params.medicalDirector,
      submittedAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setPartnerSubmissions((prev) => [rec, ...prev]);
    return rec;
  };

  return (
    <SanctuaryContext.Provider
      value={{
        campaigns,
        recentDonations,
        submittedApplications,
        partnerSubmissions,
        recordDonation,
        recordApplication,
        recordPartnerRegistration,
      }}
    >
      {children}
    </SanctuaryContext.Provider>
  );
}

export function useSanctuary() {
  const ctx = useContext(SanctuaryContext);
  if (!ctx) {
    throw new Error('useSanctuary must be used inside SanctuaryProvider');
  }
  return ctx;
}
