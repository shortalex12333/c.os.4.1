# CelesteOS Bridge Documentation Index

This directory contains all technical documentation for the CelesteOS Bridge project.

## Quick Start

**New to the project?** Start here:
1. Read [../README_COMPREHENSIVE.md](../README_COMPREHENSIVE.md) - Complete project overview
2. Review [SETUP_GUIDE.md](#setup-guide) - Installation and configuration
3. Explore [ARCHITECTURE_OVERVIEW.md](#architecture) - System design

## Documentation Structure

### 📁 `/architecture` - System Architecture

Core system design and data flow documentation:

- **ASK_AI_DATA_FLOW.md** - Ask AI feature architecture and data flow
- **ASK_AI_IMPLEMENTATION_PLAN.md** - Implementation plan for Ask AI
- **ASK_AI_INTEGRATION_GUIDE.md** - Integration guide for Ask AI feature
- **ASK_AI_SUMMARY.md** - Summary of Ask AI implementation
- **ASK_AI_WORKFLOW_SIMPLIFIED.md** - Simplified workflow documentation
- **YACHT_VS_EMAIL_HANDOVER_ARCHITECTURE.md** - Architecture comparison of yacht search vs email search with handover feature

**Key Concepts:**
- RAG (Retrieval-Augmented Generation) pipeline
- n8n workflow orchestration
- Database schema and relationships
- Authentication flow

### 📁 `/features` - Feature Documentation

Detailed documentation for each major feature:

#### SOP Creation Feature (Latest)
- **SOP_CREATION_IMPLEMENTATION.md** - Overview of SOP creation feature
- **SOP_EDITOR_INTEGRATION.md** - SOP editor integration details
- **SOP_CANVAS_INTEGRATION.md** - Canvas editor implementation
- **SOP_INTEGRATION_FAILURE_REPORT.md** - Known issues and troubleshooting

#### Email Search Feature
- **EMAIL_RAG_V4_COMPLETE_SUMMARY.md** - Complete Email Search V4 implementation
- **EMAIL_RAG_V4_INTEGRATION_GUIDE.md** - Integration guide for email search
- **FRONTEND_EMAIL_RAG_CHANGES.md** - Frontend changes for email feature
- **EMAIL_HANDOVER_SYSTEM.md** - Email handover feature documentation
- **HANDOVER_MODAL_INTEGRATION.md** - Handover modal UI integration
- **README_OUTLOOK_RAG.md** - Outlook integration specific docs

#### Yacht Search & UI
- **DOCUMENT_SEARCH_IMPLEMENTATION_SUMMARY.md** - Document search implementation
- **DOCUMENT_SEARCH_TEST_PLAN.md** - Test plan for document search
- **DOCUMENT_SEARCH_UX_ANALYSIS.md** - UX analysis
- **DOCUMENT_SEARCH_UX_FIX.md** - UX improvements and fixes
- **FRONTEND_CHANGES_IMPLEMENTED.md** - General frontend changes

### 📁 `/bugfixes` - Bug Fixes and Patches

Documentation of issues resolved and their solutions:

- **BUGFIXES_EMAIL_LINKS_HANDOVER.md** - Email link and handover bugfixes
- **TRANSFORM_NODE_FIX_SUMMARY.md** - n8n transform node fixes
- **TRANSFORM_NODE_FIX_NODE_REFERENCES.md** - Node reference fixes
- **TRANSFORM_NODE_UPDATED_FOR_REAL_API.md** - Transform node API updates
- **WEBHOOK_URL_FIX.md** - Webhook URL configuration fixes
- **FALLBACK_LOGIC_IMPROVEMENT.md** - Webhook fallback logic improvements

**OAuth & Authentication:**
- **TOKEN_REFRESH_IMPLEMENTATION.md** - Token refresh implementation
- **TOKEN_REFRESH_DELIVERABLES.md** - Token refresh deliverables
- **TOKEN_REFRESH_TEST_REPORT.md** - Test report for token refresh

**n8n Pipeline Fixes:**
- **PIPELINE_ECHO_FIX.md** - Pipeline echo issue resolution
- **PIPELINE_FIX_ENTITIES_IN_OUTPUT.md** - Entity extraction fixes

**Outlook Integration:**
- **OUTLOOK_DEEPLINK_FIX.md** - Outlook deep link fixes
- **OUTLOOK_HANDOVER_GENERATOR.js** - Handover generation script
- **OUTLOOK_RAG_TRANSFORM.js** - RAG transform script
- **DOCUMENT_RAG_TRANSFORM.js** - Document RAG transform

### 📁 `/deployment` - Deployment Guides

Production deployment and integration documentation:

- **VERCEL_SETUP.md** - Vercel deployment configuration
- **INTEGRATION_COMPLETE.md** - Integration completion summary
- **INTEGRATION_FINAL_SUMMARY.md** - Final integration summary
- **INTEGRATION_PLAN.md** - Original integration plan
- **INSTALLATION_INSTRUCTIONS.md** - Installation guide
- **DEPLOYMENT_COMPLETE.md** - Deployment completion checklist

### 📁 `/n8n_workflows` - n8n Workflow Definitions

n8n automation workflow JSON exports:

- **n8n_email_search_final_workflow.json** - Production email search workflow
- **n8n_search_mode_test_cases.json** - Test cases for search modes
- **WORKFLOW_CREATION_SUMMARY.md** - Workflow creation guide

**Import Instructions:**
1. Open n8n at `http://localhost:5678`
2. Click "Workflows" → "Import from File"
3. Select JSON file from this directory
4. Configure webhook URLs and credentials
5. Activate workflow

### 📄 Root Documentation Files

**Essential Guides:**
- **DATABASE_GUIDE.md** - Complete database schema and setup
- **JSON_PACKAGE_QUICK_REFERENCE.md** - Quick reference for JSON packages
- **RLS_TROUBLESHOOTING.md** - Row Level Security troubleshooting
- **TEST_CREDENTIALS.md** - Test user credentials (DO NOT COMMIT TO GIT)

**Legacy Documentation:**
- **IMPLEMENTATION_NOTES.md** - Early implementation notes
- **LAUNCH_README.md** - Original launch documentation
- **LAUNCH_SCRIPTS_README.md** - Launch script documentation
- **README-dev.md** - Development setup (legacy)
- **YACHT_DEPLOYMENT_CHECKLIST.md** - Yacht-specific deployment

---

## Documentation by Task

### I need to...

#### Set up the project locally
1. [INSTALLATION_INSTRUCTIONS.md](deployment/INSTALLATION_INSTRUCTIONS.md)
2. [DATABASE_GUIDE.md](DATABASE_GUIDE.md)
3. [RLS_TROUBLESHOOTING.md](RLS_TROUBLESHOOTING.md)

#### Understand the architecture
1. [YACHT_VS_EMAIL_HANDOVER_ARCHITECTURE.md](architecture/YACHT_VS_EMAIL_HANDOVER_ARCHITECTURE.md)
2. [ASK_AI_DATA_FLOW.md](architecture/ASK_AI_DATA_FLOW.md)
3. [DATABASE_GUIDE.md](DATABASE_GUIDE.md)

#### Work on SOP Creation feature
1. [SOP_CREATION_IMPLEMENTATION.md](features/SOP_CREATION_IMPLEMENTATION.md)
2. [SOP_EDITOR_INTEGRATION.md](features/SOP_EDITOR_INTEGRATION.md)
3. [SOP_CANVAS_INTEGRATION.md](features/SOP_CANVAS_INTEGRATION.md)
4. [SOP_INTEGRATION_FAILURE_REPORT.md](features/SOP_INTEGRATION_FAILURE_REPORT.md)

#### Work on Email Search
1. [EMAIL_RAG_V4_COMPLETE_SUMMARY.md](features/EMAIL_RAG_V4_COMPLETE_SUMMARY.md)
2. [README_OUTLOOK_RAG.md](features/README_OUTLOOK_RAG.md)
3. [EMAIL_HANDOVER_SYSTEM.md](features/EMAIL_HANDOVER_SYSTEM.md)

#### Deploy to production
1. [VERCEL_SETUP.md](deployment/VERCEL_SETUP.md)
2. [DEPLOYMENT_COMPLETE.md](deployment/DEPLOYMENT_COMPLETE.md)
3. [YACHT_DEPLOYMENT_CHECKLIST.md](YACHT_DEPLOYMENT_CHECKLIST.md)

#### Debug webhooks
1. [WEBHOOK_URL_FIX.md](bugfixes/WEBHOOK_URL_FIX.md)
2. [FALLBACK_LOGIC_IMPROVEMENT.md](bugfixes/FALLBACK_LOGIC_IMPROVEMENT.md)
3. [n8n_workflows/](n8n_workflows/) - Import and review workflows

#### Fix authentication issues
1. [TOKEN_REFRESH_IMPLEMENTATION.md](bugfixes/TOKEN_REFRESH_IMPLEMENTATION.md)
2. [TOKEN_REFRESH_TEST_REPORT.md](bugfixes/TOKEN_REFRESH_TEST_REPORT.md)
3. [RLS_TROUBLESHOOTING.md](RLS_TROUBLESHOOTING.md)

---

## Contributing to Documentation

### Documentation Standards

1. **File Naming**: Use SCREAMING_SNAKE_CASE for all docs (e.g., `MY_FEATURE_GUIDE.md`)
2. **Structure**: Include Table of Contents for docs > 100 lines
3. **Code Examples**: Use proper syntax highlighting
4. **Screenshots**: Store in `/docs/images/` directory
5. **Links**: Use relative paths for internal links

### When to Create New Documentation

**Create a new doc when:**
- Implementing a major feature (> 500 lines of code)
- Fixing a critical bug that required significant investigation
- Making architectural changes
- Adding new integrations or dependencies

**Update existing docs when:**
- Fixing minor bugs
- Making incremental improvements
- Updating configuration

### Documentation Template

```markdown
# Feature/Fix Name

## Overview
Brief description of what this document covers.

## Problem Statement
What problem does this solve?

## Solution
How was it solved?

## Implementation Details
Technical details, code snippets, architecture diagrams.

## Testing
How to test this feature/fix.

## Known Issues
Any limitations or known problems.

## Future Improvements
What could be improved in the future.

## Related Documents
Links to related documentation.
```

---

## Maintenance

**Documentation Owner**: Development Team
**Last Updated**: November 2025
**Next Review**: When major features are added or deprecated

### Regular Maintenance Tasks

- [ ] Review and update outdated documentation quarterly
- [ ] Archive deprecated feature docs to `/docs/archive/`
- [ ] Ensure all new features have corresponding documentation
- [ ] Keep README_COMPREHENSIVE.md in sync with latest changes

---

## Questions?

If you can't find what you're looking for:

1. Check the [main README](../README_COMPREHENSIVE.md)
2. Search across all docs: `grep -r "keyword" docs/`
3. Review git history for relevant commits
4. Check n8n workflow comments for business logic
5. Review Supabase dashboard for schema details

**Missing documentation?** Please create it following the standards above.
