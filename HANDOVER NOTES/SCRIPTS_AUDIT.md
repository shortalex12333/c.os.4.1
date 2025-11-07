# Scripts Audit - What's Outdated & What's Running

## Executive Summary

**Problem:** Launch scripts reference services that are NOT running and may be outdated.

**Currently Running:** ✅ Vite, Caddy, n8n, Supabase, mDNS
**Scripts Expect But NOT Running:** ❌ FastAPI (port 8000), Yacht Frontend (port 3000 npm)

---

## What's Actually Running Right Now

| Service | Port | Status | Process |
|---------|------|--------|---------|
| **Vite Dev Server** | 8082 | ✅ RUNNING | `node vite` |
| **Caddy Proxy** | 80 | ✅ RUNNING | `caddy run` |
| **n8n Workflows** | 5678 | ✅ RUNNING | `node n8n start` |
| **Supabase** | 54321, 54323, 8003 | ✅ RUNNING | `gvproxy` (Podman) |
| **mDNS Advertiser** | N/A | ✅ RUNNING | `dns-sd` |
| **Something Python** | 3000 | ⚠️ RUNNING | Unknown Python service |
| **FastAPI** | 8000 | ❌ NOT RUNNING | Expected by scripts |
| **Yacht Frontend (npm)** | 3000 | ❌ NOT RUNNING | Expected by scripts |

---

## Script Analysis

### 1. `scripts/launch_celesteos.py` ⚠️ **OUTDATED**

**Services it tries to start:**
```python
1. Podman Machine           ✅ Running
2. Supabase                 ✅ Running (via Podman)
3. n8n Workflow Automation  ✅ Running
4. FastAPI Document Processing  ❌ NOT RUNNING (port 8000)
5. Yacht Search Frontend    ⚠️ Port 3000 in use by Python, not npm
6. Vite Dev Server          ✅ Running
7. Caddy HTTPS Proxy        ✅ Running (but on HTTP port 80, not HTTPS)
8. mDNS Discovery           ✅ Running
```

**Issues:**
- ❌ **FastAPI (port 8000)** - Script expects it but it's not running
  - Location: `api/main.py`
  - Purpose: Document processing
  - **Question:** Is this service even needed anymore?

- ❌ **Yacht Frontend (port 3000)** - Script expects npm but Python is running
  - Location: `yacht-frontend/`
  - Script expects: `npm start` in yacht-frontend dir
  - Actually running: Python service on port 3000
  - **Conflict:** Port 3000 occupied by different service

- ⚠️ **Caddy HTTPS** - Script uses `Caddyfile-https` but currently running `Caddyfile-single-label`
  - Script expects: HTTPS on port 443
  - Actually running: HTTP on port 80
  - **Mismatch:** Configuration file doesn't match

---

### 2. `scripts/quick_start.sh` ⚠️ **PARTIALLY OUTDATED**

**Option 5 (Quick Mode):**
```bash
# Starts:
- npm run dev              ✅ Vite (correct)
- caddy Caddyfile-https    ⚠️ Wrong config (should be Caddyfile-single-label)
- mDNS on port 443         ⚠️ Wrong port (should be 80)
```

**Issues:**
- Uses HTTPS config but you're running HTTP
- mDNS advertises port 443 but Caddy is on port 80

---

### 3. `scripts/setup-shortest-url.sh` ⚠️ **OUTDATED**

**Purpose:** Setup `/etc/hosts` for `celesteos` hostname

**Issues:**
- ❌ **Suggests nginx** - Not using nginx (using Caddy)
- ⚠️ Suggests port-free access but requires firewall changes
- **Reality:** You're using `celesteos.local:8082` instead

**Status:** Informational only, not harmful but misleading

---

### 4. `scripts/backup_database.sh` ✅ **PROBABLY FINE**

Backs up Supabase database. Should still work if Supabase is running.

---

### 5. `scripts/restore_backup.sh` ✅ **PROBABLY FINE**

Restores Supabase database. Should still work.

---

### 6. `scripts/check_handover_data.sh` ✅ **PROBABLY FINE**

Checks handover data in database. Should still work.

---

### 7. `scripts/test_safe_restart.sh` ⚠️ **UNKNOWN**

Need to read this to assess.

---

## Missing Services - Should They Exist?

### FastAPI (port 8000)

**Location:** `/Users/celeste7/Documents/NEWSITE/api/`

**Expected behavior:** Document processing API

**Questions:**
- Is this service still needed?
- Was it replaced by n8n workflows?
- Should it be removed from launch scripts?

**Recommendation:**
- Check if `api/main.py` exists and is functional
- If not needed → Remove from `launch_celesteos.py`
- If needed → Figure out why it's not starting

---

### Yacht Frontend (port 3000)

**Location:** `/Users/celeste7/Documents/NEWSITE/yacht-frontend/`

**Expected behavior:** React app for yacht search UI

**Current situation:**
- Port 3000 occupied by Python service
- Not running via npm as scripts expect

**Questions:**
- Is this the same as the main Vite app on 8082?
- Is yacht-frontend a separate legacy service?
- Is the Python service on 3000 intentional?

**Recommendation:**
- Clarify if yacht-frontend is still needed
- If not → Remove from launch scripts
- If yes → Fix port conflict (Python vs npm)

---

## What's Currently Working (Don't Touch)

| Service | Config | Notes |
|---------|--------|-------|
| **Vite** | Port 8082 | Main dev server ✅ |
| **Caddy** | `Caddyfile-single-label` | HTTP on port 80 ✅ |
| **mDNS** | Port 80 | Broadcasting correctly ✅ |
| **n8n** | Port 5678 | Workflows ✅ |
| **Supabase** | Ports 54321, 54323 | Database + Auth ✅ |

**Access URLs that work:**
- `http://localhost:8082` ✅
- `http://celesteos.local:8082` ✅
- `http://192.168.1.44:8082` ✅

---

## Recommended Actions

### Immediate (Fix Scripts)

1. **Update `launch_celesteos.py`:**
   - Remove or comment out FastAPI service (lines 157-167)
   - Remove or fix yacht_frontend service (lines 170-179)
   - Change Caddy config to `Caddyfile-single-label` (line 127)
   - Change mDNS port from 443 to 80 (line 139)

2. **Update `quick_start.sh`:**
   - Change Caddy config to `Caddyfile-single-label` (line 106)
   - Change mDNS port from 443 to 80 (line 112)

3. **Archive or delete `setup-shortest-url.sh`:**
   - Misleading information
   - Not matching current setup

### Investigation Needed

1. **Check FastAPI status:**
   ```bash
   ls -la /Users/celeste7/Documents/NEWSITE/api/
   cat /Users/celeste7/Documents/NEWSITE/api/main.py
   ```
   - Determine if still needed
   - If yes → Why not running?
   - If no → Remove from scripts

2. **Check Yacht Frontend status:**
   ```bash
   ls -la /Users/celeste7/Documents/NEWSITE/yacht-frontend/
   lsof -i :3000
   ```
   - What's running on port 3000?
   - Is yacht-frontend needed?
   - Why port conflict?

3. **Check Python on port 3000:**
   ```bash
   lsof -i :3000 | grep Python
   ps aux | grep -E "python.*3000"
   ```
   - What service is this?
   - Is it documented anywhere?

---

## Documentation Gaps

**Services running but not documented anywhere:**
- ❓ Python service on port 3000 (not in any script)
- ❓ Supabase on port 8003 (not mentioned in access URLs)

**Services documented but not running:**
- ❌ FastAPI on port 8000
- ❌ Yacht Frontend (npm) on port 3000

---

## Summary

**Outdated Scripts:** 2 of 3 main scripts
**Phantom Services:** 2 (FastAPI, Yacht Frontend npm)
**Missing Documentation:** 1 (Python on 3000)

**Risk Level:** ⚠️ **MEDIUM**
- Scripts won't break current setup
- But they won't work if you try to use them
- Misleading for new developers

**Action Required:** Clean up launch scripts to match reality

---

**Next Steps:**
1. Want me to fix `launch_celesteos.py` to match what's actually running?
2. Want me to investigate what's on port 3000?
3. Want me to check if FastAPI is needed?
