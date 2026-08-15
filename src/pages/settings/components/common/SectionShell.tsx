function SectionShell({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-medium">{title}</h2>
      </div>
      {children && <div className="space-y-3">{children}</div>}
    </div>
  )
}

export default SectionShell
