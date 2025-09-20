// Document and Search Types
export interface DocumentResult {
  id: string;
  title: string;
  excerpt: string;
  relevanceScore: number;
  documentType: string;
  lastModified: Date;
  tags: string[];
  url?: string;
}

export interface DocumentReference {
  id: string;
  title: string;
  pageNumber?: number;
  excerpt?: string;
  url?: string;
}

export interface SearchQuery {
  id: string;
  query: string;
  timestamp: Date;
  results?: DocumentResult[];
  status: 'pending' | 'completed' | 'error';
}

// Chat Types
export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: DocumentReference[];
  sources?: DocumentReference[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  lastActivity: Date;
  documentContext?: DocumentReference[];
}

// Analysis Types
export interface AnalysisResult {
  summary: string;
  keyFindings: string[];
  metrics?: Record<string, string | number | boolean>;
  comparisons?: ComparisonResult[];
  visualizations?: VisualizationData[];
}

export interface ComparisonResult {
  aspect: string;
  documents: {
    id: string;
    title: string;
    value: string;
  }[];
  differences: string[];
  similarities: string[];
}

export interface VisualizationData {
  type: 'chart' | 'table' | 'timeline';
  title: string;
  data: Record<string, unknown>;
  description?: string;
}

export interface DocumentAnalysis {
  id: string;
  documentIds: string[];
  analysisType: 'comparison' | 'summary' | 'extraction' | 'trend';
  title: string;
  status: 'pending' | 'completed' | 'error';
  createdAt: Date;
  results?: AnalysisResult;
}

// Insights Types
export interface InsightCard {
  id: string;
  type: 'trend' | 'anomaly' | 'summary' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  sourceDocuments: DocumentReference[];
  actionable: boolean;
  timestamp: Date;
}

// Main State Type
export interface AIAssistantState {
  activeTab: 'chat' | 'analysis' | 'insights';
  searchQueries: SearchQuery[];
  chatSessions: ChatSession[];
  activeAnalyses: DocumentAnalysis[];
  insights: InsightCard[];
  isLoading: boolean;
  error?: string;
}
