import {ImageResponse} from 'next/og';
export const runtime='edge';
export async function GET(_request:Request,{params}:{params:Promise<{size:string}>}){
 const {size:raw}=await params;
 const size=raw==='512'?512:raw==='180'?180:raw==='192'?192:null;
 if(!size)return new Response('Unknown icon size',{status:404});
 return new ImageResponse(
  <div style={{display:'flex',width:'100%',height:'100%',background:'#07090d',alignItems:'center',justifyContent:'center'}}>
   <svg width="100%" height="100%" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="10" width="492" height="492" rx="108" fill="#090B12" stroke="#ba8e4b" strokeWidth="8"/>
    <circle cx="256" cy="256" r="174" stroke="#ab8642" strokeWidth="3"/>
    <circle cx="256" cy="256" r="128" stroke="#a37d3d" strokeWidth="2"/>
    <circle cx="256" cy="256" r="82" stroke="#a37d3d" strokeWidth="2"/>
    <path d="M256 256L373 121A179 179 0 0 1 432 172Z" fill="#C12D25" fillOpacity=".5"/>
    <path d="M256 44v52m0 322v50M44 256h54m324 0h46" stroke="#F8E0A5" strokeWidth="4"/>
    <path d="M365 167c-24-27-64-43-109-43-78 0-131 57-131 133 0 78 56 130 131 130 52 0 101-27 123-69v-59H267" stroke="#E4AF58" strokeWidth="44" strokeLinejoin="bevel"/>
    <path d="M65 198h100M88 212h85M61 226h104M347 322h93M362 338h68" stroke="#090B12" strokeWidth="10"/>
    <circle cx="372" cy="158" r="12" fill="#F25046"/><circle cx="399" cy="207" r="7" fill="#FF7660"/>
    <circle cx="256" cy="256" r="8" fill="#FFF1BB"/>
   </svg>
  </div>,
  {width:size,height:size,headers:{'Cache-Control':'public,max-age=3600,s-maxage=86400'}}
 );
}
