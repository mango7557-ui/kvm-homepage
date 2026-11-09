/* KVM motion orchestration.
   Rules applied (ui-animation / motion-design skills):
   - Scroll reveals: three chosen moments only, reveal once, heading leads, never above the fold.
   - Calculator result: odometer-style pop on change (user-driven number = the one memorable moment).
   - Bars grow once when first seen (explain magnitude).
   - Everything else is CSS transitions reacting to user input. */
(function(){
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var io='IntersectionObserver' in window;

  /* 1. Three reveal moments: 성공사례 머리글, 계산기 머리글, 상담 머리글. Heading → lede → first block. */
  if(io && !reduce){
    var moments=['#cases','#simulator','#contact'];
    var targets=[];
    moments.forEach(function(sel){
      var sec=document.querySelector(sel);if(!sec)return;
      if(sec.getBoundingClientRect().top<innerHeight)return; /* never above the fold */
      var h=sec.querySelector('h2.sec'),l=sec.querySelector('.lede'),b=sec.querySelector('.cr-viewport,.sim-box,.cx-form');
      [h,l,b].forEach(function(el,i){if(el){el.classList.add('m-reveal');el.setAttribute('data-m-order',String(i+1));targets.push(el);}});
    });
    var rio=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add('in');rio.unobserve(en.target);}})},{rootMargin:'0px 0px -12% 0px'});
    targets.forEach(function(t){rio.observe(t)});
    /* Deep links: reveal instantly so nothing waits */
    var revealHash=function(){try{var t=location.hash&&location.hash!=='#top'&&document.querySelector(location.hash);if(t){var sec=t.closest('section')||t;sec.querySelectorAll('.m-reveal').forEach(function(e){e.style.transitionDelay='0ms';e.classList.add('in');rio.unobserve(e);});}}catch(e){}};
    addEventListener('hashchange',revealHash);revealHash();

    /* 2. Bars grow once */
    var bars=document.querySelectorAll('.cmp,.vs-bars');
    var bio=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add('in');bio.unobserve(en.target);}})},{rootMargin:'0px 0px -15% 0px'});
    bars.forEach(function(b){bio.observe(b)});
  }else{
    document.querySelectorAll('.cmp,.vs-bars').forEach(function(b){b.classList.add('in')});
  }

  /* 3. Calculator result: pop on value change, flash supporting numbers, soften text swap */
  var out=document.getElementById('oRefund');
  if(out && !reduce){
    var last=out.textContent;
    var list=document.querySelectorAll('.out-list b');
    var txt=document.getElementById('oTxt');
    var mo=new MutationObserver(function(){
      if(out.textContent===last)return;last=out.textContent;
      out.classList.remove('m-pop');void out.offsetWidth;out.classList.add('m-pop');
      list.forEach(function(b){b.classList.add('m-flash');setTimeout(function(){b.classList.remove('m-flash')},260)});
      if(txt){txt.classList.add('m-swap');setTimeout(function(){txt.classList.remove('m-swap')},140)}
    });
    mo.observe(out,{childList:true,characterData:true,subtree:true});
  }

  /* 4. Pause ambient loops off-screen */
  if(io){
    var amb=document.querySelectorAll('.sim-out');
    var aio=new IntersectionObserver(function(es){es.forEach(function(en){en.target.style.setProperty('--m-amb-state',en.isIntersecting?'running':'paused');en.target.classList.toggle('m-offscreen',!en.isIntersecting)})});
    amb.forEach(function(a){aio.observe(a)});
  }
})();
