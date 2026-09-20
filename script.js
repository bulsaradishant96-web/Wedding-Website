// ---------- Add to Calendar: .ics on iOS, Google Calendar everywhere else ----------
function isIOS(){
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function icsEscape(str){
  return (str || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function icsTimestamp(date){
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function buildICS({ title, start, end, details, location }){
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dishant & Nirshita Wedding//EN',
    'BEGIN:VEVENT',
    'UID:' + Date.now() + '-' + Math.random().toString(36).slice(2) + '@ngdb.me',
    'DTSTAMP:' + icsTimestamp(new Date()),
    'DTSTART:' + start,
    'DTEND:' + end,
    'SUMMARY:' + icsEscape(title),
    details ? 'DESCRIPTION:' + icsEscape(details) : '',
    location ? 'LOCATION:' + icsEscape(location) : '',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');
}

function toBase64Utf8(str){
  return btoa(unescape(encodeURIComponent(str)));
}

if (isIOS()){
  document.querySelectorAll('a.add-to-cal').forEach(link => {
    const url = new URL(link.href);
    const params = url.searchParams;
    const [start, end] = (params.get('dates') || '').split('/');

    const ics = buildICS({
      title: params.get('text'),
      start,
      end,
      details: params.get('details'),
      location: params.get('location')
    });

    // Rewrite the link itself (rather than intercepting the click) so Safari
    // treats this as a normal tap-to-open-file, not a script-driven redirect.
    link.setAttribute('href', 'data:text/calendar;charset=utf-8;base64,' + toBase64Utf8(ics));
    link.removeAttribute('target');
  });
}

// ---------- Nav shrink on scroll ----------
const nav = document.getElementById('siteNav');
function updateNav(){
  if (window.scrollY > 40) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
}
updateNav();
window.addEventListener('scroll', updateNav, { passive: true });

// ---------- Crossfade background photos as you scroll ----------
const bg1 = document.getElementById('bg1');
const bg2 = document.getElementById('bg2');
let ticking = false;

function updateBackgrounds(){
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? scrollTop / docHeight : 0;

  // Crossfade: bg1 dominant near top, bg2 dominant by ~2/3 down, back toward bg1 feel at footer
  // Simple smooth two-stage fade keyed to scroll progress.
  const fadeIn = Math.min(Math.max((progress - 0.12) / 0.35, 0), 1); // bg2 fades in
  bg2.style.opacity = fadeIn;
  bg1.style.opacity = 1 - fadeIn * 0.85;

  ticking = false;
}

window.addEventListener('scroll', () => {
  if (!ticking){
    window.requestAnimationFrame(updateBackgrounds);
    ticking = true;
  }
}, { passive: true });
updateBackgrounds();

// ---------- Reveal on scroll ----------
const revealEls = document.querySelectorAll('[data-reveal]');
if ('IntersectionObserver' in window){
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  revealEls.forEach(el => io.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('is-visible'));
}

// ---------- Countdown to the wedding day ----------
const WEDDING_DATE = new Date('2027-02-12T00:00:00+05:30');
const cdDays = document.getElementById('cdDays');
const cdHours = document.getElementById('cdHours');
const cdMins = document.getElementById('cdMins');
const cdSecs = document.getElementById('cdSecs');
const countdownGrid = document.getElementById('countdownGrid');
const countdownArrived = document.getElementById('countdownArrived');

function pad2(n){ return String(n).padStart(2, '0'); }

let countdownTimer = null;

function updateCountdown(){
  const diff = WEDDING_DATE.getTime() - Date.now();

  if (diff <= 0){
    countdownGrid.hidden = true;
    countdownArrived.hidden = false;
    if (countdownTimer) clearInterval(countdownTimer);
    return;
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  cdDays.textContent = pad2(days);
  cdHours.textContent = pad2(hours);
  cdMins.textContent = pad2(mins);
  cdSecs.textContent = pad2(secs);
}

updateCountdown();
countdownTimer = setInterval(updateCountdown, 1000);

// ---------- RSVP form -> Google Apps Script Web App ----------
const rsvpForm = document.getElementById('rsvpForm');
const submitBtn = document.getElementById('submitBtn');
const rsvpSuccess = document.getElementById('rsvpSuccess');
const rsvpError = document.getElementById('rsvpError');

const RSVP_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyYRPZlLTLZZlsQ1ryAtvw7D5foe_7l9KLW83EziEtGPBOecjNsJOXpkxttlv5BJbvt/exec';

rsvpForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const payload = {
    name: rsvpForm.name.value.trim(),
    email: rsvpForm.email.value.trim(),
    attending: rsvpForm.attending.value,
    guests: rsvpForm.guests.value,
    events: Array.from(rsvpForm.querySelectorAll('input[name="events"]:checked')).map(cb => cb.value),
    message: rsvpForm.message.value.trim()
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';
  rsvpError.hidden = true;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  fetch(RSVP_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    signal: controller.signal
  })
    .then(res => {
      clearTimeout(timeout);
      return res.json();
    })
    .then(data => {
      if (data.result !== 'success') throw new Error(data.message || 'Unknown error');
      rsvpForm.hidden = true;
      rsvpSuccess.hidden = false;
    })
    .catch(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send RSVP';
      rsvpError.hidden = false;
    });
});
