// 腐敗防止層: ~icons/* を import するのはこのディレクトリのみ（アプリ側は ~/components/icon/icon の Icon を使う）。
// unplugin-icons は動的 id（~icons/mingcute/${id}）を単体抽出できないため、各アイコンは静的 import で列挙する。
import Add from "~icons/mingcute/add-line";
import ArrowUp from "~icons/mingcute/arrow-up-line";
import Close from "~icons/mingcute/close-line";
import Copy from "~icons/mingcute/copy-line";
import Delete from "~icons/mingcute/delete-2-line";
import Edit from "~icons/mingcute/edit-line";
import Home from "~icons/mingcute/home-1-line";
import Menu from "~icons/mingcute/menu-line";
import More from "~icons/mingcute/more-2-line";
import Notification from "~icons/mingcute/notification-line";
import Pin from "~icons/mingcute/pin-2-line";
import Search from "~icons/mingcute/search-line";
import Settings from "~icons/mingcute/settings-3-line";
import User from "~icons/mingcute/user-3-line";

// 自前 name → ビルド時抽出済みアイコンコンポーネントの台帳（使用許可アイコンの唯一の出所）。
// セット差し替えは右辺の import 元だけ変えればよく、name（キー）が不変なら呼び出し側は不変。
export const iconRegistry = {
  add: Add,
  close: Close,
  copy: Copy,
  edit: Edit,
  home: Home,
  menu: Menu,
  more: More,
  notification: Notification,
  pin: Pin,
  search: Search,
  send: ArrowUp,
  settings: Settings,
  trash: Delete,
  user: User,
} as const;

/** アプリで使用を許可されたアイコン名。registry のキーと常に一致する（vendor 文字列を露出しない）。 */
export type IconName = keyof typeof iconRegistry;
