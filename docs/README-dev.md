# Development Setup Guide

This guide explains how to set up the development server for LAN access with a custom hostname.

## Table of Contents

- [Quick Start](#quick-start)
- [LAN Access Setup](#lan-access-setup)
- [Custom Hostname Setup](#custom-hostname-setup)
- [Reverse Proxy Setup (Optional)](#reverse-proxy-setup-optional)
- [Testing Checklist](#testing-checklist)
- [Troubleshooting](#troubleshooting)

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (accessible on LAN by default)
npm run dev

# Server will be available at:
# - http://localhost:8082
# - http://<YOUR_LAN_IP>:8082
```

## LAN Access Setup

The Vite dev server is configured to be accessible from your Local Area Network (LAN) by default.

### Configuration Details

- **Host binding**: `0.0.0.0` (allows LAN access)
- **Default port**: `8082`
- **Custom port**: Set `VITE_PORT` environment variable

```bash
# Use custom port
VITE_PORT=3000 npm run dev
```

### Finding Your LAN IP

```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr IPv4
```

### Firewall Configuration

You may need to allow Node.js/Vite through your firewall:

#### macOS
1. System Preferences → Security & Privacy → Firewall
2. Click "Firewall Options"
3. Add Node.js and allow incoming connections

#### Windows
1. Windows Defender Firewall → Allow an app
2. Add Node.js
3. Check both Private and Public networks

#### Linux (ufw)
```bash
sudo ufw allow 8082/tcp
```

## Custom Hostname Setup

### Shortest URL: Single-Label Hostname

For the absolute shortest URL (`http://celesteos`), use a single-label hostname without any TLD:

```bash
# Quick setup script
./setup-shortest-url.sh

# Or manually add to /etc/hosts (replace with your LAN IP)
echo "192.168.1.168   celesteos" | sudo tee -a /etc/hosts

# Access at:
http://celesteos:8082  # With port
http://celesteos       # Without port (requires proxy)
```

### Standard Hostname with TLD

To access the dev server via `http://celesteos.local` instead of IP address:

### Step 1: Find Your LAN IP

```bash
# Your LAN IP will be something like 192.168.1.100
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### Step 2: Edit Hosts File

Add an entry mapping your LAN IP to the custom hostname.

#### macOS/Linux
```bash
# Edit hosts file
sudo nano /etc/hosts

# Add this line (replace with your actual LAN IP)
192.168.1.100   celesteos.local
```

#### Windows
1. Open Notepad as Administrator
2. File → Open → `C:\Windows\System32\drivers\etc\hosts`
3. Add: `192.168.1.100   celesteos.local`

### Step 3: Access via Custom Hostname

```bash
# Start the dev server
npm run dev

# Access at:
http://celesteos.local:8082
```

### Alternative Domain Options

If `.local` causes issues (conflicts with mDNS/Bonjour):
- Use `.test` domain: `celesteos.test`
- Use `.lan` domain: `celesteos.lan`
- Use `.dev` domain: `celesteos.dev` (requires HTTPS)

## Reverse Proxy Setup (Optional)

To access the site without specifying port 8082, use a reverse proxy.

### Option 1: Nginx

```bash
# Install nginx
brew install nginx       # macOS
apt-get install nginx    # Linux

# For single-label hostname (http://celesteos)
nginx -c /path/to/project/dev-proxy/nginx-single-label.conf

# For .local domain (http://celesteos.local)
nginx -c /path/to/project/dev-proxy/nginx.conf

# Or copy to nginx config directory
cp dev-proxy/nginx.conf /usr/local/etc/nginx/servers/celesteos.conf

# Start nginx
nginx                    # or
brew services start nginx # macOS
```

### Option 2: Caddy (Simpler Alternative)

```bash
# Install Caddy
brew install caddy       # macOS
apt install caddy        # Linux

# For single-label hostname (http://celesteos)
caddy run --config dev-proxy/Caddyfile-single-label

# For .local domain (http://celesteos.local)
caddy run --config dev-proxy/Caddyfile

# Access at:
http://celesteos.local   # No port needed!
```

### HTTPS Setup (Optional)

For HTTPS with self-signed certificate using Caddy:

1. Edit `dev-proxy/Caddyfile`
2. Uncomment the HTTPS configuration section
3. Run Caddy: `caddy run --config dev-proxy/Caddyfile`
4. Accept the self-signed certificate in your browser

## Testing Checklist

After setup, verify the following:

### Basic Connectivity
- [ ] `http://localhost:8082` works
- [ ] `http://127.0.0.1:8082` works
- [ ] `http://<YOUR_LAN_IP>:8082` works from same machine
- [ ] `http://<YOUR_LAN_IP>:8082` works from another device on LAN

### Custom Hostname (after hosts file setup)
- [ ] `ping celesteos.local` resolves to correct IP
- [ ] `http://celesteos.local:8082` works

### Reverse Proxy (if configured)
- [ ] `http://celesteos.local` works (port 80)
- [ ] WebSocket/HMR (hot reload) still works
- [ ] No console errors in browser

### Features Check
- [ ] Hot Module Replacement (HMR) works
- [ ] API routes work correctly
- [ ] Static assets load properly

## Troubleshooting

### LAN Access Not Working

**Problem**: Can't access from other devices on network

**Solutions**:
1. Check firewall settings (see [Firewall Configuration](#firewall-configuration))
2. Verify correct LAN IP: `ifconfig` or `ipconfig`
3. Ensure device is on same network/subnet
4. Try disabling VPN if active
5. Check router settings for client isolation

### Custom Hostname Not Resolving

**Problem**: `celesteos.local` doesn't work

**Solutions**:
1. Verify hosts file entry: `cat /etc/hosts | grep celesteos`
2. Clear DNS cache:
   ```bash
   # macOS
   sudo dscacheutil -flushcache

   # Windows
   ipconfig /flushdns

   # Linux
   sudo systemd-resolve --flush-caches
   ```
3. Try alternative domain (`.test` or `.lan`)
4. Check for mDNS/Bonjour conflicts on `.local`

### Port Already in Use

**Problem**: Error "Port 8082 is already in use"

**Solutions**:
1. Find process using port:
   ```bash
   lsof -i :8082  # macOS/Linux
   netstat -ano | findstr :8082  # Windows
   ```
2. Kill the process or use different port:
   ```bash
   VITE_PORT=3000 npm run dev
   ```

### WebSocket/HMR Not Working

**Problem**: Hot reload broken when using reverse proxy

**Solutions**:
1. Verify proxy config includes WebSocket headers
2. Check browser console for WebSocket errors
3. Ensure proxy timeout is sufficient (> 60s)
4. Try accessing directly via port 8082 to isolate issue

### DHCP IP Changes

**Problem**: LAN IP changes after router restart

**Solutions**:
1. Set static IP in router DHCP settings
2. Use router's hostname feature if available
3. Update hosts file when IP changes
4. Consider using reverse proxy bound to 0.0.0.0

## Security Notes

- **Never commit** machine-specific configurations (hosts entries, local IPs)
- **Use firewall rules** to restrict access to trusted networks only
- **For production**, always use proper domain and SSL certificates
- **Self-signed certificates** are only for development

## Additional Resources

- [Vite Server Options](https://vitejs.dev/config/server-options.html)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Caddy Documentation](https://caddyserver.com/docs/)
- [mDNS and .local domains](https://en.wikipedia.org/wiki/.local)