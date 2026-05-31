interface DriverTagsProps {
  drivers: string[];
}

export function DriverTags({ drivers }: DriverTagsProps) {
  if (!drivers.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {drivers.map((d) => (
        <span key={d} className="px-2 py-0.5 text-xs rounded-full bg-accent/10 text-accent border border-accent/20">
          {d}
        </span>
      ))}
    </div>
  );
}
