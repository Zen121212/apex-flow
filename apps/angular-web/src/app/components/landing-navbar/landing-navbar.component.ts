import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { AuthModalComponent } from '../auth-modal/auth-modal.component';
import { signal } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing-navbar',
  standalone: true,
  imports: [CommonModule, AuthModalComponent],
  styleUrls: ['./landing-navbar.component.css'],
  template: `
    <nav class="navbar">
      <div class="container">
        <div class="navbar-brand">
          <a (click)="scrollToSection('home')" class="brand-logo">ApexFlow</a>
        </div>
        <div class="navbar-nav">
          <a (click)="scrollToSection('home')" class="nav-link">Home</a>
          <a (click)="scrollToSection('why-choose')" class="nav-link">Why Choose</a>
          <a (click)="scrollToSection('solutions')" class="nav-link">AI Solutions</a>
          <a (click)="scrollToSection('industries')" class="nav-link">Industries</a>
        </div>
        <div class="navbar-actions">
          <ng-container *ngIf="!authService.isAuthenticated()">
            <button class="btn btn-ghost" (click)="openAuthModal()">Sign In</button>
            <button class="btn btn-primary" (click)="openAuthModal()">Get Started</button>
          </ng-container>
          <ng-container *ngIf="authService.isAuthenticated()">
            <button class="btn btn-primary" (click)="goToDashboard()">Dashboard</button>
          </ng-container>
        </div>
      </div>
    </nav>
    
    <app-auth-modal 
      [isVisible]="showAuthModal()"
      (close)="closeAuthModal()"
      (authenticated)="onAuthenticated()"
    ></app-auth-modal>
  `
})
export class LandingNavbarComponent {
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
    this.closeAuthModal();
    this.router.navigate(['/dashboard']);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
