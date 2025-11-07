# CelesteOS LAN Access Setup

This directory contains configuration files and scripts to enable LAN access to CelesteOS using custom domains and automatic discovery.

## 🎯 Overview

Enable other devices on your local network to access CelesteOS using:
- **Direct IP**: `http://192.168.x.x:80`
- **Custom domain**: `http://celesteos` (shortest possible URL)
- **Auto-discovery**: `http://celesteos.local` (no setup required on client devices)
- **HTTPS**: `https://celesteos.local` (with trusted certificates)

## 📁 Files

```
dev-proxy/
├── Caddyfile                    # Main config (HTTPS + multiple domains)
├── Caddyfile-single-label      # LAN-optimized config (HTTP only)
└── README.md                   # This file

infra/mdns/
├── advertise-mdns.py           # mDNS/Bonjour service
├── macos/com.celesteos.mdns.plist  # macOS LaunchDaemon
├── linux/celesteos-mdns.service    # Linux systemd service
└── test/verify-mdns.sh         # Test mDNS functionality

setup-shortest-url.sh           # Automated setup script
```

## 🚀 Quick Start

### Option 1: Automatic Setup (Recommended)
```bash
# Run the setup script
./setup-shortest-url.sh

# Follow the instructions to add hosts file entry
echo '192.168.x.x   celesteos' | sudo tee -a /etc/hosts

# Start LAN-optimized Caddy
cd dev-proxy
caddy run --config Caddyfile-single-label &

# Start mDNS service for auto-discovery
python3 ../infra/mdns/advertise-mdns.py 80 &
```

### Option 2: Manual Configuration
See detailed steps below.

## 📋 Detailed Setup

### Prerequisites
- **Node.js dev server** running on port 8082
- **Caddy** installed (`brew install caddy` on macOS)
- **Python 3** for mDNS service

### Step 1: Detect Your LAN IP
```bash
# Auto-detect LAN IP
ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1
# Example output: inet 192.168.1.168
```

### Step 2: Choose Configuration Method

#### Method A: HTTP Only (LAN Access)
Best for local development and testing.

```bash
cd dev-proxy
caddy run --config Caddyfile-single-label
```

**Features:**
- HTTP only (no SSL redirect)
- Single-label hostname support (`celesteos`)
- Redirects `celesteos.local` → `celesteos` for shorter URLs

#### Method B: HTTPS with Trusted Certificates
Best for OAuth testing and production-like environment.

```bash
# First, install mkcert for trusted certificates
brew install mkcert
mkcert -install
mkcert localhost celesteos.local

cd dev-proxy
caddy run --config Caddyfile
```

**Features:**
- HTTPS with mkcert trusted certificates
- Real SSL certificate for `localhost.direct`
- Microsoft OAuth compatibility

### Step 3: Enable Auto-Discovery (Optional)

Start the mDNS service to broadcast `celesteos.local` on the network:

```bash
# Start mDNS service
python3 infra/mdns/advertise-mdns.py 80

# Verify it's working
dns-sd -B _http._tcp local.
# Should show "CelesteOS" in the list
```

### Step 4: Configure Client Devices

#### For Custom Domain (`celesteos`)
Add to `/etc/hosts` on each device that needs access:
```
192.168.1.168   celesteos
```

#### For Auto-Discovery (`celesteos.local`)
No configuration needed - devices will automatically discover the service.

## 🔧 Configuration Files

### Caddyfile (HTTPS + Multiple Domains)
```caddyfile
# HTTPS with mkcert trusted certificates
celesteos.local {
    tls localhost.pem localhost-key.pem
    reverse_proxy localhost:8082
}

# HTTPS with real SSL certificate
localhost.direct {
    reverse_proxy localhost:8082
}

# HTTP fallback
celesteos:80 {
    reverse_proxy localhost:8082
}
```

### Caddyfile-single-label (LAN Optimized)
```caddyfile
# Main server: celesteos (single-label hostname)
celesteos:80 {
    reverse_proxy localhost:8082
}

# Redirect celesteos.local to celesteos for shorter URL
celesteos.local:80 {
    redir http://celesteos{uri} permanent
}
```

## 🧪 Testing

### Test Local Access
```bash
# Test dev server directly
curl -I http://localhost:8082

# Test Caddy reverse proxy
curl -I http://192.168.1.168:80

# Test custom domain (after hosts file update)
curl -I http://celesteos

# Test auto-discovery
curl -I http://celesteos.local
```

### Test from Other Devices
1. **Phone/Tablet**: Navigate to `http://192.168.1.168` or `http://celesteos.local`
2. **Other computers**: Same URLs should work
3. **Network discovery**: Service should appear in network browsers

### Verify mDNS Broadcasting
```bash
# Browse for HTTP services on network
dns-sd -B _http._tcp local.

# Should show:
# CelesteOS
# CelesteOS Web
```

## 🔍 Troubleshooting

### Common Issues

#### "Connection refused" from other devices
1. Check if Caddy is running: `ps aux | grep caddy`
2. Verify port 80 is listening: `lsof -i :80`
3. Test local access first: `curl -I http://192.168.1.168:80`

#### mDNS not working
1. Install zeroconf: `pip3 install zeroconf`
2. Check firewall settings (allow port 5353/UDP)
3. Verify service registration: `dns-sd -B _http._tcp local.`

#### HTTPS certificate errors
1. Reinstall mkcert: `mkcert -install`
2. Generate new certificates: `mkcert localhost celesteos.local`
3. Restart Caddy with correct certificate paths

#### Hosts file not working
1. Verify syntax: `192.168.1.168   celesteos` (tab or spaces)
2. Clear DNS cache: `sudo dscacheutil -flushcache` (macOS)
3. Test with ping: `ping celesteos`

### Network Diagnostics
```bash
# Check your LAN IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# Check what's listening on ports
lsof -i :80 -i :8082 -i :443

# Check Caddy process
ps aux | grep caddy

# Test connectivity
curl -v http://192.168.1.168:80
```

## 🚦 Service Management

### Start All Services
```bash
# Start development server
npm run dev &

# Start Caddy (choose one config)
cd dev-proxy
caddy run --config Caddyfile-single-label &

# Start mDNS service
python3 ../infra/mdns/advertise-mdns.py 80 &
```

### Stop All Services
```bash
# Stop Caddy
pkill -f caddy

# Stop mDNS service
pkill -f advertise-mdns.py

# Stop dev server
pkill -f "npm run dev"
```

### Production Deployment
For persistent services, use:
- **macOS**: LaunchDaemon (`infra/mdns/macos/com.celesteos.mdns.plist`)
- **Linux**: systemd service (`infra/mdns/linux/celesteos-mdns.service`)

## 📱 Access URLs Summary

| URL | Requires Setup | Description |
|-----|----------------|-------------|
| `http://192.168.1.168:80` | None | Direct IP access |
| `http://192.168.1.168:8082` | None | Direct dev server |
| `http://celesteos` | Hosts file | Shortest possible URL |
| `http://celesteos.local` | mDNS service | Auto-discovery |
| `https://celesteos.local` | mkcert + HTTPS config | Secure with trusted cert |

## ⚙️ Advanced Configuration

### Custom Port
To use a different port for Caddy:
```bash
# Edit Caddyfile-single-label, change :80 to :8080
celesteos:8080 {
    reverse_proxy localhost:8082
}

# Start mDNS with custom port
python3 infra/mdns/advertise-mdns.py 8080
```

### Multiple Projects
To serve multiple projects simultaneously:
```caddyfile
project1.local:80 {
    reverse_proxy localhost:3000
}

project2.local:80 {
    reverse_proxy localhost:3001
}

celesteos.local:80 {
    reverse_proxy localhost:8082
}
```

### Firewall Configuration
Allow Caddy through macOS firewall:
```bash
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /opt/homebrew/bin/caddy
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /opt/homebrew/bin/caddy
```

## 📚 References

- [Caddy Documentation](https://caddyserver.com/docs/)
- [mDNS/Bonjour Protocol](https://tools.ietf.org/html/rfc6763)
- [mkcert Certificate Tool](https://github.com/FiloSottile/mkcert)
- [Zeroconf Python Library](https://python-zeroconf.readthedocs.io/)

## 🐛 Bug Reports

If you encounter issues:
1. Check the troubleshooting section above
2. Run the test commands to identify the problem
3. Check Caddy logs for detailed error messages
4. Verify network connectivity and firewall settings