import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AppLayout } from '../layout/AppLayout';
import ProtectedRoute from '../guards/ProtectedRoute';

// Lazy load your features
const Landing = lazy(() => import('../../features/landing/pages/Landing'));
const Dashboard = lazy(() => import('../../features/dashboard/pages/Dashboard'));
const UploadDocuments = lazy(() => import('../../features/document-upload/pages/UploadDocuments'));
const Workflows = lazy(() => import('../../features/workflows/pages/Workflows'));

// Placeholder components for routes that don't have pages yet
const DocumentsPage = () => (
  <div style={{ padding: '2rem' }}>
    <h1>Documents</h1>
    <p>Documents page coming soon...</p>
  </div>
);

const AIAssistantPage = () => (
  <div style={{ padding: '2rem' }}>
    <h1>🤖 AI Assistant</h1>
    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', marginTop: '1rem' }}>
      <h3>Intelligent Document Search & Chat</h3>
      <p>This unified AI tool combines:</p>
      <ul>
        <li><strong>Smart Search:</strong> Find documents using natural language queries</li>
        <li><strong>Document Chat:</strong> Ask questions about your documents and get instant answers</li>
        <li><strong>Cross-Document Analysis:</strong> Compare and analyze multiple documents</li>
        <li><strong>Insights & Summaries:</strong> Get key information extracted automatically</li>
      </ul>
      <p><em>Coming soon...</em></p>
    </div>
  </div>
);

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
        path: 'upload',
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
        path: 'documents',
        element: (
          <ProtectedRoute>
            <DocumentsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'ai-assistant',
        element: (
          <ProtectedRoute>
            <AIAssistantPage />
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
