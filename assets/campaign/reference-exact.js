/* Premium reference-exact composition. All artwork is from the four
   approved PNGs; product photos are real and separate. No generated images. */
(()=>{
 'use strict';
 const KIT=window.KIT;
 if(!KIT)return;
 const base='/keep-in-touch-v7-preview/assets/campaign/reference-exact/';
 const campaigns={
   winter:{asset:'winter',title:'هدايا شتاء تدفّي القلوب',name:'شتاء',
     caption:'من الإسكندرية… هدايا مختارة للحظات أجمل في الشتا.',
     buttonTop:'73.0%',primaryLeft:'77.7%',primaryWidth:'13.3%',secondaryLeft:'64.5%',secondaryWidth:'12.3%'},
   valentine:{asset:'valentine',title:'عيد الحب',name:'عيد الحب',
     caption:'هدايا تعبّر عن الحب بأجمل التفاصيل.',
     buttonTop:'76.0%',primaryLeft:'76.5%',primaryWidth:'15.1%',secondaryLeft:'63.0%',secondaryWidth:'12.5%'},
   ramadan:{asset:'ramadan',title:'رمضان كريم',name:'رمضان',
     caption:'هدايا تعبّر عن الكرم والمودّة في شهر العطاء.',
     buttonTop:'73.0%',primaryLeft:'77.5%',primaryWidth:'15.8%',secondaryLeft:'64.5%',secondaryWidth:'12.2%'},
   'sham-nessim':{asset:'sham-el-nessim',title:'شم النسيم',name:'شم النسيم',
     caption:'احتفل بقدوم الربيع بهدايا استثنائية.',
     buttonTop:'74.5%',primaryLeft:'76.6%',primaryWidth:'14.7%',secondaryLeft:'63.6%',secondaryWidth:'12.1%'}
 };
 const doc=document.documentElement;
 const image=document.getElementById('referenceExactHeroImage');
 const editorial=document.getElementById('referenceExactEditorial');
 const hero=document.getElementById('referenceExactHero');
 const title=document.getElementById('referenceExactAccessibleTitle');
 const description=document.getElementById('referenceExactAccessibleDescription');
 const shop=document.getElementById('referenceExactShop');
 const occasions=document.getElementById('referenceExactOccasions');
 const cards=[...document.querySelectorAll('.real-categories .photo-category-tile')];
 const orig=cards.map(el=>({category:el.dataset.category,label:el.getAttribute('aria-label')}));
 const selections=['إكسسوارات شخصية','بوكسات وبوكيهات هدايا','هدايا مضيئة','مجات وزجاجات','تذكارات الزفاف والخطوبة','هدايا المناسبات'];
 const margin=(name,value)=>hero?.style.setProperty('--ref-'+name,value);
 const originalPageTitle=document.title;
 function apply(){
   const season=KIT.getTheme();
   const config=campaigns[season];
   if(!config){
     delete doc.dataset.referenceExact;
     doc.classList.remove('catalog-expanded');
     cards.forEach((el,i)=>{
       if(!orig[i])return;
       el.dataset.category=orig[i].category;
       el.setAttribute('aria-label',orig[i].label);
     });
     return;
   }
   const folder=config.asset;
   doc.dataset.referenceExact=season;
   if(image){
     image.src=base+folder+'-full-hero.webp';
     image.alt='';
   }
   if(hero)hero.setAttribute('aria-label',config.title+'، مشهد مرجعي إعلاني معتمد');
   if(title)title.textContent=config.title;
   if(description)description.textContent=config.caption+
       ' الصور الفنية للتصميم فقط؛ صور منتجات المحل الحقيقية في الكتالوج.';
   if(shop)shop.setAttribute('aria-label','عرض المنتجات الحقيقية، '+config.name);
   if(occasions)occasions.setAttribute('aria-label','استكشف المناسبات الأخرى');
   if(editorial){
     editorial.src=base+folder+'-alexandria.webp';
     editorial.alt='رسالة فنية من الإسكندرية ضمن مرجع '+config.name+'، ليست صورة منتج.';
   }
   margin('button-top',config.buttonTop);
   margin('primary-left',config.primaryLeft);
   margin('primary-width',config.primaryWidth);
   margin('secondary-left',config.secondaryLeft);
   margin('secondary-width',config.secondaryWidth);
   margin('button-height','15%');
   cards.forEach((el,i)=>{
     const img=el.querySelector('img');
     const category=selections[i]||orig[i]?.category;
     if(category)el.dataset.category=category;
     el.setAttribute('aria-label','استكشف هدايا '+(category||'المحل'));
     if(img){
       img.src=base+folder+'-tile-'+String(i+1).padStart(2,'0')+'.webp';
       img.alt='صورة فنية من التصميم المرجعي، لقسم '+(category||'الهدايا');
     }
   });
 }
 function expand(){
   if(!doc.dataset.referenceExact)return;
   doc.classList.add('catalog-expanded');
 }
 // Existing category and filter actions remain owned by the store's normal JS.
 const showAll=document.getElementById('showAllLink');
 showAll?.addEventListener('click',expand);
 document.addEventListener('click',e=>{
   if(e.target.closest('.real-categories [data-category]'))expand();
 },true);
 window.addEventListener('kit:theme',()=>{
   doc.classList.remove('catalog-expanded');
   apply();
 });
 apply();
 if(document.readyState==='loading'){
   document.addEventListener('DOMContentLoaded',apply,{once:true});
 }
})();
