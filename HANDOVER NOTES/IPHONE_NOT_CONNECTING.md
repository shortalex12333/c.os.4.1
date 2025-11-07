# iPhone Can't Access Mac - Troubleshooting

## Current State ✅

**Mac Configuration:**
- IP Address: `192.168.1.44`
- WiFi Interface: `en1`
- Subnet: `192.168.1.0/24`
- Caddy: Running on port 80 ✅
- Port 80: Accessible from Mac itself ✅

**Problem:** iPhone can't access `http://192.168.1.44` or `http://celesteos.local`

---

## Most Likely Causes

### 1. **macOS Firewall Blocking Incoming Connections** (Most Common)

#### Check Firewall:
1. Mac → System Settings → Network → Firewall
2. If Firewall is ON → It might be blocking Caddy

#### Fix Option A - Allow Caddy:
1. System Settings → Network → Firewall → Options
2. Find "caddy" in the list
3. Change to "Allow incoming connections" ✅

#### Fix Option B - Temporarily Disable Firewall (Testing Only):
1. System Settings → Network → Firewall
2. Turn OFF
3. Test iPhone again
4. **Turn back ON after testing!**

---

### 2. **iPhone on Different WiFi Network**

#### Verify iPhone WiFi:
On your iPhone:
1. Settings → WiFi
2. Check network name (must be same as Mac)
3. Tap the (i) icon next to network name
4. Check IP address

**What to look for:**
- ✅ IP starts with `192.168.1.x` → Same network
- ❌ IP starts with different numbers → Different network!
- ❌ "Guest" in WiFi name → Guest network (isolated)

**If different network:**
- iPhone needs to be on the SAME WiFi as Mac
- Move off "Guest WiFi" if applicable

---

### 3. **WiFi AP Isolation / Client Isolation Enabled**

Some routers prevent WiFi devices from talking to each other for security.

#### Check Router Settings:
(You said you can't change router, but check if someone else can)

1. Router admin page (usually http://192.168.1.1)
2. Look for:
   - "AP Isolation" → Should be OFF
   - "Client Isolation" → Should be OFF
   - "Wireless Isolation" → Should be OFF
   - "Guest Network Isolation" → If iPhone is on guest network

**If enabled:** This is your problem. Needs to be disabled.

---

### 4. **VPN or iCloud Private Relay on iPhone**

#### Disable These Temporarily:
1. iPhone → Settings → VPN → Turn OFF
2. iPhone → Settings → [Your Name] → iCloud → Private Relay → Turn OFF
3. Test again

---

## Immediate Tests to Run

### On Your Mac:

**Test 1: Check Firewall Status**
```bash
system_profiler SPFirewallDataType
```

**Test 2: Verify Caddy is Listening**
```bash
lsof -i :80 -n
```

**Test 3: Test Port 80 from Mac**
```bash
curl -v http://192.168.1.44
```

### On Your iPhone:

**Step 1: Verify WiFi Details**
- Settings → WiFi → Tap (i) next to network
- Note the IP address
- Should be `192.168.1.xxx` (where xxx is different from 44)

**Step 2: Try Safari**
- Open Safari (not Chrome)
- Type: `http://192.168.1.44`
- Wait 10 seconds

**Step 3: Try Chrome**
- Open Chrome
- Type: `http://192.168.1.44`

---

## Quick Diagnostics

### What's the iPhone IP Address?

**On iPhone:** Settings → WiFi → Tap (i) → Note IP Address

| iPhone IP | Diagnosis |
|-----------|-----------|
| `192.168.1.xxx` | ✅ Same network, likely firewall issue |
| `192.168.0.xxx` | ❌ Different subnet, wrong network |
| `10.0.0.xxx` | ❌ Different network |
| `172.16.xxx.xxx` | ❌ Different network or VPN |

---

## Most Likely Fix

**Based on symptoms, this is probably macOS Firewall blocking Caddy.**

### Solution:

1. **Open System Settings on Mac**
2. **Go to: Network → Firewall**
3. **If Firewall is ON:**
   - Click "Options..."
   - Look for "caddy" in the app list
   - Set to: "Allow incoming connections" ✅
4. **Test iPhone again**

---

## Alternative: Use Different Port

If port 80 is blocked by firewall but you can't change settings:

### On Mac:
```bash
# Stop current Caddy
pkill caddy

# Start Caddy on port 8080 instead (usually not blocked)
caddy run --config dev-proxy/Caddyfile-single-label --adapter caddyfile --envfile <(echo "HTTP_PORT=8080") &
```

### On iPhone:
```
http://192.168.1.44:8080
```

Port 8080 is less likely to be blocked by macOS Firewall.

---

## If Nothing Works

### Last Resort Test - Vite Direct Access:

**On Mac:**
Check if Vite allows LAN access:
```bash
# Check vite.config.ts has:
# server: { host: '0.0.0.0' }
```

**On iPhone:**
```
http://192.168.1.44:8082
```

This bypasses Caddy entirely.

---

## Summary Checklist

Run through this in order:

- [ ] Verify iPhone WiFi IP is `192.168.1.xxx`
- [ ] Check Mac Firewall allows "caddy" incoming connections
- [ ] Disable iPhone VPN / iCloud Private Relay
- [ ] Test `http://192.168.1.44` in Safari on iPhone
- [ ] If still fails, check router AP Isolation
- [ ] Last resort: Try `http://192.168.1.44:8082` (direct Vite)

---

## Expected Result

Once fixed, iPhone should load your app in **1-2 seconds** at:
```
http://192.168.1.44
```

---

**Need to check right now:** What is your iPhone's IP address?
(Settings → WiFi → Tap (i) next to network name)
