import React, { useState } from 'react';
import { Icon } from '../../../components/atoms/Icon/Icon';
import Button from '../../../components/atoms/Button/Button';
import type { InsightCard } from '../types/index';
import styles from './InsightsSummary.module.css';

interface InsightsSummaryProps {
  insights: InsightCard[];
  onRefreshInsights: () => void;
  onViewInsightDetails: (insightId: string) => void;
  onDismissInsight: (insightId: string) => void;
  isLoading?: boolean;
}

const InsightsSummary: React.FC<InsightsSummaryProps> = ({
  insights,
  onRefreshInsights,
  onViewInsightDetails,
  onDismissInsight,
  isLoading = false
}) => {
  const [filterType, setFilterType] = useState<InsightCard['type'] | 'all'>('all');

  const getInsightIcon = (type: InsightCard['type']) => {
    switch (type) {
      case 'trend': return 'trend-up';
      case 'anomaly': return 'alert-circle';
      case 'summary': return 'file-text';
      case 'recommendation': return 'lightbulb';
      default: return 'info';
    }
  };

  const getInsightColor = (type: InsightCard['type']) => {
    switch (type) {
      case 'trend': return 'info';
      case 'anomaly': return 'warning';
      case 'summary': return 'neutral';
      case 'recommendation': return 'success';
      default: return 'neutral';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  };

  const filteredInsights = filterType === 'all' 
    ? insights 
    : insights.filter(insight => insight.type === filterType);

  const formatTimestamp = (date: Date) => {
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={styles.insightsSummary}>
      <div className={styles.insightsHeader}>
        <div className={styles.headerContent}>
          <h3>AI Insights & Summaries</h3>
          <p>Automatically generated insights from your documents</p>
        </div>
        <Button
          variant="secondary"
          onClick={onRefreshInsights}
          disabled={isLoading}
          icon={<Icon name={isLoading ? "loader" : "refresh-cw"} className={isLoading ? styles.spinning : ''} />}
        >
          Refresh
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className={styles.filterTabs}>
        <button 
          className={`${styles.filterTab} ${filterType === 'all' ? styles.active : ''}`}
          onClick={() => setFilterType('all')}
        >
          All ({insights.length})
        </button>
        <button 
          className={`${styles.filterTab} ${filterType === 'trend' ? styles.active : ''}`}
          onClick={() => setFilterType('trend')}
        >
          <Icon name="trend-up" />
          Trends ({insights.filter(i => i.type === 'trend').length})
        </button>
        <button 
          className={`${styles.filterTab} ${filterType === 'anomaly' ? styles.active : ''}`}
          onClick={() => setFilterType('anomaly')}
        >
          <Icon name="alert-circle" />
          Anomalies ({insights.filter(i => i.type === 'anomaly').length})
        </button>
        <button 
          className={`${styles.filterTab} ${filterType === 'summary' ? styles.active : ''}`}
          onClick={() => setFilterType('summary')}
        >
          <Icon name="file-text" />
          Summaries ({insights.filter(i => i.type === 'summary').length})
        </button>
        <button 
          className={`${styles.filterTab} ${filterType === 'recommendation' ? styles.active : ''}`}
          onClick={() => setFilterType('recommendation')}
        >
          <Icon name="lightbulb" />
          Recommendations ({insights.filter(i => i.type === 'recommendation').length})
        </button>
      </div>

      {/* Insights List */}
      <div className={styles.insightsList}>
        {filteredInsights.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Icon name="brain" size="large" />
            </div>
            <h4>No insights available</h4>
            <p>Upload and process documents to generate AI insights</p>
            <Button variant="primary" onClick={onRefreshInsights}>
              Generate Insights
            </Button>
          </div>
        ) : (
          filteredInsights.map((insight) => (
            <div key={insight.id} className={`${styles.insightCard} ${styles[getInsightColor(insight.type)]}`}>
              <div className={styles.insightHeader}>
                <div className={styles.insightMeta}>
                  <Icon name={getInsightIcon(insight.type)} className={styles.insightIcon} />
                  <div className={styles.insightTitle}>
                    <h4>{insight.title}</h4>
                    <div className={styles.insightInfo}>
                      <span className={styles.insightType}>{insight.type}</span>
                      <span className={`${styles.confidence} ${styles[getConfidenceColor(insight.confidence)]}`}>
                        {Math.round(insight.confidence * 100)}% confidence
                      </span>
                      <span className={styles.timestamp}>
                        {formatTimestamp(insight.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={styles.insightActions}>
                  <Button 
                    variant="ghost" 
                    size="small"
                    onClick={() => onViewInsightDetails(insight.id)}
                  >
                    <Icon name="eye" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="small"
                    onClick={() => onDismissInsight(insight.id)}
                  >
                    <Icon name="x" />
                  </Button>
                </div>
              </div>
              
              <div className={styles.insightContent}>
                <p>{insight.description}</p>
                
                {insight.sourceDocuments.length > 0 && (
                  <div className={styles.sourceDocs}>
                    <div className={styles.sourceHeader}>
                      <Icon name="file" />
                      <span>Based on {insight.sourceDocuments.length} document{insight.sourceDocuments.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className={styles.sourceList}>
                      {insight.sourceDocuments.slice(0, 3).map((doc) => (
                        <span key={doc.id} className={styles.sourceTag}>
                          {doc.title}
                        </span>
                      ))}
                      {insight.sourceDocuments.length > 3 && (
                        <span className={styles.moreCount}>
                          +{insight.sourceDocuments.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {insight.actionable && (
                  <div className={styles.actionableTag}>
                    <Icon name="zap" />
                    <span>Actionable</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default InsightsSummary;
