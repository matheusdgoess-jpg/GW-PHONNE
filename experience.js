/* SpotlightCard adapted for this static site from React Bits, David Haz.
 * https://github.com/DavidHDev/react-bits — see REACT-BITS-LICENSE.txt. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.repair-card, .tracking-card, .contact-panel, .process-steps article, .proof-strip article').forEach(card => {
    card.classList.add('light-surface');
    card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
      card.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
    }, {passive:true});
  });
  if(reduced) return;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const sections = document.querySelectorAll('main > section');
  const ambientObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.target.classList.toggle('motion-in-view', entry.isIntersecting));
  }, {rootMargin:'80px'});
  sections.forEach(section => {
    section.classList.add('motion-section');
    const light = document.createElement('div'); light.className='section-light'; light.setAttribute('aria-hidden','true'); section.prepend(light);
    ambientObserver.observe(section);
  });
  const aurora = document.createElement('div');
  aurora.className = 'img-aurora';
  aurora.setAttribute('aria-hidden', 'true');
  document.querySelector('.hero')?.prepend(aurora);
  const progress = document.createElement('div');
  progress.className = 'reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);
  let scrollPending = false;
  const updateScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    document.querySelector('.site-header')?.classList.toggle('header-scrolled', scrollY > 40);
    scrollPending = false;
  };
  addEventListener('scroll', () => {
    if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateScroll); }
  }, {passive:true});
  addEventListener('resize', updateScroll, {passive:true});
  updateScroll();
  if (finePointer) {
    document.querySelectorAll('.repair-card').forEach(card => {
      card.addEventListener('pointermove', event => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--tilt-x', `${-(event.clientY-r.top-r.height/2)/r.height*7}deg`);
        card.style.setProperty('--tilt-y', `${(event.clientX-r.left-r.width/2)/r.width*7}deg`);
      }, {passive:true});
      card.addEventListener('pointerleave', () => {card.style.setProperty('--tilt-x','0deg');card.style.setProperty('--tilt-y','0deg');});
    });
    document.querySelectorAll('.button:not([type="submit"]), .contact-main, .contact-secondary, .text-link').forEach(button => {
      button.addEventListener('pointermove', event => {
        const r=button.getBoundingClientRect();
        button.style.translate=`${(event.clientX-r.left-r.width/2)*.06}px ${(event.clientY-r.top-r.height/2)*.1}px`;
      }, {passive:true});
      button.addEventListener('pointerleave',()=>{button.style.translate='0px 0px';});
    });
  }
  if ('IntersectionObserver' in window) {
    const headingObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if(!entry.isIntersecting) return;
        entry.target.querySelectorAll('.motion-word').forEach((word,index) => {
          word.animate([{opacity:0,transform:'translateY(22px)',filter:'blur(5px)'},{opacity:1,transform:'translateY(0)',filter:'blur(0)'}],{duration:650,delay:index*55,easing:'cubic-bezier(.2,.75,.2,1)',fill:'backwards'});
        });
        headingObserver.unobserve(entry.target);
      });
    },{threshold:.5});
    document.querySelectorAll('main h2').forEach(heading => {
      const walker=document.createTreeWalker(heading,NodeFilter.SHOW_TEXT);
      const nodes=[];
      while(walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(node=>{
        const fragment=document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(part=>{
          if(!part.trim()) {fragment.append(document.createTextNode(part));return;}
          const word=document.createElement('span'); word.className='motion-word';word.textContent=part;fragment.append(word);
        });
        node.replaceWith(fragment);
      });
      headingObserver.observe(heading);
    });
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if(!entry.isIntersecting) return;
        const element=entry.target;
        element.animate([
          {opacity:0,transform:'translateY(30px)',filter:'blur(5px)'},
          {opacity:1,transform:'translateY(0)',filter:'blur(0)'}
        ], {duration:750,delay:Number(element.dataset.motionDelay || 0),easing:'cubic-bezier(.2,.75,.2,1)',fill:'backwards'});
        observer.unobserve(element);
      });
    }, {threshold:.12});
    document.querySelectorAll('.repair-grid, .process-steps, .proof-strip').forEach(group => {
      [...group.children].filter(element=>!element.hasAttribute('aria-hidden')).forEach((element,index) => {element.dataset.motionDelay=String((index%3)*90);observer.observe(element);});
    });
    document.querySelectorAll('.tracking-card, .contact-panel, .manifesto-logo, .manifesto blockquote, footer > :not(.section-light)').forEach(element=>observer.observe(element));
    const resultGrid=document.getElementById('public-results-grid');
    if(resultGrid) new MutationObserver(()=>resultGrid.querySelectorAll('.result-card:not([data-motion-ready])').forEach((card,index)=>{
      card.dataset.motionReady='true'; card.dataset.motionDelay=String((index%3)*90); observer.observe(card);
    })).observe(resultGrid,{childList:true});
  }
  document.querySelectorAll('.hero h1').forEach(title => {
    title.animate([{opacity:0,filter:'blur(12px)',transform:'translateY(28px)'},{opacity:1,filter:'blur(0)',transform:'translateY(0)'}],{duration:1100,easing:'cubic-bezier(.2,.7,.2,1)'});
  });
})();
