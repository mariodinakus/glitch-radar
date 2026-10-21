import {createClient, type SupabaseClient} from '@supabase/supabase-js';

let instance:SupabaseClient|null=null;

/** Public anon key is safe in the browser; Supabase RLS enforces per-user access. */
export function getGlitchClient():SupabaseClient|null{
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key||!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url))return null;
 if(!instance)instance=createClient(url,key,{
  auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}
 });
 return instance;
}
export const TOPICS=[
 {id:'all',label:'All topics'},
 {id:'world',label:'World & geopolitics'},
 {id:'economy',label:'Economy'},
 {id:'tech',label:'AI & technology'},
 {id:'climate',label:'Climate & disasters'},
 {id:'energy',label:'Energy'},
 {id:'science',label:'Science & space'},
 {id:'sports',label:'Sports'}
] as const;
export const topicIds=TOPICS.map(t=>t.id);
export type GlitchProfile={
 id:string;display_name:string;topics:string[];min_score:number;
 notifications_enabled:boolean;prefs?:unknown;
};
export function cleanPrefs(raw:unknown){
 const p=(raw&&typeof raw==='object'?raw:{}) as Record<string,unknown>;
 const a=(v:unknown)=>Array.isArray(v)?v.filter((s):s is string=>typeof s==='string').slice(0,500):[];
 return {follow:a(p.follow),mute:a(p.mute),read:a(p.read),saved:a(p.saved)};
}
