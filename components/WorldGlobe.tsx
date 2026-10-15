'use client';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {Globe2,Pause,Play,Plus,Minus,RotateCcw,MapPin,Compass} from 'lucide-react';
import type {Signal} from '@/lib/types';

const DEG=Math.PI/180;
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
const color:Record<string,string>={earth:'#ffac77',nature:'#66e4ab',space:'#bd9bff',tech:'#61b7fa',science:'#ffe095',world:'#ed92b8',economy:'#ffd166',health:'#ff7c94',climate:'#62e0ce',culture:'#c5a9ff',sports:'#90be6d',ai:'#a6d4ff',energy:'#edac80'};
const radians=(v:number)=>v*DEG;
const unit=(lat:number,lon:number)=>{const a=radians(lat),b=radians(lon);return [Math.cos(a)*Math.sin(b),Math.sin(a),Math.cos(a)*Math.cos(b)];};
type Props={signals:Signal[];onChoose:(s:Signal)=>void;selected?:string;compact?:boolean;language?:'el'|'en'};
type Projected={x:number;y:number;depth:number;signal:Signal};

export default function WorldGlobe({signals,onChoose,selected,compact=false,language='el'}:Props){
 const t=(el:string,en:string)=>language==='el'?el:en;
 const mount=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null);
 const offscreen=useRef<HTMLCanvasElement|null>(null),texture=useRef<ImageData|null>(null),image=useRef<ImageData|null>(null);
 const camera=useRef({lon:21,lat:17,zoom:1,drag:false,moved:false,lastX:0,lastY:0});
 const [paused,setPaused]=useState(false),[loaded,setLoaded]=useState(false),[hovered,setHovered]=useState<Signal|null>(null),[selectedCategory,setSelectedCategory]=useState<'all'|'earth'|'nature'>('all');
 const projected=useRef<Projected[]>([]),latest=useRef<Signal[]>([]),playing=useRef(true),hoverRef=useRef<string|null>(null);
 const points=useMemo(()=>signals.filter(s=>Number.isFinite(s.lat)&&Number.isFinite(s.lon)&&Math.abs(s.lat!)<=90&&Math.abs(s.lon!)<=180).slice(0,310),[signals]);
 latest.current=points.filter(s=>selectedCategory==='all'||s.category===selectedCategory);
 playing.current=!paused;
 const draw=useCallback(()=>{
  const el=canvas.current,base=offscreen.current,tex=texture.current,buffer=image.current;
  if(!el||!base||!tex||!buffer)return;
  const ctx=el.getContext('2d',{alpha:true});const bctx=base.getContext('2d',{alpha:true});if(!ctx||!bctx)return;
  const d=base.width,N=d*d;const rgb=buffer.data,pix=tex.data,tw=tex.width,th=tex.height;
  const {lon,lat,zoom}=camera.current;const L=radians(lon),B=radians(lat),cl=Math.cos(L),sl=Math.sin(L),cb=Math.cos(B),sb=Math.sin(B);
  const rx=cl,rz=-sl,ux=-sb*sl,uy=cb,uz=-sb*cl,cx=cb*sl,cy=sb,cz=cb*cl;
  const mid=(d-1)/2,rad=d*.472;const shadeSun=[-.32,.58,.80];
  for(let i=0;i<N;i++){
   const j=i*4,x=((i%d)-mid)/rad,y=(mid-Math.floor(i/d))/rad,r2=x*x+y*y;
   if(r2>1){rgb[j]=0;rgb[j+1]=0;rgb[j+2]=0;rgb[j+3]=0;continue}
   const z=Math.sqrt(1-r2),vx=rx*x+ux*y+cx*z,vy=uy*y+cy*z,vz=rz*x+uz*y+cz*z;
   const longitude=Math.atan2(vx,vz),latitude=Math.asin(clamp(vy,-1,1));
   const tx=((longitude/Math.PI+1)*.5*tw)|0,ty=((.5-latitude/Math.PI)*th)|0;
   const ti=(clamp(ty,0,th-1)*tw+clamp(tx,0,tw-1))*4;
   const illumination=clamp(.40+(.34*x+.59*y+.82*z)*.58,.16,1.18);
   const atmosphere=(1-z)*18;
   rgb[j]=clamp(pix[ti]*illumination+atmosphere*.09,0,255);
   rgb[j+1]=clamp(pix[ti+1]*illumination+atmosphere*.56,0,255);
   rgb[j+2]=clamp(pix[ti+2]*illumination+atmosphere*.94,0,255);
   rgb[j+3]=255;
  }
  bctx.putImageData(buffer,0,0);
  const size=Math.min(el.clientWidth,el.clientHeight)||400;const dpr=Math.min(window.devicePixelRatio||1,1.8),resolution=Math.round(size*dpr);
  if(el.width!==resolution||el.height!==resolution){el.width=resolution;el.height=resolution}
  const c=el.width,r=c*.462*zoom;
  ctx.clearRect(0,0,c,c);
  const glow=ctx.createRadialGradient(c/2,c/2,r*.72,c/2,c/2,r*1.23);
  glow.addColorStop(0,'rgba(48,151,205,0)');glow.addColorStop(.71,'rgba(46,144,216,.04)');glow.addColorStop(.81,'rgba(55,152,223,.20)');glow.addColorStop(.96,'rgba(16,96,186,.035)');glow.addColorStop(1,'rgba(10,45,74,0)');
  ctx.fillStyle=glow;ctx.beginPath();ctx.arc(c/2,c/2,r*1.24,0,Math.PI*2);ctx.fill();
  ctx.save();ctx.shadowColor='rgba(35,148,248,.25)';ctx.shadowBlur=25*dpr;
  ctx.beginPath();ctx.arc(c/2,c/2,r,0,Math.PI*2);ctx.clip();ctx.drawImage(base,c/2-r,c/2-r,r*2,r*2);
  const blue=ctx.createLinearGradient(c/2-r,c/2-r,c/2+r,c/2+r);blue.addColorStop(0,'rgba(92,174,245,.19)');blue.addColorStop(.40,'rgba(69,137,215,0)');blue.addColorStop(1,'rgba(0,8,16,.52)');ctx.fillStyle=blue;ctx.fillRect(c/2-r,c/2-r,r*2,r*2);
  ctx.restore();
  ctx.beginPath();ctx.arc(c/2,c/2,r,0,Math.PI*2);ctx.strokeStyle='rgba(107,198,248,.28)';ctx.lineWidth=dpr*1.2;ctx.stroke();
  // Geographical graticule, projected to the visible hemisphere.
  ctx.save();ctx.beginPath();ctx.arc(c/2,c/2,r,0,Math.PI*2);ctx.clip();ctx.lineWidth=.65*dpr;ctx.strokeStyle='rgba(206,239,250,.13)';
  const project=(latP:number,lonP:number):[number,number,number]=>{const u=unit(latP,lonP),px=u[0]*rx+u[2]*rz,py=u[0]*ux+u[1]*uy+u[2]*uz,pz=u[0]*cx+u[1]*cy+u[2]*cz;return[c/2+px*r,c/2-py*r,pz]};
  for(let la=-60;la<=60;la+=30){ctx.beginPath();let move=true;for(let lo=-180;lo<=180;lo+=2){let [x,y,z]=project(la,lo);if(z>0){if(move){ctx.moveTo(x,y);move=false}else ctx.lineTo(x,y)}else move=true}ctx.stroke()}
  for(let lo=-180;lo<180;lo+=30){ctx.beginPath();let move=true;for(let la=-90;la<=90;la+=2){let [x,y,z]=project(la,lo);if(z>0){if(move){ctx.moveTo(x,y);move=false}else ctx.lineTo(x,y)}else move=true}ctx.stroke()}
  ctx.restore();
  let all:Projected[]=[];
  for(const s of latest.current){const [x,y,z]=project(s.lat!,s.lon!);if(z<=0)continue;all.push({x,y,depth:z,signal:s});}
  all.sort((a,b)=>a.depth-b.depth);
  for(const p of all){const isSelected=p.signal.id===selected,isHover=p.signal.id===hoverRef.current;
   const col=color[p.signal.category]||'#8ef5b2',radius=(isSelected?6.2:isHover?5.4:p.signal.category==='earth'?3.5:4.2)*dpr;
   ctx.globalAlpha=clamp(.48+p.depth*.52,.3,1);
   ctx.fillStyle=col;ctx.strokeStyle='rgba(8,17,26,.86)';ctx.lineWidth=1.5*dpr;ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.fill();ctx.stroke();
   if(isSelected||isHover||p.signal.score>=90){ctx.globalAlpha=.55;ctx.strokeStyle=col;ctx.beginPath();ctx.arc(p.x,p.y,radius+6*dpr,0,Math.PI*2);ctx.stroke()}
  }
  ctx.globalAlpha=1;projected.current=all;
 },[selected]);
 useEffect(()=>{
  let alive=true;const img=new Image();img.src='/earth-texture.jpg';img.onload=()=>{if(!alive)return;let off=document.createElement('canvas');off.width=img.naturalWidth;off.height=img.naturalHeight;const c=off.getContext('2d',{willReadFrequently:true});if(!c)return;c.drawImage(img,0,0);texture.current=c.getImageData(0,0,off.width,off.height);
   const paint=document.createElement('canvas');paint.width=compact?230:300;paint.height=paint.width;offscreen.current=paint;image.current=paint.getContext('2d')!.createImageData(paint.width,paint.height);setLoaded(true);draw()};
  return()=>{alive=false}
 },[compact,draw]);
 useEffect(()=>{if(!loaded)return;let frame=0,last=0;const animate=(time:number)=>{if(time-last>52){if(playing.current&&!camera.current.drag)camera.current.lon=(camera.current.lon+.11)%360;draw();last=time}frame=requestAnimationFrame(animate)};frame=requestAnimationFrame(animate);return()=>cancelAnimationFrame(frame)},[loaded,draw]);
 useEffect(()=>{if(!mount.current)return;const obs=new ResizeObserver(()=>draw());obs.observe(mount.current);return()=>obs.disconnect()},[draw]);
 const pointer=(e:React.PointerEvent<HTMLCanvasElement>)=>{const rect=e.currentTarget.getBoundingClientRect(),factor=e.currentTarget.width/rect.width;return{x:(e.clientX-rect.left)*factor,y:(e.clientY-rect.top)*factor}};
 const onDown=(e:React.PointerEvent<HTMLCanvasElement>)=>{e.currentTarget.setPointerCapture(e.pointerId);camera.current.drag=true;camera.current.moved=false;camera.current.lastX=e.clientX;camera.current.lastY=e.clientY;setHovered(null)};
 const onMove=(e:React.PointerEvent<HTMLCanvasElement>)=>{const v=camera.current;if(v.drag){const dx=e.clientX-v.lastX,dy=e.clientY-v.lastY;if(Math.abs(dx)+Math.abs(dy)>1)v.moved=true;v.lon=(v.lon-dx*.31)%360;v.lat=clamp(v.lat+dy*.25,-75,75);v.lastX=e.clientX;v.lastY=e.clientY;return}const p=pointer(e),limit=18*Math.min(window.devicePixelRatio||1,1.8);let m=projected.current.filter(x=>Math.hypot(x.x-p.x,x.y-p.y)<limit).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];hoverRef.current=m?.signal.id||null;setHovered(m?.signal||null)};
 const onUp=(e:React.PointerEvent<HTMLCanvasElement>)=>{const moved=camera.current.moved;camera.current.drag=false;if(moved)return;const p=pointer(e),limit=18*Math.min(window.devicePixelRatio||1,1.8);const hit=projected.current.filter(x=>Math.hypot(x.x-p.x,x.y-p.y)<limit).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];if(hit)onChoose(hit.signal)};
 const focus=(s:Signal)=>{if(Number.isFinite(s.lon)&&Number.isFinite(s.lat)){camera.current.lon=s.lon!;camera.current.lat=clamp(s.lat!,-75,75);draw()}onChoose(s)};
 return <div className={'globe-dashboard '+(compact?'globe-compact':'')} ref={mount}>
  <div className="globe-stars" aria-hidden="true"/>
  <div className="globe-topline"><div><span className="globe-live"/><span>{t('ΠΑΡΑΤΗΡΗΣΗ ΤΗΣ ΓΗΣ','PLANETARY OBSERVATION')}</span></div><span>{t('3D ΥΔΡΟΓΕΙΟΣ • ΠΡΑΓΜΑΤΙΚΕΣ ΣΥΝΤΕΤΑΓΜΕΝΕΣ','INTERACTIVE GLOBE • SOURCE COORDINATES')}</span></div>
  <div className="globe-stage"><canvas aria-label={t(`Περιστρεφόμενη υδρόγειος με ${points.length} γεωγραφικά καταγεγραμμένα σήματα.`, `Interactive rotating globe with ${points.length} geolocated records.`)} ref={canvas} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={()=>{camera.current.drag=false}} onPointerLeave={()=>{hoverRef.current=null;setHovered(null)}} onWheel={e=>{camera.current.zoom=clamp(camera.current.zoom-e.deltaY*.00055,.66,1.04);draw()}} />{!loaded&&<div className="globe-loading">{t('Φόρτωση υδρογείου…','Rendering Earth…')}</div>}
  <div className="globe-axis-label axis-north">90° N</div><div className="globe-axis-label axis-south">90° S</div>
  {hovered&&<div className="globe-hover"><b>{hovered.title}</b><span>{hovered.source} · {hovered.score}/100</span></div>}
  </div>
  <div className="globe-panel-controls"><div className="globe-channel-filter">{([['all',t('ΟΛΑ','ALL')],['earth',t('ΣΕΙΣΜΟΙ','QUAKES')],['nature',t('ΦΥΣΗ','NATURE')]] as const).map(([id,label])=><button key={id} onClick={()=>setSelectedCategory(id)} className={selectedCategory===id?'on':''}>{label}</button>)}</div><div className="globe-buttons"><button onClick={()=>setPaused(p=>!p)} title={paused?t('Αυτόματη περιστροφή','Auto rotate'):t('Παύση περιστροφής','Pause rotation')}>{paused?<Play size={15}/>:<Pause size={15}/>}</button><button onClick={()=>{camera.current.zoom=clamp(camera.current.zoom+.12,.66,1.04);draw()}} title={t('Μεγέθυνση','Zoom in')}><Plus size={16}/></button><button onClick={()=>{camera.current.zoom=clamp(camera.current.zoom-.12,.66,1.04);draw()}} title={t('Σμίκρυνση','Zoom out')}><Minus size={16}/></button><button onClick={()=>{camera.current.lon=21;camera.current.lat=17;camera.current.zoom=1;draw()}} title={t('Επαναφορά','Reset view')}><RotateCcw size={15}/></button></div></div>
  <div className="globe-eventbar"><div><MapPin size={15}/><b>{points.length}</b><span>{t('ΓΕΩΓΡΑΦΙΚΑ ΣΗΜΑΤΑ','GEOLOCATED RECORDS')}</span></div><div><Compass size={15}/><span>{t('ΣΥΡΕ ΓΙΑ ΠΕΡΙΣΤΡΟΦΗ · ΠΑΤΑ ΕΝΑ ΣΗΜΕΙΟ','DRAG TO ROTATE · TAP A DOT')}</span></div></div>
  {!compact&&<div className="globe-signal-tray"><div className="globe-tray-heading">{t('ΣΗΜΑΤΑ ΣΤΟΝ ΧΑΡΤΗ','LOCATE ON EARTH')} <span>{t('ΠΑΤΑ ΓΙΑ ΕΣΤΙΑΣΗ','SELECT TO FOCUS')}</span></div><div className="globe-tray-list">{points.slice(0,12).map(s=><button key={s.id} onClick={()=>focus(s)}><span style={{background:color[s.category]}}/><span>{s.title}</span><b>↗</b></button>)}</div></div>}
  <p className="globe-fineprint">{t('Αποτυπώνονται μόνο συμβάντα με συντεταγμένες από την πηγή. Ειδήσεις χωρίς επαληθεύσιμη γεωγραφική θέση δεν εμφανίζονται στη Γη. Εικονογραφημένη υφή Natural Earth, όχι δορυφορική φωτογραφία.','Only events with coordinates from their sources are mapped. News without source coordinates is not plotted. Illustrated Natural Earth texture, not satellite imagery.')}</p>
 </div>
}
