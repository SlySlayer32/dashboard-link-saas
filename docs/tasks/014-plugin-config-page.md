# Task 014: Create Plugin Configuration Page

## Goal
Implement the plugin management page for configuring external integrations

## Context
Admins need to enable, disable, and configure external plugins like Google Calendar, Airtable, and Notion to sync data with worker dashboards.

## Files to Create/Modify
- `apps/admin/src/pages/PluginsPage.tsx` - Plugin management interface
- `apps/admin/src/components/PluginCard.tsx` - Individual plugin card
- `apps/admin/src/components/PluginConfigForm.tsx` - Plugin configuration form
- `apps/admin/src/components/GoogleCalendarConfig.tsx` - Google OAuth setup

## Dependencies
- Task 004: Organizations API (for storing plugin configs)

## Acceptance Criteria
- [ ] Shows list of available plugins (Manual, Google Calendar, Airtable, Notion)
- [ ] Enable/disable toggle for each plugin
- [ ] Configuration forms for each plugin type
- [ ] Google Calendar OAuth flow
- [ ] Airtable API key and base selection
- [ ] Notion integration secret and database selection
- [ ] Test connection button for each plugin
- [ ] Status indicator (connected/disconnected)
- [ ] Save/remove configuration actions

## Implementation Details
- Use OAuth2 for Google Calendar
- Store encrypted credentials in database
- Show plugin documentation links
- Add webhook URLs for plugins that support them
- Include field mapping configuration

## Test Checklist
- [ ] Plugins list loads correctly
- [ ] Enable/disable saves properly
- [ ] Google OAuth opens popup
- [ ] Test connection validates credentials
- [ ] Configurations persist after reload
- [ ] Error messages show for invalid configs

---

## Completion Log
- **Started**: Dec 23, 2025
- **Completed**: Dec 23, 2025
- **AI Assistant**: Cascade
- **Review Status**: completed
