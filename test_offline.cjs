const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict');
const html=fs.readFileSync('The-Real-History-v6.html','utf8');
const stack=[];
class E {
 constructor(tag=''){this.tag=tag;this.children=[];this.dataset={};this.attributes={};this.value='';this.textContent='';this.events={};this.classes=new Set;this.style={};this.hidden=false;this.disabled=false;this.clientWidth=400;this.clientHeight=300;this.offsetWidth=400;this.offsetHeight=300;this.classList={contains:c=>this.classes.has(c),add:c=>this.classes.add(c),remove:c=>this.classes.delete(c),toggle:(c,v)=>v?this.classes.add(c):this.classes.delete(c)};stack.push(this)}
 set className(s){for(const c of s.split(' '))this.classes.add(c)}
 set id(v){this._id=v;this.attributes.id=String(v);ids[v]=this}
 get id(){return this._id}
 set tabIndex(v){this.attributes.tabindex=String(v)}
 setAttribute(k,v){this.attributes[k]=String(v);if(k==='class')this.className=v;if(k==='id')this.id=v;if(k==='data-id')this.dataset.id=v;if(k==='data-n')this.dataset.n=v}
 append(...v){this.children.push(...v)}
 replaceChildren(...nodes){this.children=nodes}
 addEventListener(t,cb){this.events[t]=cb}
 querySelector(t){
  const match=c=>{
   if(!c)return false;
   if(t.startsWith('.'))return c.classes&&c.classes.has(t.slice(1));
   if(t.startsWith('#'))return c.id===t.slice(1);
   return c.tag===t;
  };
  const walk=n=>{for(const c of n.children||[]){if(match(c))return c;const hit=walk(c);if(hit)return hit}};
  return walk(this);
 }
 getBoundingClientRect(){return {left:0,top:0,width:this.clientWidth||0,height:this.clientHeight||0}}
 scrollIntoView(){}
 focus(){focus=this}
}
let focus; const ids={};
for(const m of html.matchAll(/ id="([^"]+)"/g)) ids[m[1]]=new E();
for(const id of ['boundary-data','evidence-data']) ids[id].textContent=html.match(new RegExp('id="'+id+'">([^<]+)<'))[1];
const data=JSON.parse(ids['evidence-data'].textContent);
data.push({id:'record-test-fixture',title:'Independent test fixture',region:'Test region',kind:'First-contact accounts',traits:['Complexion','Nose'],status:'Test',startYear:1500,endYear:1500,lat:20,lon:-70,observation:'Test observation',sources:[],record:{observer:'Íñigo',encounterDate:'1500-01-01',recordType:'Fixture',sourceLocator:'Marker leaf 991',originalWording:'Marquée du test <svg onload=not-code>',gloss:'Meaning test',transmission:'Manuscript test'}});
data.push({id:'v3-object-test',title:'Tactile test sculpture',region:'Test region',kind:'Artifact',traits:['Nose','Lips'],startYear:-100,endYear:-100,lat:20,lon:-71,sources:[],visual:{title:'Museum test record',url:'https://example.org/object'}});
data.push({id:'v3-scheme-test',title:'Non-HTTPS test sculpture',region:'Test region',kind:'Artifact',traits:['Body paint'],lat:20,lon:-72,sources:[],visual:{title:'Unsafe record',url:'javascript:alert(1)'}});
ids['evidence-data'].textContent=JSON.stringify(data);
const total=data.length;
const actualContactCount=data.filter(e=>e.kind==='First-contact accounts'&&e.id!=='record-test-fixture').length;
const document={body:{classList:{remove(){},add(){}}},getElementById:k=>ids[k],createElement:t=>new E(t),createElementNS:(_,t)=>new E(t),createTextNode:s=>new E().textContent=s,querySelectorAll:q=>[...ids.cards.children,...ids.pins.children].filter(c=>q.split(',').some(a=>c.classList.contains(a.slice(1))))};
const context={document,Option:class extends E{constructor(t,v){super('option');this.textContent=t;this.value=v}},URL,setTimeout:f=>f()};
vm.runInNewContext(html.match(/<script>([\s\S]+)<\/script><\/body>/)[1],context);
assert.equal(ids.count.textContent,total+' of '+total+' evidence entries');
assert.ok(ids.base.children.length>10);
ids.region.value='Mesoamerica';ids.kind.value='Artifact';ids.period.value='early';ids.filters.events.input();
assert.equal(ids.count.textContent,data.filter(e=>e.region==='Mesoamerica'&&e.kind==='Artifact'&&e.startYear<1).length+' of '+total+' evidence entries');
const pin=ids.pins.children.find(x=>x.dataset.id==='san-lorenzo');pin.events.keydown({key:'Enter',preventDefault(){}});
assert.equal(focus.attributes['aria-pressed'],'true');assert.match(ids.cards.children.find(c=>c.dataset.id==='san-lorenzo').querySelector('h3').textContent,/San Lorenzo/);
ids.period.value='undated';ids.filters.events.input();assert.equal(ids.count.textContent,'0 of '+total+' evidence entries');
ids.region.value=ids.kind.value='';ids.filters.events.input();assert.match(ids.cards.children[0].querySelector('h3').textContent,/Oneida/);
ids.view.events.click();assert.equal(ids['rotation-label'].hidden,true);
ids.period.value='';ids.query.value='Kuitems';ids.filters.events.input();assert.match(ids.cards.children[0].querySelector('h3').textContent,/L.Anse aux Meadows/);
ids.query.value='';ids.kind.value='First-contact accounts';ids.period.value='';ids.filters.events.input();assert.equal(ids.count.textContent,(actualContactCount+1)+' of '+total+' evidence entries');
for(const kind of ['Archival context','Colonial-era comparator']){ids.kind.value=kind;ids.filters.events.input();assert.equal(ids.count.textContent,data.filter(e=>e.kind===kind).length+' of '+total+' evidence entries');}
ids.query.value='inigo';ids.kind.value='First-contact accounts';ids.period.value='modern';ids.filters.events.input();assert.equal(ids.count.textContent,'1 of '+total+' evidence entries');
const fields=ids.cards.children[0].querySelector('details').children.find(x=>x.tag==='section').querySelector('dl').children;
assert.deepEqual(fields.filter(k=>k.tag==='dt').map(k=>k.textContent), ['Observer / author','Encounter date','Record type','Source locator','Original wording','Plain-language gloss','How the text survives']);
assert.equal(fields[9].children[0].tag,'blockquote');
assert.match(fields[9].children[0].textContent, /<svg onload=not-code>/);
ids.query.value='marquee';ids.filters.events.input();assert.equal(ids.count.textContent,'1 of '+total+' evidence entries');
ids.period.value='undated';ids.filters.events.input();assert.equal(ids.count.textContent,'0 of '+total+' evidence entries');
ids.region.value='Test region';ids.kind.value=ids.period.value=ids.query.value='';ids.trait.value='Nose';ids.filters.events.input();
let rows=ids.cards.children;
assert.equal(rows.length,2);
const object=rows.find(c=>c.dataset.id==='v3-object-test');
assert.equal(object.querySelector('details').querySelector('a').href,'https://example.org/object');
assert.deepEqual(object.children.find(c=>c.classList.contains('traits')).children.map(c=>c.textContent),['Nose','Lips']);
ids['strict-complexion'].checked=true;ids.filters.events.input();
assert.deepEqual(ids.cards.children.map(x=>x.dataset.id),['record-test-fixture']);
ids.kind.value='Artifact';ids.filters.events.input();assert.equal(ids.count.textContent,'0 of '+total+' evidence entries');
ids.kind.value='';ids['strict-complexion'].checked=false;ids.trait.value='Body paint';ids.filters.events.input();
assert.equal(ids.cards.children[0].dataset.id,'v3-scheme-test');
assert.equal(ids.cards.children[0].querySelector('details').querySelector('a'),undefined);
console.log('PASS: independent trait facet, strict direct complexion intersection, official HTTPS links only, record structure, accented phrase and observer search intersected with type/period, inert quotation, offline boot, geometry, all entries, combined filters/empty state, keyboard pin focus, undated, view toggle, source search');


assert.equal(ids['time-date'].textContent,'1718');
for(const [idx,date,title] of [[3,'c. 1755','Chegeree'],[8,'1798-01-10','Naneta'],[11,'1803-11-30','Spain transfers'],[12,'1803-12-20','France transfers'],[15,'1835-07-01','Caddo treaty']]){
 ids['time-slider'].value=idx;ids['time-slider'].events.input();
 assert.equal(ids['time-date'].textContent,date);assert(ids['time-card'].querySelector('h2').textContent.includes(title));assert.match(ids['time-card'].querySelector('a').href,/^https:/);
}
assert.equal(data.filter(x=>x.kind==='Treaty and consent comparison').length,2);
console.log('PASS: timeline date/source transitions and comparison records outside pilot timeline');

for(const k of ['claim','control','indigenous'])ids['layer-'+k].checked=true;
ids['time-slider'].value=0;ids['time-slider'].events.input();const first=ids['scan-pane'].querySelector('img').src;
ids['time-slider'].value=3;ids['time-slider'].events.input();const later=ids['scan-pane'].querySelector('img').src;
assert.match(first,/^data:image\/jpeg;base64,\/9j/);assert.match(later,/^data:image\/jpeg;base64,\/9j/);
assert.notEqual(later,first);
ids['time-slider'].value=2;ids['time-slider'].events.input();assert(!ids['scan-pane'].querySelector('img'));assert.match(ids['scan-pane'].querySelector('p').textContent,/Archive link only/);
ids['time-slider'].value=3;ids['time-slider'].events.input();
ids['layer-indigenous'].checked=false;ids['layer-modern'].checked=true;ids['layer-modern'].events.change();
assert(ids['pilot-key'].children.some(e=>e.classList.contains('modern')));
assert(!ids['pilot-key'].children.some(e=>e.classList.contains('indigenous')));
assert(ids['pilot-key'].children.some(e=>e.classList.contains('claim')));
ids['time-slider'].value=12;ids['time-slider'].events.input();
assert(!ids['scan-pane'].querySelector('img'));
assert(ids['pilot-key'].children.some(e=>e.querySelector('a')?.textContent.includes('France hands over to the U.S.')));
console.log('PASS: scan swap, no-map state, independent layer toggles across dates, precise local handover');

ids['time-slider'].value=3;ids['time-slider'].events.input();
assert.ok(ids['scan-viewport']);assert.ok(ids['scan-stage']);assert.ok(ids['scan-zoom-in']);
assert.match(ids['scan-stage'].style.transform,/scale\(1\)/);
ids['scan-zoom-in'].events.click();
const zoomed=Number(ids['scan-stage'].style.transform.match(/scale\(([^)]+)\)/)[1]);
assert.ok(zoomed>1);
ids['scan-viewport'].events.keydown({key:'-',preventDefault(){}});
ids['scan-zoom-reset'].events.click();
assert.match(ids['scan-stage'].style.transform,/scale\(1\)/);
ids['scan-viewport'].events.keydown({key:'+',preventDefault(){}});
assert.ok(Number(ids['scan-stage'].style.transform.match(/scale\(([^)]+)\)/)[1])>1);
ids['scan-viewport'].events.keydown({key:'0',preventDefault(){}});
assert.match(ids['scan-stage'].style.transform,/scale\(1\)/);
console.log('PASS: historic map zoom, pan reset, and keyboard zoom controls');

ids['layer-indigenous'].checked=true;ids['layer-claim'].checked=true;ids['layer-control'].checked=true;
ids['time-slider'].value=15;ids['time-slider'].events.input();
const caddoPoint=[...ids['pilot-points'].children].find(c=>c.dataset.id==='caddo-1835');
assert.ok(caddoPoint);assert.equal(caddoPoint.attributes.role,'button');
caddoPoint.events.keydown({key:'Enter',preventDefault(){}});
const caddoCard=ids.cards.children.find(c=>c.dataset.id==='caddo-1835');
assert.ok(caddoCard);assert.ok(caddoCard.classes.has('active'));
console.log('PASS: reference map pins are keyboard-focusable and open the matching evidence card');
