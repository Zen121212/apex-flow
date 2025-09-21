import React, { useState } from 'react';
import { Icon } from '../../../components/atoms/Icon/Icon';
import Button from '../../../components/atoms/Button/Button';
import type { SearchQuery, DocumentResult } from '../types/index';
import styles from './SmartSearch.module.css';

interface SmartSearchProps {
  onSearch: (query: string) => void;
  recentSearches: SearchQuery[];
  searchResults: DocumentResult[];
  isLoading?: boolean;
}

const SmartSearch: React.FC<SmartSearchProps> = ({
  onSearch,
  recentSearches,
  searchResults,
  isLoading = false
}) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleRecentSearchClick = (searchQuery: string) => {
    setQuery(searchQuery);
    onSearch(searchQuery);
  };

  return (
    <div className={styles.smartSearch}>
      <div className={styles.searchHeader}>
        <h3>AI-Powered Document Search</h3>
        <p>Ask questions in natural language to find documents with intelligent understanding</p>
        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
          Try: "highest price invoice", "recent contracts", "invoices from this month", "cheapest purchase"
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.searchForm}>
        <div className={styles.searchInputGroup}>
          <Icon name="search" className={styles.searchIcon} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about your documents... (e.g., 'What is the highest price invoice I gave?')"
            className={styles.searchInput}
            disabled={isLoading}
          />
          <Button
            type="submit"
            variant="primary"
            disabled={!query.trim() || isLoading}
            className={styles.searchButton}
          >
            {isLoading ? (
              <Icon name="loader" className={styles.spinner} />
            ) : (
              <Icon name="send" />
            )}
          </Button>
        </div>
      </form>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div className={styles.recentSearches}>
          <h4>Recent Searches</h4>
          <div className={styles.searchTags}>
            {recentSearches.slice(0, 5).map((search) => (
              <button
                key={search.id}
                className={styles.searchTag}
                onClick={() => handleRecentSearchClick(search.query)}
              >
                {search.query}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className={styles.searchResults}>
          <div className={styles.resultsHeader}>
            <h4>Search Results</h4>
            <span className={styles.resultCount}>
              {searchResults.length} document{searchResults.length !== 1 ? 's' : ''} found
            </span>
          </div>
          <div className={styles.resultsList}>
            {searchResults.map((result) => (
              <div key={result.id} className={styles.resultItem}>
                <div className={styles.resultHeader}>
                  <h5>{result.title}</h5>
                  <div className={styles.resultMeta}>
                    <span className={styles.relevanceScore}>
                      {Math.round(result.relevanceScore * 100)}% match
                    </span>
                    <span className={styles.documentType}>
                      {result.documentType}
                    </span>
                  </div>
                </div>
                <p className={styles.resultExcerpt}>{result.excerpt}</p>
                <div className={styles.resultTags}>
                  {result.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div className={styles.resultActions}>
                  <Button variant="secondary" size="small">
                    <Icon name="eye" />
                    View
                  </Button>
                  <Button variant="secondary" size="small">
                    <Icon name="message-square" />
                    Chat About This
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartSearch;
