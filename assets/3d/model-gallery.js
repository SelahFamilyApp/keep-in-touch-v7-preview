/* Keep in Touch · local-only ZIP/GLB gallery. No AI API or photo upload. */
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const root=document.getElementById('kit3d-gallery');
if(root)initializeGallery(root);
function initializeGallery(root){
  const $=id=>document.getElementById(id);
  const input=$('kit3d-input'),selectList=$('kit3d-list'),
    emptyList=$('kit3d-list-empty'),stage=$('kit3d-stage'),
    canvas=$('kit3d-canvas'),emptyStage=$('kit3d-stage-empty'),
    busyStage=$('kit3d-stage-busy'),label=$('kit3d-current'),
    status=$('kit3d-status'),count=$('kit3d-count'),
    spinButton=$('kit3d-spin');
  const MAX_ARCHIVE=90*1024*1024,MAX_MODEL=32*1024*1024,
    MAX_MODELS=20,MAX_TOTAL=180*1024*1024;
  let models=[],selected=-1,loadToken=0;
  let scene,camera,renderer,controls,activeObject,resizeObserver,spinRaf=0,autoSpin=false;
  const loader=new GLTFLoader();
  const prettySize=bytes=>(bytes/1048576).toLocaleString('en-US',{maximumFractionDigits:1})+' MB';
  function say(message,type='info'){status.textContent=message;status.dataset.kind=type;}
  function setBusy(value){busyStage.hidden=!value;input.disabled=value;}
  function validateGlb(bytes){
    if(bytes.byteLength<32||bytes.byteLength>MAX_MODEL)
      throw Error('ملف GLB غير صالح أو حجمه أكبر من ٣٢ ميجابايت.');
    const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    if(v.getUint32(0,true)!==0x46546c67||v.getUint32(4,true)!==2||
        v.getUint32(8,true)!==bytes.byteLength)
      throw Error('الملف مش GLB سليم من إصدار glTF 2.0.');
    const jlen=v.getUint32(12,true);
    if(v.getUint32(16,true)!==0x4e4f534a||jlen>2*1024*1024||jlen+20>bytes.byteLength)
      throw Error('بيانات مجسم GLB غير سليمة.');
    let gltf;
    try{gltf=JSON.parse(new TextDecoder().decode(bytes.subarray(20,20+jlen)));}
    catch{throw Error('ملف GLB يحتوي على بيانات JSON غير صالحة.');}
    if(gltf.asset?.version!=='2.0'||!Array.isArray(gltf.meshes)||gltf.meshes.length<1)
      throw Error('الملف لا يحتوي على نموذج 3D صحيح.');
    if((gltf.meshes?.length||0)>3000||(gltf.nodes?.length||0)>6000)
      throw Error('هذا النموذج معقّد أكثر من المسموح في نسخة الاختبار.');
    for(const r of [...(gltf.buffers||[]),...(gltf.images||[])])
      if(r.uri&&!r.uri.startsWith('data:'))
        throw Error('العارض يدعم GLB المدمجة بالكامل فقط، بدون صور أو ملفات خارجية.');
    return gltf;
  }
  function inspectZip(bytes){
    const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    let eocd=-1;
    for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--){
      if(v.getUint32(i,true)===0x06054b50){eocd=i;break;}
    }
    if(eocd<0)throw Error('ده مش ملف ZIP سليم.');
    if(v.getUint16(eocd+4,true)!==0||v.getUint16(eocd+6,true)!==0)
      throw Error('ملفات ZIP متعددة الأجزاء غير مدعومة.');
    const total=v.getUint16(eocd+10,true);
    const dirSize=v.getUint32(eocd+12,true);
    let cursor=v.getUint32(eocd+16,true);
    if(total<1||total>150||cursor+dirSize>bytes.length)
      throw Error('عدد ملفات الأرشيف أو بياناته غير مدعوم.');
    let uncompressed=0,found=0;
    for(let i=0;i<total;i++){
      if(cursor+46>bytes.length||v.getUint32(cursor,true)!==0x02014b50)
        throw Error('دليل ملفات ZIP تالف.');
      const flags=v.getUint16(cursor+8,true),method=v.getUint16(cursor+10,true),
        size=v.getUint32(cursor+24,true),filenameLength=v.getUint16(cursor+28,true),
        extraLength=v.getUint16(cursor+30,true),commentLength=v.getUint16(cursor+32,true);
      const next=cursor+46+filenameLength+extraLength+commentLength;
      if(next>bytes.length||size===0xffffffff)
        throw Error('نوع ZIP غير مدعوم في نسخة الاختبار.');
      const name=new TextDecoder().decode(bytes.subarray(cursor+46,cursor+46+filenameLength));
      if(name.toLowerCase().endsWith('.glb')){
        if((flags&1)||![0,8].includes(method)||size<32||size>MAX_MODEL)
          throw Error('يوجد نموذج GLB مشفّر أو كبير أو غير صالح داخل ZIP.');
        found++;uncompressed+=size;
        if(found>MAX_MODELS||uncompressed>MAX_TOTAL)
          throw Error('الـZIP فيه ملفات أكثر أو أكبر من حد المعاينة الآمن.');
      }
      cursor=next;
    }
    if(found<1)throw Error('الـZIP مش فيه أي ملف GLB.');
  }
  async function unzipGlbs(bytes){
    if(!window.fflate?.unzip)throw Error('مكتبة فتح ZIP مش متاحة، أعد تحميل الصفحة.');
    inspectZip(bytes);
    const files=await new Promise((resolve,reject)=>{
      window.fflate.unzip(bytes,{filter:entry=>entry.name.toLowerCase().endsWith('.glb')},
        (error,result)=>error?reject(error):resolve(result));
    });
    return Object.entries(files)
      .map(([name,content])=>({name:name.replace(/\\/g,'/').split('/').pop(),bytes:content}))
      .sort((a,b)=>a.name.localeCompare(b.name,'en',{numeric:true}));
  }
  async function readSelectedFiles(fileList){
    const files=Array.from(fileList);
    if(!files.length)return [];
    if(files.length===1&&/\.zip$/i.test(files[0].name)){
      if(files[0].size>MAX_ARCHIVE)throw Error('حجم ZIP أكبر من ٩٠ ميجابايت.');
      return unzipGlbs(new Uint8Array(await files[0].arrayBuffer()));
    }
    if(files.length>MAX_MODELS||files.some(file=>!/\.glb$/i.test(file.name)))
      throw Error('اختَر ZIP واحد أو حتى ٢٠ ملف GLB منفصل.');
    let total=0;
    for(const file of files){
      total+=file.size;
      if(file.size<32||file.size>MAX_MODEL||total>MAX_TOTAL)
        throw Error('في ملف GLB أكبر من المسموح (٣٢ ميجابايت للملف).');
    }
    return Promise.all(files.map(async file=>({name:file.name,bytes:new Uint8Array(await file.arrayBuffer())})));
  }
  function displayList(){
    selectList.replaceChildren();
    count.textContent=models.length?models.length+' تصميم':'مفيش ملفات';
    emptyList.hidden=models.length>0;
    models.forEach((entry,index)=>{
      const b=document.createElement('button');b.type='button';b.className='kit3d-model';
      b.dataset.modelIndex=String(index);b.setAttribute('aria-pressed',String(index===selected));
      const no=document.createElement('span');no.className='kit3d-model-number';
      no.textContent=String(index+1).padStart(2,'0');
      const title=document.createElement('span');title.className='kit3d-model-title';
      title.textContent=entry.name.replace(/\.glb$/i,'').replace(/[_-]/g,' ');
      const meta=document.createElement('small');meta.textContent='GLB · '+prettySize(entry.bytes.byteLength);
      const arrow=document.createElement('span');arrow.className='kit3d-model-chevron';
      arrow.setAttribute('aria-hidden','true');arrow.textContent='↗';
      b.append(no,title,meta,arrow);
      b.addEventListener('click',()=>showModel(index));
      selectList.append(b);
    });
  }
  function disposeObject(object){
    if(!object)return;
    const mats=new Set(),textures=new Set();
    object.traverse(node=>{
      if(!node.isMesh)return;
      node.geometry?.dispose();
      for(const mat of Array.isArray(node.material)?node.material:[node.material]){
        if(!mat||mats.has(mat))continue;
        mats.add(mat);
        for(const prop of ['map','normalMap','aoMap','emissiveMap','roughnessMap',
          'metalnessMap','alphaMap','bumpMap','clearcoatMap','clearcoatRoughnessMap']){
          if(mat[prop]?.isTexture)textures.add(mat[prop]);
        }
        mat.dispose();
      }
    });
    textures.forEach(texture=>texture.dispose());
  }
  function ensureViewer(){
    if(renderer)return;
    scene=new THREE.Scene();
    camera=new THREE.PerspectiveCamera(37,1,.002,1000);
    camera.position.set(.17,.1,.24);
    scene.add(new THREE.HemisphereLight(0xffffff,0xc7b7b2,2.15));
    const light=new THREE.DirectionalLight(0xffffff,2.15);
    light.position.set(-3,5,6);scene.add(light);
    const fill=new THREE.DirectionalLight(0xd6e5ff,1.1);
    fill.position.set(4,1,-4);scene.add(fill);
    renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.16;
    controls=new OrbitControls(camera,canvas);
    controls.enableDamping=true;
    controls.dampingFactor=.08;
    controls.enablePan=false;
    controls.minPolarAngle=.015;
    controls.maxPolarAngle=Math.PI-.015;
    controls.enableZoom=true;
    controls.zoomSpeed=.85;
    controls.autoRotate=false;
    const resize=()=>{
      if(!renderer)return;
      const w=Math.max(2,Math.floor(stage.clientWidth)),
        h=Math.max(2,Math.floor(stage.clientHeight));
      renderer.setSize(w,h,false);
      camera.aspect=w/h;
      camera.updateProjectionMatrix();
    };
    resize();
    if('ResizeObserver' in window){
      resizeObserver=new ResizeObserver(resize);
      resizeObserver.observe(stage);
    }else window.addEventListener('resize',resize);
    const animate=()=>{
      spinRaf=requestAnimationFrame(animate);
      if(document.hidden)return;
      controls?.update();
      renderer.render(scene,camera);
    };
    animate();
  }
  function frameObject(object){
    object.updateMatrixWorld(true);
    const bounding=new THREE.Box3().setFromObject(object);
    if(bounding.isEmpty())throw Error('الموديل مش فيه مجسمات ظاهرة.');
    const center=bounding.getCenter(new THREE.Vector3());
    const dims=bounding.getSize(new THREE.Vector3());
    const size=Math.max(dims.x,dims.y,dims.z);
    if(!Number.isFinite(size)||size<.000001||size>1e10)
      throw Error('أبعاد مجسم GLB غير صالحة.');
    const halfV=(camera.fov*Math.PI/180)/2;
    const halfH=Math.atan(Math.tan(halfV)*camera.aspect);
    const fit=Math.max(size/(2*Math.sin(halfV)),size/(2*Math.sin(halfH)));
    const distance=fit*1.85;
    const direction=new THREE.Vector3(1,.48,1.65).normalize();
    controls.target.copy(center);
    camera.position.copy(center).addScaledVector(direction,distance);
    camera.near=Math.max(size/5000,.00001);
    camera.far=Math.max(size*100,100);
    controls.minDistance=Math.max(size*.72,.00002);
    controls.maxDistance=Math.max(size*16,distance*2);
    camera.updateProjectionMatrix();
    controls.update();
  }
  async function parseGlb(entry){
    // Parsing from bytes, not URLs: no cloud upload or third-party fetch.
    const own=new Uint8Array(entry.bytes.length);
    own.set(entry.bytes);
    const parsed=await new Promise((resolve,reject)=>{
      loader.parse(own.buffer,'',resolve,reject);
    });
    if(!parsed.scene)throw Error('لم يتم العثور على مجسم 3D داخل GLB.');
    return parsed.scene;
  }
  async function showModel(index){
    if(!models[index])return;
    const token=++loadToken;
    setBusy(true);
    try{
      const entry=models[index];
      say('بنفتح '+entry.name+' داخل العارض...');
      ensureViewer();
      const object=await parseGlb(entry);
      if(token!==loadToken){disposeObject(object);return;}
      frameObject(object);
      if(activeObject){scene.remove(activeObject);disposeObject(activeObject);}
      activeObject=object;
      scene.add(activeObject);
      selected=index;
      displayList();
      label.textContent='بتعاين: '+entry.name;
      emptyStage.hidden=true;
      canvas.hidden=false;
      say('اتفتح '+entry.name+' — اسحب يمين وشمال وفوق وتحت، أو استخدم أزرار التحكم.','success');
    }catch(error){
      console.warn('Could not display GLB:',error);
      say('ما قدرناش نعرض النموذج: '+(error?.message||'خطأ غير معروف'),'error');
    }finally{
      if(token===loadToken)setBusy(false);
    }
  }
  function removeModels(){
    ++loadToken;
    models=[];
    selected=-1;
    displayList();
    if(scene&&activeObject){scene.remove(activeObject);disposeObject(activeObject);activeObject=null;}
    emptyStage.hidden=false;
    canvas.hidden=true;
    label.textContent='اختَر موديل 3D لعرضه';
    autoSpin=false;
    if(controls)controls.autoRotate=false;
    spinButton.setAttribute('aria-pressed','false');
    spinButton.textContent='⟳ دوران تلقائي';
    say('اختَر ZIP فيه ملفات GLB، أو ارفع واحد أو أكتر GLB. الملفات بتفضل على جهازك.');
    input.value='';
  }
  function moveCamera(theta,phi,factor){
    if(!camera||!controls||!activeObject)return;
    const offset=camera.position.clone().sub(controls.target);
    const sphere=new THREE.Spherical().setFromVector3(offset);
    sphere.theta+=theta;
    sphere.phi=Math.max(.017,Math.min(Math.PI-.017,sphere.phi+phi));
    sphere.radius=Math.max(controls.minDistance,
      Math.min(controls.maxDistance,sphere.radius*factor));
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(sphere));
    controls.update();
  }
  async function loadInput(){
    const files=input.files;
    if(!files?.length)return;
    loadToken++;
    setBusy(true);
    say('بنقرأ ملفات الموديلات محليًا داخل متصفحك...');
    try{
      const imported=await readSelectedFiles(files);
      if(!imported.length)throw Error('مفيش ملفات GLB قابلة للعرض.');
      const checked=[];
      for(const candidate of imported){
        try{
          validateGlb(candidate.bytes);
          checked.push(candidate);
        }catch(e){throw Error(candidate.name+': '+e.message);}
      }
      // Replace previous dataset only after entire new input validates.
      models=checked;
      selected=-1;
      displayList();
      say('تمام، وجدنا '+models.length+' نموذج. بنفتح الأول للمشاهدة...');
    }catch(e){
      say(e.message||'حصل خطأ أثناء قراءة ZIP.','error');
      setBusy(false);
      return;
    }
    input.disabled=false;
    await showModel(0);
  }
  input.addEventListener('change',loadInput);
  $('kit3d-clear').addEventListener('click',removeModels);
  $('kit3d-reset').addEventListener('click',()=>{
    if(activeObject)frameObject(activeObject);
  });
  $('kit3d-left').addEventListener('click',()=>moveCamera(-.26,0,1));
  $('kit3d-right').addEventListener('click',()=>moveCamera(.26,0,1));
  $('kit3d-up').addEventListener('click',()=>moveCamera(0,-.22,1));
  $('kit3d-down').addEventListener('click',()=>moveCamera(0,.22,1));
  $('kit3d-near').addEventListener('click',()=>moveCamera(0,0,.80));
  $('kit3d-far').addEventListener('click',()=>moveCamera(0,0,1.25));
  spinButton.addEventListener('click',()=>{
    if(!controls||!activeObject)return;
    autoSpin=!autoSpin;
    controls.autoRotate=autoSpin;
    controls.autoRotateSpeed=1.7;
    spinButton.setAttribute('aria-pressed',String(autoSpin));
    spinButton.textContent=autoSpin?'⏹ إيقاف الدوران':'⟳ دوران تلقائي';
  });
  window.addEventListener('pagehide',()=>{
    cancelAnimationFrame(spinRaf);
    resizeObserver?.disconnect();
    controls?.dispose();
    if(activeObject)disposeObject(activeObject);
    renderer?.dispose();
  },{once:true});
  removeModels();
}
