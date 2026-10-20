import {NextRequest,NextResponse} from 'next/server';
import {needsTranslation,validTranslation} from '@/lib/translation-quality';

export const runtime='nodejs';
export const dynamic='force-dynamic';

type TranslationItem={id:string;title:string;summary:string};
type Translated=TranslationItem & {translated:boolean;provider:'google-cloud'|'mymemory'|'original';error?:string};
const MAX_ITEMS=4;
const MAX_BODY=9000;
const hasGreek=(s:string)=>/[\u0370-\u03ff\u1f00-\u1fff]/.test(s);
const input=(v:unknown,n:number)=>typeof v==='string'?v.trim().slice(0,n):'';
const cache=new Map<string,string>();
function decodeEntities(s:string){return s.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp|#39);/gi,(_,entity:string)=>{
 if(entity[0]==='#'){const n=entity[1]?.toLowerCase()==='x'?parseInt(entity.slice(2),16):parseInt(entity.slice(1),10);return Number.isInteger(n)&&n>0&&n<=0x10ffff?String.fromCodePoint(n):'';}
 return ({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '} as Record<string,string>)[entity.toLowerCase()]??'';
});}

async function withTimeout(url:string,options:RequestInit,ms:number){
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),ms);
 try{return await fetch(url,{...options,signal:controller.signal})}finally{clearTimeout(timer)}
}

async function googleTranslate(texts:string[],target:'el'|'en'):Promise<string[]>{
 const key=process.env.GOOGLE_TRANSLATE_API_KEY;
 if(!key)throw new Error('No Google Cloud key');
 const response=await withTimeout('https://translation.googleapis.com/language/translate/v2?key='+encodeURIComponent(key),{
  method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({q:texts,target,format:'text'}),cache:'no-store'
 },7000);
 if(!response.ok)throw new Error('Google Cloud service '+response.status);
 const data=await response.json() as {data?:{translations?:Array<{translatedText?:string}>}};
 const output=data.data?.translations?.map(x=>decodeEntities(x.translatedText||''));
 if(!output||output.length!==texts.length||output.some(x=>!x))throw new Error('Google Cloud incomplete translation');
 return output;
}

async function myMemoryTranslate(text:string,target:'el'|'en'):Promise<string>{
 const key=target+':'+text;
 const hit=cache.get(key);if(hit)return hit;
 const url=new URL('https://api.mymemory.translated.net/get');
 url.searchParams.set('q',text.slice(0,450));url.searchParams.set('langpair',target==='el'?'en|el':'el|en');
 const response=await withTimeout(url.toString(),{headers:{Accept:'application/json'},next:{revalidate:604800}},7000);
 if(!response.ok)throw new Error('MyMemory HTTP '+response.status);
 const data=await response.json() as {responseStatus?:number;responseData?:{translatedText?:string}};
 const translated=decodeEntities(data.responseData?.translatedText||'').trim();
 if(data.responseStatus!==200||!translated||translated.toLowerCase().includes('quota exceeded'))throw new Error('MyMemory quota or translation unavailable');
 if(cache.size>1200)cache.clear();cache.set(key,translated);
 return translated;
}

async function one(item:TranslationItem,target:'el'|'en'):Promise<Translated>{
 const already=(s:string)=>!needsTranslation(s,target);
 const titleGreek=!item.title||already(item.title),summaryGreek=!item.summary||already(item.summary);
 if(titleGreek&&summaryGreek)return {...item,translated:true,provider:'original'};
 // Headline comes first: a failed, long RSS description must never discard a good title.
 const translate=(text:string)=>process.env.GOOGLE_TRANSLATE_API_KEY
   ?googleTranslate([text],target).then(x=>x[0]).catch(()=>myMemoryTranslate(text,target))
   :myMemoryTranslate(text,target);
 let title=item.title,summary=item.summary;
 let titleOk=titleGreek,summaryOk=summaryGreek;
 let provider:'google-cloud'|'mymemory'|'original'='original';
 try {
  if(!titleGreek&&title){
   const result=await translate(title.slice(0,420));
   if(!validTranslation(item.title,result,target))throw new Error('Translation failed quality checks');
   title=result;
   titleOk=true;
   provider=process.env.GOOGLE_TRANSLATE_API_KEY?'google-cloud':'mymemory';
  }
 }catch{}
 // Translate short news blurbs only; long publisher excerpts consume the entire free quota.
 if(!summaryGreek&&summary&&titleOk){
  try {
   const raw=summary.slice(0,300);
   const limit=raw.length<summary.length?raw.lastIndexOf(' '):-1;
   const snippet=limit>190?raw.slice(0,limit):raw;
   const result=await translate(snippet);
   if(validTranslation(snippet,result,target)){
    summary=result+(snippet.length<summary.length?'…':'');
    summaryOk=true;
    provider=process.env.GOOGLE_TRANSLATE_API_KEY?'google-cloud':'mymemory';
   }
  }catch{}
 }
 if(!summaryOk)summary=target==='el'?'Δεν υπάρχει διαθέσιμη ελληνική μετάφραση της περίληψης. Διάβασε το αρχικό δημοσίευμα για πλήρες πλαίσιο.':'English summary unavailable. Open the original source for details.';
 return {id:item.id,title,summary,translated:(!item.title||titleOk)&&(!item.summary||summaryOk),provider,
   ...(titleOk?{}:{error:'Η μετάφραση τίτλου δεν είναι διαθέσιμη από τον πάροχο'})};
}

export async function POST(request:NextRequest){
 try{
  if(Number(request.headers.get('content-length')||'0')>MAX_BODY)return NextResponse.json({error:'Request too large'},{status:413});
  const body=await request.text();if(body.length>MAX_BODY)return NextResponse.json({error:'Request too large'},{status:413});
  const value=JSON.parse(body) as {items?:unknown;title?:unknown;summary?:unknown;target?:unknown};
  const target=value.target==='en'?'en':'el';
  const legacy=!Array.isArray(value.items);
  const raw=legacy?[{id:'legacy',title:value.title,summary:value.summary}]:value.items;
  if(!Array.isArray(raw)||raw.length<1||raw.length>MAX_ITEMS)return NextResponse.json({error:'Invalid batch'},{status:400});
  const items:TranslationItem[]=raw.map((v:unknown)=>{
   const x=v as Record<string,unknown>;
   return {id:input(x.id,150),title:input(x.title,650),summary:input(x.summary,1200)};
  });
  if(items.some(x=>!x.id||(!x.title&&!x.summary)))return NextResponse.json({error:'Invalid translation item'},{status:400});
  // Bound parallelism to avoid hammering public translation services.
  const result:Translated[]=[];
  for(let i=0;i<items.length;i+=2)result.push(...await Promise.all(items.slice(i,i+2).map(item=>one(item,target))));
  if(legacy){const a=result[0];return NextResponse.json({title:a.title,summary:a.summary,translated:a.translated,provider:a.provider,error:a.error},{headers:{'Cache-Control':'private, no-store'}})}
  return NextResponse.json({items:result},{headers:{'Cache-Control':'private, no-store'}});
 }catch{return NextResponse.json({error:'Invalid translation request'},{status:400})}
}
