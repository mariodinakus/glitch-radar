import type {Metadata, Viewport} from 'next';
import './globals.css';
export const metadata:Metadata={title:'GLITCH — World Signal Radar',description:'A bilingual Greek/English live radar of global observations, research, news and geolocated events from real public sources.',applicationName:'GLITCH',manifest:'/manifest.webmanifest',icons:{icon:'/icon.svg'}};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#080e18'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="el"><body>{children}</body></html>}
