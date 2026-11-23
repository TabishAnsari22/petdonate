import EditorialHeader from '../components/ui/EditorialHeader';
import EmergencyApplicationWizard from '../components/sections/EmergencyApplicationWizard';

export default function ApplyPage() {
  return (
    <main className="bg-[#F7F4EE]">
      <EditorialHeader
        eyebrow="Emergency Grant Intake · Demo Workflow"
        title="Apply for Emergency Veterinary Assistance"
        description="Complete all six steps below to prepare a demonstration emergency care dossier. Validation, file previews, and reference number generation operate locally in your browser."
      />

      <section className="py-16 md:py-24 max-w-[1040px] mx-auto px-6 md:px-10">
        <EmergencyApplicationWizard />
      </section>
    </main>
  );
}
