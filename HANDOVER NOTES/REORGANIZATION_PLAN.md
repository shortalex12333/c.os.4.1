# CelesteOS Repository Reorganization Plan
## GitHub Best Practices Implementation

**Date**: 2025-09-29
**Goal**: Clean, maintainable structure for GitHub deployment

---

## Current Issues
1. ❌ **yacht-frontend/** - 359MB legacy React app (unused)
2. ❌ **Duplicate components** - `components/` and `figma-components/`
3. ❌ **Icon/icons duplication** - Two similar folders
4. ❌ **api/services split** - Unclear service boundaries
5. ❌ **Polluted root** - Many README files, config scattered

---

## New Structure (GitHub Best Practices)

```
/
├── .github/                  # GitHub workflows, templates
├── client/                   # Frontend application
│   ├── src/                  # All source code
│   │   ├── components/       # All components (merged)
│   │   │   ├── ui/          # shadcn/ui components
│   │   │   ├── layout/      # Layout components (Sidebar, Header)
│   │   │   ├── chat/        # Chat feature components
│   │   │   ├── email/       # Email feature components
│   │   │   ├── settings/    # Settings components
│   │   │   └── auth/        # Auth components
│   │   ├── services/        # All services (merged api/)
│   │   ├── hooks/           # React hooks
│   │   ├── contexts/        # React contexts
│   │   ├── utils/           # Utilities
│   │   ├── config/          # Configuration
│   │   ├── constants/       # Constants
│   │   ├── lib/             # Third-party integrations
│   │   ├── assets/          # Static assets
│   │   │   ├── icons/       # All icons (merged)
│   │   │   ├── fonts/       # Fonts
│   │   │   └── images/      # Images
│   │   └── styles/          # Global styles
│   ├── public/              # Public static files (MOVED FROM ROOT)
│   ├── index.html           # Entry HTML (MOVED FROM ROOT)
│   ├── main.tsx             # Entry point
│   └── vite.config.ts       # Vite config
│
├── server/                  # Backend application
│   ├── config/
│   ├── routes/
│   ├── services/
│   ├── scripts/
│   └── index.ts
│
├── supabase/                # Supabase migrations
│   └── migrations/
│
├── shared/                  # Shared types/utils between client/server
│   └── types/
│
├── docs/                    # All documentation
│   ├── DEPLOYMENT.md
│   ├── LAUNCH_README.md
│   ├── RLS_TROUBLESHOOTING.md
│   └── TEST_CREDENTIALS.md
│
├── scripts/                 # Build/deployment scripts
│   ├── launch_celesteos.py
│   ├── quick_start.sh
│   └── setup-shortest-url.sh
│
├── .gitignore
├── .prettierrc
├── .npmrc
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
└── README.md                # Main README only

```

---

## Migration Steps

### Phase 1: Remove Legacy (SAFE - No dependencies)
- [x] Remove `yacht-frontend/` (359MB)
- [ ] Remove old README files to `docs/`
- [ ] Remove `dev-proxy/` if unused
- [ ] Move scripts to `scripts/`

### Phase 2: Consolidate Components
- [ ] Move `figma-components/*` → `components/layout/`
- [ ] Merge `components/Icon/` + `components/icons/` → `assets/icons/`
- [ ] Update 2 import paths in AppFigma.tsx, SettingsEntry.tsx

### Phase 3: Consolidate Services
- [ ] Merge `client/api/` → `client/services/`
- [ ] Update import paths

### Phase 4: Restructure Client
- [ ] Move all `client/*` except public/main.tsx → `client/src/`
- [ ] Move `public/` → `client/public/`
- [ ] Move `index.html` → `client/index.html`
- [ ] Update vite.config.ts paths

### Phase 5: Clean Root
- [ ] Move docs to `docs/`
- [ ] Move scripts to `scripts/`
- [ ] Update .gitignore

### Phase 6: Update Configs
- [ ] Update all import paths
- [ ] Update vite.config.ts
- [ ] Update tsconfig.json
- [ ] Test build

---

## Files to Move

### To `docs/`:
- IMPLEMENTATION_NOTES.md
- LAUNCH_README.md
- LAUNCH_SCRIPTS_README.md
- README-dev.md
- RLS_TROUBLESHOOTING.md
- TEST_CREDENTIALS.md
- YACHT_DEPLOYMENT_CHECKLIST.md

### To `scripts/`:
- launch_celesteos.py
- quick_start.sh
- setup-shortest-url.sh
- deploy_main_tables.sql

### To Delete:
- yacht-frontend/ (if confirmed unused)
- dev-proxy/ (if confirmed unused)
- infra/mdns/ (if unused)
- api/ (empty after merge)

---

## Import Path Changes Required

1. `figma-components/` → `components/layout/`
   - AppFigma.tsx (6 imports)
   - SettingsEntry.tsx (1 import)

2. `components/icons/` or `components/Icon/` → `assets/icons/`
   - Find all icon imports and update

3. `api/` → `services/`
   - Find all api imports and update

---

## Safety Checks

✅ Git status clean
✅ Current site working
✅ Dependencies mapped
✅ No breaking external references

## Post-Migration Verification

1. `npm run dev` - Site loads
2. Login works
3. Chat works
4. Folder system works
5. Settings work
6. Build succeeds: `npm run build`

---

## Rollback Plan

Git commit before each phase:
```bash
git add .
git commit -m "Phase X: [description]"
```

To rollback: `git reset --hard HEAD~1`