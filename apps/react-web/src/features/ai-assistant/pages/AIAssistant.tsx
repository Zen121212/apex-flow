import React, { useState, useEffect } from 'react';
import { Icon } from '../../../components/atoms/Icon/Icon';
// import Button from '../../../components/atoms/Button/Button';
import SmartSearch from '../components/SmartSearch';
import ChatInterface from '../components/ChatInterface';
import DocumentAnalysis from '../components/DocumentAnalysis';
import InsightsSummary from '../components/InsightsSummary';
import type { 
  AIAssistantState, 
  SearchQuery, 
  DocumentResult, 
  ChatSession, 
  ChatMessage, 
  DocumentAnalysis as Analysis, 
  DocumentReference,
  InsightCard 
} from '../types/index';
import styles from './AIAssistant.module.css';

const AIAssistant: React.FC = () => {
  const [state, setState] = useState<AIAssistantState>({
    activeTab: 'search',
    searchQueries: [],
    chatSessions: [],
    activeAnalyses: [],
    insights: [],
    isLoading: false
  });

  // Mock data for demonstration
  const mockDocuments: DocumentReference[] = [
    { id: '1', title: 'Q2 2024 Financial Report.pdf' },
    { id: '2', title: 'Employee Handbook 2024.docx' },
    { id: '3', title: 'Vendor Contract - TechCorp.pdf' },
    { id: '4', title: 'Marketing Strategy Presentation.pptx' },
    { id: '5', title: 'Legal Compliance Checklist.pdf' }
  ];

  const mockSearchResults: DocumentResult[] = [
    {
      id: '1',
      title: 'Q2 2024 Financial Report',
      excerpt: 'Revenue increased by 23% compared to Q1 2024, with significant growth in subscription services...',
      relevanceScore: 0.95,
      documentType: 'PDF',
      lastModified: new Date('2024-07-15'),
      tags: ['financial', 'quarterly', 'revenue']
    },
    {
      id: '2',
      title: 'Vendor Contract - TechCorp',
      excerpt: 'Service level agreement stipulates 99.9% uptime with penalties for non-compliance...',
      relevanceScore: 0.87,
      documentType: 'PDF',
      lastModified: new Date('2024-06-10'),
      tags: ['contract', 'vendor', 'sla']
    }
  ];

  const mockInsights: InsightCard[] = [
    {
      id: '1',
      type: 'trend',
      title: 'Revenue Growth Acceleration',
      description: 'Analysis shows a 23% increase in quarterly revenue with consistent month-over-month growth across all product lines.',
      confidence: 0.92,
      sourceDocuments: [{ id: '1', title: 'Q2 2024 Financial Report.pdf' }],
      actionable: true,
      timestamp: new Date()
    },
    {
      id: '2',
      type: 'anomaly',
      title: 'Unusual Expense Pattern',
      description: 'Marketing expenses increased by 45% in June, significantly higher than historical patterns.',
      confidence: 0.78,
      sourceDocuments: [{ id: '1', title: 'Q2 2024 Financial Report.pdf' }],
      actionable: true,
      timestamp: new Date()
    },
    {
      id: '3',
      type: 'recommendation',
      title: 'Contract Renewal Optimization',
      description: 'Consider renegotiating vendor contracts expiring in Q4 to leverage improved market position.',
      confidence: 0.85,
      sourceDocuments: [
        { id: '2', title: 'Vendor Contract - TechCorp.pdf' },
        { id: '1', title: 'Q2 2024 Financial Report.pdf' }
      ],
      actionable: true,
      timestamp: new Date()
    }
  ];

  useEffect(() => {
    // Initialize with mock data
    setState(prev => ({
      ...prev,
      insights: mockInsights
    }));
  }, []);

  const handleTabChange = (tab: AIAssistantState['activeTab']) => {
    setState(prev => ({ ...prev, activeTab: tab }));
  };

  const handleSearch = (query: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    // Simulate API call
    setTimeout(() => {
      const newQuery: SearchQuery = {
        id: Date.now().toString(),
        query,
        timestamp: new Date(),
        results: mockSearchResults,
        status: 'completed'
      };
      
      setState(prev => ({
        ...prev,
        searchQueries: [newQuery, ...prev.searchQueries],
        isLoading: false
      }));
    }, 1500);
  };

  const handleSendMessage = (message: string) => {
    // Create or update current chat session
    const currentSession = state.chatSessions[0] || {
      id: Date.now().toString(),
      title: 'Document Chat',
      messages: [],
      createdAt: new Date(),
      lastActivity: new Date()
    };

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    const updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, userMessage],
      lastActivity: new Date()
    };

    setState(prev => ({
      ...prev,
      chatSessions: [updatedSession, ...prev.chatSessions.slice(1)],
      isLoading: true
    }));

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Based on your documents, I can see that ${message.toLowerCase().includes('revenue') ? 'revenue has shown strong growth in Q2 2024 with a 23% increase compared to the previous quarter' : 'the information you\'re looking for can be found in your uploaded documents'}. Would you like me to analyze specific aspects in more detail?`,
        timestamp: new Date(),
        sources: message.toLowerCase().includes('revenue') ? [
          { id: '1', title: 'Q2 2024 Financial Report.pdf', pageNumber: 3 }
        ] : undefined
      };

      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, aiMessage],
        lastActivity: new Date()
      };

      setState(prev => ({
        ...prev,
        chatSessions: [finalSession, ...prev.chatSessions.slice(1)],
        isLoading: false
      }));
    }, 2000);
  };

  const handleNewChatSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      lastActivity: new Date()
    };
    
    setState(prev => ({
      ...prev,
      chatSessions: [newSession, ...prev.chatSessions]
    }));
  };

  const handleStartAnalysis = (documentIds: string[], analysisType: Analysis['analysisType']) => {
    const newAnalysis: Analysis = {
      id: Date.now().toString(),
      documentIds,
      analysisType,
      title: `${analysisType.charAt(0).toUpperCase() + analysisType.slice(1)} Analysis`,
      status: 'pending',
      createdAt: new Date()
    };

    setState(prev => ({
      ...prev,
      activeAnalyses: [newAnalysis, ...prev.activeAnalyses]
    }));

    // Simulate analysis completion
    setTimeout(() => {
      const completedAnalysis: Analysis = {
        ...newAnalysis,
        status: 'completed',
        results: {
          summary: `Analysis of ${documentIds.length} documents completed successfully.`,
          keyFindings: [
            'Significant cost savings identified across multiple contracts',
            'Compliance requirements are consistently met',
            'Revenue projections align with market trends'
          ]
        }
      };

      setState(prev => ({
        ...prev,
        activeAnalyses: prev.activeAnalyses.map(analysis =>
          analysis.id === completedAnalysis.id ? completedAnalysis : analysis
        )
      }));
    }, 3000);
  };

  const handleViewAnalysis = (analysisId: string) => {
    console.log('Viewing analysis:', analysisId);
  };

  const handleRefreshInsights = () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        insights: mockInsights,
        isLoading: false
      }));
    }, 1000);
  };

  const handleViewInsightDetails = (insightId: string) => {
    console.log('Viewing insight details:', insightId);
  };

  const handleDismissInsight = (insightId: string) => {
    setState(prev => ({
      ...prev,
      insights: prev.insights.filter(insight => insight.id !== insightId)
    }));
  };

  const getTabIcon = (tab: AIAssistantState['activeTab']) => {
    switch (tab) {
      case 'search': return 'search';
      case 'chat': return 'message-square';
      case 'analysis': return 'files';
      case 'insights': return 'brain';
      default: return 'help-circle';
    }
  };

  return (
    <div className={styles.aiAssistant}>
      <div className={styles.assistantHeader}>
        <div className={styles.headerContent}>
          <h1>
            <Icon name="brain" />
            AI Assistant
          </h1>
          <p>Intelligent Document Search & Chat powered by AI</p>
        </div>
        <div className={styles.headerStats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{state.searchQueries.length}</span>
            <span className={styles.statLabel}>Searches</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{state.chatSessions.length}</span>
            <span className={styles.statLabel}>Chats</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{state.insights.length}</span>
            <span className={styles.statLabel}>Insights</span>
          </div>
        </div>
      </div>

      <div className={styles.tabNavigation}>
        {(['search', 'chat', 'analysis', 'insights'] as const).map((tab) => (
          <button
            key={tab}
            className={`${styles.tabButton} ${state.activeTab === tab ? styles.active : ''}`}
            onClick={() => handleTabChange(tab)}
          >
            <Icon name={getTabIcon(tab)} />
            <span>
              {tab === 'search' && 'Smart Search'}
              {tab === 'chat' && 'Document Chat'}
              {tab === 'analysis' && 'Cross-Document Analysis'}
              {tab === 'insights' && 'Insights & Summaries'}
            </span>
          </button>
        ))}
      </div>

      <div className={styles.tabContent}>
        {state.activeTab === 'search' && (
          <SmartSearch
            onSearch={handleSearch}
            recentSearches={state.searchQueries}
            searchResults={state.searchQueries[0]?.results || []}
            isLoading={state.isLoading}
          />
        )}

        {state.activeTab === 'chat' && (
          <ChatInterface
            currentSession={state.chatSessions[0]}
            onSendMessage={handleSendMessage}
            onNewSession={handleNewChatSession}
            isTyping={state.isLoading}
          />
        )}

        {state.activeTab === 'analysis' && (
          <DocumentAnalysis
            availableDocuments={mockDocuments}
            activeAnalyses={state.activeAnalyses}
            onStartAnalysis={handleStartAnalysis}
            onViewAnalysis={handleViewAnalysis}
          />
        )}

        {state.activeTab === 'insights' && (
          <InsightsSummary
            insights={state.insights}
            onRefreshInsights={handleRefreshInsights}
            onViewInsightDetails={handleViewInsightDetails}
            onDismissInsight={handleDismissInsight}
            isLoading={state.isLoading}
          />
        )}
      </div>
    </div>
  );
};

export default AIAssistant;
