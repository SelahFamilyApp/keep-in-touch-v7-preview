/* V7 fidelity enhancements. Reuses the V6 reference crops and actual shop photography.
   Never changes research prices, purchasability, the 22 themes, or private routes. */
(()=>{
 'use strict';
 const doc=document.documentElement;
 const K=window.KIT;
 if(!K)return;
 const priority=['winter','valentine','ramadan','sham-nessim','new-year'];
 const flagship={
   winter:{
     file:'winter',
     message:'من قلب الإسكندرية.. هدايا مختارة للحظات لا تُنسى.',
     featured:['KIT-008','KIT-012','KIT-019','KIT-009'],
     symbol:'❄'
   },
   valentine:{
     file:'valentine',
     message:'للحظات الحب.. هدايا تحكي كل التفاصيل الجميلة.',
     featured:['KIT-007','KIT-009','KIT-021','KIT-008'],
     symbol:'♡'
   },
   ramadan:{
     file:'ramadan',
     message:'رمضان كريم.. هدايا فيها وِد وكرم ولمّة.',
     featured:['KIT-008','KIT-019','KIT-005','KIT-009'],
     symbol:'☾'
   },
   'sham-nessim':{
     file:'sham-el-nessim',
     message:'نسمة ربيع من إسكندرية.. هدايا للفرحة والبدايات.',
     featured:['KIT-009','KIT-012','KIT-005','KIT-008'],
     symbol:'✿'
   }
 };
 const displayNames={
   winter:'شتاء','new-year':'رأس السنة',valentine:'فالنتاين',
   ramadan:'رمضان كريم','womens-day':'يوم المرأة',
   'sham-nessim':'شم النسيم'
 };
 const symbols={
   winter:'❄','new-year':'✧',valentine:'♥',
   ramadan:'☾','womens-day':'✿','sham-nessim':'✿'
 };
 const $=id=>document.getElementById(id);
 const grid=$('productGrid');
 let observer;
 function stylePhotos(){
   if(!grid)return;
   for(const wrap of grid.querySelectorAll('.product-card.review-only .product-image-wrap')){
     const photo=wrap.querySelector('img[src^="/keep-in-touch-v7-preview/showcase/images/optimized/"]');
     if(!photo)continue;
     const path=photo.getAttribute('src');
     if(!/^\/showcase\/images\/optimized\/[a-z0-9_.-]+\.webp$/.test(path))continue;
     wrap.style.setProperty('--v7-product-photo','url("'+path+'")');
   }
 }
 function featureOrder(){
   const c=flagship[K.getTheme()];
   if(!grid||!c||doc.classList.contains('catalog-expanded'))return;
   const cards=[...grid.querySelectorAll(':scope > .product-card')];
   if(cards.length<5)return;
   const ordered=c.featured.map(id=>cards.find(e=>e.dataset.id===id)).filter(Boolean);
   if(ordered.length!==4)return;
   if(ordered.every((e,i)=>cards[i]===e))return;
   if(observer)observer.disconnect();
   for(const node of ordered.slice().reverse())grid.prepend(node);
   if(observer)observer.observe(grid,{childList:true});
 }
 function enhanceGrid(){
   stylePhotos();
   featureOrder();
 }
 function selector(){
   const group=$('seasonQuickChoices');
   if(!group)return;
   const labels=[...group.querySelectorAll('.season-chip[data-season]')];
   if(labels.length!==22)return;
   const current=K.getTheme();
   const order=[...(priority.includes(current)?[]:[current]),...priority];
   const orderKey=id=>{
     const n=order.indexOf(id);
     return n===-1?100+Object.keys(K.SEASONS).indexOf(id):n;
   };
   labels.sort((a,b)=>orderKey(a.dataset.season)-orderKey(b.dataset.season))
         .forEach(node=>group.append(node));
   labels.forEach(node=>{
     const id=node.dataset.season;
     const name=node.querySelector('.season-chip-text');
     const icon=node.querySelector('.season-chip-symbol');
     if(name&&displayNames[id])name.textContent=displayNames[id];
     if(icon&&symbols[id])icon.textContent=symbols[id];
   });
   const more=document.querySelector('.season-console-more');
   if(more){
     more.href='#seasonGalleryTitle';
     more.setAttribute('aria-label','استعرض جميع الثيمات الموسمية الاثنين والعشرين');
     more.innerHTML='كل المواسم <span aria-hidden="true">⌄</span>';
   }
 }
 function benefits(){
   const strip=document.querySelector('.campaign-benefits');
   if(!strip||strip.dataset.v7Updated)return;
   const items=[
     ['♧','تغليف أنيق','تفاصيل الهدية قيد الاعتماد'],
     ['⌁','من قلب إسكندرية','أفكار لكل المناسبات'],
     ['♡','هدية لها معنى','صور حقيقية من المحل'],
     ['◇','نسخة عرض تفاعلية','الطلبات والدفع غير متاحين']
   ];
   [...strip.children].forEach((node,i)=>{
     const data=items[i];if(!data)return;
     const emblem=node.querySelector('span');
     const p=node.querySelector('p');
     if(emblem)emblem.textContent=data[0];
     if(p){
       p.textContent=data[1];
       const small=document.createElement('small');
       small.textContent=data[2];p.append(small);
     }
   });
   strip.dataset.v7Updated='true';
 }
 function apply(){
   const theme=K.getTheme();
   const f=flagship[theme];
   if(!f){
     doc.style.removeProperty('--v7-edge');
     return;
   }
   doc.style.setProperty('--v7-edge',
     'url("/keep-in-touch-v7-preview/assets/campaign/reference-exact/'+f.file+'-edge-frame.webp")');
   const msg=$('announcementMessage');
   if(msg)msg.textContent=f.message;
   const symbol=document.querySelector('.season-console-symbol');
   if(symbol)symbol.textContent=f.symbol;
   const kicker=document.querySelector('.season-console-kicker');
   if(kicker)kicker.textContent='THE SEASONAL ATELIER';
   const intro=document.querySelector('.season-console-intro strong');
   if(intro)intro.textContent='اختر طابع الموسم';
   const action=$('showAllLink');
   if(action)action.innerHTML='عرض الكل <span aria-hidden="true">←</span>';
   selector();
   benefits();
   enhanceGrid();
 }
 function install(){
   if(grid){
     observer=new MutationObserver(()=>enhanceGrid());
     observer.observe(grid,{childList:true});
   }
   apply();
 }
 if(document.readyState==='loading'){
   document.addEventListener('DOMContentLoaded',install,{once:true});
 }else install();
 window.addEventListener('kit:theme',()=>queueMicrotask(apply));
 window.addEventListener('kit:products',()=>queueMicrotask(enhanceGrid));
})();
