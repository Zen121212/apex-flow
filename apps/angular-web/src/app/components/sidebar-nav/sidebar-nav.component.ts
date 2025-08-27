import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrls: ['./sidebar-nav.component.css'],
  template: `
    <div class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <span class="logo-icon">⚡</span>
          <span class="logo-text">ApexFlow</span>
        </div>
      </div>
      
      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-section-title">Main</div>
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📊</span>
            <span class="nav-text">Dashboard</span>
          </a>
          <a routerLink="/upload" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📤</span>
            <span class="nav-text">Upload</span>
          </a>
          <a routerLink="/documents" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📄</span>
            <span class="nav-text">Documents</span>
          </a>
        </div>
        
        <div class="nav-section">
          <div class="nav-section-title">AI Tools</div>
          <a routerLink="/workflows" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🔄</span>
            <span class="nav-text">Workflows</span>
          </a>
          <a routerLink="/search" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🔍</span>
            <span class="nav-text">Search</span>
          </a>
          <a routerLink="/chat" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">💬</span>
            <span class="nav-text">Document Chat</span>
          </a>
        </div>
        
        <div class="nav-section">
          <div class="nav-section-title">Settings</div>
          <a routerLink="/integrations" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🔌</span>
            <span class="nav-text">Integrations</span>
          </a>
          <a routerLink="/profile" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">👤</span>
            <span class="nav-text">Profile</span>
          </a>
        </div>
      </nav>
      
      <div class="sidebar-footer">
        <button class="logout-btn" (click)="logout()">
          <span class="nav-icon">🚪</span>
          <span class="nav-text">Sign Out</span>
        </button>
      </div>
    </div>
  `
})
export class SidebarNavComponent {
  constructor(private authService: AuthService, private router: Router) {}

  logout(): void {
    this.authService.signOut();
    this.router.navigate(['/landing']);
  }
}
