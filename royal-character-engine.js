(()=>{"use strict";
if(!window.BABYLON)return;
let engine=null,scene=null,camera=null,canvas=null,resizeHandler=null;
const mats={};
const mat=(name,color,emissive=0)=>{
 if(mats[name])return mats[name];
 const m=new BABYLON.StandardMaterial("royalChar_"+name,scene);
 m.diffuseColor=BABYLON.Color3.FromHexString(color);
 m.specularColor=new BABYLON.Color3(.8,.8,.8);m.specularPower=72;
 if(emissive)m.emissiveColor=m.diffuseColor.scale(emissive);
 mats[name]=m;return m;
};
function mesh(name,shape,opts,parent,material){
 const m=shape==="sphere"?BABYLON.MeshBuilder.CreateSphere(name,opts,scene):
 shape==="cylinder"?BABYLON.MeshBuilder.CreateCylinder(name,opts,scene):
 shape==="box"?BABYLON.MeshBuilder.CreateBox(name,opts,scene):
 BABYLON.MeshBuilder.CreateTorus(name,opts,scene);
 m.parent=parent;m.material=material;m.isPickable=false;return m;
}
function makeQueen(x){
 const root=new BABYLON.TransformNode("queenLumaRig",scene);root.position.set(x,4.35,0);
 const gold=mat("gold","#ffd15c",.22),skin=mat("skin","#ffc59c"),hair=mat("hair","#63318b"),robe=mat("robe","#7135b8",.12),cape=mat("cape","#c52d83",.08),white=mat("eyeWhite","#fff8ed"),black=mat("eye","#24102f"),gem=mat("gem","#56e8ff",.8);
 mesh("queenCape","box",{width:.92,height:1.15,depth:.12},root,cape).position.set(0,.55,.22);
 mesh("queenDress","cylinder",{height:1.05,diameterTop:.38,diameterBottom:.92,tessellation:24},root,robe).position.y=.5;
 mesh("queenTorso","cylinder",{height:.58,diameterTop:.46,diameterBottom:.58,tessellation:20},root,robe).position.y=1.12;
 const head=mesh("queenHead","sphere",{diameter:.65,segments:20},root,skin);head.position.y=1.62;head.position.z=-.02;
 const hairCap=mesh("queenHair","sphere",{diameter:.72,segments:18},root,hair);hairCap.position.set(0,1.77,.09);hairCap.scaling.set(1,.72,.8);
 for(const side of [-1,1]){
  const eye=mesh("queenEye","sphere",{diameter:.09,segments:10},root,white);eye.position.set(side*.14,1.65,-.315);
  const pupil=mesh("queenPupil","sphere",{diameter:.045,segments:8},root,black);pupil.position.set(side*.14,1.65,-.36);
  const arm=mesh("queenArm","cylinder",{height:.55,diameterTop:.13,diameterBottom:.16},root,skin);arm.position.set(side*.39,1.12,0);arm.rotation.z=side*-.65;
  const sleeve=mesh("queenSleeve","sphere",{diameter:.25,segments:12},root,robe);sleeve.position.set(side*.34,1.28,0);
  const tip=mesh("queenCrownPoint","cylinder",{height:.25,diameterTop:0,diameterBottom:.14,tessellation:8},root,gold);tip.position.set(side*.18,2.08,0);
 }
 const crown=mesh("queenCrown","cylinder",{height:.16,diameterTop:.48,diameterBottom:.58,tessellation:20},root,gold);crown.position.y=1.99;
 const jewel=mesh("queenJewel","sphere",{diameter:.14,segments:12},root,gem);jewel.position.set(0,2.06,-.25);
 root.metadata={baseY:4.35,kind:"queen"};return root;
}
function makeDragon(x){
 const root=new BABYLON.TransformNode("dragonPrinceRig",scene);root.position.set(x,4.38,0);
 const green=mat("dragonGreen","#38c99a",.1),belly=mat("dragonBelly","#ffe29a"),horn=mat("dragonHorn","#ffe18a",.15),wing=mat("dragonWing","#7c55df",.18),eye=mat("dragonEye","#fff8d8"),pupil=mat("dragonPupil","#241044");
 const body=mesh("dragonBody","sphere",{diameter:1,segments:20},root,green);body.scaling.set(.78,.62,.62);body.position.set(0,.8,0);
 const bellyMesh=mesh("dragonBelly","sphere",{diameter:.7,segments:16},root,belly);bellyMesh.scaling.set(.9,.8,.35);bellyMesh.position.set(0,.73,-.35);
 const head=mesh("dragonHead","sphere",{diameter:.66,segments:20},root,green);head.position.set(0,1.42,-.03);
 const snout=mesh("dragonSnout","sphere",{diameter:.36,segments:16},root,belly);snout.scaling.set(1,.7,.8);snout.position.set(0,1.34,-.34);
 for(const side of [-1,1]){
  const e=mesh("dragonEye","sphere",{diameter:.105,segments:10},root,eye);e.position.set(side*.17,1.5,-.32);
  const p=mesh("dragonPupil","sphere",{diameter:.05,segments:8},root,pupil);p.position.set(side*.17,1.5,-.37);
  const h=mesh("dragonHorn","cylinder",{height:.3,diameterTop:0,diameterBottom:.15,tessellation:8},root,horn);h.position.set(side*.22,1.78,.02);h.rotation.z=side*.3;
 }
 const wings=[];
 for(const side of [-1,1]){
  const w=mesh("dragonWing","sphere",{diameter:1,segments:12},root,wing);w.scaling.set(.72,.12,.48);w.position.set(side*.56,1.02,.15);w.rotation.z=side*-.38;wings.push(w);
 }
 const tail=BABYLON.MeshBuilder.CreateTube("dragonTail",{path:[new BABYLON.Vector3(0,.55,.1),new BABYLON.Vector3(.2,.28,.28),new BABYLON.Vector3(.42,.36,.4)],radius:.09,tessellation:8},scene);tail.parent=root;tail.material=green;tail.isPickable=false;
 const crown=mesh("dragonCrown","cylinder",{height:.13,diameterTop:.25,diameterBottom:.42,tessellation:16},root,horn);crown.position.set(0,1.83,-.02);
 root.metadata={baseY:4.38,kind:"dragon",wings};return root;
}
function init(){
 if(engine||!document.querySelector(".game-shell"))return;
 const shell=document.querySelector(".game-shell");
 canvas=document.createElement("canvas");canvas.id="royalCharacterCanvas";canvas.setAttribute("aria-hidden","true");
 shell.appendChild(canvas);
 engine=new BABYLON.Engine(canvas,true,{alpha:true,antialias:true,stencil:false,preserveDrawingBuffer:false},true);
 engine.setHardwareScalingLevel(Math.max(1,window.devicePixelRatio||1)>2?1.35:1);
 scene=new BABYLON.Scene(engine);scene.clearColor=new BABYLON.Color4(0,0,0,0);scene.autoClear=true;
 camera=new BABYLON.FreeCamera("royalCharacterCamera",new BABYLON.Vector3(0,0,-12),scene);camera.setTarget(BABYLON.Vector3.Zero());
 camera.mode=BABYLON.Camera.ORTHOGRAPHIC_CAMERA;camera.minZ=.1;camera.maxZ=50;
 const hemi=new BABYLON.HemisphericLight("characterHemi",new BABYLON.Vector3(0,1,-1),scene);hemi.intensity=1.15;
 const key=new BABYLON.DirectionalLight("characterKey",new BABYLON.Vector3(-.4,-.7,-1),scene);key.intensity=.75;
 const queen=makeQueen(-.86),dragon=makeDragon(.86);
 const fit=()=>{
  engine.resize();const aspect=canvas.clientWidth/Math.max(1,canvas.clientHeight);
  const halfH=6.1,halfW=halfH*aspect;
  camera.orthoLeft=-halfW;camera.orthoRight=halfW;camera.orthoTop=halfH;camera.orthoBottom=-halfH;
  const spread=Math.min(1.18,halfW*.33);queen.position.x=-spread;dragon.position.x=spread;
 };
 fit();resizeHandler=fit;window.addEventListener("resize",fit,{passive:true});
 scene.onBeforeRenderObservable.add(()=>{
  const t=performance.now()*.001;
  queen.position.y=queen.metadata.baseY+Math.sin(t*1.65)*.075;
  queen.rotation.z=Math.sin(t*1.1)*.035;
  dragon.position.y=dragon.metadata.baseY+Math.sin(t*1.9+.7)*.085;
  dragon.rotation.z=Math.sin(t*1.25+.4)*.045;
  dragon.metadata.wings[0].rotation.z=-.38+Math.sin(t*5)*.22;
  dragon.metadata.wings[1].rotation.z=.38-Math.sin(t*5)*.22;
 });
 engine.runRenderLoop(()=>{if(!document.hidden&&scene)scene.render()});
 document.addEventListener("visibilitychange",()=>{if(engine){if(document.hidden)engine.stopRenderLoop();else engine.runRenderLoop(()=>scene.render())}});
 const q=document.getElementById("queen"),d=document.getElementById("dragon");
 if(q)q.style.opacity="0";if(d)d.style.opacity="0";
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();