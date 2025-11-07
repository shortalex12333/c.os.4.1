/**
 * CelesteOS Network Server
 * Configured for local network access
 */

import { createServer } from './index.ts';
import process from 'process';

const app = createServer();

// Network configuration
const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 3000;
const NETWORK_NAME = process.env.NETWORK_NAME || 'celesteos';

// Get local IP address
async function getLocalIP() {
  const { networkInterfaces } = await import('os');
  const nets = networkInterfaces();
  const results = {};

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        if (!results[name]) {
          results[name] = [];
        }
        results[name].push(net.address);
      }
    }
  }

  // Return the first non-internal IPv4 address
  for (const name of Object.keys(results)) {
    if (results[name].length > 0) {
      return results[name][0];
    }
  }

  return 'localhost';
}

async function startNetworkServer() {
  try {
    const localIP = await getLocalIP();
    
    const server = app.listen(PORT, HOST, () => {
      console.log('🚢 CelesteOS Yacht AI - Network Mode');
      console.log('================================');
      console.log(`✅ Server running on ${HOST}:${PORT}`);
      console.log('');
      console.log('🌐 Network Access:');
      console.log(`   Local: http://localhost:${PORT}`);
      console.log(`   Network: http://${localIP}:${PORT}`);
      console.log(`   Hostname: http://${NETWORK_NAME} (via proxy)`);
      console.log(`   mDNS: http://${NETWORK_NAME}.local`);
      console.log('');
      console.log('🔧 SMB NAS: localhost:445/YachtDocs');
      console.log('📡 Telemetry: /api/telemetry/dashboard');
      console.log('');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 Received SIGTERM, shutting down gracefully');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('🛑 Received SIGINT, shutting down gracefully');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start network server:', error);
    process.exit(1);
  }
}

startNetworkServer();