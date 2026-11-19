/* @ds-bundle: {"format":4,"namespace":"IAmPresidentDesignSystem_7cd541","components":[{"name":"Wordmark","sourcePath":"components/brand/Wordmark.jsx"},{"name":"BuildItem","sourcePath":"components/build/BuildItem.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"Pill","sourcePath":"components/core/Pill.jsx"},{"name":"ChatMessage","sourcePath":"components/feed/ChatMessage.jsx"},{"name":"FeedEvent","sourcePath":"components/feed/FeedEvent.jsx"},{"name":"Spinner","sourcePath":"components/feedback/Spinner.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Field","sourcePath":"components/forms/Field.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"ModeCard","sourcePath":"components/home/ModeCard.jsx"},{"name":"CountryTag","sourcePath":"components/hud/CountryTag.jsx"},{"name":"ResourceChip","sourcePath":"components/hud/ResourceChip.jsx"},{"name":"PlayerRow","sourcePath":"components/players/PlayerRow.jsx"},{"name":"Card","sourcePath":"components/surfaces/Card.jsx"},{"name":"Panel","sourcePath":"components/surfaces/Panel.jsx"}],"sourceHashes":{"components/brand/Wordmark.jsx":"e2d59640bb90","components/build/BuildItem.jsx":"17904ed227bd","components/core/Badge.jsx":"04577a3fff67","components/core/Button.jsx":"b7a8efdc5a57","components/core/Icon.jsx":"2b1597856e19","components/core/Pill.jsx":"87419b6675cd","components/feed/ChatMessage.jsx":"d66a1a9478a2","components/feed/FeedEvent.jsx":"05f3fabbc00d","components/feedback/Spinner.jsx":"6a19c14f1db1","components/feedback/Toast.jsx":"b1868f9d9139","components/forms/Field.jsx":"d8dcb6426511","components/forms/Input.jsx":"f306b4a07e34","components/home/ModeCard.jsx":"68cc23e0ed70","components/hud/CountryTag.jsx":"c4ea8707dbf9","components/hud/ResourceChip.jsx":"01e98c64d62f","components/hud/resourceMeta.js":"f9fc67998b45","components/players/PlayerRow.jsx":"f8ae397e5013","components/surfaces/Card.jsx":"1e22e7a0e213","components/surfaces/Panel.jsx":"f926e77dd84c","ui_kits/game/App.jsx":"9b71a228ef82","ui_kits/game/GameScreen.jsx":"87ce7b323860","ui_kits/game/GlobeView.jsx":"e8175b86c8b3","ui_kits/game/HomeScreen.jsx":"dc8a91d8ada6","ui_kits/game/LobbyScreen.jsx":"bc97932bbec3","ui_kits/game/data.js":"67e486b04933","ui_kits/game/globe.js":"85acf01532e3","ui_kits/game/hud/HudBottom.jsx":"03fab1e2ce43","ui_kits/game/hud/HudPanes.jsx":"6f891781533b","ui_kits/game/hud/HudParts.jsx":"39335bd1d396","ui_kits/game/hud/HudSide.jsx":"4af9c3b2fb61","ui_kits/game/hud/HudTop.jsx":"231495374b21","ui_kits/game/hud/MatchHud.jsx":"894fbfc47893","ui_kits/game/hud/hudData.js":"7b89c2a6da83","ui_kits/game/hud/tweaks-panel.jsx":"d259e3a86f73"},"inlinedExternals":[],"unexposedExports":[{"name":"formatNum","sourcePath":"components/hud/resourceMeta.js"},{"name":"resourceMeta","sourcePath":"components/hud/resourceMeta.js"}]} */

(() => {

const __ds_ns = (window.IAmPresidentDesignSystem_7cd541 = window.IAmPresidentDesignSystem_7cd541 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/brand/Wordmark.jsx
try { (() => {
const WM_SIZES = {
  sm: [16, 30],
  md: [24, 52],
  lg: [36, 84],
  xl: [52, 124]
};
function Wordmark({
  size = 'md',
  layout = 'stacked',
  tagline,
  align = 'left',
  style
}) {
  const s = WM_SIZES[size] || WM_SIZES.md;
  const gold = {
    background: 'linear-gradient(180deg,#fff4cf 0%,#ffd864 38%,#f5b942 62%,#d89a28 100%)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    WebkitTextFillColor: 'transparent'
  };
  const font = 'italic 900 ' + s[1] + 'px/.86 var(--font-display)';
  const stacked = layout === 'stacked';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: align === 'center' ? 'center' : 'flex-start',
      textAlign: align,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      filter: 'drop-shadow(0 ' + Math.max(2, Math.round(s[1] / 18)) + 'px 0 rgba(6,10,20,.6))',
      textTransform: 'uppercase',
      letterSpacing: '.005em',
      display: 'flex',
      flexDirection: stacked ? 'column' : 'row',
      alignItems: stacked ? align === 'center' ? 'center' : 'flex-start' : 'baseline',
      gap: stacked ? 2 : '.22em'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: stacked ? 'italic 900 ' + s[0] + 'px/1 var(--font-display)' : font,
      color: 'var(--white)',
      letterSpacing: stacked ? '.14em' : undefined,
      paddingLeft: stacked ? '.12em' : 0
    }
  }, "I Am"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: font,
      paddingRight: '.06em',
      ...gold
    }
  }, "President")), tagline ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: Math.round(s[1] / 4),
      font: '500 15px/1.4 var(--font-body)',
      color: 'var(--text-muted)'
    }
  }, tagline) : null);
}
Object.assign(__ds_scope, { Wordmark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Wordmark.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
const BADGE_KINDS = {
  default: {
    color: 'var(--text-muted)',
    bg: 'rgba(255,255,255,.04)',
    border: 'var(--navy-600)'
  },
  ready: {
    color: 'var(--green-300)',
    bg: 'rgba(60,180,75,.12)',
    border: 'var(--green-800)'
  },
  ai: {
    color: 'var(--gold-400)',
    bg: 'rgba(245,185,66,.10)',
    border: '#5a4a1e'
  },
  host: {
    color: 'var(--sky-300)',
    bg: 'rgba(63,162,255,.10)',
    border: 'var(--sky-800)'
  },
  danger: {
    color: 'var(--red-300)',
    bg: 'rgba(230,25,75,.12)',
    border: 'var(--red-800)'
  }
};
function Badge({
  kind = 'default',
  icon,
  children,
  style
}) {
  const k = BADGE_KINDS[kind] || BADGE_KINDS.default;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      flexShrink: 0,
      padding: '3px 8px 2px',
      borderRadius: 'var(--radius-pill)',
      border: '1px solid ' + k.border,
      background: k.bg,
      color: k.color,
      font: 'italic 800 12px/1 var(--font-display)',
      textTransform: 'uppercase',
      letterSpacing: '.06em',
      whiteSpace: 'nowrap',
      ...style
    }
  }, icon ? /*#__PURE__*/React.createElement("i", {
    className: 'ph-fill ph-' + icon,
    "aria-hidden": "true",
    style: {
      fontSize: 11
    }
  }) : null, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const BTN_VARIANTS = {
  default: {
    bg: 'var(--grad-navy)',
    hoverBg: 'var(--grad-navy)',
    border: 'var(--navy-500)',
    color: 'var(--text-strong)',
    lip: 'var(--navy-950)',
    sheen: 'rgba(255,255,255,.12)',
    ts: '0 2px 0 rgba(0,0,0,.35)'
  },
  primary: {
    bg: 'var(--grad-teal)',
    border: '#2bbdb0',
    color: 'var(--teal-900)',
    lip: 'var(--teal-700)',
    sheen: 'rgba(255,255,255,.45)',
    ts: '0 1px 0 rgba(255,255,255,.3)'
  },
  gold: {
    bg: 'var(--grad-gold)',
    border: '#e3ae3e',
    color: 'var(--gold-900)',
    lip: 'var(--gold-700)',
    sheen: 'rgba(255,255,255,.5)',
    ts: '0 1px 0 rgba(255,255,255,.35)'
  },
  danger: {
    bg: 'linear-gradient(180deg,#4a1a2b 0%,#3a1522 100%)',
    border: 'var(--red-800)',
    color: 'var(--red-300)',
    lip: '#1e0a12',
    sheen: 'rgba(255,255,255,.08)',
    ts: '0 2px 0 rgba(0,0,0,.35)'
  },
  ghost: {
    bg: 'transparent',
    border: 'var(--navy-600)',
    color: 'var(--text-body)',
    lip: null,
    sheen: null,
    ts: 'none'
  }
};
function Button({
  variant = 'default',
  size = 'md',
  icon,
  iconRight,
  slanted = false,
  block = false,
  disabled = false,
  type = 'button',
  onClick,
  children,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const v = BTN_VARIANTS[variant] || BTN_VARIANTS.default;
  const sm = size === 'sm';
  const live = !disabled;
  const lipH = v.lip ? live && pressed ? 1 : sm ? 3 : 4 : 0;
  const ty = live && pressed ? sm ? 2 : 3 : live && hover ? -1 : 0;
  const shadows = [];
  if (v.sheen) shadows.push('inset 0 2px 0 ' + v.sheen, 'inset 0 -3px 0 rgba(0,0,0,.15)');
  if (v.lip) shadows.push('0 ' + lipH + 'px 0 ' + v.lip, '0 ' + (lipH + 6) + 'px 14px rgba(0,0,0,.3)');
  const iconSize = sm ? 16 : 20;
  const bg = variant === 'ghost' && live && hover ? 'rgba(255,255,255,.06)' : v.bg;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPressed(false);
    },
    onPointerDown: () => setPressed(true),
    onPointerUp: () => setPressed(false),
    style: {
      display: block ? 'flex' : 'inline-flex',
      width: block ? '100%' : undefined,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: sm ? '7px 12px' : '11px 18px',
      borderRadius: 'var(--radius)',
      border: '1px solid ' + v.border,
      background: bg,
      color: v.color,
      font: sm ? 'var(--type-button-sm)' : 'var(--type-button)',
      textTransform: 'uppercase',
      letterSpacing: '.02em',
      textShadow: v.ts,
      boxShadow: shadows.length ? shadows.join(', ') : 'none',
      transform: (slanted ? 'skewX(var(--skew)) ' : '') + 'translateY(' + ty + 'px)',
      transition: 'transform var(--dur-press) ease, box-shadow var(--dur-press) ease, filter var(--dur-fast) ease',
      filter: live && hover && variant !== 'ghost' ? 'brightness(1.08)' : 'none',
      opacity: disabled ? 0.45 : 1,
      cursor: disabled ? 'not-allowed' : 'pointer',
      whiteSpace: 'nowrap',
      userSelect: 'none',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      transform: slanted ? 'skewX(calc(var(--skew) * -1))' : undefined
    }
  }, icon ? /*#__PURE__*/React.createElement("i", {
    className: 'ph-fill ph-' + icon,
    "aria-hidden": "true",
    style: {
      fontSize: iconSize,
      lineHeight: 1
    }
  }) : null, children, iconRight ? /*#__PURE__*/React.createElement("i", {
    className: 'ph-fill ph-' + iconRight,
    "aria-hidden": "true",
    style: {
      fontSize: iconSize,
      lineHeight: 1
    }
  }) : null));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Icon({
  name,
  weight = 'fill',
  size = 18,
  color,
  style,
  className = '',
  title,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("i", _extends({
    className: 'ph-' + weight + ' ph-' + name + (className ? ' ' + className : ''),
    "aria-hidden": title ? undefined : 'true',
    title: title,
    style: {
      fontSize: size,
      color: color,
      lineHeight: 1,
      display: 'inline-block',
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/Pill.jsx
try { (() => {
const PILL_TONES = {
  neutral: {
    text: 'var(--text-muted)',
    grad: 'var(--grad-navy)',
    lip: 'var(--navy-950)',
    solidText: 'var(--text-strong)'
  },
  gold: {
    text: 'var(--gold-400)',
    grad: 'var(--grad-gold)',
    lip: 'var(--gold-700)',
    solidText: 'var(--gold-900)'
  },
  sky: {
    text: 'var(--sky-300)',
    grad: 'var(--grad-sky)',
    lip: '#13367a',
    solidText: 'var(--white)'
  },
  teal: {
    text: 'var(--teal-400)',
    grad: 'var(--grad-teal)',
    lip: 'var(--teal-700)',
    solidText: 'var(--teal-900)'
  }
};
function Pill({
  tone = 'neutral',
  solid = false,
  icon,
  children,
  style
}) {
  const t = PILL_TONES[tone] || PILL_TONES.neutral;
  if (!solid) {
    return /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        font: '500 12px/1 var(--font-body)',
        color: t.text,
        border: '1px solid var(--border-default)',
        padding: '4px 10px',
        borderRadius: 'var(--radius-pill)',
        whiteSpace: 'nowrap',
        ...style
      }
    }, icon ? /*#__PURE__*/React.createElement("i", {
      className: 'ph-fill ph-' + icon,
      "aria-hidden": "true",
      style: {
        fontSize: 13
      }
    }) : null, children);
  }
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '5px 12px',
      borderRadius: 6,
      background: t.grad,
      color: t.solidText,
      transform: 'skewX(var(--skew))',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.4), 0 3px 0 ' + t.lip,
      whiteSpace: 'nowrap',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      transform: 'skewX(calc(var(--skew) * -1))',
      font: 'italic 800 16px/1 var(--font-display)',
      textTransform: 'uppercase',
      letterSpacing: '.04em'
    }
  }, icon ? /*#__PURE__*/React.createElement("i", {
    className: 'ph-fill ph-' + icon,
    "aria-hidden": "true",
    style: {
      fontSize: 14
    }
  }) : null, children));
}
Object.assign(__ds_scope, { Pill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Pill.jsx", error: String((e && e.message) || e) }); }

// components/feed/ChatMessage.jsx
try { (() => {
function ChatMessage({
  name = 'System',
  color = 'var(--text-muted)',
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '3px 0',
      font: '400 13px/1.4 var(--font-body)',
      color: 'var(--text-body)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      color: color
    }
  }, name, ":"), " ", children);
}
Object.assign(__ds_scope, { ChatMessage });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feed/ChatMessage.jsx", error: String((e && e.message) || e) }); }

// components/feed/FeedEvent.jsx
try { (() => {
const FEED_TYPES = {
  conquest: {
    icon: 'sword',
    color: 'var(--red-300)'
  },
  build_complete: {
    icon: 'check-circle',
    color: 'var(--green-300)'
  },
  ai_build: {
    icon: 'robot',
    color: 'var(--gold-400)'
  },
  player_defeated: {
    icon: 'skull',
    color: 'var(--red-300)'
  },
  match_ended: {
    icon: 'trophy',
    color: 'var(--gold-400)'
  },
  match_started: {
    icon: 'flag',
    color: 'var(--sky-300)'
  },
  battle_repelled: {
    icon: 'shield',
    color: 'var(--sky-300)'
  },
  trade: {
    icon: 'handshake',
    color: 'var(--teal-300)'
  },
  war: {
    icon: 'sword',
    color: 'var(--red-500)'
  },
  alliance: {
    icon: 'handshake',
    color: 'var(--green-300)'
  }
};
function FeedEvent({
  type = 'match_started',
  actor,
  day,
  children,
  style
}) {
  const t = FEED_TYPES[type] || FEED_TYPES.match_started;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 8,
      padding: '5px 0',
      borderBottom: '1px solid rgba(255,255,255,.04)',
      font: '400 13px/1.4 var(--font-body)',
      color: 'var(--text-muted)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: 'ph-fill ph-' + t.icon,
    "aria-hidden": "true",
    style: {
      fontSize: 15,
      color: t.color,
      marginTop: 2,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, actor ? /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--text-strong)',
      fontWeight: 600
    }
  }, actor) : null, actor ? ' ' : null, children), day != null ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'italic 700 12px/1.6 var(--font-display)',
      color: 'var(--navy-400)',
      textTransform: 'uppercase',
      letterSpacing: '.04em',
      flexShrink: 0
    }
  }, "Day ", day) : null);
}
Object.assign(__ds_scope, { FeedEvent });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feed/FeedEvent.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Spinner.jsx
try { (() => {
function Spinner({
  size = 34,
  color = 'var(--teal-400)',
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    role: "progressbar",
    "aria-label": "Loading",
    style: {
      display: 'inline-block',
      width: size,
      height: size,
      borderRadius: '50%',
      border: Math.max(2, Math.round(size / 11)) + 'px solid var(--navy-600)',
      borderTopColor: color,
      animation: 'iap-spin 1s linear infinite',
      ...style
    }
  });
}
Object.assign(__ds_scope, { Spinner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Spinner.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
const TOAST_KINDS = {
  default: {
    border: 'var(--navy-500)',
    color: 'var(--text-body)',
    icon: 'info'
  },
  ok: {
    border: 'var(--green-800)',
    color: 'var(--green-300)',
    icon: 'check-circle'
  },
  err: {
    border: 'var(--red-800)',
    color: 'var(--red-300)',
    icon: 'warning-circle'
  }
};
function Toast({
  kind = 'default',
  icon,
  children,
  style
}) {
  const k = TOAST_KINDS[kind] || TOAST_KINDS.default;
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      padding: '11px 18px',
      borderRadius: 'var(--radius)',
      background: 'var(--grad-navy)',
      border: '1px solid ' + k.border,
      color: k.color,
      boxShadow: 'var(--shadow-panel), inset 0 1px 0 rgba(255,255,255,.08), 0 3px 0 var(--navy-950)',
      font: '500 14px/1.3 var(--font-body)',
      animation: 'iap-toast-in var(--dur-base) var(--ease-pop)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: 'ph-fill ph-' + (icon || k.icon),
    "aria-hidden": "true",
    style: {
      fontSize: 18,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", null, children));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/forms/Field.jsx
try { (() => {
function Field({
  label,
  hint,
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block',
      ...style
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      font: '500 13px/1.2 var(--font-body)',
      color: 'var(--text-muted)',
      marginBottom: 6
    }
  }, label) : null, children, hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      font: '400 12px/1.4 var(--font-body)',
      color: 'var(--text-muted)',
      marginTop: 6
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { Field });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Field.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Input({
  value,
  defaultValue,
  onChange,
  onKeyDown,
  placeholder,
  maxLength,
  type = 'text',
  icon,
  uppercase = false,
  size = 'md',
  disabled = false,
  as = 'input',
  options = [],
  style,
  inputStyle,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const sm = size === 'sm';
  const base = {
    width: '100%',
    padding: sm ? '7px 12px' : '11px 14px',
    paddingLeft: icon ? sm ? 32 : 40 : undefined,
    paddingRight: as === 'select' ? 38 : undefined,
    borderRadius: 'var(--radius)',
    border: '2px solid ' + (focus ? 'var(--teal-400)' : 'var(--navy-600)'),
    background: 'var(--navy-850)',
    color: 'var(--text-body)',
    font: '500 ' + (sm ? '13px' : '15px') + '/1.2 var(--font-body)',
    boxShadow: 'var(--shadow-inset-well)' + (focus ? ', var(--focus-ring)' : ''),
    outline: 'none',
    transition: 'border-color var(--dur-fast) ease, box-shadow var(--dur-fast) ease',
    textTransform: uppercase ? 'uppercase' : undefined,
    letterSpacing: uppercase ? '.12em' : undefined,
    opacity: disabled ? 0.5 : 1,
    appearance: 'none',
    WebkitAppearance: 'none',
    cursor: as === 'select' && !disabled ? 'pointer' : undefined,
    ...inputStyle
  };
  const handlers = {
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false)
  };
  const field = as === 'select' ? /*#__PURE__*/React.createElement("select", _extends({
    value: value,
    defaultValue: defaultValue,
    onChange: onChange,
    disabled: disabled,
    style: base
  }, handlers, rest), options.map(o => {
    const opt = typeof o === 'string' ? {
      value: o,
      label: o
    } : o;
    return /*#__PURE__*/React.createElement("option", {
      key: opt.value,
      value: opt.value
    }, opt.label);
  })) : /*#__PURE__*/React.createElement("input", _extends({
    type: type,
    value: value,
    defaultValue: defaultValue,
    onChange: onChange,
    onKeyDown: onKeyDown,
    placeholder: placeholder,
    maxLength: maxLength,
    disabled: disabled,
    style: base
  }, handlers, rest));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: '100%',
      ...style
    }
  }, icon ? /*#__PURE__*/React.createElement("i", {
    className: 'ph-bold ph-' + icon,
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      left: sm ? 11 : 14,
      top: '50%',
      transform: 'translateY(-50%)',
      fontSize: sm ? 15 : 18,
      color: focus ? 'var(--teal-400)' : 'var(--text-muted)',
      pointerEvents: 'none'
    }
  }) : null, field, as === 'select' ? /*#__PURE__*/React.createElement("i", {
    className: "ph-bold ph-caret-down",
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      right: 14,
      top: '50%',
      transform: 'translateY(-50%)',
      fontSize: 15,
      color: 'var(--text-muted)',
      pointerEvents: 'none'
    }
  }) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/home/ModeCard.jsx
try { (() => {
const MODE_TONES = {
  sky: {
    grad: 'var(--grad-sky)',
    lip: '#13367a'
  },
  gold: {
    grad: 'var(--grad-gold)',
    lip: 'var(--gold-700)'
  },
  teal: {
    grad: 'var(--grad-teal)',
    lip: 'var(--teal-700)'
  },
  violet: {
    grad: 'linear-gradient(180deg,#c9adf2 0%,#a885d8 50%,#7a58b0 100%)',
    lip: '#4e3577'
  }
};
function ModeCard({
  icon = 'globe-hemisphere-west',
  title,
  description,
  tone = 'sky',
  onClick,
  style
}) {
  const [hover, setHover] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const t = MODE_TONES[tone] || MODE_TONES.sky;
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPressed(false);
    },
    onPointerDown: () => setPressed(true),
    onPointerUp: () => setPressed(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      width: '100%',
      textAlign: 'left',
      padding: 18,
      borderRadius: 'var(--radius-panel)',
      border: '1px solid ' + (hover ? 'var(--teal-400)' : 'var(--navy-600)'),
      background: 'var(--grad-navy)',
      color: 'var(--text-body)',
      cursor: 'pointer',
      font: 'inherit',
      boxShadow: '0 ' + (pressed ? 1 : 4) + 'px 0 var(--navy-950), 0 10px 24px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.08)' + (hover ? ', var(--glow-teal)' : ''),
      transform: pressed ? 'translateY(3px)' : hover ? 'translateY(-2px)' : 'none',
      transition: 'transform var(--dur-press) ease, box-shadow var(--dur-fast) ease, border-color var(--dur-fast) ease',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 48,
      height: 48,
      borderRadius: 12,
      flexShrink: 0,
      display: 'grid',
      placeItems: 'center',
      background: t.grad,
      boxShadow: 'inset 0 2px 0 rgba(255,255,255,.4), 0 3px 0 ' + t.lip
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: 'ph-fill ph-' + icon,
    "aria-hidden": "true",
    style: {
      fontSize: 26,
      color: '#fff',
      filter: 'drop-shadow(0 2px 0 rgba(0,0,0,.3))'
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      font: 'italic 800 24px/1 var(--font-display)',
      textTransform: 'uppercase',
      color: 'var(--text-strong)',
      textShadow: 'var(--text-shadow-display)',
      marginBottom: 4
    }
  }, title), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      font: '400 13px/1.4 var(--font-body)',
      color: 'var(--text-muted)'
    }
  }, description)));
}
Object.assign(__ds_scope, { ModeCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/home/ModeCard.jsx", error: String((e && e.message) || e) }); }

// components/hud/resourceMeta.js
try { (() => {
// Shared resource metadata (icons = Phosphor Fill names; colours = --res-* tokens).
const resourceMeta = {
  food: {
    label: 'Food',
    icon: 'grains',
    color: 'var(--res-food)'
  },
  energy: {
    label: 'Energy',
    icon: 'lightning',
    color: 'var(--res-energy)'
  },
  minerals: {
    label: 'Minerals',
    icon: 'diamond',
    color: 'var(--res-minerals)'
  },
  gold: {
    label: 'Gold',
    icon: 'coins',
    color: 'var(--res-gold)'
  },
  oil: {
    label: 'Oil',
    icon: 'drop',
    color: 'var(--res-oil)'
  },
  research: {
    label: 'Research',
    icon: 'flask',
    color: 'var(--res-research)'
  }
};

// Mirrors UI.num() in public/js/ui.js: 1234567 -> "1.23M", 12345 -> "12.3K"
function formatNum(n) {
  n = Number(n) || 0;
  const a = Math.abs(n);
  if (a >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (a >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (a >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Math.round(n).toString();
}
Object.assign(__ds_scope, { resourceMeta, formatNum });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/hud/resourceMeta.js", error: String((e && e.message) || e) }); }

// components/build/BuildItem.jsx
try { (() => {
function BuildItem({
  name,
  icon = 'buildings',
  tone = 'var(--sky-500)',
  cost = {},
  days,
  description,
  disabled = false,
  onClick,
  style
}) {
  const [hover, setHover] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const live = !disabled;
  const h = live && hover;
  return /*#__PURE__*/React.createElement("div", {
    role: "button",
    tabIndex: disabled ? -1 : 0,
    title: description,
    "aria-disabled": disabled ? 'true' : undefined,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPressed(false);
    },
    onPointerDown: () => setPressed(true),
    onPointerUp: () => setPressed(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: 10,
      borderRadius: 'var(--radius)',
      border: '1px solid ' + (h ? 'var(--teal-400)' : 'var(--navy-600)'),
      background: 'var(--grad-navy)',
      boxShadow: '0 ' + (live && pressed ? 1 : 3) + 'px 0 var(--navy-950), inset 0 1px 0 rgba(255,255,255,.06)' + (h ? ', var(--glow-teal)' : ''),
      transform: live && pressed ? 'translateY(2px)' : h ? 'translateY(-1px)' : 'none',
      transition: 'transform var(--dur-press) ease, box-shadow var(--dur-fast) ease, border-color var(--dur-fast) ease',
      opacity: disabled ? 0.5 : 1,
      cursor: disabled ? 'not-allowed' : 'pointer',
      userSelect: 'none',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 'var(--radius)',
      flexShrink: 0,
      display: 'grid',
      placeItems: 'center',
      background: 'linear-gradient(180deg, rgba(255,255,255,.28), rgba(0,0,0,.18)), ' + tone,
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.35), 0 3px 0 rgba(0,0,0,.35)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: 'ph-fill ph-' + icon,
    "aria-hidden": "true",
    style: {
      fontSize: 22,
      color: '#fff',
      filter: 'drop-shadow(0 2px 0 rgba(0,0,0,.3))'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '600 14px/1.2 var(--font-body)',
      color: 'var(--text-strong)'
    }
  }, name), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginTop: 5,
      font: '500 12px/1 var(--font-body)',
      color: 'var(--text-muted)',
      fontVariantNumeric: 'tabular-nums',
      flexWrap: 'wrap'
    }
  }, Object.keys(cost).map(r => {
    const m = __ds_scope.resourceMeta[r] || {
      icon: 'circle',
      color: 'var(--text-muted)'
    };
    return /*#__PURE__*/React.createElement("span", {
      key: r,
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3
      }
    }, /*#__PURE__*/React.createElement("i", {
      className: 'ph-fill ph-' + m.icon,
      "aria-hidden": "true",
      style: {
        fontSize: 13,
        color: m.color
      }
    }), cost[r]);
  }), days != null ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph-fill ph-hourglass",
    "aria-hidden": "true",
    style: {
      fontSize: 12
    }
  }), days, " days") : null)));
}
Object.assign(__ds_scope, { BuildItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/build/BuildItem.jsx", error: String((e && e.message) || e) }); }

// components/hud/CountryTag.jsx
try { (() => {
function TagStat({
  label,
  icon,
  color,
  children
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 11px/1 var(--font-body)',
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '.5px'
    }
  }, label), /*#__PURE__*/React.createElement("b", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      font: 'italic 800 20px/1 var(--font-display)',
      color: 'var(--text-strong)'
    }
  }, icon ? /*#__PURE__*/React.createElement("i", {
    className: 'ph-fill ph-' + icon,
    "aria-hidden": "true",
    style: {
      fontSize: 14,
      color: color
    }
  }) : null, children));
}
function CountryTag({
  name,
  leader,
  owner,
  ownerColor,
  farmland,
  minerals,
  oil,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 220,
      padding: '14px 16px',
      borderRadius: 'var(--radius-tag)',
      background: 'var(--surface-overlay)',
      backdropFilter: 'var(--blur-overlay)',
      WebkitBackdropFilter: 'var(--blur-overlay)',
      border: '1px solid var(--border-glow)',
      boxShadow: 'var(--shadow-panel), var(--shadow-sheen)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'italic 900 26px/1 var(--font-display)',
      textTransform: 'uppercase',
      color: 'var(--text-strong)',
      textShadow: 'var(--text-shadow-display)'
    }
  }, name), leader ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      font: '500 12px/1.3 var(--font-body)',
      color: 'var(--gold-300)'
    }
  }, leader) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      marginTop: 10,
      flexWrap: 'wrap'
    }
  }, owner !== undefined ? /*#__PURE__*/React.createElement(TagStat, {
    label: "Owner"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: 3,
      background: ownerColor || 'var(--globe-land)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.35)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 14px/1 var(--font-body)',
      fontStyle: 'normal'
    }
  }, owner)) : null, farmland !== undefined ? /*#__PURE__*/React.createElement(TagStat, {
    label: "Farmland",
    icon: __ds_scope.resourceMeta.food.icon,
    color: __ds_scope.resourceMeta.food.color
  }, farmland) : null, minerals !== undefined ? /*#__PURE__*/React.createElement(TagStat, {
    label: "Minerals",
    icon: __ds_scope.resourceMeta.minerals.icon,
    color: __ds_scope.resourceMeta.minerals.color
  }, minerals) : null, oil !== undefined ? /*#__PURE__*/React.createElement(TagStat, {
    label: "Oil",
    icon: __ds_scope.resourceMeta.oil.icon,
    color: __ds_scope.resourceMeta.oil.color
  }, oil) : null));
}
Object.assign(__ds_scope, { CountryTag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/hud/CountryTag.jsx", error: String((e && e.message) || e) }); }

// components/hud/ResourceChip.jsx
try { (() => {
function ResourceChip({
  resource = 'gold',
  value = 0,
  showName = true,
  style
}) {
  const m = __ds_scope.resourceMeta[resource] || __ds_scope.resourceMeta.gold;
  return /*#__PURE__*/React.createElement("div", {
    title: m.label,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      padding: '4px 12px 4px 4px',
      borderRadius: 'var(--radius-pill)',
      background: 'var(--navy-850)',
      border: '1px solid var(--navy-600)',
      boxShadow: 'var(--shadow-inset-well)',
      fontVariantNumeric: 'tabular-nums',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 26,
      height: 26,
      borderRadius: '50%',
      display: 'grid',
      placeItems: 'center',
      flexShrink: 0,
      background: 'color-mix(in oklab, ' + m.color + ' 20%, transparent)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.12)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: 'ph-fill ph-' + m.icon,
    "aria-hidden": "true",
    style: {
      fontSize: 15,
      color: m.color,
      filter: 'drop-shadow(0 1px 0 rgba(0,0,0,.5))'
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-hud-value)',
      color: m.color,
      textShadow: '0 1px 0 rgba(0,0,0,.4)'
    }
  }, typeof value === 'number' ? __ds_scope.formatNum(value) : value), showName ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 11px/1 var(--font-body)',
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '.5px'
    }
  }, m.label) : null);
}
Object.assign(__ds_scope, { ResourceChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/hud/ResourceChip.jsx", error: String((e && e.message) || e) }); }

// components/players/PlayerRow.jsx
try { (() => {
const BADGE_LABELS = {
  ai: 'AI',
  ready: 'Ready',
  host: 'Host'
};
function PlayerRow({
  color = 'var(--player-1)',
  name,
  meta,
  me = false,
  badges = [],
  defeated = false,
  onClick,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '9px 10px',
      borderRadius: 'var(--radius-row)',
      background: me ? 'var(--me-tint)' : 'transparent',
      boxShadow: me ? 'inset 0 0 0 1px rgba(79,209,197,.3)' : 'none',
      opacity: defeated ? 0.55 : 1,
      cursor: onClick ? 'pointer' : undefined,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 14,
      height: 14,
      borderRadius: 'var(--radius-xs)',
      background: color,
      flexShrink: 0,
      boxShadow: 'inset 0 2px 0 rgba(255,255,255,.35), inset 0 -2px 0 rgba(0,0,0,.25), 0 0 0 2px rgba(0,0,0,.3)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      font: '600 14px/1.25 var(--font-body)',
      color: 'var(--text-strong)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, name), defeated ? /*#__PURE__*/React.createElement("i", {
    className: "ph-fill ph-skull",
    "aria-hidden": "true",
    style: {
      fontSize: 14,
      color: 'var(--red-300)'
    }
  }) : null), meta ? /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 11px/1.3 var(--font-body)',
      color: 'var(--text-muted)',
      marginTop: 1,
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      whiteSpace: 'nowrap'
    }
  }, meta) : null), badges.map(b => /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    key: b,
    kind: b
  }, BADGE_LABELS[b] || b)));
}
Object.assign(__ds_scope, { PlayerRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/players/PlayerRow.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Card({
  padding = 26,
  tone = 'default',
  children,
  style,
  ...rest
}) {
  const hero = tone === 'hero';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      padding: padding,
      color: 'var(--text-body)',
      background: hero ? 'linear-gradient(180deg,#1f3466 0%,#15213d 55%,#121a2e 100%)' : 'var(--grad-card)',
      border: '1px solid ' + (hero ? 'rgba(124,196,255,.28)' : 'var(--navy-600)'),
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-panel), var(--shadow-sheen)' + (hero ? ', 0 0 60px rgba(63,162,255,.18)' : ''),
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Card.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Panel.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Panel({
  title,
  actions,
  padding = 16,
  children,
  style,
  bodyStyle,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("section", _extends({
    style: {
      background: 'var(--grad-panel)',
      backdropFilter: 'var(--blur-overlay)',
      WebkitBackdropFilter: 'var(--blur-overlay)',
      border: '1px solid var(--border-glow)',
      borderRadius: 'var(--radius-panel)',
      boxShadow: 'var(--shadow-panel), var(--shadow-sheen)',
      color: 'var(--text-body)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: padding,
      ...bodyStyle
    }
  }, title || actions ? /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12
    }
  }, title ? /*#__PURE__*/React.createElement("h2", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      margin: 0,
      font: 'var(--type-panel-title)',
      textTransform: 'uppercase',
      letterSpacing: '.04em',
      color: 'var(--text-strong)',
      textShadow: 'var(--text-shadow-display)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 5,
      height: 16,
      borderRadius: 2,
      background: 'var(--grad-gold)',
      transform: 'skewX(var(--skew))',
      boxShadow: '0 2px 0 var(--gold-700)'
    }
  }), title) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), actions) : null, children));
}
Object.assign(__ds_scope, { Panel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Panel.jsx", error: String((e && e.message) || e) }); }

// ui_kits/game/App.jsx
try { (() => {
// App shell: screen routing + toast host (source: public/js/ui.js toasts).
function App() {
  const {
    Toast
  } = window.IAP_DS;
  const D = window.IAP_DATA;
  const hash = (location.hash || '').replace('#', '');
  const [screen, setScreen] = React.useState(['lobby', 'game'].includes(hash) ? hash : 'home');
  const [name, setName] = React.useState('');
  const [match, setMatch] = React.useState(hash === 'lobby' || hash === 'game' ? {
    id: 4821,
    name: 'World Stage',
    mode: hash === 'game' ? 'single' : 'online',
    join_code: null
  } : null);
  const [roster, setRoster] = React.useState(null);
  const [countries, setCountries] = React.useState(null);
  const [toasts, setToasts] = React.useState([]);
  React.useEffect(() => {
    fetch(D.GEO_URL).then(r => r.json()).then(fc => {
      const m = {};
      fc.features.forEach(f => {
        m[f.properties.code] = f.properties;
      });
      setCountries(m);
    });
  }, []);
  const toast = React.useCallback((msg, kind) => {
    const id = Math.random();
    setToasts(t => [...t, {
      id,
      msg,
      kind: kind || 'default',
      out: false
    }]);
    setTimeout(() => setToasts(t => t.map(x => x.id === id ? {
      ...x,
      out: true
    } : x)), 2600);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2850);
  }, []);
  const displayName = name.trim() || 'Guest';
  const go = s => {
    setScreen(s);
    history.replaceState(null, '', '#' + s);
  };
  const create = mode => {
    setMatch({
      id: 4830,
      name: displayName + "'s match",
      mode,
      join_code: mode === 'private' ? 'K7QX2M' : null
    });
    go('lobby');
  };

  // Default roster when deep-linking straight to #game.
  React.useEffect(() => {
    if (screen === 'game' && !roster) {
      setRoster([{
        id: 'me',
        name: displayName,
        country: 'SWE',
        color: D.COLORS[0]
      }, ...D.OPPONENTS.single.map((o, i) => ({
        id: 'p' + i,
        name: o.name,
        country: o.country,
        ai: true,
        color: D.COLORS[i + 1]
      }))]);
    }
  }, [screen]);
  let view = null;
  if (screen === 'home') {
    view = /*#__PURE__*/React.createElement(HomeScreen, {
      name: name,
      setName: setName,
      toast: toast,
      onCreate: create,
      onJoinCode: code => {
        setMatch({
          id: 4831,
          name: 'Private room',
          mode: 'private',
          join_code: code
        });
        go('lobby');
      },
      onJoinMatch: m => {
        setMatch({
          id: m.id,
          name: m.name,
          mode: 'online',
          join_code: null
        });
        go('lobby');
      }
    });
  } else if (screen === 'lobby' && match) {
    view = /*#__PURE__*/React.createElement(LobbyScreen, {
      key: 'l' + match.id,
      match: match,
      myName: displayName,
      countries: countries,
      toast: toast,
      onLeave: () => go('home'),
      onStart: players => {
        setRoster(players);
        go('game');
      }
    });
  } else if (screen === 'game' && match && roster && countries) {
    view = /*#__PURE__*/React.createElement(GameScreen, {
      key: 'g' + match.id,
      match: match,
      lobbyPlayers: roster,
      countries: countries,
      toast: toast,
      onExit: () => {
        setRoster(null);
        go('home');
      }
    });
  }
  return /*#__PURE__*/React.createElement(React.Fragment, null, view, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      top: 16,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      alignItems: 'center',
      pointerEvents: 'none'
    }
  }, toasts.map(t => /*#__PURE__*/React.createElement(Toast, {
    key: t.id,
    kind: t.kind,
    style: {
      opacity: t.out ? 0 : 1,
      transition: 'opacity .25s ease'
    }
  }, t.msg))));
}

// UI.num / UI.int from public/js/ui.js
window.IAP_UI = {
  num(n) {
    n = Number(n) || 0;
    const a = Math.abs(n);
    if (a >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (a >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (a >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return Math.round(n).toString();
  },
  int(n) {
    return Math.round(Number(n) || 0).toLocaleString();
  }
};
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/game/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/game/GameScreen.jsx
try { (() => {
// In-match screen (source: public/pages/game/index.php + public/js/game.js).
// Engine is faked client-side from GameConfig values; one demo tick = 6s (real default: 20s).
const GAME_TICK_MS = 6000;
const GAME_CONQUESTS = {
  SAU: ['YEM', 'OMN', 'JOR'],
  PRK: ['KOR'],
  BRA: ['URY', 'PRY', 'BOL'],
  FRA: ['BEL', 'CHE'],
  NOR: ['FIN'],
  DEU: ['AUT', 'CZE'],
  IND: ['NPL', 'BGD'],
  MEX: ['GTM'],
  JPN: [],
  CAN: [],
  AUS: []
};
let gameUid = 100;
function GameScreen({
  match,
  lobbyPlayers,
  countries,
  onExit,
  toast
}) {
  const {
    Panel,
    Pill,
    Button,
    ResourceChip,
    PlayerRow,
    BuildItem,
    FeedEvent,
    ChatMessage,
    Input,
    CountryTag,
    Icon
  } = window.IAP_DS;
  const D = window.IAP_DATA;
  const cname = code => countries[code] ? countries[code].name : code;
  const [S, setS] = React.useState(() => {
    const players = lobbyPlayers.map(p => {
      const per = D.persona(p.country, cname(p.country));
      return {
        id: p.id,
        display_name: per.name,
        leader_title: per.title,
        country: p.country,
        color: p.color,
        is_ai: !!p.ai,
        pop: countries[p.country] && countries[p.country].pop || 1e7
      };
    });
    const territories = {};
    players.forEach(p => {
      territories[p.country] = p.id;
    });
    const me = players[0];
    const buildings = D.START_BUILDINGS.map((t, i) => ({
      id: 'b' + i,
      country: me.country,
      type: t,
      status: 'active',
      complete_at: 0
    }));
    const res = {
      ...D.START,
      food: Math.max(D.START.food, Math.ceil(me.pop * 1e-6 * 2 * 12))
    };
    return {
      day: 0,
      players,
      territories,
      buildings,
      res,
      events: [{
        id: 1,
        type: 'match_started',
        text: 'The match has begun.',
        day: 0
      }]
    };
  });
  const [chat, setChat] = React.useState(() => match.mode === 'online' && S.players[1] ? [{
    id: 1,
    name: S.players[1].display_name,
    color: S.players[1].color,
    body: 'Anyone selling food? Paying in oil.'
  }] : []);
  const [msg, setMsg] = React.useState('');
  const [selected, setSelected] = React.useState(S.players[0].country);
  const [hover, setHover] = React.useState(null);
  const [vw, setVw] = React.useState(window.innerWidth);
  React.useEffect(() => {
    const f = () => setVw(window.innerWidth);
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  const wide = vw >= 1680;
  const tight = vw < 1100;

  // ---- tick ----
  React.useEffect(() => {
    const step = s => {
      const day = s.day + 1;
      const me = s.players[0];
      const props = countries[me.country] || {
        farmland: 50,
        minerals: 50,
        oil: 50
      };
      const r = {
        ...s.res
      };
      const events = s.events.slice();
      const buildings = s.buildings.map(b => {
        if (b.status === 'building' && b.complete_at <= day) {
          events.unshift({
            id: ++gameUid,
            type: 'build_complete',
            actor: me.display_name,
            text: 'completed a ' + D.BUILDINGS[b.type].name.toLowerCase() + ' in ' + cname(b.country),
            day
          });
          return {
            ...b,
            status: 'active'
          };
        }
        return b;
      });
      const active = buildings.filter(b => b.status === 'active');
      const demand = active.reduce((a, b) => a + (D.BUILDINGS[b.type].needs_energy || 0), 0);
      let energyIn = 0;
      active.forEach(b => {
        if (b.type === 'power_plant') {
          energyIn += 170;
          r.oil = Math.max(0, r.oil - 18);
        }
      });
      const factor = r.energy + energyIn >= demand ? 1 : 0.5;
      r.energy = Math.max(0, r.energy + energyIn - demand);
      active.forEach(b => {
        const B = D.BUILDINGS[b.type];
        if (b.type === 'power_plant') return;
        const scale = B.scale ? (props[B.scale] || 50) / 50 : 1;
        Object.keys(B.produces || {}).forEach(k => {
          r[k] += B.produces[k] * scale * factor;
        });
        Object.keys(B.consumes || {}).forEach(k => {
          r[k] = Math.max(0, r[k] - B.consumes[k]);
        });
      });
      const popM = me.pop * 1e-6;
      r.food -= popM * 2;
      r.gold += popM * 2;
      const fed = r.food >= 0;
      if (!fed) r.food = 0;
      const housing = active.filter(b => b.type === 'housing').length;
      const cap = (countries[me.country] && countries[me.country].pop || me.pop) * 1.25 + housing * 40e6;
      const players = s.players.map((p, i) => i === 0 ? {
        ...p,
        pop: fed ? Math.min(cap, p.pop * 1.01) : p.pop * 0.985
      } : {
        ...p,
        pop: p.pop * 1.006
      });
      let territories = s.territories;
      if (day % 3 === 0) {
        const attackers = players.slice(1).filter(p => (GAME_CONQUESTS[p.country] || []).length);
        const a = attackers[(day / 3 - 1) % Math.max(1, attackers.length)];
        if (a) {
          const target = GAME_CONQUESTS[a.country].find(t => countries[t] && !territories[t]);
          if (target) {
            territories = {
              ...territories,
              [target]: a.id
            };
            events.unshift({
              id: ++gameUid,
              type: 'conquest',
              actor: a.display_name,
              text: 'conquered ' + cname(target),
              day
            });
          }
        }
      }
      return {
        ...s,
        day,
        res: r,
        buildings,
        players,
        territories,
        events: events.slice(0, 40)
      };
    };
    const t = setInterval(() => setS(step), GAME_TICK_MS);
    return () => clearInterval(t);
  }, []);
  const me = S.players[0];
  const owners = React.useMemo(() => {
    const color = {};
    S.players.forEach(p => {
      color[p.id] = p.color;
    });
    const m = {};
    Object.keys(S.territories).forEach(c => {
      m[c] = color[S.territories[c]];
    });
    return m;
  }, [S.territories]);
  const terrCount = id => Object.values(S.territories).filter(x => x === id).length;
  const standings = S.players.slice().sort((a, b) => terrCount(b.id) - terrCount(a.id));
  const canAfford = type => Object.entries(D.BUILDINGS[type].cost).every(([k, v]) => (S.res[k] || 0) >= v);
  const build = type => {
    const B = D.BUILDINGS[type];
    if (!canAfford(type)) return toast('Not enough resources.', 'err');
    setS(s => {
      const r = {
        ...s.res
      };
      Object.keys(B.cost).forEach(k => {
        r[k] -= B.cost[k];
      });
      return {
        ...s,
        res: r,
        buildings: [...s.buildings, {
          id: 'b' + ++gameUid,
          country: selected,
          type,
          status: 'building',
          complete_at: s.day + B.build_ticks
        }]
      };
    });
    toast(B.name + ' started.', 'ok');
  };
  const send = () => {
    const body = msg.trim();
    if (!body) return;
    setMsg('');
    setChat(c => [...c, {
      id: ++gameUid,
      name: me.display_name,
      color: me.color,
      body
    }]);
  };
  const chatRef = React.useRef(null);
  React.useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chat]);
  const owned = selected && S.territories[selected] === me.id;
  const here = S.buildings.filter(b => b.country === selected);
  const ownerOf = code => S.players.find(p => p.id === S.territories[code]);
  const persona = (me.leader_title ? me.leader_title + ' ' : '') + me.display_name + ' · ' + cname(me.country);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(GlobeView, {
    autoRotate: false,
    selectable: true,
    owners: owners,
    focusCode: me.country,
    onHover: (c, p) => setHover(c ? {
      code: c,
      props: p
    } : null),
    onSelect: c => setSelected(c)
  }), /*#__PURE__*/React.createElement(TopBar, null, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '1 1 auto',
      minWidth: 0,
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(TopTitle, null, tight ? me.display_name : persona)), /*#__PURE__*/React.createElement(Pill, {
    solid: true,
    tone: "gold",
    icon: "sun",
    style: {
      flexShrink: 0
    }
  }, "Day ", S.day), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: tight ? 4 : 8,
      flexWrap: 'nowrap',
      flexShrink: 0
    }
  }, D.RES.map(k => /*#__PURE__*/React.createElement(ResourceChip, {
    key: k,
    resource: k,
    value: S.res[k],
    showName: wide,
    style: tight ? {
      padding: '3px 8px 3px 3px',
      gap: 4
    } : undefined
  }))), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "ghost",
    icon: "sign-out",
    onClick: onExit,
    style: {
      marginLeft: 4,
      flexShrink: 0
    }
  }, tight ? '' : 'Exit')), /*#__PURE__*/React.createElement(Panel, {
    title: "World standings",
    style: {
      position: 'fixed',
      top: 86,
      left: 14,
      width: 270,
      maxHeight: 'calc(100vh - 100px)',
      overflow: 'auto',
      zIndex: 10
    }
  }, standings.map(p => /*#__PURE__*/React.createElement(PlayerRow, {
    key: p.id,
    color: p.color,
    me: p.id === me.id,
    badges: p.is_ai ? ['ai'] : [],
    style: {
      marginTop: 4
    },
    name: (p.leader_title ? p.leader_title + ' ' : '') + p.display_name,
    meta: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
      name: "map-trifold",
      size: 11
    }), terrCount(p.id), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement(Icon, {
      name: "users-three",
      size: 11
    }), window.IAP_UI.num(p.pop), " pop")
  }))), /*#__PURE__*/React.createElement(Panel, {
    title: "Build",
    style: {
      position: 'fixed',
      top: 86,
      right: 14,
      width: 300,
      maxHeight: 'calc(100vh - 100px)',
      overflow: 'auto',
      zIndex: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 14px/1.4 var(--font-body)',
      color: 'var(--text-muted)',
      marginBottom: 12
    }
  }, !selected ? 'Click a country you control to build.' : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--text-strong)',
      fontWeight: 600
    }
  }, cname(selected)), owned ? '' : ' — not yours')), owned ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, Object.keys(D.BUILDINGS).map(type => {
    const B = D.BUILDINGS[type];
    return /*#__PURE__*/React.createElement(BuildItem, {
      key: type,
      name: B.name,
      icon: B.icon,
      tone: B.tone,
      cost: B.cost,
      days: B.build_ticks,
      description: B.desc,
      disabled: !canAfford(type),
      onClick: () => build(type)
    });
  })) : null, here.length ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '14px 0 6px',
      font: '500 12px/1 var(--font-body)',
      color: 'var(--text-muted)'
    }
  }, "Buildings here"), here.map(b => {
    const B = D.BUILDINGS[b.type];
    return /*#__PURE__*/React.createElement("div", {
      key: b.id,
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        font: '400 13px/1 var(--font-body)',
        padding: '4px 0'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: B.icon,
      size: 14,
      color: B.tone
    }), B.name), b.status === 'active' ? /*#__PURE__*/React.createElement(Icon, {
      name: "check-circle",
      size: 15,
      color: "var(--green-300)"
    }) : /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        color: 'var(--text-muted)',
        animation: 'iap-pulse 1.6s ease-in-out infinite'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "hourglass",
      size: 12
    }), "day ", b.complete_at));
  })) : null), /*#__PURE__*/React.createElement(Panel, {
    title: "Dispatches",
    style: {
      position: 'fixed',
      bottom: 14,
      left: 14,
      width: 360,
      zIndex: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: 150,
      overflow: 'auto'
    }
  }, S.events.map(e => /*#__PURE__*/React.createElement(FeedEvent, {
    key: e.id,
    type: e.type,
    actor: e.actor,
    day: e.day
  }, e.text))), /*#__PURE__*/React.createElement("div", {
    ref: chatRef,
    style: {
      maxHeight: 140,
      overflow: 'auto',
      margin: '8px 0'
    }
  }, chat.map(m => /*#__PURE__*/React.createElement(ChatMessage, {
    key: m.id,
    name: m.name,
    color: m.color
  }, m.body))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Input, {
    size: "sm",
    value: msg,
    onChange: e => setMsg(e.target.value),
    onKeyDown: e => {
      if (e.key === 'Enter') send();
    },
    placeholder: "Message the world\u2026",
    maxLength: 400
  }), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    onClick: send
  }, "Send"))), hover ? (() => {
    const o = ownerOf(hover.code);
    return /*#__PURE__*/React.createElement(CountryTag, {
      style: {
        position: 'fixed',
        bottom: 14,
        right: 14,
        zIndex: 11
      },
      name: hover.props.name,
      owner: o ? o.display_name : 'Neutral',
      ownerColor: o ? o.color : undefined,
      farmland: hover.props.farmland,
      minerals: hover.props.minerals,
      oil: hover.props.oil
    });
  })() : null, /*#__PURE__*/React.createElement(GlobeHint, null, "Drag to rotate \xB7 scroll to zoom \xB7 click your land to build"));
}
window.GameScreen = GameScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/game/GameScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/game/GlobeView.jsx
try { (() => {
// React wrapper around window.Globe (globe.js). Full-bleed, fixed behind the HUD.
function GlobeView({
  autoRotate = true,
  selectable = true,
  owners,
  selected,
  focusCode,
  onHover,
  onSelect
}) {
  const {
    Spinner
  } = window.IAP_DS;
  const hostRef = React.useRef(null);
  const globeRef = React.useRef(null);
  const cbs = React.useRef({});
  cbs.current = {
    onHover,
    onSelect
  };
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    const g = new window.Globe(hostRef.current, {
      autoRotate
    });
    globeRef.current = g;
    let alive = true;
    g.load(window.IAP_DATA.GEO_URL).then(() => {
      if (!alive) return;
      g.setSelectable(selectable);
      g.onHover((c, p) => cbs.current.onHover && cbs.current.onHover(c, p));
      g.onSelect((c, p) => cbs.current.onSelect && cbs.current.onSelect(c, p));
      setReady(true);
    });
    return () => {
      alive = false;
      g.destroy();
    };
  }, []);
  React.useEffect(() => {
    if (ready) globeRef.current.setOwners(owners || {});
  }, [ready, owners]);
  React.useEffect(() => {
    if (ready) globeRef.current.setSelected(selected || null);
  }, [ready, selected]);
  React.useEffect(() => {
    if (ready && focusCode) globeRef.current.focus(focusCode);
  }, [ready, focusCode]);
  return /*#__PURE__*/React.createElement("div", {
    ref: hostRef,
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 0
    }
  }, !ready ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Spinner, null)) : null);
}
function GlobeHint({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      bottom: 14,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 5,
      pointerEvents: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      font: '400 12px/1 var(--font-body)',
      color: 'var(--text-muted)',
      textShadow: '0 1px 2px rgba(0,0,0,.6)',
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph-fill ph-hand-grabbing",
    "aria-hidden": "true",
    style: {
      fontSize: 14
    }
  }), children);
}

// Top bar shell shared by lobby + match (source: .panel.topbar).
function TopBar({
  children
}) {
  const {
    Panel
  } = window.IAP_DS;
  return /*#__PURE__*/React.createElement(Panel, {
    style: {
      position: 'fixed',
      top: 14,
      left: 14,
      right: 14,
      zIndex: 10
    },
    padding: "10px 16px",
    bodyStyle: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      minHeight: 56 - 20
    }
  }, children);
}
function TopTitle({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'italic 800 24px/1 var(--font-display)',
      textTransform: 'uppercase',
      color: 'var(--text-strong)',
      textShadow: 'var(--text-shadow-display)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      minWidth: 0
    }
  }, children);
}
Object.assign(window, {
  GlobeView,
  GlobeHint,
  TopBar,
  TopTitle
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/game/GlobeView.jsx", error: String((e && e.message) || e) }); }

// ui_kits/game/HomeScreen.jsx
try { (() => {
// Home (source: public/pages/home/index.php + public/js/home.js)
function HomeScreen({
  name,
  setName,
  onCreate,
  onJoinCode,
  onJoinMatch,
  toast
}) {
  const {
    Card,
    Wordmark,
    Field,
    Input,
    ModeCard,
    Button
  } = window.IAP_DS;
  const [code, setCode] = React.useState('');
  const join = () => {
    const c = code.trim().toUpperCase();
    if (!c) return toast('Enter a room code.', 'err');
    onJoinCode(c);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100vh',
      overflow: 'auto',
      display: 'grid',
      placeItems: 'center',
      padding: 24,
      boxSizing: 'border-box',
      background: 'var(--pattern-stripes), var(--grad-hero)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 'min(560px, 94vw)',
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Card, {
    tone: "hero"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Wordmark, {
    size: "md",
    tagline: "Lead a nation. Feed your people. Dominate the world."
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Your name"
  }, /*#__PURE__*/React.createElement(Input, {
    value: name,
    onChange: e => setName(e.target.value),
    placeholder: "President\u2026",
    maxLength: 32,
    icon: "user"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12,
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement(ModeCard, {
    icon: "globe-hemisphere-west",
    tone: "sky",
    title: "Play Online",
    description: "Create a public match strangers can join.",
    onClick: () => onCreate('online')
  }), /*#__PURE__*/React.createElement(ModeCard, {
    icon: "lock-key",
    tone: "violet",
    title: "Private Room",
    description: "Get a code to play with friends.",
    onClick: () => onCreate('private')
  }), /*#__PURE__*/React.createElement(ModeCard, {
    icon: "robot",
    tone: "gold",
    title: "Single Player",
    description: "Play solo against the computer (3 AI nations).",
    onClick: () => onCreate('single'),
    style: {
      gridColumn: 'span 2'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement(Input, {
    value: code,
    onChange: e => setCode(e.target.value.toUpperCase()),
    onKeyDown: e => {
      if (e.key === 'Enter') join();
    },
    placeholder: "Enter room code",
    uppercase: true,
    maxLength: 6
  }), /*#__PURE__*/React.createElement(Button, {
    onClick: join
  }, "Join")))), /*#__PURE__*/React.createElement(Card, {
    padding: 22
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: '0 0 6px',
      font: 'italic 800 16px/1 var(--font-display)',
      letterSpacing: '1px',
      color: 'var(--text-muted)',
      textTransform: 'uppercase'
    }
  }, "Open matches"), window.IAP_DATA.OPEN_MATCHES.map(m => /*#__PURE__*/React.createElement("div", {
    key: m.id,
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: '10px 0',
      borderBottom: '1px solid rgba(255,255,255,.05)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '600 15px/1.3 var(--font-body)',
      color: 'var(--text-strong)'
    }
  }, m.name), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 12px/1.4 var(--font-body)',
      color: 'var(--text-muted)'
    }
  }, m.players, "/", m.max_players, " players \xB7 ", m.tick_interval_sec, "s/tick")), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "primary",
    onClick: () => onJoinMatch(m)
  }, "Join"))))));
}
window.HomeScreen = HomeScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/game/HomeScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/game/LobbyScreen.jsx
try { (() => {
// Lobby (source: public/pages/lobby/index.php + public/js/lobby.js)
function LobbyScreen({
  match,
  myName,
  countries,
  onLeave,
  onStart,
  toast
}) {
  const {
    Panel,
    Pill,
    Button,
    PlayerRow,
    CountryTag
  } = window.IAP_DS;
  const D = window.IAP_DATA;
  const [myCountry, setMyCountry] = React.useState(null);
  const [ready, setReady] = React.useState(false);
  const [hover, setHover] = React.useState(null);
  const [starting, setStarting] = React.useState(false);
  const others = D.OPPONENTS[match.mode] || [];
  const players = [{
    id: 'me',
    name: myName,
    country: myCountry,
    ready: ready,
    host: true,
    color: D.COLORS[0]
  }, ...others.map((o, i) => ({
    id: 'p' + i,
    name: o.name,
    country: o.country,
    ready: o.ready,
    ai: o.ai,
    color: D.COLORS[i + 1]
  }))];
  const owners = React.useMemo(() => {
    const m = {};
    players.forEach(p => {
      if (p.country) m[p.country] = p.color;
    });
    return m;
  }, [myCountry]);
  const cname = code => countries && countries[code] ? countries[code].name : code;
  const select = (code, props) => {
    if (players.some(p => p.id !== 'me' && p.country === code)) return toast('That country is already taken.', 'err');
    setMyCountry(code);
    toast('You are now ' + D.leaderOf(code, props.name) + ' of ' + props.name, 'ok');
  };
  const start = () => {
    setStarting(true);
    const taken = players.map(p => p.country).filter(Boolean);
    const pool = ['DEU', 'JPN', 'CAN', 'IND', 'MEX', 'AUS'].filter(c => !taken.includes(c));
    const final = players.map(p => ({
      ...p,
      country: p.country || (p.id === 'me' ? 'SWE' : pool.shift())
    }));
    setTimeout(() => onStart(final), 350);
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(GlobeView, {
    autoRotate: true,
    selectable: true,
    owners: owners,
    selected: myCountry,
    onHover: (c, p) => setHover(c ? {
      code: c,
      props: p
    } : null),
    onSelect: select
  }), /*#__PURE__*/React.createElement(TopBar, null, /*#__PURE__*/React.createElement(TopTitle, null, match.name), /*#__PURE__*/React.createElement(Pill, null, match.mode.toUpperCase()), match.join_code ? /*#__PURE__*/React.createElement(Pill, {
    icon: "key",
    tone: "gold"
  }, "Code: ", match.join_code) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "ghost",
    icon: "sign-out",
    onClick: onLeave
  }, "Leave")), /*#__PURE__*/React.createElement(Panel, {
    title: "Players",
    style: {
      position: 'fixed',
      top: 86,
      left: 14,
      width: 270,
      maxHeight: 'calc(100vh - 100px)',
      overflow: 'auto',
      zIndex: 10
    }
  }, players.map(p => {
    const badges = [];
    if (p.ai) badges.push('ai');else if (p.ready) badges.push('ready');
    if (p.host) badges.push('host');
    return /*#__PURE__*/React.createElement(PlayerRow, {
      key: p.id,
      color: p.color,
      name: p.name,
      me: p.id === 'me',
      meta: p.country ? 'Leading ' + p.country : 'Choosing country…',
      badges: badges,
      style: {
        marginTop: 4
      }
    });
  })), /*#__PURE__*/React.createElement(Panel, {
    title: "Your nation",
    style: {
      position: 'fixed',
      top: 86,
      right: 14,
      width: 300,
      zIndex: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, myCountry ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'italic 900 30px/1 var(--font-display)',
      textTransform: 'uppercase',
      color: 'var(--teal-300)',
      textShadow: 'var(--text-shadow-display)'
    }
  }, cname(myCountry)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      font: '500 13px/1.35 var(--font-body)',
      color: 'var(--gold-300)'
    }
  }, D.leaderOf(myCountry, cname(myCountry)))) : null, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      font: '400 14px/1.45 var(--font-body)',
      color: 'var(--text-muted)'
    }
  }, "Spin the globe and click a country to lead."), /*#__PURE__*/React.createElement(Button, {
    variant: ready ? 'primary' : 'default',
    icon: ready ? 'check-circle' : undefined,
    onClick: () => setReady(!ready),
    block: true
  }, ready ? 'Ready' : 'Ready up'), /*#__PURE__*/React.createElement(Button, {
    variant: "gold",
    icon: "play",
    slanted: true,
    block: true,
    disabled: starting,
    onClick: start
  }, "Start match"))), hover ? /*#__PURE__*/React.createElement(CountryTag, {
    style: {
      position: 'fixed',
      bottom: 14,
      right: 14,
      zIndex: 10
    },
    name: hover.props.name,
    leader: 'Lead as ' + D.leaderOf(hover.code, hover.props.name),
    farmland: hover.props.farmland,
    minerals: hover.props.minerals,
    oil: hover.props.oil
  }) : null, /*#__PURE__*/React.createElement(GlobeHint, null, "Drag to rotate \xB7 scroll to zoom \xB7 click a country to claim it"));
}
window.LobbyScreen = LobbyScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/game/LobbyScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/game/data.js
try { (() => {
// Mock data for the game UI kit. Values copied from the source repo:
// leaders → db/seeds/leaders.sql · buildings/start/colours → utils/engine/GameConfig.php
window.IAP_DATA = function () {
  const LEADERS = {
    USA: ['Donald Trump', 'President'],
    RUS: ['Vladimir Putin', 'President'],
    CHN: ['Xi Jinping', 'President'],
    PRK: ['Kim Jong Un', 'Supreme Leader'],
    KOR: ['Lee Jae-myung', 'President'],
    GBR: ['Keir Starmer', 'Prime Minister'],
    DEU: ['Friedrich Merz', 'Chancellor'],
    FRA: ['Emmanuel Macron', 'President'],
    IND: ['Narendra Modi', 'Prime Minister'],
    JPN: ['Sanae Takaichi', 'Prime Minister'],
    CAN: ['Mark Carney', 'Prime Minister'],
    BRA: ['Luiz Inácio Lula da Silva', 'President'],
    SAU: ['Salman bin Abdulaziz', 'King'],
    MEX: ['Claudia Sheinbaum', 'President'],
    AUS: ['Anthony Albanese', 'Prime Minister'],
    ITA: ['Giorgia Meloni', 'Prime Minister'],
    ESP: ['Pedro Sánchez', 'Prime Minister'],
    IDN: ['Prabowo Subianto', 'President'],
    TUR: ['Recep Tayyip Erdoğan', 'President'],
    EGY: ['Abdel Fattah el-Sisi', 'President'],
    NGA: ['Bola Tinubu', 'President'],
    ZAF: ['Cyril Ramaphosa', 'President'],
    ARG: ['Javier Milei', 'President'],
    UKR: ['Volodymyr Zelensky', 'President'],
    POL: ['Karol Nawrocki', 'President'],
    NLD: ['Dick Schoof', 'Prime Minister'],
    SWE: ['Ulf Kristersson', 'Prime Minister'],
    NOR: ['Jonas Gahr Støre', 'Prime Minister'],
    FIN: ['Petteri Orpo', 'Prime Minister'],
    DNK: ['Mette Frederiksen', 'Prime Minister'],
    IRN: ['Ali Khamenei', 'Supreme Leader'],
    IRQ: ['Mohammed Shia al-Sudani', 'Prime Minister'],
    ISR: ['Benjamin Netanyahu', 'Prime Minister'],
    PAK: ['Shehbaz Sharif', 'Prime Minister'],
    VNM: ['Tô Lâm', 'General Secretary'],
    THA: ['Anutin Charnvirakul', 'Prime Minister'],
    PHL: ['Ferdinand Marcos Jr.', 'President'],
    MYS: ['Anwar Ibrahim', 'Prime Minister'],
    NZL: ['Christopher Luxon', 'Prime Minister'],
    GRC: ['Kyriakos Mitsotakis', 'Prime Minister'],
    HUN: ['Viktor Orbán', 'Prime Minister'],
    COL: ['Gustavo Petro', 'President'],
    CHL: ['Gabriel Boric', 'President'],
    VEN: ['Nicolás Maduro', 'President'],
    ETH: ['Abiy Ahmed', 'Prime Minister'],
    KEN: ['William Ruto', 'President'],
    MAR: ['Mohammed VI', 'King'],
    DZA: ['Abdelmadjid Tebboune', 'President'],
    KAZ: ['Kassym-Jomart Tokayev', 'President'],
    UZB: ['Shavkat Mirziyoyev', 'President'],
    SYR: ['Ahmed al-Sharaa', 'President'],
    QAT: ['Tamim bin Hamad Al Thani', 'Emir'],
    ARE: ['Mohamed bin Zayed Al Nahyan', 'President'],
    JOR: ['Abdullah II', 'King'],
    CUB: ['Miguel Díaz-Canel', 'President']
  };
  function persona(code, countryName) {
    const l = LEADERS[code];
    return l ? {
      name: l[0],
      title: l[1]
    } : {
      name: 'President of ' + countryName,
      title: ''
    };
  }
  function leaderOf(code, countryName) {
    const l = LEADERS[code];
    return l ? l[1] + ' ' + l[0] : 'President of ' + countryName;
  }

  // GameConfig::BUILDINGS (icon → Phosphor Fill name, tone → tile colour)
  const BUILDINGS = {
    farm: {
      name: 'Farm',
      icon: 'grains',
      tone: 'var(--res-food)',
      cost: {
        gold: 120,
        minerals: 40
      },
      build_ticks: 3,
      produces: {
        food: 100
      },
      scale: 'farmland',
      needs_energy: 12,
      desc: 'Feeds your population. Output scales with farmland.'
    },
    mine: {
      name: 'Mine',
      icon: 'hammer',
      tone: 'var(--navy-400)',
      cost: {
        gold: 150,
        minerals: 30
      },
      build_ticks: 3,
      produces: {
        minerals: 85
      },
      scale: 'minerals',
      needs_energy: 22,
      desc: 'Extracts ore. Output scales with mineral richness.'
    },
    oil_rig: {
      name: 'Oil Rig',
      icon: 'gas-pump',
      tone: 'var(--res-oil)',
      cost: {
        gold: 200,
        minerals: 70
      },
      build_ticks: 4,
      produces: {
        oil: 70
      },
      scale: 'oil',
      needs_energy: 18,
      desc: 'Pumps oil. Output scales with oil reserves.'
    },
    power_plant: {
      name: 'Power Plant',
      icon: 'lightning',
      tone: 'var(--gold-600)',
      cost: {
        gold: 180,
        minerals: 80
      },
      build_ticks: 3,
      produces: {
        energy: 170
      },
      consumes: {
        oil: 18
      },
      needs_energy: 0,
      desc: 'Burns oil for energy. Energy powers everything else.'
    },
    factory: {
      name: 'Factory',
      icon: 'factory',
      tone: 'var(--red-600)',
      cost: {
        gold: 260,
        minerals: 120
      },
      build_ticks: 5,
      produces: {
        gold: 80
      },
      consumes: {
        minerals: 40
      },
      needs_energy: 45,
      desc: 'Turns ore into wealth and, later, weapons.'
    },
    lab: {
      name: 'Research Lab',
      icon: 'flask',
      tone: 'var(--teal-600)',
      cost: {
        gold: 220,
        minerals: 60
      },
      build_ticks: 4,
      produces: {
        research: 45
      },
      needs_energy: 32,
      desc: 'Generates research to advance technology.'
    },
    bank: {
      name: 'Bank',
      icon: 'bank',
      tone: 'var(--sky-500)',
      cost: {
        gold: 300
      },
      build_ticks: 4,
      produces: {
        gold: 120
      },
      needs_energy: 15,
      desc: 'Steady gold income for trade and upkeep.'
    },
    housing: {
      name: 'Housing',
      icon: 'house-line',
      tone: 'var(--green-600)',
      cost: {
        gold: 160,
        minerals: 50
      },
      build_ticks: 3,
      produces: {},
      needs_energy: 10,
      desc: 'Raises the population cap so your nation can grow.'
    }
  };
  const START = {
    food: 800,
    energy: 400,
    minerals: 500,
    gold: 1500,
    oil: 200,
    research: 0
  };
  const START_BUILDINGS = ['farm', 'farm', 'power_plant', 'mine'];
  const COLORS = ['#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4', '#42d4f4', '#f032e6', '#bfef45', '#fabed4', '#469990', '#dcbeff', '#9a6324'];
  const RES = ['food', 'energy', 'minerals', 'gold', 'oil', 'research'];
  const OPEN_MATCHES = [{
    id: 4821,
    name: 'World Stage',
    players: 3,
    max_players: 8,
    tick_interval_sec: 20
  }, {
    id: 4819,
    name: 'Cold War Rematch',
    players: 6,
    max_players: 8,
    tick_interval_sec: 20
  }, {
    id: 4815,
    name: 'Oil & Bread',
    players: 1,
    max_players: 4,
    tick_interval_sec: 10
  }];

  // Lobby opponents per mode. Online/private = humans; single = 3 AI (GameConfig: single → 4 max, 3 AI).
  const OPPONENTS = {
    online: [{
      name: 'marianne_77',
      country: 'FRA',
      ready: true
    }, {
      name: 'nordwind',
      country: 'NOR',
      ready: false
    }],
    private: [{
      name: 'oskar',
      country: null,
      ready: false
    }],
    single: [{
      name: 'AI 1',
      country: 'SAU',
      ai: true
    }, {
      name: 'AI 2',
      country: 'PRK',
      ai: true
    }, {
      name: 'AI 3',
      country: 'BRA',
      ai: true
    }]
  };
  return {
    LEADERS,
    persona,
    leaderOf,
    BUILDINGS,
    START,
    START_BUILDINGS,
    COLORS,
    RES,
    OPEN_MATCHES,
    OPPONENTS,
    GEO_URL: '../../assets/data/countries.geo.json'
  };
}();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/game/data.js", error: String((e && e.message) || e) }); }

// ui_kits/game/globe.js
try { (() => {
// Interactive 3D globe — restyled port of public/js/globe.js (three.js r149 UMD + earcut).
// Same API as the source: new Globe(el, {autoRotate}); await g.load(url); g.onHover/onSelect/setOwners/setSelected/focus.
// Game-layer changes: brighter ocean + land, stronger atmosphere, gold hover rim, destroy() for SPA use.
(function () {
  const DEG2RAD = Math.PI / 180;
  const R = 1;
  const NEUTRAL_LAND = 0x4d6390; // source 0x30415e
  const OCEAN = 0x123a7a; // source 0x0c182e
  const SELECTED = 0x4fd1c5; // teal-400 (same as source)
  const HOVER_EMISSIVE = 0x2a3f66; // source 0x203040
  const _geoCache = {};
  function lonLatToVec3(lon, lat, r) {
    const phi = (90 - lat) * DEG2RAD;
    const theta = (lon + 180) * DEG2RAD;
    return [-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)];
  }
  class Globe {
    constructor(container, opts = {}) {
      this.container = container;
      this.meshes = [];
      this.byCode = {};
      this.props = {};
      this.owners = {};
      this.selectable = false;
      this.selectedCode = null;
      this.hoverCode = null;
      this._selectCb = null;
      this._hoverCb = null;
      this.autoRotate = opts.autoRotate !== false;
      this._initScene();
      this._initControls();
      this._animate = this._animate.bind(this);
      this._raf = requestAnimationFrame(this._animate);
      this._onResize = () => this._resize();
      window.addEventListener('resize', this._onResize);
    }
    _initScene() {
      const w = this.container.clientWidth || 800,
        h = this.container.clientHeight || 600;
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
      this.camera.position.set(0, 0, 3.0);
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.setSize(w, h);
      this.container.appendChild(this.renderer.domElement);
      this.world = new THREE.Group();
      this.world.rotation.x = 0.35;
      this.scene.add(this.world);
      this.world.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.998, 64, 48), new THREE.MeshPhongMaterial({
        color: OCEAN,
        shininess: 10,
        specular: 0x1a3a6a
      })));
      this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
      const dir = new THREE.DirectionalLight(0xfff4dd, 0.7);
      dir.position.set(3, 2, 4);
      this.scene.add(dir);
      const rim = new THREE.DirectionalLight(0x7cc4ff, 0.35);
      rim.position.set(-4, 1, -2);
      this.scene.add(rim);
      // Atmosphere: two additive back-side shells.
      [[1.06, 0.14], [1.14, 0.06]].forEach(([s, o]) => this.scene.add(new THREE.Mesh(new THREE.SphereGeometry(R * s, 48, 32), new THREE.MeshBasicMaterial({
        color: 0x3fa2ff,
        transparent: true,
        opacity: o,
        side: THREE.BackSide
      }))));
      this.raycaster = new THREE.Raycaster();
    }
    async load(url) {
      if (!_geoCache[url]) _geoCache[url] = fetch(url).then(r => r.json());
      const fc = await _geoCache[url];
      const borderPositions = [];
      for (const feat of fc.features) {
        const code = feat.properties.code;
        this.props[code] = feat.properties;
        const polys = feat.geometry.type === 'Polygon' ? [feat.geometry.coordinates] : feat.geometry.coordinates;
        const positions = [],
          indices = [];
        let vBase = 0;
        for (const poly of polys) {
          const flat = earcut.flatten(poly);
          const tris = earcut(flat.vertices, flat.holes, flat.dimensions);
          const V = flat.vertices;
          // Subdivide big flat triangles so the surface hugs the sphere (no chords dipping under the ocean).
          const MAX = 2.5;
          const emit = (a, b, c, depth) => {
            const d = (p, q) => Math.max(Math.abs(p[0] - q[0]), Math.abs(p[1] - q[1]));
            if (depth < 7 && Math.max(d(a, b), d(b, c), d(c, a)) > MAX) {
              const ab = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2],
                bc = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2],
                ca = [(c[0] + a[0]) / 2, (c[1] + a[1]) / 2];
              emit(a, ab, ca, depth + 1);
              emit(ab, b, bc, depth + 1);
              emit(ca, bc, c, depth + 1);
              emit(ab, bc, ca, depth + 1);
              return;
            }
            for (const p of [a, b, c]) {
              const v = lonLatToVec3(p[0], p[1], R * 1.002);
              positions.push(v[0], v[1], v[2]);
              indices.push(vBase++);
            }
          };
          for (let i = 0; i < tris.length; i += 3) {
            const P = k => [V[tris[i + k] * 2], V[tris[i + k] * 2 + 1]];
            emit(P(0), P(1), P(2), 0);
          }
          for (const ring of poly) {
            for (let i = 0; i < ring.length - 1; i++) {
              const a = lonLatToVec3(ring[i][0], ring[i][1], R * 1.004);
              const b = lonLatToVec3(ring[i + 1][0], ring[i + 1][1], R * 1.004);
              borderPositions.push(a[0], a[1], a[2], b[0], b[1], b[2]);
            }
          }
        }
        if (!positions.length) continue;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.setIndex(indices);
        geo.computeVertexNormals();
        const mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({
          color: NEUTRAL_LAND,
          shininess: 10,
          specular: 0x222222
        }));
        mesh.userData.code = code;
        this.world.add(mesh);
        this.meshes.push(mesh);
        this.byCode[code] = mesh;
      }
      const bgeo = new THREE.BufferGeometry();
      bgeo.setAttribute('position', new THREE.Float32BufferAttribute(borderPositions, 3));
      this.world.add(new THREE.LineSegments(bgeo, new THREE.LineBasicMaterial({
        color: 0x0a1120,
        transparent: true,
        opacity: 0.55
      })));
      this._recolorAll();
      return this;
    }
    _initControls() {
      const el = this.renderer.domElement;
      let down = false,
        lx = 0,
        ly = 0,
        moved = 0;
      el.style.cursor = 'grab';
      el.addEventListener('pointerdown', e => {
        down = true;
        lx = e.clientX;
        ly = e.clientY;
        moved = 0;
        this._userActive = true;
      });
      this._onUp = e => {
        if (down && moved < 6) this._pick(e, true);
        down = false;
      };
      window.addEventListener('pointerup', this._onUp);
      el.addEventListener('pointermove', e => {
        if (down) {
          const dx = e.clientX - lx,
            dy = e.clientY - ly;
          lx = e.clientX;
          ly = e.clientY;
          moved += Math.abs(dx) + Math.abs(dy);
          this.world.rotation.y += dx * 0.005;
          this.world.rotation.x = Math.max(-1.2, Math.min(1.2, this.world.rotation.x + dy * 0.005));
        } else this._pick(e, false);
      });
      el.addEventListener('pointerleave', () => {
        if (this.hoverCode) {
          this.hoverCode = null;
          this._recolorAll();
          if (this._hoverCb) this._hoverCb(null, null);
        }
      });
      el.addEventListener('wheel', e => {
        e.preventDefault();
        this.camera.position.z = Math.max(1.5, Math.min(6, this.camera.position.z + e.deltaY * 0.0016));
      }, {
        passive: false
      });
    }
    _pick(e, isClick) {
      const rect = this.renderer.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2((e.clientX - rect.left) / rect.width * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      this.raycaster.setFromCamera(ndc, this.camera);
      const hit = this.raycaster.intersectObjects(this.meshes, false)[0];
      const code = hit ? hit.object.userData.code : null;
      if (isClick) {
        if (code && this.selectable && this._selectCb) this._selectCb(code, this.props[code]);
      } else if (code !== this.hoverCode) {
        this.hoverCode = code;
        this.renderer.domElement.style.cursor = code && this.selectable ? 'pointer' : 'grab';
        this._recolorAll();
        if (this._hoverCb) this._hoverCb(code, code ? this.props[code] : null);
      }
    }
    _recolorAll() {
      for (const m of this.meshes) {
        const code = m.userData.code;
        let color = this.owners[code] ? new THREE.Color(this.owners[code]).getHex() : NEUTRAL_LAND;
        if (code === this.selectedCode) color = SELECTED;
        m.material.color.setHex(color);
        m.material.emissive.setHex(code === this.hoverCode ? HOVER_EMISSIVE : 0x000000);
      }
    }
    onSelect(cb) {
      this._selectCb = cb;
      return this;
    }
    onHover(cb) {
      this._hoverCb = cb;
      return this;
    }
    setSelectable(v) {
      this.selectable = !!v;
      return this;
    }
    setOwners(map) {
      this.owners = map || {};
      this._recolorAll();
      return this;
    }
    setSelected(code) {
      this.selectedCode = code;
      this._recolorAll();
      return this;
    }
    getProps(code) {
      return this.props[code] || null;
    }
    focus(code) {
      const mesh = this.byCode[code];
      if (!mesh) return;
      mesh.geometry.computeBoundingSphere();
      const c = mesh.geometry.boundingSphere.center.clone().normalize();
      this._targetRotY = Math.atan2(-c.x, c.z);
      this._targetRotX = Math.asin(Math.max(-1, Math.min(1, c.y)));
      this._userActive = false;
    }
    _resize() {
      const w = this.container.clientWidth,
        h = this.container.clientHeight;
      if (!w || !h) return;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    }
    _animate() {
      this._raf = requestAnimationFrame(this._animate);
      if (this._targetRotY !== undefined && !this._userActive) {
        this.world.rotation.y += (this._targetRotY - this.world.rotation.y) * 0.08;
        this.world.rotation.x += (this._targetRotX - this.world.rotation.x) * 0.08;
      } else if (this.autoRotate && !this._userActive) {
        this.world.rotation.y += 0.0007;
      }
      this.renderer.render(this.scene, this.camera);
    }
    destroy() {
      cancelAnimationFrame(this._raf);
      window.removeEventListener('resize', this._onResize);
      window.removeEventListener('pointerup', this._onUp);
      this.renderer.dispose();
      if (this.renderer.domElement.parentNode) this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
  window.Globe = Globe;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/game/globe.js", error: String((e && e.message) || e) }); }

// ui_kits/game/hud/HudBottom.jsx
try { (() => {
// Bottom HUD: comms (BL), hotbar (BC), globe controls (BR), hover tooltip.
function Comms({
  players,
  events,
  chat,
  onSend,
  solid
}) {
  const {
    Panel,
    FeedEvent,
    ChatMessage,
    Input,
    Button
  } = window.IAP_DS;
  const [tab, setTab] = React.useState('feed');
  const [scope, setScope] = React.useState('all');
  const [msg, setMsg] = React.useState('');
  const ref = React.useRef(null);
  const pl = id => players.find(p => p.id === id);
  const lines = chat.filter(m => m.scope === scope);
  React.useEffect(() => {
    if (ref.current) ref.current.scrollTop = tab === 'chat' ? ref.current.scrollHeight : 0;
  }, [tab, chat.length, scope]);
  const send = () => {
    if (!msg.trim()) return;
    onSend(msg.trim(), scope);
    setMsg('');
  };
  return /*#__PURE__*/React.createElement(Panel, {
    padding: 12,
    style: {
      position: 'absolute',
      left: 14,
      bottom: 14,
      width: 380,
      ...hudSurface(solid)
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement(TabPlates, {
    value: tab,
    onChange: setTab,
    tabs: [{
      value: 'feed',
      label: 'Dispatches',
      icon: 'broadcast'
    }, {
      value: 'chat',
      label: 'Chat',
      icon: 'chats',
      count: tab === 'chat' ? 0 : 2
    }]
  }), tab === 'chat' ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 2,
      padding: 2,
      borderRadius: 999,
      background: 'var(--navy-950)'
    }
  }, ['all', 'team'].map(s => /*#__PURE__*/React.createElement("button", {
    key: s,
    type: "button",
    onClick: () => setScope(s),
    style: {
      border: 0,
      cursor: 'pointer',
      padding: '4px 10px',
      borderRadius: 999,
      font: '600 11px/1 var(--font-body)',
      textTransform: 'uppercase',
      letterSpacing: '.06em',
      background: scope === s ? 'var(--navy-600)' : 'transparent',
      color: scope === s ? '#fff' : 'var(--text-muted)'
    }
  }, s === 'all' ? 'All' : 'Allies'))) : null), /*#__PURE__*/React.createElement("div", {
    ref: ref,
    style: {
      height: 150,
      overflow: 'auto',
      marginRight: -6,
      paddingRight: 6
    }
  }, tab === 'feed' ? events.map(e => /*#__PURE__*/React.createElement(FeedEvent, {
    key: e.id,
    type: e.type,
    actor: e.actor,
    day: e.day
  }, e.text)) : lines.map(m => {
    const p = pl(m.pid);
    return /*#__PURE__*/React.createElement(ChatMessage, {
      key: m.id,
      name: p ? p.name : 'System',
      color: p ? p.color : undefined
    }, m.body);
  })), tab === 'chat' ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(Input, {
    size: "sm",
    value: msg,
    onChange: e => setMsg(e.target.value),
    onKeyDown: e => {
      e.stopPropagation();
      if (e.key === 'Enter') send();
    },
    placeholder: scope === 'all' ? 'Message the world…' : 'Message your allies…',
    maxLength: 400
  }), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    icon: "paper-plane-right",
    onClick: send
  }, "Send")) : null);
}
function HotbarSlot({
  m,
  active,
  count,
  onClick
}) {
  const [hover, setHover] = React.useState(false);
  const lift = active ? -8 : hover ? -3 : 0;
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      position: 'relative',
      width: 86,
      height: 82,
      padding: 0,
      border: '2px solid ' + (active ? 'var(--gold-300)' : 'rgba(124,196,255,.22)'),
      borderRadius: 14,
      cursor: 'pointer',
      background: active ? 'linear-gradient(180deg,#2c4372 0%,#19233b 100%)' : 'rgba(18,26,46,.88)',
      backdropFilter: 'blur(8px)',
      boxShadow: (active ? '0 0 0 3px rgba(245,185,66,.25), 0 0 26px rgba(245,185,66,.4), ' : '') + 'inset 0 1px 0 rgba(255,255,255,.1), 0 4px 0 var(--navy-950), 0 10px 20px rgba(0,0,0,.4)',
      transform: 'translateY(' + lift + 'px)',
      transition: 'transform 150ms var(--ease-pop), box-shadow 150ms ease, border-color 150ms ease',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: 'ph-fill ph-' + m.icon,
    style: {
      fontSize: 30,
      color: active ? 'var(--gold-300)' : '#fff',
      filter: 'drop-shadow(0 2px 0 rgba(0,0,0,.4))'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'italic 800 15px/1 var(--font-display)',
      textTransform: 'uppercase',
      letterSpacing: '.04em',
      color: active ? '#fff' : 'var(--navy-200)'
    }
  }, m.label), /*#__PURE__*/React.createElement(KeyCap, {
    k: m.key,
    style: {
      position: 'absolute',
      top: -9,
      right: -9
    }
  }), count ? /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: -8,
      left: -8,
      minWidth: 22,
      height: 22,
      padding: '0 6px',
      borderRadius: 11,
      background: 'var(--grad-danger)',
      boxShadow: '0 2px 0 #7a0c27',
      font: '700 12px/22px var(--font-body)',
      color: '#fff'
    }
  }, count) : null);
}
function Hotbar({
  mode,
  setMode,
  counts
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 22,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: 14
    }
  }, Object.keys(MODE_META).map(k => /*#__PURE__*/React.createElement(HotbarSlot, {
    key: k,
    m: MODE_META[k],
    active: mode === k,
    count: counts[k],
    onClick: () => setMode(k)
  })));
}
const LENSES = [{
  value: 'political',
  icon: 'flag-banner',
  label: 'Political'
}, {
  value: 'farmland',
  icon: 'grains',
  label: 'Farmland',
  color: 'var(--res-food)'
}, {
  value: 'minerals',
  icon: 'diamond',
  label: 'Minerals',
  color: 'var(--res-minerals)'
}, {
  value: 'oil',
  icon: 'drop',
  label: 'Oil',
  color: 'var(--res-oil)'
}];
function RoundBtn({
  icon,
  onClick,
  title,
  active,
  color
}) {
  const [p, setP] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    title: title,
    onClick: onClick,
    onPointerDown: () => setP(true),
    onPointerUp: () => setP(false),
    onMouseLeave: () => setP(false),
    style: {
      width: 38,
      height: 38,
      borderRadius: 10,
      border: '1px solid ' + (active ? 'var(--teal-400)' : 'var(--navy-500)'),
      cursor: 'pointer',
      display: 'grid',
      placeItems: 'center',
      background: active ? 'linear-gradient(180deg,#22485a,#173040)' : 'var(--grad-navy)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.1), 0 ' + (p ? 1 : 3) + 'px 0 var(--navy-950)' + (active ? ', var(--glow-teal)' : ''),
      transform: p ? 'translateY(2px)' : 'none',
      transition: 'transform 80ms ease'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: 'ph-fill ph-' + icon,
    style: {
      fontSize: 18,
      color: active ? color || 'var(--teal-300)' : '#fff'
    }
  }));
}
function GlobeControls({
  lens,
  setLens,
  onZoom,
  onHome
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: 14,
      bottom: 14,
      width: 340,
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      padding: 6,
      borderRadius: 14,
      background: 'var(--surface-overlay)',
      backdropFilter: 'blur(8px)',
      border: '1px solid var(--border-glow)',
      boxShadow: 'var(--shadow-panel)'
    }
  }, LENSES.map(l => /*#__PURE__*/React.createElement(RoundBtn, {
    key: l.value,
    icon: l.icon,
    title: l.label + ' lens',
    active: lens === l.value,
    color: l.color,
    onClick: () => setLens(l.value)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(RoundBtn, {
    icon: "minus",
    title: "Zoom out",
    onClick: () => onZoom(0.35)
  }), /*#__PURE__*/React.createElement(RoundBtn, {
    icon: "plus",
    title: "Zoom in",
    onClick: () => onZoom(-0.35)
  }), /*#__PURE__*/React.createElement(RoundBtn, {
    icon: "crosshair",
    title: "Focus capital",
    onClick: onHome
  }));
}
function HoverTip({
  hover,
  pos,
  owner,
  lens
}) {
  if (!hover) return null;
  const p = hover.props;
  const attr = lens !== 'political' ? lens : null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: pos.x + 18,
      top: pos.y + 18,
      pointerEvents: 'none',
      zIndex: 30,
      padding: '9px 12px',
      borderRadius: 10,
      background: 'rgba(10,14,26,.94)',
      border: '1px solid var(--border-glow)',
      boxShadow: '0 8px 24px rgba(0,0,0,.5)',
      minWidth: 160
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'italic 900 19px/1 var(--font-display)',
      textTransform: 'uppercase',
      color: '#fff'
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      marginTop: 5,
      font: '600 12px/1 var(--font-body)',
      color: owner ? owner.me ? 'var(--teal-300)' : '#fff' : 'var(--text-muted)'
    }
  }, owner ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: 3,
      background: owner.color
    }
  }) : null, owner ? owner.me ? 'Yours' : owner.name : 'Neutral'), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 7,
      font: 'italic 800 14px/1 var(--font-display)',
      color: '#fff'
    }
  }, [['farmland', 'food'], ['minerals', 'minerals'], ['oil', 'oil']].map(([a, r]) => /*#__PURE__*/React.createElement("span", {
    key: a,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
      opacity: attr && attr !== a ? 0.45 : 1
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: 'ph-fill ph-' + HUD_RES[r].icon,
    style: {
      color: HUD_RES[r].color,
      fontSize: 12
    }
  }), p[a]))));
}
Object.assign(window, {
  Comms,
  Hotbar,
  GlobeControls,
  HoverTip,
  LENSES
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/game/hud/HudBottom.jsx", error: String((e && e.message) || e) }); }

// ui_kits/game/hud/HudPanes.jsx
try { (() => {
// Mode panes for the context panel: Build / Army / Trade / Diplomacy.
const BUILD_ORDER = ['farm', 'mine', 'oil_rig', 'power_plant', 'factory', 'lab', 'bank', 'housing'];
function buildYield(type, props) {
  const B = window.IAP_DATA.BUILDINGS[type];
  if (type === 'housing') return [['research', null, '+40M pop cap']];
  const out = [];
  Object.keys(B.produces || {}).forEach(k => out.push([k, Math.round(B.produces[k] * (B.scale ? props[B.scale] / 50 : 1))]));
  Object.keys(B.consumes || {}).forEach(k => out.push([k, -B.consumes[k]]));
  return out;
}
function SectionHead({
  children,
  right
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      margin: '4px 0 8px'
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, children), right);
}
function BuildPane({
  props,
  sc,
  day,
  queue,
  onBuild
}) {
  const D = window.IAP_DATA;
  const building = queue.filter(b => b.status === 'building');
  const active = queue.filter(b => b.status === 'active');
  const counts = {};
  active.forEach(b => {
    counts[b.type] = (counts[b.type] || 0) + 1;
  });
  return /*#__PURE__*/React.createElement("div", null, building.length ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(SectionHead, null, "Under construction"), building.map((b, i) => {
    const B = D.BUILDINGS[b.type];
    const pct = Math.min(1, (day - b.started) / (b.complete_at - b.started));
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 0'
      }
    }, /*#__PURE__*/React.createElement(Tile, {
      icon: B.icon,
      tone: B.tone,
      size: 30
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        font: '600 13px/1 var(--font-body)',
        color: '#fff',
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement("span", null, B.name), /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-muted)',
        fontWeight: 500
      }
    }, /*#__PURE__*/React.createElement("i", {
      className: "ph-fill ph-hourglass"
    }), " Day ", b.complete_at)), /*#__PURE__*/React.createElement(Meter, {
      value: pct,
      max: 1,
      color: "var(--gold-400)",
      height: 6
    })));
  })) : null, /*#__PURE__*/React.createElement(SectionHead, null, "Active here"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 14
    }
  }, Object.keys(counts).map(t => /*#__PURE__*/React.createElement("span", {
    key: t,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 9px 4px 4px',
      borderRadius: 999,
      background: 'var(--navy-850)',
      boxShadow: 'var(--shadow-inset-well)',
      font: '600 12px/1 var(--font-body)',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement(Tile, {
    icon: D.BUILDINGS[t].icon,
    tone: D.BUILDINGS[t].tone,
    size: 20,
    iconSize: 12
  }), D.BUILDINGS[t].name, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)'
    }
  }, "\xD7", counts[t])))), /*#__PURE__*/React.createElement(SectionHead, {
    right: /*#__PURE__*/React.createElement("span", {
      style: {
        font: '400 11px/1 var(--font-body)',
        color: 'var(--text-muted)'
      }
    }, "output for this land")
  }, "Construct"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8
    }
  }, BUILD_ORDER.map(t => /*#__PURE__*/React.createElement(BuildTile, {
    key: t,
    type: t,
    props: props,
    sc: sc,
    onBuild: onBuild
  }))));
}
function BuildTile({
  type,
  props,
  sc,
  onBuild
}) {
  const B = window.IAP_DATA.BUILDINGS[type];
  const [hover, setHover] = React.useState(false);
  const afford = Object.keys(B.cost).every(k => (sc.res[k] || 0) >= B.cost[k]);
  const y = buildYield(type, props);
  return /*#__PURE__*/React.createElement("div", {
    onClick: () => onBuild(type, afford),
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    title: B.desc,
    style: {
      padding: 9,
      borderRadius: 10,
      cursor: afford ? 'pointer' : 'not-allowed',
      opacity: afford ? 1 : 0.5,
      background: 'var(--grad-navy)',
      border: '1px solid ' + (hover && afford ? 'var(--teal-400)' : 'var(--navy-600)'),
      boxShadow: '0 3px 0 var(--navy-950), inset 0 1px 0 rgba(255,255,255,.06)' + (hover && afford ? ', var(--glow-teal)' : ''),
      transform: hover && afford ? 'translateY(-1px)' : 'none',
      transition: 'transform 80ms ease, box-shadow 150ms ease, border-color 150ms ease'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Tile, {
    icon: B.icon,
    tone: B.tone,
    size: 32
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '600 13px/1.1 var(--font-body)',
      color: '#fff',
      whiteSpace: 'nowrap'
    }
  }, B.name), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      marginTop: 3,
      font: '700 12px/1 var(--font-num)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, y.map(([k, v, txt]) => /*#__PURE__*/React.createElement("span", {
    key: k + v,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 2,
      color: txt ? 'var(--sky-300)' : v >= 0 ? HUD_RES[k].color : 'var(--red-300)'
    }
  }, txt || /*#__PURE__*/React.createElement(React.Fragment, null, (v >= 0 ? '+' : '−') + Math.abs(v), /*#__PURE__*/React.createElement("i", {
    className: 'ph-fill ph-' + HUD_RES[k].icon,
    style: {
      fontSize: 11
    }
  }))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(Cost, {
    cost: B.cost,
    have: sc.res,
    size: 11
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 11px/1 var(--font-body)',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph-fill ph-hourglass"
  }), " ", B.build_ticks, "d")));
}
function ArmyPane({
  code,
  props,
  owner,
  sc,
  onTrain,
  onMove
}) {
  const H = window.HUD_DATA;
  const {
    Button
  } = window.IAP_DS;
  const mine = owner && owner.me;
  const forces = mine && code === 'SWE' ? H.armiesHere : [];
  const strength = H.armiesHere.reduce((a, f) => a + f.count * H.UNITS[f.type].attack, 0);
  if (!mine) {
    const def = owner ? 4 + 18 : 8;
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionHead, null, "Attack ", props.name), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 12,
        borderRadius: 12,
        background: 'rgba(230,25,75,.08)',
        boxShadow: 'inset 0 0 0 1px var(--red-800)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement(Eyebrow, null, "Your strike force"), /*#__PURE__*/React.createElement("div", {
      style: {
        font: 'italic 900 40px/1 var(--font-display)',
        color: 'var(--teal-300)',
        marginTop: 4
      }
    }, strength)), /*#__PURE__*/React.createElement("span", {
      style: {
        font: 'italic 900 22px/1 var(--font-display)',
        color: 'var(--text-muted)'
      }
    }, "VS"), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement(Eyebrow, null, "Defence"), /*#__PURE__*/React.createElement("div", {
      style: {
        font: 'italic 900 40px/1 var(--font-display)',
        color: 'var(--red-300)',
        marginTop: 4
      }
    }, def))), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center',
        margin: '8px 0 12px',
        font: '500 12px/1.3 var(--font-body)',
        color: strength > def ? 'var(--green-300)' : 'var(--red-300)'
      }
    }, strength > def ? 'Attacker wins if strength is higher. Expect ~' + Math.round(Math.min(0.9, def / strength) * 100) + '% losses.' : 'Too strong. Train more units first.'), /*#__PURE__*/React.createElement(Button, {
      variant: "danger",
      icon: "sword",
      block: true,
      onClick: () => onMove(code, true)
    }, "Attack from Sweden \xB7 2 days")));
  }
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionHead, {
    right: /*#__PURE__*/React.createElement("span", {
      style: {
        font: 'italic 800 14px/1 var(--font-display)',
        color: 'var(--teal-300)',
        textTransform: 'uppercase'
      }
    }, "Strength ", forces.length ? strength : 0)
  }, "Forces here"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 6,
      marginBottom: 14
    }
  }, Object.keys(H.UNITS).map(u => {
    const f = forces.find(x => x.type === u);
    return /*#__PURE__*/React.createElement("div", {
      key: u,
      style: {
        textAlign: 'center',
        padding: '8px 4px',
        borderRadius: 10,
        background: 'var(--navy-850)',
        boxShadow: 'var(--shadow-inset-well)',
        opacity: f ? 1 : 0.5
      }
    }, /*#__PURE__*/React.createElement("i", {
      className: 'ph-fill ph-' + H.UNITS[u].icon,
      style: {
        fontSize: 20,
        color: f ? '#fff' : 'var(--navy-400)'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        font: 'italic 900 20px/1 var(--font-display)',
        color: '#fff',
        marginTop: 4
      }
    }, f ? f.count : 0), /*#__PURE__*/React.createElement("div", {
      style: {
        font: '500 10px/1 var(--font-body)',
        color: 'var(--text-muted)',
        marginTop: 2
      }
    }, H.UNITS[u].name));
  })), /*#__PURE__*/React.createElement(SectionHead, null, "Train"), Object.keys(H.UNITS).map(u => {
    const U = H.UNITS[u];
    const afford = Object.keys(U.cost).every(k => (sc.res[k] || 0) >= U.cost[k] * 5);
    return /*#__PURE__*/React.createElement("div", {
      key: u,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '6px 0',
        borderBottom: '1px solid rgba(255,255,255,.04)'
      }
    }, /*#__PURE__*/React.createElement(Tile, {
      icon: U.icon,
      tone: "var(--navy-500)",
      size: 30
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        font: '600 13px/1 var(--font-body)',
        color: '#fff'
      }
    }, U.name, /*#__PURE__*/React.createElement("span", {
      style: {
        font: 'italic 800 12px/1 var(--font-display)',
        color: 'var(--red-300)'
      }
    }, "ATK ", U.attack)), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 4
      }
    }, /*#__PURE__*/React.createElement(Cost, {
      cost: U.cost,
      have: sc.res,
      size: 11
    }))), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: afford ? 'primary' : 'default',
      disabled: !afford,
      onClick: () => onTrain(u)
    }, "\xD75"));
  }), /*#__PURE__*/React.createElement(SectionHead, null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      marginTop: 10
    }
  }, "Move forces")), H.moveTargets.map(t => {
    const name = (window.__HUD_PROPS[t.code] || {}).name || t.code;
    const hostile = t.owner == null;
    return /*#__PURE__*/React.createElement("div", {
      key: t.code,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 0'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        font: '600 13px/1.1 var(--font-body)',
        color: '#fff'
      }
    }, name), /*#__PURE__*/React.createElement("div", {
      style: {
        font: '400 11px/1.3 var(--font-body)',
        color: hostile ? 'var(--red-300)' : 'var(--teal-300)'
      }
    }, hostile ? 'Neutral · ' + strength + ' vs ' + t.garrison : 'Yours · reinforce', " \xB7 ", t.eta, "d")), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: hostile ? 'danger' : 'ghost',
      onClick: () => onMove(t.code, hostile)
    }, hostile ? 'Attack' : 'Move'));
  }));
}
function ResLine({
  res
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      gap: 8
    }
  }, Object.keys(res).map(k => /*#__PURE__*/React.createElement("span", {
    key: k,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      font: 'italic 800 18px/1 var(--font-display)',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: 'ph-fill ph-' + HUD_RES[k].icon,
    style: {
      color: HUD_RES[k].color,
      fontSize: 16
    }
  }), res[k])));
}
function TradePane({
  players,
  sc,
  onTrade
}) {
  const H = window.HUD_DATA;
  const {
    Button,
    Pill
  } = window.IAP_DS;
  const [done, setDone] = React.useState({});
  const pl = id => players.find(p => p.id === id);
  const incoming = H.trades.filter(t => t.dir === 'in' && !done[t.id]);
  const outgoing = H.trades.filter(t => t.dir === 'out' && !done[t.id]);
  const act = (t, ok) => {
    setDone({
      ...done,
      [t.id]: true
    });
    onTrade(t, ok);
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionHead, {
    right: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "gold",
      icon: "plus"
    }, "New offer")
  }, "Incoming offers"), !incoming.length ? /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 13px/1.4 var(--font-body)',
      color: 'var(--text-muted)',
      padding: '6px 0 12px'
    }
  }, "No offers on the table.") : null, incoming.map(t => {
    const p = pl(t.from);
    return /*#__PURE__*/React.createElement("div", {
      key: t.id,
      style: {
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        background: 'var(--grad-navy)',
        border: '1px solid var(--navy-600)',
        boxShadow: '0 3px 0 var(--navy-950)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        font: '600 13px/1 var(--font-body)',
        color: '#fff'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 9,
        height: 9,
        borderRadius: 3,
        background: p.color
      }
    }), p.name), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: 8,
        margin: '10px 0'
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, {
      style: {
        marginBottom: 5
      }
    }, "You get"), /*#__PURE__*/React.createElement(ResLine, {
      res: t.give
    })), /*#__PURE__*/React.createElement("i", {
      className: "ph-bold ph-arrows-left-right",
      style: {
        color: 'var(--text-muted)',
        fontSize: 18
      }
    }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, {
      style: {
        marginBottom: 5
      }
    }, "You give"), /*#__PURE__*/React.createElement(ResLine, {
      res: t.receive
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "primary",
      icon: "check",
      style: {
        flex: 1
      },
      onClick: () => act(t, true)
    }, "Accept"), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "ghost",
      style: {
        flex: 1
      },
      onClick: () => act(t, false)
    }, "Decline")));
  }), /*#__PURE__*/React.createElement(SectionHead, null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      marginTop: 6
    }
  }, "Your offers")), outgoing.map(t => {
    const p = pl(t.to);
    return /*#__PURE__*/React.createElement("div", {
      key: t.id,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: 10,
        borderRadius: 10,
        background: 'var(--navy-850)',
        boxShadow: 'var(--shadow-inset-well)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        font: '600 12px/1 var(--font-body)',
        color: '#fff',
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 9,
        height: 9,
        borderRadius: 3,
        background: p.color
      }
    }), "To ", p.name), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }
    }, /*#__PURE__*/React.createElement(ResLine, {
      res: t.give
    }), /*#__PURE__*/React.createElement("i", {
      className: "ph-bold ph-arrow-right",
      style: {
        color: 'var(--text-muted)'
      }
    }), /*#__PURE__*/React.createElement(ResLine, {
      res: t.receive
    }))), /*#__PURE__*/React.createElement(Pill, {
      icon: "hourglass"
    }, "Pending"));
  }));
}
function DiplomacyPane({
  players,
  onDiplo
}) {
  const {
    Button,
    Badge
  } = window.IAP_DS;
  const ACTIONS = {
    neutral: [['allied', 'Propose alliance', 'primary'], ['war', 'Declare war', 'danger']],
    allied: [['neutral', 'Break alliance', 'ghost']],
    war: [['truce', 'Offer truce', 'default']],
    truce: [['allied', 'Propose alliance', 'primary'], ['war', 'Declare war', 'danger']]
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, players.filter(p => !p.me).map(p => {
    const d = DIPLO[p.diplo || 'neutral'];
    return /*#__PURE__*/React.createElement("div", {
      key: p.id,
      style: {
        padding: 12,
        borderRadius: 12,
        background: 'var(--grad-navy)',
        border: '1px solid var(--navy-600)',
        boxShadow: '0 3px 0 var(--navy-950)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 6,
        height: 32,
        borderRadius: 3,
        background: p.color,
        transform: 'skewX(var(--skew))'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        font: '600 14px/1.2 var(--font-body)',
        color: '#fff',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, p.name), /*#__PURE__*/React.createElement("div", {
      style: {
        font: '400 11px/1.3 var(--font-body)',
        color: 'var(--text-muted)'
      }
    }, p.title, " \xB7 ", p.lands.length, " lands", p.ai ? ' · AI' : '')), /*#__PURE__*/React.createElement(Badge, {
      kind: d.kind,
      icon: d.icon
    }, d.label)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 6,
        marginTop: 10
      }
    }, ACTIONS[p.diplo || 'neutral'].map(([to, label, v]) => /*#__PURE__*/React.createElement(Button, {
      key: to,
      size: "sm",
      variant: v,
      style: {
        flex: 1
      },
      onClick: () => onDiplo(p, to)
    }, label))));
  }));
}
Object.assign(window, {
  BuildPane,
  ArmyPane,
  TradePane,
  DiplomacyPane
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/game/hud/HudPanes.jsx", error: String((e && e.message) || e) }); }

// ui_kits/game/hud/HudParts.jsx
try { (() => {
// Small HUD building blocks for the Match HUD mockup (kit-local; candidates for promotion into components/).
const HUD_RES = {
  food: {
    icon: 'grains',
    color: 'var(--res-food)',
    hex: '#7bc86c',
    label: 'Food'
  },
  energy: {
    icon: 'lightning',
    color: 'var(--res-energy)',
    hex: '#f5d14e',
    label: 'Energy'
  },
  minerals: {
    icon: 'diamond',
    color: 'var(--res-minerals)',
    hex: '#c9d4ea',
    label: 'Minerals'
  },
  gold: {
    icon: 'coins',
    color: 'var(--res-gold)',
    hex: '#f5b942',
    label: 'Gold'
  },
  oil: {
    icon: 'drop',
    color: 'var(--res-oil)',
    hex: '#a885d8',
    label: 'Oil'
  },
  research: {
    icon: 'flask',
    color: 'var(--res-research)',
    hex: '#4fd1c5',
    label: 'Research'
  }
};
function hudNum(n) {
  n = Number(n) || 0;
  const a = Math.abs(n);
  if (a >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (a >= 1e6) return (n / 1e6).toFixed(a >= 1e8 ? 0 : 1) + 'M';
  if (a >= 1e5) return Math.round(n / 1e3) + 'K';
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
}
function hudSurface(solid) {
  return solid ? {
    background: 'linear-gradient(180deg,#1a2747 0%,#121a2e 100%)',
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none'
  } : {};
}
function Eyebrow({
  children,
  color = 'var(--text-muted)',
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      font: '600 11px/1 var(--font-body)',
      textTransform: 'uppercase',
      letterSpacing: '.08em',
      color,
      ...style
    }
  }, children);
}
function Meter({
  value,
  max = 1,
  color = 'var(--teal-400)',
  height = 8,
  marker
}) {
  const pct = Math.max(0, Math.min(1, max ? value / max : 0)) * 100;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height,
      borderRadius: 999,
      background: 'var(--navy-950)',
      boxShadow: 'inset 0 1px 2px rgba(0,0,0,.6)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: pct + '%',
      borderRadius: 999,
      background: 'linear-gradient(180deg, rgba(255,255,255,.4), rgba(255,255,255,0) 65%), ' + color,
      transition: 'width .5s var(--ease-out)'
    }
  }), marker != null ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: marker * 100 + '%',
      top: -4,
      bottom: -4,
      width: 3,
      marginLeft: -1,
      background: 'var(--gold-300)',
      borderRadius: 2,
      boxShadow: '0 0 8px rgba(245,185,66,.9)'
    }
  }) : null);
}
function Ring({
  pct,
  size = 44,
  stroke = 5,
  color = 'var(--gold-400)',
  children
}) {
  const r = (size - stroke) / 2,
    c = 2 * Math.PI * r;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: size,
      height: size,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    style: {
      transform: 'rotate(-90deg)',
      display: 'block'
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "rgba(6,10,20,.7)",
    stroke: "var(--navy-700)",
    strokeWidth: stroke
  }), /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeDasharray: c,
    strokeDashoffset: c * (1 - pct),
    style: {
      transition: 'stroke-dashoffset 1s linear'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'grid',
      placeItems: 'center'
    }
  }, children));
}
function Tile({
  icon,
  tone = 'var(--sky-500)',
  size = 40,
  iconSize
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      width: size,
      height: size,
      borderRadius: Math.round(size / 4),
      flexShrink: 0,
      display: 'grid',
      placeItems: 'center',
      background: 'linear-gradient(180deg, rgba(255,255,255,.28), rgba(0,0,0,.18)), ' + tone,
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.35), 0 3px 0 rgba(0,0,0,.35)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: 'ph-fill ph-' + icon,
    style: {
      fontSize: iconSize || Math.round(size * 0.55),
      color: '#fff',
      filter: 'drop-shadow(0 2px 0 rgba(0,0,0,.3))'
    }
  }));
}
function Cost({
  cost,
  have,
  size = 12
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      gap: 8,
      flexWrap: 'wrap',
      font: '600 ' + size + 'px/1 var(--font-body)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, Object.keys(cost).map(k => {
    const short = have && (have[k] || 0) < cost[k];
    return /*#__PURE__*/React.createElement("span", {
      key: k,
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        color: short ? 'var(--red-300)' : 'var(--text-body)'
      }
    }, /*#__PURE__*/React.createElement("i", {
      className: 'ph-fill ph-' + HUD_RES[k].icon,
      style: {
        color: HUD_RES[k].color,
        fontSize: size + 1
      }
    }), cost[k]);
  }));
}
function KeyCap({
  k,
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-grid',
      placeItems: 'center',
      minWidth: 20,
      height: 20,
      padding: '0 5px',
      borderRadius: 5,
      background: 'var(--navy-950)',
      border: '1px solid var(--navy-500)',
      boxShadow: '0 2px 0 #000',
      font: '700 11px/1 var(--font-body)',
      color: 'var(--navy-200)',
      ...style
    }
  }, k);
}
function Silhouette({
  d,
  color = '#fff',
  size = 48
}) {
  if (!d) return /*#__PURE__*/React.createElement("i", {
    className: "ph-fill ph-flag-banner",
    style: {
      fontSize: size * 0.6,
      color
    }
  });
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 100 100",
    width: size,
    height: size,
    style: {
      display: 'block',
      filter: 'drop-shadow(0 2px 0 rgba(0,0,0,.45))'
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: d,
    fill: color,
    stroke: "rgba(255,255,255,.7)",
    strokeWidth: "1.5",
    strokeLinejoin: "round"
  }));
}
function TabPlates({
  tabs,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, tabs.map(t => {
    const on = t.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: t.value,
      type: "button",
      onClick: () => onChange(t.value),
      style: {
        border: 0,
        padding: '6px 12px',
        borderRadius: 6,
        cursor: 'pointer',
        transform: 'skewX(var(--skew))',
        background: on ? 'var(--grad-gold)' : 'rgba(255,255,255,.06)',
        boxShadow: on ? 'inset 0 1px 0 rgba(255,255,255,.45), 0 3px 0 var(--gold-700)' : 'inset 0 0 0 1px var(--navy-600)',
        color: on ? 'var(--gold-900)' : 'var(--text-muted)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        transform: 'skewX(calc(var(--skew) * -1))',
        font: 'italic 800 15px/1 var(--font-display)',
        textTransform: 'uppercase',
        letterSpacing: '.04em'
      }
    }, t.icon ? /*#__PURE__*/React.createElement("i", {
      className: 'ph-fill ph-' + t.icon,
      style: {
        fontSize: 13
      }
    }) : null, t.label, t.count ? /*#__PURE__*/React.createElement("span", {
      style: {
        minWidth: 16,
        height: 16,
        padding: '0 4px',
        borderRadius: 8,
        background: on ? 'var(--gold-900)' : 'var(--red-500)',
        color: on ? 'var(--gold-300)' : '#fff',
        font: '700 10px/16px var(--font-body)',
        fontStyle: 'normal'
      }
    }, t.count) : null));
  }));
}
const DIPLO = {
  allied: {
    label: 'Allied',
    icon: 'handshake',
    kind: 'ready',
    color: 'var(--green-300)'
  },
  war: {
    label: 'At war',
    icon: 'sword',
    kind: 'danger',
    color: 'var(--red-300)'
  },
  truce: {
    label: 'Truce',
    icon: 'flag',
    kind: 'host',
    color: 'var(--sky-300)'
  },
  neutral: {
    label: 'Neutral',
    icon: 'minus-circle',
    kind: 'default',
    color: 'var(--text-muted)'
  }
};
Object.assign(window, {
  HUD_RES,
  hudNum,
  hudSurface,
  Eyebrow,
  Meter,
  Ring,
  Tile,
  Cost,
  KeyCap,
  Silhouette,
  TabPlates,
  DIPLO
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/game/hud/HudParts.jsx", error: String((e && e.message) || e) }); }

// ui_kits/game/hud/HudSide.jsx
try { (() => {
// Left standings + right context panel (selected country × active mode).
function Standings({
  players,
  total,
  selected,
  onPick,
  solid
}) {
  const {
    Panel
  } = window.IAP_DS;
  const ranked = players.slice().sort((a, b) => b.lands.length - a.lands.length);
  return /*#__PURE__*/React.createElement(Panel, {
    title: "Standings",
    actions: /*#__PURE__*/React.createElement(Eyebrow, null, players.length, " nations"),
    padding: 12,
    style: {
      position: 'absolute',
      top: 170,
      left: 14,
      width: 300,
      ...hudSurface(solid)
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    }
  }, ranked.map((p, i) => {
    const d = p.me ? null : DIPLO[p.diplo || 'neutral'];
    const sel = p.lands.includes(selected);
    return /*#__PURE__*/React.createElement("div", {
      key: p.id,
      onClick: () => onPick(p.country),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '7px 8px',
        borderRadius: 9,
        cursor: 'pointer',
        background: p.me ? 'var(--me-tint)' : sel ? 'rgba(255,255,255,.05)' : 'transparent',
        boxShadow: p.me ? 'inset 0 0 0 1px rgba(79,209,197,.3)' : 'none'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 18,
        textAlign: 'center',
        font: 'italic 900 22px/1 var(--font-display)',
        color: i === 0 ? 'var(--gold-400)' : 'var(--navy-400)',
        textShadow: i === 0 ? '0 2px 0 var(--gold-800)' : 'none'
      }
    }, i + 1), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 6,
        height: 30,
        borderRadius: 3,
        background: p.color,
        transform: 'skewX(var(--skew))',
        boxShadow: 'inset 0 2px 0 rgba(255,255,255,.4), 0 2px 0 rgba(0,0,0,.4)',
        flexShrink: 0
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        font: '600 14px/1.2 var(--font-body)',
        color: '#fff',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, p.name), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        marginTop: 2,
        font: '400 11px/1 var(--font-body)',
        color: 'var(--text-muted)'
      }
    }, p.me ? /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--teal-300)',
        fontWeight: 600
      }
    }, "You") : /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        color: d.color,
        fontWeight: 600
      }
    }, /*#__PURE__*/React.createElement("i", {
      className: 'ph-fill ph-' + d.icon
    }), d.label), /*#__PURE__*/React.createElement("span", null, "\xB7"), hudNum(p.pop), " pop", p.ai ? /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--gold-400)',
        fontWeight: 600
      }
    }, "\xB7 AI") : null)), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'right'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        font: 'italic 800 20px/1 var(--font-display)',
        color: '#fff'
      }
    }, p.lands.length), /*#__PURE__*/React.createElement("div", {
      style: {
        font: '400 10px/1 var(--font-body)',
        color: 'var(--text-muted)',
        marginTop: 2
      }
    }, (p.lands.length / total * 100).toFixed(1), "%")));
  })));
}
const MODE_META = {
  build: {
    label: 'Build',
    icon: 'hammer',
    key: 'B'
  },
  army: {
    label: 'Army',
    icon: 'sword',
    key: 'A'
  },
  trade: {
    label: 'Trade',
    icon: 'handshake',
    key: 'T'
  },
  diplomacy: {
    label: 'Diplomacy',
    icon: 'flag-banner',
    key: 'D'
  }
};
function CountryHeader({
  code,
  props,
  shape,
  owner,
  me,
  used
}) {
  const {
    Badge
  } = window.IAP_DS;
  const mine = owner && owner.me;
  const capital = owner && owner.country === code;
  const attrs = [['farmland', 'food'], ['minerals', 'minerals'], ['oil', 'oil']];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 12,
      borderRadius: 12,
      background: 'rgba(6,10,20,.45)',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.05)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Silhouette, {
    d: shape,
    color: owner ? owner.color : 'var(--globe-land)',
    size: 46
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'italic 900 26px/1 var(--font-display)',
      textTransform: 'uppercase',
      color: '#fff',
      textShadow: 'var(--text-shadow-display)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, props.name), capital ? /*#__PURE__*/React.createElement("i", {
    className: "ph-fill ph-star",
    title: "Capital",
    style: {
      color: 'var(--gold-400)',
      fontSize: 16
    }
  }) : null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      marginTop: 5
    }
  }, owner ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      font: '600 12px/1 var(--font-body)',
      color: mine ? 'var(--teal-300)' : '#fff'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: 3,
      background: owner.color
    }
  }), mine ? 'Yours' : owner.name) : /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 12px/1 var(--font-body)',
      color: 'var(--text-muted)'
    }
  }, "Neutral \xB7 garrison 8"), owner && !mine ? /*#__PURE__*/React.createElement(Badge, {
    kind: DIPLO[owner.diplo || 'neutral'].kind,
    icon: DIPLO[owner.diplo || 'neutral'].icon
  }, DIPLO[owner.diplo || 'neutral'].label) : null))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 10,
      marginTop: 12
    }
  }, attrs.map(([a, r]) => /*#__PURE__*/React.createElement("div", {
    key: a
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: 'ph-fill ph-' + HUD_RES[r].icon,
    style: {
      color: HUD_RES[r].color,
      fontSize: 13
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'italic 800 15px/1 var(--font-display)',
      color: '#fff'
    }
  }, props[a])), /*#__PURE__*/React.createElement(Meter, {
    value: props[a],
    max: 100,
    color: HUD_RES[r].color,
    height: 5
  }))), /*#__PURE__*/React.createElement("div", {
    title: "Land slots"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph-fill ph-squares-four",
    style: {
      color: 'var(--sky-300)',
      fontSize: 13
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'italic 800 15px/1 var(--font-display)',
      color: '#fff'
    }
  }, mine ? used + '/' : '', props.land_slots)), /*#__PURE__*/React.createElement(Meter, {
    value: mine ? used : 0,
    max: props.land_slots,
    color: "var(--sky-400)",
    height: 5
  }))));
}
function EmptyNote({
  icon,
  title,
  body,
  action
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '22px 12px',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: 'ph-fill ph-' + icon,
    style: {
      fontSize: 34,
      color: 'var(--navy-400)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      font: 'italic 800 20px/1 var(--font-display)',
      textTransform: 'uppercase',
      color: '#fff'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '6px auto 14px',
      maxWidth: 240,
      font: '400 13px/1.4 var(--font-body)'
    }
  }, body), action);
}
function ContextPanel({
  mode,
  code,
  props,
  shape,
  owner,
  me,
  players,
  sc,
  day,
  queue,
  onBuild,
  onTrain,
  onMove,
  onTrade,
  onDiplo,
  setMode,
  solid
}) {
  const {
    Panel
  } = window.IAP_DS;
  const mm = MODE_META[mode];
  const mine = owner && owner.me;
  let body = null;
  if (mode === 'build') body = mine ? /*#__PURE__*/React.createElement(BuildPane, {
    props: props,
    sc: sc,
    day: day,
    queue: queue,
    onBuild: onBuild
  }) : /*#__PURE__*/React.createElement(EmptyNote, {
    icon: "lock-simple",
    title: "Not your land",
    body: 'Conquer ' + props.name + ' to build farms, mines and power here.',
    action: /*#__PURE__*/React.createElement(window.IAP_DS.Button, {
      size: "sm",
      variant: "danger",
      icon: "sword",
      onClick: () => setMode('army')
    }, "Plan attack")
  });
  if (mode === 'army') body = /*#__PURE__*/React.createElement(ArmyPane, {
    code: code,
    props: props,
    owner: owner,
    sc: sc,
    onTrain: onTrain,
    onMove: onMove
  });
  if (mode === 'trade') body = /*#__PURE__*/React.createElement(TradePane, {
    players: players,
    sc: sc,
    onTrade: onTrade
  });
  if (mode === 'diplomacy') body = /*#__PURE__*/React.createElement(DiplomacyPane, {
    players: players,
    onDiplo: onDiplo
  });
  const showCountry = mode === 'build' || mode === 'army';
  return /*#__PURE__*/React.createElement(Panel, {
    title: mm.label,
    actions: /*#__PURE__*/React.createElement(KeyCap, {
      k: mm.key
    }),
    padding: 12,
    style: {
      position: 'absolute',
      top: 186,
      right: 14,
      bottom: 80,
      width: 340,
      display: 'flex',
      flexDirection: 'column',
      ...hudSurface(solid)
    },
    bodyStyle: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      flex: 1
    }
  }, showCountry ? /*#__PURE__*/React.createElement(CountryHeader, {
    code: code,
    props: props,
    shape: shape,
    owner: owner,
    me: me,
    used: queue.filter(b => b.country === code).length
  }) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      overflow: 'auto',
      marginTop: showCountry ? 12 : 0,
      marginRight: -6,
      paddingRight: 6
    }
  }, body));
}
Object.assign(window, {
  Standings,
  ContextPanel,
  MODE_META,
  EmptyNote
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/game/hud/HudSide.jsx", error: String((e && e.message) || e) }); }

// ui_kits/game/hud/HudTop.jsx
try { (() => {
// Top HUD row: identity plate (TL), clock + world control (TC), treasury (TR), alert ribbon.
function IdentityPlate({
  me,
  countryName,
  shape,
  sc,
  territories,
  solid
}) {
  const {
    Panel,
    Badge
  } = window.IAP_DS;
  const pop = sc.fed ? me.pop : me.pop * 0.985;
  return /*#__PURE__*/React.createElement(Panel, {
    style: {
      position: 'absolute',
      top: 14,
      left: 14,
      width: 300,
      ...hudSurface(solid)
    },
    padding: 12
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 68,
      height: 68,
      borderRadius: 12,
      flexShrink: 0,
      display: 'grid',
      placeItems: 'center',
      background: 'radial-gradient(circle at 50% 30%, color-mix(in oklab, ' + me.color + ' 40%, #0a0e1a), #0a0e1a 80%)',
      border: '2px solid ' + me.color,
      boxShadow: '0 3px 0 rgba(0,0,0,.45), 0 0 20px color-mix(in oklab, ' + me.color + ' 45%, transparent), inset 0 1px 0 rgba(255,255,255,.2)'
    }
  }, /*#__PURE__*/React.createElement(Silhouette, {
    d: shape,
    color: me.color,
    size: 54
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    color: "var(--gold-300)"
  }, me.title), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      font: 'italic 900 30px/.92 var(--font-display)',
      textTransform: 'uppercase',
      color: '#fff',
      textShadow: 'var(--text-shadow-display)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, me.name), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      marginTop: 6,
      font: '500 12px/1 var(--font-body)',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph-fill ph-star",
    style: {
      color: 'var(--gold-400)'
    }
  }), countryName, /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("i", {
    className: "ph-fill ph-map-trifold"
  }), territories, " lands"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 5,
      font: '500 11px/1 var(--font-body)',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    className: "ph-fill ph-users-three",
    style: {
      marginRight: 4
    }
  }), /*#__PURE__*/React.createElement("b", {
    style: {
      font: 'italic 800 16px/1 var(--font-display)',
      color: '#fff'
    }
  }, hudNum(pop)), " / ", hudNum(me.popCap)), /*#__PURE__*/React.createElement("span", {
    style: {
      color: sc.fed ? 'var(--green-300)' : 'var(--red-300)',
      fontWeight: 600
    }
  }, sc.fed ? '+1.0% / day' : '−1.5% / day')), /*#__PURE__*/React.createElement(Meter, {
    value: pop,
    max: me.popCap,
    color: sc.fed ? 'var(--green-500)' : 'var(--red-500)',
    height: 7
  })), /*#__PURE__*/React.createElement(Badge, {
    kind: sc.fed ? 'ready' : 'danger',
    icon: sc.fed ? 'grains' : 'warning'
  }, sc.fed ? 'Fed' : 'Starving')));
}
function WorldClock({
  day,
  secsLeft,
  tickSec,
  players,
  total,
  victory,
  solid
}) {
  const {
    Panel
  } = window.IAP_DS;
  const ranked = players.slice().sort((a, b) => b.lands.length - a.lands.length);
  const me = players.find(p => p.me);
  const leader = ranked[0];
  const pct = p => (p.lands.length / total * 100).toFixed(1) + '%';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 14,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 500
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement(Ring, {
    pct: 1 - secsLeft / tickSec,
    size: 42
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph-fill ph-sun",
    style: {
      fontSize: 18,
      color: 'var(--gold-300)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '7px 18px',
      borderRadius: 8,
      background: 'var(--grad-gold)',
      transform: 'skewX(var(--skew))',
      boxShadow: 'inset 0 2px 0 rgba(255,255,255,.5), 0 4px 0 var(--gold-700), 0 8px 18px rgba(0,0,0,.35)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      transform: 'skewX(calc(var(--skew) * -1))',
      font: 'italic 900 30px/1 var(--font-display)',
      textTransform: 'uppercase',
      color: 'var(--gold-900)',
      letterSpacing: '.02em'
    }
  }, "Day ", day)), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 12px/1.3 var(--font-body)',
      color: 'var(--text-muted)',
      width: 70
    }
  }, "next day", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("b", {
    style: {
      font: 'italic 800 18px/1 var(--font-display)',
      color: '#fff'
    }
  }, "0:", String(secsLeft).padStart(2, '0')))), /*#__PURE__*/React.createElement(Panel, {
    padding: "10px 14px",
    style: hudSurface(solid)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    color: "#fff"
  }, "World control"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      font: 'italic 800 13px/1 var(--font-display)',
      textTransform: 'uppercase',
      color: 'var(--gold-300)',
      letterSpacing: '.04em'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph-fill ph-trophy"
  }), "Victory at ", Math.round(victory * 100), "%")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 14,
      borderRadius: 999,
      background: 'var(--navy-950)',
      boxShadow: 'inset 0 1px 2px rgba(0,0,0,.6)',
      display: 'flex',
      overflow: 'visible'
    }
  }, ranked.map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: p.id,
    title: p.name + ' · ' + pct(p),
    style: {
      width: p.lands.length / total * 100 + '%',
      background: 'linear-gradient(180deg, rgba(255,255,255,.4), rgba(255,255,255,0) 60%), ' + p.color,
      borderRight: '2px solid var(--navy-950)',
      borderRadius: i === 0 ? '999px 0 0 999px' : 0,
      boxShadow: p.me ? 'inset 0 0 0 2px #fff' : 'none'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: victory * 100 + '%',
      top: -5,
      bottom: -5,
      width: 3,
      marginLeft: -1,
      background: 'var(--gold-300)',
      borderRadius: 2,
      boxShadow: '0 0 10px rgba(245,185,66,.9)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: 8,
      font: '500 12px/1 var(--font-body)',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    style: {
      color: me.color,
      fontWeight: 700
    }
  }, "You"), " ", pct(me), " \xB7 ", me.lands.length, " lands"), /*#__PURE__*/React.createElement("span", null, "Leader ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: leader.color
    }
  }, leader.name), " ", pct(leader)))));
}
function Treasury({
  sc,
  solid
}) {
  const {
    Panel
  } = window.IAP_DS;
  const eff = Math.round(sc.efficiency * 100);
  return /*#__PURE__*/React.createElement(Panel, {
    style: {
      position: 'absolute',
      top: 14,
      right: 14,
      width: 340,
      ...hudSurface(solid)
    },
    padding: 10
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 6
    }
  }, Object.keys(HUD_RES).map(k => {
    const m = HUD_RES[k],
      d = sc.delta[k],
      empty = sc.res[k] <= 0;
    return /*#__PURE__*/React.createElement("div", {
      key: k,
      title: m.label,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '6px 8px 6px 6px',
        borderRadius: 10,
        background: empty ? 'rgba(230,25,75,.12)' : 'var(--navy-850)',
        boxShadow: empty ? 'inset 0 0 0 1px var(--red-800)' : 'var(--shadow-inset-well)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 28,
        height: 28,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
        background: 'color-mix(in oklab, ' + m.color + ' 20%, transparent)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.12)'
      }
    }, /*#__PURE__*/React.createElement("i", {
      className: 'ph-fill ph-' + m.icon,
      style: {
        fontSize: 16,
        color: m.color,
        filter: 'drop-shadow(0 1px 0 rgba(0,0,0,.5))'
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        font: '700 20px/1 var(--font-num)',
        color: empty ? 'var(--red-300)' : '#fff',
        fontVariantNumeric: 'tabular-nums',
        textShadow: '0 1px 0 rgba(0,0,0,.4)'
      }
    }, hudNum(sc.res[k])), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 2,
        font: '600 11px/1 var(--font-body)',
        color: d >= 0 ? 'var(--green-300)' : 'var(--red-300)',
        fontVariantNumeric: 'tabular-nums'
      }
    }, d >= 0 ? '+' : '−', Math.abs(d), /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-muted)',
        fontWeight: 400
      }
    }, "/day"))));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginTop: 9,
      padding: '0 2px'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph-fill ph-plug",
    style: {
      fontSize: 14,
      color: eff < 100 ? 'var(--red-300)' : 'var(--res-energy)'
    }
  }), /*#__PURE__*/React.createElement(Eyebrow, null, "Power grid"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(Meter, {
    value: sc.efficiency,
    max: 1,
    color: eff < 100 ? 'var(--red-500)' : 'var(--res-energy)',
    height: 6
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'italic 800 14px/1 var(--font-display)',
      color: eff < 100 ? 'var(--red-300)' : '#fff'
    }
  }, eff, "%")));
}
function AlertRibbon({
  alert,
  day,
  onAction
}) {
  const {
    Button
  } = window.IAP_DS;
  if (!alert) return null;
  const war = alert.kind === 'war';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 178,
      left: '50%',
      transform: 'translateX(-50%)',
      animation: 'iap-toast-in .3s var(--ease-pop)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '10px 14px 10px 10px',
      borderRadius: 10,
      transform: 'skewX(var(--skew))',
      background: war ? 'var(--grad-danger)' : 'linear-gradient(180deg,#ff9f43 0%,#e8731a 55%,#b4520c 100%)',
      boxShadow: 'inset 0 2px 0 rgba(255,255,255,.35), 0 4px 0 ' + (war ? '#7a0c27' : '#6b3206') + ', 0 12px 30px rgba(0,0,0,.45)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      transform: 'skewX(calc(var(--skew) * -1))'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 10,
      display: 'grid',
      placeItems: 'center',
      background: 'rgba(0,0,0,.25)',
      animation: 'iap-pulse 1.2s ease-in-out infinite'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: 'ph-fill ph-' + (war ? 'sword' : 'bowl-food'),
    style: {
      fontSize: 24,
      color: '#fff'
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'italic 900 22px/1 var(--font-display)',
      textTransform: 'uppercase',
      color: '#fff',
      textShadow: '0 2px 0 rgba(0,0,0,.3)'
    }
  }, alert.title), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 3,
      font: '500 13px/1.2 var(--font-body)',
      color: 'rgba(255,255,255,.92)'
    }
  }, alert.body, alert.eta ? ' · arrives Day ' + (day + alert.eta) : '')), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: war ? 'default' : 'gold',
    icon: war ? 'shield' : 'grains',
    onClick: onAction,
    style: {
      marginLeft: 6
    }
  }, war ? 'Defend' : 'Build farm'))));
}
Object.assign(window, {
  IdentityPlate,
  WorldClock,
  Treasury,
  AlertRibbon
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/game/hud/HudTop.jsx", error: String((e && e.message) || e) }); }

// ui_kits/game/hud/MatchHud.jsx
try { (() => {
// Match HUD mockup — composes the HUD regions over the live globe on a 1440×900 stage scaled to fit.
const HUD_W = 1440,
  HUD_H = 900;
const HUD_TWEAKS = /*EDITMODE-BEGIN*/{
  "scenario": "attack",
  "panels": "frosted",
  "myColor": "#42d4f4"
} /*EDITMODE-END*/;
function hudShape(feature) {
  if (!feature) return null;
  const polys = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  const rings = polys.map(p => p[0]);
  const all = [].concat(...rings);
  const lons = all.map(c => c[0]);
  const wrap = Math.max(...lons) - Math.min(...lons) > 180;
  const fx = lon => wrap && lon < 0 ? lon + 360 : lon;
  const lat0 = all.reduce((a, c) => a + c[1], 0) / all.length;
  const kx = Math.cos(lat0 * Math.PI / 180);
  const pts = rings.map(r => r.map(c => [fx(c[0]) * kx, -c[1]]));
  const flat = [].concat(...pts);
  const minX = Math.min(...flat.map(p => p[0])),
    maxX = Math.max(...flat.map(p => p[0]));
  const minY = Math.min(...flat.map(p => p[1])),
    maxY = Math.max(...flat.map(p => p[1]));
  const s = 92 / Math.max(maxX - minX, maxY - minY);
  const ox = (100 - (maxX - minX) * s) / 2,
    oy = (100 - (maxY - minY) * s) / 2;
  return pts.map(r => 'M' + r.map(p => ((p[0] - minX) * s + ox).toFixed(1) + ' ' + ((p[1] - minY) * s + oy).toFixed(1)).join('L') + 'Z').join('');
}
function MatchHud() {
  const {
    Toast
  } = window.IAP_DS;
  const H = window.HUD_DATA,
    D = window.IAP_DATA;
  const [t, setTweak] = useTweaks(HUD_TWEAKS);
  const sc = H.scenarios[t.scenario] || H.scenarios.calm;
  const solid = t.panels === 'solid';
  const [scale, setScale] = React.useState(1);
  const [geo, setGeo] = React.useState(null);
  const [mode, setMode] = React.useState('build');
  const [selected, setSelected] = React.useState('SWE');
  const [lens, setLens] = React.useState('political');
  const [hover, setHover] = React.useState(null);
  const [pos, setPos] = React.useState({
    x: 0,
    y: 0
  });
  const [day, setDay] = React.useState(H.DAY);
  const [secs, setSecs] = React.useState(12);
  const [queue, setQueue] = React.useState(H.buildingsHere.map(b => ({
    ...b,
    country: 'SWE'
  })));
  const [events, setEvents] = React.useState(H.events);
  const [chat, setChat] = React.useState(H.chat);
  const [players, setPlayers] = React.useState(H.players);
  const [toasts, setToasts] = React.useState([]);
  const stageRef = React.useRef(null),
    hostRef = React.useRef(null),
    globeRef = React.useRef(null);
  const me = {
    ...players.find(p => p.me),
    color: t.myColor
  };
  const allPlayers = players.map(p => p.me ? me : p);
  React.useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / HUD_W, window.innerHeight / HUD_H));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  React.useEffect(() => {
    const id = setInterval(() => setSecs(s => {
      if (s <= 1) {
        setDay(d => d + 1);
        return H.TICK_SEC;
      }
      return s - 1;
    }), 1000);
    return () => clearInterval(id);
  }, []);
  const toast = (msg, kind) => {
    const id = Math.random();
    setToasts(x => [...x, {
      id,
      msg,
      kind
    }]);
    setTimeout(() => setToasts(x => x.filter(y => y.id !== id)), 2600);
  };

  // Globe
  React.useEffect(() => {
    const g = new window.Globe(hostRef.current, {
      autoRotate: false
    });
    globeRef.current = g;
    g.camera.position.z = 2.6;
    g.load(D.GEO_URL).then(() => {
      const props = {},
        feats = {};
      g.setSelectable(true);
      Object.keys(g.props).forEach(c => {
        props[c] = g.props[c];
      });
      window.__HUD_PROPS = props;
      fetch(D.GEO_URL).then(r => r.json()).then(fc => {
        fc.features.forEach(f => {
          feats[f.properties.code] = f;
        });
        setGeo({
          props,
          feats
        });
      });
      g.focus('SWE');
      g._targetRotX = Math.min(g._targetRotX, 0.92);
    });
    return () => g.destroy();
  }, []);
  const cbs = React.useRef({});
  cbs.current = {
    setHover,
    setSelected
  };
  React.useEffect(() => {
    const g = globeRef.current;
    if (!g || !geo) return;
    g.onHover((c, p) => cbs.current.setHover(c ? {
      code: c,
      props: p
    } : null));
    g.onSelect(c => cbs.current.setSelected(c));
  }, [geo]);
  const ownerOf = code => allPlayers.find(p => p.lands.includes(code)) || null;

  // Lens colouring
  React.useEffect(() => {
    const g = globeRef.current;
    if (!g || !geo) return;
    const map = {};
    if (lens === 'political') {
      allPlayers.forEach(p => p.lands.forEach(c => {
        map[c] = p.color;
      }));
      if (t.scenario === 'attack') map.FIN = me.color;
    } else {
      const hex = {
        farmland: HUD_RES.food.hex,
        minerals: HUD_RES.minerals.hex,
        oil: HUD_RES.oil.hex
      }[lens];
      const lo = new THREE.Color('#1c2740'),
        hi = new THREE.Color(hex);
      Object.keys(geo.props).forEach(c => {
        map[c] = '#' + lo.clone().lerp(hi, Math.pow(geo.props[c][lens] / 100, 0.8)).getHexString();
      });
    }
    g.setOwners(map);
    g.setSelected(lens === 'political' ? selected : null);
  }, [geo, lens, selected, t.myColor, t.scenario, players]);

  // Keyboard: B / A / T / D
  React.useEffect(() => {
    const keys = {
      b: 'build',
      a: 'army',
      t: 'trade',
      d: 'diplomacy'
    };
    const f = e => {
      if (e.target.tagName === 'INPUT') return;
      const m = keys[e.key.toLowerCase()];
      if (m) setMode(m);
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, []);
  const onPointerMove = e => {
    const r = stageRef.current.getBoundingClientRect();
    setPos({
      x: (e.clientX - r.left) / scale,
      y: (e.clientY - r.top) / scale
    });
  };
  const onBuild = (type, afford) => {
    const B = D.BUILDINGS[type];
    if (!afford) return toast('Not enough resources.', 'err');
    setQueue(q => [...q, {
      type,
      status: 'building',
      country: selected,
      started: day,
      complete_at: day + B.build_ticks
    }]);
    toast(B.name + ' started.', 'ok');
  };
  const onTrain = u => toast('Training 5 ' + H.UNITS[u].name.toLowerCase() + '.', 'ok');
  const onMove = (code, hostile) => {
    const name = geo && geo.props[code] ? geo.props[code].name : code;
    toast(hostile ? 'Forces marching on ' + name + '.' : 'Reinforcing ' + name + '.', 'ok');
    if (hostile) setEvents(ev => [{
      id: Math.random(),
      type: 'war',
      actor: 'You',
      text: 'sent forces toward ' + name,
      day
    }, ...ev]);
  };
  const onTrade = (tr, ok) => toast(ok ? 'Trade accepted.' : 'Offer declined.', ok ? 'ok' : 'default');
  const onDiplo = (p, to) => {
    setPlayers(ps => ps.map(x => x.id === p.id ? {
      ...x,
      diplo: to
    } : x));
    toast({
      allied: 'Alliance proposed to ',
      war: 'War declared on ',
      truce: 'Truce offered to ',
      neutral: 'Alliance broken with '
    }[to] + p.name + '.', to === 'war' ? 'err' : 'ok');
  };
  const onSend = (body, scope) => setChat(c => [...c, {
    id: Math.random(),
    scope,
    pid: me.id,
    body
  }]);
  const onAlert = () => {
    if (t.scenario === 'attack') {
      setSelected('FIN');
      setMode('army');
      globeRef.current && globeRef.current.focus('FIN');
    } else {
      setSelected('SWE');
      setMode('build');
    }
  };
  const props = geo && geo.props[selected];
  const shapeOf = c => geo ? hudShape(geo.feats[c]) : null;
  const myShape = React.useMemo(() => shapeOf(me.country), [geo]);
  const selShape = React.useMemo(() => shapeOf(selected), [geo, selected]);
  const pending = H.trades.filter(x => x.dir === 'in').length;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: '#05080f',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: stageRef,
    onPointerMove: onPointerMove,
    style: {
      position: 'absolute',
      left: '50%',
      top: '50%',
      width: HUD_W,
      height: HUD_H,
      transform: 'translate(-50%, -50%) scale(' + scale + ')',
      overflow: 'hidden',
      background: 'var(--grad-page), var(--bg-page)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: hostRef,
    style: {
      position: 'absolute',
      inset: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      background: 'linear-gradient(180deg, rgba(6,10,20,.65) 0%, rgba(6,10,20,0) 22%, rgba(6,10,20,0) 72%, rgba(6,10,20,.7) 100%)'
    }
  }), /*#__PURE__*/React.createElement(IdentityPlate, {
    me: me,
    countryName: geo ? geo.props[me.country].name : 'Sweden',
    shape: myShape,
    sc: sc,
    territories: me.lands.length,
    solid: solid
  }), /*#__PURE__*/React.createElement(WorldClock, {
    day: day,
    secsLeft: secs,
    tickSec: H.TICK_SEC,
    players: allPlayers,
    total: H.TOTAL,
    victory: H.VICTORY,
    solid: solid
  }), /*#__PURE__*/React.createElement(Treasury, {
    sc: sc,
    solid: solid
  }), /*#__PURE__*/React.createElement(AlertRibbon, {
    alert: sc.alert,
    day: day,
    onAction: onAlert
  }), /*#__PURE__*/React.createElement(Standings, {
    players: allPlayers,
    total: H.TOTAL,
    selected: selected,
    onPick: c => {
      setSelected(c);
      globeRef.current && globeRef.current.focus(c);
    },
    solid: solid
  }), props ? /*#__PURE__*/React.createElement(ContextPanel, {
    mode: mode,
    setMode: setMode,
    code: selected,
    props: props,
    shape: selShape,
    owner: ownerOf(selected),
    me: me,
    players: allPlayers,
    sc: sc,
    day: day,
    queue: queue.filter(b => b.country === selected),
    onBuild: onBuild,
    onTrain: onTrain,
    onMove: onMove,
    onTrade: onTrade,
    onDiplo: onDiplo,
    solid: solid
  }) : null, /*#__PURE__*/React.createElement(Comms, {
    players: allPlayers,
    events: events,
    chat: chat,
    onSend: onSend,
    solid: solid
  }), /*#__PURE__*/React.createElement(Hotbar, {
    mode: mode,
    setMode: setMode,
    counts: {
      trade: pending,
      army: t.scenario === 'attack' ? '!' : 0
    }
  }), /*#__PURE__*/React.createElement(GlobeControls, {
    lens: lens,
    setLens: setLens,
    onHome: () => {
      setSelected(me.country);
      globeRef.current && globeRef.current.focus(me.country);
    },
    onZoom: dz => {
      const g = globeRef.current;
      if (g) g.camera.position.z = Math.max(1.6, Math.min(5, g.camera.position.z + dz));
    }
  }), /*#__PURE__*/React.createElement(HoverTip, {
    hover: hover,
    pos: pos,
    owner: hover ? ownerOf(hover.code) : null,
    lens: lens
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: sc.alert ? 262 : 186,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      alignItems: 'center',
      pointerEvents: 'none',
      zIndex: 40
    }
  }, toasts.map(x => /*#__PURE__*/React.createElement(Toast, {
    key: x.id,
    kind: x.kind
  }, x.msg)))), /*#__PURE__*/React.createElement(TweaksPanel, null, /*#__PURE__*/React.createElement(TweakSection, {
    label: "Match state"
  }), /*#__PURE__*/React.createElement(TweakRadio, {
    label: "Scenario",
    value: t.scenario,
    options: [{
      value: 'calm',
      label: 'Calm'
    }, {
      value: 'attack',
      label: 'Invaded'
    }, {
      value: 'starving',
      label: 'Starving'
    }],
    onChange: v => setTweak('scenario', v)
  }), /*#__PURE__*/React.createElement(TweakSection, {
    label: "HUD"
  }), /*#__PURE__*/React.createElement(TweakRadio, {
    label: "Panels",
    value: t.panels,
    options: [{
      value: 'frosted',
      label: 'Frosted'
    }, {
      value: 'solid',
      label: 'Solid'
    }],
    onChange: v => setTweak('panels', v)
  }), /*#__PURE__*/React.createElement(TweakColor, {
    label: "Your slot colour",
    value: t.myColor,
    options: ['#42d4f4', '#bfef45', '#f032e6', '#dcbeff'],
    onChange: v => setTweak('myColor', v)
  })));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(MatchHud, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/game/hud/MatchHud.jsx", error: String((e && e.message) || e) }); }

// ui_kits/game/hud/hudData.js
try { (() => {
// Mock match state for the Match HUD mockup. Shapes follow db/schema.sql (match_players, territories,
// buildings, armies, diplomacy, trades, chat_messages) and numbers follow utils/engine/GameConfig.php.
window.HUD_DATA = function () {
  const players = [{
    id: 1,
    me: true,
    name: 'Ulf Kristersson',
    title: 'Prime Minister',
    country: 'SWE',
    color: '#42d4f4',
    pop: 10.6e6,
    popCap: 12.86e6,
    ai: false,
    lands: ['SWE', 'NOR', 'FIN', 'DNK', 'EST', 'LVA', 'LTU']
  }, {
    id: 2,
    name: 'Kim Jong Un',
    title: 'Supreme Leader',
    country: 'PRK',
    color: '#e6194b',
    pop: 241e6,
    ai: true,
    diplo: 'war',
    lands: ['PRK', 'KOR', 'MNG', 'JPN', 'TWN', 'PHL', 'VNM', 'LAO', 'KHM', 'THA', 'MMR']
  }, {
    id: 3,
    name: 'Luiz Inácio Lula da Silva',
    title: 'President',
    country: 'BRA',
    color: '#3cb44b',
    pop: 287e6,
    ai: false,
    diplo: 'neutral',
    lands: ['BRA', 'URY', 'PRY', 'BOL', 'ARG', 'PER', 'GUY', 'SUR']
  }, {
    id: 4,
    name: 'Salman bin Abdulaziz',
    title: 'King',
    country: 'SAU',
    color: '#f58231',
    pop: 118e6,
    ai: true,
    diplo: 'truce',
    lands: ['SAU', 'YEM', 'OMN', 'ARE', 'QAT', 'KWT', 'JOR', 'IRQ', 'SYR']
  }, {
    id: 5,
    name: 'Emmanuel Macron',
    title: 'President',
    country: 'FRA',
    color: '#4363d8',
    pop: 104e6,
    ai: false,
    diplo: 'allied',
    lands: ['FRA', 'BEL', 'NLD', 'LUX', 'CHE', 'ESP']
  }];

  // Per-day deltas are what Economy::step would return for this board.
  const scenarios = {
    calm: {
      res: {
        food: 2410,
        energy: 318,
        minerals: 1120,
        gold: 6840,
        oil: 96,
        research: 540
      },
      delta: {
        food: 86,
        energy: -12,
        minerals: 170,
        gold: 312,
        oil: -18,
        research: 45
      },
      efficiency: 1,
      fed: true,
      alert: null
    },
    attack: {
      res: {
        food: 2410,
        energy: 318,
        minerals: 1120,
        gold: 6840,
        oil: 96,
        research: 540
      },
      delta: {
        food: 86,
        energy: -12,
        minerals: 170,
        gold: 312,
        oil: -18,
        research: 45
      },
      efficiency: 1,
      fed: true,
      alert: {
        kind: 'war',
        title: 'Invasion incoming',
        body: 'Kim Jong Un’s armor is marching on Finland',
        eta: 2
      }
    },
    starving: {
      res: {
        food: 0,
        energy: 0,
        minerals: 1120,
        gold: 6840,
        oil: 0,
        research: 540
      },
      delta: {
        food: -42,
        energy: -38,
        minerals: 92,
        gold: 241,
        oil: -18,
        research: 24
      },
      efficiency: 0.54,
      fed: false,
      alert: {
        kind: 'food',
        title: 'Your people are starving',
        body: 'Population −1.5% per day until food returns',
        eta: null
      }
    }
  };

  // buildings in the selected country (SWE)
  const buildingsHere = [{
    type: 'farm',
    status: 'active'
  }, {
    type: 'farm',
    status: 'active'
  }, {
    type: 'power_plant',
    status: 'active'
  }, {
    type: 'mine',
    status: 'active'
  }, {
    type: 'mine',
    status: 'building',
    complete_at: 15,
    started: 12
  }, {
    type: 'lab',
    status: 'building',
    complete_at: 17,
    started: 13
  }];
  const UNITS = {
    infantry: {
      name: 'Infantry',
      icon: 'person-simple-run',
      cost: {
        gold: 40,
        minerals: 10
      },
      attack: 1,
      build_ticks: 2
    },
    armor: {
      name: 'Armor',
      icon: 'truck',
      cost: {
        gold: 120,
        minerals: 60,
        oil: 20
      },
      attack: 3,
      build_ticks: 4
    },
    air: {
      name: 'Air Force',
      icon: 'airplane-tilt',
      cost: {
        gold: 200,
        minerals: 80,
        oil: 40
      },
      attack: 5,
      build_ticks: 6
    },
    navy: {
      name: 'Navy',
      icon: 'boat',
      cost: {
        gold: 260,
        minerals: 120,
        oil: 50
      },
      attack: 4,
      build_ticks: 7
    }
  };
  const armiesHere = [{
    type: 'infantry',
    count: 24
  }, {
    type: 'armor',
    count: 6
  }];
  const moveTargets = [{
    code: 'FIN',
    owner: 1,
    eta: 1
  }, {
    code: 'RUS',
    owner: null,
    eta: 2,
    garrison: 8
  }, {
    code: 'POL',
    owner: null,
    eta: 2,
    garrison: 8
  }, {
    code: 'DEU',
    owner: null,
    eta: 2,
    garrison: 8
  }];
  const trades = [{
    id: 1,
    dir: 'in',
    from: 5,
    give: {
      food: 400
    },
    receive: {
      minerals: 250
    }
  }, {
    id: 2,
    dir: 'in',
    from: 3,
    give: {
      oil: 150
    },
    receive: {
      gold: 600
    }
  }, {
    id: 3,
    dir: 'out',
    to: 4,
    give: {
      minerals: 300
    },
    receive: {
      oil: 200
    },
    status: 'pending'
  }];
  const events = [{
    id: 9,
    type: 'war',
    actor: 'Kim Jong Un',
    text: 'declared war on you',
    day: 13
  }, {
    id: 8,
    type: 'battle_repelled',
    actor: 'Latvia',
    text: 'held against Kim Jong Un',
    day: 12
  }, {
    id: 7,
    type: 'conquest',
    actor: 'Kim Jong Un',
    text: 'conquered Thailand',
    day: 12
  }, {
    id: 6,
    type: 'alliance',
    actor: 'Emmanuel Macron',
    text: 'is now your ally',
    day: 10
  }, {
    id: 5,
    type: 'build_complete',
    actor: 'You',
    text: 'completed a farm in Sweden',
    day: 9
  }, {
    id: 4,
    type: 'conquest',
    actor: 'Luiz Inácio Lula da Silva',
    text: 'conquered Argentina',
    day: 8
  }];
  const chat = [{
    id: 1,
    scope: 'all',
    pid: 5,
    body: 'Kim is coming for the Baltics. I can send air support.'
  }, {
    id: 2,
    scope: 'all',
    pid: 3,
    body: 'Selling oil. DM offers.'
  }, {
    id: 3,
    scope: 'team',
    pid: 5,
    body: 'Accept my food deal and I’ll move 12 infantry to Denmark.'
  }, {
    id: 4,
    scope: 'all',
    pid: 2,
    body: 'The peninsula was only the beginning.'
  }];
  return {
    players,
    scenarios,
    buildingsHere,
    UNITS,
    armiesHere,
    moveTargets,
    trades,
    events,
    chat,
    TOTAL: 176,
    VICTORY: 0.6,
    TICK_SEC: 20,
    DAY: 14
  };
}();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/game/hud/hudData.js", error: String((e && e.message) || e) }); }

// ui_kits/game/hud/tweaks-panel.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)
// Copied omelette starter. Re-running copy_starter_component with this kind overwrites this file with the latest version (page content is unaffected).

/* BEGIN USAGE */
// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
// Exports (to window): useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider,
//   TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "palette": ["#D97757", "#29261b", "#f6f4ef"],
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        options={['#D97757', '#2A6FDB', '#1F8A5B', '#7A5AE0']}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakColor  label="Palette" value={t.palette}
//                        options={[['#D97757', '#29261b', '#f6f4ef'],
//                                  ['#475569', '#0f172a', '#f1f5f9']]}
//                        onChange={(v) => setTweak('palette', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// TweakRadio is the segmented control for 2–3 short options (auto-falls-back to
// TweakSelect past ~16/~10 chars per label); reach for TweakSelect directly when
// options are many or long. For color tweaks always curate 3-4 options rather than
// a free picker; an option can also be a whole 2–5 color palette (the stored value
// is the array). The Tweak* controls are a floor, not a ceiling — build custom
// controls inside the panel if a tweak calls for UI they don't cover.
/* END USAGE */
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom right;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;box-sizing:border-box;min-width:0;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}

  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;
    padding:0;border:0;border-radius:6px;overflow:hidden;cursor:default;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s cubic-bezier(.3,.7,.4,1),box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);
    box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),
    0 2px 6px rgba(0,0,0,.15)}
  .twk-chip>span{position:absolute;top:0;bottom:0;right:0;width:34%;
    display:flex;flex-direction:column;box-shadow:-1px 0 0 rgba(0,0,0,.1)}
  .twk-chip>span>i{flex:1;box-shadow:0 -1px 0 rgba(0,0,0,.1)}
  .twk-chip>span>i:first-child{box-shadow:none}
  .twk-chip svg{position:absolute;top:6px;left:6px;width:13px;height:13px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null ? keyOrEdits : {
      [keyOrEdits]: val
    };
    setValues(prev => ({
      ...prev,
      ...edits
    }));
    window.parent.postMessage({
      type: '__edit_mode_set_keys',
      edits
    }, '*');
    // Same-window signal so in-page listeners (deck-stage rail thumbnails)
    // can react — the parent message only reaches the host, not peers.
    window.dispatchEvent(new CustomEvent('tweakchange', {
      detail: edits
    }));
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({
  title = 'Tweaks',
  children
}) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  const offsetRef = React.useRef({
    x: 16,
    y: 16
  });
  const PAD = 16;
  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth,
      h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y))
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);
  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);
  React.useEffect(() => {
    const onMsg = e => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({
      type: '__edit_mode_available'
    }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({
      type: '__edit_mode_dismissed'
    }, '*');
  };
  const onDragStart = e => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX,
      sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = ev => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy)
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  // data-om-starter: inert presence marker — Claude Design's starter-usage
  // probe reads it. The closed panel renders nothing, so the marker rides
  // the <html> element as an attribute instead of a rendered node — zero
  // elements added, so page CSS (even structural selectors like
  // :nth-child) can never observe it. It records that the page WIRES a
  // tweaks panel, whether or not the panel is open. Keep this effect.
  React.useEffect(() => {
    document.documentElement.setAttribute('data-om-starter', 'tweaks-panel');
    return () => document.documentElement.removeAttribute('data-om-starter');
  }, []);
  if (!open) return null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, __TWEAKS_STYLE), /*#__PURE__*/React.createElement("div", {
    ref: dragRef,
    className: "twk-panel",
    "data-omelette-chrome": "",
    style: {
      right: offsetRef.current.x,
      bottom: offsetRef.current.y
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-hd",
    onMouseDown: onDragStart
  }, /*#__PURE__*/React.createElement("b", null, title), /*#__PURE__*/React.createElement("button", {
    className: "twk-x",
    "aria-label": "Close tweaks",
    onMouseDown: e => e.stopPropagation(),
    onClick: dismiss
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "twk-body"
  }, children)));
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "twk-sect"
  }, label), children);
}
function TweakRow({
  label,
  value,
  children,
  inline = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: inline ? 'twk-row twk-row-h' : 'twk-row'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label), value != null && /*#__PURE__*/React.createElement("span", {
    className: "twk-val"
  }, value)), children);
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label,
    value: `${value}${unit}`
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    className: "twk-slider",
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: e => onChange(Number(e.target.value))
  }));
}
function TweakToggle({
  label,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-row twk-row-h"
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "twk-toggle",
    "data-on": value ? '1' : '0',
    role: "switch",
    "aria-checked": !!value,
    onClick: () => onChange(!value)
  }, /*#__PURE__*/React.createElement("i", null)));
}
function TweakRadio({
  label,
  value,
  options,
  onChange
}) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  // Segments wrap mid-word once per-segment width runs out. The track is
  // ~248px (280 panel − 28 body pad − 4 seg pad), each button loses 12px
  // to its own padding, and 11.5px system-ui averages ~6.3px/char — so 2
  // options fit ~16 chars each, 3 fit ~10. Past that (or >3 options), fall
  // back to a dropdown rather than wrap.
  const labelLen = o => String(typeof o === 'object' ? o.label : o).length;
  const maxLen = options.reduce((m, o) => Math.max(m, labelLen(o)), 0);
  const fitsAsSegments = maxLen <= ({
    2: 16,
    3: 10
  }[options.length] ?? 0);
  if (!fitsAsSegments) {
    // <select> emits strings — map back to the original option value so the
    // fallback stays type-preserving (numbers, booleans) like the segment path.
    const resolve = s => {
      const m = options.find(o => String(typeof o === 'object' ? o.value : o) === s);
      return m === undefined ? s : typeof m === 'object' ? m.value : m;
    };
    return /*#__PURE__*/React.createElement(TweakSelect, {
      label: label,
      value: value,
      options: options,
      onChange: s => onChange(resolve(s))
    });
  }
  const opts = options.map(o => typeof o === 'object' ? o : {
    value: o,
    label: o
  });
  const idx = Math.max(0, opts.findIndex(o => o.value === value));
  const n = opts.length;
  const segAt = clientX => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor((clientX - r.left - 2) / inner * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };
  const onPointerDown = e => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = ev => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    role: "radiogroup",
    onPointerDown: onPointerDown,
    className: dragging ? 'twk-seg dragging' : 'twk-seg'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-seg-thumb",
    style: {
      left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
      width: `calc((100% - 4px) / ${n})`
    }
  }), opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    role: "radio",
    "aria-checked": o.value === value
  }, o.label))));
}
function TweakSelect({
  label,
  value,
  options,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("select", {
    className: "twk-field",
    value: value,
    onChange: e => onChange(e.target.value)
  }, options.map(o => {
    const v = typeof o === 'object' ? o.value : o;
    const l = typeof o === 'object' ? o.label : o;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })));
}
function TweakText({
  label,
  value,
  placeholder,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("input", {
    className: "twk-field",
    type: "text",
    value: value,
    placeholder: placeholder,
    onChange: e => onChange(e.target.value)
  }));
}
function TweakNumber({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange
}) {
  const clamp = n => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({
    x: 0,
    val: 0
  });
  const onScrubStart = e => {
    e.preventDefault();
    startRef.current = {
      x: e.clientX,
      val: value
    };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = ev => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-num"
  }, /*#__PURE__*/React.createElement("span", {
    className: "twk-num-lbl",
    onPointerDown: onScrubStart
  }, label), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: value,
    min: min,
    max: max,
    step: step,
    onChange: e => onChange(clamp(Number(e.target.value)))
  }), unit && /*#__PURE__*/React.createElement("span", {
    className: "twk-num-unit"
  }, unit));
}

// Relative-luminance contrast pick — checkmarks drawn over a swatch need to
// read on both #111 and #fafafa without per-option configuration. Hex input
// only (#rgb / #rrggbb); named or rgb()/hsl() colors fall through to "light".
function __twkIsLight(hex) {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, c => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = n >> 16 & 255,
    g = n >> 8 & 255,
    b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}
const __TwkCheck = ({
  light
}) => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 14 14",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  d: "M3 7.2 5.8 10 11 4.2",
  fill: "none",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  stroke: light ? 'rgba(0,0,0,.78)' : '#fff'
}));

// TweakColor — curated color/palette picker. Each option is either a single
// hex string or an array of 1-5 hex strings; the card adapts — a lone color
// renders solid, a palette renders colors[0] as the hero (left ~2/3) with the
// rest stacked in a sharp column on the right. onChange emits the
// option in the shape it was passed (string stays string, array stays array).
// Without options it falls back to the native color input for back-compat.
function TweakColor({
  label,
  value,
  options,
  onChange
}) {
  if (!options || !options.length) {
    return /*#__PURE__*/React.createElement("div", {
      className: "twk-row twk-row-h"
    }, /*#__PURE__*/React.createElement("div", {
      className: "twk-lbl"
    }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("input", {
      type: "color",
      className: "twk-swatch",
      value: value,
      onChange: e => onChange(e.target.value)
    }));
  }
  // Native <input type=color> emits lowercase hex per the HTML spec, so
  // compare case-insensitively. String() guards JSON.stringify(undefined),
  // which returns the primitive undefined (no .toLowerCase).
  const key = o => String(JSON.stringify(o)).toLowerCase();
  const cur = key(value);
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-chips",
    role: "radiogroup"
  }, options.map((o, i) => {
    const colors = Array.isArray(o) ? o : [o];
    const [hero, ...rest] = colors;
    const sup = rest.slice(0, 4);
    const on = key(o) === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      className: "twk-chip",
      role: "radio",
      "aria-checked": on,
      "data-on": on ? '1' : '0',
      "aria-label": colors.join(', '),
      title: colors.join(' · '),
      style: {
        background: hero
      },
      onClick: () => onChange(o)
    }, sup.length > 0 && /*#__PURE__*/React.createElement("span", null, sup.map((c, j) => /*#__PURE__*/React.createElement("i", {
      key: j,
      style: {
        background: c
      }
    }))), on && /*#__PURE__*/React.createElement(__TwkCheck, {
      light: __twkIsLight(hero)
    }));
  })));
}
function TweakButton({
  label,
  onClick,
  secondary = false
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: secondary ? 'twk-btn secondary' : 'twk-btn',
    onClick: onClick
  }, label);
}
Object.assign(window, {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakRow,
  TweakSlider,
  TweakToggle,
  TweakRadio,
  TweakSelect,
  TweakText,
  TweakNumber,
  TweakColor,
  TweakButton
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/game/hud/tweaks-panel.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Wordmark = __ds_scope.Wordmark;

__ds_ns.BuildItem = __ds_scope.BuildItem;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.Pill = __ds_scope.Pill;

__ds_ns.ChatMessage = __ds_scope.ChatMessage;

__ds_ns.FeedEvent = __ds_scope.FeedEvent;

__ds_ns.Spinner = __ds_scope.Spinner;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Field = __ds_scope.Field;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.ModeCard = __ds_scope.ModeCard;

__ds_ns.CountryTag = __ds_scope.CountryTag;

__ds_ns.ResourceChip = __ds_scope.ResourceChip;

__ds_ns.PlayerRow = __ds_scope.PlayerRow;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Panel = __ds_scope.Panel;

})();
