interface CardProps {
  title: string
  value: string
  valueClassName?: string
}

export default function Card({ title, value, valueClassName = "text-violet-50" }: CardProps) {
  return (
    <div className="rounded-2xl p-6 border border-violet-300/25 bg-[rgba(26,12,44,0.78)] backdrop-blur-md shadow-[0_14px_35px_rgba(5,0,15,0.45)] hover:shadow-[0_16px_40px_rgba(9,0,24,0.55)] transition duration-200">
      <h3 className="text-sm text-violet-200/80 mb-1">{title}</h3>
      <p className={`text-3xl font-semibold tracking-tight ${valueClassName}`}>
        {value}
      </p>
    </div>
  )
}