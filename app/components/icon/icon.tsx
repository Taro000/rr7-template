import { iconRegistry, type IconName } from "~/lib/iconify/registry";

/**
 * Icon の props。アイコンは自前の {@link IconName} でのみ指定し、vendor 文字列を露出しない。
 *
 * `aria-label` を渡すと意味を持つアイコン（`role="img"` ＋ ラベル）、省略時は装飾として
 * アクセシビリティツリーから隠す。色は `currentColor`、`className`（例: `text-primary`）で制御する。
 */
export type IconProps = {
  /** registry に登録済みのアイコン名。 */
  name: IconName;
  /** 一辺のサイズ。width・height に反映する（既定 `1em` で周囲のフォントサイズに追従）。 */
  size?: string | number;
  /** daisyUI セマンティックカラー等。`currentColor` のため text 色クラスで配色する。 */
  className?: string;
  /** 指定するとアイコンが意味を持つ（`role="img"`）。省略時は装飾扱い。 */
  "aria-label"?: string;
};

/**
 * registry のアイコンを描画する共通コンポーネント。呼び出し側に vendor 由来の文字列を書かせず、
 * 全画面で意匠を揃えるための単一の公開窓口。既定は装飾（`aria-hidden`）、`aria-label` 指定時のみ
 * `role="img"` ＋ ラベルに切り替える。
 */
export function Icon({ name, size = "1em", className, "aria-label": ariaLabel }: IconProps) {
  const SvgIcon = iconRegistry[name];
  const a11y = ariaLabel
    ? ({ role: "img", "aria-label": ariaLabel } as const)
    : ({ "aria-hidden": true, focusable: false } as const);

  return <SvgIcon width={size} height={size} className={className} {...a11y} />;
}
