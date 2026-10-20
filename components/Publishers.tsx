'use client';
import {useMemo,useState} from 'react';
import type {Signal} from '@/lib/types';
import type {Story} from '@/lib/stories';
import {leanOf} from '@/lib/stories';

/* Who is writing about this story — the heart of GLITCH. Publisher bubbles, patterns, story sequence. */
type Lang='el'|'en';
export type Bloc='left'|'center'|'right'|'nonwest'|'greek'|'other';
const NONWEST=/^(al jazeera|trt|press ?tv|rt\b|cgtn|xinhua|global times|anadolu|tass|times of india|hindustan|dawn|arab news|middle east eye|tehran times|the national|south china morning post|scmp|china daily|daily sabah|ndtv|the hindu|gulf news|al arabiya)/i;
const GREEK=/^(ΕΡΤ|Ναυτεμπορική|Πρώτο Θέμα|Καθημερινή|in\.gr)|\.gr$|^(skai|cnn\.gr|protothema|kathimerini|naftemporiki|iefimerida|newsbomb|news247|tovima|ta nea|efsyn|avgi|lifo|ertnews|capital\.gr|euro2day|newsit|ethnos|documento)/i;
export const blocOf=(src:string):Bloc=>{const s=short(src);if(GREEK.test(s)||/[Ͱ-Ͽ]/.test(s))return 'greek';if(NONWEST.test(s))return 'nonwest';const l=leanOf(s);return l==='unrated'?'other':l};
export const BLOC:Record<Bloc,{el:string;en:string;c:string}>={
 left:{el:'Κεντροαριστερά',en:'Left-leaning',c:'#4d8dff'},center:{el:'Κέντρο',en:'Center',c:'#e9e2cf'},right:{el:'Δεξιά',en:'Right-leaning',c:'#ff5a5f'},
 nonwest:{el:'Μη δυτικά',en:'Non-Western',c:'#ff9f43'},greek:{el:'Ελληνικά',en:'Greek',c:'#2fd4f2'},other:{el:'Άλλα / χωρίς αξιολόγηση',en:'Other / unrated',c:'#8b8d9c'}};
export function short(s:string){return s.replace(/^Google News \/ .*$/,'Google News').replace(/^(BBC|Guardian|New York Times|UN News|Πρώτο Θέμα|ΕΡΤ|Fox News|CBS News|NPR|The Independent|Sky News|Al Jazeera)\b.*$/,'$1').replace(/^Spaceflight News \/ /,'').trim()}

const KNOWN:Record<string,string>={'reuters':'reuters.com','financial times':'ft.com','bloomberg':'bloomberg.com','cnbc':'cnbc.com','associated press':'apnews.com','ap news':'apnews.com','cnn':'cnn.com','the new york times':'nytimes.com','new york times':'nytimes.com',
 'the wall street journal':'wsj.com','wsj':'wsj.com','the washington post':'washingtonpost.com','washington post':'washingtonpost.com','the hill':'thehill.com','politico':'politico.com','axios':'axios.com','fox news':'foxnews.com','bbc':'bbc.co.uk','guardian':'theguardian.com','the guardian':'theguardian.com',
 'al jazeera':'aljazeera.com','sky news':'news.sky.com','npr':'npr.org','cbs news':'cbsnews.com','nbc news':'nbcnews.com','abc news':'abcnews.go.com','the independent':'independent.co.uk','the telegraph':'telegraph.co.uk','dw':'dw.com','euronews':'euronews.com','france 24':'france24.com',
 'times of israel':'timesofisrael.com','south china morning post':'scmp.com','un news':'news.un.org','ερτ':'ertnews.gr','ναυτεμπορική':'naftemporiki.gr','πρώτο θέμα':'protothema.gr','καθημερινή':'kathimerini.gr','forbes':'forbes.com','the economist':'economist.com','time':'time.com','newsweek':'newsweek.com',
 'business insider':'businessinsider.com','the verge':'theverge.com','techcrunch':'techcrunch.com','wired':'wired.com','yahoo finance':'finance.yahoo.com','yahoo news':'news.yahoo.com','marketwatch':'marketwatch.com','the atlantic':'theatlantic.com','vox':'vox.com','new york post':'nypost.com','daily mail':'dailymail.co.uk','trt world':'trtworld.com','kyiv independent':'kyivindependent.com','the jerusalem post':'jpost.com','anadolu ajansı':'aa.com.tr'};
export function domainOf(r:Signal):string|null{
 if(!r.url.includes('news.google.')){try{return new URL(r.url).hostname.replace(/^www\./,'')}catch{}}
 const s=short(r.source).toLowerCase();
 if(KNOWN[s])return KNOWN[s];
 const m=s.match(/([a-z0-9-]+\.(?:com|gr|co\.uk|org|net|eu|de|fr|it|es|in|cy|news|tv|info))$/i);
 return m?m[1]:null;
}
export function Favicon({r,size=28}:{r:Signal;size?:number}){
 const [bad,setBad]=useState(false);const d=domainOf(r);const name=short(r.source);
 const bloc=blocOf(r.source);
 if(!d||bad)return <span className="fav fav-txt" style={{width:size,height:size,fontSize:size*.42,borderColor:BLOC[bloc].c}}>{name.replace(/^(the|η|το|οι)\s+/i,'').slice(0,2).toUpperCase()}</span>;
 // eslint-disable-next-line @next/next/no-img-element
 return <img className="fav" style={{width:size,height:size,borderColor:BLOC[bloc].c}} src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(d)}&sz=64`} alt={name} title={name} loading="lazy" referrerPolicy="no-referrer" onError={()=>setBad(true)}/>;
}
/** Particle-style stack of publisher icons for cards. */
export function PublisherStack({story,max=4}:{story:Story;max?:number}){
 const seen=new Set<string>();const list:Signal[]=[];
 for(const r of [story.headline,...story.reports]){const k=short(r.source);if(seen.has(k))continue;seen.add(k);list.push(r);if(list.length>=max)break}
 const more=story.sources.length-list.length;
 return <span className="pstack">{list.map(r=><Favicon key={r.id} r={r} size={20}/>)}{more>0&&<span className="pmore">+{more}</span>}</span>;
}

const STOP=new Set('the and for with from after over into says said amid will that this what when have more than about been their they other first could would new news update live video watch analysis opinion report how why who are was were has its not but out off can year years week day says στο στη στην στον στους στις από και για των την τον της του μια ένα νέα νέο μετά πριν κατά προς είναι ήταν όπως αλλά όταν'.split(' '));
const words=(t:string)=>(t.toLocaleLowerCase().match(/[\p{L}]{5,}/gu)||[]).filter(w=>!STOP.has(w));

type Pub={name:string;bloc:Bloc;reports:Signal[];first:number;r:Signal};
export function PublisherBubbles({story,lang,rtitle,rsum}:{story:Story;lang:Lang;rtitle:(r:Signal)=>string;rsum:(r:Signal)=>string}){
 const el=lang==='el';
 const pubs=useMemo(()=>{
  const m=new Map<string,Pub>();
  for(const r of story.reports){const name=short(r.source);const p=m.get(name)||{name,bloc:blocOf(r.source),reports:[],first:Infinity,r};p.reports.push(r);p.first=Math.min(p.first,Date.parse(r.timestamp));if(Date.parse(r.timestamp)<=p.first)p.r=r;m.set(name,p)}
  return [...m.values()].sort((a,b)=>a.first-b.first);
 },[story]);
 const [sel,setSel]=useState<string|null>(null);
 const cur=pubs.find(p=>p.name===sel)||null;
 const blocCount=(Object.keys(BLOC) as Bloc[]).map(b=>({b,n:pubs.filter(p=>p.bloc===b).length})).filter(x=>x.n>0);
 const total=pubs.length;
 // patterns
 const patterns:string[]=[];
 if(pubs.length){
  const f=pubs[0],l=[...pubs].sort((a,b)=>b.first-a.first)[0];
  const t=(x:number)=>new Date(x).toLocaleString(el?'el-GR':'en-GB',{weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false});
  patterns.push(el?`Πρώτο το έγραψε: ${f.name} (${t(f.first)})`:`First to report: ${f.name} (${t(f.first)})`);
  if(pubs.length>2){const hrs=Math.max(1,Math.round((l.first-f.first)/3600000));patterns.push(el?`${pubs.length} εκδότες το πήραν μέσα σε ${hrs} ώρ${hrs===1?'α':'ες'}`:`${pubs.length} publishers picked it up within ${hrs}h`)}
  const top=[...blocCount].sort((a,b)=>b.n-a.n)[0];
  if(top&&total>=3)patterns.push(el?`Κυριαρχούν τα ${BLOC[top.b].el.toLowerCase()} μέσα (${top.n} από ${total})`:`Dominated by ${BLOC[top.b].en.toLowerCase()} outlets (${top.n} of ${total})`);
  const missing=(['left','right','nonwest','greek'] as Bloc[]).filter(b=>!blocCount.some(x=>x.b===b));
  if(total>=3&&missing.length)patterns.push((el?'Τυφλό σημείο — δεν το καλύπτουν: ':'Blind spot — not covered by: ')+missing.map(b=>el?BLOC[b].el:BLOC[b].en).join(', '));
  const most=[...pubs].sort((a,b)=>b.reports.length-a.reports.length)[0];
  if(most.reports.length>1)patterns.push(el?`Το πιο επίμονο μέσο: ${most.name} (${most.reports.length} άρθρα)`:`Most persistent: ${most.name} (${most.reports.length} articles)`);
 }
 // framing words per bloc (words a bloc uses that other blocs do not)
 const frames=useMemo(()=>{
  const byBloc=new Map<Bloc,string[]>();
  for(const p of pubs)for(const r of p.reports)byBloc.set(p.bloc,[...(byBloc.get(p.bloc)||[]),...words(r.title.replace(/\s+-\s+[^-]{2,70}$/,''))]);
  const out:{b:Bloc;w:string[]}[]=[];
  for(const [b,ws] of byBloc){
   const others=new Set([...byBloc].filter(([k])=>k!==b).flatMap(([,v])=>v));
   const freq=new Map<string,number>();for(const w of ws)if(!others.has(w))freq.set(w,(freq.get(w)||0)+1);
   const top=[...freq].sort((a,b2)=>b2[1]-a[1]).slice(0,4).map(([w])=>w);
   if(top.length&&byBloc.size>1)out.push({b,w:top});
  }
  return out;
 },[pubs]);
 const maxN=Math.max(...pubs.map(p=>p.reports.length),1);
 return <section className="pubs">
  <div className="pubs-head"><h2><span className="g-glitch" data-t="GLITCH">GLITCH</span> · {el?'Ποιοι γράφουν γι’ αυτό':'Who is writing about this'}</h2><em>{total} {el?'εκδότες':'publishers'}</em></div>
  <p className="pubs-sub">{el?'Κάθε φούσκα είναι ένας εκδότης — όσο μεγαλύτερη, τόσα περισσότερα άρθρα. Το χρώμα δείχνει το «στρατόπεδο». Πάτα για να δεις τι γράφει.':'Each bubble is a publisher — bigger means more articles; colour shows the camp. Tap to see what it wrote.'}</p>
  <div className="bubbles">{pubs.map((p,i)=>{const sz=46+Math.round(Math.sqrt(p.reports.length/maxN)*46);
   return <button key={p.name} className={'bub'+(sel===p.name?' on':'')} style={{width:sz,height:sz,['--bc' as string]:BLOC[p.bloc].c,animationDelay:(i%7)*-.9+'s',animationDuration:(5+i%4)+'s'}} onClick={()=>setSel(sel===p.name?null:p.name)} title={p.name}>
    <Favicon r={p.r} size={Math.round(sz*.46)}/>{p.reports.length>1&&<b>{p.reports.length}</b>}<span className="bub-name">{p.name}</span></button>})}</div>
  <div className="bloc-legend">{blocCount.map(({b,n})=><span key={b}><i style={{background:BLOC[b].c}}/>{el?BLOC[b].el:BLOC[b].en} <b>{n}</b></span>)}</div>
  {cur&&<div className="bub-detail" style={{borderColor:BLOC[cur.bloc].c}}>
   <div className="bd-h"><Favicon r={cur.r} size={26}/><strong>{cur.name}</strong><small>{el?BLOC[cur.bloc].el:BLOC[cur.bloc].en}</small></div>
   {cur.reports.map(r=><a key={r.id} href={r.url} target="_blank" rel="noreferrer"><b>{rtitle(r)}</b>{rsum(r)&&<span>{rsum(r)}</span>}<small>{new Date(r.timestamp).toLocaleString(el?'el-GR':'en-GB',{weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false})} ↗</small></a>)}
  </div>}
  {patterns.length>0&&<div className="patterns"><h3>{el?'Μοτίβα κάλυψης':'Coverage patterns'}</h3><ul>{patterns.map((x,i)=><li key={i}>{x}</li>)}</ul>
   {frames.length>0&&<div className="frames"><small>{el?'Λέξεις που χρησιμοποιεί μόνο κάθε στρατόπεδο':'Words only one camp uses'}</small>{frames.map(f=><div key={f.b}><i style={{background:BLOC[f.b].c}}/><span>{el?BLOC[f.b].el:BLOC[f.b].en}</span>{f.w.map(w=><em key={w}>{w}</em>)}</div>)}</div>}
  </div>}
 </section>;
}

/** The story as it unfolded: every article in time order. */
export function StorySequence({story,lang,rtitle,rsum}:{story:Story;lang:Lang;rtitle:(r:Signal)=>string;rsum:(r:Signal)=>string}){
 const el=lang==='el';
 const reports=[...story.reports].sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp));
 let lastDay='';
 return <section className="seq">
  <h2>{el?'Η ακολουθία της ιστορίας':'How the story unfolded'} <em>{reports.length}</em></h2>
  <ol>{reports.map((r,i)=>{const d=new Date(r.timestamp);const day=d.toLocaleDateString(el?'el-GR':'en-GB',{weekday:'long',day:'numeric',month:'long'});const showDay=day!==lastDay;lastDay=day;const s=rsum(r);
   return <li key={r.id} className={i===0?'first':''}>
    {showDay&&<div className="seq-day">{day}</div>}
    <a href={r.url} target="_blank" rel="noreferrer">
     <time>{d.toLocaleTimeString(el?'el-GR':'en-GB',{hour:'2-digit',minute:'2-digit',hour12:false})}</time>
     <span className="seq-dot" style={{background:BLOC[blocOf(r.source)].c}}/>
     <span className="seq-body"><span className="seq-src"><Favicon r={r} size={18}/>{short(r.source)}{i===0&&<em>{el?'πρώτο':'first'}</em>}</span>
      <strong>{rtitle(r)}</strong>{s&&<span className="seq-sum">{s}</span>}</span>
     {r.imageUrl&&/* eslint-disable-next-line @next/next/no-img-element */<img src={r.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer"/>}
    </a></li>})}</ol>
 </section>;
}

/** Strip feed boilerplate so excerpts read cleanly. */
export function cleanSummary(s:string):string{
 return s.replace(/\s*(Continue reading|Read more|Read the full story|Keep reading|Διαβάστε περισσότερα|Περισσότερα)\.{0,3}\s*$/i,'')
  .replace(/The post .* appeared first on .*$/i,'').replace(/\s*\[(?:…|\.\.\.|&#8230;)\]\s*$/,'…').replace(/\s*(?:…|\.\.\.)\s*$/,'…')
  .replace(/^\s*(?:[A-Z][A-Za-z .]+|[Α-Ω][^\s]+)\s*\(\w+\)\s*[-–—]\s*/,'').replace(/\s+/g,' ').trim();
}
