// 小有天山谷酒坊 · 沙盘工作模型几何（程序化生成，Z 轴向上的坐标系，外层再整体转成 three 的 Y 向上）
import * as THREE from './lib/three.module.js';

function rng(seed){let a=seed>>>0;return function(){a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const M=(hex,r,m)=>new THREE.MeshStandardMaterial({color:hex,roughness:r,metalness:m||0,side:THREE.DoubleSide});

const C={tile:0x84868b,stone:0xc2bdb6,wood:0xb19373,ground:0xb1816c,rock:0xa27e73,
 tree:0x698465,ring:0xb5b1ac,fire:0xfab665,person:0xeae7e2,concrete:0xdad7d3,
 woodB:0xb69979,glass:0xc8d4d4};

function box(cx,cy,cz,sx,sy,sz,m){const o=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),m);o.position.set(cx,cy,cz);return o;}
function poly(verts,faces,m){
  const p=[];
  for(const f of faces)for(let i=1;i<f.length-1;i++)for(const k of [f[0],f[i],f[i+1]]){const v=verts[k];p.push(v[0],v[1],v[2]);}
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
  g.computeVertexNormals();
  return new THREE.Mesh(g,m);
}
// Blender 的柱／锥轴向为 Z，这里把 three 的 Y 轴柱体转过来
function cyl(rTop,rBot,h,seg,cx,cy,cz,m){
  const g=new THREE.CylinderGeometry(rTop,rBot,h,seg);g.rotateX(Math.PI/2);
  const o=new THREE.Mesh(g,m);o.position.set(cx,cy,cz);return o;
}

function wing(g,name,L,W,ph,bh,rh,oh,mStone,mWood,mTile,angle,px,py,inset){
  inset=inset===undefined?0.55:inset;
  const w=new THREE.Group();
  w.add(box(0,0,ph/2,L,W,ph,mStone));
  w.add(box(0,0,ph+bh/2,L-0.3,W-inset*2,bh,mWood));
  const he=ph+bh, hr=rh, HL=L/2+oh, HW=W/2+oh;
  const v=[[-HL,-HW,he],[HL,-HW,he],[HL,HW,he],[-HL,HW,he],[-HL,0,hr],[HL,0,hr]];
  const f=[[0,1,5,4],[3,4,5,2],[0,4,3],[1,2,5],[0,3,2,1]];
  w.add(poly(v,f,mTile));
  w.rotation.z=angle; w.position.set(px,py,0); w.name=name;
  g.add(w); return w;
}

function terrain(g,seed){
  const mg=M(C.ground,.96), mr=M(C.rock,.93), mt=M(C.tree,.95);
  g.add(cyl(52,52,1.4,56,0,0,-0.7,mg));
  const R=rng(seed||7), U=(a,b)=>a+R()*(b-a);
  for(let i=0;i<30;i++){
    const a=i/30*Math.PI*2+U(-.05,.05), r=U(36,49), h=U(9,23);
    const c=cyl(U(1,3),U(6,11),h,6,Math.cos(a)*r,Math.sin(a)*r,h/2-0.6,mr);
    c.rotation.z=U(0,3); g.add(c);
  }
  for(let i=0;i<34;i++){
    const a=U(0,Math.PI*2), r=U(30,46), h=U(4,7);
    g.add(cyl(0,U(1.3,2.3),h,7,Math.cos(a)*r,Math.sin(a)*r,h/2,mt));
  }
}

function courtLife(g,cx,cy,spread,n){
  const mr=M(C.ring,.95), mf=M(C.fire,.35), mp=M(C.person,.9);
  g.add(cyl(1.2,1.2,0.55,18,cx,cy,0.27,mr));
  g.add(cyl(0,0.72,1.6,10,cx,cy,1.05,mf));
  const R=rng(11), U=(a,b)=>a+R()*(b-a);
  for(let i=0;i<n;i++){
    const a=U(0,Math.PI*2), r=U(2.6,spread);
    g.add(cyl(0.27,0.27,1.72,8,cx+Math.cos(a)*r,cy+Math.sin(a)*r,0.86,mp));
  }
}

export function buildS1(){
  const g=new THREE.Group(); terrain(g,7);
  const mT=M(C.tile,.88), mS=M(C.stone,.93), mW=M(C.wood,.86);
  const off=7.6+4.6;
  wing(g,'brew', 26,9.2,2.0,2.6,7.0,1.5,mS,mW,mT,0,        0, off);
  wing(g,'tav',  24,8.6,2.0,1.9,5.0,1.7,mS,mW,mT,0,        0,-off);
  wing(g,'shop', 21,9.0,2.0,2.3,6.0,1.5,mS,mW,mT,Math.PI/2, off,0);
  wing(g,'store',19,8.4,2.4,2.1,5.6,1.3,mS,mW,mT,Math.PI/2,-off,0);
  courtLife(g,0,0,6.4,13);
  return g;
}

export function buildA(){
  const g=new THREE.Group(); terrain(g,7);
  const mT=M(C.tile,.88), mS=M(C.stone,.93), mW=M(C.wood,.86);
  [['brew',95,22,9.4,2.6,7.0],['shop',-25,20,9.0,2.3,6.0],['tav',-150,19,8.8,1.9,5.0]]
  .forEach(([n,deg,L,W,bh,rh])=>{
    const a=deg*Math.PI/180, d=L/2+6.2;
    wing(g,n,L,W,2.0,bh,rh,1.5,mS,mW,mT,a,Math.cos(a)*d,Math.sin(a)*d);
  });
  const hr=5.0,he=3.6,R=9.4, v=[];
  for(let i=0;i<6;i++)v.push([Math.cos(Math.PI*2*i/6)*R,Math.sin(Math.PI*2*i/6)*R,he]);
  v.push([0,0,hr]);
  const f=[]; for(let i=0;i<6;i++)f.push([i,(i+1)%6,6]); f.push([0,1,2,3,4,5]);
  g.add(poly(v,f,mT));
  courtLife(g,0,0,8.6,15);
  return g;
}

export function buildB(){
  const g=new THREE.Group(); terrain(g,7);
  const mC=M(C.concrete,.80), mS=M(C.stone,.93), mW=M(C.woodB,.8), mG=M(C.glass,.22,.15);
  [['brew',95,21,11.0,7.4],['shop',-25,19,10.0,5.8],['tav',-150,18,10.0,4.6]]
  .forEach(([n,deg,L,W,H])=>{
    const a=deg*Math.PI/180, d=L/2+6.0, w=new THREE.Group();
    w.add(box(0,0,0.7,L*1.03,W*1.03,1.4,mS));
    w.add(box(0,0,1.4+H/2,L,W,H,mC));
    const hz=1.4+H;
    const v=[[-L/2,-W/2,hz],[L/2,-W/2,hz],[L/2,W/2,hz],[-L/2,W/2,hz],[-L/2,-W/2,hz+1.9],[L/2,-W/2,hz+1.9]];
    w.add(poly(v,[[0,1,5,4],[4,5,2,3],[0,4,3],[1,2,5],[0,3,2,1]],mC));
    w.rotation.z=a; w.position.set(Math.cos(a)*d,Math.sin(a)*d,0); w.name=n;
    g.add(w);
  });
  const R=9.0, v=[], f=[];
  for(let i=0;i<6;i++)v.push([Math.cos(Math.PI*2*i/6)*R,Math.sin(Math.PI*2*i/6)*R,0.2]);
  for(let i=0;i<6;i++)v.push([Math.cos(Math.PI*2*i/6)*(R-2.2),Math.sin(Math.PI*2*i/6)*(R-2.2),-2.3]);
  for(let i=0;i<6;i++)f.push([i,(i+1)%6,6+(i+1)%6,6+i]);
  f.push([6,7,8,9,10,11]);
  g.add(poly(v,f,mS));
  const a=-25*Math.PI/180, bar=new THREE.Group();
  bar.add(box(0,0,5.0,36,3.4,2.8,mG));
  bar.add(box(0,0,6.6,36,3.6,0.5,mW));
  bar.rotation.z=a; g.add(bar);
  courtLife(g,0,0,6.2,12);
  return g;
}

export const BUILD={S1:buildS1,A:buildA,B:buildB};
