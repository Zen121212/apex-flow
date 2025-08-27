import { Component, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { LandingNavbarComponent } from '../landing-navbar/landing-navbar.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, CommonModule, LandingNavbarComponent],
  styleUrls: ['./landing.component.css'],
  template: `
    <app-landing-navbar></app-landing-navbar>
    <div class="hero-section" id="home">
      <div class="hero-content">
        <h1 class="hero-title">ApexFlow</h1>
        <p class="hero-subtitle">
          Transform your document workflows with AI-powered automation
        </p>
        <p class="hero-description">
          Save 80% of manual processing time with intelligent document extraction, 
          approval workflows, and seamless integrations.
        </p>
        <div class="hero-actions">
          <ng-container *ngIf="!authService.isAuthenticated()">
            <button class="btn btn-primary" (click)="openAuthModal()">
              Get Started
            </button>
            <button class="btn btn-secondary" (click)="openAuthModal()">
              Sign In
            </button>
          </ng-container>
          <ng-container *ngIf="authService.isAuthenticated()">
            <button class="btn btn-primary" routerLink="/dashboard">
              Go to Dashboard
            </button>
            <button class="btn btn-secondary" routerLink="/upload">
              Upload Document
            </button>
          </ng-container>
        </div>
      </div>
    </div>

    <!-- Business Value Section -->
    <div class="value-section" id="why-choose">
      <div class="container">
        <h2>Why Choose ApexFlow?</h2>
        <div class="value-grid">
          <div class="value-card">
            <div class="value-number">80%</div>
            <h3>Time Savings</h3>
            <p>Reduce manual document processing time from hours to minutes</p>
          </div>
          <div class="value-card">
            <div class="value-number">99.2%</div>
            <h3>Accuracy Rate</h3>
            <p>AI-powered extraction with human-level precision</p>
          </div>
          <div class="value-card">
            <div class="value-number">$50K+</div>
            <h3>Annual Savings</h3>
            <p>Typical customer saves over $50,000 in labor costs per year</p>
          </div>
        </div>
      </div>
    </div>

    <!-- AI Solutions Section -->
    <div class="solutions-section" id="solutions">
      <div class="container">
        <h2>AI-Powered Document Solutions</h2>
        <p class="section-subtitle">
          Enterprise-grade document intelligence that scales with your business
        </p>
        <div class="solutions-grid">
          <div class="solution-card">
            <div class="solution-icon">🤖</div>
            <h3>AI Data Extraction</h3>
            <p>Automatically extract structured data from any document type - invoices, contracts, forms, and more</p>
            <div class="solution-features">
              <span class="feature-tag">OCR Processing</span>
              <span class="feature-tag">Data Validation</span>
              <span class="feature-tag">Multi-format Support</span>
            </div>
          </div>
          <div class="solution-card">
            <div class="solution-icon">✓</div>
            <h3>Approval Workflows</h3>
            <p>Set up intelligent approval processes with Slack and email notifications for seamless collaboration</p>
            <div class="solution-features">
              <span class="feature-tag">Slack Integration</span>
              <span class="feature-tag">Email Approvals</span>
              <span class="feature-tag">Custom Rules</span>
            </div>
          </div>
          <div class="solution-card">
            <div class="solution-icon">🔍</div>
            <h3>Semantic Search</h3>
            <p>Find documents instantly using AI-powered vector search that understands context and meaning</p>
            <div class="solution-features">
              <span class="feature-tag">Vector Search</span>
              <span class="feature-tag">Natural Language</span>
              <span class="feature-tag">Smart Filters</span>
            </div>
          </div>
          <div class="solution-card">
            <div class="solution-icon">📊</div>
            <h3>Document Intelligence</h3>
            <p>Extract insights and analyze document contents with advanced AI models and custom business rules</p>
            <div class="solution-features">
              <span class="feature-tag">Content Analysis</span>
              <span class="feature-tag">Pattern Recognition</span>
              <span class="feature-tag">Compliance Checks</span>
            </div>
          </div>
          <div class="solution-card">
            <div class="solution-icon">🔄</div>
            <h3>Webhook Integrations</h3>
            <p>Connect seamlessly to your existing systems via APIs and real-time webhooks</p>
            <div class="solution-features">
              <span class="feature-tag">REST APIs</span>
              <span class="feature-tag">Real-time Events</span>
              <span class="feature-tag">Custom Endpoints</span>
            </div>
          </div>
          <div class="solution-card">
            <div class="solution-icon">💬</div>
            <h3>Document Chat</h3>
            <p>Ask questions about your documents using natural language and get instant AI-powered answers</p>
            <div class="solution-features">
              <span class="feature-tag">Natural Language</span>
              <span class="feature-tag">Context Aware</span>
              <span class="feature-tag">Multi-document</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Use Cases Section -->
    <div class="use-cases-section" id="industries">
      <div class="container">
        <h2>Built for Every Industry</h2>
        <div class="use-cases-grid">
          <div class="use-case-card">
            <div class="use-case-icon">🏢</div>
            <h3>Legal Firms</h3>
            <p>Contract analysis, compliance checking, and document review workflows</p>
            <div class="use-case-stat">Save 15+ hours per contract</div>
          </div>
          <div class="use-case-card">
            <div class="use-case-icon">🏥</div>
            <h3>Healthcare</h3>
            <p>Medical claims processing, patient record management, and compliance documentation</p>
            <div class="use-case-stat">99.5% accuracy rate</div>
          </div>
          <div class="use-case-card">
            <div class="use-case-icon">💼</div>
            <h3>Finance & Accounting</h3>
            <p>Invoice processing, expense management, and financial document automation</p>
            <div class="use-case-stat">Process 10x more invoices</div>
          </div>
          <div class="use-case-card">
            <div class="use-case-icon">🏡</div>
            <h3>Real Estate</h3>
            <p>Property document processing, lease management, and closing document automation</p>
            <div class="use-case-stat">Reduce processing time by 90%</div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LandingComponent {
  private authModalVisible = signal(false);

  constructor(public authService: AuthService, private router: Router) {}

  showAuthModal = this.authModalVisible.asReadonly();

  openAuthModal(): void {
    this.authModalVisible.set(true);
  }

  closeAuthModal(): void {
    this.authModalVisible.set(false);
  }

  onAuthenticated(): void {
    console.log('User authenticated successfully from landing page');
    this.router.navigate(['/dashboard']);
  }
}
