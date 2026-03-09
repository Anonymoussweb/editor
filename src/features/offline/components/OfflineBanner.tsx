interface OfflineBannerProps {
  queueSize: number
}

export const OfflineBanner = ({ queueSize }: OfflineBannerProps) => (
  <div className="rounded-md border border-amber-300 bg-amber-100 px-4 py-2 text-sm text-amber-900">
    Offline Mode - changes are queued locally ({queueSize})
  </div>
)
