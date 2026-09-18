import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { RequireAuth } from './auth/RequireAuth'
import Layout from './components/Layout'
import Login from './pages/Login'
import ForwardingNote from './pages/ForwardingNote'
import DispatchPage from './pages/Dispatch'
import Dispatches from './pages/Dispatches'
import Users from './pages/Users'
import AttachLR from './pages/AttachLR'
import Customers from './pages/Customers'
import MagicAttachLR from './pages/MagicAttachLR'
import LrView from './pages/LrView'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* Public — no login */}
          <Route path="/lr-upload" element={<MagicAttachLR />} />
          <Route path="/lr-view/:token" element={<LrView />} />
          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/forwarding-note" replace />} />
              <Route path="/forwarding-note" element={<ForwardingNote />} />
              <Route path="/dispatch" element={<DispatchPage />} />
              <Route path="/dispatches" element={<Dispatches />} />
              <Route path="/attach-lr" element={<AttachLR />} />
              <Route element={<RequireAuth roles={['admin']} />}>
                <Route path="/users" element={<Users />} />
                <Route path="/customers" element={<Customers />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/forwarding-note" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
