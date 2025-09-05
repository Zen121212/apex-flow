import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';
import { Card } from '../../../components/molecules/Card/Card';
import { Button } from '../../../components/atoms/Button/Button';
import { Icon } from '../../../components/atoms/Icon/Icon';
import AuthModal from '../../auth/components/AuthModal';
import LandingNavbar from '../components/LandingNavbar';
import './Landing.css';

const Landing: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleAuthClick = () => {
    setShowAuthModal(true);
  };

  const handleCloseAuthModal = () => {
    setShowAuthModal(false);
  };

  const handleAuthenticated = () => {
    console.log('User authenticated successfully from landing page');
    setShowAuthModal(false);
    navigate('/dashboard');
  };

  return (
    <>
      <LandingNavbar onAuthClick={handleAuthClick} />
      
      <div className="hero-section" id="home">
        <div className="hero-content">
          <h1 className="hero-title">ApexFlow</h1>
          <p className="hero-subtitle">
            Transform your document workflows with AI-powered automation
          </p>
          <p className="hero-description">
            Save 80% of manual processing time with intelligent document extraction,
            approval workflows, and seamless integrations.
          </p>
          <div className="hero-actions">
            {!isAuthenticated ? (
              <>
                <Button variant="primary" onClick={handleAuthClick}>
                  Get Started
                </Button>
                <Button variant="secondary" onClick={handleAuthClick}>
                  Sign In
                </Button>
              </>
            ) : (
              <>
                <Button variant="primary" onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </Button>
                <Button variant="secondary" onClick={() => navigate('/upload')}>
                  Upload Document
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Business Value Section */}
      <div className="value-section" id="why-choose">
        <div className="container">
          <h2>Why Choose ApexFlow?</h2>
          <div className="value-grid">
            <Card variant="value">
              <div className="value-number">80%</div>
              <h3>Time Savings</h3>
              <p>Reduce manual document processing time from hours to minutes</p>
            </Card>
            <Card variant="value">
              <div className="value-number">99.2%</div>
              <h3>Accuracy Rate</h3>
              <p>AI-powered extraction with human-level precision</p>
            </Card>
            <Card variant="value">
              <div className="value-number">$50K+</div>
              <h3>Annual Savings</h3>
              <p>Typical customer saves over $50,000 in labor costs per year</p>
            </Card>
          </div>
        </div>
      </div>

      {/* AI Solutions Section */}
      <div className="solutions-section" id="solutions">
        <div className="container">
          <h2>AI-Powered Document Solutions</h2>
          <p className="section-subtitle">
            Enterprise-grade document intelligence that scales with your business
          </p>
          <div className="solutions-grid">
            <Card variant="solution">
              <div className="solution-icon"><Icon name="robot" size="large" /></div>
              <h3>AI Data Extraction</h3>
              <p>Automatically extract structured data from any document type - invoices, contracts, forms, and more</p>
              <div className="solution-features">
                <span className="feature-tag">OCR Processing</span>
                <span className="feature-tag">Data Validation</span>
                <span className="feature-tag">Multi-format Support</span>
              </div>
            </Card>
            <Card variant="solution">
              <div className="solution-icon"><Icon name="check" size="large" /></div>
              <h3>Approval Workflows</h3>
              <p>Set up intelligent approval processes with Slack and email notifications for seamless collaboration</p>
              <div className="solution-features">
                <span className="feature-tag">Slack Integration</span>
                <span className="feature-tag">Email Approvals</span>
                <span className="feature-tag">Custom Rules</span>
              </div>
            </Card>
            <Card variant="solution">
              <div className="solution-icon"><Icon name="search" size="large" /></div>
              <h3>Semantic Search</h3>
              <p>Find documents instantly using AI-powered vector search that understands context and meaning</p>
              <div className="solution-features">
                <span className="feature-tag">Vector Search</span>
                <span className="feature-tag">Natural Language</span>
                <span className="feature-tag">Smart Filters</span>
              </div>
            </Card>
            <Card variant="solution">
              <div className="solution-icon"><Icon name="dashboard" size="large" /></div>
              <h3>Document Intelligence</h3>
              <p>Extract insights and analyze document contents with advanced AI models and custom business rules</p>
              <div className="solution-features">
                <span className="feature-tag">Content Analysis</span>
                <span className="feature-tag">Pattern Recognition</span>
                <span className="feature-tag">Compliance Checks</span>
              </div>
            </Card>
            <Card variant="solution">
              <div className="solution-icon"><Icon name="workflow" size="large" /></div>
              <h3>Webhook Integrations</h3>
              <p>Connect seamlessly to your existing systems via APIs and real-time webhooks</p>
              <div className="solution-features">
                <span className="feature-tag">REST APIs</span>
                <span className="feature-tag">Real-time Events</span>
                <span className="feature-tag">Custom Endpoints</span>
              </div>
            </Card>
            <Card variant="solution">
              <div className="solution-icon"><Icon name="chat" size="large" /></div>
              <h3>Document Chat</h3>
              <p>Ask questions about your documents using natural language and get instant AI-powered answers</p>
              <div className="solution-features">
                <span className="feature-tag">Natural Language</span>
                <span className="feature-tag">Context Aware</span>
                <span className="feature-tag">Multi-document</span>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Use Cases Section */}
      <div className="use-cases-section" id="industries">
        <div className="container">
          <h2>Built for Every Industry</h2>
          <div className="use-cases-grid">
            <Card variant="use-case">
              <div className="use-case-icon"><Icon name="legal" size="large" /></div>
              <h3>Legal Firms</h3>
              <p>Contract analysis, compliance checking, and document review workflows</p>
              <div className="use-case-stat">Save 15+ hours per contract</div>
            </Card>
            <Card variant="use-case">
              <div className="use-case-icon"><Icon name="healthcare" size="large" /></div>
              <h3>Healthcare</h3>
              <p>Medical claims processing, patient record management, and compliance documentation</p>
              <div className="use-case-stat">99.5% accuracy rate</div>
            </Card>
            <Card variant="use-case">
              <div className="use-case-icon"><Icon name="finance" size="large" /></div>
              <h3>Finance & Accounting</h3>
              <p>Invoice processing, expense management, and financial document automation</p>
              <div className="use-case-stat">Process 10x more invoices</div>
            </Card>
            <Card variant="use-case">
              <div className="use-case-icon"><Icon name="realestate" size="large" /></div>
              <h3>Real Estate</h3>
              <p>Property document processing, lease management, and closing document automation</p>
              <div className="use-case-stat">Reduce processing time by 90%</div>
            </Card>
          </div>
        </div>
      </div>

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={handleCloseAuthModal}
          onAuthenticated={handleAuthenticated}
        />
      )}
    </>
  );
};

export default Landing;
