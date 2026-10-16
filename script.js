'use strict';
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let motionPaused = reducedMotion.matches;
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#navigation');
  const closeMenu = () => {
    if (!menu || !nav) return;
    menu.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
    menu.querySelector('span').textContent = '+';
  };
  if (menu && nav) {
    menu.hidden = false;
    menu.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      menu.querySelector('span').textContent = open ? '−' : '+';
    });
    nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
        closeMenu(); menu.focus();
      }
    });
    window.matchMedia('(min-width:521px)').addEventListener('change', closeMenu);
  }
  for (const button of document.querySelectorAll('.print-trigger')) {
    button.hidden = false;
    button.addEventListener('click', () => window.print());
  }
  const copy = document.querySelector('.copy-email');
  const copyStatus = document.querySelector('#copy-status');
  if (copy && copyStatus && window.isSecureContext && navigator.clipboard) {
    copy.hidden = false;
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText('nico@hoammade.de');
        copyStatus.textContent = 'E-Mail-Adresse kopiert.';
      } catch {
        copyStatus.textContent = 'Bitte die E-Mail-Adresse oben markieren und kopieren.';
      }
    });
  }

  // Native dialogs retain keyboard focus, Escape support and a readable no-JS fallback.
  const dialog = document.querySelector('#detail-dialog');
  const dialogBody = dialog?.querySelector('.dialog-body');
  const closeButton = dialog?.querySelector('.dialog-close');
  let dialogTrigger = null;
  let closingTimer = 0;
  const closeDialog = (returnFocus = true) => {
    if (!dialog?.open || closingTimer) return;
    const finish = () => {
      dialog.close();
      dialog.classList.remove('is-closing');
      document.body.classList.remove('dialog-open');
      closingTimer = 0;
      if (returnFocus) dialogTrigger?.focus({preventScroll:true});
    };
    if (motionPaused || reducedMotion.matches) finish();
    else { dialog.classList.add('is-closing'); closingTimer = window.setTimeout(finish, 190); }
  };
  if (dialog && typeof dialog.showModal === 'function') {
    for (const details of document.querySelectorAll('details[data-dialog]')) {
      const summary = details.querySelector('summary');
      summary.setAttribute('aria-haspopup', 'dialog');
      summary.addEventListener('click', event => {
        event.preventDefault();
        closeMenu();
        dialogTrigger = summary;
        const content = details.querySelector('.detail-content').cloneNode(true);
        content.querySelector('h2').id = 'dialog-title';
        dialogBody.replaceChildren(content);
        document.body.classList.add('dialog-open');
        dialog.showModal();
        dialog.scrollTop = 0;
        closeButton.focus({preventScroll:true});
      });
    }
    closeButton.addEventListener('click', () => closeDialog());
    dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(); });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeDialog();
    });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('dialog-open');
      dialog.classList.remove('is-closing');
      window.clearTimeout(closingTimer); closingTimer = 0;
    });
    dialogBody.addEventListener('click', event => {
      const link = event.target.closest('[data-dialog-link]');
      if (!link) return;
      event.preventDefault();
      dialog.close();
      document.querySelector(link.getAttribute('href'))?.scrollIntoView({behavior:motionPaused?'instant':'smooth'});
    });
  }

  // Only below-the-fold content is revealed; readable content never depends on an animation.
  let revealObserver;
  const revealAll = () => {
    document.querySelectorAll('.is-awaiting').forEach(item => item.classList.remove('is-awaiting'));
    revealObserver?.disconnect();
  };
  if ('IntersectionObserver' in window && !motionPaused) {
    root.classList.add('motion-enabled');
    revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) { entry.target.classList.remove('is-awaiting'); revealObserver.unobserve(entry.target); }
      }
    }, {threshold:.06, rootMargin:'0px 0px 20px 0px'});
    document.querySelectorAll('.reveal').forEach(item => {
      if (item.getBoundingClientRect().top > window.innerHeight - 20) {
        item.classList.add('is-awaiting'); revealObserver.observe(item);
      }
    });
    document.addEventListener('focusin', event => event.target.closest('.is-awaiting')?.classList.remove('is-awaiting'));
    window.addEventListener('beforeprint', revealAll);
  }
  if ('IntersectionObserver' in window && nav) {
    const links = [...nav.querySelectorAll('a[href^="#"]')];
    const sectionObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        links.forEach(link => {
          if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }
    }, {rootMargin:'-12% 0px -55% 0px',threshold:0});
    links.forEach(link => { const section = document.querySelector(link.hash); if (section) sectionObserver.observe(section); });
  }
  const progress = document.querySelector('.reading-progress');
  let progressFrame = 0;
  const updateProgress = () => {
    progressFrame = 0;
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = `scaleX(${distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0})`;
  };
  window.addEventListener('scroll', () => { if (!progressFrame) progressFrame = requestAnimationFrame(updateProgress); }, {passive:true});
  updateProgress();

  const demo = document.querySelector('.project-demo');
  const routeButton = document.querySelector('.route-play');
  let routeTimer = 0;
  if (demo && routeButton) {
    routeButton.hidden = false;
    routeButton.addEventListener('click', () => {
      window.clearTimeout(routeTimer);
      demo.classList.remove('is-playing');
      if (motionPaused) {
        routeButton.innerHTML = '<span aria-hidden="true">✓</span> Route angezeigt';
        routeTimer = window.setTimeout(() => { routeButton.innerHTML = '<span aria-hidden="true">▶</span> Route anzeigen'; }, 2000);
        return;
      }
      void demo.offsetWidth;
      demo.classList.add('is-playing');
      routeButton.innerHTML = '<span aria-hidden="true">↻</span> Neu starten';
      routeTimer = window.setTimeout(() => {
        demo.classList.remove('is-playing');
        routeButton.innerHTML = '<span aria-hidden="true">▶</span> Route abspielen';
      }, 3700);
    });
  }

  // A lightweight, local motion scene. No video downloads, analytics or external dependencies.
  const canvas = document.querySelector('#idea-canvas');
  const experience = document.querySelector('.hero-experience');
  const sceneButtons = [...document.querySelectorAll('[data-scene-choice]')];
  const pauseButton = document.querySelector('.motion-toggle');
  const footerPause = document.querySelector('.footer-motion');
  const sceneContent = {
    verstehen:{title:'Alles beginnt<br>mit einer Frage.',kicker:'VERBINDUNGEN ENTDECKEN',index:'01 / 03',mode:0},
    pruefen:{title:'Aus vielen Details<br>wird ein klares Bild.',kicker:'STRUKTUR ERKENNEN',index:'02 / 03',mode:1},
    umsetzen:{title:'Gute Ideen<br>bleiben in Bewegung.',kicker:'MÖGLICHKEITEN ENTWICKELN',index:'03 / 03',mode:2}
  };
  let context;
  try { context = canvas?.getContext('2d', {alpha:true}); } catch { context = null; }
  let sceneMode = 0, blend = 0, width = 0, height = 0, frame = 0, lastFrame = 0, elapsed = 0;
  let sceneVisible = true, tiltX = 0, tiltY = 0, targetX = 0, targetY = 0;
  const startScene = () => {
    if (!context || !width) return;
    cancelAnimationFrame(frame); frame = 0;
    if (!motionPaused && sceneVisible && !document.hidden) { lastFrame = 0; frame = requestAnimationFrame(drawScene); }
    else drawScene(0, true);
  };
  function drawScene(time, still = false) {
    frame = 0;
    if (!context || !width) return;
    if (!still && (motionPaused || !sceneVisible || document.hidden)) return;
    if (!still && lastFrame && time - lastFrame < 32) { frame = requestAnimationFrame(drawScene); return; }
    const dt = !lastFrame || still ? 0 : Math.min(60, time - lastFrame);
    lastFrame = time;
    elapsed += dt / 1000;
    blend += (sceneMode - blend) * (still ? 1 : .07);
    tiltX += (targetX - tiltX) * .07; tiltY += (targetY - tiltY) * .07;
    context.clearRect(0, 0, width, height);
    const cx = width * .5, cy = height * .38, scale = Math.min(width * .30, height * .25);
    const ambient = context.createRadialGradient(cx, cy, 5, cx, cy, scale * 1.85);
    ambient.addColorStop(0,'rgba(185,220,132,.11)');ambient.addColorStop(.55,'rgba(136,184,108,.04)');ambient.addColorStop(1,'rgba(136,184,108,0)');
    context.fillStyle=ambient;context.fillRect(0,0,width,height);
    const rotation = elapsed * .14 + tiltX * .3;
    const count = width < 400 ? 240 : 420;
    const points = [];
    for (let i=0; i<count; i++) {
      const a = i / count * Math.PI * 2;
      const b = i * 2.399963;
      const organic = [(1 + .32*Math.cos(b))*Math.cos(a), (1 + .32*Math.cos(b))*Math.sin(a), .32*Math.sin(b)];
      const cols = width < 400 ? 16 : 21;
      const grid = [((i%cols)/(cols-1)-.5)*2.2, (Math.floor(i/cols)/(Math.ceil(count/cols)-1)-.5)*1.65, Math.sin(a*4+elapsed*.35)*.1];
      const sphereY = 1 - 2*(i+.5)/count;
      const radius = Math.sqrt(1-sphereY*sphereY);
      const sphere = [Math.cos(b)*radius*1.12, sphereY*1.12, Math.sin(b)*radius*1.12];
      let x,y,z;
      if (blend < 1) { x=organic[0]*(1-blend)+grid[0]*blend;y=organic[1]*(1-blend)+grid[1]*blend;z=organic[2]*(1-blend)+grid[2]*blend; }
      else { const t=blend-1;x=grid[0]*(1-t)+sphere[0]*t;y=grid[1]*(1-t)+sphere[1]*t;z=grid[2]*(1-t)+sphere[2]*t; }
      const angle = rotation * (1 - .8*Math.max(0,1-Math.abs(blend-1)));
      const rotatedX = x*Math.cos(angle)+z*Math.sin(angle);
      const rotatedZ = -x*Math.sin(angle)+z*Math.cos(angle);
      const pitch = -.35 + tiltY*.28;
      const rotatedY = y*Math.cos(pitch)-rotatedZ*Math.sin(pitch);
      const depth = y*Math.sin(pitch)+rotatedZ*Math.cos(pitch);
      const perspective = 3.6/(3.6-depth);
      points.push({x:cx+rotatedX*scale*perspective,y:cy+rotatedY*scale*perspective,z:depth,r:(.8+(depth+1.5)*.55)*perspective,index:i});
    }
    // Fine connections make the scene read as a continuous form, not unrelated particles.
    context.lineWidth=.55;
    for(let i=0;i<points.length;i++){
      const p=points[i],q=points[(i+13)%points.length];
      const d=Math.hypot(p.x-q.x,p.y-q.y);
      if(d<scale*.34){context.strokeStyle=`rgba(186,220,147,${Math.max(.025,.11-(d/scale)*.18)})`;context.beginPath();context.moveTo(p.x,p.y);context.lineTo(q.x,q.y);context.stroke();}
    }
    points.sort((a,b)=>a.z-b.z);
    for(const point of points){
      const alpha=Math.max(.15,Math.min(.95,.48+point.z*.3));
      context.fillStyle=`rgba(${point.z>.3?'219,241,185':'146,183,121'},${alpha})`;
      context.beginPath();context.arc(point.x,point.y,point.r,0,Math.PI*2);context.fill();
    }
    if (!still) frame=requestAnimationFrame(drawScene);
  }
  if (context && experience) {
    experience.classList.add('canvas-ready');
    experience.querySelector('.scene-controls').hidden = false;
    const resizeScene = () => {
      const rect = canvas.getBoundingClientRect();width=rect.width;height=rect.height;
      const dpr=Math.min(window.devicePixelRatio||1,1.5);
      canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);context.setTransform(dpr,0,0,dpr,0,0);
      startScene();
    };
    if ('ResizeObserver' in window) new ResizeObserver(resizeScene).observe(canvas); else window.addEventListener('resize',resizeScene);
    resizeScene();
    if ('IntersectionObserver' in window) new IntersectionObserver(entries => {sceneVisible=entries[0].isIntersecting;startScene();},{threshold:.05}).observe(experience);
    document.addEventListener('visibilitychange',startScene);
    if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
      experience.addEventListener('pointermove',event=>{const rect=experience.getBoundingClientRect();targetX=(event.clientX-rect.left)/rect.width-.5;targetY=(event.clientY-rect.top)/rect.height-.5;},{passive:true});
      experience.addEventListener('pointerleave',()=>{targetX=0;targetY=0;});
    }
    sceneButtons.forEach(button => button.addEventListener('click',()=>{
      const selected=button.dataset.sceneChoice;const content=sceneContent[selected];
      sceneMode=content.mode;experience.dataset.scene=selected;
      experience.querySelector('.scene-title').innerHTML=content.title;
      experience.querySelector('.scene-kicker').textContent=content.kicker;
      experience.querySelector('.scene-index').textContent=content.index;
      sceneButtons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
      startScene();
    }));
  }
  const syncMotion = () => {
    root.classList.toggle('motion-paused',motionPaused);
    if (motionPaused) {
      revealAll();demo?.classList.remove('is-playing');window.clearTimeout(routeTimer);
      if (routeButton) routeButton.innerHTML='<span aria-hidden="true">▶</span> Route anzeigen';
    } else if (routeButton) routeButton.innerHTML='<span aria-hidden="true">▶</span> Route abspielen';
    if (pauseButton) {
      pauseButton.setAttribute('aria-pressed',String(motionPaused));
      pauseButton.setAttribute('aria-label',motionPaused?'Animationen abspielen':'Animationen pausieren');
      pauseButton.querySelector('span').textContent=motionPaused?'▶':'Ⅱ';
    }
    if (footerPause) {footerPause.hidden=false;footerPause.textContent=motionPaused?'Animationen abspielen':'Animationen pausieren';}
    startScene();
  };
  pauseButton?.addEventListener('click',()=>{motionPaused=!motionPaused;syncMotion();});
  footerPause?.addEventListener('click',()=>{motionPaused=!motionPaused;syncMotion();});
  reducedMotion.addEventListener('change',()=>{motionPaused=reducedMotion.matches;syncMotion();});
  syncMotion();
})();
