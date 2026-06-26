import { FileCheck2, UploadCloud } from 'lucide-react'

import { DOCUMENT_FIELDS } from '../constants/documents.js'

function DocumentUploadGrid({ fields = DOCUMENT_FIELDS, files, onFileChange }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {fields.map((field, index) => {
        const fieldKey = field.key || field.id
        const selectedFile = files[fieldKey]

        return (
          <label
            key={fieldKey}
            className={`group flex min-h-36 cursor-pointer flex-col justify-between rounded-xl border p-4 transition-all duration-300 hover:-translate-y-0.5 ${
              selectedFile
                ? 'border-accent-emerald/30 bg-accent-emerald/5 shadow-glow-emerald'
                : 'glass-card border-dashed border-white/[0.08] hover:border-primary/40 hover:bg-white/[0.06] hover:shadow-glow-primary'
            }`}
            style={{ animationDelay: `${index * 35}ms` }}
          >
            <div className="flex items-start gap-3">
              <div
                className={`rounded-lg p-2.5 ${
                  selectedFile
                    ? 'bg-accent-emerald/15 text-accent-emerald'
                    : 'bg-primary/10 text-primary-light'
                }`}
              >
                {selectedFile ? <FileCheck2 size={23} /> : <UploadCloud size={23} />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink">{field.label}</p>
                <p className="mt-1 truncate text-xs font-medium text-ink-muted">
                  {selectedFile ? selectedFile.name : field.description || 'Click to upload PDF'}
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-300">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    selectedFile
                      ? 'w-full bg-gradient-to-r from-accent-emerald to-accent-emerald-dark'
                      : 'w-1/3 bg-surface-400 group-hover:bg-primary group-hover:w-1/2'
                  }`}
                />
              </div>
              <span
                className={`text-[11px] font-bold uppercase tracking-wide ${
                  selectedFile ? 'text-accent-emerald' : 'text-ink-faint'
                }`}
              >
                {selectedFile ? 'Ready' : 'PDF'}
              </span>
            </div>
            <input
              accept="application/pdf"
              className="sr-only"
              type="file"
              onChange={(event) => onFileChange(fieldKey, event.target.files?.[0] || null)}
            />
          </label>
        )
      })}
    </div>
  )
}

export default DocumentUploadGrid
