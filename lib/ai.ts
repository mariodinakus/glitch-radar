/** Shared JSON-mode LLM call: Gemini (GEMINI_API_KEY, free tier) or OpenAI (OPENAI_API_KEY). */
export const aiProvider=():'gemini'|'openai'|null=>process.env.GEMINI_API_KEY?'gemini':process.env.OPENAI_API_KEY?'openai':null;

// Gemini's responseSchema is an OpenAPI subset (no additionalProperties).
const strip=(s:unknown):unknown=>Array.isArray(s)?s.map(strip):s&&typeof s==='object'?Object.fromEntries(Object.entries(s as Record<string,unknown>).filter(([k])=>k!=='additionalProperties').map(([k,v])=>[k,strip(v)])):s;

export async function aiJSON<T>(instructions:string,input:string,schema:object,opts:{maxTokens?:number;temperature?:number;timeoutMs?:number}={}):Promise<T>{
 const p=aiProvider();
 const ctl=new AbortController();const tm=setTimeout(()=>ctl.abort(),opts.timeoutMs??25000);
 try{
  if(p==='gemini'){
   let last='';
   for(const model of [process.env.GLITCH_GEMINI_MODEL||'gemini-flash-latest','gemini-2.5-flash']){
    const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{method:'POST',signal:ctl.signal,
     headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY!},
     body:JSON.stringify({systemInstruction:{parts:[{text:instructions}]},contents:[{role:'user',parts:[{text:input}]}],
      generationConfig:{temperature:opts.temperature??.5,maxOutputTokens:opts.maxTokens??2400,responseMimeType:'application/json',responseSchema:strip(schema)}})});
    if(!r.ok){last='gemini '+r.status;if(r.status===404||r.status===400)continue;throw Error(last)}
    const d=await r.json() as {candidates?:{content?:{parts?:{text?:string}[]}}[]};
    return JSON.parse(d.candidates?.[0]?.content?.parts?.map(x=>x.text||'').join('')||'') as T;
   }
   throw Error(last||'gemini failed');
  }
  if(p==='openai'){
   const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',signal:ctl.signal,
    headers:{'Content-Type':'application/json',Authorization:'Bearer '+process.env.OPENAI_API_KEY},
    body:JSON.stringify({model:process.env.GLITCH_AI_MODEL||'gpt-4.1-mini',store:false,max_output_tokens:opts.maxTokens??2400,instructions,input,
     text:{format:{type:'json_schema',name:'glitch',strict:true,schema}}})});
   if(!r.ok)throw Error('openai '+r.status);
   const d=await r.json() as {output?:{content?:{type:string;text?:string}[]}[]};
   return JSON.parse((d.output||[]).flatMap(o=>o.content||[]).find(c=>c.type==='output_text')?.text||'') as T;
  }
  throw Error('no AI provider');
 }finally{clearTimeout(tm)}
}

/** Paragraph text of a publisher page (for summarising in our own words; never republished). */
export async function articleText(url:string,max=7000):Promise<string>{
 try{
  const u=new URL(url);if(u.protocol!=='https:'||u.hostname.endsWith('news.google.com'))return '';
  const ctl=new AbortController();const tm=setTimeout(()=>ctl.abort(),6000);
  try{
   const r=await fetch(u,{signal:ctl.signal,headers:{'User-Agent':'Mozilla/5.0 (compatible; GLITCH-news/11)','Accept':'text/html'},next:{revalidate:21600}});
   if(!r.ok)return '';
   const html=(await r.text()).slice(0,600000);
   const paras=[...html.replace(/<(script|style|noscript|svg|figure|aside|nav|footer|header)[\s\S]*?<\/\1>/gi,' ').matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map(m=>m[1].replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&#39;|&rsquo;/g,"'").replace(/&quot;|&ldquo;|&rdquo;/g,'"').replace(/\s+/g,' ').trim())
    .filter(p=>p.length>60&&!/cookie|subscribe|newsletter|all rights reserved|sign up/i.test(p));
   return paras.join('\n').slice(0,max);
  }finally{clearTimeout(tm)}
 }catch{return ''}
}
