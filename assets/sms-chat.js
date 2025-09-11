
class SmsChat extends HTMLElement {
  static get observedAttributes() {
    return ['timestamp-format','group-by-minutes','locale','show-day-separators','show-group-time','bubble-timestamps'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // config
    this._fmt = this.getAttribute('timestamp-format') || 'YYYY-MM-DD HH:mm';
    this._groupByMinutes = parseInt(this.getAttribute('group-by-minutes') || '0', 10);
    this._locale = this._resolveLocale(this.getAttribute('locale'));
    this._showDaySep    = this._boolAttr('show-day-separators', true);
    this._showGroupTime = this._boolAttr('show-group-time', false);
    this._bubbleStamps  = this._boolAttr('bubble-timestamps', true);

    // formatters (Intl so Safari respects reader locale)
    this._dayFmt  = new Intl.DateTimeFormat(this._locale, { weekday:'short', year:'numeric', month:'short', day:'numeric' });
    this._timeFmt = new Intl.DateTimeFormat(this._locale, { hour:'2-digit', minute:'2-digit' });

    this._messages = [];

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
        .wrap { max-width: 680px; margin: 0 auto; }
        .day-sep { text-align:center; font-size: .8rem; opacity: .7; margin: 16px 0; }
        .group { display:flex; flex-direction:column; gap:6px; margin: 10px 0 18px; }
        .time { text-align:center; font-size: .75rem; opacity: .6; margin: 6px 0; }
        .row { display:flex; }
        .row.tight { margin-top: -6px; } /* collapse gap between stacked bubbles */
        .me   { justify-content: flex-end; }
        .them { justify-content: flex-start; }

        /* Bubble base */
        .bubble {
          position: relative;          /* for in-bubble timestamp */
          max-width: 80%;
          padding: 10px 12px;
          border-radius: 14px;
          line-height: 1.25;
          word-wrap: break-word;
          box-shadow: 0 1px 1px rgba(0,0,0,.05);
        }

        /* Colors */
        .bubble.them { background:#f1f1f1; color:#111; }
        .bubble.me   { background:rgb(0,121,130); color:#fff; }

        /* Stack roles */
        .bubble.stack { border-radius: 14px; }
        .bubble.end.me   { border-top-right-radius:14px; border-bottom-right-radius:3px; }
        .bubble.end.them { border-top-left-radius:14px;  border-bottom-left-radius:3px; }

        /* In-bubble timestamp (optional) */
        .stamp {
          position: absolute;
          right: 8px;
          bottom: 6px;
          font-size: .7rem;
          opacity: .6;
          white-space: nowrap;
          pointer-events: none;
        }
        /* add bottom padding so stamp doesn’t overlap text */
        .bubble.has-stamp { padding-bottom: 24px; }

        /* Optional name label for group chats */
        .name { font-size: .72rem; opacity: .65; margin: 2px 6px 2px; }
        .name.me { text-align: right; }
      </style>
      <div class="wrap"></div>
    `;
  }

  connectedCallback() {
    // Read inline JSON
    const inline = this.querySelector('script[type="application/json"]');
    if (inline) {
      try {
        const data = JSON.parse(inline.textContent.trim());
        this._messages = Array.isArray(data) ? data : (Array.isArray(data?.messages) ? data.messages : []);
      } catch (e) { console.warn('sms-chat: invalid JSON', e); }
    }
    // Or from data attribute
    if (!this._messages.length && this.hasAttribute('data-messages')) {
      try { this._messages = JSON.parse(this.getAttribute('data-messages') || '[]'); }
      catch (e) { console.warn('sms-chat: invalid data-messages JSON', e); }
    }

    // normalize + sort
    this._messages = this._messages.map(m => ({
      who: (m.who || 'them').toLowerCase() === 'me' ? 'me' : 'them',
      name: (m.name ?? '').toString().trim(),
      text: String(m.text ?? ''),
      time: m.time ? new Date(m.time) : null
    })).sort((a,b)=>(a.time?.getTime()??0)-(b.time?.getTime()??0));

    this.render();
  }

  attributeChangedCallback(name, _oldV, newV) {
    if (name === 'timestamp-format') this._fmt = newV || 'YYYY-MM-DD HH:mm';
    if (name === 'group-by-minutes') this._groupByMinutes = parseInt(newV || '0', 10);
    if (name === 'locale') {
      this._locale = this._resolveLocale(newV);
      this._dayFmt  = new Intl.DateTimeFormat(this._locale, { weekday:'short', year:'numeric', month:'short', day:'numeric' });
      this._timeFmt = new Intl.DateTimeFormat(this._locale, { hour:'2-digit', minute:'2-digit' });
    }
    if (name === 'show-day-separators') this._showDaySep = this._boolAttr('show-day-separators', true);
    if (name === 'show-group-time')    this._showGroupTime = this._boolAttr('show-group-time', false);
    if (name === 'bubble-timestamps')  this._bubbleStamps  = this._boolAttr('bubble-timestamps', true);
    this.render();
  }

  set messages(arr){ this._messages = Array.isArray(arr) ? arr : []; this.render(); }
  get messages(){ return this._messages; }

  render() {
    const root = this.shadowRoot.querySelector('.wrap');
    if (!root) return;
    root.innerHTML = '';

    if (!this._messages.length) {
      root.innerHTML = `<div class="group"><div class="row them"><div class="bubble them">No messages</div></div></div>`;
      return;
    }

    // Build time buckets (by gap from previous message)
    const buckets = [];
    let lastTs = null;
    for (const msg of this._messages) {
      const ts = msg.time?.getTime() ?? 0;
      const gapMin = lastTs == null ? 0 : Math.abs(ts - lastTs) / 60000;
      if (!buckets.length || (this._groupByMinutes > 0 && gapMin > this._groupByMinutes)) {
        buckets.push({ start: ts, msgs: [msg] });
      } else {
        buckets[buckets.length - 1].msgs.push(msg);
      }
      lastTs = ts;
    }

    // Render
    let currentDay = '';
    for (const b of buckets) {
      const dt = new Date(b.start);
      const dayKey = dt.toDateString();

      // Day separator
      if (this._showDaySep && dayKey !== currentDay) {
        currentDay = dayKey;
        root.appendChild(this._el('div', { class: 'day-sep' }, this._dayFmt.format(dt)));
      }

      const groupEl = this._el('div', { class: 'group' });

      // Optional: group time line (usually off if bubble stamps are on)
      if (this._showGroupTime && !this._bubbleStamps) {
        groupEl.appendChild(this._el('div', { class: 'time' }, this._formatTimestamp(dt)));
      }

      // Render runs of same sender (so stacked bubbles group visually)
      let i = 0;
      while (i < b.msgs.length) {
        const first = b.msgs[i];
        const senderKey = first.who === 'me' ? 'me' : (first.name || 'them');
        const senderClass = first.who === 'me' ? 'me' : 'them';
        const showName = senderKey !== 'me' && !!first.name;

        const run = [first]; i++;
        while (i < b.msgs.length) {
          const cur = b.msgs[i];
          const curKey = cur.who === 'me' ? 'me' : (cur.name || 'them');
          if (curKey !== senderKey) break;
          run.push(cur); i++;
        }

        if (showName) groupEl.appendChild(this._el('div', { class: 'name ' + senderClass }, first.name));

        for (let j = 0; j < run.length; j++) {
          const m = run[j];
          const isEnd = j === run.length - 1;
          const bubbleCls = 'bubble ' + senderClass + ' ' + (isEnd ? 'end' : 'stack');
          const rowCls = 'row ' + senderClass + (isEnd ? '' : ' tight');
          const row = this._el('div', { class: rowCls });

          const bubble = this._el('div', { class: bubbleCls + (this._bubbleStamps ? ' has-stamp' : '') , role: 'text' }, m.text);

          // In-bubble small timestamp
          if (this._bubbleStamps && m.time) {
            const stamp = this._el('span', { class: 'stamp', 'aria-hidden':'true' }, this._timeFmt.format(m.time));
            bubble.appendChild(stamp);
          }

          row.appendChild(bubble);
          groupEl.appendChild(row);
        }
      }

      root.appendChild(groupEl);
    }
  }

  /* --- helpers --- */
  _resolveLocale(attr) {
    if (!attr || attr === 'auto') {
      return (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
    }
    return attr;
  }

  _boolAttr(name, defaultVal) {
    const v = this.getAttribute(name);
    if (v === null) return defaultVal;
    return !(v === 'false' || v === '0');
  }

  _formatTimestamp(d){
    // Keep your token formatter for the optional group-time line
    const pad=n=>String(n).padStart(2,'0');
    return (this._fmt||'YYYY-MM-DD HH:mm')
      .replace('YYYY', d.getFullYear())
      .replace('MM', pad(d.getMonth()+1))
      .replace('DD', pad(d.getDate()))
      .replace('HH', pad(d.getHours()))
      .replace('mm', pad(d.getMinutes()));
  }

  _el(tag, attrs={}, text=null){
    const el=document.createElement(tag);
    for (const [k,v] of Object.entries(attrs)) el.setAttribute(k,v);
    if (text!==null) el.textContent=text;
    return el;
  }
}

if (!customElements.get('sms-chat')) customElements.define('sms-chat', SmsChat);
