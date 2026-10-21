import {NextResponse} from 'next/server';
export const runtime='nodejs';
export async function GET(){
 const enabled=Boolean(process.env.VAPID_PUBLIC_KEY&&process.env.VAPID_PRIVATE_KEY&&process.env.UPSTASH_REDIS_REST_URL&&process.env.UPSTASH_REDIS_REST_TOKEN);
 return NextResponse.json({enabled,publicKey:enabled?process.env.VAPID_PUBLIC_KEY:undefined},{headers:{'Cache-Control':'no-store'}});
}
