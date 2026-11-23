import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import EditorialHeader from '../components/ui/EditorialHeader';
import { FAQ_ITEMS } from '../data/sanctuaryData';

export default function FaqsPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(FAQ_ITEMS.map((f) => f.category)))];
  const visibleFaqs =
    categoryFilter === 'All'
      ? FAQ_ITEMS
      : FAQ_ITEMS.filter((f) => f.category === categoryFilter);

  return (
    <main className="bg-[#F7F4EE]">
      <EditorialHeader
        eyebrow="Guidance & Answers"
        title="Frequently Asked Questions"
        description="Clear answers on emergency grant eligibility, direct-to-hospital payments, veterinary partnerships, and frontend demonstration architecture."
      />

      <section className="py-16 md:py-24 max-w-[960px] mx-auto px-6 md:px-10 space-y-8">
        <div className="flex flex-wrap gap-1.5 bg-[#EAE5DC] p-1 w-fit">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setCategoryFilter(cat);
                setOpenIndex(0);
              }}
              className={`px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-[#183D32] text-[#F7F4EE]'
                  : 'text-[#242824]/75 hover:text-[#242824]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="divide-y divide-[#242824]/15 border-y border-[#242824]/15">
          {visibleFaqs.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={item.question} className="py-5">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between gap-6 text-left cursor-pointer"
                >
                  <div>
                    <span className="block text-[11px] uppercase tracking-[0.14em] text-[#183D32] font-semibold mb-1">
                      {item.category}
                    </span>
                    <span className="font-serif text-2xl font-medium text-[#242824]">
                      {item.question}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-[#183D32] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <p className="mt-3 text-sm md:text-base text-[#242824]/80 leading-relaxed max-w-prose">
                    {item.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
