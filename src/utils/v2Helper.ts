import {
  MessageFlags, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize,
  MediaGalleryBuilder, MediaGalleryItemBuilder,
} from 'discord.js';

export const V2 = MessageFlags.IsComponentsV2;

export const V2_EPHEMERAL = MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral;

export const txt = (content: string) => new TextDisplayBuilder().setContent(content);

export const sep = (large = false, divider = true) =>
  new SeparatorBuilder()
    .setDivider(divider)
    .setSpacing(large ? SeparatorSpacingSize.Large : SeparatorSpacingSize.Small);

export const gallery = (url: string) =>
  new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(url));
