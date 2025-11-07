import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

export class EmailServiceManager {
  private apiServerProcess: ChildProcess | null = null;
  private registrationServerProcess: ChildProcess | null = null;
  private isStarted = false;

  private readonly emailServicesPath: string;
  private readonly requiredPorts = [8001, 8003];

  constructor() {
    this.emailServicesPath = path.join(__dirname, 'email');
  }

  async start(): Promise<void> {
    if (this.isStarted) {
      console.log('📧 Email services already running');
      return;
    }

    try {
      console.log('🚀 Starting Microsoft Email Integration services...');

      // Check if required environment variables are set
      this.validateConfiguration();

      // Check if ports are available
      await this.checkPortsAvailable();

      // Start API server (port 8001)
      this.apiServerProcess = spawn('python3', ['multi_user_api_server.py'], {
        cwd: this.emailServicesPath,
        env: {
          ...process.env,
          AZURE_TENANT_ID: process.env.AZURE_TENANT_ID || 'd44c2402-b515-4d6d-a392-5cfc88ae53bb',
          AZURE_CLIENT_ID: process.env.AZURE_CLIENT_ID || 'a744caeb-9896-4dbf-8b85-d5e07dba935c',
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.apiServerProcess.stdout?.on('data', (data) => {
        console.log('📧 API Server:', data.toString().trim());
      });

      this.apiServerProcess.stderr?.on('data', (data) => {
        console.error('📧 API Server Error:', data.toString().trim());
      });

      // Start registration server (port 8003)
      this.registrationServerProcess = spawn('python3', ['user_registration_server.py'], {
        cwd: this.emailServicesPath,
        env: {
          ...process.env,
          AZURE_TENANT_ID: process.env.AZURE_TENANT_ID || 'd44c2402-b515-4d6d-a392-5cfc88ae53bb',
          AZURE_CLIENT_ID: process.env.AZURE_CLIENT_ID || 'a744caeb-9896-4dbf-8b85-d5e07dba935c',
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.registrationServerProcess.stdout?.on('data', (data) => {
        console.log('📧 Registration Server:', data.toString().trim());
      });

      this.registrationServerProcess.stderr?.on('data', (data) => {
        console.error('📧 Registration Server Error:', data.toString().trim());
      });

      // Wait for services to start
      await this.waitForServicesReady();

      this.isStarted = true;
      console.log('✅ Microsoft Email Integration services started successfully');
    } catch (error) {
      console.error('❌ Failed to start email services:', error);
      await this.stop();
      throw error;
    }
  }

  async stop(): Promise<void> {
    console.log('🛑 Stopping Microsoft Email Integration services...');

    if (this.apiServerProcess) {
      this.apiServerProcess.kill('SIGTERM');
      this.apiServerProcess = null;
    }

    if (this.registrationServerProcess) {
      this.registrationServerProcess.kill('SIGTERM');
      this.registrationServerProcess = null;
    }

    this.isStarted = false;
    console.log('✅ Email services stopped');
  }

  private validateConfiguration(): void {
    const requiredVars = ['AZURE_TENANT_ID', 'AZURE_CLIENT_ID'];
    const missing: string[] = [];

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        missing.push(varName);
      }
    }

    if (missing.length > 0) {
      console.warn(`⚠️ Missing environment variables: ${missing.join(', ')}`);
      console.warn('Using default values for development');
    }

    // Check if Python files exist
    const pythonFiles = ['multi_user_api_server.py', 'user_registration_server.py'];
    for (const file of pythonFiles) {
      const filePath = path.join(this.emailServicesPath, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Required Python file not found: ${filePath}`);
      }
    }
  }

  private async checkPortsAvailable(): Promise<void> {
    for (const port of this.requiredPorts) {
      try {
        const response = await fetch(`http://localhost:${port}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(2000)
        });
        
        if (response.ok) {
          console.log(`📧 Port ${port} already has a service running (OK)`);
        }
      } catch (error) {
        // Port is free (expected)
      }
    }
  }

  private async waitForServicesReady(): Promise<void> {
    const maxAttempts = 30;
    const delayMs = 1000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Check API server health
        const apiResponse = await fetch('http://localhost:8001/health', {
          method: 'GET',
          signal: AbortSignal.timeout(2000)
        });

        // Check registration server health  
        const regResponse = await fetch('http://localhost:8003/health', {
          method: 'GET',
          signal: AbortSignal.timeout(2000)
        });

        if (apiResponse.ok && regResponse.ok) {
          console.log(`✅ Email services ready (attempt ${attempt}/${maxAttempts})`);
          return;
        }
      } catch (error) {
        // Services not ready yet
      }

      if (attempt < maxAttempts) {
        console.log(`⏳ Waiting for email services to be ready (${attempt}/${maxAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    throw new Error('Email services failed to start within timeout period');
  }

  public isRunning(): boolean {
    return this.isStarted;
  }

  public async getStatus(): Promise<{
    running: boolean;
    apiServer: boolean;
    registrationServer: boolean;
    lastCheck: string;
  }> {
    let apiServer = false;
    let registrationServer = false;

    if (this.isStarted) {
      try {
        const apiResponse = await fetch('http://localhost:8001/health', { signal: AbortSignal.timeout(2000) });
        apiServer = apiResponse.ok;
      } catch (error) {
        // API server not responding
      }

      try {
        const regResponse = await fetch('http://localhost:8003/health', { signal: AbortSignal.timeout(2000) });
        registrationServer = regResponse.ok;
      } catch (error) {
        // Registration server not responding
      }
    }

    return {
      running: this.isStarted,
      apiServer,
      registrationServer,
      lastCheck: new Date().toISOString()
    };
  }
}

// Singleton instance
export const emailServiceManager = new EmailServiceManager();