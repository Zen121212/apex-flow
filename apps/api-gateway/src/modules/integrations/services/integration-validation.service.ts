import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class IntegrationValidationService {
  /**
   * Validate integration configuration based on type
   */
  validateIntegrationConfig(type: string, config: any): void {
    switch (type) {
      case 'database':
        this.validateDatabaseConfig(config);
        break;
      case 'slack':
        this.validateSlackConfig(config);
        break;
      case 'email':
        this.validateEmailConfig(config);
        break;
      case 'webhook':
        this.validateWebhookConfig(config);
        break;
      default:
        throw new HttpException(`Invalid integration type: ${type}`, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Validate database configuration
   */
  private validateDatabaseConfig(config: any): void {
    if (!config.database) {
      throw new HttpException('Database name is required', HttpStatus.BAD_REQUEST);
    }

    if (!this.isValidDatabaseType(config.type)) {
      throw new HttpException('Invalid database type', HttpStatus.BAD_REQUEST);
    }

    if (this.requiresConnectionDetails(config.type)) {
      if (!config.host && !config.connectionString) {
        throw new HttpException('Host or connection string is required', HttpStatus.BAD_REQUEST);
      }
    }
  }

  /**
   * Validate Slack configuration
   */
  private validateSlackConfig(config: any): void {
    if (!config.workspaceUrl || !config.workspaceUrl.includes('.slack.com')) {
      throw new HttpException('Valid Slack workspace URL is required', HttpStatus.BAD_REQUEST);
    }

    if (!config.botToken || !config.botToken.startsWith('xoxb-')) {
      throw new HttpException('Valid Slack bot token is required', HttpStatus.BAD_REQUEST);
    }

    if (!config.defaultChannel) {
      throw new HttpException('Default channel is required', HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Validate email configuration
   */
  private validateEmailConfig(config: any): void {
    if (!config.username || !config.password) {
      throw new HttpException('Username and password are required', HttpStatus.BAD_REQUEST);
    }

    if (!this.isValidEmail(config.fromAddress)) {
      throw new HttpException('Valid from email address is required', HttpStatus.BAD_REQUEST);
    }

    if (config.provider === 'smtp' && !config.smtpHost) {
      throw new HttpException('SMTP host is required for SMTP provider', HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Validate webhook configuration
   */
  private validateWebhookConfig(config: any): void {
    if (!config.url) {
      throw new HttpException('Webhook URL is required', HttpStatus.BAD_REQUEST);
    }

    if (!this.isValidUrl(config.url)) {
      throw new HttpException('Invalid webhook URL format', HttpStatus.BAD_REQUEST);
    }

    if (!this.isValidHttpMethod(config.method)) {
      throw new HttpException('Invalid HTTP method', HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Helper: Check if database type is valid
   */
  private isValidDatabaseType(type: string): boolean {
    const validTypes = ['mongodb', 'mysql', 'postgresql', 'sqlite', 'mssql', 'oracle'];
    return validTypes.includes(type);
  }

  /**
   * Helper: Check if database type requires connection details
   */
  private requiresConnectionDetails(type: string): boolean {
    return type !== 'mongodb' && type !== 'sqlite';
  }

  /**
   * Helper: Validate email format
   */
  private isValidEmail(email: string): boolean {
    return !!(email && email.includes('@'));
  }

  /**
   * Helper: Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Helper: Check if HTTP method is valid
   */
  private isValidHttpMethod(method: string): boolean {
    const validMethods = ['POST', 'PUT', 'PATCH'];
    return validMethods.includes(method);
  }

  /**
   * Get list of supported integration types
   */
  getSupportedIntegrationTypes(): string[] {
    return ['database', 'slack', 'email', 'webhook'];
  }

  /**
   * Get list of supported database types
   */
  getSupportedDatabaseTypes(): string[] {
    return ['mongodb', 'mysql', 'postgresql', 'sqlite', 'mssql', 'oracle'];
  }

  /**
   * Get list of supported HTTP methods for webhooks
   */
  getSupportedHttpMethods(): string[] {
    return ['POST', 'PUT', 'PATCH'];
  }
}
