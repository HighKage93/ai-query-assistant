export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center m-auto gap-4 select-none">
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="36" fill="#4f46e5" fillOpacity="0.08" />
        <circle cx="40" cy="40" r="26" fill="#4f46e5" fillOpacity="0.10" />
        {/* Spark / bolt */}
        <polygon
          points="44,18 32,42 40,42 36,62 54,36 44,36"
          fill="#4f46e5"
          fillOpacity="0.7"
        />
        {/* Orbit dots */}
        <circle cx="18" cy="38" r="3" fill="#818cf8" fillOpacity="0.5" />
        <circle cx="62" cy="38" r="3" fill="#818cf8" fillOpacity="0.5" />
        <circle cx="40" cy="16" r="3" fill="#818cf8" fillOpacity="0.5" />
      </svg>
      <div className="text-center">
        <p className="text-gray-400 dark:text-neutral-500 font-medium">Ask me anything</p>
        <p className="text-gray-300 dark:text-neutral-700 text-sm mt-1">
          Code, concepts, analysis — I&apos;ve got you
        </p>
      </div>
    </div>
  );
}
