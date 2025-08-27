import { Component } from '@angular/core';
import { LayoutComponent } from './components/layout/layout.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LayoutComponent],
  template: `
    <app-layout></app-layout>
  `,
  styles: []
})
export class AppComponent {
  title = 'ApexFlow';
}
