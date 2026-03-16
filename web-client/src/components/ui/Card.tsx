interface CardProps {
  title: string;
  value: string;
  valueClassName?: string;
}

export default function Card({
  title,
  value,
  valueClassName = "text-gray-900",
}: CardProps) {
  return (
    <div className="rounded-2xl p-6 border border-gray-200 bg-white shadow-md hover:shadow-lg transition duration-200">
      <h3 className="text-sm text-gray-500 mb-1">{title}</h3>
      <p className={`text-3xl font-semibold tracking-tight ${valueClassName}`}>
        {value}
      </p>
    </div>
  );
}
