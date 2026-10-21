import {createHash} from 'node:crypto';
import {NextRequest,NextResponse} from 'next/server';
export const runtime='nodejs';
type Sub={endpoint:string;expirationTime?:number|null;keys:{p256dh:string;auth:string}};
const allowed=(endpoint:string)=>{
 try{const u=new URL(endpoint);return u.protocol==='https:'&&(/(^|\.)push\.apple\.com$|(^|\.)push\.services\.mozilla\.com$|^fcm\.googleapis\.com$|^updates\.push\.services\.mozilla\.com$|^wns\d*\.notify\.windows\.com$|^web\.push\.apple\.com$/).test(u.hostname)}
 catch{return false}
};
const valid=(x:unknown):x is Sub=>{
 if(!x||typeof x!=='object')return false;
 const s=x as Partial<Sub>;
 return typeof s.endpoint==='string'&&s.endpoint.length<2500&&allowed(s.endpoint)&&typeof s.keys?.p256dh==='string'&&s.keys.p256dh.length<300&&typeof s.keys?.auth==='string'&&s.keys.auth.length<300;
};
const store=async(commands:(string|number)[][])=>{
 const url=process.env.UPSTASH_REDIS_REST_URL,token=process.env.UPSTASH_REDIS_REST_TOKEN;
 if(!url||!token)throw Error('Storage not configured');
 const r=await fetch(url+'/pipeline',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(commands),cache:'no-store'});
 if(!r.ok)throw Error('Storage unavailable');
 const out=await r.json() as Array<{error?:string}>;
 if(!Array.isArray(out)||out.some(row=>row.error))throw Error('Subscription could not be saved');
};
export async function POST(req:NextRequest){
 if(!process.env.VAPID_PUBLIC_KEY||!process.env.VAPID_PRIVATE_KEY)return NextResponse.json({error:'Push not configured'},{status:503});
 let body:{subscription?:unknown};
 try{body=await req.json()}catch{return NextResponse.json({error:'Invalid JSON'},{status:400})}
 if(!valid(body.subscription))return NextResponse.json({error:'Invalid push subscription'},{status:400});
 const sub=body.subscription;
 const hash=createHash('sha256').update(sub.endpoint).digest('hex');
 try{await store([['SET','glitch:push:sub:'+hash,JSON.stringify(sub),'EX',7776000],['SADD','glitch:push:devices',hash]]);return NextResponse.json({ok:true})}
 catch{return NextResponse.json({error:'Storage unavailable'},{status:503})}
}
export async function DELETE(req:NextRequest){
 let body:{endpoint?:string};
 try{body=await req.json()}catch{return NextResponse.json({error:'Invalid JSON'},{status:400})}
 if(typeof body.endpoint!=='string'||!allowed(body.endpoint))return NextResponse.json({error:'Invalid endpoint'},{status:400});
 const hash=createHash('sha256').update(body.endpoint).digest('hex');
 try{await store([['DEL','glitch:push:sub:'+hash],['SREM','glitch:push:devices',hash]]);return NextResponse.json({ok:true})}
 catch{return NextResponse.json({error:'Storage unavailable'},{status:503})}
}
