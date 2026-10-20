/** Quality checks for headline/excerpt translations. Simple language detection is intentional:
 * named entities, tickers and acronyms must not turn a Greek headline into "English". */
export type TranslationLang='el'|'en';
const gr=/[\u0370-\u03ff\u1f00-\u1fff]/u;
const latin=/[a-zA-Z]/;
const englishGlue=/\b(the|with|from|after|before|amid|while|against|between|over|into|have|has|were|said|says|will|would|could|should|about|what|when|where|why|how|latest|breaking|report|reports|official|officials|kills?|killed|dead|warns?|claims?|seeks?|calls?|back|deal|talks?|latest|strikes?|attack|war|protest|election|economy|government|president|prime minister|new|amid|over|due to|in the|at the|on the|as the|for the)\b/i;
const greekGlue=/(?:\b|^)(?:και|που|της|των|στο|στη|για|από|με|τον|την|οι|του|της|είναι|μετά|κατά|ενώ|λέει|στον|στις)(?:\b|$)/iu;
const suspicious=/\b(?:QUOTA.EXCEEDED|MYMEMORY|WARNING:|TRANSLATED\.NET|RATE.LIMIT|PLEASE.TRY.AGAIN|BAD.REQUEST|UNABLE.TO.TRANSLATE|INVALID.API.KEY|TRANSLATION.FAILED)\b/i;
function words(s:string,re:RegExp){return s.match(re)||[]}
export function needsTranslation(text:string,target:TranslationLang):boolean{
 const s=text.trim();if(!s)return false;
 const greek=words(s,/[\u0370-\u03ff\u1f00-\u1fff]{2,}/gu).length;
 const english=words(s,/[A-Za-z]{2,}/g).length;
 if(target==='el'){
  if(!gr.test(s))return english>0;
  // Many English words around a Greek fragment (frequent in RSS) need retranslation.
  return english>=4&&(english>greek*.6||englishGlue.test(s));
 }
 if(!latin.test(s))return greek>0;
 return greek>=3&&(greek>english*.5||greekGlue.test(s));
}
export function validTranslation(source:string,result:string,target:TranslationLang):boolean{
 const r=result.trim();const src=source.trim();
 if(!r||r.length<2||r.length>Math.max(src.length*3,src.length+230)||suspicious.test(r)||/<\/?[a-z][^>]*>/i.test(r))return false;
 if(r.toLocaleLowerCase()===src.toLocaleLowerCase()&&needsTranslation(src,target))return false;
 if(target==='el'&&!gr.test(r))return false;
 if(target==='en'&&!latin.test(r))return false;
 const greekWords=words(r,/[\\u0370-\\u03ff\\u1f00-\\u1fff]{2,}/gu).length;
 const latinWords=words(r,/[A-Za-z]{2,}/g).length;
 if(target==='el'&&greekWords<latinWords)return false;
 if(target==='en'&&latinWords<greekWords)return false;
 if(needsTranslation(r,target))return false;
 return true;
}
/** Some Greek RSS descriptions repeat the headline, publisher name and site address.
 * Normalize without rewriting facts. */
export function tidyNewsExcerpt(raw:string,title=''):string{
 let s=raw.replace(/\s+/g,' ').trim().replace(/\s+(?:www\.)[^\s]+\s*$/i,'').trim();
 if(!s)return '';
 const cutoff=s.search(/\s+[-–—]\s+(?:Η ΝΑΥΤΕΜΠΟΡΙΚΗ|THE GUARDIAN|BBC NEWS|ΕΡΤNEWS|ΠΡΩΤΟ ΘΕΜΑ)\s*$/i);
 if(cutoff>80)s=s.slice(0,cutoff).trim();
 const headline=title.replace(/\s+/g,' ').trim();
 if(headline&&s.toLocaleLowerCase().endsWith(headline.toLocaleLowerCase())&&s.length>headline.length+30)
  s=s.slice(0,-headline.length).replace(/[\s–—-]+$/,'').trim();
 return s;
}
