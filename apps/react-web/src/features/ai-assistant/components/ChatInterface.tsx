import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '../../../components/atoms/Icon/Icon';
import Button from '../../../components/atoms/Button/Button';
import type { ChatSession } from '../types/index';
import styles from './ChatInterface.module.css';

interface ChatInterfaceProps {
  currentSession?: ChatSession;
  onSendMessage: (message: string) => void;
  onNewSession: () => void;
  isTyping?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  currentSession,
  onSendMessage,
  onNewSession,
  isTyping = false
}) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={styles.chatInterface}>
      <div className={styles.chatHeader}>
        <div className={styles.sessionInfo}>
          <h3>{currentSession?.title || 'Document Chat'}</h3>
          <p>Ask questions about your documents and get instant answers</p>
        </div>
        <Button
          variant="secondary"
          onClick={onNewSession}
          icon={<Icon name="plus" />}
        >
          New Chat
        </Button>
      </div>

      <div className={styles.chatMessages}>
        {currentSession?.messages.length === 0 || !currentSession ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Icon name="message-square" size="large" />
            </div>
            <h4>Start a conversation</h4>
            <p>Ask questions about your documents or request summaries</p>
            <div className={styles.suggestedQuestions}>
              <button 
                className={styles.suggestionButton}
                onClick={() => setMessage("Summarize the key points from my recent contracts")}
              >
                "Summarize the key points from my recent contracts"
              </button>
              <button 
                className={styles.suggestionButton}
                onClick={() => setMessage("What are the payment terms in my invoices?")}
              >
                "What are the payment terms in my invoices?"
              </button>
              <button 
                className={styles.suggestionButton}
                onClick={() => setMessage("Find any compliance issues in my documents")}
              >
                "Find any compliance issues in my documents"
              </button>
            </div>
          </div>
        ) : (
          <>
            {currentSession.messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.message} ${styles[msg.type]}`}
              >
                <div className={styles.messageContent}>
                  <div className={styles.messageText}>{msg.content}</div>
                  
                  {msg.sources && msg.sources.length > 0 && (
                    <div className={styles.messageSources}>
                      <div className={styles.sourcesHeader}>
                        <Icon name="file-text" />
                        <span>Sources:</span>
                      </div>
                      <div className={styles.sourcesList}>
                        {msg.sources.map((source) => (
                          <div key={source.id} className={styles.sourceItem}>
                            <span className={styles.sourceTitle}>{source.title}</span>
                            {source.pageNumber && (
                              <span className={styles.sourcePage}>
                                Page {source.pageNumber}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className={styles.messageTime}>
                  {formatTimestamp(msg.timestamp)}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className={`${styles.message} ${styles.assistant}`}>
                <div className={styles.messageContent}>
                  <div className={styles.typingIndicator}>
                    <div className={styles.typingDots}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span>AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className={styles.chatInput}>
        <div className={styles.inputGroup}>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about your documents..."
            className={styles.messageInput}
            rows={1}
            disabled={isTyping}
          />
          <Button
            type="submit"
            variant="primary"
            disabled={!message.trim() || isTyping}
            className={styles.sendButton}
          >
            <Icon name="send" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
