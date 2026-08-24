import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { RequireAuth } from './auth/RequireAuth'
import Layout from './components/Layout'
import Login from './pages/Login'
import ForwardingNote from './pages/ForwardingNote'
import DispatchPage from './pages/Dispatch'
import Dispatches from './pages/Dispatches'
import Users from './pages/Users'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/forwarding-note" replace />} />
              <Route path="/forwarding-note" element={<ForwardingNote />} />
              <Route path="/dispatch" element={<DispatchPage />} />
              <Route path="/dispatches" element={<Dispatches />} />
              <Route element={<RequireAuth roles={['admin']} />}>
                <Route path="/users" element={<Users />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/forwarding-note" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
