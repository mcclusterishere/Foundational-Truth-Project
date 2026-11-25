'use strict';
const $=id=>document.getElementById(id), ns='http://www.w3.org/2000/svg';
const element=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n};
const svg=(tag,attrs)=>{const e=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));return e};
let data=[], countries=[], visible=[], selection=null, globe=true, center=-87;
const options=['region','kind','status'];
const recordFields=[
 ['observer','Observer / author'],
 ['encounterDate','Encounter date'],
 ['recordType','Record type'],
 ['sourceLocator','Source locator'],
 ['originalWording','Original wording'],
 ['gloss','Plain-language gloss'],
 ['transmission','How the text survives']
];
const hasRecord=e=>e.record&&recordFields.some(([key])=>typeof e.record[key]==='string'&&e.record[key].trim());
const evidenceType=e=>e.kind;
const traits=e=>Array.isArray(e.traits)?e.traits.filter(v=>typeof v==='string'&&v.trim()):[];
const isDirectComplexion=e=>e.kind==='First-contact accounts'&&traits(e).includes('Complexion');
function visualLink(visual){
  let u;try{u=new URL(visual?.url)}catch{return null}
  if(u.protocol!=='https:')return null;
  const a=element('a',visual.title||'View original object record','visual');
  a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';return a;
}
const norm=s=>s.toLowerCase().normalize('NFD').replace(/\p{M}/gu,'');
function recordSection(e){
 if(!hasRecord(e))return null;
 const section=element('section',null,'record');section.append(element('h4',e.kind==='First-contact accounts'?'First-contact record':e.kind==='Archival context'?'Archive record':e.kind==='Colonial-era comparator'?'Comparator record':'Source record'));
 const list=element('dl');for(const [key,label] of recordFields){
   const value=e.record[key];if(typeof value!=='string'||!value.trim())continue;
   const box=element('dd');box.append(element(key==='originalWording'?'blockquote':'span',value));list.append(element('dt',label),box);
 }
 section.append(list);return section;
}

const get=(id)=>$(id).value;
const dated=e=>[e.startYear,e.endYear].some(Number.isFinite);
const years=e=>{const a=[e.startYear,e.endYear].filter(Number.isFinite);return [Math.min(...a),Math.max(...a)]};
const fmt=y=>y<0?Math.abs(y).toLocaleString('en-US')+' BCE':y.toLocaleString('en-US')+' CE';
function period(e,p){if(!p)return true;if(p==='undated')return !dated(e);if(!dated(e))return false;const [lo,hi]=years(e);return p==='early'?lo<1:p==='pre'?hi>=1&&lo<=1491:hi>=1492}
function stamp(e){if(!dated(e))return 'Undated';const [a,b]=years(e);return a===b?fmt(a):'c. '+fmt(a)+' to '+fmt(b)}
function choose(id,{fromMap=false}={}){selection=id;document.querySelectorAll('.card,.pin').forEach(n=>{const active=n.dataset.id===id;n.classList.toggle('active',active);if(n.classList.contains('pin')){n.dataset.selected=active;n.setAttribute('aria-pressed',active)}else n.querySelector('button').setAttribute('aria-pressed',active)});if(fromMap){document.body.classList.remove('world');const card=[...document.querySelectorAll('.card')].find(n=>n.dataset.id===id);card?.querySelector('button').focus()}}
function cards(){const target=$('cards');target.replaceChildren();$('count').textContent=visible.length+' of '+data.length+' evidence entries';if(!visible.length){target.append(element('p','No evidence matches these filters. Try clearing one of the filters.'));return}
  visible.forEach((e,i)=>{const n=element('article',null,'card mn__post-card');n.dataset.id=e.id;
    const h=element('h3',e.title); const m=element('p',null,'meta');m.append(element('span',e.status,'tag'),document.createTextNode(' · '+e.kind+' · '+e.region+' · '+stamp(e)));
    const pair=element('dl');for(const [name,body] of [['Observation',e.observation],['Interpretation',e.interpretation],['Limits / open questions',e.limits]]){pair.append(element('dt',name),element('dd',body||'Not stated in this entry.'))}
    const ul=element('ul');for(const s of e.sources||[]){let u;try{u=new URL(s.url)}catch{}if(!u||u.protocol!=='https:')continue;const li=element('li'), a=element('a',s.title||u.hostname);a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';li.append(a);ul.append(li)}
    const show=element('button','Highlight on map','select-card');show.type='button';show.setAttribute('aria-pressed','false');show.addEventListener('click',()=>{center=e.lon;$('rotation').value=center;document.body.classList.add('world');drawMap();choose(e.id);document.querySelector('.map-panel').scrollIntoView()});if(![e.lat,e.lon].every(Number.isFinite)){show.disabled=true;show.textContent='No public map location'}
    const detail=element('details'),summary=element('summary','Read evidence & sources');detail.append(summary);n.append(element('p',stamp(e),'dateline'),h,element('p',e.observation,'mn__post-body'),m);
    if(traits(e).length){const tags=element('ul',null,'traits');tags.setAttribute('aria-label','Appearance evidence');for(const trait of traits(e))tags.append(element('li',trait));n.append(tags)}
    const record=recordSection(e);if(record)detail.append(record);
    const visual=visualLink(e.visual);if(visual)detail.append(visual);
    detail.append(pair);if(e.research){const r=e.research,extra=element('details');extra.append(element('summary','Pre-America dossier note'),element('p',r.place+' · '+r.dates),element('p',r.obs),element('p',r.reading),element('p',r.limits));detail.append(extra)}detail.append(element('p','Sources','eyebrow'),ul);n.append(detail,show);target.append(n);
  });
}
const rad=Math.PI/180;
function project(lon,lat,r=1){if(!globe)return [(lon+174)*4.3+30,(82-lat)*3.6+24,lon>=-180&&lon<=-29];
const phi=lat*rad,l=(lon-center)*rad,p=12*rad;
return [340+246*r*Math.cos(phi)*Math.sin(l),284-246*r*(Math.cos(p)*Math.sin(phi)-Math.sin(p)*Math.cos(phi)*Math.cos(l)),Math.sin(p)*Math.sin(phi)+Math.cos(p)*Math.cos(phi)*Math.cos(l)>=0]}
function line(coords){let previous=false,d='';for(const [lat,lon] of coords){const [x,y,ok]=project(lon,lat);if(ok)d+=(previous?'L':'M')+x.toFixed(1)+','+y.toFixed(1);previous=ok}return d}
function drawMap(){const base=$('base'), pins=$('pins');base.replaceChildren();pins.replaceChildren();
base.append(globe?svg('circle',{cx:340,cy:284,r:246,fill:'url(#ocean)',stroke:'#69a6aa'}):svg('rect',{x:15,y:10,width:650,height:550,rx:12,fill:'url(#ocean)',stroke:'#69a6aa'}));
const grid=svg('g',{fill:'none',stroke:'#b6e1da','stroke-opacity':'.22'});for(let lon=-165;lon<-25;lon+=15)grid.append(svg('path',{d:line(Array.from({length:90},(_,i)=>[-88+2*i,lon]))}));for(let lat=-60;lat<=75;lat+=15)grid.append(svg('path',{d:line(Array.from({length:77},(_,i)=>[lat,-180+i*2]))}));base.append(grid);
for(const country of countries){let d='';for(const poly of country.p||[])for(const r of poly){let points=[];for(let i=0;i<r.length;i+=2){const [x,y,ok]=project(r[i],r[i+1]);if(ok)points.push(x.toFixed(1)+','+y.toFixed(1))}if(points.length>2)d+='M'+points.join('L')+'Z'}if(d)base.append(svg('path',{d,fill:'#667b83',stroke:'#9aa9ac','stroke-width':'.55','fill-rule':'evenodd'}))}
const places=[];visible.forEach((e,i)=>{if(![e.lat,e.lon].every(Number.isFinite))return;const [x,y,ok]=project(e.lon,e.lat);if(!ok)return;let xp=x,yp=y;for(let j=0;places.some(([a,b])=>Math.hypot(a-xp,b-yp)<27)&&j<15;j++){const angle=j*2.399;xp=x+(29+8*j)*Math.cos(angle);yp=y+(29+8*j)*Math.sin(angle)}places.push([xp,yp]);if(xp!==x||yp!==y)pins.append(svg('path',{d:'M'+x+','+y+'L'+xp+','+yp,stroke:'#e6776b',fill:'none'}));
const pin=svg('g',{transform:'translate('+xp+','+yp+')',class:'pin',tabindex:0,role:'button','aria-label':e.title,'aria-pressed':'false','data-id':e.id});
pin.append(svg('circle',{r:21,fill:'transparent'}),svg('circle',{r:13,class:'halo'}));const number=svg('text',{});number.textContent=i+1;pin.append(number);pin.addEventListener('click',()=>choose(e.id,{fromMap:true}));pin.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();choose(e.id,{fromMap:true})}});pins.append(pin)
});if(selection)choose(selection)}
function filter(){const query=norm(get('query').trim()), p=get('period'),trait=get('trait'),strict=$('strict-complexion').checked;visible=data.filter(e=>(!trait||traits(e).includes(trait))&&(!strict||isDirectComplexion(e))&&period(e,p)&&options.every(k=>!get(k)||get(k)===(k==='kind'?evidenceType(e):e[k]))&&(!query||norm([e.title,e.region,e.kind,evidenceType(e),e.status,e.observation,e.interpretation,e.limits,...traits(e),e.visual?.title,e.research?.place,e.research?.method,e.research?.dates,...(hasRecord(e)?recordFields.map(([k])=>e.record[k]):[]),...(e.sources||[]).map(s=>s.title+' '+s.url)].join(' ')).includes(query)));if(!visible.some(e=>e.id===selection))selection=null;cards();drawMap()}
const scanAssets={delisle:'maps/delisle.jpg',chegeree:'maps/chegeree.jpg',bowles:'maps/bowles.jpg'};
const scanInfo={
 city:['1725-05-30','Anonymous mapmaker','Bibliothèque nationale de France / World Digital Library','No known restrictions per collection.','https://www.loc.gov/item/2021668644/'],
 delisle:['1718','Guillaume Delisle','Library of Congress, Geography and Map Division','Free to use and reuse; no contrary item advisory.', 'https://www.loc.gov/item/98685731/'],
 anville:['1752','Jean-Baptiste Bourguignon d’Anville and G. de la Haye','Library of Congress, France in America','Public domain or no known restrictions per collection.', 'https://www.loc.gov/resource/g3860.ct006300/'],
 chegeree:['c. 1755','Attributed to Chegeree; associated with a British official','Library of Congress, Geography and Map Division','Free to use and reuse; no contrary item advisory.', 'https://www.loc.gov/item/74695023/'],
 bowles:['c. 1774','Carington Bowles','Library of Congress / World Digital Library','No known restrictions per collection.', 'https://www.loc.gov/item/74694268/']
};
const layerNames={claim:'Imperial claims',control:'Documented administration',indigenous:'Indigenous places',modern:'Modern orientation'};
const places=[
 ['claim',1718,1761,-90.07,29.95,'French Louisiana claimed · reference only','https://www.loc.gov/item/98685731/'],
 ['claim',1762,1800,-90.07,29.95,'Spanish cession claim · no boundary drawn','https://www.loc.gov/collections/louisiana-european-explorations-and-the-louisiana-purchase/articles-and-essays/louisiana-as-a-spanish-colony/'],
 ['claim',1763,1809,-91.11,30.45,'West Florida · British in 1763; later Spanish and disputed by U.S.','https://www.loc.gov/collections/louisiana-european-explorations-and-the-louisiana-purchase/articles-and-essays/a-question-of-boundaries/'],
 ['claim',1800,1803,-89.8,30.2,'Retrocession promised; then U.S. cession signed in 1803','https://www.archives.gov/milestone-documents/louisiana-purchase-treaty'],
 ['control',1725,1725,-90.07,29.95,'New Orleans · French city plan','https://www.loc.gov/item/2021668644/'],
 ['control',1769,1803,-90.07,29.95,'New Orleans · Spanish Judiciary records','https://louisianastatemuseum.org/louisiana-historical-center-colonial-documents'],
 ['control',1803,1803,-90.08,29.97,'Cabildo · handovers on Nov. 30 and Dec. 20','https://guides.loc.gov/louisiana-purchase-legislative-timeline/1803-1804'],
 ['indigenous',1718,1764,-91.55,31,'Tunica villages · approximate corridor','https://www.tunicabiloxi.org/history/'],
 ['indigenous',1718,1729,-91.36,31.53,'Natchez Grand Village · approx. public location','https://mdah.ms.gov/explore-mississippi/grand-village-natchez-indians'],
 ['indigenous',1718,1835,-91.55,29.88,'Chitimacha / Bayou Teche · representative location, not full homeland','https://chitimacha.gov/history-culture/tribal-history'],
 ['indigenous',1835,1835,-93.75,32.52,'Caddo treaty meeting · present-day Shreveport area','https://mycaddonation.com/history-1'],
 ['modern',0,3000,-90.07,29.95,'New Orleans, Louisiana · modern locator',''],
 ['modern',0,3000,-91.4,31.56,'Natchez, Mississippi · modern locator',''],
 ['modern',0,3000,-93.75,32.52,'Shreveport, Louisiana · modern locator','']
];
function renderLayers(year,key){
 const map=$('pilot-points'), list=$('pilot-key');map.replaceChildren();list.replaceChildren();let occupied=[];
 const x=lon=>34+(-lon-87.5)*(-56)+392,y=lat=>235-(lat-28)*39;
 map.append(svg('path',{d:'M210 52H270 M240 22V82',stroke:'#453c37',fill:'none','aria-hidden':'true'}));
 for(const [layer,start,end,lon,lat,label,url] of places){
  if(!$('layer-'+layer).checked||year<start||year>end)continue;
  if(layer==='control'&&year===1803&&label.includes('Cabildo')&&!key.startsWith('1803-11')&&!key.startsWith('1803-12'))continue;
  const renderedLabel=label.startsWith('Cabildo')?(key==='1803-11-30'?'Cabildo · Spain hands over to France':'Cabildo · France hands over to the U.S.'):label;
  if(layer==='control'&&year===1803&&label.includes('Judiciary')&&(key.startsWith('1803-11')||key.startsWith('1803-12')))continue;
  const number=list.children.length+1;
  const ox=x(lon),oy=y(lat);let px=ox,py=oy;
  for(let j=0;occupied.some(([u,v])=>Math.hypot(u-px,v-py)<23)&&j<12;j++){let a=j*2.4;px=ox+(24+j*2)*Math.cos(a);py=oy+(24+j*2)*Math.sin(a);}
  occupied.push([px,py]);if(ox!==px||oy!==py)map.append(svg('line',{x1:ox,y1:oy,x2:px,y2:py,stroke:'#918176'}));
  const g=svg('g',{transform:'translate('+px+','+py+')',class:'point '+layer});
  g.append(svg('circle',{r:11}));const n=svg('text',{});n.textContent=number;g.append(n);map.append(g);
  const row=element('li',null,layer);row.append(element('span',layerNames[layer]+': ','kicker'));
  if(url){const a=element('a',renderedLabel);a.href=url;a.target='_blank';a.rel='noopener noreferrer';row.append(a)} else row.append(element('span',renderedLabel));
  list.append(row);
 }
 if(!list.children.length)list.append(element('li','No selected reference points for this stop.'));
}
function renderScan(date){
 let key=date.startsWith('1718')?'delisle':date==='1725-05-30'?'city':date==='1752'?'anville':date==='c. 1755'?'chegeree':date==='c. 1774'||date==='1763-02-10'?'bowles':null;
 const pane=$('scan-pane');pane.replaceChildren();
 if(!key){pane.append(element('p','No original map is attached to this stop. The dated evidence and its source sit above.','scan-empty'));return;}
 const [made,who,credit,rights,url]=scanInfo[key];
 const fallback=element('p','Archive link only. A local copy of this scan is not included.','scan-empty');fallback.hidden=Boolean(scanAssets[key]);
 if(scanAssets[key]){const img=element('img');img.alt='Archival map dated '+made+', by '+who;
 img.addEventListener('error',()=>{img.hidden=true;fallback.hidden=false;fallback.textContent='Image could not load here. Open the original at the archive.'});
 img.src=scanAssets[key];pane.append(img);}
 const a=element('a','Open original at the archive');a.href=url;a.target='_blank';a.rel='noopener noreferrer';
 pane.append(fallback,element('p',made+' · '+who,'trail-meta'),element('p',credit+' · '+rights,'time-context'),a);
}

const timeline=[
 ['1718','Map · asserted claim','Delisle maps French Louisiana','French promotional cartography, not a census of power or evidence of continuous control.','https://www.loc.gov/item/98685731/'],
 ['1725-05-30','Map · city administration','New Orleans city plan','Anonymous manuscript (original held by the Bibliothèque nationale de France). Streets and administrative buildings document the city, not hinterland rule.','https://www.loc.gov/item/2021668644/'],
 ['1752','Map · French regional cartography','D’Anville’s map of Louisiana','The archive dates this impression to 1752. It uses a Paris prime meridian; geography shown is neither a fixed boundary nor proof of control.','https://www.loc.gov/resource/g3860.ct006300/'],
 ['c. 1755','Map · Indigenous geographic knowledge','Chegeree’s manuscript','Ohio–Mississippi corridor, not the delta. The author’s Nation is unconfirmed.','https://www.loc.gov/item/74695023/','chegeree'],
 ['1762-11-03','Treaty · asserted jurisdiction','Fontainebleau cession to Spain','A secret agreement, not the date of an administrative handover. New Orleans and its island were included.','https://www.loc.gov/collections/louisiana-european-explorations-and-the-louisiana-purchase/articles-and-essays/louisiana-as-a-spanish-colony/'],
 ['1763-02-10','Treaty · claimed boundary','Treaty of Paris, Article VII','Boundary described along the Mississippi and through Iberville and the lakes, with New Orleans and its island excepted. See the treaty extract on Bowles’s later map.','https://www.loc.gov/resource/g3300.ar009900/'],
 ['1769','Court records · documented administration','Spanish Judiciary records begin','A dated administrative milestone, not a claim of uniform control over Indigenous territories.','https://louisianastatemuseum.org/louisiana-historical-center-colonial-documents'],
 ['c. 1774','Map · British viewpoint','Bowles depicts the 1763 terms','The scan was drawn around 1774, not in 1763. Treaty boundary claims do not demonstrate who controlled each place.','https://www.loc.gov/item/74694268/'],
 ['1798-01-10','Person-level primary record','Cecilia petitions for Naneta','The January petition and March 15 appraisal order survive; they do not establish a grant of freedom.','https://www.lacolonialdocs.org/document/18398','naneta'],
 ['1800-10-01','Treaty · retrocession promised','San Ildefonso','Spain promised retrocession to France; this is not the date France took possession. See Article III as reproduced in the 1803 treaty.','https://www.archives.gov/milestone-documents/louisiana-purchase-treaty'],
 ['1803-04-30','Treaty · cession signed','Louisiana Purchase treaty','Signature and possession differ. Its territorial extent was disputed, including in Spanish West Florida.','https://www.archives.gov/milestone-documents/louisiana-purchase-treaty'],
 ['1803-11-30','Handover · New Orleans','Spain transfers Louisiana to France','Formal handover at the Cabildo does not settle the full extent of the territory.','https://guides.loc.gov/louisiana-purchase-legislative-timeline/1803-1804'],
 ['1803-12-20','Handover · New Orleans','France transfers Louisiana to the United States','New Orleans changes hands; do not show all of modern Louisiana as U.S. territory on this date.','https://www.archives.gov/files/historical-docs/doc-content/images/louisiana-purchase-new-orleans-proclamation.pdf'],
 ['1810','Annexation · disputed territory','U.S. annexation of part of West Florida','Mississippi-to-Pearl annexation is distinct from the 1803 transfer.','https://www.loc.gov/collections/louisiana-european-explorations-and-the-louisiana-purchase/articles-and-essays/a-question-of-boundaries/'],
 ['1812','Statehood · modern orientation','Louisiana statehood','Modern state geography is a separate orientation layer, never a substitute for colonial or Indigenous boundaries.','https://www.archives.gov/legislative/features/louisiana-statehood'],
 ['1835-07-01','Treaty · Indigenous nation and U.S.','Caddo treaty at the Agency House','Read the original alongside the Caddo Nation’s account. The 1836 ratification is separate from signing.','https://digitreaties.org/treaties/treaty/147968168/','caddo-1835']
];
function wireTimeline(){
 const slider=$('time-slider');slider.max=timeline.length-1;
 const refresh=()=>{const [date,layer,title,description,url,id]=timeline[Number(slider.value)||0];
 slider.setAttribute('aria-valuetext',date+' '+title);$('time-date').textContent=date;
 const card=$('time-card'),link=element('a','Open source');link.href=url;link.target='_blank';link.rel='noopener noreferrer';
 renderScan(date);renderLayers(Number(date.match(/\d{4}/)[0]),date);
 card.replaceChildren(element('p',layer,'trail-meta'),element('h2',title),element('p',description,'time-context'),link);
 if(id){const b=element('button','Find in feed');b.onclick=()=>{document.body.classList.remove('world');$('filters').reset();$('query').value=id==='naneta'?'Naneta':id==='chegeree'?'Chegeree':'Caddo treaty';filter();$('results').scrollIntoView()};card.append(b)}
 };
 slider.addEventListener('input',refresh);for(const k of Object.keys(layerNames))$('layer-'+k).addEventListener('change',refresh);refresh();
}

function init(entries){if(!Array.isArray(entries))throw new Error('Expected an array of evidence entries');data=entries.slice().sort((a,b)=>(a.startYear??Infinity)-(b.startYear??Infinity));$('feedTab').onclick=()=>{document.body.classList.remove('world');window.scrollTo(0,0)};$('mapTab').onclick=()=>{document.body.classList.add('world');document.querySelector('.map-panel').scrollIntoView()};$('filterTab').onclick=()=>$('drawer').showModal();$('close').onclick=()=>$('drawer').close();
 for(const k of options){for(const v of [...new Set(data.map(e=>k==='kind'?evidenceType(e):e[k]).filter(v=>typeof v==='string'&&v))].sort()){$(k).append(new Option(v,v))}}
 for(const v of [...new Set(data.flatMap(traits))].sort())$('trait').append(new Option(v,v));
 $('filters').addEventListener('input',filter);$('filters').addEventListener('submit',e=>e.preventDefault());$('filters').addEventListener('reset',()=>setTimeout(filter));
 $('view').addEventListener('click',()=>{globe=!globe;$('rotation-label').hidden=!globe;$('view').textContent=globe?'Globe view':'Flat map';$('view').setAttribute('aria-pressed',globe);drawMap()});
 $('rotation').addEventListener('input',()=>{center=Number(get('rotation'));drawMap()});filter();wireTimeline();
}
const read=async path=>{const r=await fetch(path);if(!r.ok)throw new Error(String(r.status));return r.json()};
read('data/country-boundaries-110m.json').then(x=>{countries=x.countries||[];drawMap()}).catch(()=>{$('map').setAttribute('aria-label','Map outlines unavailable; the evidence index remains available')});
read('data/evidence.json').then(init).catch(()=>{$('count').textContent='Evidence could not load. Start the local web server and reload.'});
