'use client';
import {useMemo,useState} from 'react';
import type {Story} from '@/lib/stories';

type Mode='graph'|'blindspots'|'narratives'|'future'|'evidence';
const labels:Record<Mode,string>={graph:'REALITY GRAPH',blindspots:'BLINDSPOT DETECTOR',narratives:'NARRATIVE X-RAY',future:'FUTURE BRANCHES',evidence:'EVIDENCE LAB'};
const topics=[['Energy','energy'],['Economy','economy'],['Conflict','mideast'],['Climate','climate'],['Science','space'],['Technology','ai']];
const host=(url:string)=>{try{return new URL(url).hostname.replace(/^www\./,'')}catch{return 'Unknown publisher'}};
export default function IntelligenceSuite({stories,onOpen}:{stories:Story[];onOpen:(s:Story)=>void}){
 const [mode,setMode]=useState<Mode>('graph');
 const [selected,setSelected]=useState<string>('');
 const [query,setQuery]=useState('');
 const [topic,setTopic]=useState<string>('');
 const [sort,setSort]=useState<'impact'|'breadth'|'recent'>('impact');
 const filtered=useMemo(()=>stories.filter(s=>(!topic||s.storylines.includes(topic))&&(!query||[s.headline.title,s.headline.summary||'',...s.reports.map(r=>r.source)].join(' ').toLowerCase().includes(query.toLowerCase()))).sort((a,b)=>sort==='breadth'?new Set(b.reports.map(r=>r.source)).size-new Set(a.reports.map(r=>r.source)).size:sort==='recent'?Date.parse(b.lastAt)-Date.parse(a.lastAt):b.importance-a.importance).slice(0,60),[stories,query,topic,sort]);
 const active=filtered.find(s=>s.id===selected)||filtered[0];
 const counts=useMemo(()=>topics.map(([label,id])=>({label,id,count:stories.filter(s=>s.storylines.includes(id)).length})),[stories]);
 const publishers=active?[...new Set(active.reports.map(r=>r.source))]:[];
 const sourceCount=stories.reduce((a,s)=>{s.reports.forEach(r=>a.add(r.source));return a},new Set<string>()).size;
 const coverage=useMemo(()=>{const count=new Map<string,number>();for(const story of stories){for(const source of new Set(story.reports.map(r=>r.source)))count.set(source,(count.get(source)||0)+1)}return [...count].sort((a,b)=>b[1]-a[1]);},[stories]);
 const singleSource=stories.filter(s=>new Set(s.reports.map(r=>r.source)).size===1).length;
 const topShare=stories.length?Math.round(100*(coverage.slice(0,5).reduce((n,x)=>n+x[1],0))/Math.max(1,coverage.reduce((n,x)=>n+x[1],0))):0;
 return <section aria-label="GLITCH Intelligence Suite" style={{padding:'22px',border:'1px solid var(--line,rgba(255,255,255,.1))',borderRadius:18,margin:'18px 0',background:'var(--card,#11141b)',color:'var(--tx,#efece6)'}}>
  <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap',alignItems:'center'}}>
   <div><div style={{fontSize:11,letterSpacing:2,opacity:.65}}>GLITCH / INTELLIGENCE</div><h2 style={{fontSize:25,margin:'7px 0'}}>Beyond the headlines.</h2><p style={{fontSize:13,opacity:.7,margin:0}}>Explore connections, coverage and evidence in the current news sample.</p></div>
   <div style={{fontSize:12,opacity:.8}}>{stories.length} EVENT CLUSTERS · {sourceCount} OBSERVED PUBLISHERS</div>
  </div>
  <div style={{display:'flex',gap:7,overflowX:'auto',padding:'18px 0'}}>
   {(Object.keys(labels) as Mode[]).map(m=><button key={m} onClick={()=>setMode(m)} aria-pressed={mode===m} style={{whiteSpace:'nowrap',border:'1px solid rgba(255,255,255,.14)',borderRadius:20,padding:'9px 12px',fontSize:11,fontWeight:700,background:mode===m?'var(--gold,#e2b857)':'transparent',color:mode===m?'#0a0b0e':'inherit'}}>{labels[m]}</button>)}
  </div>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:9,marginBottom:13}}>
   {[[String(sourceCount),'OBSERVED PUBLISHERS'],[String(stories.length),'STORY CLUSTERS'],[String(singleSource),'SINGLE-SOURCE STORIES'],[topShare+'%','TOP 5 SOURCE SHARE']].map(([value,label])=><div key={label} style={{padding:13,borderRadius:11,border:'1px solid rgba(255,255,255,.14)'}}><strong style={{fontSize:23}}>{value}</strong><div style={{fontSize:10,opacity:.65,marginTop:4}}>{label}</div></div>)}
  </div>
  <input aria-label="Search intelligence stories" placeholder="Search events or publishers" value={query} onChange={e=>setQuery(e.target.value)} style={{width:'100%',padding:12,borderRadius:9,border:'1px solid rgba(255,255,255,.18)',background:'transparent',color:'inherit',boxSizing:'border-box'}}/>
  <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',padding:'10px 0'}}>
    <label htmlFor="intel-sort" style={{fontSize:12}}>Rank by</label>
    <select id="intel-sort" value={sort} onChange={e=>setSort(e.target.value as typeof sort)} style={{padding:8,borderRadius:8,background:'var(--card2,#161a23)',color:'white',border:'1px solid rgba(255,255,255,.18)'}}><option value="impact">Editorial importance</option><option value="breadth">Publisher breadth</option><option value="recent">Latest update</option></select>
    {topic&&<button onClick={()=>setTopic('')} style={{padding:8,borderRadius:8,border:'1px solid rgba(255,255,255,.18)',background:'transparent',color:'inherit'}}>Clear topic: {topics.find(t=>t[1]===topic)?.[0]} ×</button>}
  </div>
  {mode==='graph'&&<div style={{padding:'15px 0'}}><strong>Topic connections</strong><p style={{fontSize:12,opacity:.7}}>Shared topic tags indicate editorial grouping, not demonstrated causality.</p><div style={{display:'flex',flexWrap:'wrap',gap:8}}>{counts.map(t=><button key={t.id} onClick={()=>setTopic(t.id)} style={{padding:12,borderRadius:12,border:'1px solid rgba(255,255,255,.18)',background:'transparent',color:'inherit'}}>{t.label} · {t.count}</button>)}</div><button onClick={()=>{setTopic('');setQuery('')}} style={{marginTop:9}}>Show all</button></div>}
  {mode==='blindspots'&&<p style={{fontSize:13,opacity:.8}}>LOW COVERAGE WATCH · Stories with one observed publisher are candidates for further review, not proof of suppressed reporting. The feed is not a complete media census.</p>}
  {mode==='blindspots'&&<div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:12}}>{coverage.slice(0,8).map(([name,n])=><span key={name} style={{padding:'6px 9px',fontSize:11,border:'1px solid rgba(255,255,255,.14)',borderRadius:9}}>{name}: {n} stories</span>)}</div>}
  {mode==='narratives'&&<p style={{fontSize:13,opacity:.8}}>Compare original publisher headlines and excerpts. Different wording is not itself evidence of bias or falsehood.</p>}
  {mode==='future'&&<p style={{fontSize:13,opacity:.8}}>SCENARIO WATCH · Track the event and its subsequent updates. No probabilities or predictions are inferred from headlines.</p>}
  {mode==='evidence'&&<p style={{fontSize:13,opacity:.8}}>SOURCE AUDIT · Open the publisher's original reporting. RSS metadata does not independently verify factual claims.</p>}
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:12,marginTop:12}}>
   <div style={{maxHeight:360,overflowY:'auto',display:'grid',gap:7}}>
    {filtered.filter(s=>mode!=='blindspots'||new Set(s.reports.map(r=>r.source)).size<=1).slice(0,35).map(s=><button key={s.id} onClick={()=>setSelected(s.id)} style={{textAlign:'left',padding:12,borderRadius:11,border:s.id===active?.id?'1px solid var(--gold,#e2b857)':'1px solid rgba(255,255,255,.1)',background:s.id===active?.id?'rgba(226,184,87,.10)':'transparent',color:'inherit'}}><div style={{fontSize:12,fontWeight:700}}>{s.headline.title}</div><div style={{fontSize:11,opacity:.65,marginTop:6}}>{new Set(s.reports.map(r=>r.source)).size} publishers · {s.reports.length} reports</div></button>)}
   </div>
   <div style={{border:'1px solid rgba(255,255,255,.1)',borderRadius:12,padding:15}}>
    {active?<><div style={{fontSize:11,letterSpacing:1,opacity:.6}}>EVENT DOSSIER</div><h3 style={{fontSize:17,margin:'10px 0'}}>{active.headline.title}</h3><p style={{fontSize:12,opacity:.75}}>{active.headline.summary||'No publisher excerpt available.'}</p><div style={{fontSize:12,fontWeight:700,margin:'12px 0'}}>SOURCE TRAIL · {publishers.length} publishers</div>{active.reports.slice(0,12).map(r=><a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" style={{display:'block',color:'var(--gold2,#f3d58a)',fontSize:12,margin:'9px 0'}}>{r.source} · {host(r.url)} ↗<span style={{display:'block',opacity:.7,color:'inherit'}}>{r.title}</span></a>)}<button onClick={()=>onOpen(active)} style={{marginTop:12,padding:11,borderRadius:9,background:'var(--gold,#e2b857)',color:'#0a0b0e',border:0}}>OPEN FULL COVERAGE →</button></>:<p>No matching events in this feed.</p>}
   </div>
  </div>
  <p style={{fontSize:11,opacity:.6,marginTop:16}}>Methodology: descriptive analysis of currently ingested feeds. Source concentration is the share of observed story-to-publisher links from the five most represented publishers; it is not global media market share. Publisher counts are sample counts. No automated truth score, causal claims, independent fact-checking or forecast probabilities.</p>
 </section>;
}
