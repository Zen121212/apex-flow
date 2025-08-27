import { Injectable, signal } from "@angular/core";
import { BehaviorSubject } from "rxjs";

export interface User {
  id: string;
  email: string;
  name: string;
  provider: "email" | "google";
}

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  public isAuthenticated = signal(false);
  public currentUser = signal<User | null>(null);

  constructor() {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      this.setUser(user);
    }
  }

  private setUser(user: User | null): void {
    this.userSubject.next(user);
    this.currentUser.set(user);
    this.isAuthenticated.set(!!user);

    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }

  async signInWithEmail(email: string, password: string): Promise<boolean> {
    try {
      await this.delay(1000);
      const user: User = {
        id: "1",
        email,
        name: email.split("@")[0],
        provider: "email",
      };

      this.setUser(user);
      return true;
    } catch (error) {
      console.error("Sign in error:", error);
      return false;
    }
  }

  async signUpWithEmail(
    email: string,
    password: string,
    name: string,
  ): Promise<boolean> {
    try {
      await this.delay(1000);
      const user: User = {
        id: Date.now().toString(),
        email,
        name,
        provider: "email",
      };

      this.setUser(user);
      return true;
    } catch (error) {
      console.error("Sign up error:", error);
      return false;
    }
  }

  async signInWithGoogle(): Promise<boolean> {
    try {
      await this.delay(1500);
      const user: User = {
        id: "google-" + Date.now(),
        email: "user@gmail.com",
        name: "Google User",
        provider: "google",
      };

      this.setUser(user);
      return true;
    } catch (error) {
      console.error("Google sign in error:", error);
      return false;
    }
  }

  signOut(): void {
    this.setUser(null);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
