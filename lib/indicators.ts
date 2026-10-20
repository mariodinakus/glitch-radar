export type IndicatorGroup='indices'|'energy'|'metals'|'fx'|'risk';
export type Indicator={symbol:string;el:string;en:string;group:IndicatorGroup;unit?:string;digits?:number;ticker?:boolean};
export const INDICATORS:Indicator[]=[
 {symbol:'^GSPC',el:'S&P 500',en:'S&P 500',group:'indices',ticker:true},
 {symbol:'^IXIC',el:'Nasdaq',en:'Nasdaq',group:'indices'},
 {symbol:'^DJI',el:'Dow Jones',en:'Dow Jones',group:'indices'},
 {symbol:'^STOXX50E',el:'Euro Stoxx 50',en:'Euro Stoxx 50',group:'indices',ticker:true},
 {symbol:'^GDAXI',el:'DAX',en:'DAX',group:'indices'},
 {symbol:'^FTSE',el:'FTSE 100',en:'FTSE 100',group:'indices'},
 {symbol:'GD.AT',el:'Χ.Α. Γενικός',en:'Athens General',group:'indices',ticker:true},
 {symbol:'^N225',el:'Nikkei 225',en:'Nikkei 225',group:'indices'},
 {symbol:'000001.SS',el:'Shanghai',en:'Shanghai',group:'indices'},
 {symbol:'^TA125.TA',el:'Τελ Αβίβ 125',en:'Tel Aviv 125',group:'indices'},
 {symbol:'BZ=F',el:'Brent',en:'Brent',group:'energy',unit:'$',ticker:true},
 {symbol:'CL=F',el:'WTI',en:'WTI',group:'energy',unit:'$'},
 {symbol:'TTF=F',el:'Φυσικό αέριο TTF',en:'TTF gas',group:'energy',unit:'€',ticker:true},
 {symbol:'NG=F',el:'Φυσικό αέριο ΗΠΑ',en:'US nat. gas',group:'energy',unit:'$',digits:3},
 {symbol:'GC=F',el:'Χρυσός',en:'Gold',group:'metals',unit:'$',ticker:true},
 {symbol:'SI=F',el:'Ασήμι',en:'Silver',group:'metals',unit:'$'},
 {symbol:'HG=F',el:'Χαλκός',en:'Copper',group:'metals',unit:'$',digits:3},
 {symbol:'ZW=F',el:'Σιτάρι',en:'Wheat',group:'metals',unit:'¢'},
 {symbol:'EURUSD=X',el:'EUR/USD',en:'EUR/USD',group:'fx',digits:4,ticker:true},
 {symbol:'DX-Y.NYB',el:'Δείκτης δολαρίου',en:'Dollar index',group:'fx'},
 {symbol:'BTC-USD',el:'Bitcoin',en:'Bitcoin',group:'fx',unit:'$',digits:0,ticker:true},
 {symbol:'^TNX',el:'Ομόλογο ΗΠΑ 10ετές',en:'US 10Y yield',group:'risk',unit:'%',digits:2,ticker:true},
 {symbol:'^VIX',el:'VIX (φόβος)',en:'VIX (fear)',group:'risk',ticker:true}
];
export const indicatorBySymbol=(s:string)=>INDICATORS.find(i=>i.symbol===s);
