import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./auth-modal.component.css'],
  template: `
    <div class="modal-overlay" [class.visible]="isVisible" (click)="onOverlayClick($event)">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>{{ isSignUp() ? 'Create Account' : 'Welcome Back' }}</h2>
          <button class="close-btn" (click)="onClose()">&times;</button>
        </div>

        <div class="modal-body">
          <!-- Google Sign In Button -->
          <button 
            class="btn btn-google" 
            (click)="onGoogleSignIn()"
            [disabled]="isLoading()"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {{ isLoading() ? 'Please wait...' : 'Continue with Google' }}
          </button>

          <div class="divider">
            <span>or</span>
          </div>

          <!-- Email/Password Form -->
          <form (ngSubmit)="onSubmit()" #authForm="ngForm">
            <div class="form-group" *ngIf="isSignUp()">
              <label for="name">Full Name</label>
              <input 
                type="text" 
                id="name" 
                name="name"
                [(ngModel)]="formData.name" 
                required
                placeholder="Enter your full name"
              />
            </div>

            <div class="form-group">
              <label for="email">Email</label>
              <input 
                type="email" 
                id="email" 
                name="email"
                [(ngModel)]="formData.email" 
                required
                placeholder="Enter your email"
              />
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <input 
                type="password" 
                id="password" 
                name="password"
                [(ngModel)]="formData.password" 
                required
                placeholder="Enter your password"
                minlength="6"
              />
            </div>

            <div class="form-group" *ngIf="isSignUp()">
              <label for="confirmPassword">Confirm Password</label>
              <input 
                type="password" 
                id="confirmPassword" 
                name="confirmPassword"
                [(ngModel)]="formData.confirmPassword" 
                required
                placeholder="Confirm your password"
                minlength="6"
              />
            </div>

            <div class="error-message" *ngIf="errorMessage()">
              {{ errorMessage() }}
            </div>

            <button 
              type="submit" 
              class="btn btn-primary btn-full"
              [disabled]="isLoading() || !authForm.form.valid"
            >
              {{ isLoading() ? 'Please wait...' : (isSignUp() ? 'Create Account' : 'Sign In') }}
            </button>
          </form>

          <div class="switch-mode">
            <span>{{ isSignUp() ? 'Already have an account?' : "Don't have an account?" }}</span>
            <button type="button" class="link-btn" (click)="toggleMode()">
              {{ isSignUp() ? 'Sign In' : 'Sign Up' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AuthModalComponent {
  @Input() isVisible = false;
  @Output() close = new EventEmitter<void>();
  @Output() authenticated = new EventEmitter<void>();

  private signUpMode = signal(false);
  private loading = signal(false);
  private error = signal('');

  formData = {
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  constructor(private authService: AuthService) {}

  isSignUp = this.signUpMode.asReadonly();
  isLoading = this.loading.asReadonly();
  errorMessage = this.error.asReadonly();

  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  onClose(): void {
    this.close.emit();
    this.resetForm();
  }

  toggleMode(): void {
    this.signUpMode.update(mode => !mode);
    this.error.set('');
  }

  async onGoogleSignIn(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const success = await this.authService.signInWithGoogle();
      if (success) {
        this.authenticated.emit();
        this.onClose();
      } else {
        this.error.set('Google sign in failed. Please try again.');
      }
    } catch (error) {
      this.error.set('Google sign in failed. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.isSignUp() && this.formData.password !== this.formData.confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    try {
      let success = false;

      if (this.isSignUp()) {
        success = await this.authService.signUpWithEmail(
          this.formData.email,
          this.formData.password,
          this.formData.name
        );
      } else {
        success = await this.authService.signInWithEmail(
          this.formData.email,
          this.formData.password
        );
      }

      if (success) {
        this.authenticated.emit();
        this.onClose();
      } else {
        this.error.set(
          this.isSignUp() 
            ? 'Account creation failed. Please try again.' 
            : 'Invalid email or password.'
        );
      }
    } catch (error) {
      this.error.set('An error occurred. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  private resetForm(): void {
    this.formData = {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    };
    this.error.set('');
    this.loading.set(false);
    this.signUpMode.set(false);
  }
}
