# CelesteOS Launch Scripts Documentation

## Overview
Production-ready launch scripts for managing all CelesteOS services with automatic dependency resolution, health checks, and port management.

## Files
- `launch_celesteos.py` - Main orchestration script
- `services_config.json` - Service configuration
- `quick_start.sh` - Interactive bash launcher

## Important: Supabase Port Architecture

**Supabase uses Kong API Gateway on port 54321 as the main entry point:**
- **Port 54321**: Kong API Gateway (handles ALL API requests)
  - REST API: `http://127.0.0.1:54321/rest/v1/`
  - Auth API: `http://127.0.0.1:54321/auth/v1/`
  - Storage API: `http://127.0.0.1:54321/storage/v1/`
- **Port 54322**: PostgreSQL database (direct access)
- **Port 54323**: Supabase Studio (Web UI) - NOT the REST API!
- **Port 54324**: Inbucket (email testing)
- **Port 54327**: Analytics service

## Usage

### Start All Services
```bash
python3 launch_celesteos.py start
```

### Check Service Status
```bash
python3 launch_celesteos.py status
```

### Stop All Services
```bash
python3 launch_celesteos.py stop
```

### Interactive Menu
```bash
./quick_start.sh
```

## Service Dependencies

```
Podman Machine (Container Runtime)
    └── Supabase (All backend services)
            └── Vite Dev Server (Frontend)
                    └── Caddy HTTPS Proxy
                            └── mDNS Discovery
```

## Features

### Port Conflict Resolution
- Automatically detects port conflicts
- Offers to kill blocking processes
- Shows which process is using each port

### Health Monitoring
- Validates each service is running
- Tests health endpoints
- Verifies port availability

### Graceful Shutdown
- Stops services in reverse order
- Cleans up all processes on Ctrl+C
- Handles cleanup on script exit

## Access Points After Launch

- **Local Development**: http://localhost:8082
- **HTTPS Access**: https://celesteos.local
- **Supabase Studio**: http://localhost:54323
- **Supabase API Gateway**: http://localhost:54321
  - REST API: http://localhost:54321/rest/v1/
  - Auth API: http://localhost:54321/auth/v1/

## Troubleshooting

### Podman Machine Won't Start
```bash
# Check status
podman machine list

# If stuck, force stop and restart
podman machine stop -f
podman machine start
```

### Supabase Won't Start
```bash
# Check if containers are running
podman ps

# Force restart Supabase
supabase stop --no-backup
supabase start
```

### Port Already in Use
The script will detect this and offer to kill the blocking process. If you prefer manual control:
```bash
# Find what's using a port
lsof -i :PORT_NUMBER

# Kill the process
kill -9 PID
```

### Authentication Errors in App
Ensure Supabase is fully running:
```bash
# Test auth endpoint
curl http://127.0.0.1:54321/auth/v1/health

# Should return:
# {"version":"v2.177.0","name":"GoTrue","description":"GoTrue is a user registration and authentication API"}
```

## Configuration

Edit `services_config.json` to:
- Enable/disable services
- Modify port mappings
- Change health check intervals
- Adjust wait times

## Requirements

- Python 3.6+
- Podman (for containers)
- Supabase CLI
- Node.js & npm
- Caddy (for HTTPS)
- mkcert (for SSL certificates)

## Notes

- First run may take longer as Supabase downloads container images
- The script handles all service dependencies automatically
- All services are started in the correct order
- Health checks ensure services are ready before proceeding