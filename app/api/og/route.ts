import {NextRequest,NextResponse} from 'next/server';
import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';
export const runtime='nodejs';

/** Resolves a publisher's own og:image for stories whose RSS item has no picture. */
/** Only official publisher origins may be fetched, never arbitrary user URLs. */
const PUBLISHER_DOMAINS = [
 'un.org','bbc.com','bbc.co.uk','theguardian.com','aljazeera.com','nytimes.com',
 'skynews.com','foxnews.com','independent.co.uk','npr.org','cbsnews.com',
 'timesofisrael.com','scmp.com','dw.com','france24.com','euronews.com',
 'washingtonpost.com','wsj.com','economist.com','cbc.ca','timesofindia.indiatimes.com',
 'pbs.org','cnn.com','wired.com','techcrunch.com','arstechnica.com',
 'bloomberg.com','reuters.com','apnews.com','ft.com','nature.com','phys.org'
] as const;
function isPublicAddress(ip:string):boolean {
 const version=isIP(ip);
 if(version===4){
  const [a,b,c]=ip.split('.').map(Number);
  return !(a===0||a===10||a===127||a>=224||a===169&&b===254||
   a===172&&b>=16&&b<=31||a===192&&b===168||
   a===100&&b>=64&&b<=127||a===198&&(b===18||b===19)||
   a===192&&b===0&&c===0||a===192&&b===0&&c===2||
   a===198&&b===51&&c===100||a===203&&b===0&&c===113);
 }
 if(version===6){
  const s=ip.toLowerCase();
  return !(s==='::'||s==='::1'||s.startsWith('fc')||s.startsWith('fd')||
   s.startsWith('fe')||s.startsWith('::ffff:')||s.startsWith('2001:db8:'));
 }
 return false;
}
async function permittedPublisher(u:URL):Promise<boolean>{
 const hostname=u.hostname.toLowerCase();
 if(u.protocol!=='https:'||u.username||u.password||u.port||isIP(hostname)||
    u.toString().length>2048||
    !PUBLISHER_DOMAINS.some(d=>hostname===d||hostname.endsWith('.'+d)))return false;
 try{
  const addresses=await lookup(hostname,{all:true});
  return addresses.length>0&&addresses.every(a=>isPublicAddress(a.address));
 }catch{return false;}
}
const attr=(tag:string,name:string)=>tag.match(new RegExp('\\b'+name+'\\s*=\\s*(["\'])(.*?)\\1','i'))?.[2];
const decode=(s:string)=>s.replace(/&amp;/g,'&').replace(/&#x2F;/gi,'/').replace(/&#47;/g,'/').replace(/&quot;/g,'"');

export async function GET(req:NextRequest){
 const raw=req.nextUrl.searchParams.get('url')||'';
 let target:URL;
 try{target=new URL(raw)}catch{return NextResponse.json({image:null},{status:400})}
 if(!(await permittedPublisher(target)))return NextResponse.json({image:null},{status:400});
 const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),5000);
 try{
  const res=await fetch(target.toString(),{signal:ctl.signal,redirect:'error',next:{revalidate:86400},headers:{'User-Agent':'Mozilla/5.0 (compatible; GLITCH-news/11; +https://glitch-radar-github.vercel.app)','Accept':'text/html,application/xhtml+xml'}});
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
