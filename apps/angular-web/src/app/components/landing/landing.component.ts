import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">ApexFlow</h1>
        <p class="hero-subtitle">
          AI-powered document processing platform with workflow automation
        </p>
        <div class="hero-actions">
          <button class="btn btn-primary" routerLink="/dashboard">
            Get Started
          </button>
          <button class="btn btn-secondary" routerLink="/upload">
            Upload Document
          </button>
        </div>
      </div>
    </div>

    <div class="features-section">
      <div class="container">
        <h2>Key Features</h2>
        <div class="features-grid">
          <div class="feature-card">
            <h3>🔍 Intelligent Search</h3>
            <p>Advanced AI-powered document search with semantic understanding</p>
          </div>
          <div class="feature-card">
            <h3>⚡ Automated Processing</h3>
            <p>OCR, text extraction, and workflow automation for all document types</p>
          </div>
          <div class="feature-card">
            <h3>💬 Slack Integration</h3>
            <p>Query your documents directly from Slack with natural language</p>
          </div>
          <div class="feature-card">
            <h3>🤖 AI Assistant</h3>
            <p>Get answers and insights from your document library instantly</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hero-section {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 4rem 2rem;
      text-align: center;
      min-height: 60vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .hero-content {
      max-width: 600px;
    }
    .hero-title {
      font-size: 3.5rem;
      margin-bottom: 1rem;
      font-weight: bold;
    }
    .hero-subtitle {
      font-size: 1.25rem;
      margin-bottom: 2rem;
      opacity: 0.9;
    }
    .hero-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    .btn {
      padding: 1rem 2rem;
      border: none;
      border-radius: 0.5rem;
      font-size: 1rem;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-primary {
      background: white;
      color: #667eea;
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .btn-secondary {
      background: transparent;
      color: white;
      border: 2px solid white;
    }
    .btn-secondary:hover {
      background: white;
      color: #667eea;
    }
    .features-section {
      padding: 4rem 2rem;
      background: #f8fafc;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .features-section h2 {
      text-align: center;
      margin-bottom: 3rem;
      font-size: 2.5rem;
      color: #334155;
    }
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
    }
    .feature-card {
      background: white;
      padding: 2rem;
      border-radius: 1rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      text-align: center;
    }
    .feature-card h3 {
      margin-bottom: 1rem;
      color: #334155;
      font-size: 1.25rem;
    }
    .feature-card p {
      color: #64748b;
      line-height: 1.6;
    }
  `]
})
export class LandingComponent {}
