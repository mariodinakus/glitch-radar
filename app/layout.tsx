import type {Metadata,Viewport} from 'next';
import './pulse.css';
import './engines.css';
export const metadata:Metadata={title:'GLITCH — World Pulse | Global Events, Countries & Companies',description:'Global intelligence dashboard: event dossiers, publication timelines, countries, companies, and bilingual Greek / English news from linked sources.',applicationName:'GLITCH',manifest:'/manifest.webmanifest',icons:{icon:'/icon.svg'}};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#090a0d'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="el"><body>{children}</body></html>}
