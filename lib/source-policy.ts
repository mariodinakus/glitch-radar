/** Restrict the editorial news feed to non-Greek, English-language publishers.
 * Language checks are intentionally conservative and apply to headlines, not proper names.
 * Greece-related reporting from non-Greek English outlets remains eligible. */
const greekLetters=/[Ͱ-Ͽἀ-῿]/gu;
const latinLetters=/[A-Za-z]/g;
const blockedSource=/\b(?:ertnews|naftemporiki|protothema|kathimerini|ekathimerini|in\.gr|news247|newsbomb|iefimerida|capital\.gr|cnn[\s.]greece|skai|newsit|athens[- ]?voice|athens[- ]?news[- ]?agency|amna\.gr|athina984|tanea|tovima|enikos|lifo)\b|(?:ΕΡΤ|Ναυτεμπορικ|Πρώτο Θέμα|Καθημερινή|ΑΠΕ.?ΜΠΕ|ΤΑ ΝΕΑ|ΤΟ ΒΗΜΑ|Ελλάδα)/iu;
const blockedDomains=[
 'ertnews.gr','protothema.gr','naftemporiki.gr','kathimerini.gr','ekathimerini.com',
 'in.gr','news247.gr','newsbomb.gr','iefimerida.gr','capital.gr','cnn.gr','skai.gr',
 'newsit.gr','amna.gr','tanea.gr','tovima.gr','enikos.gr','lifo.gr'
];
export function isEnglishForeignOutlet(source:string,title:string,url:string):boolean{
 if(!title||!source||blockedSource.test(source))return false;
 try{
  const u=new URL(url);
  if(blockedDomains.some(d=>u.hostname===d||u.hostname.endsWith('.'+d)))return false;
 }catch{return false}
 const gr=(title.match(greekLetters)||[]).length;
 const en=(title.match(latinLetters)||[]).length;
 return en>=8 && gr===0;
}
