import {NextRequest,NextResponse} from 'next/server';
export const runtime='nodejs';

/** Resolves a publisher's own og:image for stories whose RSS item has no picture. */
const PRIVATE=/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[?::1\]?|169\.254\.)/i;
const attr=(tag:string,name:string)=>tag.match(new RegExp('\\b'+name+'\\s*=\\s*(["\'])(.*?)\\1','i'))?.[2];
const decode=(s:string)=>s.replace(/&amp;/g,'&').replace(/&#x2F;/gi,'/').replace(/&#47;/g,'/').replace(/&quot;/g,'"');

export async function GET(req:NextRequest){
 const raw=req.nextUrl.searchParams.get('url')||'';
 let target:URL;
 try{target=new URL(raw)}catch{return NextResponse.json({image:null},{status:400})}
 if(target.protocol!=='https:'||PRIVATE.test(target.hostname)||target.hostname.endsWith('news.google.com'))return NextResponse.json({image:null},{status:400});
 const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),5000);
 try{
  const res=await fetch(target.toString(),{signal:ctl.signal,redirect:'follow',next:{revalidate:86400},headers:{'User-Agent':'Mozilla/5.0 (compatible; GLITCH-news/11; +https://glitch-radar-github.vercel.app)','Accept':'text/html,application/xhtml+xml'}});
  if(!res.ok||!res.body)throw Error('HTTP '+res.status);
  // Read only the <head> region (first ~250 KB).
  const reader=res.body.getReader();let html='';const dec=new TextDecoder();
  while(html.length<250000){const {done,value}=await reader.read();if(done)break;html+=dec.decode(value,{stream:true});if(/<\/head>/i.test(html))break;}
  try{await reader.cancel()}catch{}
  const metas=[...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>m[0]);
  let image:string|undefined;
  for(const key of ['og:image:secure_url','og:image','twitter:image','twitter:image:src']){
   const tag=metas.find(t=>(attr(t,'property')||attr(t,'name')||'').toLowerCase()===key);
   const c=tag&&attr(tag,'content');
   if(c){image=decode(c);break}
  }
  if(image){try{const u=new URL(image,target);image=u.protocol==='https:'?u.toString():undefined}catch{image=undefined}}
  if(image&&/\.(svg|gif)(\?|$)/i.test(image))image=undefined;
  if(image&&/logo|placeholder|default[-_]?(image|og)/i.test(image))image=undefined;
  return NextResponse.json({image:image||null},{headers:{'Cache-Control':'public, s-maxage=86400, stale-while-revalidate=604800'}});
 }catch{
  return NextResponse.json({image:null},{headers:{'Cache-Control':'public, s-maxage=3600'}});
 }finally{clearTimeout(timer)}
}
