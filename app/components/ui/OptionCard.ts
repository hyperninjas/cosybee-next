/**
 * Shared styling for a pickable option row (a `Radio` styled as a card).
 *
 * HeroUI's bare radio is a dot against the page background, which for a
 * required question reads as body text rather than something to act on.
 * Giving each option its own bordered surface makes the choice obvious and
 * turns the whole row into a hit target instead of just the dot.
 *
 * Pass to `Radio`'s `className`. It merges with the component's own
 * `.radio` class rather than replacing it — `composeTwRenderProps` keeps the
 * base layout and interaction states intact.
 *
 * Note the structure HeroUI 3.1.0 expects, which differs from the current
 * published docs: `Radio.Control` is a SIBLING of `Radio.Content`, not a
 * child of it. `.radio` is the flex row; `.radio__content` is a flex column
 * for the label and its description. Nesting the control inside the content
 * stacks the dot above the label instead of beside it.
 *
 *   <Radio className={OPTION_CARD}>
 *     <Radio.Control><Radio.Indicator /></Radio.Control>
 *     <Radio.Content>Label</Radio.Content>
 *   </Radio>
 */
export const OPTION_CARD =
  "rounded-xl border border-border bg-surface px-4 py-3 transition-colors " +
  "data-[hovered=true]:bg-surface-secondary " +
  "data-[selected=true]:border-accent data-[selected=true]:bg-accent/10 " +
  "data-[disabled=true]:opacity-60";
