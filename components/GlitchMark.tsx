'use client';
export function GlitchMark({size=42}:{size?:number}){
 return <svg width={size} height={size} viewBox="0 0 64 64" fill="none" role="img" aria-label="GLITCH symbol" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="glitchMetal" x1="4" y1="3" x2="61" y2="59" gradientUnits="userSpaceOnUse"><stop stopColor="#FB7990"/><stop offset="1" stopColor="#E92757"/></linearGradient></defs>
  <path d="M32 4 59 19.5v25L32 60 5 44.5v-25L32 4Z" stroke="url(#glitchMetal)" strokeWidth="2.5"/>
  <path d="M43 22 32 15 17 24v17l15 8 15-9V32H31" stroke="#F3ECF1" strokeWidth="5" strokeLinecap="square" strokeLinejoin="bevel"/>
  <path d="m7 27 14-6M42 41l15-8" stroke="#FF385F" strokeWidth="5"/>
  <path d="M8 35h10m30-15h8" stroke="#FF8A9A" strokeWidth="2"/>
  <circle cx="48.5" cy="10.5" r="3" fill="#FF385F"/>
 </svg>;
}
