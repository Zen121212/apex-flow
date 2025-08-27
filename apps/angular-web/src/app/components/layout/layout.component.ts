import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { SidebarNavComponent } from '../sidebar-nav/sidebar-nav.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarNavComponent],
  styleUrls: ['./layout.component.css'],
  template: `
    <div class="app-layout">
      <!-- Sidebar for authenticated pages -->
      <app-sidebar-nav *ngIf="showSidebar$ | async"></app-sidebar-nav>
      
      <!-- Main content area -->
      <div class="main-content" [ngClass]="{ 'with-sidebar': showSidebar$ | async }">
        <router-outlet></router-outlet>
      </div>
    </div>
  `
})
export class LayoutComponent implements OnInit {
  showSidebar$ = this.router.events.pipe(
    filter(event => event instanceof NavigationEnd),
    startWith(null), // Emit initial value
    map(() => {
      const url = this.router.url;
      const isLandingPage = url === '/' || url === '/landing';
      const isAuthenticated = this.authService.isAuthenticated();
      
      // Redirect authenticated users from landing to dashboard
      if (isLandingPage && isAuthenticated) {
        this.router.navigate(['/dashboard']);
        return true; // Show sidebar while redirecting
      }
      
      // Show sidebar for authenticated users on non-landing pages
      return isAuthenticated && !isLandingPage;
    })
  );

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Check initial route on app load
    const url = this.router.url;
    const isLandingPage = url === '/' || url === '/landing';
    const isAuthenticated = this.authService.isAuthenticated();
    
    if (isLandingPage && isAuthenticated) {
      this.router.navigate(['/dashboard']);
    } else if (!isLandingPage && !isAuthenticated) {
      this.router.navigate(['/landing']);
    }
  }
}
