import {ImageResponse} from 'next/og';
export const runtime='edge';
export async function GET(_request:Request,{params}:{params:Promise<{size:string}>}){
 const {size:raw}=await params;
 const size=raw==='512'?512:raw==='180'?180:raw==='192'?192:null;
 if(size===null)return new Response('Unknown icon size',{status:404});
 return new ImageResponse(
  <div style={{display:'flex',width:'100%',height:'100%',background:'#090C14',borderRadius:size*.18,alignItems:'center',justifyContent:'center'}}>
   <svg width="72%" height="72%" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 5 58 20v24L32 59 6 44V20L32 5Z" stroke="#F7436A" strokeWidth="2.8"/>
    <path d="M43 22 32 15 17 24v17l15 8 15-9V32H31" stroke="#FAF1F6" strokeWidth="5" strokeLinecap="square" strokeLinejoin="bevel"/>
    <path d="m8 27 13-6M42 41l14-8" stroke="#FF3B65" strokeWidth="5"/>
    <path d="M8 35h10m29-15h9" stroke="#FF9BAB" strokeWidth="2"/>
    <circle cx="48.5" cy="11" r="3" fill="#FF3B65"/>
   </svg>
  </div>,
  {width:size,height:size}
 );
}
