'use client';
import {useEffect,useState} from 'react';
import {Bookmark,BookmarkCheck,Check,ChevronRight,HelpCircle,MessageCircle,Pause,Play,Send,ShieldAlert,Volume2,X} from 'lucide-react';
import type {Signal} from '@/lib/types';
import type {StoryCase} from '@/lib/world-pulse';
import {actorsMentioned} from '@/lib/world-pulse';

type Lang='el'|'en';
type Tab='brief'|'simple'|'five'|'ask';
type Answer={answer:string;limitations:string;refs?:number[]};
const T=(l:Lang,el:string,en:string)=>l==='el'?el:en;
const cacheKey='glitch-reading-list-v1';

export function ReaderToolkit({story,lang,titleFor,summaryFor,aiEnabled}:{story:StoryCase;lang:Lang;titleFor:(r:Signal)=>string;summaryFor:(r:Signal)=>string;aiEnabled:boolean}){
 const [tab,setTab]=useState<Tab>('brief');
 const [saved,setSaved]=useState(false);
 const [question,setQuestion]=useState('');
 const [answer,setAnswer]=useState<Answer|null>(null);
 const [pending,setPending]=useState(false);
 const [error,setError]=useState('');
 const [speaking,setSpeaking]=useState(false);
 useEffect(()=>{try{const list=JSON.parse(localStorage.getItem(cacheKey)||'[]') as string[];setSaved(list.includes(story.id))}catch{}},[story.id]);
 useEffect(()=>()=>{if(typeof window!=='undefined'&&'speechSynthesis'in window)window.speechSynthesis.cancel()},[]);
 const save=()=>{
  try{
   const data=JSON.parse(localStorage.getItem(cacheKey)||'[]') as string[];
   const next=saved?data.filter(x=>x!==story.id):[story.id,...data.filter(x=>x!==story.id)].slice(0,80);
   localStorage.setItem(cacheKey,JSON.stringify(next));setSaved(!saved);
  }catch{setError(T(lang,'Δεν ήταν δυνατή η τοπική αποθήκευση.','Local saving is unavailable.'))}
 };
 const listen=()=>{
  if(!('speechSynthesis'in window))return;
  if(speaking){window.speechSynthesis.cancel();setSpeaking(false);return}
  window.speechSynthesis.cancel();
  const msg=new SpeechSynthesisUtterance(titleFor(story.headline)+'. '+summaryFor(story.headline));
  msg.lang=lang==='el'?'el-GR':'en-US';msg.rate=.94;msg.onend=()=>setSpeaking(false);msg.onerror=()=>setSpeaking(false);
  window.speechSynthesis.speak(msg);setSpeaking(true);
 };
 const submit=async()=>{
  if(!aiEnabled||pending||question.trim().length<6)return;
  setPending(true);setError('');setAnswer(null);
  try{
   const res=await fetch('/api/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({caseId:story.id,lang,question:question.trim().slice(0,260)})});
   const data=await res.json();
   if(!res.ok)throw Error(data.error||'Unavailable');
   setAnswer(data as Answer);
  }catch{setError(T(lang,'Η ερώτηση δεν μπόρεσε να απαντηθεί τώρα.','The question could not be answered right now.'))}
  finally{setPending(false)}
 };
 const list=[
  {id:'brief' as const,el:'Σύνοψη',en:'Overview'},
  {id:'simple' as const,el:'Με απλά λόγια',en:'Simple'},
  {id:'five' as const,el:'5 ερωτήσεις',en:'5 questions'},
  {id:'ask' as const,el:'Ρώτησε',en:'Ask'}
 ];
 const mentions=[...new Set(story.reports.flatMap(r=>actorsMentioned({title:r.title,summary:''}).map(x=>x.name)))].slice(0,5);
 const texts=[
  {q:T(lang,'Ποιος;','Who?'),a:mentions.length?mentions.join(' · '):T(lang,'Δεν κατονομάζεται με σαφήνεια στα διαθέσιμα αποσπάσματα.','Not clearly named in the available excerpts.')},
  {q:T(lang,'Τι;','What?'),a:titleFor(story.headline)},
  {q:T(lang,'Πότε;','When?'),a:T(lang,'Νεότερη δημοσίευση: ','Latest publication: ')+new Date(story.lastAt).toLocaleString(lang==='el'?'el-GR':'en-GB')},
  {q:T(lang,'Πού;','Where?'),a:T(lang,'Η γεωγραφική τοποθεσία δεν έχει επιβεβαιωθεί αυτοτελώς από τα διαθέσιμα στοιχεία. Έλεγξε τον τίτλο και την αρχική πηγή.','The location has not been independently confirmed from these excerpts; consult the original source.')},
  {q:T(lang,'Γιατί / πώς;','Why / how?'),a:T(lang,'Τα αποσπάσματα δεν αρκούν για ασφαλές συμπέρασμα αιτίας.','Excerpts alone cannot establish causation.')}
 ];
 return <section className="reader-toolkit">
  <header className="reader-tools-head"><span>{T(lang,'ΔΙΑΒΑΣΕ ΟΠΩΣ ΘΕΛΕΙΣ','READ YOUR WAY')}</span>
   <div><button onClick={listen} title={T(lang,'Ακουστική ανάγνωση','Listen to summary')} aria-label={T(lang,'Ανάγνωση ειδήσεων','Read summary aloud')}>{speaking?<Pause size={16}/>:<Volume2 size={16}/>}</button>
    <button onClick={save} title={T(lang,'Αποθήκευση','Bookmark')} aria-label={T(lang,'Αποθήκευση είδησης','Save story')}>{saved?<BookmarkCheck size={17}/>:<Bookmark size={17}/>}</button></div>
  </header>
  <div className="reader-tabs" role="group" aria-label={T(lang,'Τρόπος ανάγνωσης','Reading style')}>{list.map(v=><button key={v.id} className={tab===v.id?'active':''} onClick={()=>setTab(v.id)} aria-pressed={tab===v.id}>{lang==='el'?v.el:v.en}</button>)}</div>
  {tab==='brief'&&<div className="reader-tool-body"><p>{summaryFor(story.headline)}</p><small>{T(lang,'Σύνοψη του διαθέσιμου δημοσιευμένου αποσπάσματος.','Digest of the available published excerpt.')}</small></div>}
  {tab==='simple'&&<div className="reader-tool-body"><strong>{titleFor(story.headline)}</strong><p>{summaryFor(story.headline)}</p><div className="reader-alert"><HelpCircle size={16}/>{T(lang,'Αυτή είναι απλή παρουσίαση των στοιχείων, όχι νέα πληροφορία ή αυτόματη ερμηνεία πέρα από την πηγή.','A simplified layout of what the source says, not new factual reporting.')}</div></div>}
  {tab==='five'&&<div className="reader-five">{texts.map((x,i)=><div key={i}><strong>{x.q}</strong><p>{x.a}</p></div>)}</div>}
  {tab==='ask'&&<div className="reader-ask">{!aiEnabled?<div className="reader-alert"><ShieldAlert size={18}/>{T(lang,'Οι ερωτήσεις AI θα ενεργοποιηθούν μόλις ρυθμιστεί το OpenAI API στον διακομιστή.','AI questions require the server-side OpenAI API to be enabled.')}</div>:<>
   <p>{T(lang,'Ρώτησε οτιδήποτε για το γεγονός. Η απάντηση θα περιορίζεται στις διαθέσιμες πηγές.','Ask a question about the event. The answer is restricted to available source excerpts.')}</p>
   <form onSubmit={e=>{e.preventDefault();void submit()}}><input value={question} maxLength={260} onChange={e=>setQuestion(e.target.value)} placeholder={T(lang,'Τι δεν έχει διευκρινιστεί;','What remains unclear?')}/><button disabled={pending||question.trim().length<6} type="submit"><Send size={16}/></button></form>
   {pending&&<small>{T(lang,'Εξετάζονται οι πηγές…','Reading source excerpts…')}</small>}
   {answer&&<div className="reader-answer"><p>{answer.answer}</p><small>{answer.limitations}</small><a href={story.headline.url} target="_blank" rel="noopener noreferrer">{T(lang,'Άνοιξε την αρχική πηγή','View original source')} <ChevronRight size={13}/></a></div>}
  </>}{error&&<p className="reader-error">{error}</p>}</div>}
  <p className="reader-tool-method">{T(lang,'Οι τίτλοι, τα αποσπάσματα και οι χρόνοι δημοσίευσης προέρχονται από την τρέχουσα συλλογή πηγών. Δεν ισοδυναμούν με ανάγνωση πλήρων άρθρων.','Headlines, excerpts and times are from the current source sample. This is not a full-article reading.')}</p>
 </section>;
}
