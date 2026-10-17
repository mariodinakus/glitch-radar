export type Category='earth'|'nature'|'space'|'tech'|'science'|'world'|'economy'|'health'|'climate'|'culture'|'sports'|'ai'|'energy';
export type Signal={id:string;category:Category;title:string;summary:string;score:number;level:'elevated'|'high'|'critical';timestamp:string;source:string;url:string;imageUrl?:string;imageCredit?:string;details:string[];metricLabel:string;metricValue:string;lat?:number;lon?:number;rawValue?:number;reason:string;confidence:'reported'|'community'|'catalog'|'publisher';};
export type SourceStatus={source:string;ok:boolean;count:number;error?:string};
import type {Intelligence} from './intelligence';
import type {BlindspotReport} from './blindspots';
export type Feed={generatedAt:string;signals:Signal[];sources:SourceStatus[];methodology:string;intelligence?:Intelligence;blindspots?:BlindspotReport};
