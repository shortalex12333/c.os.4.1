# mDNS Service for CelesteOS

This directory contains the mDNS/Bonjour implementation that makes the CelesteOS frontend accessible at `http://celesteos.local` without any DNS or hosts file configuration.

## 🎯 What It Does

- Broadcasts `celesteos.local` on the local network using mDNS/Bonjour
- Auto-discovers the LAN IP address (no hardcoding)
- Works across all devices: Mac, iPad, iPhone, Windows, Android
- Survives network restarts and DHCP IP changes
- No manual configuration required on client devices

## 📁 Directory Structure

```
infra/mdns/
├── advertise-mdns.py       # Core mDNS advertisement script
├── install.sh              # Universal installer (detects OS)
├── macos/                  # macOS-specific files
│   ├── com.celesteos.mdns.plist  # LaunchAgent configuration
│   └── install.sh          # macOS installer
├── linux/                  # Linux-specific files
│   ├── celesteos-mdns.service    # Systemd service
│   ├── avahi-service.xml  # Avahi configuration
│   └── install.sh          # Linux installer
└── test/
    └── verify-mdns.sh      # Verification script
```

## 🚀 Quick Start

### One-Command Installation

```bash
# From project root
./infra/mdns/install.sh
```

This will:
1. Detect your operating system
2. Install required dependencies
3. Set up the mDNS service
4. Start broadcasting `celesteos.local`

### Manual Installation

#### macOS
```bash
./infra/mdns/macos/install.sh
```

#### Linux (requires sudo)
```bash
sudo ./infra/mdns/linux/install.sh
```

## 🔍 Verification

After installation, verify mDNS is working:

```bash
./infra/mdns/test/verify-mdns.sh
```

This will test:
- mDNS service discovery
- Hostname resolution
- HTTP accessibility
- Port connectivity

## 📱 Client Access

Once installed, any device on the same network can access the service at:

```
http://celesteos.local
```

### Supported Clients

- ✅ **macOS**: Safari, Chrome, Firefox
- ✅ **iOS/iPadOS**: Safari, Chrome
- ✅ **Windows 10+**: Edge, Chrome (Bonjour built-in)
- ✅ **Android**: Chrome, Firefox
- ✅ **Linux**: Any browser (with avahi-daemon)

## 🛠️ Troubleshooting

### Service Not Starting

**macOS:**
```bash
# Check service status
launchctl list | grep celesteos

# View logs
tail -f /tmp/celesteos-mdns.log

# Restart service
launchctl unload ~/Library/LaunchAgents/com.celesteos.mdns.plist
launchctl load ~/Library/LaunchAgents/com.celesteos.mdns.plist
```

**Linux:**
```bash
# Check service status
systemctl status celesteos-mdns

# View logs
journalctl -u celesteos-mdns -f

# Restart service
systemctl restart celesteos-mdns
```

### Hostname Not Resolving

1. **Check mDNS is running:**
   ```bash
   # macOS
   dns-sd -B _http._tcp local.

   # Linux
   avahi-browse -a -t
   ```

2. **Verify network connectivity:**
   ```bash
   ping celesteos.local
   ```

3. **Check firewall settings:**
   - Port 5353 (mDNS) must be open for UDP
   - Port 80 (HTTP) must be accessible

### Multiple Networks

If your device has multiple network interfaces:
- The service advertises on all interfaces
- Clients must be on the same subnet
- VPN connections may interfere

## 🔧 Configuration

### Change Hostname

Edit `advertise-mdns.py`:
```python
self.hostname = "celesteos"  # Change this
```

### Change Port

The service defaults to port 80. To use a different port:

```bash
# Edit the LaunchAgent/systemd service
# Change the port number in ProgramArguments
```

## 🚫 Uninstallation

### macOS
```bash
launchctl unload ~/Library/LaunchAgents/com.celesteos.mdns.plist
rm ~/Library/LaunchAgents/com.celesteos.mdns.plist
```

### Linux
```bash
systemctl stop celesteos-mdns
systemctl disable celesteos-mdns
rm /etc/systemd/system/celesteos-mdns.service
rm /etc/avahi/services/celesteos.service
systemctl daemon-reload
```

## 🔒 Security Notes

- mDNS only works on the local network (not internet-accessible)
- No authentication is provided by mDNS itself
- Service advertises on all network interfaces
- Use firewall rules to restrict access if needed

## 📚 Technical Details

### mDNS Protocol

- Uses multicast DNS (port 5353 UDP)
- Broadcasts on 224.0.0.251 (IPv4) and ff02::fb (IPv6)
- Service type: `_http._tcp`
- Implements RFC 6762 (mDNS) and RFC 6763 (DNS-SD)

### Dependencies

**Python:**
- `zeroconf` library (optional, falls back to native tools)

**macOS:**
- Built-in mDNSResponder (Bonjour)
- `dns-sd` command-line tool

**Linux:**
- `avahi-daemon` package
- `python3-zeroconf` (optional)

## 🤝 Contributing

To improve the mDNS implementation:

1. Test on various networks and devices
2. Report issues with specific OS/browser combinations
3. Add support for additional platforms (Windows native, etc.)
4. Improve error handling and logging

## 📝 License

Part of the CelesteOS project. See main project license.