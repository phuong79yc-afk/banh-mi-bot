# Requirements Document: XP/Level System

## Introduction

The XP/Level System is a comprehensive user engagement feature for the Discord bot that tracks user activity across multiple dimensions (text messages, voice participation, command usage) and rewards users with experience points (XP) and progressive levels. The system integrates with the existing economy system, provides visual feedback through rank cards and leaderboards, and allows server administrators to configure XP rates and level-based rewards including role assignments.

## Glossary

- **XP_System**: The experience point and leveling system component
- **User**: A Discord server member who can earn XP and levels
- **Admin**: A Discord server member with Administrator permissions
- **XP**: Experience points earned through activities
- **Level**: A progression tier calculated from accumulated XP
- **Rank_Card**: A visual display showing user XP, level, and rank statistics
- **Leaderboard**: A ranked list of users by XP or level
- **Activity**: User actions that generate XP (messages, voice time, commands)
- **Cooldown**: A time restriction preventing XP spam
- **Level_Reward**: Benefits granted when reaching specific levels (coins, roles)
- **XP_Rate**: The amount of XP awarded per activity type
- **Data_Store**: JSON file-based persistence layer for XP data
- **Voice_Session**: A continuous period of time in a voice channel
- **Spam_Protection**: Anti-abuse mechanisms preventing XP exploitation
- **Server_Config**: Per-guild XP system configuration settings

## Requirements

### Requirement 1: Text Message XP Tracking

**User Story:** As a user, I want to earn XP when I send messages in the server, so that my participation is recognized and rewarded.

#### Acceptance Criteria

1. WHEN a User sends a text message, THE XP_System SHALL award between 15 and 25 XP
2. WHEN a User sends a message within 60 seconds of their last XP-earning message, THE XP_System SHALL NOT award XP (cooldown protection)
3. WHEN a User sends a message in a channel, THE XP_System SHALL update the User's last activity timestamp
4. THE XP_System SHALL ignore messages from bot accounts
5. WHEN a User earns XP from a message, THE XP_System SHALL persist the updated XP total to the Data_Store
6. WHEN a User sends a message shorter than 5 characters, THE XP_System SHALL NOT award XP (spam protection)

### Requirement 2: Voice Channel XP Tracking

**User Story:** As a user, I want to earn XP while participating in voice channels, so that my voice activity contributes to my progression.

#### Acceptance Criteria

1. WHEN a User joins a voice channel, THE XP_System SHALL start a Voice_Session timer
2. WHILE a User remains in a voice channel, THE XP_System SHALL award 10 XP every 5 minutes
3. WHEN a User is muted or deafened, THE XP_System SHALL NOT award voice XP
4. WHEN a User is alone in a voice channel, THE XP_System SHALL NOT award voice XP
5. WHEN a User leaves a voice channel, THE XP_System SHALL end the Voice_Session and persist accumulated XP
6. WHEN a User switches between voice channels, THE XP_System SHALL maintain the continuous Voice_Session timer

### Requirement 3: Command Usage XP Tracking

**User Story:** As a user, I want to earn XP when I use bot commands, so that my engagement with bot features is rewarded.

#### Acceptance Criteria

1. WHEN a User executes a bot command, THE XP_System SHALL award 5 XP
2. WHEN a User executes a command within 120 seconds of their last command XP, THE XP_System SHALL NOT award XP (cooldown protection)
3. THE XP_System SHALL exclude admin-only commands from XP rewards
4. THE XP_System SHALL exclude XP-related commands (rank, leaderboard) from earning XP
5. WHEN a command execution fails or is cancelled, THE XP_System SHALL NOT award XP

### Requirement 4: Level Calculation and Progression

**User Story:** As a user, I want my XP to translate into levels with increasing requirements, so that I have long-term progression goals.

#### Acceptance Criteria

1. THE XP_System SHALL calculate required XP for level N using the formula: 5 * (N^2) + 50 * N + 100
2. WHEN a User's total XP reaches the threshold for the next level, THE XP_System SHALL increment the User's level
3. THE XP_System SHALL support levels from 1 to 100
4. WHEN a User reaches level 100, THE XP_System SHALL continue tracking XP but SHALL NOT increment level further
5. THE XP_System SHALL calculate User rank as their position in the server sorted by total XP (descending)
6. WHEN multiple Users have identical XP, THE XP_System SHALL assign the same rank to all tied Users

### Requirement 5: Level-Up Notifications

**User Story:** As a user, I want to receive a notification when I level up, so that I'm aware of my progression and rewards.

#### Acceptance Criteria

1. WHEN a User levels up, THE XP_System SHALL send an embed message to the channel where the level-up occurred
2. THE level-up message SHALL display the User's new level, username, and avatar
3. THE level-up message SHALL display any Level_Rewards earned at the new level
4. WHEN a User levels up in a voice channel, THE XP_System SHALL send the notification to a configured notification channel
5. WHERE a notification channel is not configured, THE XP_System SHALL NOT send voice level-up notifications
6. THE level-up embed SHALL include a congratulatory message and visual indicators (emojis, colors)

### Requirement 6: Rank Card Display

**User Story:** As a user, I want to view a visual rank card showing my XP statistics, so that I can track my progress and compare with others.

#### Acceptance Criteria

1. WHEN a User executes the rank command, THE XP_System SHALL display a Rank_Card embed
2. THE Rank_Card SHALL display the User's current level, total XP, and XP progress to next level
3. THE Rank_Card SHALL display the User's server rank position
4. THE Rank_Card SHALL display a visual progress bar showing XP progress to next level
5. THE Rank_Card SHALL display the User's avatar and username
6. WHEN a User specifies another User in the rank command, THE XP_System SHALL display that User's Rank_Card
7. THE Rank_Card SHALL calculate and display the percentage of XP progress to next level

### Requirement 7: XP Leaderboard

**User Story:** As a user, I want to view a leaderboard of top-ranked members, so that I can see how I compare to others in the server.

#### Acceptance Criteria

1. WHEN a User executes the xp-leaderboard command, THE XP_System SHALL display the top 10 Users by total XP
2. THE Leaderboard SHALL display each User's rank, username, level, and total XP
3. THE Leaderboard SHALL display medals (🥇🥈🥉) for the top 3 positions
4. THE Leaderboard SHALL display the requesting User's rank and XP if they are not in the top 10
5. WHEN the server has fewer than 10 Users with XP, THE Leaderboard SHALL display all Users with XP
6. THE Leaderboard SHALL sort Users by total XP in descending order
7. THE Leaderboard SHALL fetch and display current usernames even if Users have changed names

### Requirement 8: Level-Based Coin Rewards

**User Story:** As a user, I want to receive coin rewards when I level up, so that my progression benefits my economy balance.

#### Acceptance Criteria

1. WHEN a User levels up, THE XP_System SHALL award coins equal to: level * 100
2. THE XP_System SHALL add the coin reward to the User's economy balance using the existing economy system
3. THE level-up notification SHALL display the coin reward amount
4. WHERE coin rewards are disabled in Server_Config, THE XP_System SHALL NOT award coins for level-ups
5. THE XP_System SHALL persist coin rewards even if the level-up notification fails to send

### Requirement 9: Level-Based Role Rewards

**User Story:** As an admin, I want to automatically assign roles to users when they reach specific levels, so that progression is visibly recognized with server permissions.

#### Acceptance Criteria

1. WHEN a User levels up, THE XP_System SHALL check Server_Config for role rewards at the new level
2. WHERE a role reward is configured for the level, THE XP_System SHALL assign the role to the User
3. IF the role assignment fails due to permissions, THEN THE XP_System SHALL log the error and continue
4. THE XP_System SHALL support multiple role rewards at the same level
5. THE XP_System SHALL NOT remove previously earned role rewards when Users level up
6. THE level-up notification SHALL display all roles awarded at the new level

### Requirement 10: Admin XP Configuration

**User Story:** As an admin, I want to configure XP rates for different activities, so that I can customize the progression speed for my server.

#### Acceptance Criteria

1. WHEN an Admin executes the xp-config command, THE XP_System SHALL display current Server_Config settings
2. THE xp-config command SHALL allow Admins to set message XP range (min and max values)
3. THE xp-config command SHALL allow Admins to set voice XP amount and interval
4. THE xp-config command SHALL allow Admins to set command XP amount
5. THE xp-config command SHALL allow Admins to set message and command cooldown durations
6. THE xp-config command SHALL validate that min XP values are less than max XP values
7. THE xp-config command SHALL validate that XP amounts are positive integers between 1 and 1000
8. THE xp-config command SHALL validate that cooldown durations are between 10 and 300 seconds
9. WHEN an Admin updates Server_Config, THE XP_System SHALL persist changes to the Data_Store
10. WHERE no Server_Config exists for a guild, THE XP_System SHALL use default values

### Requirement 11: Admin Level Reward Configuration

**User Story:** As an admin, I want to configure role and coin rewards for specific levels, so that I can incentivize progression with custom rewards.

#### Acceptance Criteria

1. WHEN an Admin executes the xp-rewards command, THE XP_System SHALL display all configured Level_Rewards
2. THE xp-rewards command SHALL allow Admins to add role rewards at specific levels
3. THE xp-rewards command SHALL allow Admins to remove role rewards from specific levels
4. THE xp-rewards command SHALL allow Admins to enable or disable coin rewards
5. THE xp-rewards command SHALL allow Admins to set a coin multiplier (default: 100 coins per level)
6. THE xp-rewards command SHALL validate that level numbers are between 1 and 100
7. THE xp-rewards command SHALL validate that specified roles exist in the guild
8. WHEN an Admin adds a role reward, THE XP_System SHALL persist the configuration to the Data_Store
9. THE xp-rewards command SHALL display role names, not just role IDs

### Requirement 12: Admin XP Management

**User Story:** As an admin, I want to manually add or remove XP from users, so that I can correct errors or reward special contributions.

#### Acceptance Criteria

1. WHEN an Admin executes the xp-add command, THE XP_System SHALL add the specified XP amount to the target User
2. WHEN an Admin executes the xp-remove command, THE XP_System SHALL subtract the specified XP amount from the target User
3. WHEN XP is manually added and causes a level-up, THE XP_System SHALL trigger level-up notifications and rewards
4. WHEN XP is manually removed and causes a level-down, THE XP_System SHALL update the User's level accordingly
5. THE XP_System SHALL NOT remove role rewards when a User levels down
6. THE xp-add and xp-remove commands SHALL validate that XP amounts are positive integers
7. THE xp-remove command SHALL prevent reducing XP below 0
8. WHEN an Admin modifies XP, THE XP_System SHALL log the action with Admin ID, target User ID, and amount

### Requirement 13: Admin XP Reset

**User Story:** As an admin, I want to reset XP for specific users or the entire server, so that I can start fresh or remove inactive user data.

#### Acceptance Criteria

1. WHEN an Admin executes the xp-reset command with a User target, THE XP_System SHALL reset that User's XP and level to 0
2. WHEN an Admin executes the xp-reset command with the "all" option, THE XP_System SHALL display a confirmation prompt
3. WHEN an Admin confirms the "all" reset, THE XP_System SHALL reset XP and levels for all Users in the guild
4. THE xp-reset command SHALL NOT remove role rewards already assigned to Users
5. THE xp-reset command SHALL persist the reset data to the Data_Store
6. WHEN an Admin resets XP, THE XP_System SHALL log the action with Admin ID and scope (user or all)

### Requirement 14: XP System Toggle

**User Story:** As an admin, I want to enable or disable the XP system for my server, so that I can control when progression tracking is active.

#### Acceptance Criteria

1. WHEN an Admin executes the xp-toggle command, THE XP_System SHALL toggle the enabled state in Server_Config
2. WHILE the XP system is disabled, THE XP_System SHALL NOT award XP for any activities
3. WHILE the XP system is disabled, THE XP_System SHALL still allow Users to view their rank and leaderboard
4. WHILE the XP system is disabled, THE XP_System SHALL still allow Admins to use management commands
5. THE xp-toggle command SHALL display the new enabled state after toggling
6. WHERE no Server_Config exists, THE XP_System SHALL default to enabled

### Requirement 15: Data Persistence

**User Story:** As a developer, I want XP data to persist across bot restarts, so that user progress is never lost.

#### Acceptance Criteria

1. THE XP_System SHALL store all User XP data in a JSON file at `data/xp/{guildId}.json`
2. THE XP_System SHALL store all Server_Config data in a JSON file at `data/xp/config/{guildId}.json`
3. WHEN the bot starts, THE XP_System SHALL load all XP data and Server_Config from the Data_Store
4. WHEN User XP changes, THE XP_System SHALL write updated data to the Data_Store within 5 seconds
5. WHEN Server_Config changes, THE XP_System SHALL immediately write updated config to the Data_Store
6. IF the Data_Store file is corrupted or invalid, THEN THE XP_System SHALL log an error and initialize with empty data
7. THE XP_System SHALL create data directories if they do not exist

### Requirement 16: Performance Optimization

**User Story:** As a developer, I want the XP system to perform efficiently, so that it doesn't impact bot responsiveness or memory usage.

#### Acceptance Criteria

1. THE XP_System SHALL use in-memory caching for User XP data during runtime
2. THE XP_System SHALL batch write operations to the Data_Store to minimize file I/O
3. THE XP_System SHALL limit leaderboard queries to a maximum of 100 Users
4. THE XP_System SHALL cleanup inactive User data (no activity for 90 days) during bot startup
5. WHEN calculating levels, THE XP_System SHALL use cached level thresholds rather than recalculating
6. THE XP_System SHALL process XP awards asynchronously to avoid blocking command responses

### Requirement 17: Spam and Abuse Protection

**User Story:** As an admin, I want the XP system to prevent spam and abuse, so that progression remains fair and meaningful.

#### Acceptance Criteria

1. THE XP_System SHALL enforce per-activity cooldowns to prevent rapid XP farming
2. THE XP_System SHALL ignore messages shorter than 5 characters for XP calculation
3. THE XP_System SHALL ignore repeated identical messages within 5 minutes
4. THE XP_System SHALL NOT award voice XP when a User is alone in a channel
5. THE XP_System SHALL NOT award voice XP when a User is muted or deafened
6. THE XP_System SHALL NOT award XP for bot accounts
7. WHERE an Admin detects abuse, THE Admin SHALL use xp-remove or xp-reset commands to correct

### Requirement 18: Multi-Guild Support

**User Story:** As a developer, I want the XP system to support multiple Discord servers independently, so that each server has isolated progression tracking.

#### Acceptance Criteria

1. THE XP_System SHALL maintain separate XP data for each guild
2. THE XP_System SHALL maintain separate Server_Config for each guild
3. WHEN a User is in multiple guilds, THE XP_System SHALL track their XP independently per guild
4. THE XP_System SHALL use guild ID as the primary key for data isolation
5. THE Leaderboard SHALL only display Users from the current guild
6. THE Rank_Card SHALL only display rank within the current guild

### Requirement 19: Error Handling and Logging

**User Story:** As a developer, I want comprehensive error handling and logging, so that I can diagnose and fix issues quickly.

#### Acceptance Criteria

1. WHEN the XP_System encounters a file I/O error, THE XP_System SHALL log the error and continue operation with cached data
2. WHEN the XP_System fails to assign a role reward, THE XP_System SHALL log the error with role ID and User ID
3. WHEN the XP_System fails to send a level-up notification, THE XP_System SHALL log the error but still award rewards
4. THE XP_System SHALL log all Admin management actions (add, remove, reset XP)
5. WHEN the XP_System encounters invalid configuration data, THE XP_System SHALL log a warning and use default values
6. THE XP_System SHALL include timestamps and guild IDs in all log messages

### Requirement 20: Integration with Existing Economy System

**User Story:** As a developer, I want the XP system to integrate seamlessly with the existing economy system, so that coin rewards work correctly.

#### Acceptance Criteria

1. THE XP_System SHALL use the existing `addBalance` function from the economy utility
2. WHEN awarding coin rewards, THE XP_System SHALL verify the economy function succeeded
3. THE XP_System SHALL NOT duplicate economy data storage
4. THE XP_System SHALL handle cases where the economy system is unavailable
5. THE balance and leaderboard commands SHALL continue to function independently of the XP system

