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
        .me   { justify-content: flex-end; }
        .them { justify-content: flex-start; }

        .bubble {
          max-width: 80%;
          padding: 10px 12px;
          border-radius: 18px;
          line-height: 1.25;
          word-wrap: break-word;
          box-shadow: 0 1px 1px rgba(0,0,0,.05);
        }
        /* ✅ fixed colors */
        .bubble.them { background:#f1f1f1; color:#111; border-top-left-radius:6px; }
        .bubble.me   { background:#007aff; color:#fff;  border-top-right-radius:6px; }
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

    // group by exact timestamp or within N minutes
    const groups = [];
    for (const msg of this._messages) {
      const ts = msg.time?.getTime() ?? 0;
      if (!groups.length) { groups.push({ start: ts, msgs: [msg] }); continue; }
      const last = groups[groups.length - 1];
      const diffMin = Math.abs(ts - last.start) / 60000;
      const sameBucket = this._groupByMinutes > 0 ? (diffMin <= this._groupByMinutes) : (ts === last.start);
      sameBucket ? last.msgs.push(msg) : groups.push({ start: ts, msgs: [msg] });
    }

    // render groups
    let currentDay = '';
    for (const g of groups) {
      const dt = new Date(g.start);
      const dayKey = dt.toDateString();
      if (dayKey !== currentDay) {
        currentDay = dayKey;
        root.appendChild(this._el('div', { class: 'day-sep' }, this._formatDay(dt)));
      }
      const groupEl = this._el('div', { class: 'group' });
      groupEl.appendChild(this._el('div', { class: 'time' }, this._formatTimestamp(dt)));

      for (const m of g.msgs) {
        const row = this._el('div', { class: 'row ' + (m.who === 'me' ? 'me' : 'them') });
        row.appendChild(this._el('div', { class: 'bubble ' + (m.who === 'me' ? 'me' : 'them') }, m.text));
        groupEl.appendChild(row);
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