// Design-system markup helpers. Each returns an HTML string whose classes are styled by
// components.css. DOM mirrors design/components/**/*.jsx. Interactive states are CSS
// (:hover/:active/:focus), so these return the resting markup only.
(function () {
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const RES = {
    food: { icon: 'grains', color: 'var(--res-food)', label: 'Food' },
    energy: { icon: 'lightning', color: 'var(--res-energy)', label: 'Energy' },
    minerals: { icon: 'diamond', color: 'var(--res-minerals)', label: 'Minerals' },
    gold: { icon: 'coins', color: 'var(--res-gold)', label: 'Gold' },
    oil: { icon: 'drop', color: 'var(--res-oil)', label: 'Oil' },
    research: { icon: 'flask', color: 'var(--res-research)', label: 'Research' },
  };
  const FEED = { conquest: 'sword', build_complete: 'check-circle', ai_build: 'robot', player_defeated: 'skull', match_ended: 'trophy', match_started: 'flag', battle_repelled: 'shield', trade: 'handshake', war: 'sword', alliance: 'handshake' };
  const TOAST_ICON = { default: 'info', ok: 'check-circle', err: 'warning-circle' };
  const BADGE_LABEL = { ai: 'AI', ready: 'Ready', host: 'Host' };

  // ResourceChip's own formatter (design/components/hud/resourceMeta.js) — distinct from hudNum.
  function formatNum(n) {
    n = Number(n) || 0; const a = Math.abs(n);
    if (a >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (a >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (a >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return String(Math.round(n));
  }

  const iconTag = (name, weight = 'fill') => `<i class="ph-${weight} ph-${name}" aria-hidden="true"></i>`;

  const UI = {
    RES, formatNum, esc,

    icon({ name, weight = 'fill', size = 18, color, className = '', title } = {}) {
      const cls = `ph-${weight} ph-${name}${className ? ' ' + className : ''}`;
      const style = `font-size:${size}px;line-height:1;display:inline-block${color ? ';color:' + color : ''}`;
      return `<i class="${cls}" style="${style}"${title ? ` title="${esc(title)}"` : ' aria-hidden="true"'}></i>`;
    },

    button({ variant = 'default', size = 'md', icon, iconRight, slanted, block, disabled, children, label } = {}) {
      let cls = 'btn';
      if (variant !== 'default') cls += ' btn--' + variant;
      if (size === 'sm') cls += ' btn--sm';
      if (slanted) cls += ' btn--slanted';
      if (block) cls += ' btn--block';
      const inner = (icon ? iconTag(icon) : '') + esc(children != null ? children : label) + (iconRight ? iconTag(iconRight) : '');
      return `<button type="button" class="${cls}"${disabled ? ' disabled' : ''}><span class="btn__label">${inner}</span></button>`;
    },

    badge({ kind = 'default', icon, children } = {}) {
      const cls = 'badge' + (kind !== 'default' ? ' badge--' + kind : '');
      return `<span class="${cls}">${icon ? iconTag(icon) : ''}${esc(children)}</span>`;
    },

    pill({ tone = 'neutral', solid = false, icon, children } = {}) {
      if (solid) {
        const cls = 'pill pill--solid' + (tone !== 'neutral' ? ' pill--' + tone : '');
        return `<span class="${cls}"><span class="pill__inner">${icon ? iconTag(icon) : ''}${esc(children)}</span></span>`;
      }
      const cls = 'pill' + (tone !== 'neutral' ? ' pill--' + tone : '');
      return `<span class="${cls}">${icon ? iconTag(icon) : ''}${esc(children)}</span>`;
    },

    input({ as = 'input', size = 'md', icon, uppercase, placeholder, maxLength, value, defaultValue, options, type = 'text', disabled } = {}) {
      const sm = size === 'sm';
      let cls = 'input';
      if (sm) cls += ' input--sm';
      if (icon) cls += ' input--icon';
      if (as === 'select') cls += ' input--select';
      if (uppercase) cls += ' input--uppercase';
      let control;
      if (as === 'select') {
        control = `<select class="${cls}"${disabled ? ' disabled' : ''}>` + (options || []).map((o) => {
          const v = typeof o === 'string' ? o : o.value, l = typeof o === 'string' ? o : o.label;
          return `<option value="${esc(v)}">${esc(l)}</option>`;
        }).join('') + `</select>`;
      } else {
        const val = value != null ? value : (defaultValue != null ? defaultValue : null);
        control = `<input class="${cls}" type="${type}"${placeholder ? ` placeholder="${esc(placeholder)}"` : ''}${maxLength ? ` maxlength="${maxLength}"` : ''}${val != null ? ` value="${esc(val)}"` : ''}${disabled ? ' disabled' : ''}>`;
      }
      const ic = icon ? `<i class="ph-bold ph-${icon} input-icon${sm ? ' input-icon--sm' : ''}" aria-hidden="true"></i>` : '';
      const caret = as === 'select' ? `<i class="ph-bold ph-caret-down input-caret" aria-hidden="true"></i>` : '';
      return `<div class="input-wrap">${control}${ic}${caret}</div>`;
    },

    field({ label, hint, children } = {}) {
      return `<label class="field">${label ? `<span class="field__label">${esc(label)}</span>` : ''}${children || ''}${hint ? `<span class="field__hint">${esc(hint)}</span>` : ''}</label>`;
    },

    card({ tone = 'default', padding = 26, children } = {}) {
      return `<div class="card${tone === 'hero' ? ' card--hero' : ''}" style="padding:${padding}px">${children || ''}</div>`;
    },

    panel({ title, actions, padding = 16, children, bodyStyle = '' } = {}) {
      const header = (title || actions) ? `<header class="panel__header">${title ? `<h2 class="panel__title"><span class="panel__tick" aria-hidden="true"></span>${esc(title)}</h2>` : ''}<div class="panel__spacer"></div>${actions || ''}</header>` : '';
      return `<section class="panel"><div class="panel__body" style="padding:${padding}px;${bodyStyle}">${header}${children || ''}</div></section>`;
    },

    wordmark({ size = 'md', layout = 'stacked', tagline, align = 'left' } = {}) {
      const cls = `wordmark wordmark--${size}${layout === 'inline' ? ' wordmark--inline' : ''}${align === 'center' ? ' wordmark--center' : ''}`;
      return `<div class="${cls}"><div class="wordmark__lockup"><span class="wordmark__i-am">I Am</span><span class="wordmark__president">President</span></div>${tagline ? `<div class="wordmark__tagline">${esc(tagline)}</div>` : ''}</div>`;
    },

    resourceChip({ resource = 'gold', value = 0, showName = true } = {}) {
      const m = RES[resource];
      const val = typeof value === 'number' ? formatNum(value) : value;
      return `<div class="res-chip" title="${m.label}">` +
        `<span class="res-chip__disc" style="background:color-mix(in oklab, ${m.color} 20%, transparent)"><i class="ph-fill ph-${m.icon}" aria-hidden="true" style="color:${m.color}"></i></span>` +
        `<span class="res-chip__val" style="color:${m.color}">${esc(val)}</span>` +
        (showName ? `<span class="res-chip__name">${m.label}</span>` : '') + `</div>`;
    },

    countryTag({ name, leader, owner, ownerColor, farmland, minerals, oil } = {}) {
      const stat = (label, icon, color, value) => `<span class="tag-stat"><span class="tag-stat__label">${label}</span><b class="tag-stat__val">${icon ? `<i class="ph-fill ph-${icon}" aria-hidden="true" style="color:${color}"></i>` : ''}${value}</b></span>`;
      let stats = '';
      if (owner !== undefined) stats += `<span class="tag-stat"><span class="tag-stat__label">Owner</span><b class="tag-stat__val"><span class="tag-stat__swatch" style="background:${ownerColor || 'var(--globe-land)'}"></span><span class="tag-stat__owner">${esc(owner)}</span></b></span>`;
      if (farmland !== undefined) stats += stat('Farmland', 'grains', 'var(--res-food)', farmland);
      if (minerals !== undefined) stats += stat('Minerals', 'diamond', 'var(--res-minerals)', minerals);
      if (oil !== undefined) stats += stat('Oil', 'drop', 'var(--res-oil)', oil);
      return `<div class="country-tag"><div class="country-tag__name">${esc(name)}</div>${leader ? `<div class="country-tag__leader">${esc(leader)}</div>` : ''}<div class="country-tag__stats">${stats}</div></div>`;
    },

    playerRow({ color = 'var(--player-1)', name, meta, me, badges = [], defeated, onClick } = {}) {
      let cls = 'player-row';
      if (me) cls += ' player-row--me';
      if (defeated) cls += ' player-row--defeated';
      if (onClick) cls += ' player-row--click';
      const badgeHtml = badges.map((b) => UI.badge({ kind: b, children: BADGE_LABEL[b] || b })).join('');
      return `<div class="${cls}"><span class="player-row__swatch" style="background:${color}"></span>` +
        `<div class="player-row__col"><div class="player-row__name"><span>${esc(name)}</span>${defeated ? iconTag('skull') : ''}</div>` +
        (meta != null && meta !== '' ? `<div class="player-row__meta">${meta}</div>` : '') + `</div>${badgeHtml}</div>`;
    },

    buildItem({ name, icon = 'buildings', tone = 'var(--sky-500)', cost = {}, days, description, disabled } = {}) {
      const tileBg = `linear-gradient(180deg, rgba(255,255,255,.28), rgba(0,0,0,.18)), ${tone}`;
      const costHtml = Object.keys(cost).map((r) => { const m = RES[r] || { icon: 'circle', color: 'var(--text-muted)' }; return `<span><i class="ph-fill ph-${m.icon}" aria-hidden="true" style="color:${m.color}"></i>${cost[r]}</span>`; }).join('');
      const daysHtml = days != null ? `<span class="build-item__days"><i class="ph-fill ph-hourglass" aria-hidden="true"></i>${days} days</span>` : '';
      return `<div class="build-item" role="button" tabindex="${disabled ? -1 : 0}"${description ? ` title="${esc(description)}"` : ''}${disabled ? ' aria-disabled="true"' : ''}>` +
        `<span class="build-item__tile" style="background:${tileBg}"><i class="ph-fill ph-${icon}" aria-hidden="true"></i></span>` +
        `<div class="build-item__col"><div class="build-item__name">${esc(name)}</div><div class="build-item__cost">${costHtml}${daysHtml}</div></div></div>`;
    },

    feedEvent({ type = 'match_started', actor, day, children } = {}) {
      const icon = FEED[type] || 'flag';
      return `<div class="feed-ev feed-ev--${type}">${iconTag(icon)}<div class="feed-ev__body">${actor ? `<b>${esc(actor)}</b> ` : ''}${esc(children)}</div>${day != null ? `<span class="feed-ev__day">Day ${day}</span>` : ''}</div>`;
    },

    chatMessage({ name = 'System', color = 'var(--text-muted)', children } = {}) {
      return `<div class="chat-msg"><span class="chat-msg__name" style="color:${color}">${esc(name)}:</span> ${esc(children)}</div>`;
    },

    toast({ kind = 'default', icon, children } = {}) {
      const cls = 'toast' + (kind !== 'default' ? ' toast--' + kind : '');
      return `<div class="${cls}" role="status">${iconTag(icon || TOAST_ICON[kind])}<span>${esc(children)}</span></div>`;
    },

    spinner({ size = 34, color = 'var(--teal-400)' } = {}) {
      const bw = Math.max(2, Math.round(size / 11));
      return `<span class="spinner" role="progressbar" aria-label="Loading" style="width:${size}px;height:${size}px;border-width:${bw}px;border-top-color:${color}"></span>`;
    },

    tooltip({ title, body, icon, tone = 'var(--sky-500)', keyHint, stats = [], placement = 'bottom', arrowOffset, width = 260 } = {}) {
      const arrowLeft = (arrowOffset != null ? arrowOffset : width / 2) - 6;
      const arrowStyle = (placement === 'bottom' || placement === 'top') ? ` style="left:${arrowLeft}px"` : '';
      const iconEl = icon ? `<span class="tooltip__tile" style="background:linear-gradient(180deg, rgba(255,255,255,.28), rgba(0,0,0,.18)), ${tone}"><i class="ph-fill ph-${icon}" aria-hidden="true"></i></span>` : '';
      const keyEl = keyHint ? `<span class="tooltip__key">${esc(keyHint)}</span>` : '';
      const bodyEl = body ? `<div class="tooltip__body">${esc(body)}</div>` : '';
      const statsEl = (stats && stats.length) ? `<div class="tooltip__stats">` + stats.map((s) =>
        `<div class="tooltip__stat"><span class="tooltip__stat-label">${esc(s.label)}</span><span class="tooltip__stat-val"${s.color ? ` style="color:${s.color}"` : ''}>${s.icon ? iconTag(s.icon) : ''}${esc(s.value)}</span></div>`).join('') + `</div>` : '';
      return `<div role="tooltip" class="tooltip tooltip--${placement}" style="width:${width}px"><span class="tooltip__arrow" aria-hidden="true"${arrowStyle}></span>` +
        `<div class="tooltip__head">${iconEl}<span class="tooltip__title">${esc(title)}</span>${keyEl}</div>${bodyEl}${statsEl}</div>`;
    },

    modeCard({ icon = 'globe-hemisphere-west', title, description, tone = 'sky' } = {}) {
      return `<button type="button" class="mode-card"><span class="mode-card__tile mode-card__tile--${tone}">${iconTag(icon)}</span>` +
        `<span class="mode-card__col"><span class="mode-card__title">${esc(title)}</span><span class="mode-card__desc">${esc(description)}</span></span></button>`;
    },
  };

  window.UI = UI;
})();
