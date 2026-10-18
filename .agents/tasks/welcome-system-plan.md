# Implementation Plan: Welcome System Features

## Overview
Implement 4 major features cho Discord bot tại `d:\projects\code`:
1. Welcome/Goodbye Generator với AI (Groq)
2. Event Test Command
3. Settings Command với select menu
4. UI Upgrade & Bug Fixes cho welcome system

## Project Context

**Build System:** TypeScript compiler với `npm run build`  
**Test:** Manual testing in Discord (no automated tests)  
**Pattern:** Module-based architecture, mỗi module có `entry_point.ts` + `metadata.json`  
**UI:** Components V2 (ContainerBuilder) thay vì old embeds  
**AI:** Groq SDK với keyRotator for API key management  

**Key Files:**
- `src/modules/server-generator-module/entry_point.ts` - Reference pattern cho AI generator
- `src/config/emojis.ts` - Custom emoji definitions
- `src/utils/aiKeyRotator.ts` - AI API key rotation
- `data/welcome-config.json` - Current welcome configuration

---

## Feature 1: Welcome/Goodbye Generator (AI-powered)

### Files to Create
- `src/modules/welcome-generator-module/entry_point.ts` - Main module
- `src/modules/welcome-generator-module/designValidator.ts` - Validation logic
- `src/modules/welcome-generator-module/metadata.json` - Module metadata
- `data/welcome-designs.json` - Store generated designs

### Implementation Steps

- [ ] 1. Create module structure and base class
      **Files:** `src/modules/welcome-generator-module/entry_point.ts`
      - Create WelcomeGeneratorModule class extending base pattern
      - Register `/welcome-generator` command (admin only) with prompt option
      - Setup Groq client using keyRotator.getGroqKey()
      **Verify:** `npm run build` completes, bot starts without errors

- [ ] 2. Implement AI prompt engineering and response handling
      **Files:** `src/modules/welcome-generator-module/entry_point.ts`
      - Create system prompt for welcome/goodbye embed generation
      - Model: 'openai/gpt-oss-120b' (same as server-generator)
      - Response format: JSON với {type, title, description, color, thumbnail, fields, footer}
      - Add modal for prompt input following server-generator's promptModal pattern
      **Verify:** Modal appears on command, accepts input

- [ ] 3. Create design validator
      **Files:** `src/modules/welcome-generator-module/designValidator.ts`
      - Validate JSON structure from AI response
      - Auto-fix invalid hex colors, URLs
      - Ensure required fields (type, title, description)
      - Export validateDesign(raw) function
      **Verify:** Can parse and validate sample JSON without errors

- [ ] 4. Build Components V2 preview UI
      **Files:** `src/modules/welcome-generator-module/entry_point.ts`
      - Show generated design in ContainerBuilder card
      - Recreate embed preview following design specs
      - Add buttons: 'Save to Server', 'Regenerate', 'Export JSON'
      - Follow server-generator's buildDesignView pattern
      **Verify:** Preview card displays with working buttons

- [ ] 5. Implement 'Save to Server' action
      **Files:** `src/modules/welcome-generator-module/entry_point.ts`, create `data/welcome-designs.json`
      - Write design to data/welcome-designs.json: {guildId: {welcome: {...}, goodbye: {...}}}
      - Initialize file if not exists with {}
      - Show success message with next steps
      **Verify:** File created/updated after save, contains valid JSON

- [ ] 6. Implement 'Regenerate' and 'Export JSON' actions
      **Files:** `src/modules/welcome-generator-module/entry_point.ts`
      - Regenerate: Show modal again with pre-filled prompt
      - Export: Send JSON file to user's DM
      - Follow server-generator's dm/json button patterns
      **Verify:** Regenerate shows modal, Export sends DM with file

- [ ] 7. Add error handling and metadata
      **Files:** `src/modules/welcome-generator-module/metadata.json`, entry_point.ts
      - Handle AI failures, rate limits (use keyRotator.markFailed)
      - Handle invalid JSON from AI (show user-friendly error)
      - Create metadata.json: priority 14, type 1, slashCommands ['/welcome-generator']
      **Verify:** Bot handles errors gracefully, shows error messages in UI

---

## Feature 2: Event Test Command

### Files to Modify
- `src/modules/utility/entry_point.ts` - Add command here
- `src/modules/utility/metadata.json` - Update command list

### Implementation Steps

- [ ] 1. Add /event-test command to utility module
      **Files:** `src/modules/utility/entry_point.ts`
      - Register SlashCommandBuilder with name 'event-test'
      - Options: event (choice: welcome|goodbye|giveaway-end|level-up), user (optional)
      - Permission: Administrator only
      **Verify:** Command appears in Discord after build

- [ ] 2. Implement welcome event test
      **Files:** `src/modules/utility/entry_point.ts`
      - Read data/welcome-config.json for guild
      - Check data/welcome-designs.json for custom design
      - Build Components V2 card matching welcome embed pattern
      - Add header: '-# 🧪 TEST MODE - This is a test preview'
      - Send as ephemeral reply
      **Verify:** /event-test event:welcome shows test welcome message

- [ ] 3. Implement goodbye event test
      **Files:** `src/modules/utility/entry_point.ts`
      - Read data/goodbye-config.json (create structure if needed)
      - Build goodbye embed with test data
      - Follow same pattern as welcome
      **Verify:** /event-test event:goodbye shows test goodbye message

- [ ] 4. Implement giveaway-end and level-up tests
      **Files:** `src/modules/utility/entry_point.ts`
      - Giveaway: Fake winner announcement with test prize
      - Level-up: Show level 4→5 progression with celebratory styling
      - Use emojis from emojis.ts (trophy, star)
      **Verify:** Both event types show appropriate test embeds

- [ ] 5. Add permission check and error handling
      **Files:** `src/modules/utility/entry_point.ts`
      - Validate Administrator permission before execution
      - Handle missing configs gracefully (show defaults)
      - Update metadata.json to include /event-test
      **Verify:** Non-admin sees error, admin can test all events

---

## Feature 3: Settings Command

### Files to Create
- `src/modules/settings-module/entry_point.ts` - Main module
- `src/modules/settings-module/metadata.json` - Module metadata
- `data/server-features.json` - Feature flags storage

### Implementation Steps

- [ ] 1. Create settings module structure
      **Files:** `src/modules/settings-module/entry_point.ts`, `metadata.json`
      - Create SettingsModule class
      - Register /setting command with 'deesyn-feature' subcommand (admin only)
      - Create metadata.json: priority 13, type 1
      **Verify:** Module loads, command registered

- [ ] 2. Create data structure and helper functions
      **Files:** `src/modules/settings-module/entry_point.ts`, create `data/server-features.json`
      - Schema: {guildId: {welcome_system: bool, goodbye_system: bool, auto_role: bool, level_system: bool, giveaway_notifications: bool}}
      - Initialize with all true as defaults
      - Functions: getGuildFeatures(guildId), setGuildFeature(guildId, feature, value)
      **Verify:** Can read/write feature flags to JSON file

- [ ] 3. Build Components V2 UI with StringSelectMenu
      **Files:** `src/modules/settings-module/entry_point.ts`
      - ContainerBuilder card with title '⚙️ Server Features'
      - Show current states: ✅ enabled, ❌ disabled
      - StringSelectMenu with 5 options (each feature with emoji)
      - CustomId: 'settings:toggle:userId'
      **Verify:** Command shows card with select menu

- [ ] 4. Implement select menu interaction handler
      **Files:** `src/modules/settings-module/entry_point.ts`
      - Listen for StringSelectMenuInteraction with customId 'settings:toggle:*'
      - Toggle selected feature in data/server-features.json
      - Update message to refresh feature states
      - Add timestamp footer showing last save
      **Verify:** Selecting feature toggles it, UI updates immediately

- [ ] 5. Export helper for other modules
      **Files:** `src/modules/settings-module/entry_point.ts`
      - Export isFeatureEnabled(guildId, feature) function
      - Document integration points for other modules to use
      - Add permission validation for command execution
      **Verify:** Function can be imported and returns correct boolean

---

## Feature 4: UI Upgrade & Bug Fixes

### Files to Create
- `src/modules/welcome-system-module/entry_point.ts` - Event handlers
- `src/modules/welcome-system-module/metadata.json` - Module metadata
- `data/goodbye-config.json` - Goodbye configuration

### Files to Modify
- `data/welcome-config.json` - Enhance structure

### Implementation Steps

- [ ] 1. Create welcome system module with event handlers
      **Files:** `src/modules/welcome-system-module/entry_point.ts`
      - Create WelcomeSystemModule class
      - Register guildMemberAdd event listener in initialize()
      - Register guildMemberRemove event listener
      - Import isFeatureEnabled from settings-module
      **Verify:** Module loads, events registered

- [ ] 2. Implement guildMemberAdd handler with Components V2
      **Files:** `src/modules/welcome-system-module/entry_point.ts`
      - Read data/welcome-config.json for guild
      - Check welcome_system feature flag via isFeatureEnabled
      - Build ContainerBuilder card (replace old embed)
      - Include: member avatar thumbnail, join timestamp, server name, member count
      - Check data/welcome-designs.json for custom design (from FEAT-001)
      **Verify:** New member triggers welcome message in configured channel

- [ ] 3. Implement auto-role assignment
      **Files:** `src/modules/welcome-system-module/entry_point.ts`
      - Read autoRole field from welcome-config.json
      - Assign role to new member if configured
      - Handle errors: missing role, insufficient permissions
      - Log failures to console with guild/role info
      **Verify:** New member receives configured role automatically

- [ ] 4. Implement guildMemberRemove handler
      **Files:** `src/modules/welcome-system-module/entry_point.ts`, create `data/goodbye-config.json`
      - Read data/goodbye-config.json: {guildId: {channelId, message, embedEnabled, enabled}}
      - Check goodbye_system feature flag
      - Build Components V2 card with leave timestamp
      - Calculate member tenure (joined→left duration)
      - Support custom goodbye designs from welcome-designs.json
      **Verify:** Member leave triggers goodbye message

- [ ] 5. Add permission validation
      **Files:** `src/modules/welcome-system-module/entry_point.ts`
      - Check SendMessages + EmbedLinks permissions before sending
      - If lacking, log warning with guild name and channel ID
      - Skip silently rather than crashing
      **Verify:** Bot handles missing permissions gracefully, logs warning

- [ ] 6. Enhance welcome-config.json structure
      **Files:** `data/welcome-config.json`
      - Add fields: embedColor (hex), embedThumbnail (url), embedFields (array), embedFooter (text)
      - Maintain backwards compatibility (use defaults if fields missing)
      - Update existing configs when new fields accessed
      **Verify:** Enhanced config works, old configs still load

- [ ] 7. Create configuration commands
      **Files:** `src/modules/welcome-system-module/entry_point.ts`
      - Add /welcome-setup command (admin): channelId, message, embedEnabled, autoRole options
      - Add /goodbye-setup command (admin): similar options for goodbye
      - Show current config when no options provided
      - Validate channel exists and is text channel
      - Validate role exists before saving
      **Verify:** Commands allow configuration, show current settings

- [ ] 8. Add edge case handling and metadata
      **Files:** `src/modules/welcome-system-module/entry_point.ts`, `metadata.json`
      - Skip welcome/goodbye for bot accounts (or add config flag)
      - Handle deleted channels (log error, don't crash)
      - Handle rate limiting (queue if needed)
      - Initialize default config on first use if missing
      - Create metadata.json: priority 12, type 1, commands ['/welcome-setup', '/goodbye-setup']
      **Verify:** All edge cases handled without crashes

---

## Integration Testing

After all features implemented:

- [ ] 1. Full workflow test with new alt account
      - Join server → welcome message appears with custom design
      - Auto-role assigned
      - Leave server → goodbye message appears
      - All messages use Components V2 styling

- [ ] 2. Admin workflow test
      - Use /welcome-generator to create design
      - Save design and test with /event-test
      - Configure via /welcome-setup
      - Toggle features via /setting deesyn-feature
      - Verify all commands work together

- [ ] 3. Error scenarios
      - Delete configured channel → verify graceful handling
      - Remove configured role → verify error logging
      - Disable features → verify events don't fire
      - AI API failure → verify error message shown

---

## Verification Commands

All verification steps use these commands:

```bash
# Build
npm run build

# Start bot (manual testing)
npm start

# Check for TypeScript errors
npm run build

# Check console logs
# Look for: "✅ [Module] registered X command(s)"
```

## Risk Areas

1. **Modal timeout (3 second limit):** AI generation takes time. Solution: Defer reply immediately in modal handler, then edit with result.

2. **Components V2 migration:** Old embed code may exist. Solution: Follow server-generator-module patterns strictly.

3. **Event handler conflicts:** Multiple modules listening to same events. Solution: Check feature flags before executing.

4. **Data file race conditions:** Multiple writes to same JSON. Solution: Use synchronous writes in single-threaded Node.js (acceptable for bot scale).

5. **Permission edge cases:** Bot lacks permissions in channel. Solution: Always check permissions before attempting operations, log and skip on failure.

## Dependencies Between Features

- FEAT-001 (Generator) is independent, creates data files
- FEAT-002 (Event Test) depends on FEAT-001's data files (reads them)
- FEAT-003 (Settings) is independent, creates feature flags
- FEAT-004 (Welcome System) depends on both FEAT-001 (reads designs) and FEAT-003 (checks feature flags)

**Implementation Order:** FEAT-001 → FEAT-003 → FEAT-002 → FEAT-004

This ensures dependencies are satisfied before dependent features are built.
