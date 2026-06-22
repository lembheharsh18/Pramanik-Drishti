import { BrowserRouter, Route, Routes } from 'react-router-dom'

import Layout from './components/Layout.jsx'
import AuditLog from './pages/AuditLog.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Register from './pages/Register.jsx'
import Results from './pages/Results.jsx'
import Verify from './pages/Verify.jsx'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/results/:bundleId" element={<Results />} />
          <Route path="/audit/:bundleId" element={<AuditLog />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
