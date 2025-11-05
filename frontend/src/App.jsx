import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Marketplace from './pages/Marketplace.jsx';
import Requests from './pages/Requests.jsx';

function Protected({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function Nav() {
  const { token, logout } = useAuth();
  return (
    <nav className="bg-white shadow p-4 flex gap-4 items-center">
      <Link to="/" className="font-semibold">SlotSwapper</Link>
      {token && (
        <>
          <Link to="/">Dashboard</Link>
          <Link to="/marketplace">Marketplace</Link>
          <Link to="/requests">Requests</Link>
          <button onClick={logout} className="ml-auto bg-gray-800 text-white px-3 py-1 rounded">Logout</button>
        </>
      )}
      {!token && (
        <div className="ml-auto flex gap-2">
          <Link to="/login" className="px-3 py-1 rounded bg-gray-800 text-white">Login</Link>
          <Link to="/signup" className="px-3 py-1 rounded bg-gray-200">Sign up</Link>
        </div>
      )}
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen">
        <Nav />
        <div className="max-w-4xl mx-auto p-4">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<Protected><Dashboard /></Protected>} />
            <Route path="/marketplace" element={<Protected><Marketplace /></Protected>} />
            <Route path="/requests" element={<Protected><Requests /></Protected>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </AuthProvider>
  );
}


