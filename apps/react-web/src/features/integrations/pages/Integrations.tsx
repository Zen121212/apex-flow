import React, { useState, useCallback } from 'react';
import type { Integration, IntegrationType, TestResult, SlackFormData, EmailFormData, DatabaseFormData, WebhookFormData } from '../types/index';

type IntegrationFormData = SlackFormData | EmailFormData | DatabaseFormData | WebhookFormData;
import IntegrationCard from '../components/IntegrationCard';
import IntegrationModal from '../components/IntegrationModal';
import Button from '../../../components/atoms/Button/Button';
import { 
  useIntegrations, 
  useCreateIntegration, 
  useUpdateIntegration, 
  useDeleteIntegration, 
  useTestIntegration, 
  useToggleIntegration 
} from '../hooks/useIntegrations';
import styles from './Integrations.module.css';

const INTEGRATION_TYPES: IntegrationType[] = ['slack', 'email', 'database', 'webhook'];

const Integrations: React.FC = () => {
  // React Query hooks
  const { data: integrations = [], isLoading, error } = useIntegrations();
  const createIntegrationMutation = useCreateIntegration();
  const updateIntegrationMutation = useUpdateIntegration();
  const deleteIntegrationMutation = useDeleteIntegration();
  const testIntegrationMutation = useTestIntegration();
  const toggleIntegrationMutation = useToggleIntegration();

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: IntegrationType | null;
    integration?: Integration;
  }>({
    isOpen: false,
    type: null
  });

  const openModal = useCallback((type: IntegrationType, integration?: Integration) => {
    setModalState({
      isOpen: true,
      type,
      integration
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState({
      isOpen: false,
      type: null
    });
  }, []);

  const handleSaveIntegration = useCallback((formData: IntegrationFormData) => {
    if (modalState.integration) {
      // Update existing integration
      updateIntegrationMutation.mutate({
        id: modalState.integration.id.toString(),
        data: {
          name: formData.name,
          config: formData
        }
      });
    } else {
      // Create new integration
      if (modalState.type) {
        createIntegrationMutation.mutate({
          type: modalState.type,
          name: formData.name,
          description: formData.description || getDefaultDescription(modalState.type),
          config: formData
        });
      }
    }
    closeModal();
  }, [modalState, createIntegrationMutation, updateIntegrationMutation, closeModal]);

  const handleTestIntegration = useCallback(async (integration: Integration): Promise<TestResult> => {
    return new Promise((resolve, reject) => {
      testIntegrationMutation.mutate(integration.id.toString(), {
        onSuccess: (result) => resolve(result),
        onError: (error) => reject(error)
      });
    });
  }, [testIntegrationMutation]);

  const handleToggleIntegration = useCallback((integration: Integration) => {
    toggleIntegrationMutation.mutate(integration.id.toString());
  }, [toggleIntegrationMutation]);

  const handleDeleteIntegration = useCallback((integration: Integration) => {
    deleteIntegrationMutation.mutate(integration.id.toString());
  }, [deleteIntegrationMutation]);

  const getDefaultDescription = (type: IntegrationType): string => {
    switch (type) {
      case 'slack':
        return 'Send notifications and updates to Slack channels';
      case 'email':
        return 'Send email notifications and approval requests';
      case 'database':
        return 'Store extracted data in your database';
      case 'webhook':
        return 'Send data to external APIs and services';
      default:
        return '';
    }
  };

  const getIntegrationByType = (type: IntegrationType): Integration | undefined => {
    return integrations.find(int => int.type === type);
  };

  const connectedCount = integrations.filter(int => int.status === 'connected' && int.enabled).length;
  const totalCount = integrations.length;

  // Handle loading state
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>🔌 Integrations</h1>
            <p className={styles.subtitle}>Loading your integrations...</p>
          </div>
        </div>
        <div className={styles.content}>
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading integrations...</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>🔌 Integrations</h1>
            <p className={styles.subtitle}>Unable to load integrations</p>
          </div>
        </div>
        <div className={styles.content}>
          <div className={styles.errorState}>
            <div className={styles.errorIcon}>⚠️</div>
            <h3>Failed to load integrations</h3>
            <p>{error instanceof Error ? error.message : 'Something went wrong'}</p>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>🔌 Integrations</h1>
          <p className={styles.subtitle}>
            Connect ApexFlow with your existing tools and services to automate your document processing workflows.
          </p>
          <div className={styles.stats}>
            <span className={styles.stat}>
              <strong>{connectedCount}</strong> of <strong>{totalCount}</strong> integrations active
            </span>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Available Integrations</h2>
          <div className={styles.grid}>
            {INTEGRATION_TYPES.map(type => {
              const integration = getIntegrationByType(type);
              return (
                <IntegrationCard
                  key={type}
                  type={type}
                  integration={integration}
                  onConfigure={openModal}
                  onTest={handleTestIntegration}
                  onToggle={handleToggleIntegration}
                  onDelete={handleDeleteIntegration}
                />
              );
            })}
          </div>
        </div>

        {integrations.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Integration Overview</h2>
              <div className={styles.legend}>
                <div className={styles.legendItem}>
                  <div className={`${styles.dot} ${styles.connected}`}></div>
                  <span>Connected</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={`${styles.dot} ${styles.disconnected}`}></div>
                  <span>Not Connected</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={`${styles.dot} ${styles.error}`}></div>
                  <span>Error</span>
                </div>
              </div>
            </div>

            <div className={styles.overview}>
              {integrations.map(integration => (
                <div key={integration.id} className={styles.overviewCard}>
                  <div className={styles.overviewHeader}>
                    <div className={`${styles.statusDot} ${styles[integration.status]}`}></div>
                    <h3 className={styles.overviewTitle}>{integration.name}</h3>
                    <span className={`${styles.badge} ${integration.enabled ? styles.enabled : styles.disabled}`}>
                      {integration.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <p className={styles.overviewDescription}>{integration.description}</p>
                  <div className={styles.overviewMeta}>
                    <span>Last updated: {new Date(integration.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Getting Started</h2>
          <div className={styles.helpGrid}>
            <div className={styles.helpCard}>
              <div className={styles.helpIcon}>📋</div>
              <h3>Setup Guide</h3>
              <p>Follow our step-by-step guides to configure each integration type and start automating your workflows.</p>
              <Button variant="ghost" size="small">
                View Guides
              </Button>
            </div>
            <div className={styles.helpCard}>
              <div className={styles.helpIcon}>🔧</div>
              <h3>Troubleshooting</h3>
              <p>Having issues with your integrations? Check our troubleshooting guide for common solutions.</p>
              <Button variant="ghost" size="small">
                Get Help
              </Button>
            </div>
            <div className={styles.helpCard}>
              <div className={styles.helpIcon}>🚀</div>
              <h3>Best Practices</h3>
              <p>Learn how to optimize your integrations for better performance and reliability.</p>
              <Button variant="ghost" size="small">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {modalState.isOpen && modalState.type && (
        <IntegrationModal
          isOpen={modalState.isOpen}
          type={modalState.type}
          integration={modalState.integration}
          onClose={closeModal}
          onSave={handleSaveIntegration}
        />
      )}
    </div>
  );
};

export default Integrations;
