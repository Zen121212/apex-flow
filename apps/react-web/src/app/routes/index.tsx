import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AppLayout } from '../layout/AppLayout';
import ProtectedRoute from '../guards/ProtectedRoute';

// Lazy load your features
const Landing = lazy(() => import('../../features/landing/pages/Landing'));
const Dashboard = lazy(() => import('../../features/dashboard/pages/Dashboard'));
const UploadDocuments = lazy(() => import('../../features/document-upload/pages/UploadDocuments'));
const Workflows = lazy(() => import('../../features/workflows/pages/Workflows'));
const AIAssistant = lazy(() => import('../../features/ai-assistant/pages/AIAssistant'));

// Placeholder components for routes that don't have pages yet

const IntegrationsPage = lazy(() => import('../../features/integrations/pages/Integrations'));

const ProfilePage = () => (
  <div style={{ padding: '2rem' }}>
    <h1>Profile</h1>
    <p>Profile page coming soon...</p>
  </div>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute requireAuth={false}>
            <Suspense fallback={<div>Loading...</div>}>
              <Landing />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'landing',
        element: (
          <ProtectedRoute requireAuth={false}>
            <Suspense fallback={<div>Loading...</div>}>
              <Landing />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<div>Loading...</div>}>
              <Dashboard />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'documents',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<div>Loading...</div>}>
              <UploadDocuments />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'workflows',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<div>Loading...</div>}>
              <Workflows />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        // Redirect old /upload route to /documents
        path: 'upload',
        element: <Navigate to="/documents" replace />,
      },
      {
        // Redirect /home route to landing page
        path: 'home',
        element: <Navigate to="/landing" replace />,
      },
      {
        path: 'ai-assistant',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<div>Loading...</div>}>
              <AIAssistant />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'integrations',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<div>Loading...</div>}>
              <IntegrationsPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

export const AppRouter = () => <RouterProvider router={router} />;
export default AppRouter;
