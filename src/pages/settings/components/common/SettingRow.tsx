function SettingRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-4 py-3">
      <span className="text-sm">{label}</span>
      <span className="text-sm text-muted-foreground">{value}</span>
    </div>
  )
}

export default SettingRow
