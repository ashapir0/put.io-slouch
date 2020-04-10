import { Message } from "discord.js";

import { DiscordCommand } from "./DiscordCommand";
import { DiscordCommandType } from "./DiscordCommandType";
import { UsageDependencies } from "../definition/dependencies/UsageDependencies";

import { DownloadDiscordCommand } from "./download/DownloadDiscordCommand";

export class DiscordCommandRegistry {
  private static getRegistry(): Map<string, DiscordCommand> {
    const registry = new Map<DiscordCommandType, DiscordCommand>();
    registry.set(DiscordCommandType.DOWNLOAD, DownloadDiscordCommand.prototype);
    return registry;
  }

  public static getCommand(command: string, args: Array<string>, message: Message, dependencies: UsageDependencies): DiscordCommand | null {
    const registry = this.getRegistry();

    const CommandForType = registry.get(command.toLowerCase());
    if (!CommandForType) return null;

    const ReflectedCommand = Object.create(CommandForType);
    return new ReflectedCommand.constructor(dependencies, command, args, message);
  }
}
