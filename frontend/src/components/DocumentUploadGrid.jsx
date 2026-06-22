import { FileCheck2, UploadCloud } from 'lucide-react'

import { DOCUMENT_FIELDS } from '../constants/documents.js'

function DocumentUploadGrid({ files, onFileChange }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {DOCUMENT_FIELDS.map((field, index) => {
        const selectedFile = files[field.key]

        return (
          <label
            key={field.key}
            className={`animate-rise group scanline flex min-h-36 cursor-pointer flex-col justify-between rounded-lg border bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md ${
              selectedFile
                ? 'border-[#0F6E56] ring-1 ring-emerald-100'
                : 'border-dashed border-slate-300 hover:border-[#2D1B8E]'
            }`}
            style={{ animationDelay: `${index * 35}ms` }}
          >
            <div className="flex items-start gap-3">
              <div
                className={`rounded-lg p-2 ${
                  selectedFile ? 'bg-emerald-50 text-[#0F6E56]' : 'bg-indigo-50 text-[#2D1B8E]'
                }`}
              >
                {selectedFile ? <FileCheck2 size={23} /> : <UploadCloud size={23} />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-slate-950">{field.label}</p>
                <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                  {selectedFile ? selectedFile.name : 'Click to upload PDF'}
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    selectedFile ? 'w-full bg-[#0F6E56]' : 'w-1/3 bg-slate-300 group-hover:bg-[#2D1B8E]'
                  }`}
                />
              </div>
              <span
                className={`text-[11px] font-bold uppercase tracking-wide ${
                  selectedFile ? 'text-[#0F6E56]' : 'text-slate-400'
                }`}
              >
                {selectedFile ? 'Ready' : 'PDF'}
              </span>
            </div>
            <input
              accept="application/pdf"
              className="sr-only"
              type="file"
              onChange={(event) => onFileChange(field.key, event.target.files?.[0] || null)}
            />
          </label>
        )
      })}
    </div>
  )
}

export default DocumentUploadGrid
