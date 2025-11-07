# Scripts Fixed - Summary of Changes

## Files Modified ✅

### 1. `scripts/launch_celesteos.py`

**Changes made:**

#### Caddy Service (Lines 123-133)
```python
# BEFORE:
name="Caddy HTTPS Proxy"
ports=[80, 443]
start_command="caddy run --config dev-proxy/Caddyfile-https"

# AFTER:
name="Caddy HTTP Proxy"
ports=[80]
start_command="caddy run --config dev-proxy/Caddyfile-single-label"
```

#### mDNS Service (Lines 135-144)
```python
# BEFORE:
start_command="python3 infra/mdns/advertise-mdns.py 443"

# AFTER:
start_command="python3 infra/mdns/advertise-mdns.py 80"
```

#### Token Counter Service (Lines 157-166) - ADDED
```python
self.services["token_counter"] = Service(
    name="Token Counter Service",
    ports=[3000],
    start_command="python3 token_counter_service.py",
    check_command="curl -s -o /dev/null -w '%{http_code}' http://localhost:3000",
    health_endpoint="http://localhost:3000",
    cwd=str(self.base_dir),
    wait_time=3
)
```

#### FastAPI Service (Lines 168-179) - DISABLED
```python
# BEFORE: Active service
# AFTER: Commented out with note:
# FastAPI Document Processing - DISABLED (not currently in use)
# NOTE: Uncomment if needed, but verify api/main.py exists first
```

#### Yacht Frontend Service (Lines 181-192) - DISABLED
```python
# BEFORE: Active service on port 3000
# AFTER: Commented out with note:
# Yacht Search Frontend - DISABLED (port 3000 used by token_counter)
# NOTE: If needed, change to different port or stop token_counter
```

#### Service Order (Line 391)
```python
# BEFORE:
service_order = ["podman", "supabase", "n8n", "fastapi", "yacht_frontend", "vite", "caddy", "mdns"]

# AFTER:
service_order = ["podman", "supabase", "n8n", "token_counter", "vite", "caddy", "mdns"]
```

#### Access URLs (Lines 408-418)
```python
# BEFORE:
"✓ HTTPS Access: https://celesteos.local"
"✓ FastAPI Document Processing: http://localhost:8000"
"✓ Yacht Search Frontend: http://localhost:3000"

# AFTER:
"✓ LAN Access (Apple devices): http://celesteos.local:8082"
"✓ LAN Access (All devices): http://192.168.1.44:8082"
"✓ Token Counter Service: http://localhost:3000"
```

---

### 2. `scripts/quick_start.sh`

**Changes made:**

#### Caddy Start Command (Lines 104-108)
```bash
# BEFORE:
echo "Starting Caddy HTTPS proxy..."
caddy run --config dev-proxy/Caddyfile-https &

# AFTER:
echo "Starting Caddy HTTP proxy..."
caddy run --config dev-proxy/Caddyfile-single-label &
```

#### mDNS Start Command (Lines 110-113)
```bash
# BEFORE:
python3 infra/mdns/advertise-mdns.py 443 &

# AFTER:
python3 infra/mdns/advertise-mdns.py 80 &
```

#### Access URLs (Lines 115-119)
```bash
# BEFORE:
"• https://celesteos.local"

# AFTER:
"• http://celesteos.local:8082 (Apple devices)"
"• http://192.168.1.44:8082 (All devices)"
```

---

## What Now Matches Reality ✅

### Services in Script = Services Running
- ✅ Podman (container runtime)
- ✅ Supabase (database + auth)
- ✅ n8n (workflows)
- ✅ Token Counter Service (port 3000)
- ✅ Vite (dev server, port 8082)
- ✅ Caddy (HTTP proxy, port 80)
- ✅ mDNS (broadcasting on port 80)

### Services Removed from Scripts
- ❌ FastAPI (port 8000) - Commented out, not running
- ❌ Yacht Frontend npm (port 3000) - Commented out, conflicts with token_counter

### Configuration Matches
- ✅ Caddy uses `Caddyfile-single-label` (HTTP, not HTTPS)
- ✅ mDNS advertises port 80 (not 443)
- ✅ Access URLs show correct ports and hostnames

---

## Testing the Scripts

### Test launch_celesteos.py
```bash
cd /Users/celeste7/Documents/NEWSITE

# Check status of currently running services
python3 scripts/launch_celesteos.py status

# Start all services (will skip already running ones)
python3 scripts/launch_celesteos.py start

# Stop all services
python3 scripts/launch_celesteos.py stop
```

### Test quick_start.sh
```bash
cd /Users/celeste7/Documents/NEWSITE

# Run quick start menu
bash scripts/quick_start.sh

# Choose option 5 for quick mode (Vite + Caddy + mDNS only)
```

---

## Expected Behavior After Running Scripts

### Services That Will Start
1. **Podman Machine** (if not running)
2. **Supabase** (if not running)
3. **n8n** (if not running)
4. **Token Counter** (if not running)
5. **Vite Dev Server** (if not running)
6. **Caddy HTTP Proxy** (if not running)
7. **mDNS Discovery** (if not running)

### Access Points
```
✓ Local Development: http://localhost:8082
✓ LAN Access (Apple devices): http://celesteos.local:8082
✓ LAN Access (All devices): http://192.168.1.44:8082
✓ Token Counter Service: http://localhost:3000
✓ n8n Workflow UI: http://localhost:5678
✓ Supabase Studio: http://localhost:54323
✓ Supabase API: http://localhost:54321
  - REST: http://localhost:54321/rest/v1/
  - Auth: http://localhost:54321/auth/v1/
```

---

## If You Need Disabled Services

### To Re-enable FastAPI
1. Verify `api/main.py` exists and works
2. Uncomment lines 168-179 in `launch_celesteos.py`
3. Add "fastapi" to `service_order` list
4. Update access URLs to include port 8000

### To Re-enable Yacht Frontend
1. Stop token_counter or change it to different port
2. Uncomment lines 181-192 in `launch_celesteos.py`
3. Add "yacht_frontend" to `service_order` list
4. Verify `yacht-frontend/package.json` has start script

---

## Files NOT Modified

These scripts were left unchanged:
- `scripts/backup_database.sh` ✅ Still valid
- `scripts/restore_backup.sh` ✅ Still valid
- `scripts/check_handover_data.sh` ✅ Still valid
- `scripts/test_safe_restart.sh` ⚠️ Not audited yet
- `scripts/setup-shortest-url.sh` ⚠️ Outdated but harmless

---

## Summary

**Status:** ✅ Scripts now match running services

**Changes:**
- Fixed Caddy config path (HTTPS → HTTP)
- Fixed mDNS port (443 → 80)
- Added token_counter service
- Disabled FastAPI (not running)
- Disabled yacht_frontend npm (port conflict)
- Updated access URLs to match reality

**No Breaking Changes:**
- Scripts won't affect currently running services
- Commented out services can be re-enabled if needed
- All changes are documented inline with comments

---

**Last Updated:** 2025-10-07
**Scripts Version:** 2.0 (Reality-aligned)
