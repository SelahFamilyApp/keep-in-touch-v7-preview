/* Keep in Touch — four approved premium campaign compositions. No image generation. */
(()=>{
  'use strict';
  const S=window.KIT;
  if(!S)return;
  const formats={
    winter:{
      image:'winter',heading:['هدايا شتاء','تدفّي القلوب…'],subtitle:'من إسكندرية… هدايا مختارة تدفّي الأيام الباردة وتقرّب القلوب.',
      cta:'اكتشف هدايا الشتاء',symbol:'❄',editorial:'من إسكندرية إلى لحظات دافئة',
      note:'دفا المشاعر في كل هدية',accent:'COZY WINTER EDIT',label:'الشتا',
    },
    valentine:{
      image:'valentine',heading:['عيد الحب',''],subtitle:'هدايا بتعبّر عن الحب بأجمل التفاصيل… وبالطريقة اللي تشبه كل حكاية.',
      cta:'اكتشف هدايا الحب',symbol:'♡',editorial:'من إسكندرية إلى أغلى القلوب',
      note:'التفاصيل الصغيرة هي اللي بتفرق',accent:'LOVE, BEAUTIFULLY SAID',label:'عيد الحب',
    },
    ramadan:{
      image:'ramadan',heading:['رمضان كريم',''],subtitle:'في شهر الكرم واللمة… هدايا تختصر المودة وتشارك أجمل اللحظات.',
      cta:'اكتشف هدايا رمضان',symbol:'☪',editorial:'من إسكندرية إلى موائد رمضان',
      note:'بهجة اللمة والكرم',accent:'RAMADAN GIFT ATELIER',label:'رمضان',
    },
    'sham-nessim':{
      image:'sham-el-nessim',heading:['شم النسيم',''],subtitle:'نسمات ربيع وألوان وزهور… هدايا تفرّح كل اللي بتحبهم.',
      cta:'اكتشف هدايا الربيع',symbol:'✿',editorial:'من إسكندرية إلى لحظات الربيع',
      note:'نسمات البهجة في كل تفصيلة',accent:'SPRING BY THE SEA',label:'شم النسيم',
    },
  };
  const q=x=>document.querySelector(x);
  const heading=q('#campaignHeading'),subtitle=q('#campaignSubheading'),motif=q('#campaignMotif');
  const mainImage=q('#campaignSceneImage'),editorial=q('#campaignEditorial');
  const categoryImgs=[...document.querySelectorAll('.real-categories .photo-category-tile img')];
  const categoryTitle=q('#categoryTitle'),shopTitle=q('#shopTitle');
  const shopLead=q('.real-categories .section-lead');
  const heroPrimary=q('.hero.hero-campaign .hero-actions a.btn');
  const originals={
    pageTitle:document.title,
    categoryTitle:categoryTitle?.innerHTML,shopTitle:shopTitle?.innerHTML,
    shopLead:shopLead?.textContent,heroPrimary:heroPrimary?.innerHTML,
    categoryImages:categoryImgs.map(im=>({src:im.getAttribute('src'),alt:im.getAttribute('alt')||''})),
  };
  function applyCampaign(){
    const theme=S.getTheme();
    const campaign=formats[theme];
    if(!campaign){
      document.title=originals.pageTitle;
      delete document.documentElement.dataset.campaign;
      if(categoryTitle)categoryTitle.innerHTML=originals.categoryTitle;
      if(shopTitle)shopTitle.innerHTML=originals.shopTitle;
      if(shopLead)shopLead.textContent=originals.shopLead;
      if(heroPrimary)heroPrimary.innerHTML=originals.heroPrimary;
      categoryImgs.forEach((im,i)=>{
        if(originals.categoryImages[i]){im.src=originals.categoryImages[i].src;im.alt=originals.categoryImages[i].alt;}
      });
      return;
    }
    document.documentElement.dataset.campaign=theme;
    if(mainImage){
      const url='/keep-in-touch-v7-preview/assets/campaign/'+campaign.image+'-hero.webp';
      if(mainImage.getAttribute('src')!==url)mainImage.src=url;
      mainImage.alt='مشهد فني للموسم من الصورة المرجعية المعتمدة: '+campaign.label+' — مش صورة صنف للبيع';
    }
    if(heading)heading.innerHTML='<span>'+campaign.heading[0]+'</span><span>'+campaign.heading[1]+'</span>';
    if(subtitle)subtitle.textContent=campaign.subtitle;
    if(motif)motif.textContent=campaign.symbol;
    if(categoryTitle)categoryTitle.innerHTML='تسوّق حسب <em>الفئة</em>';
    if(shopTitle)shopTitle.innerHTML='مختاراتنا <em>المميزة</em>';
    if(shopLead)shopLead.textContent='صور الأجواء الموسمية للتصميم فقط، وصور منتجات المحل الفعلية موجودة في الكتالوج.';
    if(heroPrimary)heroPrimary.innerHTML='<span aria-hidden="true">♧</span> '+campaign.cta;
    categoryImgs.forEach((im,i)=>{
      im.src='/keep-in-touch-v7-preview/assets/campaign/'+campaign.image+'-category-'+String(i+1).padStart(2,'0')+'.webp';
      im.alt='تفصيلة فنية موسمية توضيحية: '+campaign.label+'؛ افتح القسم لاستعراض الصور الأصلية للمنتجات';
    });
    if(editorial){
      editorial.querySelector('.campaign-editorial-icon').textContent=campaign.symbol;
      editorial.querySelector('strong').textContent=campaign.editorial;
      editorial.querySelector('p').textContent=campaign.note;
      editorial.querySelector('small').textContent=campaign.accent;
    }
    document.title='Keep in Touch | '+campaign.label+' · The Art of Giving';
  }
  function featureChoices(){
    const quick=q('#seasonQuickChoices');
    if(!quick)return;
    ['sham-nessim','ramadan','valentine','winter'].forEach(id=>{
      const choice=quick.querySelector('[data-season="'+id+'"]');
      if(choice)quick.prepend(choice);
    });
    const chosen=q('#seasonAllChoices');
    if(chosen){
      ['sham-nessim','ramadan','valentine','winter'].forEach(id=>{
        const choice=chosen.querySelector('[data-season="'+id+'"]');
        if(choice)chosen.prepend(choice);
      });
    }
    // Keep the four approved campaigns the first visible options on small screens.
    const current=quick.querySelector('[data-season="'+S.getTheme()+'"]');
    if(current)current.scrollIntoView({block:'nearest',inline:'nearest'});
  }
  // Migrate only a default classic demo to the more evocative Winter design once.
  // User-selected seasonal preferences are left intact.
  const debut='kit:signature-campaigns-v1';
  try{
    if(!localStorage.getItem(debut)){
      localStorage.setItem(debut,'1');
      if(S.getTheme()==='classic')S.setTheme('winter');
    }
  }catch{}
  function centerMobileChoice(){
    if(window.innerWidth>620)return;
    const quick=q('#seasonQuickChoices');
    const option=quick?.querySelector('[data-season="'+S.getTheme()+'"]');
    if(!option)return;
    const rect=quick.getBoundingClientRect();
    if(rect.top<window.innerHeight&&rect.bottom>0)option.scrollIntoView({block:'nearest',inline:'center',behavior:'instant'});
  }
  featureChoices();
  applyCampaign();
  document.addEventListener('DOMContentLoaded',()=>{
    featureChoices();applyCampaign();centerMobileChoice();
  },{once:true});
  window.addEventListener('kit:theme',()=>{
    applyCampaign();requestAnimationFrame(centerMobileChoice);
  });
})();
