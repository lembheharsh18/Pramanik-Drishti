import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
})

const multipartHeaders = {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
}

export function registerBundle(formData) {
  return apiClient.post('/issuance/register-bundle', formData, multipartHeaders)
}

export function verifyBundle(formData) {
  return apiClient.post('/verify/bundle', formData, multipartHeaders)
}

export function verifyBundleZip(formData) {
  return apiClient.post('/verify/bundle-zip', formData, multipartHeaders)
}

export function getAuditLog(bundleId) {
  return apiClient.get(`/verify/audit-log/${bundleId}`)
}

export function runCleanDemo() {
  return apiClient.post('/demo/run-clean')
}

export function runFraudDemo() {
  return apiClient.post('/demo/run-fraud')
}

export default apiClient
