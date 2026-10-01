/**
 * ModuleType - IntEnum for module type declaration
 * Inspired by SwitLoader (https://github.com/Notkenftr/SwitLoader)
 * 
 * Helps you declare module types simply, can also use numbers directly
 */

export enum ModuleType {
  /**
   * PREFIX_COMMAND: Module uses prefix commands
   * Example: !ban, !mute @user, !kick
   */
  PREFIX_COMMAND = 0,

  /**
   * SLASH_COMMAND: Module uses slash commands
   * Example: /generator, /ban, /kick
   */
  SLASH_COMMAND = 1,

  /**
   * GROUP_COMMAND: Module contains a group of slash commands
   * Example:
   *   /moderator ban
   *   /moderator mute
   *   /moderator kick
   */
  GROUP_COMMAND = 2,

  /**
   * LOOP_EVENT: Module has repeating tasks/loops
   * Example: Run function A every 20 seconds, run function C every 12 hours
   */
  LOOP_EVENT = 3,

  /**
   * EVENT: Module listens to Discord events
   * Example: on_message, on_ready, on_member_join
   */
  EVENT = 4,

  /**
   * COG: Complex module that can contain multiple types
   * Can include: LOOP_EVENT, SLASH_COMMAND, PREFIX_COMMAND, EVENT
   */
  COG = 5,

  /**
   * HOOK_TO_SETUP: Module hooks into bot setup phase
   * Runs at the end of bot initialization
   */
  HOOK_TO_SETUP = 6,

  /**
   * CALL_SETUP_FUNC: Module for complex setup
   * Use when you need to add multiple cogs or group commands
   */
  CALL_SETUP_FUNC = 7,
}

/**
 * Helper function to get module type name
 */
export function getModuleTypeName(type: ModuleType): string {
  return ModuleType[type];
}

/**
 * Helper function to check if module type is valid
 */
export function isValidModuleType(type: number): boolean {
  return type >= 0 && type <= 7;
}
