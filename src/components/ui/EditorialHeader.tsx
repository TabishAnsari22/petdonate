interface EditorialHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
}

export default function EditorialHeader({
  eyebrow,
  title,
  description,
}: EditorialHeaderProps) {
  return (
    <section className="pt-32 md:pt-40 pb-12 md:pb-16 bg-[#F7F4EE] border-b border-[#242824]/12">
      <div className="max-w-[1320px] mx-auto px-6 md:px-10">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#183D32] mb-4">
          {eyebrow}
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium text-[#242824] leading-[1.08] max-w-4xl">
          {title}
        </h1>
        <p className="mt-5 text-base md:text-lg text-[#242824]/75 max-w-2xl leading-relaxed">
          {description}
        </p>
      </div>
    </section>
  );
}
