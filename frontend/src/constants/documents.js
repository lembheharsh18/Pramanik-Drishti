export const DOCUMENT_FIELDS = [
  {
    key: 'land_record',
    label: 'Land Ownership Record (PDF)',
  },
  {
    key: 'salary_slip_1',
    label: 'Salary Slip - Month 1 (PDF)',
  },
  {
    key: 'salary_slip_2',
    label: 'Salary Slip - Month 2 (PDF)',
  },
  {
    key: 'salary_slip_3',
    label: 'Salary Slip - Month 3 (PDF)',
  },
  {
    key: 'itr',
    label: 'Income Tax Return (PDF)',
  },
  {
    key: 'valuation_report',
    label: 'Property Valuation Report (PDF)',
  },
  {
    key: 'sale_deed',
    label: 'Sale Deed (PDF)',
  },
]

export function createEmptyFileState() {
  return DOCUMENT_FIELDS.reduce((state, field) => {
    state[field.key] = null
    return state
  }, {})
}
