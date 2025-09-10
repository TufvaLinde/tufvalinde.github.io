class SmsChat extends HTMLElement {
  static get observedAttributes() { return ['timestamp-format','group-by-minutes']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._fmt = this.getAttribute('timestamp-format') || 'YYYY-MM-DD HH:mm';
    this._groupByMinutes = parseInt(this.getAttribute('group-by-minutes') || '0', 10);
    this._messages = [];

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
        .wrap { max-width: 680px; margin: 0 auto; }
        .day-sep { text-align:center; font-size: .8rem; opacity: .7; margin: 16px 0; }
        .group { display:flex; flex-direction:column; gap:6px; margin: 10px 0 18px; }
        .time { text-align:center; font-size: .75rem; opacity: .6; margin-bottom: 6px; }
        .row { display:flex; }
        .row.tight { margin-top: -6px; }   /* <-- cancel part of the 6px gap so net spacing ~2px */
        .me   { justify-content: flex-end; }
        .them { justify-content: flex-start; }

        /* Bubble base */
        .bubble {
          max-width: 80%;
          padding: 10px 12px;
          border-radius: 14px;
          line-height: 1.25;
          word-wrap: break-word;
          box-shadow: 0 1px 1px rgba(0,0,0,.05);
        }

        /* Colors */
        .bubble.them { background:#f1f1f1; color:#111; }
        .bubble.me   { background:rgb(0, 121, 130); color:#fff; }

        /* Stack roles */
        .bubble.stack { border-radius: 14px; }     /* middle/upper bubbles */
        .bubble.end.me   { border-top-right-radius:14px; border-bottom-right-radius:8px; }
        .bubble.end.them { border-top-left-radius:14px;  border-bottom-left-radius:8px; }

        /* Optional name label */
        .name { font-size: .72rem; opacity: .65; margin: 2px 6px 2px; }
        .name.me { text-align: right; }
      </style>
      <div class="wrap"></div>
    `;
  }

  connectedCallback() {
    // inline JSON
    const inline = this.querySelector('script[type="application/json"]');
    if (inline) {
      try {
        const data = JSON.parse(inline.textContent.trim());
        this._messages = Array.isArray(data) ? data : (Array.isArray(data?.messages) ? data.messages : []);
      } catch (e) { console.warn('sms-chat: invalid JSON', e); }
    }
    // or data-messages attr
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

    // time buckets (compare to previous message)
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

    // render
    let currentDay = '';
    for (const b of buckets) {
      const dt = new Date(b.start);
      const dayKey = dt.toDateString();
      if (dayKey !== currentDay) {
        currentDay = dayKey;
        root.appendChild(this._el('div', { class: 'day-sep' }, this._formatDay(dt)));
      }
      const groupEl = this._el('div', { class: 'group' });
      groupEl.appendChild(this._el('div', { class: 'time' }, this._formatTimestamp(dt)));

      // runs by identity
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

          // 👇 add 'tight' to non-last rows to reduce spacing (works with gap)
          const row = this._el('div', { class: 'row ' + senderClass + (isEnd ? '' : ' tight') });
          row.appendChild(this._el('div', { class: bubbleCls, role: 'text' }, m.text));
          groupEl.appendChild(row);
        }
      }

      root.appendChild(groupEl);
    }
  }

  _formatTimestamp(d){
    const pad=n=>String(n).padStart(2,'0');
    return (this._fmt||'YYYY-MM-DD HH:mm')
      .replace('YYYY', d.getFullYear())
      .replace('MM', pad(d.getMonth()+1))
      .replace('DD', pad(d.getDate()))
      .replace('HH', pad(d.getHours()))
      .replace('mm', pad(d.getMinutes()));
  }
  _formatDay(d){
    try { return d.toLocaleDateString(undefined,{weekday:'short',year:'numeric',month:'short',day:'numeric'}); }
    catch { return d.toDateString(); }
  }
  _el(tag, attrs={}, text=null){
    const el=document.createElement(tag);
    for (const [k,v] of Object.entries(attrs)) el.setAttribute(k,v);
    if (text!==null) el.textContent=text;
    return el;
  }
}
if (!customElements.get('sms-chat')) customElements.define('sms-chat', SmsChat);