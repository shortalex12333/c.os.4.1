# CelesteOS Launch System README

## Launch File
**Primary Launch Script:** `launch_celesteos.py`

Execute with: `python3 launch_celesteos.py`

## Service Architecture & Port Mapping

### Core Services (Launch Order)

1. **Podman Machine** - Container Runtime
   - **Ports:** None (system service)
   - **Description:** Required for Supabase containerized services
   - **Status Check:** `podman machine info | grep 'machinestate: Running'`
   - **Critical:** Yes

2. **Supabase Backend Services** - Database & Auth
   - **Ports:**
     - `54321` - API Gateway (REST/Auth endpoints)
     - `54322` - PostgreSQL Database
     - `54323` - Supabase Studio (Web UI)
     - `54324` - Inbucket (Email testing)
     - `54327` - Analytics
   - **Health Endpoint:** `http://127.0.0.1:54321/auth/v1/health`
   - **Depends On:** Podman Machine
   - **Critical:** Yes

3. **n8n Workflow Automation** - Webhook Processing
   - **Port:** `5678`
   - **Health Endpoint:** `http://localhost:5678`
   - **Depends On:** Supabase
   - **Critical:** Yes

4. **FastAPI Document Processing** - AI Document Search
   - **Port:** `8000`
   - **Health Endpoint:** `http://localhost:8000/health`
   - **Depends On:** Supabase
   - **Critical:** Yes

5. **Yacht Search Frontend** - React App
   - **Port:** `3000`
   - **Health Endpoint:** `http://localhost:3000`
   - **Depends On:** FastAPI
   - **Critical:** No (optional service)

6. **Vite Dev Server** - Main CelesteOS Frontend
   - **Port:** `8082`
   - **Health Endpoint:** `http://localhost:8082`
   - **Critical:** Yes

7. **Caddy HTTPS Proxy** - Reverse Proxy
   - **Ports:**
     - `80` - HTTP
     - `443` - HTTPS
     - `2019` - Admin API
   - **Health Endpoint:** `https://celesteos.local`
   - **Depends On:** Vite
   - **Critical:** No (HTTPS optional)

8. **mDNS Discovery** - Network Service Discovery
   - **Ports:** None (broadcasts on network)
   - **Service:** `advertise-mdns.py`
   - **Depends On:** Caddy
   - **Critical:** No (LAN access optional)

## Access Points

- **Main Application (HTTP):** http://localhost:8082
- **Main Application (HTTPS):** https://celesteos.local
- **Document Search API:** http://localhost:8000
- **Yacht Search App:** http://localhost:3000
- **Workflow Automation:** http://localhost:5678
- **Database Admin:** http://localhost:54323
- **API Gateway:** http://localhost:54321
  - REST API: `http://localhost:54321/rest/v1/`
  - Auth API: `http://localhost:54321/auth/v1/`

## System Requirements Questions - Current Status

### Minimum macOS Version
**UNSURE** - Not explicitly tested across macOS versions. Current development on macOS 14.5.0 (Darwin 24.5.0).

**Estimated:** Likely macOS 12+ due to:
- Python 3.9+ requirement
- Modern Node.js/npm versions
- Docker/Podman containerization

### Background Services
**YES** - Multiple background services run:

**Default Ports (in order of preference):**
- `54321` - Supabase API Gateway (primary backend)
- `8082` - Vite dev server (main frontend)
- `5678` - n8n workflows
- `8000` - FastAPI document processing
- `3000` - Yacht search frontend
- `443/80` - Caddy HTTPS proxy
- `54322-54327` - Additional Supabase services

### Network/System Extension Needs
**NO** explicit VPN/proxy/endpoint security requirements identified.

**However:**
- Caddy creates local HTTPS certificates (mkcert)
- mDNS broadcasts on local network
- May need network permissions for local service discovery

### Install Path
**UNSURE** - Currently runs from development directory.

**Current:** `/Users/celeste7/Documents/NEWSITE/`

**Production considerations not defined:**
- CLI tools location: Unknown
- Application bundle structure: Not determined
- System vs user installation: Not specified

### Distribution Path
**UNSURE** - No distribution strategy currently defined.

**Current:** Manual development setup only
- No MDM integration planned
- No automated deployment scripts
- Manual dependency installation required

### Auto-update Strategy
**NOT IMPLEMENTED** - No auto-update mechanism exists.

**Current state:**
- Manual git pulls for updates
- No version management system
- No automated dependency updates
- No update notification system

## Dependencies Required

### System Dependencies
- Python 3.9+
- Node.js 18+
- npm
- Podman or Docker
- Supabase CLI

### Python Packages
See `api/requirements.txt`:
- FastAPI, uvicorn
- pandas, numpy
- transformers, torch
- PyMuPDF, pytesseract
- ChromaDB (if document indexing enabled)

### Node.js Packages
- See `package.json` (main app)
- See `yacht-frontend/package.json` (yacht search)

## Launch Commands

```bash
# Full system launch
python3 launch_celesteos.py

# Individual commands
python3 launch_celesteos.py start    # Start all services
python3 launch_celesteos.py stop     # Stop all services
python3 launch_celesteos.py status   # Health check
python3 launch_celesteos.py restart  # Restart all services
```

## Service Management

Services are managed via the `CelesteOSLauncher` class with:
- Dependency chain enforcement
- Port conflict detection and resolution
- Health monitoring with timeouts
- Graceful shutdown on Ctrl+C
- Automatic process cleanup

## Configuration Files

- **`services_config.json`** - Service definitions and ports
- **`launch_celesteos.py`** - Main orchestration script
- **`dev-proxy/Caddyfile-https`** - HTTPS proxy configuration
- **`supabase/config.toml`** - Supabase local configuration

## Known Limitations

1. **Development Mode Only** - Not production-ready packaging
2. **Port Conflicts** - Manual resolution required if ports occupied
3. **Dependency Order** - Services must start in specific sequence
4. **Resource Usage** - Multiple services consume significant CPU/memory
5. **Network Dependencies** - Requires multiple localhost ports available

## Troubleshooting

**If services fail to start:**
1. Check port availability: `lsof -i :PORT_NUMBER`
2. Verify dependencies installed
3. Check Supabase status: `supabase status`
4. Review service logs in terminal output

**If authentication fails:**
- Ensure Supabase is running on port 54321
- Check test credentials in `TEST_CREDENTIALS.md`
- Verify auth endpoint: `curl http://127.0.0.1:54321/auth/v1/health`