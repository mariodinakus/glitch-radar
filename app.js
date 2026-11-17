(function vibecessionApp() {
"use strict";
const countries=[["AT","Αυστρία","🇦🇹"],["BE","Βέλγιο","🇧🇪"],["BG","Βουλγαρία","🇧🇬"],["HR","Κροατία","🇭🇷"],["CY","Κύπρος","🇨🇾"],["CZ","Τσεχία","🇨🇿"],["DK","Δανία","🇩🇰"],["EE","Εσθονία","🇪🇪"],["FI","Φινλανδία","🇫🇮"],["FR","Γαλλία","🇫🇷"],["DE","Γερμανία","🇩🇪"],["EL","Ελλάδα","🇬🇷"],["HU","Ουγγαρία","🇭🇺"],["IE","Ιρλανδία","🇮🇪"],["IT","Ιταλία","🇮🇹"],["LV","Λετονία","🇱🇻"],["LT","Λιθουανία","🇱🇹"],["LU","Λουξεμβούργο","🇱🇺"],["MT","Μάλτα","🇲🇹"],["NL","Ολλανδία","🇳🇱"],["PL","Πολωνία","🇵🇱"],["PT","Πορτογαλία","🇵🇹"],["RO","Ρουμανία","🇷🇴"],["SK","Σλοβακία","🇸🇰"],["SI","Σλοβενία","🇸🇮"],["ES","Ισπανία","🇪🇸"],["SE","Σουηδία","🇸🇪"]];
const config={
 conf:{code:"ei_bsco_m",params:{freq:"M",indic:"BS-CSMCI",s_adj:"SA",unit:"BAL",sinceTimePeriod:"2016-01"},maxAge:7},
 gdp:{code:"namq_10_gdp",params:{freq:"Q",na_item:"B1GQ",unit:"CLV_PCH_SM",s_adj:"SCA",sinceTimePeriod:"2016-Q1"},maxAge:15},
 hicp:{code:"prc_hicp_minr",params:{freq:"M",unit:"RCH_A",coicop18:"TOTAL",sinceTimePeriod:"2016-01"},maxAge:7},
 unemp:{code:"une_rt_m",params:{freq:"M",s_adj:"SA",age:"TOTAL",sex:"T",unit:"PC_ACT",sinceTimePeriod:"2016-01"},maxAge:9}};
const $=id=>document.getElementById(id);
const fmt=(v,d=1)=>Number.isFinite(v)?v.toLocaleString("el-GR",{minimumFractionDigits:d,maximumFractionDigits:d}):"—";
const signed=(v,d=2)=>Number.isFinite(v)?(v>0?"+":"")+fmt(v,d):"—";
const clamp=(x,min,max)=>Math.min(max,Math.max(min,x));
let rows=[],chosen="EL",filter="all",needle="",busy=false;
const labels={
 vibecession:{label:"ΠΙΘΑΝΗ VIBECESSION",desc:"Η καταναλωτική εμπιστοσύνη είναι αισθητά χειρότερη από το ιστορικό της επίπεδο, ενώ τα βασικά οικονομικά μεγέθη εμφανίζονται σχετικά ανθεκτικά."},
 stress:{label:"ΟΙΚΟΝΟΜΙΚΗ ΠΙΕΣΗ",desc:"Η χαμηλή εμπιστοσύνη συμβαδίζει με επιδείνωση των βασικών μακροοικονομικών δεικτών. Δεν πρόκειται απαραιτήτως για vibecession."},
 mixed:{label:"ΧΩΡΙΣ ΣΑΦΗ ΑΠΟΚΛΙΣΗ",desc:"Τα δεδομένα δεν πληρούν τα πειραματικά κριτήρια vibecession. Δεν αποκλείονται οικονομικές δυσκολίες για τα νοικοκυριά."},
 missing:{label:"ΑΝΕΠΑΡΚΗ ΔΕΔΟΜΕΝΑ",desc:"Δεν υπάρχουν πλήρεις πρόσφατες χρονοσειρές για αξιόπιστη αξιολόγηση αυτής της χώρας."}
};
function decode(payload) {
 const ids=payload?.id, sizes=payload?.size,dim=payload?.dimension;
 if(!Array.isArray(ids)||!Array.isArray(sizes)||!dim)throw Error("Μη έγκυρη δομή Eurostat");
 const gi=ids.indexOf("geo"),ti=ids.indexOf("time");
 if(gi<0||ti<0)throw Error("Λείπουν οι διαστάσεις geo/time");
 function index(k) {
  const raw=dim[k]?.category?.index;
  return Array.isArray(raw)?Object.fromEntries(raw.map((v,i)=>[v,i])):raw&&typeof raw==="object"?raw:{};
 }
 const geos=index("geo"),times=index("time"),stride=sizes.map((v,i)=>sizes.slice(i+1).reduce((a,b)=>a*b,1));
 const value=payload.value||{},all={};
 for(const [code] of countries) {
  const a=[];
  if(geos[code]!==undefined)for(const [period,t] of Object.entries(times)){
   const offset=ids.reduce((sum,id,i)=>sum+(id==="geo"?geos[code]:id==="time"?t:0)*stride[i],0);
   const x=value[offset];
   if(x!==null&&x!==undefined&&Number.isFinite(Number(x)))a.push({period,value:Number(x)});
  }
  all[code]=a.sort((x,y)=>x.period.localeCompare(y.period));
 }
 return all;
}
async function fetchSeries(key,override={}) {
 const src=config[key],params=new URLSearchParams({...src.params,...override});
 for(const [code] of countries)params.append("geo",code);
 params.set("lang","EN");
 const ac=new AbortController(),timeout=setTimeout(()=>ac.abort(),32000);
 try {
  const response=await fetch("https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/"+src.code+"?"+params,{signal:ac.signal,cache:"no-store"});
  if(!response.ok)throw Error(src.code+" · HTTP "+response.status);
  const parsed=decode(await response.json());
  if(!Object.values(parsed).some(series=>series.length))throw Error(src.code+" · δεν υπάρχουν παρατηρήσεις");
  return parsed;
 } finally {clearTimeout(timeout);}
}
function periodDate(period) {
 const m=/^(\d{4})-(?:Q([1-4])|(\d{2}))$/.exec(period||"");
 if(!m)return null;
 return new Date(Date.UTC(+m[1],m[2]?+m[2]*3:+m[3],0));
}
function recent(point,key) {
 if(!point)return false;
 const date=periodDate(point.period);
 if(!date)return false;
 const now=new Date(),months=(now.getUTCFullYear()-date.getUTCFullYear())*12+now.getUTCMonth()-date.getUTCMonth();
 return months>=-2&&months<=config[key].maxAge;
}
function zscore(series,last,key) {
 if(!recent(last,key))return null;
 const history=series.filter(p=>{const y=+p.period.slice(0,4);return y>=2016&&y<=2024}).map(p=>p.value);
 const minimum=key==="gdp"?16:36;
 if(history.length<minimum)return null;
 const mean=history.reduce((a,b)=>a+b,0)/history.length;
 const std=Math.sqrt(history.reduce((a,b)=>a+(b-mean)**2,0)/history.length);
 return std>.1?clamp((last.value-mean)/std,-3,3):null;
}
function calculate(data){
 return countries.map(([code,name,flag])=>{
  const series={},latest={},z={};
  for(const key of Object.keys(config)){
   series[key]=data[key]?.[code]||[];
   latest[key]=series[key].at(-1)||null;
   z[key]=zscore(series[key],latest[key],key);
  }
  const ok=Object.values(z).every(Number.isFinite);
  const fundamentals=ok?clamp(.45*z.gdp-.30*z.unemp-.25*z.hicp,-3,3):null;
  const gap=ok?fundamentals-z.conf:null;
  const status=!ok?"missing":gap>=1.15&&z.conf<=-.45&&fundamentals>=-.25?"vibecession":z.conf<=-.45&&fundamentals<-.45?"stress":"mixed";
  return {code,name,flag,series,latest,z,fundamentals,gap,status};
 });
}
function metric(id,p,suffix) {
 $(id).textContent=p?fmt(p.value)+suffix:"—";
 $(id+"-period").textContent=p?"Eurostat · "+p.period:"Μη διαθέσιμο";
}
function trend(series) {
 const sample=series.slice(-36),node=$("trend-chart");
 if(sample.length<2){node.innerHTML='<div class="chart-empty">Δεν υπάρχουν επαρκείς παρατηρήσεις</div>';return;}
 const W=760,H=215,L=48,R=22,T=22,B=34;
 const values=sample.map(x=>x.value),min=Math.floor((Math.min(...values)-3)/5)*5,max=Math.ceil((Math.max(...values)+3)/5)*5;
 const x=i=>L+i*(W-L-R)/(sample.length-1),y=v=>T+(max-v)/(max-min||1)*(H-T-B);
 const line=sample.map((p,i)=>(i?"L":"M")+x(i).toFixed(1)+" "+y(p.value).toFixed(1)).join(" ");
 const grid=[0,1,2,3,4].map(i=>{const v=min+(max-min)*i/4;return `<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="#29404b" stroke-dasharray="4 6"/><text x="${L-8}" y="${y(v)+4}" text-anchor="end" fill="#7e929f" font-size="11">${fmt(v,0)}</text>`}).join("");
 const ticks=[0,Math.floor(sample.length/2),sample.length-1].map((i,j)=>`<text x="${x(i)}" y="${H-7}" fill="#79909c" text-anchor="${j===0?"start":j===2?"end":"middle"}" font-size="11">${sample[i].period}</text>`).join("");
 node.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Ιστορική καταναλωτική εμπιστοσύνη"><defs><linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#65e5d6" stop-opacity=".25"/><stop offset="1" stop-color="#65e5d6" stop-opacity="0"/></linearGradient></defs>${grid}<path d="${line} L${x(sample.length-1)} ${H-B} L${L} ${H-B} Z" fill="url(#f)"/><path d="${line}" stroke="#65e5d6" stroke-width="2.7" fill="none"/>${ticks}</svg>`;
}
function scatter(){
 const node=$("scatter-chart"),valid=rows.filter(r=>r.status!=="missing");
 if(!valid.length){node.innerHTML='<div class="chart-empty">Δεν υπάρχουν αρκετά πρόσφατα δεδομένα</div>';return;}
 const W=1080,H=355,L=68,R=28,T=30,B=50;
 const x=v=>L+(clamp(v,-3,3)+3)/6*(W-L-R),y=v=>T+(3-clamp(v,-3,3))/6*(H-T-B);
 const grid=[-3,-2,-1,0,1,2,3].map(n=>`<line x1="${x(n)}" y1="${T}" x2="${x(n)}" y2="${H-B}" stroke="#253542"/><line x1="${L}" y1="${y(n)}" x2="${W-R}" y2="${y(n)}" stroke="#253542"/><text x="${x(n)}" y="${H-B+19}" fill="#7b92a0" text-anchor="middle" font-size="11">${n}</text><text x="${L-12}" y="${y(n)+3}" fill="#7b92a0" text-anchor="end" font-size="11">${n}</text>`).join("");
 const dots=valid.map(r=>{const sel=r.code===chosen,c=r.status==="vibecession"?"#65e5d6":r.status==="stress"?"#f1ac91":"#94aac1";return `<g data-plot="${r.code}" tabindex="0" role="button" aria-label="${r.name}"><title>${r.name} — gap ${signed(r.gap)}</title><circle cx="${x(r.z.conf)}" cy="${y(r.fundamentals)}" r="${sel?9:6.5}" fill="${c}" stroke="${sel?"#f9ffff":"#101a22"}" stroke-width="${sel?3:2}"/>${sel?`<text x="${x(r.z.conf)+13}" y="${y(r.fundamentals)-11}" fill="#f6ffff" font-size="13">${r.code}</text>`:""}</g>`}).join("");
 node.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="group" aria-label="Καταναλωτική εμπιστοσύνη στον οριζόντιο άξονα, μακροοικονομικοί δείκτες στον κάθετο"><rect x="${L}" y="${T}" width="${x(0)-L}" height="${y(0)-T}" fill="#143a34"/><text x="${L+14}" y="${T+25}" fill="#65e5d6" font-size="15">VIBECESSION ZONE</text>${grid}${dots}<text x="${W/2}" y="${H-4}" fill="#90a9b8" text-anchor="middle" font-size="13">CONSUMER CONFIDENCE (Z) →</text><text transform="translate(18 ${H/2}) rotate(-90)" text-anchor="middle" fill="#90a9b8" font-size="12">FUNDAMENTALS (Z) →</text></svg>`;
 node.querySelectorAll("[data-plot]").forEach(p=>{p.addEventListener("click",()=>select(p.dataset.plot));p.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();select(p.dataset.plot)}})});
}
function details(){
 const r=rows.find(r=>r.code===chosen);if(!r)return;
 $("detail-flag").textContent=r.flag;$("detail-name").textContent=r.name;
 $("detail-gap").textContent=signed(r.gap);
 $("detail-status").className="status-class "+r.status;
 $("detail-status").textContent=labels[r.status].label;
 $("detail-summary").textContent=labels[r.status].desc;
 metric("detail-conf",r.latest.conf," bal");
 metric("detail-gdp",r.latest.gdp,"%");
 metric("detail-hicp",r.latest.hicp,"%");
 metric("detail-unemp",r.latest.unemp,"%");
 $("detail-stamp").textContent="Οι δείκτες έχουν διαφορετικές περιόδους αναφοράς. Πειραματική σύγκριση με το ιστορικό 2016–2024, όχι επίσημη ταξινόμηση.";
 trend(r.series.conf);
}
function list(){
 const result=rows.filter(r=>(filter==="all"||r.status===filter)&&(r.name.toLocaleLowerCase("el").includes(needle)||r.code.toLowerCase().includes(needle)));
 result.sort((a,b)=>(Number.isFinite(b.gap)?b.gap:-Infinity)-(Number.isFinite(a.gap)?a.gap:-Infinity)||a.name.localeCompare(b.name,"el"));
 $("count-label").textContent=result.length+" / 27 χώρες";
 $("country-list").innerHTML=result.map((r,i)=>`<button type="button" data-country="${r.code}" class="country-row ${r.code===chosen?"active":""}"><div class="country-id"><span class="rank">${String(i+1).padStart(2,"0")}</span><span class="flag">${r.flag}</span><span><strong>${r.name}</strong><small>${r.status==="vibecession"?"Vibecession candidate":r.status==="stress"?"Economic pressure":r.status==="missing"?"Insufficient data":"Mixed / no clear gap"}</small></span></div><span class="numeric subdued">${fmt(r.latest.conf?.value)}</span><span class="numeric ${r.gap>=1.15?"positive":r.gap<=-1?"negative":"subdued"}">${signed(r.gap)}</span></button>`).join("")||'<div class="empty-list">Δεν βρέθηκαν χώρες για αυτό το φίλτρο.</div>';
 $("country-list").querySelectorAll("[data-country]").forEach(b=>b.addEventListener("click",()=>select(b.dataset.country)));
}
function select(code){chosen=code;list();details();scatter()}
function render(){
 $("kpi-covered").textContent=rows.filter(r=>r.status!=="missing").length||"—";
 $("kpi-vibes").textContent=rows.length?rows.filter(r=>r.status==="vibecession").length:"—";
 $("kpi-stress").textContent=rows.length?rows.filter(r=>r.status==="stress").length:"—";
 $("kpi-date").textContent=rows.map(r=>r.latest.conf?.period).filter(Boolean).sort().at(-1)||"—";
 list();details();scatter();
}
function feed(label,status){
 const e=$("feed-pill");e.className="data-pill "+status;e.innerHTML="<i></i> "+label;
}
async function load(){
 if(busy)return;busy=true;$("refresh").disabled=true;
 const notice=$("notice");notice.className="notice";notice.innerHTML='<span class="spinner"></span> Ανάκτηση επίσημων δεδομένων Eurostat…';
 feed("ΣΥΝΔΕΣΗ EUROSTAT","pending");
 try{
  const names=Object.keys(config),results=await Promise.allSettled(names.map(n=>fetchSeries(n))),data={},errors=[];
  for(let i=0;i<names.length;i++){
   const key=names[i],r=results[i];
   if(r.status==="fulfilled")data[key]=r.value;
   else if(key==="conf"||key==="gdp"){
    try{data[key]=await fetchSeries(key,{s_adj:key==="conf"?"NSA":"SA"})}
    catch(e){errors.push(key+" ("+e.message+")")}
   }else errors.push(key+" ("+(r.reason?.message||"Σφάλμα")+")");
  }
  rows=calculate(data);render();
  const covered=rows.filter(r=>r.status!=="missing").length;
  if(errors.length||covered===0){notice.className="notice warning";notice.textContent="Περιορισμένη διαθεσιμότητα: "+covered+"/27 χώρες με πλήρη δεδομένα. "+(errors.length?"Πηγές: "+errors.join("; "):"");feed(covered?"ΜΕΡΙΚΑ ΔΕΔΟΜΕΝΑ":"ΜΗ ΔΙΑΘΕΣΙΜΟ","error")}
  else{notice.className="notice success";notice.textContent="";feed("EUROSTAT · LIVE","")}
 }catch(err){rows=calculate({});render();notice.className="notice warning";notice.textContent="Δεν ήταν δυνατή η λήψη δεδομένων. Δεν εμφανίζονται εκτιμήσεις ως πραγματικά στοιχεία.";feed("ΣΦΑΛΜΑ ΠΗΓΗΣ","error");console.error(err)}
 finally{busy=false;$("refresh").disabled=false}
}
$("search").addEventListener("input",e=>{needle=e.target.value.toLocaleLowerCase("el");list()});
document.querySelectorAll("[data-filter]").forEach(b=>b.addEventListener("click",()=>{filter=b.dataset.filter;document.querySelectorAll("[data-filter]").forEach(x=>x.classList.toggle("selected",x===b));list()}));
$("refresh").addEventListener("click",load);
function clock(){$("utc-clock").textContent=new Date().toISOString().slice(11,16)+" UTC"}
clock();setInterval(clock,60000);load();
})();