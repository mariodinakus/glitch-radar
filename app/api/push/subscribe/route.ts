import {createHash} from 'node:crypto';
import {NextRequest,NextResponse} from 'next/server';
import {authenticatedUser,getAdmin} from '@/lib/glitch-server';
export const runtime='nodejs';

type Sub={endpoint:string;expirationTime?:number|null;keys:{p256dh:string;auth:string}};
function allowedPushEndpoint(endpoint:string){
 try{
  const u=new URL(endpoint);
  if(u.protocol!=='https:'||u.username||u.password||u.port)return false;
  const h=u.hostname.toLowerCase();
  return h==='fcm.googleapis.com'||h==='updates.push.services.mozilla.com'||
   h==='web.push.apple.com'||h==='push.apple.com'||
   /^wns\d*\.notify\.windows\.com$/.test(h)||
   /^[a-z0-9-]+\.push\.apple\.com$/.test(h);
 }catch{return false}
}
function validateSubscription(x:unknown):x is Sub{
 if(!x||typeof x!=='object')return false;
 const s=x as Partial<Sub>;
 return typeof s.endpoint==='string'&&s.endpoint.length<=2500&&allowedPushEndpoint(s.endpoint)&&
  typeof s.keys?.p256dh==='string'&&s.keys.p256dh.length>20&&s.keys.p256dh.length<=256&&
  typeof s.keys?.auth==='string'&&s.keys.auth.length>10&&s.keys.auth.length<=256;
}
const noStore={'Cache-Control':'no-store'};
export async function POST(req:NextRequest){
 const admin=getAdmin();if(!admin||!process.env.VAPID_PUBLIC_KEY||!process.env.VAPID_PRIVATE_KEY)return NextResponse.json({error:'Push storage is not configured'},{status:503,headers:noStore});
 const user=await authenticatedUser(req);
 if(!user)return NextResponse.json({error:'Sign in to subscribe'},{status:401,headers:noStore});
 let payload:unknown;
 try{payload=await req.json()}catch{return NextResponse.json({error:'Invalid JSON'},{status:400})}
 const subscription=(payload as {subscription?:unknown})?.subscription;
 if(!validateSubscription(subscription))return NextResponse.json({error:'Invalid browser push subscription'},{status:400});
 const hash=createHash('sha256').update(subscription.endpoint).digest('hex');
 const {error}=await admin.from('push_subscriptions').upsert({
  endpoint_hash:hash,user_id:user.id,endpoint:subscription.endpoint,
  p256dh:subscription.keys.p256dh,auth_key:subscription.keys.auth,updated_at:new Date().toISOString()
 },{onConflict:'endpoint_hash'});
 if(error)return NextResponse.json({error:'Database unavailable'},{status:503,headers:noStore});
 return NextResponse.json({ok:true},{headers:noStore});
}
export async function DELETE(req:NextRequest){
 const admin=getAdmin();if(!admin)return NextResponse.json({error:'Push storage is not configured'},{status:503});
 const user=await authenticatedUser(req);
 if(!user)return NextResponse.json({error:'Sign in to unsubscribe'},{status:401});
 let payload:{endpoint?:string};
 try{payload=await req.json()}catch{return NextResponse.json({error:'Invalid JSON'},{status:400})}
 if(!payload||typeof payload.endpoint!=='string'||!allowedPushEndpoint(payload.endpoint))return NextResponse.json({error:'Invalid endpoint'},{status:400});
 const hash=createHash('sha256').update(payload.endpoint).digest('hex');
 const {error}=await admin.from('push_subscriptions').delete().eq('endpoint_hash',hash).eq('user_id',user.id);
 if(error)return NextResponse.json({error:'Database unavailable'},{status:503});
 return NextResponse.json({ok:true},{headers:noStore});
}
