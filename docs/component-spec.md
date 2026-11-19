# I Am President — Component Porting Spec (React inline styles → CSS classes + jQuery markup)

Source of truth: `iampresident_handoff_v2/design/components/<group>/<Name>.jsx`. Every value below is quoted verbatim from those files. Nothing is rounded or summarized.

Markup convention: React `<i className="ph-fill ph-<name>">` → `<i class="ph-fill ph-<name>" aria-hidden="true">`. Keep `ph-fill` vs `ph-bold` exactly as written.

---

## Token reference (resolved literals)

These `var(--…)` tokens are referenced throughout. Preserve the `var(--…)` names in your CSS if you load `styles.css`; literals are given for porting without it.

Radii / timing / misc (`tokens/spacing.css`):
- `--radius-xs: 4px` · `--radius-row: 9px` · `--radius: 10px` · `--radius-tag: 12px` · `--radius-panel: 14px` · `--radius-card: 16px` · `--radius-pill: 999px`
- `--skew: -8deg`
- `--ease-pop: cubic-bezier(.34,1.56,.64,1)` · `--dur-press: 80ms` · `--dur-fast: 150ms` · `--dur-base: 200ms`
- `--shadow-panel: 0 8px 30px rgba(0,0,0,.45)`
- `--shadow-sheen: inset 0 1px 0 rgba(255,255,255,.08)`
- `--shadow-sheen-strong: inset 0 2px 0 rgba(255,255,255,.45)`
- `--shadow-inset-well: inset 0 2px 0 rgba(0,0,0,.28)`
- `--glow-teal: 0 0 18px rgba(79,209,197,.45)`
- `--blur-overlay: blur(8px)`

Type / fonts (`tokens/typography.css`):
- `--font-display: 'Barlow Condensed','Arial Narrow','Roboto Condensed',sans-serif`
- `--font-body: 'Rubik','Segoe UI',system-ui,-apple-system,Helvetica,Arial,sans-serif`
- `--font-num: 'Barlow Condensed','Arial Narrow',sans-serif`
- `--type-button: italic 800 20px/1 var(--font-display)`
- `--type-button-sm: italic 800 16px/1 var(--font-display)`
- `--type-panel-title: italic 800 20px/1 var(--font-display)` (= `italic 800 var(--fs-display-xs)/1`, `--fs-display-xs: 20px`)
- `--type-hud-value: 700 22px/1 var(--font-num)`
- `--type-h3: italic 800 26px/1 var(--font-display)` (`--fs-display-sm: 26px`)
- `--type-body-sm: 400 13px/1.45 var(--font-body)` (`--fs-13: 13px`, `--lh-body: 1.45`)
- `--type-meta: 400 11px/1.3 var(--font-body)` (`--fs-11: 11px`)
- `--text-shadow-display: 0 2px 0 rgba(0,0,0,.35)`

Colors (`tokens/colors.css`):
- `--white: #ffffff` · `--text-strong: #ffffff` · `--text-body: #e6ebf5` (navy-100) · `--text-muted: #8a97b8` (navy-300)
- `--navy-950: #060a14` · `--navy-850: #0f1526` · `--navy-600: #27324f` · `--navy-500: #3a4a74` · `--navy-400: #5a6b96` · `--navy-300: #8a97b8`
- `--teal-300: #7fe6dc` · `--teal-400: #4fd1c5` · `--teal-600: #269b90` · `--teal-700: #1a6f67` · `--teal-900: #052521`
- `--gold-300: #ffd864` · `--gold-400: #f6c35a` · `--gold-600: #d89a28` · `--gold-700: #a8721a` · `--gold-900: #2a1c00`
- `--sky-300: #7cc4ff` · `--sky-500: #2a86f0` · `--sky-800: #15306a`
- `--green-300: #9be8ab` · `--green-800: #2c5a37`
- `--red-300: #ff9db1` · `--red-500: #e6194b` · `--red-800: #6e2338`
- `--res-food: #7bc86c` · `--res-energy: #f5d14e` · `--res-minerals: #9aa7bd` · `--res-gold: #f5b942` · `--res-oil: #a885d8` · `--res-research: #4fd1c5`
- `--player-1: #e6194b` · `--player-2: #3cb44b` · `--player-3: #4363d8` · `--player-4: #f58231` · `--player-6: #42d4f4`
- `--globe-land: #4d6390`
- `--surface-overlay: rgba(18,26,46,.92)` · `--border-default: var(--navy-600)` · `--border-glow: rgba(124,196,255,.18)`
- `--focus-ring: 0 0 0 3px rgba(79,209,197,.35)` · `--me-tint: rgba(79,209,197,.08)`

Gradients:
- `--grad-gold: linear-gradient(180deg,#ffe066 0%,#f6c35a 48%,#d89a28 100%)`
- `--grad-teal: linear-gradient(180deg,#5fe3d6 0%,#37d0c2 48%,#269b90 100%)`
- `--grad-sky: linear-gradient(180deg,#5cb4ff 0%,#2a86f0 55%,#1d4fa8 100%)`
- `--grad-navy: linear-gradient(180deg,#26365a 0%,#19233b 100%)`
- `--grad-panel: linear-gradient(180deg,rgba(29,43,74,.94) 0%,rgba(18,26,46,.94) 100%)`
- `--grad-card: linear-gradient(180deg,#1a2747 0%,#121a2e 100%)`
- `--grad-page` + `--bg-page`: used as card-page body background.

Keyframes (`tokens/base.css`), required for Toast/Spinner:
- `@keyframes iap-toast-in{0%{opacity:0;transform:translateY(-10px) scale(.92)}100%{opacity:1;transform:none}}`
- `@keyframes iap-spin{to{transform:rotate(360deg)}}`

Resource meta (`hud/resourceMeta.js`) — icon = Phosphor Fill name, color = token:
- food → `grains`, `var(--res-food)`, label "Food"
- energy → `lightning`, `var(--res-energy)`, label "Energy"
- minerals → `diamond`, `var(--res-minerals)`, label "Minerals"
- gold → `coins`, `var(--res-gold)`, label "Gold"
- oil → `drop`, `var(--res-oil)`, label "Oil"
- research → `flask`, `var(--res-research)`, label "Research"
- `formatNum(n)`: abs ≥ 1e9 → `(n/1e9).toFixed(2)+'B'`; ≥ 1e6 → `.toFixed(2)+'M'`; ≥ 1e3 → `(n/1e3).toFixed(1)+'K'`; else `Math.round(n)`. (12480 → "12.5K", 1234567 → "1.23M").

---

# PART A — Component port specs

## core/Button

Props: `variant` (`default`|`primary`|`gold`|`danger`|`ghost`, default `default`), `size` (`md`|`sm`, default `md`), `icon`, `iconRight`, `slanted` (bool), `block` (bool), `disabled` (bool), `type` (default `button`), `onClick`, `children`.

### DOM
```
<button type disabled>
  <span>            (inner, un-skews the label when slanted)
    <i class="ph-fill ph-{icon}" aria-hidden="true">   (if icon)
    {children}
    <i class="ph-fill ph-{iconRight}" aria-hidden="true">   (if iconRight)
  </span>
</button>
```

### `<button>` base style (verbatim)
- `display`: `block ? 'flex' : 'inline-flex'`
- `width`: `block ? '100%' : undefined`
- `alignItems: 'center'`, `justifyContent: 'center'`, `gap: 8`
- `padding`: md `'11px 18px'`, sm `'7px 12px'`
- `borderRadius: 'var(--radius)'`  (10px)
- `border: '1px solid ' + v.border`
- `background: bg`  (see variants; ghost+hover special, below)
- `color: v.color`
- `font`: md `'var(--type-button)'` (italic 800 20px/1 display), sm `'var(--type-button-sm)'` (italic 800 16px/1 display)
- `textTransform: 'uppercase'`, `letterSpacing: '.02em'`, `textShadow: v.ts`
- `boxShadow`: `shadows.join(', ')` or `'none'` (built below)
- `transform`: `(slanted ? 'skewX(var(--skew)) ' : '') + 'translateY(' + ty + 'px)'`
- `transition: 'transform var(--dur-press) ease, box-shadow var(--dur-press) ease, filter var(--dur-fast) ease'`
- `filter`: `live && hover && variant !== 'ghost' ? 'brightness(1.08)' : 'none'`
- `opacity`: `disabled ? 0.45 : 1`
- `cursor`: `disabled ? 'not-allowed' : 'pointer'`
- `whiteSpace: 'nowrap'`, `userSelect: 'none'`

### Inner `<span>` style
- `display: 'inline-flex'`, `alignItems: 'center'`, `gap: 8`
- `transform`: `slanted ? 'skewX(calc(var(--skew) * -1))' : undefined`  (i.e. `skewX(8deg)` to counter-rotate)

### Icon `<i>` style (both icon and iconRight)
- `fontSize: iconSize` — sm `16`, md `20`
- `lineHeight: 1`

### BTN_VARIANTS (bg / border / color / lip / sheen / ts)
| variant | bg | border | color | lip | sheen | ts (textShadow) |
|---|---|---|---|---|---|---|
| default | `var(--grad-navy)` | `var(--navy-500)` | `var(--text-strong)` | `var(--navy-950)` | `rgba(255,255,255,.12)` | `0 2px 0 rgba(0,0,0,.35)` |
| primary | `var(--grad-teal)` | `#2bbdb0` | `var(--teal-900)` | `var(--teal-700)` | `rgba(255,255,255,.45)` | `0 1px 0 rgba(255,255,255,.3)` |
| gold | `var(--grad-gold)` | `#e3ae3e` | `var(--gold-900)` | `var(--gold-700)` | `rgba(255,255,255,.5)` | `0 1px 0 rgba(255,255,255,.35)` |
| danger | `linear-gradient(180deg,#4a1a2b 0%,#3a1522 100%)` | `var(--red-800)` | `var(--red-300)` | `#1e0a12` | `rgba(255,255,255,.08)` | `0 2px 0 rgba(0,0,0,.35)` |
| ghost | `transparent` | `var(--navy-600)` | `var(--text-body)` | `null` | `null` | `none` |

(default's `hoverBg` is also `var(--grad-navy)` but is unused by the render.)

### box-shadow composition (order matters)
Start empty array `shadows`, then:
1. If `v.sheen` (all except ghost): push `'inset 0 2px 0 ' + v.sheen`, then `'inset 0 -3px 0 rgba(0,0,0,.15)'`.
2. If `v.lip` (all except ghost): push `'0 ' + lipH + 'px 0 ' + v.lip`, then `'0 ' + (lipH + 6) + 'px 14px rgba(0,0,0,.3)'`.

`lipH` = `v.lip ? (live && pressed ? 1 : (sm ? 3 : 4)) : 0`. So resting lip = **4px** (md) / **3px** (sm); pressed = **1px**; ghost = no lip, no shadows at all (`boxShadow: 'none'`).

### transform translateY (`ty`)
- pressed (live): sm `2`, md `3`
- else hover (live): `-1`
- else: `0`

### ghost background special-case
`bg = (variant === 'ghost' && live && hover) ? 'rgba(255,255,255,.06)' : v.bg`. So ghost default bg = `transparent`, ghost hover bg = `rgba(255,255,255,.06)`.

### Interactive states summary
- **Hover (live):** `translateY(-1px)`; `filter: brightness(1.08)` for all non-ghost; ghost gets bg `rgba(255,255,255,.06)` (no brightness). Border unchanged (no hover border change on Button).
- **Press/active (live):** `translateY(+2px sm / +3px md)`; lip shrinks to **1px** (lip shadow `0 1px 0 …`, drop shadow `0 7px 14px …`). Transition duration for transform+box-shadow = `var(--dur-press)` = 80ms.
- **Disabled:** `opacity: 0.45`, `cursor: not-allowed`, no hover/press (hover/press gated by `live = !disabled`).
- On `mouseLeave`, both hover and pressed reset.

---

## core/Badge

Props: `kind` (`default`|`ready`|`ai`|`host`|`danger`, default `default`), `icon`, `children`.

### DOM
```
<span>
  <i class="ph-fill ph-{icon}" aria-hidden="true">   (if icon)
  {children}
</span>
```

### `<span>` style (verbatim)
- `display: 'inline-flex'`, `alignItems: 'center'`, `gap: 4`, `flexShrink: 0`
- `padding: '3px 8px 2px'`
- `borderRadius: 'var(--radius-pill)'`  (999px)
- `border: '1px solid ' + k.border`
- `background: k.bg`, `color: k.color`
- `font: 'italic 800 12px/1 var(--font-display)'`
- `textTransform: 'uppercase'`, `letterSpacing: '.06em'`, `whiteSpace: 'nowrap'`

### Icon `<i>` style: `fontSize: 11`.

### BADGE_KINDS (color / bg / border)
| kind | color | bg | border |
|---|---|---|---|
| default | `var(--text-muted)` | `rgba(255,255,255,.04)` | `var(--navy-600)` |
| ready | `var(--green-300)` | `rgba(60,180,75,.12)` | `var(--green-800)` |
| ai | `var(--gold-400)` | `rgba(245,185,66,.10)` | `#5a4a1e` |
| host | `var(--sky-300)` | `rgba(63,162,255,.10)` | `var(--sky-800)` |
| danger | `var(--red-300)` | `rgba(230,25,75,.12)` | `var(--red-800)` |

No interactive states.

---

## core/Pill

Props: `tone` (`neutral`|`gold`|`sky`|`teal`, default `neutral`), `solid` (bool, default false), `icon`, `children`.

Two completely different renders based on `solid`.

### Outline variant (solid = false)
DOM:
```
<span>
  <i class="ph-fill ph-{icon}" aria-hidden="true">   (if icon)
  {children}
</span>
```
`<span>` style:
- `display: 'inline-flex'`, `alignItems: 'center'`, `gap: 6`
- `font: '500 12px/1 var(--font-body)'`, `color: t.text`
- `border: '1px solid var(--border-default)'`  (navy-600)
- `padding: '4px 10px'`, `borderRadius: 'var(--radius-pill)'`, `whiteSpace: 'nowrap'`
Icon `<i>` style: `fontSize: 13`.

### Solid variant (solid = true) — skewed plate with lip
DOM (outer skewed, inner counter-skewed):
```
<span>              (outer plate)
  <span>            (inner, counter-skew)
    <i class="ph-fill ph-{icon}" aria-hidden="true">  (if icon)
    {children}
  </span>
</span>
```
Outer `<span>` style:
- `display: 'inline-flex'`, `alignItems: 'center'`, `padding: '5px 12px'`, `borderRadius: 6`
- `background: t.grad`, `color: t.solidText`
- `transform: 'skewX(var(--skew))'`  (-8deg)
- `boxShadow: 'inset 0 1px 0 rgba(255,255,255,.4), 0 3px 0 ' + t.lip`
- `whiteSpace: 'nowrap'`
Inner `<span>` style:
- `display: 'inline-flex'`, `alignItems: 'center'`, `gap: 6`
- `transform: 'skewX(calc(var(--skew) * -1))'`  (+8deg)
- `font: 'italic 800 16px/1 var(--font-display)'`, `textTransform: 'uppercase'`, `letterSpacing: '.04em'`
Icon `<i>` style: `fontSize: 14`.

### PILL_TONES (text / grad / lip / solidText)
| tone | text (outline color) | grad (solid bg) | lip (solid) | solidText (solid color) |
|---|---|---|---|---|
| neutral | `var(--text-muted)` | `var(--grad-navy)` | `var(--navy-950)` | `var(--text-strong)` |
| gold | `var(--gold-400)` | `var(--grad-gold)` | `var(--gold-700)` | `var(--gold-900)` |
| sky | `var(--sky-300)` | `var(--grad-sky)` | `#13367a` | `var(--white)` |
| teal | `var(--teal-400)` | `var(--grad-teal)` | `var(--teal-700)` | `var(--teal-900)` |

No interactive states.

---

## core/Icon

Props: `name`, `weight` (`fill`|`bold`, default `fill`), `size` (default `18`), `color`, `className` (default `''`), `title`.

### DOM
```
<i class="ph-{weight} ph-{name}{ ' '+className if any}"
   aria-hidden="{title ? undefined : 'true'}" title="{title}">
```
### `<i>` style (verbatim)
- `fontSize: size`  (number px; default 18)
- `color: color`  (undefined unless passed)
- `lineHeight: 1`, `display: 'inline-block'`

No interactive states. Note: `aria-hidden` is omitted when `title` is set; set `aria-hidden="true"` otherwise.

---

## forms/Input

Props: `value`, `defaultValue`, `onChange`, `onKeyDown`, `placeholder`, `maxLength`, `type` (default `text`), `icon`, `uppercase` (bool, default false), `size` (`md`|`sm`, default `md`), `disabled` (bool), `as` (`input`|`select`, default `input`), `options` (array of string or `{value,label}`), `style`, `inputStyle`.

### DOM
```
<div>                                  (relative wrapper)
  <i class="ph-bold ph-{icon}" aria-hidden="true">   (if icon — left adornment)
  <input …>   OR   <select>…<option>…</select>
  <i class="ph-bold ph-caret-down" aria-hidden="true">   (only when as="select")
</div>
```

### Wrapper `<div>` style
- `position: 'relative'`, `width: '100%'` (+ `style` overrides)

### Control (input/select) base style (verbatim)
- `width: '100%'`
- `padding`: md `'11px 14px'`, sm `'7px 12px'`
- `paddingLeft`: if icon → sm `32`, md `40`; else `undefined`
- `paddingRight`: `as === 'select' ? 38 : undefined`
- `borderRadius: 'var(--radius)'`  (10px)
- `border: '2px solid ' + (focus ? 'var(--teal-400)' : 'var(--navy-600)')`  ← **2px border**
- `background: 'var(--navy-850)'`, `color: 'var(--text-body)'`
- `font: '500 ' + (sm ? '13px' : '15px') + '/1.2 var(--font-body)'`
- `boxShadow: 'var(--shadow-inset-well)' + (focus ? ', var(--focus-ring)' : '')`
- `outline: 'none'`
- `transition: 'border-color var(--dur-fast) ease, box-shadow var(--dur-fast) ease'`
- `textTransform`: `uppercase ? 'uppercase' : undefined`
- `letterSpacing`: `uppercase ? '.12em' : undefined`
- `opacity`: `disabled ? 0.5 : 1`
- `appearance: 'none'`, `WebkitAppearance: 'none'`
- `cursor`: `as === 'select' && !disabled ? 'pointer' : undefined`

### Left icon `<i>` style (icon present)
- `position: 'absolute'`, `left`: sm `11`, md `14`
- `top: '50%'`, `transform: 'translateY(-50%)'`
- `fontSize`: sm `15`, md `18`
- `color`: `focus ? 'var(--teal-400)' : 'var(--text-muted)'`
- `pointerEvents: 'none'`
- (class is `ph-bold`, not fill)

### Select caret `<i class="ph-bold ph-caret-down">` style
- `position: 'absolute'`, `right: 14`, `top: '50%'`, `transform: 'translateY(-50%)'`
- `fontSize: 15`, `color: 'var(--text-muted)'`, `pointerEvents: 'none'`

### Interactive states
- **Focus:** border color → `var(--teal-400)`; box-shadow appends `, var(--focus-ring)` (`0 0 0 3px rgba(79,209,197,.35)`); left icon color → `var(--teal-400)`. Transition 150ms.
- **Disabled:** `opacity: 0.5`; select loses pointer cursor.

---

## forms/Field

Props: `label`, `hint`, `children`.

### DOM
```
<label>
  <span>{label}</span>      (if label — block label above control)
  {children}
  <span>{hint}</span>       (if hint — block hint below)
</label>
```
### `<label>` style: `display: 'block'` (+ `style`).
### Label `<span>` style (verbatim)
- `display: 'block'`, `font: '500 13px/1.2 var(--font-body)'`, `color: 'var(--text-muted)'`, `marginBottom: 6`
### Hint `<span>` style (verbatim)
- `display: 'block'`, `font: '400 12px/1.4 var(--font-body)'`, `color: 'var(--text-muted)'`, `marginTop: 6`

No interactive states.

---

## surfaces/Card

Props: `padding` (default `26`), `tone` (`default`|`hero`, default `default`), `children`.

### DOM
```
<div>{children}</div>
```
### `<div>` style (verbatim)
- `position: 'relative'`, `padding: padding` (default 26px), `color: 'var(--text-body)'`
- `background`: hero → `'linear-gradient(180deg,#1f3466 0%,#15213d 55%,#121a2e 100%)'`; default → `'var(--grad-card)'`
- `border`: `'1px solid ' + (hero ? 'rgba(124,196,255,.28)' : 'var(--navy-600)')`
- `borderRadius: 'var(--radius-card)'`  (16px)
- `boxShadow`: `'var(--shadow-panel), var(--shadow-sheen)' + (hero ? ', 0 0 60px rgba(63,162,255,.18)' : '')`

So:
- default boxShadow = `0 8px 30px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.08)`
- hero boxShadow = adds `, 0 0 60px rgba(63,162,255,.18)`

No interactive states.

---

## surfaces/Panel

Props: `title`, `actions`, `padding` (default `16`), `children`, `bodyStyle`.

### DOM
```
<section>
  <div>                                      (body, padding here)
    <header>                                 (only if title OR actions)
      <h2>                                   (only if title)
        <span aria-hidden="true"></span>     (gold skewed tick)
        {title}
      </h2>
      <div></div>                            (flex:1 spacer)
      {actions}
    </header>
    {children}
  </div>
</section>
```

### `<section>` style (verbatim)
- `background: 'var(--grad-panel)'`
- `backdropFilter: 'var(--blur-overlay)'`, `WebkitBackdropFilter: 'var(--blur-overlay)'`  (blur(8px))
- `border: '1px solid var(--border-glow)'`  (rgba(124,196,255,.18))
- `borderRadius: 'var(--radius-panel)'`  (14px)
- `boxShadow: 'var(--shadow-panel), var(--shadow-sheen)'`
- `color: 'var(--text-body)'`

### Body `<div>` style: `padding: padding` (default 16) + `bodyStyle`.

### `<header>` style: `display: 'flex'`, `alignItems: 'center'`, `gap: 10`, `marginBottom: 12`.

### `<h2>` style (verbatim)
- `display: 'flex'`, `alignItems: 'center'`, `gap: 9`, `margin: 0`
- `font: 'var(--type-panel-title)'`  (italic 800 20px/1 display)
- `textTransform: 'uppercase'`, `letterSpacing: '.04em'`, `color: 'var(--text-strong)'`
- `textShadow: 'var(--text-shadow-display)'`  (0 2px 0 rgba(0,0,0,.35))

### Gold tick `<span>` style (verbatim)
- `width: 5`, `height: 16`, `borderRadius: 2`
- `background: 'var(--grad-gold)'`
- `transform: 'skewX(var(--skew))'`  (-8deg)
- `boxShadow: '0 2px 0 var(--gold-700)'`

### Spacer `<div>` style: `flex: 1`.

No interactive states.

---

## brand/Wordmark

Props: `size` (`sm`|`md`|`lg`|`xl`, default `md`), `layout` (`stacked`|`inline`, default `stacked`), `tagline`, `align` (`left`|`center`, default `left`).

`WM_SIZES = { sm: [16, 30], md: [24, 52], lg: [36, 84], xl: [52, 124] }` → `[smallPx, bigPx]`.
`font` (big line) = `'italic 900 ' + bigPx + 'px/.86 var(--font-display)'`.

### DOM
```
<div>                              (outer column)
  <div>                            (lockup: "I Am" + "President")
    <span>I Am</span>
    <span>President</span>         (gold gradient text)
  </div>
  <div>{tagline}</div>            (if tagline)
</div>
```

### Outer `<div>` style (verbatim)
- `display: 'inline-flex'`, `flexDirection: 'column'`
- `alignItems`: `align === 'center' ? 'center' : 'flex-start'`
- `textAlign: align`

### Lockup `<div>` style (verbatim)
- `filter`: `'drop-shadow(0 ' + Math.max(2, Math.round(bigPx / 18)) + 'px 0 rgba(6,10,20,.6))'`
  - sm(30): `Math.round(30/18)=2` → `drop-shadow(0 2px 0 rgba(6,10,20,.6))`
  - md(52): `Math.round(52/18)=3` → `0 3px 0 …`
  - lg(84): `Math.round(84/18)=5` → `0 5px 0 …`
  - xl(124): `Math.round(124/18)=7` → `0 7px 0 …`
- `textTransform: 'uppercase'`, `letterSpacing: '.005em'`
- `display: 'flex'`
- `flexDirection`: stacked → `'column'`, inline → `'row'`
- `alignItems`: stacked → (`align==='center' ? 'center' : 'flex-start'`); inline → `'baseline'`
- `gap`: stacked → `2`, inline → `'.22em'`

### "I Am" `<span>` style (verbatim)
- `font`: stacked → `'italic 900 ' + smallPx + 'px/1 var(--font-display)'`; inline → `font` (the big line)
- `color: 'var(--white)'`
- `letterSpacing`: stacked → `'.14em'`, inline → `undefined`
- `paddingLeft`: stacked → `'.12em'`, inline → `0`

### "President" `<span>` style (verbatim)
- `font: font`  (big line, `italic 900 {bigPx}px/.86 display`)
- `paddingRight: '.06em'`
- gold gradient text fill:
  - `background: 'linear-gradient(180deg,#fff4cf 0%,#ffd864 38%,#f5b942 62%,#d89a28 100%)'`
  - `WebkitBackgroundClip: 'text'`, `backgroundClip: 'text'`, `color: 'transparent'`, `WebkitTextFillColor: 'transparent'`

### Tagline `<div>` style (verbatim)
- `marginTop: Math.round(bigPx / 4)`  (sm 8, md 13, lg 21, xl 31)
- `font: '500 15px/1.4 var(--font-body)'`, `color: 'var(--text-muted)'`

No interactive states.

---

## hud/ResourceChip

Props: `resource` (default `gold`), `value` (default `0`), `showName` (bool, default `true`). Uses `resourceMeta[resource]` → `{label, icon, color}` and `formatNum`.

### DOM
```
<div title="{m.label}">
  <span>                                  (round icon disc)
    <i class="ph-fill ph-{m.icon}" aria-hidden="true">
  </span>
  <span>{ typeof value==='number' ? formatNum(value) : value }</span>   (big number)
  <span>{m.label}</span>                  (if showName — small uppercase label)
</div>
```

### Outer `<div>` style (verbatim)
- `display: 'inline-flex'`, `alignItems: 'center'`, `gap: 7`
- `padding: '4px 12px 4px 4px'`  (asymmetric; tighter on the icon side)
- `borderRadius: 'var(--radius-pill)'`  (999px)
- `background: 'var(--navy-850)'`, `border: '1px solid var(--navy-600)'`
- `boxShadow: 'var(--shadow-inset-well)'`  (inset 0 2px 0 rgba(0,0,0,.28))
- `fontVariantNumeric: 'tabular-nums'`

### Icon disc `<span>` style (verbatim)
- `width: 26`, `height: 26`, `borderRadius: '50%'`
- `display: 'grid'`, `placeItems: 'center'`, `flexShrink: 0`
- `background: 'color-mix(in oklab, ' + m.color + ' 20%, transparent)'`  (tinted disc per resource)
- `boxShadow: 'inset 0 1px 0 rgba(255,255,255,.12)'`

### Disc icon `<i>` style (verbatim)
- `fontSize: 15`, `color: m.color`, `filter: 'drop-shadow(0 1px 0 rgba(0,0,0,.5))'`

### Value `<span>` style (verbatim)
- `font: 'var(--type-hud-value)'`  (700 22px/1 Barlow Condensed/num)
- `color: m.color`, `textShadow: '0 1px 0 rgba(0,0,0,.4)'`

### Name `<span>` style (verbatim, when showName)
- `font: '500 11px/1 var(--font-body)'`, `color: 'var(--text-muted)'`
- `textTransform: 'uppercase'`, `letterSpacing: '.5px'`

No interactive states.

---

## hud/CountryTag

Props: `name`, `leader`, `owner`, `ownerColor`, `farmland`, `minerals`, `oil`. Uses internal `TagStat` + `resourceMeta`.

### DOM
```
<div>                                   (floating tag)
  <div>{name}</div>                     (big title)
  <div>{leader}</div>                   (if leader)
  <div>                                 (stats row, flex-wrap)
    <TagStat label="Owner"> …swatch + owner… </TagStat>   (if owner !== undefined)
    <TagStat label="Farmland" icon=grains color=res-food>{farmland}</TagStat>   (if farmland !== undefined)
    <TagStat label="Minerals" icon=diamond color=res-minerals>{minerals}</TagStat>   (if minerals !== undefined)
    <TagStat label="Oil" icon=drop color=res-oil>{oil}</TagStat>   (if oil !== undefined)
  </div>
</div>
```

### `TagStat` DOM (per stat)
```
<span>                                  (column)
  <span>{label}</span>                  (small uppercase label)
  <b>                                   (value)
    <i class="ph-fill ph-{icon}" aria-hidden="true">   (if icon)
    {children}
  </b>
</span>
```

### Outer `<div>` style (verbatim)
- `minWidth: 220`, `padding: '14px 16px'`, `borderRadius: 'var(--radius-tag)'`  (12px)
- `background: 'var(--surface-overlay)'`  (rgba(18,26,46,.92))
- `backdropFilter: 'var(--blur-overlay)'`, `WebkitBackdropFilter: 'var(--blur-overlay)'`
- `border: '1px solid var(--border-glow)'`
- `boxShadow: 'var(--shadow-panel), var(--shadow-sheen)'`

### Name `<div>` style (verbatim)
- `font: 'italic 900 26px/1 var(--font-display)'`, `textTransform: 'uppercase'`
- `color: 'var(--text-strong)'`, `textShadow: 'var(--text-shadow-display)'`

### Leader `<div>` style (verbatim)
- `marginTop: 4`, `font: '500 12px/1.3 var(--font-body)'`, `color: 'var(--gold-300)'`

### Stats row `<div>` style (verbatim)
- `display: 'flex'`, `gap: 14`, `marginTop: 10`, `flexWrap: 'wrap'`

### TagStat column `<span>` style: `display: 'flex'`, `flexDirection: 'column'`, `gap: 3`.
### TagStat label `<span>` style (verbatim)
- `font: '500 11px/1 var(--font-body)'`, `color: 'var(--text-muted)'`, `textTransform: 'uppercase'`, `letterSpacing: '.5px'`
### TagStat value `<b>` style (verbatim)
- `display: 'inline-flex'`, `alignItems: 'center'`, `gap: 5`
- `font: 'italic 800 20px/1 var(--font-display)'`, `color: 'var(--text-strong)'`
### TagStat icon `<i>` style: `fontSize: 14`, `color: color`.

### Owner stat specifics (the owner TagStat has no icon; its children are a swatch + text)
Owner swatch `<span>` style (verbatim):
- `width: 10`, `height: 10`, `borderRadius: 3`
- `background: ownerColor || 'var(--globe-land)'`
- `boxShadow: 'inset 0 1px 0 rgba(255,255,255,.35)'`
Owner text `<span>` style (verbatim):
- `font: '600 14px/1 var(--font-body)'`, `fontStyle: 'normal'`  (overrides the italic from the parent `<b>`)

No interactive states.

---

## players/PlayerRow

Props: `color` (default `var(--player-1)`), `name`, `meta`, `me` (bool), `badges` (array of `ai`|`ready`|`host`), `defeated` (bool), `onClick`. Renders `Badge` for each badge with `BADGE_LABELS = { ai:'AI', ready:'Ready', host:'Host' }` (falls back to the raw string).

### DOM
```
<div>                                (row; onClick optional)
  <span></span>                      (colour swatch)
  <div>                              (text column, flex:1)
    <div>                            (name line)
      <span>{name}</span>
      <i class="ph-fill ph-skull" aria-hidden="true">   (if defeated)
    </div>
    <div>{meta}</div>                (if meta)
  </div>
  <Badge kind="{b}">{label}</Badge>  (one per badge, see Badge)
</div>
```

### Row `<div>` style (verbatim)
- `display: 'flex'`, `alignItems: 'center'`, `gap: 10`, `padding: '9px 10px'`
- `borderRadius: 'var(--radius-row)'`  (9px)
- `background`: `me ? 'var(--me-tint)' : 'transparent'`  (me-tint = rgba(79,209,197,.08))
- `boxShadow`: `me ? 'inset 0 0 0 1px rgba(79,209,197,.3)' : 'none'`
- `opacity`: `defeated ? 0.55 : 1`
- `cursor`: `onClick ? 'pointer' : undefined`

### Swatch `<span>` style (verbatim)
- `width: 14`, `height: 14`, `borderRadius: 'var(--radius-xs)'`  (4px)
- `background: color`, `flexShrink: 0`
- `boxShadow: 'inset 0 2px 0 rgba(255,255,255,.35), inset 0 -2px 0 rgba(0,0,0,.25), 0 0 0 2px rgba(0,0,0,.3)'`

### Text column `<div>` style: `flex: 1`, `minWidth: 0`.

### Name line `<div>` style (verbatim)
- `display: 'flex'`, `alignItems: 'center'`, `gap: 5`
- `font: '600 14px/1.25 var(--font-body)'`, `color: 'var(--text-strong)'`
- `whiteSpace: 'nowrap'`, `overflow: 'hidden'`, `textOverflow: 'ellipsis'`
Name inner `<span>` style: `overflow: 'hidden'`, `textOverflow: 'ellipsis'`.
Defeated skull `<i>` style: `fontSize: 14`, `color: 'var(--red-300)'`.

### Meta `<div>` style (verbatim, when meta)
- `font: '400 11px/1.3 var(--font-body)'`, `color: 'var(--text-muted)'`, `marginTop: 1`
- `display: 'flex'`, `alignItems: 'center'`, `gap: 4`, `whiteSpace: 'nowrap'`

### Interactive states
- `me`: tinted bg + inner 1px teal ring.
- `defeated`: opacity 0.55 + skull.
- `onClick`: cursor pointer (no visual hover defined in component).

---

## build/BuildItem

Props: `name`, `icon` (default `buildings`), `tone` (default `var(--sky-500)`), `cost` (object `{resource: number}`), `days`, `description`, `disabled` (bool), `onClick`. Uses `resourceMeta` for cost icons (fallback `{icon:'circle', color:'var(--text-muted)'}`).

### DOM
```
<div role="button" tabindex="{disabled?-1:0}" title="{description}" aria-disabled="{disabled?'true':undefined}">
  <span>                                    (icon tile 40×40)
    <i class="ph-fill ph-{icon}" aria-hidden="true">
  </span>
  <div>                                     (text column, flex:1)
    <div>{name}</div>
    <div>                                   (cost+time line, flex-wrap)
      <span>                                (one per cost key, in object order)
        <i class="ph-fill ph-{m.icon}" aria-hidden="true">{cost[r]}
      </span>
      <span>                                (if days != null)
        <i class="ph-fill ph-hourglass" aria-hidden="true">{days} days
      </span>
    </div>
  </div>
</div>
```

### Row `<div>` style (verbatim)
- `display: 'flex'`, `alignItems: 'center'`, `gap: 10`, `padding: 10`
- `borderRadius: 'var(--radius)'`  (10px)
- `border`: `'1px solid ' + (h ? 'var(--teal-400)' : 'var(--navy-600)')`  (`h = live && hover`)
- `background: 'var(--grad-navy)'`
- `boxShadow`: `'0 ' + (live && pressed ? 1 : 3) + 'px 0 var(--navy-950), inset 0 1px 0 rgba(255,255,255,.06)' + (h ? ', var(--glow-teal)' : '')`
  - resting: `0 3px 0 var(--navy-950), inset 0 1px 0 rgba(255,255,255,.06)`
  - pressed: lip `0 1px 0 …`
  - hover: appends `, var(--glow-teal)` (0 0 18px rgba(79,209,197,.45))
- `transform`: `live && pressed ? 'translateY(2px)' : h ? 'translateY(-1px)' : 'none'`
- `transition: 'transform var(--dur-press) ease, box-shadow var(--dur-fast) ease, border-color var(--dur-fast) ease'`
- `opacity`: `disabled ? 0.5 : 1`
- `cursor`: `disabled ? 'not-allowed' : 'pointer'`, `userSelect: 'none'`

### Icon tile `<span>` style (verbatim)
- `width: 40`, `height: 40`, `borderRadius: 'var(--radius)'`  (10px), `flexShrink: 0`
- `display: 'grid'`, `placeItems: 'center'`
- `background: 'linear-gradient(180deg, rgba(255,255,255,.28), rgba(0,0,0,.18)), ' + tone`  (sheen gradient over the tone color)
- `boxShadow: 'inset 0 1px 0 rgba(255,255,255,.35), 0 3px 0 rgba(0,0,0,.35)'`
### Tile icon `<i>` style (verbatim)
- `fontSize: 22`, `color: '#fff'`, `filter: 'drop-shadow(0 2px 0 rgba(0,0,0,.3))'`

### Text column `<div>` style: `flex: 1`, `minWidth: 0`.
### Name `<div>` style (verbatim): `font: '600 14px/1.2 var(--font-body)'`, `color: 'var(--text-strong)'`.
### Cost/time line `<div>` style (verbatim)
- `display: 'flex'`, `alignItems: 'center'`, `gap: 10`, `marginTop: 5`
- `font: '500 12px/1 var(--font-body)'`, `color: 'var(--text-muted)'`
- `fontVariantNumeric: 'tabular-nums'`, `flexWrap: 'wrap'`
### Each cost `<span>` style: `display: 'inline-flex'`, `alignItems: 'center'`, `gap: 3`. Cost icon `<i>`: `fontSize: 13`, `color: m.color`.
### Days `<span>` style: `display: 'inline-flex'`, `alignItems: 'center'`, `gap: 3`. Hourglass `<i>`: `fontSize: 12` (no color override).

### Interactive states
- **Hover (live):** border → `var(--teal-400)`; box-shadow appends `var(--glow-teal)`; `translateY(-1px)`.
- **Press (live):** lip `0 1px 0 …`; `translateY(2px)`. Transform transition = `var(--dur-press)` (80ms); box-shadow/border = `var(--dur-fast)` (150ms).
- **Disabled:** `opacity: 0.5`, `cursor: not-allowed`, `tabindex=-1`, `aria-disabled=true`; no hover/press (gated by `live`).

---

## feed/FeedEvent

Props: `type` (default `match_started`), `actor`, `day`, `children`. Uses `FEED_TYPES[type]` → `{icon, color}` (fallback `match_started`).

### DOM
```
<div>
  <i class="ph-fill ph-{t.icon}" aria-hidden="true">   (typed icon)
  <div>                                   (body, flex:1)
    <b>{actor}</b>                        (if actor; followed by a literal space)
    {children}
  </div>
  <span>Day {day}</span>                  (if day != null)
</div>
```
Note: when `actor` is present, a literal `' '` space node is rendered between `<b>` and `{children}`.

### Row `<div>` style (verbatim)
- `display: 'flex'`, `alignItems: 'flex-start'`, `gap: 8`, `padding: '5px 0'`
- `borderBottom: '1px solid rgba(255,255,255,.04)'`
- `font: '400 13px/1.4 var(--font-body)'`, `color: 'var(--text-muted)'`

### Icon `<i>` style (verbatim)
- `fontSize: 15`, `color: t.color`, `marginTop: 2`, `flexShrink: 0`

### Body `<div>` style: `flex: 1`, `minWidth: 0`.
### Actor `<b>` style (verbatim): `color: 'var(--text-strong)'`, `fontWeight: 600`.
### Day `<span>` style (verbatim)
- `font: 'italic 700 12px/1.6 var(--font-display)'`, `color: 'var(--navy-400)'`
- `textTransform: 'uppercase'`, `letterSpacing: '.04em'`, `flexShrink: 0`

### FEED_TYPES (icon / color)
| type | icon | color |
|---|---|---|
| conquest | `sword` | `var(--red-300)` |
| build_complete | `check-circle` | `var(--green-300)` |
| ai_build | `robot` | `var(--gold-400)` |
| player_defeated | `skull` | `var(--red-300)` |
| match_ended | `trophy` | `var(--gold-400)` |
| match_started | `flag` | `var(--sky-300)` |
| battle_repelled | `shield` | `var(--sky-300)` |
| trade | `handshake` | `var(--teal-300)` |
| war | `sword` | `var(--red-500)` |
| alliance | `handshake` | `var(--green-300)` |

No interactive states.

---

## feed/ChatMessage

Props: `name` (default `System`), `color` (default `var(--text-muted)`), `children`.

### DOM
```
<div>
  <span>{name}:</span> {children}         (name span, then literal ": " then a space, then children)
</div>
```
Exact: `<span>{name}:</span> {children}` — the colon is inside the span, a space follows the span.

### `<div>` style (verbatim)
- `padding: '3px 0'`, `font: '400 13px/1.4 var(--font-body)'`, `color: 'var(--text-body)'`
### Name `<span>` style (verbatim): `fontWeight: 700`, `color: color`.

No interactive states.

---

## feedback/Toast

Props: `kind` (`default`|`ok`|`err`, default `default`), `icon` (overrides default icon), `children`. Uses `TOAST_KINDS[kind]` → `{border, color, icon}`.

### DOM
```
<div role="status">
  <i class="ph-fill ph-{icon || k.icon}" aria-hidden="true">
  <span>{children}</span>
</div>
```

### `<div>` style (verbatim)
- `display: 'inline-flex'`, `alignItems: 'center'`, `gap: 10`, `padding: '11px 18px'`
- `borderRadius: 'var(--radius)'`  (10px)
- `background: 'var(--grad-navy)'`, `border: '1px solid ' + k.border`, `color: k.color`
- `boxShadow: 'var(--shadow-panel), inset 0 1px 0 rgba(255,255,255,.08), 0 3px 0 var(--navy-950)'`
- `font: '500 14px/1.3 var(--font-body)'`
- `animation: 'iap-toast-in var(--dur-base) var(--ease-pop)'`  (200ms, cubic-bezier(.34,1.56,.64,1))
### Icon `<i>` style (verbatim): `fontSize: 18`, `flexShrink: 0`. (color inherits from `k.color`)

### TOAST_KINDS (border / color / default icon)
| kind | border | color | icon |
|---|---|---|---|
| default | `var(--navy-500)` | `var(--text-body)` | `info` |
| ok | `var(--green-800)` | `var(--green-300)` | `check-circle` |
| err | `var(--red-800)` | `var(--red-300)` | `warning-circle` |

Requires `@keyframes iap-toast-in` (see token reference). Prompt notes stack: top 16px, centred, gap 8px, auto-dismiss 2600ms + 250ms fade (behavioral, not in component CSS).

---

## feedback/Spinner

Props: `size` (default `34`), `color` (default `var(--teal-400)`).

### DOM
```
<span role="progressbar" aria-label="Loading"></span>
```
### `<span>` style (verbatim)
- `display: 'inline-block'`, `width: size`, `height: size`, `borderRadius: '50%'`
- `border: Math.max(2, Math.round(size / 11)) + 'px solid var(--navy-600)'`
  - size 34 → `Math.round(34/11)=3` → `3px solid var(--navy-600)`
  - size 22 → `Math.round(22/11)=2` → `2px solid var(--navy-600)`
  - size 20 → `Math.round(20/11)=2` → `2px`
- `borderTopColor: color`  (teal-400 default; the spinning arc)
- `animation: 'iap-spin 1s linear infinite'`

Requires `@keyframes iap-spin{to{transform:rotate(360deg)}}`.

---

## home/ModeCard

Props: `icon` (default `globe-hemisphere-west`), `title`, `description`, `tone` (`sky`|`gold`|`teal`|`violet`, default `sky`), `onClick`. Uses `MODE_TONES[tone]` → `{grad, lip}`.

### DOM
```
<button type="button">
  <span>                                   (icon tile 48×48)
    <i class="ph-fill ph-{icon}" aria-hidden="true">
  </span>
  <span>                                   (text column, flex:1)
    <span>{title}</span>                   (title line)
    <span>{description}</span>             (description line)
  </span>
</button>
```

### `<button>` style (verbatim)
- `display: 'flex'`, `alignItems: 'center'`, `gap: 14`, `width: '100%'`, `textAlign: 'left'`, `padding: 18`
- `borderRadius: 'var(--radius-panel)'`  (14px)
- `border`: `'1px solid ' + (hover ? 'var(--teal-400)' : 'var(--navy-600)')`
- `background: 'var(--grad-navy)'`, `color: 'var(--text-body)'`, `cursor: 'pointer'`, `font: 'inherit'`
- `boxShadow`: `'0 ' + (pressed ? 1 : 4) + 'px 0 var(--navy-950), 0 10px 24px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.08)' + (hover ? ', var(--glow-teal)' : '')`
  - resting: `0 4px 0 var(--navy-950), 0 10px 24px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.08)`
  - pressed: lip `0 1px 0 …`
  - hover: appends `, var(--glow-teal)`
- `transform`: `pressed ? 'translateY(3px)' : hover ? 'translateY(-2px)' : 'none'`
- `transition: 'transform var(--dur-press) ease, box-shadow var(--dur-fast) ease, border-color var(--dur-fast) ease'`

### Icon tile `<span>` style (verbatim)
- `width: 48`, `height: 48`, `borderRadius: 12`, `flexShrink: 0`, `display: 'grid'`, `placeItems: 'center'`
- `background: t.grad`
- `boxShadow: 'inset 0 2px 0 rgba(255,255,255,.4), 0 3px 0 ' + t.lip`
### Tile icon `<i>` style (verbatim): `fontSize: 26`, `color: '#fff'`, `filter: 'drop-shadow(0 2px 0 rgba(0,0,0,.3))'`.

### Text column `<span>` style: `flex: 1`, `minWidth: 0`.
### Title `<span>` style (verbatim)
- `display: 'block'`, `font: 'italic 800 24px/1 var(--font-display)'`, `textTransform: 'uppercase'`
- `color: 'var(--text-strong)'`, `textShadow: 'var(--text-shadow-display)'`, `marginBottom: 4`
### Description `<span>` style (verbatim)
- `display: 'block'`, `font: '400 13px/1.4 var(--font-body)'`, `color: 'var(--text-muted)'`

### MODE_TONES (grad / lip)
| tone | grad | lip |
|---|---|---|
| sky | `var(--grad-sky)` | `#13367a` |
| gold | `var(--grad-gold)` | `var(--gold-700)` |
| teal | `var(--grad-teal)` | `var(--teal-700)` |
| violet | `linear-gradient(180deg,#c9adf2 0%,#a885d8 50%,#7a58b0 100%)` | `#4e3577` |

### Interactive states
- **Hover:** border → `var(--teal-400)`; box-shadow appends `var(--glow-teal)`; `translateY(-2px)`.
- **Press:** lip `0 1px 0 …`; `translateY(3px)`. Transform 80ms, shadow/border 150ms.
- No disabled prop. `mouseLeave` resets hover+pressed.

---

# PART B — Card render lists

All cards share the same `<style>`:
`html,body{margin:0;background:var(--grad-page),var(--bg-page);min-height:100%}` and `#root{padding:20px}` and `.lbl{font:500 11px/1 var(--font-body);color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}`.

So for every card page: **body background** = `var(--grad-page),var(--bg-page)` with `min-height:100%`, and **#root padding** = `20px`. None of these cards actually use a `.lbl` section label (the `.lbl` class is defined in all but referenced in none of these App() bodies).

---

## core/core.card.html  (`Button`, `Badge`, `Pill`, `Icon`)

Root: `<div style="display:flex; flexDirection:column; gap:18">` containing 4 child rows:

**Row 1** `<div style="display:flex; gap:12; alignItems:center; flexWrap:wrap">`:
1. `<Button variant="gold" icon="play" slanted>Start match</Button>`
2. `<Button variant="primary" icon="check">Ready up</Button>`
3. `<Button>Join</Button>`  (default/md)
4. `<Button variant="danger" icon="x">Surrender</Button>`
5. `<Button variant="ghost" icon="sign-out">Exit</Button>`

**Row 2** `<div style="display:flex; gap:12; alignItems:center; flexWrap:wrap">`:
6. `<Button size="sm" variant="gold">Join</Button>`
7. `<Button size="sm" variant="primary">Send</Button>`
8. `<Button size="sm">Send</Button>`  (default/sm)
9. `<Button size="sm" variant="ghost">Leave</Button>`
10. `<Button size="sm" disabled>Disabled</Button>`  (default/sm/disabled)

**Row 3** `<div style="display:flex; gap:8; alignItems:center; flexWrap:wrap">`:
11. `<Badge kind="ai">AI</Badge>`
12. `<Badge kind="ready" icon="check">Ready</Badge>`
13. `<Badge kind="host">Host</Badge>`
14. `<Badge>Neutral</Badge>`  (default)
15. `<Badge kind="danger" icon="skull">Defeated</Badge>`
16. spacer `<span style="width:12"/>`
17. `<Pill>ONLINE</Pill>`  (outline/neutral)
18. `<Pill icon="key">Code: K7QX2M</Pill>`  (outline/neutral + icon)
19. `<Pill solid tone="gold" icon="sun">Day 14</Pill>`
20. `<Pill solid tone="sky">Lobby</Pill>`

**Row 4** `<div style="display:flex; gap:14; alignItems:center; color:var(--text-muted)">`:
21. `<Icon name="grains" color="var(--res-food)" size={22}/>`
22. `<Icon name="lightning" color="var(--res-energy)" size={22}/>`
23. `<Icon name="diamond" color="var(--res-minerals)" size={22}/>`
24. `<Icon name="coins" color="var(--res-gold)" size={22}/>`
25. `<Icon name="drop" color="var(--res-oil)" size={22}/>`
26. `<Icon name="flask" color="var(--res-research)" size={22}/>`
27. `<Icon name="caret-down" weight="bold"/>`  (size default 18)
28. `<Icon name="magnifying-glass" weight="bold"/>`  (size default 18)

Totals: 10 Buttons, 5 Badges, 4 Pills, 8 Icons.

---

## forms/forms.card.html  (`Input`, `Field`, `Button`)

Root: `<div style="display:grid; gridTemplateColumns:'1fr 1fr'; gap:16">` with 4 Fields:

1. `<Field label="Your name"><Input placeholder="President…" icon="user" maxLength={32}/></Field>`
2. `<Field label="Room code" hint="6 characters, from your host"><div style="display:flex; gap:12"><Input placeholder="Enter room code" uppercase maxLength={6} defaultValue="K7QX2M"/><Button>Join</Button></div></Field>`
3. `<Field label="Mode"><Input as="select" options={['Online','Private','Single player']}/></Field>`
4. `<Field label="Chat"><div style="display:flex; gap:8"><Input size="sm" placeholder="Message the world…"/><Button size="sm">Send</Button></div></Field>`

Totals: 4 Fields, 4 Inputs (text+icon / text+uppercase / select / sm text), 2 Buttons (md Join, sm Send).

---

## surfaces/surfaces.card.html  (`Card`, `Panel`, `Button`, `Pill`)

Root: `<div style="display:grid; gridTemplateColumns:'1fr 1fr 1fr'; gap:16; alignItems:'start'">` with 3 cells:

1. **Hero Card:** `<Card tone="hero" padding={20}>`
   - `<div style="font:var(--type-h3); textTransform:uppercase; color:#fff; textShadow:var(--text-shadow-display)">Hero card</div>`
   - `<p style="font:var(--type-body-sm); color:var(--text-muted); margin:'6px 0 14px'">Main menu container with sky glow.</p>`
   - `<Button size="sm" variant="gold">Play</Button>`

2. **Default Card:** `<Card padding={20}>`
   - `<div style="font:'italic 800 13px/1 var(--font-display)'; letterSpacing:1px; textTransform:uppercase; color:var(--text-muted)">Open matches</div>`
   - `<div style="marginTop:12; font:'600 14px/1.3 var(--font-body)'; color:#fff">World War Wednesday</div>`
   - `<div style="font:var(--type-meta); color:var(--text-muted)">3/8 players · 20s/tick</div>`

3. **Panel:** `<Panel title="Build" actions={<Pill solid tone="gold">Day 14</Pill>}>`
   - body: `<div style="font:var(--type-body-sm); color:var(--text-muted)">Frosted HUD panel that floats over the globe.</div>`

Totals: 2 Cards (hero + default), 1 Panel (with title + actions Pill), 1 Button, 1 Pill.

---

## brand/brand.card.html  (`Wordmark`)

Root: `<div style="display:flex; gap:40; alignItems:center">`:
1. `<Wordmark size="lg" tagline="Lead a nation. Feed your people. Dominate the world."/>`  (stacked default, left)
2. `<div style="display:flex; flexDirection:column; gap:18">` containing:
   - `<Wordmark size="md"/>`  (stacked, no tagline)
   - `<Wordmark size="sm" layout="inline"/>`

Totals: 3 Wordmarks (lg stacked+tagline, md stacked, sm inline).

---

## hud/hud.card.html  (`ResourceChip`, `CountryTag`)

Root: `<div style="display:flex; flexDirection:column; gap:18">` with 2 rows:

**Row 1** `<div style="display:flex; gap:10; flexWrap:wrap">` — all six ResourceChips (showName default true):
1. `<ResourceChip resource="food" value={1840}/>`
2. `<ResourceChip resource="energy" value={412}/>`
3. `<ResourceChip resource="minerals" value={655}/>`
4. `<ResourceChip resource="gold" value={12480}/>`
5. `<ResourceChip resource="oil" value={188}/>`
6. `<ResourceChip resource="research" value={45}/>`

**Row 2** `<div style="display:flex; gap:16">` — 2 CountryTags:
7. `<CountryTag name="Sweden" leader="Lead as Prime Minister Ulf Kristersson" farmland={34} minerals={71} oil={4}/>`  (no owner → owner stat omitted)
8. `<CountryTag name="Egypt" owner="Abdel Fattah el-Sisi" ownerColor="var(--player-4)" farmland={12} minerals={48} oil={55}/>`  (owner stat shown with player-4 swatch)

Totals: 6 ResourceChips (one per resource, in order), 2 CountryTags.

---

## players/players.card.html  (`PlayerRow`, `Icon`)

Container: `<div style="width:320; padding:8; background:var(--grad-panel); borderRadius:14; border:1px solid var(--border-glow)">`.
Helper: `meta=(t,p)` renders `<><Icon name="map-trifold" size={11}/>{t}<span>·</span><Icon name="users-three" size={11}/>{p} pop</>`.

1. `<PlayerRow color="var(--player-1)" name="Supreme Leader Kim Jong Un" meta={meta(14,'26.4M')} me badges={['host']}/>`
2. `<PlayerRow color="var(--player-4)" name="King Salman bin Abdulaziz" meta={meta(9,'35.3M')} badges={['ai']}/>`
3. `<PlayerRow color="var(--player-3)" name="President Emmanuel Macron" meta="Leading FRA" badges={['ready']}/>`  (meta is plain string, no icons)
4. `<PlayerRow color="var(--player-2)" name="President Javier Milei" meta={meta(0,'0')} defeated/>`  (no badges, defeated)

Each meta(t,p) renders exactly: `<i class="ph-fill ph-map-trifold" style="font-size:11">`, `{t}`, `<span>·</span>`, `<i class="ph-fill ph-users-three" style="font-size:11">`, `{p} pop`.

Totals: 4 PlayerRows (me+host, ai, ready, defeated). Row 1 has `me` highlight; row 4 is defeated.

---

## build/build.card.html  (`BuildItem`)

Root: `<div style="display:grid; gridTemplateColumns:'1fr 1fr'; gap:8; maxWidth:640">` with 6 BuildItems:

1. `<BuildItem name="Farm" icon="grains" tone="var(--res-food)" cost={{gold:120,minerals:40}} days={3}/>`
2. `<BuildItem name="Mine" icon="hammer" tone="var(--navy-400)" cost={{gold:150,minerals:30}} days={3}/>`
3. `<BuildItem name="Oil Rig" icon="gas-pump" tone="var(--res-oil)" cost={{gold:200,minerals:70}} days={4}/>`
4. `<BuildItem name="Power Plant" icon="lightning" tone="var(--gold-600)" cost={{gold:180,minerals:80}} days={3}/>`
5. `<BuildItem name="Research Lab" icon="flask" tone="var(--teal-600)" cost={{gold:220,minerals:60}} days={4}/>`
6. `<BuildItem name="Bank" icon="bank" tone="var(--sky-500)" cost={{gold:300}} days={4} disabled/>`

Cost order per item follows object key order (gold, then minerals), then the days span. Item 6 is disabled.

Totals: 6 BuildItems (5 affordable, 1 disabled). No hover variant is statically rendered (hover is a runtime state).

---

## feed/feed.card.html  (`FeedEvent`, `ChatMessage`)

Root: `<div style="display:grid; gridTemplateColumns:'1.2fr 1fr'; gap:20">` with 2 columns.

**Left column** `<div>` — 6 FeedEvents:
1. `<FeedEvent type="match_started" day={0}>The match has begun.</FeedEvent>`  (no actor)
2. `<FeedEvent type="build_complete" actor="Ulf Kristersson" day={4}>completed a farm in Sweden</FeedEvent>`
3. `<FeedEvent type="ai_build" actor="King Salman bin Abdulaziz" day={5}>started an oil rig</FeedEvent>`
4. `<FeedEvent type="conquest" actor="Kim Jong Un" day={12}>conquered South Korea</FeedEvent>`
5. `<FeedEvent type="player_defeated" actor="Javier Milei" day={17}>has been eliminated</FeedEvent>`
6. `<FeedEvent type="match_ended" actor="Kim Jong Un">dominates the world!</FeedEvent>`  (no day)

**Right column** `<div>` — 4 ChatMessages:
7. `<ChatMessage name="Emmanuel Macron" color="var(--player-3)">Anyone selling food? Paying in oil.</ChatMessage>`
8. `<ChatMessage name="Kim Jong Un" color="var(--player-1)">No.</ChatMessage>`
9. `<ChatMessage name="Ulf Kristersson" color="var(--player-6)">I have farms. Let's talk.</ChatMessage>`
10. `<ChatMessage>Javier Milei left the match.</ChatMessage>`  (default name "System", default muted color)

Totals: 6 FeedEvents (one no-actor, one no-day), 4 ChatMessages (one defaulted).

---

## feedback/feedback.card.html  (`Toast`, `Spinner`)

Root: `<div style="display:flex; gap:28; alignItems:center">`:

**Left group** `<div style="display:flex; flexDirection:column; gap:8; alignItems:'flex-start'">` — 3 Toasts:
1. `<Toast kind="ok">You are now Prime Minister Ulf Kristersson of Sweden</Toast>`
2. `<Toast kind="err">Not enough resources.</Toast>`
3. `<Toast>Connecting to the world…</Toast>`  (default kind, info icon)

**Right group** `<div style="display:flex; gap:16; alignItems:center">` — 2 Spinners:
4. `<Spinner/>`  (size 34, teal-400)
5. `<Spinner size={22} color="var(--gold-400)"/>`

Totals: 3 Toasts (ok, err, default), 2 Spinners (default, sm gold).

---

## home/home.card.html  (`ModeCard`)

Root: `<div style="display:grid; gridTemplateColumns:'1fr 1fr'; gap:12; maxWidth:620">` with 3 ModeCards:

1. `<ModeCard icon="globe-hemisphere-west" tone="sky" title="Play Online" description="Create a public match strangers can join."/>`
2. `<ModeCard icon="lock-key" tone="violet" title="Private Room" description="Get a code to play with friends."/>`
3. `<ModeCard icon="robot" tone="gold" title="Single Player" description="Play solo against the computer (3 AI nations)." style={{gridColumn:'span 2'}}/>`  (spans both columns)

Totals: 3 ModeCards (sky, violet, gold; the third spans 2 columns).
