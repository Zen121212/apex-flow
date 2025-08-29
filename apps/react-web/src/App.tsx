import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import Landing from './components/landing/Landing';
import Dashboard from './components/dashboard/Dashboard';
import UploadDocuments from './pages/upload-documents/UploadDocuments';
import Workflows from './pages/workflows/Workflows';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/landing" replace />} />
            
            {/* Public route */}
            <Route 
              path="/landing" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <Landing />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/upload" 
              element={
                <ProtectedRoute>
                  <UploadDocuments />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/documents" 
              element={
                <ProtectedRoute>
                  <div style={{padding: '2rem'}}>Documents page coming soon...</div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/workflows" 
              element={
                <ProtectedRoute>
                  <Workflows />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/search" 
              element={
                <ProtectedRoute>
                  <div style={{padding: '2rem'}}>Search page coming soon...</div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/chat" 
              element={
                <ProtectedRoute>
                  <div style={{padding: '2rem'}}>Chat page coming soon...</div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/integrations" 
              element={
                <ProtectedRoute>
                  <div style={{padding: '2rem'}}>Integrations page coming soon...</div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <div style={{padding: '2rem'}}>Profile page coming soon...</div>
                </ProtectedRoute>
              } 
            />
            
            {/* Catch all - redirect to landing */}
            <Route path="*" element={<Navigate to="/landing" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
