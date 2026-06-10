interface BetriebBadgeProps {
  label: string
  image?: string
  imageAlt?: string
}

export default function BetriebBadge({ label, image, imageAlt }: BetriebBadgeProps) {
  return (
    <div className="flex items-center gap-2 rounded-full border-2 border-cheapr-dark bg-[#F5A200] py-1 pl-1 pr-3 text-cheapr-dark">
      {image ? (
        <img
          src={image}
          alt={imageAlt ?? label}
          className="h-6 w-6 shrink-0 rounded-full border-2 border-cheapr-dark object-cover"
        />
      ) : null}
      <span className="text-[11px] font-bold">{label}</span>
    </div>
  )
}
