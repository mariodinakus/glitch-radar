import {NextResponse} from 'next/server';
export const runtime='nodejs';
export async function GET(){
 const enabled=Boolean(process.env.VAPID_PUBLIC_KEY&&process.env.VAPID_PRIVATE_KEY&&process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY);
 return NextResponse.json({enabled,publicKey:enabled?process.env.VAPID_PUBLIC_KEY:undefined,requiresAccount:true},{headers:{'Cache-Control':'no-store'}});
}
