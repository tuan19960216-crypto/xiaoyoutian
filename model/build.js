// 小有天山谷酒坊 · 沙盘工作模型几何（程序化生成，Z 轴向上的坐标系，外层再整体转成 three 的 Y 向上）
import * as THREE from './lib/three.module.js';

function rng(seed){let a=seed>>>0;return function(){a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const M=(hex,r,m)=>new THREE.MeshStandardMaterial({color:hex,roughness:r,metalness:m||0,side:THREE.DoubleSide});

const SLOPE=0.4545;   // 1:2.2 = 24.4°（R11 锁定，小青瓦最小坡）
const EAVE=2.70;      // 檐口净高（R10 锁定，恒 2.70m）
const HCAP=6.60;      // 控高线
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

function wing(g,name,L,W,ph,bh,ohIn,ohOut,mStone,mWood,mTile,angle,px,py,inset){
  inset=inset===undefined?0.55:inset;
  const w=new THREE.Group();
  w.add(box(0,0,ph/2,L,W,ph,mStone));                       // 毛石墙裙／台基
  w.add(box(0,0,ph+bh/2,L-0.3,W-inset*2,bh,mWood));         // 木身（内退形成檐下）
  const he=ph+bh;                                           // 檐口高（锁定 2.70m）
  const HL=L/2+1.2, HIn=W/2+ohIn, HOut=W/2+ohOut;           // 局部 +Y＝背中庭，-Y＝朝中庭
  const run=(HIn+HOut)/2, yr=(HOut-HIn)/2;                  // 等坡 → 脊偏心
  const hr=he+run*SLOPE;                                    // 瓦坡 1:2.2（24.4°），脊高由跨度反推
  const v=[[-HL,-HIn,he],[HL,-HIn,he],[HL,HOut,he],[-HL,HOut,he],[-HL,yr,hr],[HL,yr,hr]];
  const f=[[0,1,5,4],[3,4,5,2],[0,4,3],[1,2,5],[0,3,2,1]];
  w.add(poly(v,f,mTile));
  w.rotation.z=angle; w.position.set(px,py,0); w.name=name;
  g.add(w); return {g:w, ridge:hr, eave:he};
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

function courtLife(g,cx,cy,spread,n,z0){
  z0=z0||0;
  const mr=M(C.ring,.95), mf=M(C.fire,.35), mp=M(C.person,.9);
  g.add(cyl(1.2,1.2,0.55,18,cx,cy,z0+0.27,mr));
  g.add(cyl(0,0.72,1.6,10,cx,cy,z0+1.05,mf));
  const R=rng(11), U=(a,b)=>a+R()*(b-a);
  for(let i=0;i<n;i++){
    const a=U(0,Math.PI*2), r=U(2.6,spread);
    g.add(cyl(0.27,0.27,1.72,8,cx+Math.cos(a)*r,cy+Math.sin(a)*r,z0+0.86,mp));
  }
}

// ── S1：三条瓦屋面功能边（酿造/工坊/酒馆）切于同一中庭的「微展开三角」；
//    靠山＝酿造边背后的毛石承重挡土厚墙＋山体，不是第四条主形边。
//    檐口恒 2.70m、瓦坡 1:2.2、脊高由各边跨度反推，全部在 6.6m 控高线下（R10/R11 锁定值）。
export function buildS1(){
  const g=new THREE.Group(); terrain(g,7);
  const mT=M(C.tile,.88), mS=M(C.stone,.93), mW=M(C.wood,.86), mG=M(C.ground,.96);
  const PH=1.40, BH=EAVE-PH, OI=3.00, OO=1.20;   // 墙裙1.4＋木身1.3＝檐口2.7；朝中庭挑3.0（净深3.55≥G30）
  const d=12.4, P=deg=>[Math.cos(deg*Math.PI/180)*d, Math.sin(deg*Math.PI/180)*d];
  const pB=P(90), pS=P(210), pT=P(330);
  // 跨度不同 → 脊高不同（§12.2 起伏只由功能/跨度产生）：酿造 11.0m 跨最高，酒馆 7.4m 跨最低
  const wB=wing(g,'brew',27,11.0,PH,BH,OI,OO,mS,mW,mT,          0, pB[0],pB[1]);
  const wS=wing(g,'shop',24, 9.0,PH,BH,OI,OO,mS,mW,mT,120*Math.PI/180, pS[0],pS[1]);
  const wT=wing(g,'tav', 22, 7.4,PH,BH,OI,OO,mS,mW,mT,240*Math.PI/180, pT[0],pT[1]);
  if(Math.max(wB.ridge,wS.ridge,wT.ridge)>HCAP) console.warn('S1 脊高超控高线');

  // 靠山：山体坡＋毛石承重挡土厚墙（承载 1 号仓储 / 20 号陈酿），退让出檐沟检修带
  const YF=22.9, YB=36, ZF=4.6, ZB=10;
  g.add(poly(
    [[-20,YF,-1],[20,YF,-1],[26,YB,-1],[-26,YB,-1],
     [-20,YF,ZF],[20,YF,ZF],[26,YB,ZB],[-26,YB,ZB]],
    [[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[0,3,2,1]], mG));
  g.add(box(0,22.0,2.3, 40,1.6,4.6, mS));
  g.add(box(-6.5,21.1,1.4, 3.2,0.5,2.8, mS));            // 外部货运口门垛（1号后勤入口）
  const zSurf=y=>ZF+(y-YF)/(YB-YF)*(ZB-ZF);
  [[-13,24.6],[-11.3,25.8],[9.5,24.4],[11.4,25.6],[13.1,24.5]].forEach(p=>
    g.add(cyl(0.42,0.52,0.95,12,p[0],p[1],zSurf(p[1])+0.48,mS)));   // 台地上的陈酿酒坛（坐在坡面上）

  // 中庭：非对称，火塘偏向酒馆边，廊下坐沿切出一个停留岛（§7.3 无中心构筑）
  g.add(box(6.0,-6.2,0.26, 9.0,0.9,0.52, mS));
  courtLife(g,1.8,-3.0,5.0,13);
  return g;
}

// ── A：突破的是「三角形状」，守住的是「三条功能边直对同一中庭」。
//    三边顺山谷三条真实臂的方位张开、且明显外拉，中庭从三角内切变成三臂交汇的敞口场。
//    转角不收口——留大开口是本案的性格，也是它最难的节点（屋面收口与谷线防漏，待专项）。
export function buildA(){
  const g=new THREE.Group(); terrain(g,7);
  const mT=M(C.tile,.88), mS=M(C.stone,.93), mW=M(C.wood,.86);
  const PH=1.40, BH=EAVE-PH, OI=3.00, OO=1.20;
  const d=15.0;
  // 法向＝山谷三臂方位（95° / −25° / −150°）；边的长轴垂直于法向 → 仍是切向功能边，不是径向臂
  const edges=[['brew',  95,21,11.0],['shop',-25,19,9.0],['tav',-150,18,7.4]];
  let hi=0;
  edges.forEach(([n,deg,L,W])=>{
    const nrm=deg*Math.PI/180, ax=nrm-Math.PI/2;
    const w=wing(g,n,L,W,PH,BH,OI,OO,mS,mW,mT,ax,Math.cos(nrm)*d,Math.sin(nrm)*d);
    hi=Math.max(hi,w.ridge);
  });
  if(hi>HCAP) console.warn('A 脊高超控高线');
  courtLife(g,-2.2,-2.6,7.0,15);
  return g;
}

// ── B：单一混凝土体量、中央挖出下沉火塘院。三翼由转角连接体连成一栋
//    （§7 禁止拆成多个独立体块；推导中已选定「做法②：单一体量内部挖院」）。
//    总高压在 6.6m 控高线内；折面向外出挑补足遮阳排水；穿插生产条两端都有落点。
export function buildB(){
  const g=new THREE.Group(); terrain(g,7);
  const mC=M(C.concrete,.80), mS=M(C.stone,.93), mW=M(C.woodB,.8), mG=M(C.glass,.22,.15);
  const PL=0.8, OI=1.2, OO=2.5, RC=8.5;        // RC＝中庭内边半径
  const wings=[['brew',  95,21,11.0,3.9],['shop',-25,19,10.0,3.4],['tav',-150,18,10.0,2.9]];
  wings.forEach(([n,deg,L,W,H])=>{
    const nrm=deg*Math.PI/180, ax=nrm-Math.PI/2, d=RC+W/2, w=new THREE.Group();
    w.add(box(0,0,PL/2,L*1.03,W*1.03,PL,mS));
    w.add(box(0,0,PL+H/2,L,W,H,mC));
    const hz=PL+H, HL=L/2+1.0, HI=W/2+OI, HO=W/2+OO;
    w.add(poly([[-HL,-HI,hz],[HL,-HI,hz],[HL,HO,hz],[-HL,HO,hz],[-HL,-HI,hz+1.9],[HL,-HI,hz+1.9]],
               [[0,1,5,4],[4,5,2,3],[0,4,3],[1,2,5],[0,3,2,1]],mC));
    w.rotation.z=ax; w.position.set(Math.cos(nrm)*d,Math.sin(nrm)*d,0); w.name=n;
    g.add(w);
  });
  // 三处转角连接体：把三翼连成一栋，中央仍是一个被抱住的院
  [[35,3.1],[-87.5,2.9],[172.5,2.9]].forEach(([deg,H])=>{
    const a=deg*Math.PI/180, r=RC+4.6, k=new THREE.Group();
    k.add(box(0,0,PL/2, 11.0,9.4,PL, mS));
    k.add(box(0,0,PL+H/2, 10.4,8.8,H, mC));
    k.rotation.z=a-Math.PI/2; k.position.set(Math.cos(a)*r,Math.sin(a)*r,0);
    g.add(k);
  });
  // 中央下沉火塘院：1:2 缓坡、下沉 1.2m（原 2.5m 陡壁挖方过大且无台阶）
  const R=7.6, Ri=4.6, DZ=-1.2, v=[], f=[];
  for(let i=0;i<6;i++)v.push([Math.cos(Math.PI*2*i/6)*R,Math.sin(Math.PI*2*i/6)*R,0.2]);
  for(let i=0;i<6;i++)v.push([Math.cos(Math.PI*2*i/6)*Ri,Math.sin(Math.PI*2*i/6)*Ri,DZ]);
  for(let i=0;i<6;i++)f.push([i,(i+1)%6,6+(i+1)%6,6+i]);
  f.push([6,7,8,9,10,11]);
  g.add(poly(v,f,mS));
  // 穿插的木／玻洁净生产条：两端都落在体量上，不做无支撑长悬挑
  const a=-25*Math.PI/180, bar=new THREE.Group();
  bar.add(box(0,0,PL+2.4, 26,3.4,2.4, mG));
  bar.add(box(0,0,PL+3.7, 26,3.6,0.5, mW));
  bar.rotation.z=a; g.add(bar);
  courtLife(g,0.9,-1.1,3.2,12,DZ);
  return g;
}

export const BUILD={S1:buildS1,A:buildA,B:buildB};
