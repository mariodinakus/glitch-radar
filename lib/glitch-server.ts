import {createClient} from '@supabase/supabase-js';
import type {NextRequest} from 'next/server';

export function getAdmin(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return null;
 return createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
}
export async function authenticatedUser(req:NextRequest){
 const header=req.headers.get('authorization')||'';
 if(!header.startsWith('Bearer '))return null;
 const token=header.slice(7);
 if(token.length>8192||token.length<30)return null;
 const admin=getAdmin();if(!admin)return null;
 const {data,error}=await admin.auth.getUser(token);
 return error?null:data.user||null;
}
