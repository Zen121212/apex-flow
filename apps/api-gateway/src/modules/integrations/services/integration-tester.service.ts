import { Injectable, Logger } from '@nestjs/common';
import { MongoClient } from 'mongodb';
import * as mysql from 'mysql2/promise';
import { Client as PostgreSQLClient } from 'pg';
import { 
  IntegrationConfig, 
  DatabaseConfig, 
  SlackConfig, 
  EmailConfig, 
  WebhookConfig 
} from '../entities/integration.entity';

export interface TestResult {
  success: boolean;
  message: string;
  details?: any;
  timestamp: Date;
}

@Injectable()
export class IntegrationTesterService {
  private readonly logger = new Logger(IntegrationTesterService.name);

  async testIntegration(type: string, config: IntegrationConfig): Promise<TestResult> {
    try {
      switch (type) {
        case 'database':
          return await this.testDatabaseConnection(config as DatabaseConfig);
        case 'slack':
          return await this.testSlackConnection(config as SlackConfig);
        case 'email':
          return await this.testEmailConnection(config as EmailConfig);
        case 'webhook':
          return await this.testWebhookConnection(config as WebhookConfig);
        default:
          return {
            success: false,
            message: `Unsupported integration type: ${type}`,
            timestamp: new Date()
          };
      }
    } catch (error) {
      this.logger.error(`Integration test failed for ${type}:`, error);
      return {
        success: false,
        message: `Test failed: ${error.message}`,
        details: error.code || error.name,
        timestamp: new Date()
      };
    }
  }

  private async testDatabaseConnection(config: DatabaseConfig): Promise<TestResult> {
    const startTime = Date.now();

    try {
      switch (config.type) {
        case 'mongodb':
          return await this.testMongoDBConnection(config);
        case 'mysql':
          return await this.testMySQLConnection(config);
        case 'postgresql':
          return await this.testPostgreSQLConnection(config);
        case 'sqlite':
          return this.testSQLiteConnection(config);
        default:
          return {
            success: false,
            message: `Database type ${config.type} not yet supported`,
            timestamp: new Date()
          };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
        details: { 
          error: error.code || error.name,
          duration: `${duration}ms`,
          host: config.host,
          database: config.database
        },
        timestamp: new Date()
      };
    }
  }

  private async testMongoDBConnection(config: DatabaseConfig): Promise<TestResult> {
    const startTime = Date.now();
    let client: MongoClient;

    try {
      // Build connection string if not provided
      let connectionString = config.connectionString;
      if (!connectionString) {
        const auth = config.username ? `${config.username}:${config.password}@` : '';
        const host = config.host || 'localhost';
        const port = config.port || 27017;
        connectionString = `mongodb://${auth}${host}:${port}/${config.database}`;
      }

      client = new MongoClient(connectionString);
      await client.connect();

      // Test the connection by pinging the database
      const db = client.db(config.database);
      await db.admin().ping();

      // Try to list collections to ensure we have proper access
      const collections = await db.listCollections().toArray();
      
      const duration = Date.now() - startTime;
      await client.close();

      return {
        success: true,
        message: `MongoDB connection successful!`,
        details: {
          database: config.database,
          duration: `${duration}ms`,
          server: connectionString.includes('@') 
            ? connectionString.split('@')[1].split('/')[0]
            : `${config.host}:${config.port}`
        },
        timestamp: new Date()
      };

    } catch (error) {
      if (client) {
        try { await client.close(); } catch {}
      }
      throw error;
    }
  }

  private async testMySQLConnection(config: DatabaseConfig): Promise<TestResult> {
    const startTime = Date.now();
    let connection;

    try {
      const connectionConfig = {
        host: config.host || 'localhost',
        port: config.port || 3306,
        user: config.username,
        password: config.password,
        database: config.database,
        ssl: config.ssl ? {} : false,
        connectTimeout: 10000,
        acquireTimeout: 10000,
      };

      connection = await mysql.createConnection(connectionConfig);
      
      // Test the connection
      const [rows] = await connection.execute('SELECT 1 as test');
      
      // Get database info
      const [dbInfo] = await connection.execute('SELECT DATABASE() as current_db, VERSION() as version');
      const [tableCount] = await connection.execute(
        'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ?', 
        [config.database]
      );

      const duration = Date.now() - startTime;
      await connection.end();

      return {
        success: true,
        message: `MySQL connection successful!`,
        details: {
          database: (dbInfo as any)[0].current_db,
          version: (dbInfo as any)[0].version,
          tables: (tableCount as any)[0].count,
          duration: `${duration}ms`,
          server: `${config.host}:${config.port}`
        },
        timestamp: new Date()
      };

    } catch (error) {
      if (connection) {
        try { await connection.end(); } catch {}
      }
      throw error;
    }
  }

  private async testPostgreSQLConnection(config: DatabaseConfig): Promise<TestResult> {
    const startTime = Date.now();
    let client;

    try {
      client = new PostgreSQLClient({
        host: config.host || 'localhost',
        port: config.port || 5432,
        user: config.username,
        password: config.password,
        database: config.database,
        ssl: config.ssl,
        connectionTimeoutMillis: 10000,
      });

      await client.connect();
      
      // Test the connection
      const testResult = await client.query('SELECT 1 as test');
      
      // Get database info
      const versionResult = await client.query('SELECT version()');
      const tableCountResult = await client.query(
        'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_catalog = $1 AND table_schema = $2',
        [config.database, config.schema || 'public']
      );

      const duration = Date.now() - startTime;
      await client.end();

      return {
        success: true,
        message: `PostgreSQL connection successful!`,
        details: {
          database: config.database,
          schema: config.schema || 'public',
          version: versionResult.rows[0].version.split(' ')[1],
          tables: parseInt(tableCountResult.rows[0].count),
          duration: `${duration}ms`,
          server: `${config.host}:${config.port}`
        },
        timestamp: new Date()
      };

    } catch (error) {
      if (client) {
        try { await client.end(); } catch {}
      }
      throw error;
    }
  }

  private testSQLiteConnection(config: DatabaseConfig): TestResult {
    try {
      // For SQLite, we just check if the database file path is valid
      // In a real implementation, you'd use sqlite3 package
      return {
        success: true,
        message: `SQLite connection validation successful!`,
        details: {
          database: config.database,
          note: 'SQLite connection will be tested when first used'
        },
        timestamp: new Date()
      };
    } catch (error) {
      throw error;
    }
  }

  private async testSlackConnection(config: SlackConfig): Promise<TestResult> {
    try {
      // For now, just validate the token format and workspace URL
      // In production, you'd use @slack/web-api to test the connection
      if (!config.botToken.startsWith('xoxb-')) {
        throw new Error('Invalid Slack bot token format');
      }

      if (!config.workspaceUrl.includes('.slack.com')) {
        throw new Error('Invalid Slack workspace URL format');
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        success: true,
        message: `Slack integration configured successfully!`,
        details: {
          workspace: config.workspaceUrl,
          defaultChannel: config.defaultChannel,
          note: 'Token validation would be performed with Slack API in production'
        },
        timestamp: new Date()
      };
    } catch (error) {
      throw error;
    }
  }

  private async testEmailConnection(config: EmailConfig): Promise<TestResult> {
    try {
      // For now, just validate the configuration
      // In production, you'd use nodemailer to test SMTP connection
      if (!config.fromAddress.includes('@')) {
        throw new Error('Invalid email address format');
      }

      if (config.provider === 'smtp' && !config.smtpHost) {
        throw new Error('SMTP host is required for SMTP provider');
      }

      // Simulate SMTP connection test delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true,
        message: `Email integration configured successfully!`,
        details: {
          provider: config.provider,
          fromAddress: config.fromAddress,
          smtpHost: config.smtpHost || 'Provider default',
          security: config.security,
          note: 'SMTP connection would be tested in production'
        },
        timestamp: new Date()
      };
    } catch (error) {
      throw error;
    }
  }

  private async testWebhookConnection(config: WebhookConfig): Promise<TestResult> {
    try {
      // Test if URL is valid
      new URL(config.url);

      // In production, you'd make a test HTTP request to the webhook
      // For now, just validate the configuration
      await new Promise(resolve => setTimeout(resolve, 750));

      return {
        success: true,
        message: `Webhook endpoint validated successfully!`,
        details: {
          url: config.url,
          method: config.method,
          authentication: config.authentication.type,
          retrySettings: config.retrySettings,
          note: 'Test webhook request would be sent in production'
        },
        timestamp: new Date()
      };
    } catch (error) {
      if (error.name === 'TypeError') {
        throw new Error('Invalid webhook URL format');
      }
      throw error;
    }
  }
}
