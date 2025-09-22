import React, { useState, useEffect } from "react";
import { Icon } from "../../../components/atoms/Icon/Icon";
// import Button from '../../../components/atoms/Button/Button';
import ChatInterface from "../components/ChatInterface";
import DocumentAnalysis from "../components/DocumentAnalysis";
import InsightsSummary from "../components/InsightsSummary";
import type {
  AIAssistantState,
  ChatSession,
  ChatMessage,
  DocumentAnalysis as Analysis,
  DocumentReference,
  InsightCard,
} from "../types/index";
import { aiDocumentSearch } from "../../../services/aiDocumentSearch";

// Debug: Test if AI search service is available
console.log("🤖 AI Document Search service loaded:", aiDocumentSearch);
import styles from "./AIAssistant.module.css";

// Mock data moved outside component to avoid useEffect dependency issues
const mockInsights: InsightCard[] = [
  {
    id: "1",
    type: "trend",
    title: "Revenue Growth Acceleration",
    description:
      "Analysis shows a 23% increase in quarterly revenue with consistent month-over-month growth across all product lines.",
    confidence: 0.92,
    sourceDocuments: [{ id: "1", title: "Q2 2024 Financial Report.pdf" }],
    actionable: true,
    timestamp: new Date(),
  },
  {
    id: "2",
    type: "anomaly",
    title: "Unusual Expense Pattern",
    description:
      "Marketing expenses increased by 45% in June, significantly higher than historical patterns.",
    confidence: 0.78,
    sourceDocuments: [{ id: "1", title: "Q2 2024 Financial Report.pdf" }],
    actionable: true,
    timestamp: new Date(),
  },
  {
    id: "3",
    type: "recommendation",
    title: "Contract Renewal Optimization",
    description:
      "Consider renegotiating vendor contracts expiring in Q4 to leverage improved market position.",
    confidence: 0.85,
    sourceDocuments: [
      { id: "2", title: "Vendor Contract - TechCorp.pdf" },
      { id: "1", title: "Q2 2024 Financial Report.pdf" },
    ],
    actionable: true,
    timestamp: new Date(),
  },
];

const AIAssistant: React.FC = () => {
  const [state, setState] = useState<AIAssistantState>({
    activeTab: "chat",
    searchQueries: [],
    chatSessions: [],
    activeAnalyses: [],
    insights: [],
    isLoading: false,
  });

  // Mock data for demonstration
  const mockDocuments: DocumentReference[] = [
    { id: "1", title: "Q2 2024 Financial Report.pdf" },
    { id: "2", title: "Employee Handbook 2024.docx" },
    { id: "3", title: "Vendor Contract - TechCorp.pdf" },
    { id: "4", title: "Marketing Strategy Presentation.pptx" },
    { id: "5", title: "Legal Compliance Checklist.pdf" },
  ];

  // Mock search results removed - not used

  useEffect(() => {
    // Initialize with mock data
    setState((prev) => ({
      ...prev,
      insights: mockInsights,
    }));
  }, []);

  const handleTabChange = (tab: AIAssistantState["activeTab"]) => {
    setState((prev) => ({ ...prev, activeTab: tab }));
  };

  // handleSearch function removed - not used

  const handleSendMessage = async (message: string) => {
    // Create or update current chat session
    const currentSession = state.chatSessions[0] || {
      id: Date.now().toString(),
      title: "Document Chat",
      messages: [],
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: message,
      timestamp: new Date(),
    };

    const updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, userMessage],
      lastActivity: new Date(),
    };

    setState((prev) => ({
      ...prev,
      chatSessions: [updatedSession, ...prev.chatSessions.slice(1)],
      isLoading: true,
    }));

    try {
      console.log("🔍 Starting AI document search for:", message);

      // Use AI document search to find relevant documents
      const searchResults = await aiDocumentSearch.search(message);
      console.log("📊 Search results:", searchResults);

      let responseContent: string;
      let sources: DocumentReference[] = [];

      if (searchResults.length > 0) {
        console.log("Found results, processing...");
        const topResult = searchResults[0];

        // Generate response based on search results and query analysis
        const queryAnalysis = topResult.queryAnalysis;

        if (
          message.toLowerCase().includes("highest") &&
          (message.toLowerCase().includes("price") ||
            message.toLowerCase().includes("amount"))
        ) {
          responseContent = `I found the highest priced document: "${topResult.title}". ${topResult.excerpt}`;
        } else if (
          message.toLowerCase().includes("lowest") &&
          (message.toLowerCase().includes("price") ||
            message.toLowerCase().includes("amount"))
        ) {
          responseContent = `I found the lowest priced document: "${topResult.title}". ${topResult.excerpt}`;
        } else if (
          queryAnalysis?.intent === "count" ||
          (message.toLowerCase().includes("what") &&
            (message.toLowerCase().includes("do i have") ||
              message.toLowerCase().includes("are there")))
        ) {
          // Handle count/list queries like "what invoices do I have"
          const documentType = queryAnalysis?.entityType || "document";
          const pluralType =
            documentType === "invoice" ? "invoices" : `${documentType}s`;

          responseContent = `You have ${searchResults.length} ${pluralType} downloaded:\n\n`;

          searchResults.forEach((result, index) => {
            responseContent += `${index + 1}. **${result.title}**\n`;
            if (
              result.excerpt &&
              !result.excerpt.startsWith("Document type:")
            ) {
              // Show key info like amount if available
              const amountMatch = result.excerpt.match(/Amount: ([^.]+)/i);
              if (amountMatch) {
                responseContent += `   Amount: ${amountMatch[1]}\n`;
              }
            }
            responseContent += `   Uploaded: ${result.lastModified.toDateString()}\n\n`;
          });

          responseContent += `\nYou can ask me specific questions about these ${pluralType}, like finding the highest amount or searching for specific content.`;
        } else {
          responseContent = `I found ${searchResults.length} relevant document${searchResults.length > 1 ? "s" : ""}. The most relevant is "${topResult.title}": ${topResult.excerpt}`;
        }

        // Add sources from search results
        sources = searchResults.slice(0, 3).map((result) => ({
          id: result.id,
          title: result.title,
        }));
      } else {
        console.log("No results found");
        responseContent = `I couldn't find any documents matching your query "${message}". Try uploading some documents first or rephrasing your question.`;
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: responseContent,
        timestamp: new Date(),
        sources: sources.length > 0 ? sources : undefined,
      };

      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, aiMessage],
        lastActivity: new Date(),
      };

      setState((prev) => ({
        ...prev,
        chatSessions: [finalSession, ...prev.chatSessions.slice(1)],
        isLoading: false,
      }));
    } catch (error) {
      console.error("Chat search failed:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error("Error details:", errorMessage);
      console.error("Stack trace:", error instanceof Error ? error.stack : 'No stack trace');

      const chatErrorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: `I encountered an error while searching your documents: ${errorMessage}. Please check the browser console for details.`,
        timestamp: new Date(),
      };

      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, chatErrorMessage],
        lastActivity: new Date(),
      };

      setState((prev) => ({
        ...prev,
        chatSessions: [finalSession, ...prev.chatSessions.slice(1)],
        isLoading: false,
      }));
    }
  };

  const handleNewChatSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    setState((prev) => ({
      ...prev,
      chatSessions: [newSession, ...prev.chatSessions],
    }));
  };

  const handleStartAnalysis = (
    documentIds: string[],
    analysisType: Analysis["analysisType"],
  ) => {
    const newAnalysis: Analysis = {
      id: Date.now().toString(),
      documentIds,
      analysisType,
      title: `${analysisType.charAt(0).toUpperCase() + analysisType.slice(1)} Analysis`,
      status: "pending",
      createdAt: new Date(),
    };

    setState((prev) => ({
      ...prev,
      activeAnalyses: [newAnalysis, ...prev.activeAnalyses],
    }));

    // Simulate analysis completion
    setTimeout(() => {
      const completedAnalysis: Analysis = {
        ...newAnalysis,
        status: "completed",
        results: {
          summary: `Analysis of ${documentIds.length} documents completed successfully.`,
          keyFindings: [
            "Significant cost savings identified across multiple contracts",
            "Compliance requirements are consistently met",
            "Revenue projections align with market trends",
          ],
        },
      };

      setState((prev) => ({
        ...prev,
        activeAnalyses: prev.activeAnalyses.map((analysis) =>
          analysis.id === completedAnalysis.id ? completedAnalysis : analysis,
        ),
      }));
    }, 3000);
  };

  const handleViewAnalysis = (analysisId: string) => {
    console.log("Viewing analysis:", analysisId);
  };

  const handleRefreshInsights = () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        insights: mockInsights,
        isLoading: false,
      }));
    }, 1000);
  };

  const handleViewInsightDetails = (insightId: string) => {
    console.log("Viewing insight details:", insightId);
  };

  const handleDismissInsight = (insightId: string) => {
    setState((prev) => ({
      ...prev,
      insights: prev.insights.filter((insight) => insight.id !== insightId),
    }));
  };

  const getTabIcon = (tab: AIAssistantState["activeTab"]) => {
    switch (tab) {
      case "chat":
        return "message-square";
      case "analysis":
        return "files";
      case "insights":
        return "brain";
      default:
        return "help-circle";
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
            <span className={styles.statValue}>
              {state.searchQueries.length}
            </span>
            <span className={styles.statLabel}>Searches</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {state.chatSessions.length}
            </span>
            <span className={styles.statLabel}>Chats</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{state.insights.length}</span>
            <span className={styles.statLabel}>Insights</span>
          </div>
        </div>
      </div>

      <div className={styles.tabNavigation}>
        {(["chat", "analysis", "insights"] as const).map((tab) => (
          <button
            key={tab}
            className={`${styles.tabButton} ${state.activeTab === tab ? styles.active : ""}`}
            onClick={() => handleTabChange(tab)}
          >
            <Icon name={getTabIcon(tab)} />
            <span>
              {tab === "chat" && "Document Chat"}
              {tab === "analysis" && "Cross-Document Analysis"}
              {tab === "insights" && "Insights & Summaries"}
            </span>
          </button>
        ))}
      </div>

      <div className={styles.tabContent}>
        {state.activeTab === "chat" && (
          <ChatInterface
            currentSession={state.chatSessions[0]}
            onSendMessage={handleSendMessage}
            onNewSession={handleNewChatSession}
            isTyping={state.isLoading}
          />
        )}

        {state.activeTab === "analysis" && (
          <DocumentAnalysis
            availableDocuments={mockDocuments}
            activeAnalyses={state.activeAnalyses}
            onStartAnalysis={handleStartAnalysis}
            onViewAnalysis={handleViewAnalysis}
          />
        )}

        {state.activeTab === "insights" && (
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
