import type {Metadata,Viewport} from 'next';
import './globals.css';
export const metadata:Metadata={title:'GLITCH LIVE — Breaking World News',description:'Συνεχής παγκόσμια ενημέρωση: πόλεμοι, διαδηλώσεις, πολιτικές κρίσεις, αίτια και πιθανοί αντίκτυποι με επώνυμες πηγές.',applicationName:'GLITCH',manifest:'/manifest.webmanifest',icons:{icon:'/icon.svg'}};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#090a0d'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="el"><body>{children}</body></html>}
