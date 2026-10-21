import {NextRequest,NextResponse} from 'next/server';
import {authenticatedUser,getAdmin} from '@/lib/glitch-server';
export const runtime='nodejs';
const tokenValid=(value:unknown):value is string=>
 typeof value==='string'&&value.length<=300&&/^Expo(nent)?PushToken\[[A-Za-z0-9_-]{15,}\]$/.test(value);
export async function POST(req:NextRequest){
 const user=await authenticatedUser(req),admin=getAdmin();
 if(!user)return NextResponse.json({error:'Login required'},{status:401});
 if(!admin)return NextResponse.json({error:'Accounts not configured'},{status:503});
 let body:{token?:unknown;platform?:unknown};
 try{body=await req.json()}catch{return NextResponse.json({error:'Invalid JSON'},{status:400})}
 if(!tokenValid(body?.token)||!['android','ios'].includes(String(body?.platform)))return NextResponse.json({error:'Invalid token'},{status:400});
 const {error}=await admin.from('native_push_tokens').upsert({token:body.token,user_id:user.id,platform:body.platform,updated_at:new Date().toISOString()},{onConflict:'token'});
 return NextResponse.json(error?{error:'Database not configured'}:{ok:true},{status:error?503:200});
}
export async function DELETE(req:NextRequest){
 const user=await authenticatedUser(req),admin=getAdmin();
 if(!user)return NextResponse.json({error:'Login required'},{status:401});
 if(!admin)return NextResponse.json({error:'Accounts not configured'},{status:503});
 let body:{token?:unknown};try{body=await req.json()}catch{return NextResponse.json({error:'Invalid JSON'},{status:400})}
 if(!tokenValid(body?.token))return NextResponse.json({error:'Invalid token'},{status:400});
 const {error}=await admin.from('native_push_tokens').delete().eq('user_id',user.id).eq('token',body.token);
 return NextResponse.json(error?{error:'Storage unavailable'}:{ok:true},{status:error?503:200});
}
