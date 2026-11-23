import { useState } from 'react';
import { Search } from 'lucide-react';
import EditorialHeader from '../components/ui/EditorialHeader';
import CaseCard from '../components/sections/CaseCard';
import { useSanctuary } from '../context/SanctuaryContext';
import {
  filterCampaigns,
  type CampaignCategory,
} from '../lib/sanctuaryLogic';

const CATEGORIES: CampaignCategory[] = [
  'All',
  'Critical Surgery',
  'Trauma Care',
  'Cardiac Care',
  'Oncology',
];

export default function CampaignsPage() {
  const { campaigns } = useSanctuary();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CampaignCategory>('All');
  const [species, setSpecies] = useState<'All' | 'Canine' | 'Feline'>('All');

  const filtered = filterCampaigns(campaigns, query, category, species);

  return (
    <main className="bg-[#F7F4EE]">
      <EditorialHeader
        eyebrow="Active Veterinary Campaigns"
        title="Emergency Cases Open for Direct Funding"
        description="Every listed companion has an active treatment plan with an accredited partner hospital. Search by pet name, clinical specialty, or species."
      />

      <section className="py-16 max-w-[1320px] mx-auto px-6 md:px-10 space-y-10">
        {/* Search & Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-[#242824]/12">
          <div className="relative w-full lg:max-w-sm">
            <label htmlFor="campaign-search" className="sr-only">
              Search active campaigns
            </label>
            <Search
              className="w-4 h-4 text-[#242824]/50 absolute left-3.5 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              id="campaign-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pet, condition, or city..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#242824]/20 text-sm focus:outline-none focus:border-[#183D32]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap items-center gap-1 bg-[#EAE5DC] p-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    category === cat
                      ? 'bg-[#183D32] text-[#F7F4EE]'
                      : 'text-[#242824]/75 hover:text-[#242824]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-[#EAE5DC] p-1">
              {(['All', 'Canine', 'Feline'] as const).map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => setSpecies(sp)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    species === sp
                      ? 'bg-[#183D32] text-[#F7F4EE]'
                      : 'text-[#242824]/75 hover:text-[#242824]'
                  }`}
                >
                  {sp}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center bg-[#EAE5DC]/45 border border-[#242824]/12 space-y-4">
            <p className="font-serif text-2xl text-[#242824]">
              No active campaigns match those filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setCategory('All');
                setSpecies('All');
              }}
              className="px-5 py-2.5 bg-[#183D32] text-[#F7F4EE] text-xs font-semibold uppercase tracking-[0.14em] cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((campaign) => (
              <CaseCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
