/* SpotlightCard adapted for this static site from React Bits, David Haz.
 * https://github.com/DavidHDev/react-bits — see REACT-BITS-LICENSE.txt. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.repair-card').forEach(card => {
    card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
      card.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
    }, {passive:true});
  });
  if(reduced) return;
  document.querySelectorAll('.hero h1').forEach(title => {
    title.animate([{opacity:0,filter:'blur(12px)',transform:'translateY(28px)'},{opacity:1,filter:'blur(0)',transform:'translateY(0)'}],{duration:1100,easing:'cubic-bezier(.2,.7,.2,1)'});
  });
})();
