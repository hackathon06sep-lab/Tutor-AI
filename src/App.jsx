import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing       from './pages/Landing';
import Onboarding    from './pages/Onboarding';
import Signin        from './pages/Signin';
import Signup        from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Chat          from './pages/Chat';
import Quiz          from './pages/Quiz';
import PDFGenerator  from './pages/PDFGenerator';
import Profile       from './pages/Profile';

function PrivateRoute({ children }) {
  const { token, initializing } = useAuth();
  if (initializing) return null;
  return token ? children : <Navigate to="/signin" replace />;
}

function PublicRoute({ children }) {
  const { token, initializing } = useAuth();
  if (initializing) return null;
  return !token ? children : <Navigate to="/chat" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"           element={<Landing />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/signin" element={<PublicRoute><Signin /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
          <Route path="/chat"   element={<PrivateRoute><Chat /></PrivateRoute>} />
          <Route path="/quiz"   element={<PrivateRoute><Quiz /></PrivateRoute>} />
          <Route path="/pdf"    element={<PrivateRoute><PDFGenerator /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="*"       element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
