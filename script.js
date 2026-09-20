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

// ---------- RSVP form -> mailto ----------
const rsvpForm = document.getElementById('rsvpForm');
const RSVP_EMAIL = 'cyberinfo1120@gmail.com';

rsvpForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = rsvpForm.name.value.trim();
  const attending = rsvpForm.attending.value;
  const guests = rsvpForm.guests.value;
  const events = Array.from(rsvpForm.querySelectorAll('input[name="events"]:checked')).map(cb => cb.value);
  const message = rsvpForm.message.value.trim();

  const subject = `RSVP - ${name} (${attending})`;
  const bodyLines = [
    `Name: ${name}`,
    `Response: ${attending}`,
    `Number of Guests: ${guests}`,
    `Attending: ${events.length ? events.join(', ') : 'Not specified'}`,
    message ? `Message: ${message}` : null
  ].filter(Boolean);

  const mailto = `mailto:${RSVP_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
  window.location.href = mailto;
});
