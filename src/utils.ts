import { PermissionResolvable } from "discord.js";

export const permissions = (perm: PermissionResolvable) => {
    switch (perm) {
        case "AddReactions":
            return "Add Reactions";
        case "Administrator":
            return "Administrator";
        case "AttachFiles":
            return "Attach Files";
        case "BanMembers":
            return "Ban Members";
        case "ChangeNickname":
            return "Change Nickname";
        case "Connect":
            return "Connect";
        case "CreateInstantInvite":
            return "Create Instant Invite";
        case "CreatePrivateThreads":
            return "Create Private Threads";
        case "CreatePublicThreads":
            return "Create Public Threads";
        case "DeafenMembers":
            return "Deafen Members";
        case "EmbedLinks":
            return "Embed Links";
        case "KickMembers":
            return "Kick Members";
        case "ManageChannels":
            return "Manage Channels";
        case "ManageEmojisAndStickers":
            return "Manage Emojis and Stickers";
        case "ManageGuild":
            return "Manage Guild";
        case "ManageMessages":
            return "Manage Messages";
        case "ManageNicknames":
            return "Manage Nicknames";
        case "ManageRoles":
            return "Manage Roles";
        case "ManageThreads":
            return "Manage Threads";
        case "ManageWebhooks":
            return "Manage Webhooks";
        case "MentionEveryone":
            return "Mention Everyone";
        case "ModerateMembers":
            return "Moderate Members";
        case "MoveMembers":
            return "Move Members";
        case "MuteMembers":
            return "Mute Members";
        case "PrioritySpeaker":
            return "Priority Speaker";
        case "ReadMessageHistory":
            return "Read Message History";
        case "RequestToSpeak":
            return "Request to Speak";
        case "SendMessages":
            return "Send Messages";
        case "SendMessagesInThreads":
            return "Send Messages In Threads";
        case "SendTTSMessages":
            return "Send TTS Messages";
        case "Speak":
            return "Speak";
        case "Stream":
            return "Video";
        case "UseApplicationCommands":
            return "Use Application Commands";
        case "UseEmbeddedActivities":
            return "Use Embedded Activities";
        case "UseExternalEmojis":
            return "Use External Emojis";
        case "UseExternalStickers":
            return "Use External Stickers";
        case "UseVAD":
            return "Use Voice Activity";
        case "ViewAuditLog":
            return "View Audit Log";
        case "ViewChannel":
            return "View Channel";
        case "ViewGuildInsights":
            return "View Guild Insights";
    }
};

export const timeFormat = (timeInSeconds: number) => {
    const days = Math.floor((timeInSeconds % 31536000) / 86400);
    const hours = Math.floor((timeInSeconds % 86400) / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.round(timeInSeconds % 60);
    return (
        (days > 0 ? `${days} days, ` : "") +
        (hours > 0 ? `${hours} hours, ` : "") +
        (minutes > 0 ? `${minutes} minutes, ` : "") +
        (seconds > 0 ? `${seconds} seconds` : "")
    );
};
