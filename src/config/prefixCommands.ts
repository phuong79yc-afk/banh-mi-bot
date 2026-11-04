export interface PrefixHelpCommand {
  usage: string;
  description: string;
  emoji: string;
}

export interface PrefixHelpGroup {
  title: string;
  emoji: string;
  prefix: string;
  commands: PrefixHelpCommand[];
}

export const PREFIX_HELP_GROUPS: PrefixHelpGroup[] = [
  {
    title: 'Tiện ích',
    emoji: '🧰',
    prefix: '!',
    commands: [
      { usage: '!help', description: 'Xem hướng dẫn các lệnh prefix', emoji: '📖' },
      { usage: '!ping', description: 'Kiểm tra độ trễ bot và API', emoji: '🏓' },
      { usage: '!avatar [@user]', description: 'Xem avatar người dùng', emoji: '🖼️' },
      { usage: '!av [@user]', description: 'Lối tắt của !avatar', emoji: '🖼️' },
      { usage: '!userinfo [@user]', description: 'Xem thông tin và role của người dùng', emoji: '👤' },
      { usage: '!ui [@user]', description: 'Lối tắt của !userinfo', emoji: '👤' },
      { usage: '!serverinfo', description: 'Xem thông tin máy chủ', emoji: '🏠' },
      { usage: '!si', description: 'Lối tắt của !serverinfo', emoji: '🏠' },
      { usage: '!uptime', description: 'Xem thời gian bot đã hoạt động', emoji: '⏱️' },
      { usage: '!invite', description: 'Lấy liên kết mời bot', emoji: '📨' },
      { usage: '!profile [@user]', description: 'Xem thẻ hồ sơ người dùng', emoji: '🪪' },
      { usage: '!embed [1-9]', description: 'Xem thử các kiểu giao diện tin nhắn', emoji: '🧩' },
    ],
  },
  {
    title: 'AI',
    emoji: '🤖',
    prefix: '!',
    commands: [
      { usage: '!ai <câu hỏi>', description: 'Hỏi AI; có thể hỏi kiến thức hoặc cách dùng lệnh bot', emoji: '🤖' },
    ],
  },
  {
    title: 'Quản lý',
    emoji: '🛡️',
    prefix: '!',
    commands: [
      { usage: '!mute @user|<ID> [time] [lý do]', description: 'Tạm mute thành viên; mặc định 10 phút, tối đa 28 ngày', emoji: '🔇' },
      { usage: '!unmute @user|<ID> [lý do]', description: 'Gỡ mute thành viên', emoji: '🔊' },
      { usage: '!ban @user|<ID> [lý do]', description: 'Ban thành viên khỏi máy chủ', emoji: '🔨' },
      { usage: '!unban <ID> [lý do]', description: 'Gỡ ban theo ID người dùng', emoji: '🔓' },
      { usage: '!lock [lý do]', description: 'Khóa kênh hiện tại', emoji: '🔒' },
      { usage: '!unlock [lý do]', description: 'Mở khóa kênh hiện tại', emoji: '🔓' },
    ],
  },
  {
    title: 'Tạo máy chủ',
    emoji: '🏗️',
    prefix: '!',
    commands: [
      { usage: '!gen <mô tả>', description: 'Tạo bản thiết kế máy chủ bằng AI (cần quyền Administrator)', emoji: '🏗️' },
    ],
  },
  {
    title: 'Âm nhạc',
    emoji: '🎵',
    prefix: '!bc',
    commands: [
      { usage: '!bc play <tên bài hoặc link>', description: 'Phát nhạc; bí danh: p', emoji: '▶️' },
      { usage: '!bc skip', description: 'Bỏ qua bài hiện tại; bí danh: sk, next', emoji: '⏭️' },
      { usage: '!bc pause', description: 'Tạm dừng nhạc', emoji: '⏸️' },
      { usage: '!bc resume', description: 'Tiếp tục phát nhạc', emoji: '▶️' },
      { usage: '!bc stop', description: 'Dừng nhạc và xóa hàng chờ', emoji: '⏹️' },
      { usage: '!bc queue', description: 'Xem bài đang phát và hàng chờ; bí danh: q', emoji: '📜' },
      { usage: '!bc volume <1-100>', description: 'Xem hoặc chỉnh âm lượng; bí danh: vol, v', emoji: '🔊' },
      { usage: '!bc loop [0|1|2]', description: 'Đổi chế độ lặp; bí danh: repeat', emoji: '🔁' },
      { usage: '!bc shuffle', description: 'Trộn hàng chờ', emoji: '🔀' },
      { usage: '!bc nowplaying', description: 'Xem bài đang phát; bí danh: np', emoji: '🎶' },
      { usage: '!bc seek <giây>', description: 'Tua đến thời điểm trong bài hát', emoji: '⏩' },
      { usage: '!bc pin', description: 'Lưu bài đang phát vào danh sách ghim', emoji: '📌' },
      { usage: '!bc pinned', description: 'Xem danh sách bài đã ghim', emoji: '📌' },
    ],
  },
];

export const PREFIX_HELP_COMMAND_COUNT = PREFIX_HELP_GROUPS.reduce(
  (count, group) => count + group.commands.length,
  0,
);

export const PREFIX_COMMANDS_KNOWLEDGE = PREFIX_HELP_GROUPS.map(
  (group) =>
    `**${group.emoji} ${group.title} (${group.prefix}):**\n` +
    group.commands.map((command) => `- \`${command.usage}\` — ${command.description}`).join('\n'),
).join('\n\n');
