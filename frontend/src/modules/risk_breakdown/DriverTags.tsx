interface DriverTagsProps {
  drivers: string[];
}

export function DriverTags({ drivers }: DriverTagsProps) {
  if (!drivers.length) return null;
  return (
    <div className="driver-tags">
      {drivers.map((d) => (
        <span key={d} className="driver-tag">{d}</span>
      ))}
    </div>
  );
}
