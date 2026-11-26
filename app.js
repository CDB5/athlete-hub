'use strict';
const LEGACY_START = '2026-11-30';
let START=LEGACY_START;
const DAYS = ['Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag','Zondag'];
const PHASES = ['Accumulation','Accumulation','Strength','Strength','Deload','Power','Power','Elastic','Elastic · afbouwen','Taper'];
// Aanloopsprong, stangoefening, squat, pauzen en intentie worden in deze volgorde getoond.
const MONDAY = [
  ['Nulmeting','3 standing + 3 running','Power clean','3 × 2 · RPE 6','3 × 5 · RPE 7'],
  ['Aanloopsprong','3 × 2 · 90–95%','Power clean','3 × 2 · RPE 6','3 × 5 · RPE 7–7,5'],
  ['Aanloopsprong','3 × 2 · 95–100%','Clean pull','3 × 3 · RPE 7','3 × 3 · RPE 8'],
  ['Aanloopsprong','3 × 2 · 95–100%','Clean pull','3 × 3 · RPE 7','3 × 2 · RPE 8'],
  ['Aanloopsprong','2 × 2 · 85–90%','Power clean','2 × 2 · RPE 5–6','2 × 3 · RPE 6'],
  ['Aanloopsprong','4 × 2 · 95–100%','Power clean','4 × 2 · RPE 6–7','3 × 2 · RPE 7'],
  ['Aanloopsprong','4 × 2 · 95–100%','Power clean','4 × 2 · RPE 6–7','3 × 2 · RPE 7–8'],
  ['Aanloopsprong','4 × 2 · 95–100%','Power clean','3 × 2 · RPE 6','2 × 2 · RPE 7'],
  ['Aanloopsprong','3 × 2 · 95–100%','Power clean','2 × 2 · RPE 6','2 × 2 · RPE 7'],
  ['Aanloopsprong','2 × 1 · 90–95%','Power clean','2 × 2 · RPE 5','2 × 2 · RPE 6'],
];
const WEDNESDAY = [
  ['2 × 10 m · 85–90%','Aanloopsprong','2 × 2 · 85%'],
  ['3 × 10 m · 90%','Aanloopsprong','2 × 2 · 90–95%'],
  ['3 × 10 m · 90–95%','Standing triple jump','2 reeksen · 85–90%'],
  ['3 × 10 m · 90–95%','Standing triple jump','2 reeksen · 85–90%'],
  null,
  ['3 × 10 m · 95%','Afwisselende bounds','2 × 3'],
  ['3 × 10 m · 95%','Afwisselende bounds','2 × 3'],
  ['2 × 10 m · 90–95%','Lage drop jump','2 × 2 · 15–20 cm'],
  ['2 × 10 m · 90–95%','Lage drop jump','2 × 2 · 15–20 cm'],
  null,
];
const TUESDAY = [
  ['Bench press','3 × 6–8','2–3 min','RPE 7. Houd ongeveer drie goede herhalingen over.'],
  ['Lat pulldown','3 × 8–10','2 min','RPE 7. Beweeg gecontroleerd.'],
  ['Chest-supported row','2 × 8–12','2 min','RPE 7. Trek gecontroleerd.'],
  ['Cable external rotation','2 × 12–15 per arm','60–90 s','RPE 6. Houd je bovenarm stabiel.'],
  ['Pallof press','2 × 10 per kant','60–90 s','RPE 6–7. Weersta rotatie.'],
  ['Dead bug','2 × 6–8 per kant','60 s','Gecontroleerd, met stabiele onderrug.'],
];
const LEGACY_GOALS = {rest:{p:140,c:250,f:75},training:{p:140,c:310,f:75},match:{p:140,c:355,f:75}};
const DEFAULT_GOALS = {rest:{p:160,c:350,f:80},training:{p:160,c:410,f:80},match:{p:160,c:460,f:80}};
const KIND_NAMES = {rest:'Herstel',training:'Training',match:'Match'};
const EXERCISES = [
  {id:'squat',name:'Diepe back squat',group:'Kracht',unit:'reps',load:'Totaalgewicht inclusief stang',estimate:true,cue:'Gebruik een vaste, pijnvrije diepte. Zak gecontroleerd en duw snel omhoog.'},
  {id:'bench',name:'Bench press',group:'Kracht',unit:'reps',load:'Totaalgewicht inclusief stang',estimate:true,cue:'Houd je voeten stabiel en laat de stang beheerst zakken.'},
  {id:'rdl',name:'Romanian deadlift',group:'Kracht',unit:'reps',load:'Totaalgewicht inclusief stang',estimate:true,cue:'Duw je heupen achteruit en houd de stang dicht bij je benen.'},
  {id:'pulldown',name:'Lat pulldown',group:'Kracht',unit:'reps',load:'Gewicht op dezelfde machine',estimate:true,cue:'Trek je ellebogen omlaag. Beperk schommelen met je romp.'},
  {id:'row',name:'Chest-supported row',group:'Kracht',unit:'reps',load:'Kg per halter of aangegeven machinegewicht. Houd toestel en variant gelijk.',estimate:true,cue:'Houd je borst op de steun. Trek en laat gecontroleerd los.'},
  {id:'curl',name:'Leg curl',group:'Kracht',unit:'reps',load:'Gewicht op dezelfde machine',estimate:true,cue:'Houd je heupen stabiel en controleer de terugweg.'},
  {id:'nordic',name:'Nordic curl (geassisteerd)',group:'Kracht',unit:'reps',cue:'Zak langzaam met een rechte lijn van knie tot schouder. Gebruik dezelfde hulp bij het vergelijken.'},
  {id:'lunge',name:'Reverse lunge',group:'Kracht',unit:'reps',load:'Kg per halter. Noteer reps per been.',estimate:true,cue:'Stap beheerst achteruit en duw jezelf op met het voorste been.'},
  {id:'calf',name:'Standing calf raise',group:'Kracht',unit:'reps',load:'Extra weerstand in kg op dezelfde opstelling',estimate:true,cue:'Gebruik elke keer dezelfde bewegingsuitslag. Veer niet onderin.'},
  {id:'clean',name:'Power clean',group:'Explosief',unit:'reps',load:'Totaalgewicht inclusief stang',cue:'Reset voor elke rep. Vang de stang hoog en stabiel op.'},
  {id:'clean-pull',name:'Clean pull',group:'Explosief',unit:'reps',load:'Totaalgewicht inclusief stang',cue:'Versnel door heup- en kniestrekking. Laat de stang daarna gecontroleerd zakken.'},
  {id:'approach',name:'Aanloopsprong',group:'Explosief',unit:'reps',cue:'Gebruik een vaste aanloop, armzwaai en afzet. Meet je spronghoogte apart bij Testen.'},
  {id:'standing',name:'Standing vertical',group:'Explosief',unit:'cm',cue:'Gebruik armzwaai zonder instap. Trek je staande reikhoogte af van de hoogste aantikhoogte.'},
  {id:'running',name:'Running vertical',group:'Explosief',unit:'cm',cue:'Gebruik dezelfde aanloop en afzet bij elke poging. Meet volgens het testprotocol.'},
  {id:'triple',name:'Standing triple jump',group:'Explosief',unit:'m',cue:'Start op twee voeten, land rechts, links en dan op twee voeten. Meet tot je achterste hiel.'},
  {id:'bounds',name:'Afwisselende bounds',group:'Explosief',unit:'reps',cue:'Wissel af. Iedere afzet telt als één herhaling.'},
  {id:'drop',name:'Lage drop jump',group:'Explosief',unit:'reps',cue:'Stap rustig af, land stabiel en veer snel terug. Noteer de opstaphoogte bij je dagnotitie.'},
  {id:'acceleration',name:'Versnellingen',group:'Explosief',unit:'m',cue:'Versnel zoals voorgeschreven en voorzie uitloopruimte. Log de afstand per herhaling.'},
  {id:'hill',name:'Heuvelsprint',group:'Explosief',unit:'m',cue:'Kies een droge, lichte helling met vrije uitloop. Vergelijk dezelfde helling en afstand.'},
  {id:'rotation',name:'Cable external rotation',group:'Core & stabiliteit',unit:'reps',load:'Gewicht op dezelfde kabel, reps per arm',cue:'Houd je bovenarm stabiel. Beweeg langzaam zonder je romp te draaien.'},
  {id:'pallof',name:'Pallof press',group:'Core & stabiliteit',unit:'reps',load:'Gewicht op dezelfde kabel, reps per kant',cue:'Duw je handen recht vooruit en weersta rotatie.'},
  {id:'dead-bug',name:'Dead bug',group:'Core & stabiliteit',unit:'reps',cue:'Adem uit en houd je onderrug stabiel bij elke rep. Log reps per kant.'},
  {id:'copenhagen',name:'Copenhagen plank',group:'Core & stabiliteit',unit:'s',cue:'Houd je heup hoog en stabiel. Log seconden per kant met dezelfde steun.'},
  {id:'split-hold',name:'Split squat hold',group:'Core & stabiliteit',unit:'s',cue:'Houd de split squat stabiel. Log seconden per kant.'},
  {id:'calf-hold',name:'Calf raise hold',group:'Core & stabiliteit',unit:'s',cue:'Houd je hiel omhoog zonder te veren. Gebruik dezelfde opstelling.'},
  {id:'volleyball',name:'Volleybaltraining',group:'Conditie',unit:'min',cue:'Log de effectieve duur en noteer desgewenst de sprongbelasting.'},
  {id:'match',name:'Volleybalmatch',group:'Conditie',unit:'min',cue:'Log de effectieve duur en noteer bijvoorbeeld de gespeelde sets.'},
  {id:'recovery',name:'Wandelen of fietsen',group:'Conditie',unit:'min',cue:'Houd het tempo ontspannen genoeg om te kunnen praten.'},
];
const exerciseById=Object.fromEntries(EXERCISES.map(x=>[x.id,x]));
const exerciseByName=Object.fromEntries(EXERCISES.map(x=>[x.name,x]));
const units={reps:{name:'Herhalingen',suffix:' reps',min:1,step:1},s:{name:'Tijd (s)',suffix:' s',min:.01,step:.01},min:{name:'Duur (min)',suffix:' min',min:.01,step:.01},m:{name:'Afstand (m)',suffix:' m',min:.01,step:.01},cm:{name:'Hoogte (cm)',suffix:' cm',min:.1,step:.1}};
const isTimed = exercise => ['s','min'].includes(exercise.unit);
const bounded=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
const sessionIdValid = id => typeof id==='string' && /^(free|event:[^\s]{1,120}|program:\d{4}-\d{2}-\d{2}:\d{4}-\d{2}-\d{2})$/.test(id);
function cleanSet(item,registry=exerciseById){
  if(!item || !Object.hasOwn(registry,item.exercise))return null;
  const exercise=registry[item.exercise], unit=units[exercise.unit];
  if(!bounded(item.amount,unit.min,1000)||(unit.step===1&&!Number.isInteger(item.amount)))return null;
  return {id:String(item.id??uid()),exercise:exercise.id,amount:item.amount,session:sessionIdValid(item.session)?item.session:'free',
    title:String(item.title??'').slice(0,90),
    load:exercise.load&&bounded(item.load,0,1000)?item.load:null,rpe:bounded(item.rpe,1,10)?item.rpe:null,warmup:item.warmup===true};
}
function plannedFor(date){
  const i=delta(date,START), d=weekday(date);
  if(i<0||i>=70)return {title:'Vrij logboek',exercises:[]};
  const scheduled=session(Math.floor(i/7),d);
  const ids=scheduled.moves.flatMap(([name])=>name==='Nulmeting'?['standing','running','triple']:(exerciseByName[name]?[exerciseByName[name].id]:[]));
  if(i===65)ids.push('standing','running','triple');
  if(d===2||d===4)ids.push('volleyball');
  if(d===5)ids.push('match');
  if(d===3||d===6)ids.push('recovery');
  return {title:scheduled.title,exercises:ids};
}
// Voedingswaarden per 100 g of 100 ml. Richtwaarden voor portieschattingen, het etiket van het product gaat voor.
const PRESETS = [
  ['Skyr naturel',60,10,4,0.2],['Granola',450,9,64,17],['Kiwi',61,1.1,14.7,0.5],
  ['Banaan',89,1.1,22.8,0.3],['Volkorenbrood',245,10,42,3.5],['Kippenwit (beleg)',105,18,2,3],
  ['Kipfilet (rauw)',110,23,0,1.8],['Kipfilet (gebakken)',165,31,0,3.6],
  ['Pasta (droog)',355,13,72,1.6],['Pasta (gekookt)',155,5.5,30,0.9],
  ['Witte rijst (gekookt)',130,2.7,28,0.3],['Aardappel (gekookt)',84,1.9,19,0.1],
  ['Havermout (droog)',370,13,60,7],['Olijfolie',900,0,0,100],['Tomatensaus',45,1.5,7,1.2],
  ['Gemengde groenten',40,2,6,0.5],['Avocado',160,2,8.5,14.7],['Notenmix',615,18,14,55],
  ['Halfvolle melk',47,3.4,4.8,1.5],['Ei (zonder schaal)',143,12.6,0.7,9.5],
  ['Griekse yoghurt (naturel, 2%)',73,10,4,2],['Volkoren wrap',295,8.5,48,8],
  ['Zalm (bereid)',206,22,0,12],['Tonijn (op water, uitgelekt)',116,25,0,1],
  ['Kikkererwten (gekookt)',164,8.9,27,2.6],['Tofu naturel',118,12,2,7],
  ['Confituur',248,0.3,61,0.1],['Sportdrank',24,0,6,0],
];
const SPORTS={strength:'Gym / kracht',volleyball:'Volleybal',basketball:'Basketbal',running:'Lopen',conditioning:'Conditie',match:'Wedstrijd',recovery:'Herstel',other:'Andere sport'};
const CUSTOM_UNITS={weighted:'Herhalingen + kg',reps:'Herhalingen',min:'Duur (min)',s:'Tijd (s)',m:'Afstand (m)',cm:'Hoogte (cm)'};
const EXERCISE_GROUPS=['Kracht','Explosief','Core & stabiliteit','Conditie'];
function cleanEvent(item){
  if(!item||!Object.hasOwn(SPORTS,item.kind)||typeof item.title!=='string'||!item.title.trim())return null;
  return {id:String(item.id??uid()),kind:item.kind,title:item.title.trim().slice(0,90),
    time:/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(item.time)?item.time:'',
    minutes:bounded(item.minutes,1,720)&&Number.isInteger(item.minutes)?item.minutes:null,
    note:String(item.note??'').slice(0,400),done:item.done===true};
}
function cleanCheck(item){
  if(!item)return null;
  const score=n=>Number.isInteger(n)&&bounded(n,1,5)?n:null;
  const clean={sleep:bounded(item.sleep,0,24)?item.sleep:null,energy:score(item.energy),legs:score(item.legs),note:String(item.note??'').slice(0,400)};
  return clean.sleep!==null||clean.energy!==null||clean.legs!==null||clean.note?clean:null;
}
function cleanCustomExercise(item){
  if(!item||!/^custom-[a-z0-9-]+$/.test(item.id)||typeof item.name!=='string'||!item.name.trim()||
    !EXERCISE_GROUPS.includes(item.group)||!Object.hasOwn(CUSTOM_UNITS,item.type))return null;
  return {id:item.id,name:item.name.trim().slice(0,70),group:item.group,type:item.type,unit:item.type==='weighted'?'reps':item.type,
    load:item.type==='weighted'?'Noteer kg steeds volgens dezelfde opstelling':null,
    estimate:item.type==='weighted'&&item.group==='Kracht',cue:String(item.cue??'').trim().slice(0,280)};
}
function cleanTest(t){
  if(!t||!isDate(t.date))return null;
  const measure=(n,max)=>bounded(n,0,max)?n:null;
  return {date:t.date,standing:measure(t.standing,200),running:measure(t.running,200),triple:measure(t.triple,18),note:String(t.note??'').slice(0,350)};
}
function cleanProfile(profile){
  if(!profile||!isDate(profile.date))return null;
  return {id:String(profile.id??uid()),date:profile.date,name:String(profile.name??'').slice(0,80),
    sports:String(profile.sports??'').slice(0,240),goal:String(profile.goal??'').slice(0,240),note:String(profile.note??'').slice(0,1200),
    knownJump:bounded(profile.knownJump,0,200)?profile.knownJump:null};
}
function latestProfile(){
  return [...state.profiles].sort((a,b)=>b.date.localeCompare(a.date)||(b.order??0)-(a.order??0))[0];
}
function cleanBlock(block,start){
  const result={done:{},tests:{}};
  for(const [date,done] of Object.entries(block.done??{})){
    if(isDate(date)&&delta(date,start)>=0&&delta(date,start)<70&&done===true)result.done[date]=true;
  }
  for(const name of ['baseline','final']){
    const test=cleanTest(block.tests?.[name]);
    if(test)result.tests[name]=test;
  }
  return result;
}
function monday(date){return isDate(date)&&weekday(date)===0;}
function allExercises(){return [...EXERCISES,...Object.values(state.customExercises)];}
function syncExercises(keepSelection=false){
  const selected=field(setForm,'exercise').value;
  for(const id of Object.keys(exerciseById))if(id.startsWith('custom-'))delete exerciseById[id];
  Object.assign(exerciseById,state.customExercises);
  field(setForm,'exercise').innerHTML=allExercises().map(x=>'<option value="'+x.id+'">'+escapeHTML(x.name)+'</option>').join('');
  if(keepSelection && Object.hasOwn(exerciseById,selected))field(setForm,'exercise').value=selected;
}
function planOffset(date){
  if(!state.program?.enabled)return null;
  const offset=delta(date,state.program.start);
  return offset>=0&&offset<70?offset:null;
}
function allJumpTests(){
  return [...Object.values(state.blocks).flatMap(block=>Object.values(block.tests)),...Object.values(state.tests),...Object.values(state.freeTests)]
    .sort((a,b)=>b.date.localeCompare(a.date));
}
function jumpHistory(){
  const entries=Object.entries(state.blocks).flatMap(([start,block])=>Object.entries(block.tests).map(([key,test])=>({...test,key,start})));
  entries.push(...Object.entries(state.tests).map(([key,test])=>({...test,key,start:state.program?.start??LEGACY_START})));
  entries.push(...Object.values(state.freeTests).map(test=>({...test,key:'free',start:''})));
  return entries.sort((a,b)=>b.date.localeCompare(a.date));
}
function testStage(date,start=START){
  const offset=delta(date,start);
  return offset===0?'baseline':offset===65?'final':null;
}
function matchingDayType(date){
  const items=state.events[date]??[], offset=planOffset(date);
  if(items.some(x=>x.kind==='match')||(offset!==null&&weekday(date)===5))return 'match';
  if(items.some(x=>x.kind!=='recovery')||(offset!==null&&workoutDay(date)))return 'training';
  return 'rest';
}
const $ = (id) => document.getElementById(id);
const all = (selector) => Array.from(document.querySelectorAll(selector));
const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = (value, digits=1) => new Intl.NumberFormat('nl-BE',{maximumFractionDigits:digits}).format(value);
const dateFormat = new Intl.DateTimeFormat('nl-BE',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
const localDay = new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Europe/Brussels'});
const utc = (day) => new Date(day + 'T00:00:00Z');
function todayKey(now = new Date()){
  const parts = Object.fromEntries(localDay.formatToParts(now).map(({type,value}) => [type,value]));
  return [parts.year,parts.month,parts.day].join('-');
}
function plusDay(day, amount){
  const date=utc(day);
  date.setUTCDate(date.getUTCDate()+amount);
  return date.toISOString().slice(0,10);
}
function isDate(day){
  return typeof day==='string' && /^\d{4}-\d{2}-\d{2}$/.test(day) &&
    Number.isFinite(utc(day).getTime()) && utc(day).toISOString().slice(0,10)===day;
}
const weekday = (day) => (utc(day).getUTCDay()+6)%7;
const weekMonday = (day) => plusDay(day,-weekday(day));
const delta = (a,b) => Math.round((utc(a)-utc(b))/86400000);
const fmtDate = (day) => dateFormat.format(utc(day));
const workoutDay = (day) => ![3,6].includes(weekday(day));
const typeFor = matchingDayType;
const setStatus = (id, text) => { $(id).textContent=text; };
const uid = () => globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36)+Math.random().toString(36).slice(2);
const emptyState = () => ({version:1,done:{},meals:{},tests:{},logs:{},recipes:[],products:{},body:[],profiles:[],program:null,blocks:{},events:{},checkins:{},customExercises:{},freeTests:{},timeModes:{},goalsDefined:{},goals:JSON.parse(JSON.stringify(DEFAULT_GOALS))});
let state=emptyState();
function validateState(data){
  if(!data || data.version!==1 || !Array.isArray(data.body) || !data.done || !data.meals || !data.goals || !data.tests) throw Error('Ongeldig back-upbestand.');
  const safe=emptyState(), valid=(n,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=max;
  const hasProgram=monday(data.program?.start);
  const oldBackup=!Object.hasOwn(data,'program')&&(Object.keys(data.done).length>0||Object.keys(data.tests).length>0);
  if(hasProgram||oldBackup)safe.program={start:hasProgram?data.program.start:LEGACY_START,enabled:oldBackup||data.program.enabled===true};
  Object.assign(safe,cleanBlock(data,safe.program?.start??LEGACY_START));
  for(const [date,block] of Object.entries(data.blocks??{})){
    if(monday(date)&&date!==safe.program?.start&&block)safe.blocks[date]=cleanBlock(block,date);
  }
  for(const [date,items] of Object.entries(data.events??{})){
    if(!isDate(date)||!Array.isArray(items))continue;
    const clean=items.map(cleanEvent).filter(Boolean);
    if(clean.length)safe.events[date]=clean;
  }
  for(const [date,item] of Object.entries(data.checkins??{})){
    const clean=cleanCheck(item);
    if(isDate(date)&&clean)safe.checkins[date]=clean;
  }
  for(const item of Object.values(data.customExercises??{})){
    const clean=cleanCustomExercise(item);
    if(clean)safe.customExercises[clean.id]=clean;
  }
  for(const [date,item] of Object.entries(data.freeTests??{})){
    const clean=cleanTest(item);
    if(date===clean?.date)safe.freeTests[date]=clean;
  }
  for(const [k,items] of Object.entries(data.meals)){
    if(!isDate(k)||!Array.isArray(items))continue;
    safe.meals[k]=items.map(cleanFoodItem).filter(Boolean);
  }
  for(const k of Object.keys(DEFAULT_GOALS)){
    const g=data.goals[k];
    if(g&&valid(g.p,450)&&valid(g.c,1000)&&valid(g.f,350)) {
      safe.goals[k]={p:g.p,c:g.c,f:g.f};
      const fields=['p','c','f'];
      if(data.goalsDefined?.[k]===true||(!data.goalsDefined&&fields.some(key=>g[key]!==LEGACY_GOALS[k][key])))safe.goalsDefined[k]=true;
    }
  }
  const body=data.body.filter(x=>x&&isDate(x.date)&&valid(x.weight,350)&&x.weight>=20&&valid(x.height,250)&&x.height>=90)
    .map(x=>({id:String(x.id??uid()),date:x.date,time:/^\d\d:\d\d$/.test(x.time)?x.time:'',weight:x.weight,height:x.height,
      fat:valid(x.fat,100)?x.fat:null,muscle:valid(x.muscle,100)?x.muscle:null,bone:valid(x.bone,100)?x.bone:null,water:valid(x.water,100)?x.water:null,note:String(x.note??'').slice(0,400)}));
  safe.body=body;
  if(Array.isArray(data.profiles))safe.profiles=data.profiles.map(cleanProfile).filter(Boolean);
  const registry=Object.fromEntries([...EXERCISES,...Object.values(safe.customExercises)].map(item=>[item.id,item]));
  for(const [id,mode] of Object.entries(data.timeModes??{})){
    if(Object.hasOwn(registry,id)&&isTimed(registry[id])&&['fastest','longest'].includes(mode))safe.timeModes[id]=mode;
  }
  for(const [date,entry] of Object.entries(data.logs??{})){
    if(!isDate(date)||!entry||!Array.isArray(entry.sets))continue;
    const sets=entry.sets.map(item=>cleanSet(item,registry)).filter(Boolean), note=String(entry.note??'').slice(0,1000);
    const sessionNotes={};
    for(const [id,item] of Object.entries(entry.sessionNotes??{})){
      if(id!=='free'&&sessionIdValid(id)&&typeof item?.note==='string'&&item.note.trim()){
        sessionNotes[id]={note:item.note.slice(0,1000),title:String(item.title??'').slice(0,90)};
      }
    }
    if(sets.length||note||Object.keys(sessionNotes).length)safe.logs[date]={sets,note,sessionNotes};
  }
  if(Array.isArray(data.recipes))safe.recipes=data.recipes.map(cleanRecipe).filter(Boolean);
  for(const product of Object.values(data.products??{})){
    const clean=cleanProduct(product);
    if(clean)safe.products[clean.id]=clean;
  }
  return safe;
}
let current=todayKey();
let selected=Math.min(69,Math.max(0,delta(current,START)));
let week=Math.floor(selected/7), day=selected%7, foodDay=current, foodWeek=weekMonday(current);
let editing=null, sourceLabel='', photoURL=null;
function auxExercises(w){
  if(w===9)return [];
  const isDeload=w===4, elastic=w>=7, power=w===5||w===6;
  const ham = w<2?['Leg curl','2 × 10','2 min','RPE 7.']:w<4?['Nordic curl (geassisteerd)','1 × 3','2 min','Zak ±3 sec. Gebruik voldoende hulp.']:
    isDeload?['Leg curl','1 × 8','2 min','Licht.']:['Nordic curl (geassisteerd)',power?'2 × 3':'1 × 3','2 min','Zak ±3 sec. Houd het op één set als eerdere Nordics meerdere dagen zware hamstrings gaven.'];
  return [
    ['Romanian deadlift',isDeload?'1 × 6':elastic?'1 × 5':power?'2 × 5':'2 × 6','2 min',isDeload?'RPE 6.':elastic?'RPE 6–7.':'RPE 7. Laat de stang gecontroleerd zakken.'],
    ham,
    ...(!isDeload&&!elastic?[['Reverse lunge','1 × 6 per been','2 min','RPE 7. Gecontroleerd zakken.']]:[]),
    ['Standing calf raise',isDeload?'1 × 8':elastic?'1 × 8–10':'2 × 8–12','90 s',isDeload?'Licht.':'RPE 7.'],
    ['Copenhagen plank',isDeload?'1 × 15 s per kant':elastic?'1 × 20 s per kant':power?'2 × 20 s per kant':'2 × 15–25 s per kant','60–90 s','Houd je heup stabiel.'],
  ];
}
function session(w,d){
  if(d===0){
    const [jump,jumpDose,lift,liftDose,squat]=MONDAY[w];
    return {title:'Sprongkracht & benen',time:w===9?'Korte sessie':'80–95 min',intro:'Na je opwarming. Werk per oefening alle sets af.',
      moves:[
        ...(w===0?[]:[[jump,jumpDose,'2 min','Gebruik je vaste aanloop en beste afzet. Rust 30–60 s tussen sprongen.']]),
        [lift,liftDose,'2–3 min',w===0?'Kies een gewicht waarbij beide reps snel blijven en de opvang stabiel is.':'Volledige reset tussen reps. Houd de stangsnelheid hoog.'],
        ['Diepe back squat',squat,'3–4 min',w===0?'Bouw met je opwarmsets op tot een werkgewicht rond RPE 7.':'Vaste, pijnvrije diepte. Zak gecontroleerd, kom snel omhoog.'],
        ...auxExercises(w)]};
  }
  if(d===1){
    const light=w===4||w===9;
    return {title:'Bovenlichaam & core',time:light?'Lichte sessie':'50–65 min',intro:'Houd woensdag je slagarm fris.',
      moves:TUESDAY.map(([name,dose,pause,note])=>[name,light?dose.replace(/^\d/,'1'):dose,pause,light?'Rustig, rond RPE 6.':note])};
  }
  if(d===2){
    const block=WEDNESDAY[w];
    const moves=block?[
      ['Versnellingen',block[0],'90–120 s','Na de opwarming, met voldoende uitloopruimte.'],
      [block[1],block[2],'2 min',w>=7?'Stap af en veer vlot terug. Houd de hoogte deze cyclus gelijk.':w>=2&&w<=3?'Start op twee voeten, land rechts, links en daarna op twee voeten.':w===5||w===6?'Wissel af. Iedere afzet telt als één herhaling.':'Vaste aanloop en gecontroleerde landing.']
    ]:[];
    return {title:w===9?'Eindtest & volleybal':'Volleybaltraining',time:'19.30–22.00',
      intro:w===9?'Doe de eindtest vóór de training. Het testblok vervangt de gerichte opwarming.':w===4?'Gebruik je normale teamopwarming.':'Vervang vergelijkbare drills uit de teamopwarming, in overleg met je trainer.',
      moves};
  }
  if(d===4)return {title:'Volleybaltraining',time:'20.00–22.00',intro:'Teamtraining. De belasting van deze avond telt mee richting je match.',moves:[]};
  if(d===5)return {title:'Volleybalmatch',time:'Zaterdagavond',intro:'Gebruik je gewone wedstrijdopwarming. Rond 18.30 uur volgens je eerdere weekindeling. Controleer de actuele starttijd bij je team.',moves:[]};
  return {title:d===3?'Herstel':'Rust',time:'Naar behoefte',intro:'Eventueel 20–30 min wandelen of fietsen op praattempo. Rust is ook prima.',moves:[]};
}
function showTab(tab,updateURL=true){
  if(tab==='tests')tab='about';
  if(!$(tab)?.classList.contains('view'))return;
  if(updateURL&&location.hash!=='#'+tab)history.pushState(null,'','#'+tab);
  for(const view of all('section.view'))view.hidden=view.id!==tab;
  const mobileMore=matchMedia('(max-width: 820px)').matches&&!['today','agenda','logbook','food'].includes(tab);
  const navTab=mobileMore||['settings','privacy','terms'].includes(tab)?'more':tab;
  for(const button of all('[data-tab]'))button.setAttribute('aria-pressed',String(button.dataset.tab===navTab));
  if(readyToRender)renderActiveView(tab);
  window.scrollTo(0,0);
}
function focusInput(input){
  input.focus({preventScroll:true});
  input.scrollIntoView({block:'center'});
}
function moveMarkup([name,dose,pause,note]){
  return '<div class="exercise"><div><b>'+escapeHTML(name)+'</b><small>'+escapeHTML(note)+'</small></div><div class="dose">'+escapeHTML(dose)+'<small>'+escapeHTML(pause)+' rust</small></div></div>';
}
function doneButton(date){
  const done=!!state.done[date];
  return '<button class="btn '+(done?'':'primary')+'" type="button" data-done="'+date+'" aria-pressed="'+done+'">'+(done?'✓ Voltooid · ongedaan maken':'Markeer als voltooid')+'</button>';
}
function renderSession(date,expanded,context='plan'){
  const i=delta(date,START), w=Math.floor(i/7), d=weekday(date), s=session(w,d);
  const status=state.done[date]?'<span class="pill ok">✓ Voltooid</span>':'<span class="pill">'+escapeHTML(s.time)+'</span>';
  const open=expanded?'':'<button class="btn" type="button" data-jump="'+date+'">Bekijk oefeningen</button>';
  return '<p class="eyebrow">'+DAYS[d]+' · '+fmtDate(date)+'</p><div class="row between"><h3>'+escapeHTML(s.title)+'</h3>'+status+'</div><p class="muted">'+escapeHTML(s.intro)+'</p>'+
    testMarkup(date)+(expanded?s.moves.map(moveMarkup).join(''):'')+'<div class="actions spaced">'+(workoutDay(date)?doneButton(date):'')+open+
    '<button type="button" class="btn" data-log-date="'+date+'" data-log-session="'+programLogId(date)+'" data-log-focus>Log een set</button><button type="button" class="btn small" data-copy-session="'+date+'">Kopieer sessie</button></div><p class="status" id="'+context+'-copy-'+date+'" role="status"></p>';
}
function renderTraining(){
  if($('training').hidden)return;
  const first=plusDay(START,week*7);
  $('week-heading').innerHTML='Week '+(week+1)+' · <span class="phase">'+PHASES[week]+'</span>';
  $('week-progress').textContent=Object.keys(state.done).filter(k=>delta(k,first)>=0&&delta(k,first)<7&&workoutDay(k)).length+' / 5 sessies';
  $('week-pick').innerHTML=PHASES.map((phase,i)=>'<button type="button" class="choice" data-w="'+i+'" aria-pressed="'+(i===week)+'" aria-label="Week '+(i+1)+' '+phase+'">'+(i+1)+'</button>').join('');
  $('day-pick').innerHTML=DAYS.map((name,i)=>{
    const date=plusDay(first,i);
    return '<button type="button" class="choice" data-d="'+i+'" aria-pressed="'+(i===day)+'" aria-label="'+name+' '+fmtDate(date)+(state.done[date]?', voltooid':'')+'">'+name.slice(0,2)+(state.done[date]?'<span class="check" aria-hidden="true">✓</span>':'')+'<small>'+utc(date).getUTCDate()+'/'+(utc(date).getUTCMonth()+1)+'</small></button>';
  }).join('');
  $('training-session').innerHTML=renderSession(plusDay(first,day),true);
}
const totalsKeys=['kcal','p','c','f'];
const totalLabels={kcal:'Energie',p:'Eiwit',c:'Koolhydraten',f:'Vet'};
const energy=(g)=>4*g.p+4*g.c+9*g.f;
const goalFor=(date)=>{const g=state.goals[typeFor(date)];return {...g,kcal:energy(g)};};
function calculate(entry){
  const factor=entry.basis==='portion'?1:entry.amount/100;
  return Object.fromEntries(totalsKeys.map(k=>[k,entry[k]*factor]));
}
function totalsFor(date){
  const sums={kcal:0,p:0,c:0,f:0};
  for(const item of state.meals[date]??[]){
    const values=calculate(item);
    for(const k of totalsKeys)sums[k]+=values[k];
  }
  return sums;
}
const clockTime = new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Brussels',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
const programTimes = {2:'19:30',4:'20:00',5:'18:30'};
function nextSession(){
  const now=clockTime.format(new Date());
  const canStart=(date,time)=>date>current||(date===current&&(!time||time>=now));
  const choices=Object.keys(state.events).filter(date=>date>=current).flatMap(date=>
    state.events[date].filter(item=>!item.done&&canStart(date,item.time)).map(item=>({date,time:item.time,title:item.title,session:eventLogId(item)})));
  if(state.program?.enabled){
    for(let offset=Math.max(0,delta(current,START));offset<70;offset++){
      const date=plusDay(START,offset), day=weekday(date), time=programTimes[day]??'';
      if(!workoutDay(date)||state.done[date]||!canStart(date,time))continue;
      choices.push({date,time,title:session(Math.floor(offset/7),day).title,session:programLogId(date),program:true});
      break;
    }
  }
  return choices.sort((a,b)=>a.date.localeCompare(b.date)||(a.time||'24:00').localeCompare(b.time||'24:00'))[0];
}
function renderToday(){
  if($('today').hidden)return;
  const offset=planOffset(current), items=sortedEvents(current), g=goalFor(current), totals=totalsFor(current), kind=typeFor(current);
  const upcoming=nextSession();
  const dateLabel=date=>DAYS[weekday(date)]+' '+fmtDate(date);
  const stage=offset!==null?'Vertical Jump · week '+(Math.floor(offset/7)+1):'';
  $('today-date').innerHTML='<time class="muted" datetime="'+current+'">'+dateLabel(current)+'</time>'+(stage?'<span class="pill ok">'+stage+'</span>':'');
  $('today-next').innerHTML='<p class="eyebrow">VOLGENDE SESSIE</p>'+
    (upcoming?'<div class="row between"><div><h2>'+escapeHTML(upcoming.title)+'</h2><p class="small muted">'+dateLabel(upcoming.date)+(upcoming.time?' · '+upcoming.time:'')+'</p></div>'+
      (upcoming.program?'<button type="button" class="btn small" data-jump="'+upcoming.date+'">Bekijk sessie</button>':'<button type="button" class="btn small" data-open-agenda="'+upcoming.date+'">Open agenda</button>')+'</div>':
      '<div class="row between"><h2>Geen volgende sessie</h2><button type="button" class="btn small" data-new-agenda="'+current+'">Plan een sessie</button></div>');
  const logId=upcoming?.date===current?upcoming.session:'free';
  $('today-actions').innerHTML='<button type="button" class="btn primary" data-log-date="'+current+'" data-log-session="'+escapeHTML(logId)+'" data-log-focus>Log een set</button>'+
    '<button type="button" class="btn" data-food-date="'+current+'" data-food-focus>Maaltijd toevoegen</button>'+
    '<button type="button" class="btn" data-recovery-date="'+current+'" data-recovery-focus>Check-in</button>';
  const todayProgram=offset===null?'':'<div class="entry"><div><strong>'+escapeHTML(session(Math.floor(offset/7),weekday(current)).title)+'</strong><small>Vertical Jump'+(state.done[current]?' · ✓ voltooid':'')+'</small></div><button class="btn small" type="button" data-jump="'+current+'">Bekijk sessie</button></div>';
  $('today-session').innerHTML='<h3>Sportagenda vandaag</h3>'+(items.length||todayProgram?'<div class="list">'+todayProgram+(offset===null?'':testMarkup(current))+items.map(item=>agendaRow(current,item,false)).join('')+'</div>':'<p class="muted small">Er staat vandaag geen sessie in je agenda.</p>');
  const goalLabel=state.goalsDefined[kind]?'Jouw doel':'Startdoel · afstemmen op je herstel';
  $('today-food').innerHTML='<p class="eyebrow">VOEDING VANDAAG · '+KIND_NAMES[kind]+'</p>'+
    '<div class="row between"><div><div class="stat">'+num(totals.kcal,0)+' <small> / '+num(g.kcal,0)+' kcal</small></div><div class="small muted">'+num(totals.p)+' / '+num(g.p)+' g eiwit · '+goalLabel+'</div></div>'+
    '<button class="btn small" type="button" data-adjust-goal="'+kind+'">Doel aanpassen</button></div>';
  const monday=weekMonday(current), logged=DAYS.filter((_,index)=>state.logs[plusDay(monday,index)]).length;
  const lastJump=allJumpTests().find(test=>test.running!=null)?.running;
  $('today-progress').innerHTML='<p class="eyebrow">TRAININGSVOORTGANG</p><div class="stat">'+logged+' <small>'+(logged===1?'logdag':'logdagen')+' deze week</small></div>'+
    '<p class="muted small">'+(lastJump==null?'Bewaar een sprongtest om je voortgang te volgen.':'Laatste aanloopsprong: '+num(lastJump)+' cm')+'</p>'+
    '<button class="btn small" data-open="about" type="button">Over mij en voortgang</button>';
  const check=state.checkins[current];
  $('today-recovery').innerHTML='<p class="eyebrow">HERSTEL VANDAAG</p><p class="muted small">'+(check?(checkinLabel(check)||'Check-in bewaard.'):'Volg je slaap en hoe fris je je voelt.')+'</p>'+
    '<button class="btn small" data-recovery-date="'+current+'" type="button">'+(check?'Bekijk check-in':'Doe je check-in')+'</button>';
}
let readyToRender=false;
const openedViews=new Set();
function renderActiveView(tab,fromSync=false){
  const first=!openedViews.has(tab);
  openedViews.add(tab);
  switch(tab){
    case 'today': renderToday(); break;
    case 'agenda': if(first)openEventForm(current); renderAgenda(); break;
    case 'training': if(first||!fromSync)setProgramDate(); renderTraining(); break;
    case 'logbook': if(first)resetSetForm(); renderLog(first); break;
    case 'food':
      if(first){resetFoodForm();resetRecipe();}
      renderFood();renderTargets(!fromSync);break;
    case 'about':
      if(first){resetBodyForm();loadProfileForm();}
      renderAbout();renderBody();renderTests();break;
    case 'library': renderLibrary();break;
    case 'recovery': if(first)loadCheckin(current); renderRecovery();break;
  }
}
function refresh(){
  if(!readyToRender)return;
  renderActiveView(document.querySelector('section.view:not([hidden])').id,true);
}
const foodForm=$('food-form'), bodyForm=$('body-form'), goalsForm=$('goals-form'), testForm=$('test-form');
const profileForm=$('profile-form');
const field=(form,name)=>form.elements.namedItem(name);
const value=(form,name)=>field(form,name).value;
const number=(form,name)=>value(form,name)===''?null:Number(value(form,name));
const labelFor=(k,v)=>num(v,k==='kcal'?0:1)+(k==='kcal'?' kcal':' g');
function loadProfileForm(){
  const profile=latestProfile();
  field(profileForm,'date').value=current;
  for(const key of ['name','sports','goal','note'])field(profileForm,key).value=profile?.[key]??'';
}
function renderAbout(){
  if($('about').hidden)return;
  const profile=latestProfile();
  const history=[];
  $('profile-reading').innerHTML=profile?'<p><strong>'+escapeHTML(profile.name||'Mijn sportprofiel')+'</strong></p>'+
    (profile.sports?'<p>'+escapeHTML(profile.sports)+'</p>':'')+(profile.goal?'<p><strong>Doel</strong> · '+escapeHTML(profile.goal)+'</p>':'')+
    (profile.note?'<p class="small multiline">'+escapeHTML(profile.note)+'</p>':'')+
    (profile.knownJump===null?'':'<p class="small muted">Eerder bekende aanloopsprong · '+num(profile.knownJump)+' cm · meetdatum onbekend.</p>'):
    '<p class="muted">Vul je sportprofiel aan of voeg je eerdere startgegevens toe.</p>';
  for(const item of state.profiles)history.push({date:item.date,kind:'Profiel',description:[item.name,item.sports,item.goal,item.note,
    item.knownJump===null?'':'Eerder bekende aanloopsprong '+num(item.knownJump)+' cm · meetdatum onbekend'].filter(Boolean).join(' · ')});
  for(const item of state.body)history.push({date:item.date,kind:'Lichaamsmeting',description:num(item.weight)+' kg · '+num(item.height)+' cm'+
    (item.fat===null?'':' · vet '+num(item.fat)+'%')+(item.note?' · '+item.note:'')});
  for(const item of jumpHistory())history.push({date:item.date,kind:{baseline:'Nulmeting',final:'Eindtest',free:'Sprongmeting'}[item.key],
    description:[item.standing===null?'':'Standing '+num(item.standing)+' cm',item.running===null?'':'Running '+num(item.running)+' cm',
    item.triple===null?'':'Triple jump '+num(item.triple,2)+' m',item.note].filter(Boolean).join(' · ')});
  $('personal-history').innerHTML=history.sort((a,b)=>b.date.localeCompare(a.date)).map(item=>
    '<div class="entry"><div><strong>'+escapeHTML(item.kind)+' · '+fmtDate(item.date)+'</strong><small class="multiline">'+escapeHTML(item.description)+'</small></div></div>').join('')||
    '<p class="muted small">Je geschiedenis verschijnt zodra je een profiel, lichaamsmeting of sprongresultaat bewaart.</p>';
}
profileForm.addEventListener('submit',event=>{
  event.preventDefault();
  const profile=cleanProfile({id:uid(),date:value(profileForm,'date'),...Object.fromEntries(['name','sports','goal','note'].map(key=>[key,value(profileForm,key).trim()])),
    knownJump:latestProfile()?.knownJump??null});
  if(!profile||!['name','sports','goal','note'].some(key=>profile[key])){setStatus('profile-status','Vul minstens één profielveld in.');return;}
  state.profiles.push(profile);
  saveStatus('profile-status','Profiel toegevoegd aan je geschiedenis.',storedListItem('profile',profile));
  renderAbout();
});
$('profile-import').addEventListener('change',async event=>{
  const file=event.target.files[0];
  if(!file)return;
  try{
    const incoming=JSON.parse(await file.text());
    if(incoming.type!=='athlete-hub-profile'||incoming.version!==1)throw Error('Ongeldig profielbestand.');
    const profiles=(incoming.profiles??[]).map(cleanProfile).filter(Boolean);
    const backup=emptyState();
    backup.body=incoming.body??[];
    const body=validateState(backup).body;
    if(!profiles.length&&!body.length)throw Error('Geen metingen gevonden.');
    const changes=[];
    for(const [collection,list,newItems] of [['profile',state.profiles,profiles],['body',state.body,body]]){
      for(const item of newItems){
        if(list.some(existing=>existing.id===item.id))continue;
        if(collection==='body'&&list.some(existing=>existing.date===item.date&&existing.time===item.time))continue;
        list.push(item);
        changes.push(storedListItem(collection,item));
      }
    }
    if(changes.length)await saveStatus('profile-import-status','Startgegevens aan je geschiedenis toegevoegd.',...changes);
    else setStatus('profile-import-status','Deze startgegevens staan al in je geschiedenis.');
    renderAbout();renderBody();loadProfileForm();
  }catch{setStatus('profile-import-status','Kies een geldig bestand met Athlete Hub-startgegevens.');}
  finally{event.target.value='';}
});
$('apply-athlete-goals').addEventListener('click',()=>{
  const changes=[];
  for(const [kind,goal] of Object.entries(DEFAULT_GOALS)){
    state.goals[kind]={...goal};
    state.goalsDefined[kind]=true;
    changes.push(storeItem('goal',kind,goal));
  }
  saveStatus('nutrition-status','Startdoelen toegepast. Stem verder af op je gewichtstrend en herstel.',...changes);
  renderTargets();renderFood();renderToday();
});
function entryMacros(t){return labelFor('kcal',t.kcal)+' · E '+num(t.p)+' · K '+num(t.c)+' · V '+num(t.f)+' g';}
function renderFood(){
  if($('food').hidden)return;
  $('food-date').value=foodDay;
  const t=totalsFor(foodDay), g=goalFor(foodDay);
  $('food-totals').innerHTML='<span class="pill">'+KIND_NAMES[typeFor(foodDay)]+'</span>'+
    totalsKeys.map(k=>'<div class="meter"><div class="row between"><strong>'+totalLabels[k]+'</strong><span>'+num(t[k],k==='kcal'?0:1)+' / '+labelFor(k,g[k])+'</span></div><progress aria-label="'+totalLabels[k]+'" max="'+(g[k]||1)+'" value="'+Math.min(t[k],g[k])+'"></progress></div>').join('');
  const entries=state.meals[foodDay]??[];
  $('food-entries').innerHTML=entries.map(entry=>'<div class="entry"><div><strong>'+escapeHTML(entry.name)+'</strong><small>'+num(entry.amount)+' g/ml · '+entryMacros(calculate(entry))+'</small>'+
    (entry.source?'<small>'+escapeHTML(entry.source)+'</small>':'')+'</div><div class="actions"><button class="btn small" type="button" data-entry-edit="'+escapeHTML(entry.id)+'" aria-label="Wijzig '+escapeHTML(entry.name)+'">Wijzig</button><button class="btn small danger" type="button" data-entry-delete="'+escapeHTML(entry.id)+'" aria-label="Verwijder '+escapeHTML(entry.name)+'">×</button></div></div>').join('') ||
    '<p class="muted small subline">Je hebt voor deze dag nog niets gelogd.</p>';
  renderFoodWeek();
  renderRecipes();
  renderProducts();
}
function renderFoodWeek(){
  if($('food').hidden)return;
  const days=DAYS.map((name,i)=>({name,key:plusDay(foodWeek,i)}));
  const total={kcal:0,p:0,c:0,f:0};
  let logged=0;
  const rows=days.map(({name,key})=>{
    const dayTotal=totalsFor(key), g=goalFor(key), hasEntries=(state.meals[key]??[]).length>0;
    if(hasEntries){logged++; for(const k of totalsKeys)total[k]+=dayTotal[k];}
    return '<tr><th scope="row"><button class="btn small" type="button" data-food-date="'+key+'">'+name.slice(0,2)+' '+utc(key).getUTCDate()+'/'+(utc(key).getUTCMonth()+1)+'</button></th>'+
      totalsKeys.map(k=>'<td>'+(hasEntries?num(dayTotal[k],k==='kcal'?0:1):'—')+' / '+num(g[k])+'</td>').join('')+'</tr>';
  }).join('');
  $('nutrition-week').innerHTML='<p class="muted small">'+fmtDate(foodWeek)+' – '+fmtDate(plusDay(foodWeek,6))+' · '+logged+'/7 dagen gelogd</p><table><thead><tr><th>Dag</th><th>kcal</th><th>Eiwit (g)</th><th>Koolh. (g)</th><th>Vet (g)</th></tr></thead><tbody>'+rows+
    '<tr><th scope="row">Week totaal</th>'+totalsKeys.map(k=>'<td>'+num(total[k],k==='kcal'?0:1)+'</td>').join('')+'</tr><tr><th scope="row">Gem. gelogde dagen</th>'+
    totalsKeys.map(k=>'<td>'+(logged?num(total[k]/logged,k==='kcal'?0:1):'—')+'</td>').join('')+'</tr></tbody></table>';
}
function renderTargets(updateForm=true){
  if($('food').hidden)return;
  $('goal-table').innerHTML='<table><thead><tr><th>Dagtype</th><th>kcal</th><th>Eiwit</th><th>Koolh.</th><th>Vet</th></tr></thead><tbody>'+
    Object.entries(state.goals).map(([kind,g])=>'<tr><th scope="row">'+KIND_NAMES[kind]+'</th><td>'+num(energy(g))+'</td><td>'+num(g.p)+' g</td><td>'+num(g.c)+' g</td><td>'+num(g.f)+' g</td></tr>').join('')+'</tbody></table>';
  const g=state.goals[$('goal-kind').value];
  if(updateForm)for(const k of ['p','c','f'])field(goalsForm,k).value=g[k];
  const latest=[...state.body].sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time))[0];
  $('nutrition-weight-context').textContent=latest?'Bij je laatste meting van '+num(latest.weight)+' kg is 160 g eiwit '+num(160/latest.weight,2)+' g/kg. Gebruik je ochtendgewichtstrend voor verdere bijsturing.':
    'Je laatste lichaamsmeting onder Over mij geeft extra context bij de doelen.';
}
function renderBody(){
  if($('about').hidden)return;
  const measurements=[...state.body].sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));
  const latest=measurements[0], shown=(v,suffix)=>v==null?'—':num(v)+suffix;
  if(!latest){
    $('body-reading').innerHTML='<p class="muted">Voeg je eerste meting toe. Een bestaande back-up zet je terug via Instellingen.</p>';
    $('body-history').replaceChildren();
    return;
  }
  const actions=item=>'<div class="actions"><button class="btn small" type="button" data-body-edit="'+escapeHTML(item.id)+'" aria-label="Wijzig meting van '+fmtDate(item.date)+'">Wijzig</button>'+
    '<button class="btn small danger" type="button" data-body-delete="'+escapeHTML(item.id)+'" aria-label="Wis meting van '+fmtDate(item.date)+'">Wis</button></div>';
  $('body-reading').innerHTML='<div class="row between"><div class="stat">'+num(latest.weight)+' <small>kg</small></div><span class="pill">'+fmtDate(latest.date)+(latest.time?' · '+escapeHTML(latest.time):'')+'</span></div>'+
    '<p class="muted">'+num(latest.height)+' cm · vet '+shown(latest.fat,'%')+' · spier '+shown(latest.muscle,'%')+' · bot '+shown(latest.bone,'%')+' · water '+shown(latest.water,'%')+'</p>'+
    '<p class="muted small">'+escapeHTML(latest.note)+'</p>'+actions(latest);
  $('body-history').innerHTML='<table><thead><tr><th>Meting</th><th>Acties</th><th>Gewicht</th><th>Lengte</th><th>Vet</th><th>Spier</th><th>Bot</th><th>Water</th><th>Context</th></tr></thead><tbody>'+
    measurements.map(x=>'<tr><th scope="row">'+fmtDate(x.date)+(x.time?' '+escapeHTML(x.time):'')+'</th><td>'+actions(x)+'</td><td>'+shown(x.weight,' kg')+'</td><td>'+shown(x.height,' cm')+'</td><td>'+shown(x.fat,'%')+'</td><td>'+shown(x.muscle,'%')+'</td><td>'+shown(x.bone,'%')+'</td><td>'+shown(x.water,'%')+'</td><td>'+escapeHTML(x.note)+'</td></tr>').join('')+'</tbody></table>';
}
let testContext={key:'free',start:'',date:null};
function loadTestForm(){
  const {key,start,date}=testContext;
  const saved=key==='free'?state.freeTests[date]:(start===state.program?.start?state.tests:state.blocks[start]?.tests??{})[key];
  $('test-key').value=key;
  field(testForm,'date').value=saved?.date??date??current;
  for(const name of ['standing','running','triple','note'])field(testForm,name).value=saved?.[name]??'';
  $('test-result-title').textContent={baseline:'Nulmeting',final:'Eindtest',free:'Sprongmeting'}[key];
  $('test-result-context').textContent=key==='free'?'Vrije meting':fmtDate(start)+' · Vertical Jump · '+fmtDate(date);
}
function openTest(date,start,key){
  testContext={date,start,key:key??testStage(date,start)??'free'};
  loadTestForm();
  setStatus('test-status','');
  if(!$('test-result').open)$('test-result').showModal();
}
function testMarkup(date,start=START){
  const stage=testStage(date,start);
  if(!stage)return '';
  const test=(start===state.program?.start?state.tests:state.blocks[start]?.tests??{})[stage];
  const title=stage==='baseline'?'Nulmeting sprongkracht':'Eindtest sprongkracht';
  return '<div class="test-panel"><div class="row between"><strong>'+title+'</strong><button class="btn small" type="button" data-test-info aria-label="Uitleg over de sprongtest">Info</button></div>'+
    '<p class="small muted">Na de opwarming en vóór de overige training. Standing en running vertical, eventueel triple jump.</p>'+
    '<div class="row between"><span class="small">'+(test?'Resultaat bewaard'+(test.running===null?'':' · running '+num(test.running)+' cm'):'3 pogingen per sprongtest')+'</span>'+
    '<button class="btn small primary" type="button" data-test-date="'+date+'" data-test-start="'+start+'">'+(test?'Resultaat bekijken':'Resultaat invoeren')+'</button></div></div>';
}
function renderTests(){
  if($('about').hidden)return;
  const a=state.tests.baseline,b=state.tests.final;
  const rows=[['standing','Standing','cm'],['running','Running','cm'],['triple','Triple jump','m']].map(([key,name,unit])=>{
    const change=a?.[key]!=null&&b?.[key]!=null?b[key]-a[key]:null;
    return '<tr><th scope="row">'+name+' ('+unit+')</th><td>'+(a?.[key]==null?'—':num(a[key],2))+'</td><td>'+(b?.[key]==null?'—':num(b[key],2))+'</td><td>'+(change==null?'—':(change>0?'+':'')+num(change,2))+'</td></tr>';
  }).join('');
  $('test-summary').innerHTML=state.program?'<p class="small muted">Programma gestart op '+fmtDate(state.program.start)+'</p><table><thead><tr><th>Test</th><th>Nulmeting</th><th>Eindtest</th><th>Verschil</th></tr></thead><tbody>'+rows+'</tbody></table>':'';
  const history=jumpHistory();
  $('test-history').innerHTML=history.length?'<table><thead><tr><th>Datum</th><th>Standing (cm)</th><th>Running (cm)</th><th>Triple (m)</th><th>Notitie</th><th>Acties</th></tr></thead><tbody>'+
    history.map(test=>'<tr><th scope="row">'+fmtDate(test.date)+'</th>'+['standing','running','triple'].map(key=>'<td>'+(test[key]==null?'—':num(test[key],2))+'</td>').join('')+'<td>'+escapeHTML(test.note)+'</td><td><button class="btn small" type="button" data-test-date="'+test.date+'" data-test-start="'+test.start+'" data-test-kind="'+test.key+'">Bekijk</button></td></tr>').join('')+
    '</tbody></table>':'<p class="muted small">Je hebt nog geen gedateerde sprongtests. Geplande tests verschijnen op de eerste en laatste testdag van je programma.</p>';
}
function foodMode(mode){
  for(const key of ['barcode','ticket','photo'])$('mode-'+key).hidden=mode!==key;
  for(const button of all('[data-mode]')){
    const active=button.dataset.mode===mode;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
  }
  setStatus('food-status','');
}
function setFoodFields(entry){
  for(const k of ['name','amount','basis',...totalsKeys])field(foodForm,k).value=entry[k]??(k==='basis'?'100':'');
  sourceLabel=entry.source??'';
  setFoodProductContext(entry);
  $('personal-product').value=entry.savedProductId??'';
  foodPreview();
}
function foodPreview(){
  const v=Object.fromEntries(totalsKeys.map(k=>[k,number(foodForm,k)]));
  if(totalsKeys.some(k=>v[k]===null)||!number(foodForm,'amount')){setStatus('food-calc','');return;}
  const portion=calculate({...v,amount:number(foodForm,'amount'),basis:value(foodForm,'basis')==='portion'?'portion':100});
  setStatus('food-calc','Deze portie · '+entryMacros(portion));
}
function resetFoodForm(){
  editing=null;
  sourceLabel='';
  foodProductContext={};
  foodForm.reset();
  $('edit-cancel').hidden=true;
  $('food-submit').textContent='Toevoegen aan dag';
  foodPreview();
}
function selectFoodDate(key){
  if(!isDate(key))return;
  if(foodDay!==key&&editing)resetFoodForm();
  foodDay=key;
  foodWeek=weekMonday(key);
  renderFood();
}
function loadPreset(){
  if($('presets').value==='')return;
  const [name,kcal,p,c,f]=PRESETS[Number($('presets').value)];
  const isPhoto=!$('mode-photo').hidden&&!!photoURL;
  setFoodFields({name,amount:number(foodForm,'amount'),basis:100,kcal,p,c,f,source:isPhoto?'Portieschatting bij foto':'Productlijst · schatting'});
  field(foodForm,'amount').focus();
}
foodForm.addEventListener('submit',event=>{
  event.preventDefault();
  const name=value(foodForm,'name').trim();
  if(!name){setStatus('food-status','Geef het product een naam.');return;}
  const item={id:editing??uid(),name,amount:number(foodForm,'amount'),basis:value(foodForm,'basis')==='portion'?'portion':100,
    ...Object.fromEntries(totalsKeys.map(k=>[k,number(foodForm,k)])),source:sourceLabel||((!$('mode-photo').hidden&&photoURL)?'Portieschatting bij foto':'Handmatig')};
  const items=state.meals[foodDay]??=[];
  const previous=editing?items.find(x=>x.id===editing):null;
  if(editing&&!previous){setStatus('food-status','Deze invoer werd elders gewist. Annuleer de wijziging of voeg een nieuwe portie toe.');return;}
  state.meals[foodDay]=editing?items.map(x=>x.id===editing?item:x):[...items,item];
  saveStatus('food-status',editing?'Invoer bijgewerkt.':'Toegevoegd op '+fmtDate(foodDay)+'.',storedListItem('meal',item,foodDay,previous?.order));
  resetFoodForm(); renderFood(); renderToday();
});
foodForm.addEventListener('input',event=>{
  if(event.target.name==='name'&&sourceLabel.startsWith('Open Food Facts'))sourceLabel='Handmatig aangepast';
  foodPreview();
});
$('presets').insertAdjacentHTML('beforeend',PRESETS.map(([name],i)=>'<option value="'+i+'">'+escapeHTML(name)+'</option>').join(''));
$('presets').addEventListener('change',loadPreset);
$('edit-cancel').addEventListener('click',resetFoodForm);
$('food-date').addEventListener('change',event=>selectFoodDate(event.target.value));
$('prev-food-week').addEventListener('click',()=>{foodWeek=plusDay(foodWeek,-7);renderFoodWeek();});
$('next-food-week').addEventListener('click',()=>{foodWeek=plusDay(foodWeek,7);renderFoodWeek();});
goalsForm.addEventListener('submit',event=>{
  event.preventDefault();
  const g=Object.fromEntries(['p','c','f'].map(k=>[k,number(goalsForm,k)]));
  if(energy(g)<=0){setStatus('goal-status','Vul een doel groter dan nul in.');return;}
  const kind=$('goal-kind').value;
  state.goals[kind]=g;
  state.goalsDefined[kind]=true;
  saveStatus('goal-status','Macrodoelen bijgewerkt.',storeItem('goal',kind,g));renderTargets();renderFood();renderToday();
});
$('goal-kind').addEventListener('change',renderTargets);
let editingBody=null;
function resetBodyForm(){
  editingBody=null;
  bodyForm.reset();
  field(bodyForm,'date').value=current;
  field(bodyForm,'height').value=state.body.at(-1)?.height??'';
  $('body-submit').textContent='Meting toevoegen';
  $('body-cancel').hidden=true;
}
$('body-cancel').addEventListener('click',()=>{resetBodyForm();setStatus('body-status','');});
bodyForm.addEventListener('submit',event=>{
  event.preventDefault();
  const date=value(bodyForm,'date');
  if(!isDate(date))return;
  const index=editingBody===null?-1:state.body.findIndex(item=>item.id===editingBody);
  if(editingBody!==null&&index<0){setStatus('body-status','Deze meting werd elders gewist.');return;}
  const body={id:editingBody??uid(),date,time:value(bodyForm,'time'),note:value(bodyForm,'note').trim(),
    ...Object.fromEntries(['weight','height','fat','muscle','bone','water'].map(k=>[k,number(bodyForm,k)]))};
  const item=storedListItem('body',body,'',state.body[index]?.order);
  if(index<0)state.body.push(body);
  else state.body[index]=body;
  resetBodyForm();
  saveStatus('body-status',index<0?'Meting bewaard.':'Meting gewijzigd.',item);
  renderBody();renderAbout();
});
testForm.addEventListener('submit',event=>{
  event.preventDefault();
  const date=value(testForm,'date');
  if(!isDate(date))return;
  const t={date,note:value(testForm,'note').trim(),standing:number(testForm,'standing'),running:number(testForm,'running'),triple:number(testForm,'triple')};
  if([t.standing,t.running,t.triple].every(n=>n===null)){setStatus('test-status','Voer minstens één meetresultaat in.');return;}
  const {key,start}=testContext;
  const changes=[];
  if(key==='free'){
    state.freeTests[date]=t;
    changes.push(storeItem('freeTest',date,t));
  }
  else {
    if(!state.program&&start===START){
      state.program={start,enabled:false};
      changes.push(storeItem('meta','program',state.program));
    }
    const block=start===state.program?.start?state:(state.blocks[start]??={done:{},tests:{}});
    block.tests[key]=t;
    changes.push(storeItem('test',key,t,start));
  }
  saveStatus('test-status','Resultaat bewaard.',...changes);
  renderTests();renderAbout();renderToday();renderLibrary();renderTraining();renderAgenda();renderLog();
});
document.addEventListener('click',event=>{
  const button=event.target.closest('button');
  if(!button)return;
  const data=button.dataset;
  if(data.tab)showTab(data.tab);
  if(data.testInfo!==undefined)$('test-info').showModal();
  if(data.testDate)openTest(data.testDate,data.testStart??START,data.testKind);
  if(data.newTest!==undefined)openTest(current,'','free');
  if(data.open){
    showTab(data.open);
    if(data.scrollTo){const target=$(data.scrollTo);target.scrollIntoView({block:'center'});$('backup-out').focus({preventScroll:true});}
  }
  if(data.w!==undefined){
    week=Number(data.w);renderTraining();$('week-pick').querySelector('[data-w="'+week+'"]')?.focus();
  }
  if(data.d!==undefined){
    day=Number(data.d);renderTraining();$('day-pick').querySelector('[data-d="'+day+'"]')?.focus();
  }
  if(data.jump){
    const i=delta(data.jump,START);week=Math.floor(i/7);day=i%7;showTab('training');
  }
  if(data.done){
    const date=data.done, parent=button.closest('article')?.id;
    const changes=[];
    if(!state.program){
      state.program={start:START,enabled:false};
      changes.push(storeItem('meta','program',state.program));
    }
    if(state.done[date]) delete state.done[date]; else state.done[date]=true;
    changes.push(state.done[date]?storeItem('done',date,true,state.program.start):removeItem('done',date,state.program.start));
    saveStatus(null,'',...changes);
    renderTraining();renderToday();renderAgenda();$(parent)?.querySelector('[data-done="'+date+'"]')?.focus();
  }
  if(data.copySession){
    const context=button.closest('#today')?'today':'plan';
    copyText(sessionText(data.copySession),context+'-copy-'+data.copySession,'Sessie gekopieerd.');
  }
  if(data.mode)foodMode(data.mode);
  if(data.foodDate){
    selectFoodDate(data.foodDate);
    if($('food').hidden)showTab('food');
    if(data.foodFocus!==undefined){
      foodMode('manual');
      focusInput(field(foodForm,'name'));
    }
  }
  if(data.adjustGoal){
    showTab('food');
    $('goal-kind').value=data.adjustGoal;
    $('goal-details').open=true;
    renderTargets();
    focusInput(field(goalsForm,'p'));
  }
  if(data.entryEdit){
    const entry=(state.meals[foodDay]??[]).find(x=>x.id===data.entryEdit);
    if(entry){
      editing=entry.id;
      foodMode('manual');$('presets').value='';setFoodFields(entry);
      $('edit-cancel').hidden=false;$('food-submit').textContent='Wijziging bewaren';
      field(foodForm,'name').focus();
    }
  }
  if(data.entryDelete&&window.confirm('Deze invoer verwijderen?')){
    state.meals[foodDay]=(state.meals[foodDay]??[]).filter(x=>x.id!==data.entryDelete);
    if(editing===data.entryDelete)resetFoodForm();
    saveStatus('food-status','Invoer verwijderd.',removeItem('meal',data.entryDelete,foodDay));renderFood();renderToday();
  }
  if(data.bodyEdit){
    const item=state.body.find(entry=>entry.id===data.bodyEdit);
    if(!item)return;
    editingBody=item.id;
    for(const key of ['date','time','height','weight','fat','muscle','bone','water','note'])field(bodyForm,key).value=item[key]??'';
    $('body-submit').textContent='Wijziging bewaren';
    $('body-cancel').hidden=false;
    setStatus('body-status','');
    focusInput(field(bodyForm,'weight'));
  }
  if(data.bodyDelete&&window.confirm('Deze lichaamsmeting wissen?')){
    state.body=state.body.filter(entry=>entry.id!==data.bodyDelete);
    if(editingBody===data.bodyDelete)resetBodyForm();
    saveStatus('body-status','Meting gewist.',removeItem('body',data.bodyDelete));
    renderBody();renderAbout();
  }
});
const MAX_PHOTO=18*1024*1024;
async function findBarcode(){
  const input=$('barcode-value'), button=$('barcode-find'), code=input.value.trim();
  if(!/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(code)){setStatus('barcode-status','Vul een barcode van 8, 12, 13 of 14 cijfers in.');return;}
  setLoading(button,true);setStatus('barcode-status','Product opzoeken…');
  const controller=new AbortController(), timeout=setTimeout(()=>controller.abort(),9000);
  try{
    const response=await fetch('https://world.openfoodfacts.org/api/v2/product/'+code+'?fields=product_name,product_name_nl,brands,nutriments',{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});
    if(response.status===404)throw Error('Geen product gevonden. Gebruik het etiket om de waarden zelf in te vullen.');
    if(!response.ok)throw Error('Opzoeken lukt nu niet. Gebruik het etiket om de waarden zelf in te vullen.');
    const data=await response.json();
    if(!data.product||data.status!==1)throw Error('Geen product gevonden. Gebruik het etiket om de waarden zelf in te vullen.');
    const product=data.product,n=product.nutriments??{};
    const normalize=(x)=>x==null||x===''||!Number.isFinite(Number(x))||Number(x)<0?null:Math.round(Number(x)*10)/10;
    const kcal=normalize(n['energy-kcal_100g'])??(n['energy-kj_100g']==null?null:normalize(Number(n['energy-kj_100g'])/4.184));
    const macros={kcal,p:normalize(n.proteins_100g),c:normalize(n.carbohydrates_100g),f:normalize(n.fat_100g)};
    $('presets').value='';
    setFoodFields({name:String(product.product_name_nl||product.product_name||'Product '+code).slice(0,100),brand:String(product.brands??'').slice(0,80),barcode:code,amount:number(foodForm,'amount'),basis:100,...macros,source:'Open Food Facts · '+code});
    setStatus('barcode-status',totalsKeys.some(key=>macros[key]===null)?'Product gevonden. Vul de ontbrekende vakken aan via het etiket.':'Product gevonden. Controleer de waarden en vul je portie in.');
    field(foodForm,'amount').focus();
  }catch(error){setStatus('barcode-status',error.name==='AbortError'?'De databank reageert te traag. Probeer opnieuw of vul handmatig in.':error.message==='Failed to fetch'?'De databank is niet bereikbaar. Vul het product handmatig in.':error.message);}
  finally{clearTimeout(timeout);setLoading(button,false);}
}
$('barcode-find').addEventListener('click',findBarcode);
$('barcode-value').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();findBarcode();}});
$('barcode-file').addEventListener('change',async event=>{
  const file=event.target.files[0];
  if(!file)return;
  if(file.size>MAX_PHOTO){setStatus('barcode-status','Kies een kleinere foto of typ de barcode.');return;}
  if(!globalThis.BarcodeDetector){setStatus('barcode-status','Deze browser kan een barcodefoto niet uitlezen. Typ de cijfers bij de barcode.');return;}
  let bitmap;
  try{
    bitmap=await createImageBitmap(file);
    const detector=new BarcodeDetector({formats:['ean_13','ean_8','upc_a','upc_e']});
    const codes=await detector.detect(bitmap);
    if(!codes.length)throw Error();
    $('barcode-value').value=codes[0].rawValue;
    setStatus('barcode-status','Barcode gelezen. Controleer de cijfers en kies Product opzoeken.');
  }catch{setStatus('barcode-status','Geen leesbare barcode op de foto. Probeer dichterbij of typ de cijfers.');}
  finally{bitmap?.close();}
});
function ticketLines(){
  const lines=$('ticket-text').value.split(/\r?\n/).map(line=>line.trim()).filter(line=>line.length>=3&&/[a-zÀ-ÿ]/i.test(line)&&
    !/^(subtotaal|totaal|total|btw|bancontact|visa|betaling|wisselgeld|kassier|ticket\s*nr|datum|koper|klant|bedankt|welkom)\b/i.test(line)).slice(0,26);
  $('ticket-result').replaceChildren();
  for(const line of lines){
    const entry=document.createElement('div');entry.className='entry';
    const desc=document.createElement('div');desc.textContent=line;
    const button=document.createElement('button');button.type='button';button.className='btn small';button.textContent='Gebruik';
    button.addEventListener('click',()=>{
      const grams=line.match(/(\d+(?:[.,]\d+)?)\s*(kg|ml|g|l)\b/i);
      const amount=grams?Number(grams[1].replace(',','.'))*(['kg','l'].includes(grams[2].toLowerCase())?1000:1):null;
      const name=line.replace(/\s+(?:€\s*)?\d+[.,]\d{2}\s*(?:€|EUR)?(?:\s+[ABC])?\s*$/i,'').slice(0,100);
      $('presets').value='';setFoodFields({name,amount:amount&&amount<=10000?Math.round(amount*10)/10:null,basis:100,source:'Bonregel · gecontroleerd door jou'});
      setStatus('ticket-status','Controleer product en werkelijk gegeten hoeveelheid. Vul de voedingswaarden aan.');
      field(foodForm,'name').focus();
    });
    entry.append(desc,button);$('ticket-result').append(entry);
  }
  setStatus('ticket-status',lines.length?lines.length+' mogelijke productregels. Kies er één om over te nemen.':'Geen bruikbare regels gevonden. Plak opnieuw of gebruik handmatige invoer.');
}
$('ticket-lines').addEventListener('click',ticketLines);
let ocrLoader;
function loadOCR(){
  if(globalThis.Tesseract)return Promise.resolve(globalThis.Tesseract);
  if(ocrLoader)return ocrLoader;
  ocrLoader=new Promise((resolve,reject)=>{
    const script=document.createElement('script'), failed=()=>{
      clearTimeout(timeout);script.remove();ocrLoader=null;reject(Error('OCR kon niet geladen worden.'));
    };
    const timeout=setTimeout(failed,15000);
    script.src='https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js';
    script.integrity='sha384-r1ru3tcf6FhnCFR4B7pIFG+BhFF9LlFtz/P1y4pblWn3AGs9y3lBx5SKLNf4+rED';
    script.crossOrigin='anonymous';script.referrerPolicy='no-referrer';
    script.onload=()=>{clearTimeout(timeout);resolve(globalThis.Tesseract);};
    script.onerror=failed;
    document.head.append(script);
  });
  return ocrLoader;
}
$('ticket-read').addEventListener('click',async ()=>{
  const file=$('ticket-file').files[0], button=$('ticket-read');
  if(!file){setStatus('ticket-status','Kies eerst een foto van een ticket.');return;}
  if(file.size>MAX_PHOTO){setStatus('ticket-status','Kies een foto kleiner dan 18 MB.');return;}
  setLoading(button,true);setStatus('ticket-status','OCR voorbereiden. De eerste keer kan dit even duren…');
  let worker, timeout, expired=false;
  try{
    const engine=await loadOCR();
    const recognize=async ()=>{
      worker=await engine.createWorker(['nld','eng'],1,{logger:m=>{
        if(!expired&&m.status==='recognizing text')setStatus('ticket-status','Ticket lezen… '+Math.round(m.progress*100)+'%');
      }});
      if(expired){await worker.terminate();return '';}
      return (await worker.recognize(file)).data.text;
    };
    const result=await Promise.race([recognize(),new Promise((_,reject)=>{timeout=setTimeout(()=>{expired=true;reject(Error('OCR duurt te lang.'));},40000);})]);
    $('ticket-text').value=result.slice(0,6500);ticketLines();
  }catch{setStatus('ticket-status','OCR is hier niet beschikbaar. Kopieer tekst met je telefoon en plak die in het tekstvak.');}
  finally{clearTimeout(timeout);if(worker)try{await worker.terminate();}catch{} setLoading(button,false);}
});
$('backup-out').addEventListener('click',async ()=>{
  let snapshot=state;
  if(database&&!storageFailed){
    try{snapshot=stateFromRecords(await database.read());}catch(error){showStorageError(error);}
  }
  const url=URL.createObjectURL(new Blob([JSON.stringify(snapshot,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download='athlete-hub-backup-'+current+'.json';
  document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  setStatus('backup-status','Back-up klaargezet. Het bestand bevat je persoonlijke logboek.');
});
$('backup-in').addEventListener('change',async event=>{
  const input=event.target,file=input.files[0];
  if(!file)return;
  try{
    const next=validateState(JSON.parse(await file.text()));
    if(!window.confirm('Vervang je huidige logboek door deze back-up?'))return;
    await replaceStoredState(next);
    loadStateViews();
    setStatus('backup-status','Back-up teruggezet.');
  }catch(error){setStatus('backup-status','Terugzetten mislukt. Kies een geldige Athlete Hub- of Sprongplan-back-up.');}
  finally{input.value='';}
});
function refreshDate(){
  const next=todayKey();
  if(next===current){renderToday();return;}
  const wasToday=foodDay===current;
  current=next;
  if(wasToday)selectFoodDate(next);
  renderToday();
}
setInterval(refreshDate,30000);
document.addEventListener('visibilitychange',()=>{
  if(!document.hidden){refreshDate();requestSync();}
});
function cleanFoodItem(x){
  if(!x||typeof x.id!=='string'||typeof x.name!=='string'||!x.name.trim()||x.name.length>100||
    !bounded(x.amount,.1,10000)||![100,'portion'].includes(x.basis)||!bounded(x.kcal,0,30000)||
    ![x.p,x.c,x.f].every(n=>bounded(n,0,10000)))return null;
  const {id,name,amount,basis,kcal,p,c,f,source}=x;
  return {id,name,amount,basis,kcal,p,c,f,source:String(source??'').slice(0,120)};
}
function cleanRecipe(recipe){
  if(!recipe||typeof recipe.id!=='string'||typeof recipe.name!=='string'||!recipe.name.trim()||
    recipe.name.length>100||!bounded(recipe.servings,.25,100)||!Array.isArray(recipe.items))return null;
  const items=recipe.items.map(cleanFoodItem).filter(Boolean);
  return items.length?{id:recipe.id,name:recipe.name.trim(),servings:recipe.servings,items}:null;
}
const recipeForm=$('recipe-form');
let editedRecipe=null, recipeDay=null;
function recipeTotals(recipe,portions=1){
  const totals={kcal:0,p:0,c:0,f:0};
  for(const item of recipe.items){
    const values=calculate(item);
    for(const key of totalsKeys)totals[key]+=values[key]*(portions/recipe.servings);
  }
  return totals;
}
function renderRecipes(){
  if($('food').hidden)return;
  const picked=recipeDay===foodDay?new Set(all('#recipe-builder input:checked').map(x=>x.value)):new Set();
  recipeDay=foodDay;
  const entries=state.meals[foodDay]??[];
  $('recipe-builder').innerHTML=entries.map(x=>
    '<label><input type="checkbox" name="ingredient" value="'+escapeHTML(x.id)+'"'+(picked.has(x.id)?' checked':'')+'> <span>'+escapeHTML(x.name)+' <small>· '+num(x.amount)+' g/ml</small></span></label>'
  ).join('')||'<p class="muted small">Log eerst een ingrediënt bij Inname toevoegen op '+fmtDate(foodDay)+'.</p>';
  const portionByRecipe=new Map(all('#saved-recipes form').map(form=>[form.dataset.recipe,field(form,'portion').value]));
  $('saved-recipes').innerHTML=state.recipes.map(recipe=>{
    const id=escapeHTML(recipe.id), amount=escapeHTML(portionByRecipe.get(recipe.id)||'1');
    return '<div class="entry"><div class="recipe-summary"><strong>'+escapeHTML(recipe.name)+'</strong>'+
      '<small>'+recipe.items.map(x=>escapeHTML(x.name)).join(' · ')+'</small><small>Per portie · '+entryMacros(recipeTotals(recipe))+'</small>'+
      '<form class="row spaced" data-recipe="'+id+'"><label class="recipe-portion">Porties<input name="portion" type="number" min="0.25" max="100" step="0.25" value="'+amount+'" inputmode="decimal" required></label><button class="btn small" type="submit">Log op '+fmtDate(foodDay)+'</button></form>'+
      '<div class="actions spaced"><button class="btn small" type="button" data-edit-recipe="'+id+'">Wijzig</button><button class="btn small" type="button" data-copy-recipe="'+id+'">Kopieer ingrediënten</button><button class="btn small danger" type="button" data-delete-recipe="'+id+'">Wis recept</button></div></div></div>';
  }).join('')||'<p class="muted small">Je hebt nog geen bewaarde recepten.</p>';
  $('recipe-save').disabled=!entries.length&&editedRecipe===null;
}
function resetRecipe(){
  editedRecipe=null;
  recipeForm.reset();
  $('recipe-save').textContent='Recept opslaan';
  $('recipe-cancel').hidden=true;
  renderRecipes();
}
$('recipe-cancel').addEventListener('click',()=>{
  resetRecipe();
  setStatus('recipe-status','');
});
recipeForm.addEventListener('submit',event=>{
  event.preventDefault();
  const meta=state.recipes.find(x=>x.id===editedRecipe), checked=new Set(new FormData(recipeForm).getAll('ingredient'));
  const selected=(state.meals[foodDay]??[]).filter(x=>checked.has(x.id));
  const recipe=cleanRecipe({id:meta?.id??uid(),name:value(recipeForm,'name').trim(),servings:number(recipeForm,'servings'),
    items:selected.length?selected:meta?.items});
  if(!recipe){
    setStatus('recipe-status','Geef je recept een naam en vink minstens één ingrediënt aan.');
    return;
  }
  state.recipes=meta?state.recipes.map(x=>x.id===editedRecipe?recipe:x):[...state.recipes,recipe];
  resetRecipe();
  saveStatus('recipe-status',meta?'Recept bijgewerkt.':'Recept bewaard.',storedListItem('recipe',recipe,'',meta?.order));
});
$('saved-recipes').addEventListener('submit',event=>{
  event.preventDefault();
  const form=event.target, recipe=state.recipes.find(x=>x.id===form.dataset.recipe);
  if(!recipe)return;
  const factor=number(form,'portion')/recipe.servings;
  const round=(n)=>Math.round(n*10)/10;
  const items=recipe.items.map(item=>{
    const scaled={...item,id:uid(),amount:Math.max(.1,round(item.amount*factor)),source:'Recept · '+recipe.name};
    if(item.basis==='portion')for(const key of totalsKeys)scaled[key]=round(item[key]*factor);
    return cleanFoodItem(scaled);
  });
  if(items.some(x=>!x)){
    setStatus('recipe-status','Deze portiegrootte geeft een te grote hoeveelheid. Kies minder porties.');
    return;
  }
  state.meals[foodDay]=[...(state.meals[foodDay]??[]),...items];
  saveStatus('recipe-status','Toegevoegd aan je dagoverzicht op '+fmtDate(foodDay)+'.',...items.map(item=>storedListItem('meal',item,foodDay)));
  renderFood();
  renderToday();
  Array.from($('saved-recipes').querySelectorAll('form')).find(x=>x.dataset.recipe===recipe.id)?.querySelector('button').focus();
});
document.addEventListener('click',event=>{
  const data=event.target.closest('button')?.dataset;
  if(!data)return;
  if(data.editRecipe){
    const recipe=state.recipes.find(x=>x.id===data.editRecipe);
    if(!recipe)return;
    resetRecipe();
    editedRecipe=recipe.id;
    field(recipeForm,'name').value=recipe.name;
    field(recipeForm,'servings').value=recipe.servings;
    $('recipe-save').disabled=false;
    $('recipe-save').textContent='Wijziging bewaren';
    $('recipe-cancel').hidden=false;
    setStatus('recipe-status','Zonder aangevinkte ingrediënten blijft de bestaande lijst behouden.');
    field(recipeForm,'name').focus();
  }
  if(data.deleteRecipe&&window.confirm('Dit recept verwijderen? Gelogde maaltijden blijven bewaard.')){
    state.recipes=state.recipes.filter(x=>x.id!==data.deleteRecipe);
    if(editedRecipe===data.deleteRecipe)resetRecipe();
    else renderRecipes();
    saveStatus('recipe-status','Recept verwijderd.',removeItem('recipe',data.deleteRecipe));
  }
  if(data.copyRecipe){
    const recipe=state.recipes.find(x=>x.id===data.copyRecipe);
    if(recipe){
      const text=[recipe.name+' · '+num(recipe.servings)+' porties',...recipe.items.map(x=>x.name+' · '+num(x.amount)+' g/ml')].join('\n');
      copyText(text,'recipe-status','Ingrediënten gekopieerd.');
    }
  }
});
let logDate=current, logSession='free', editSet=null, libraryChoice='squat', displayedLogNote='';
const setForm=$('set-form'), noteForm=$('log-notes');

function describeSet(set){
  const unit=units[exerciseById[set.exercise].unit];
  return num(set.amount,2)+unit.suffix+(set.load==null?'':' · '+num(set.load,2)+' kg')+(set.rpe==null?'':' · RPE '+num(set.rpe))+(set.warmup?' · opwarmset':'');
}
function syncSetForm(){
  const exercise=exerciseById[value(setForm,'exercise')]??exerciseById.squat, unit=units[exercise.unit];
  const amount=field(setForm,'amount'), load=field(setForm,'load');
  $('set-value-label').textContent=unit.name;
  amount.inputMode=unit.step===1?'numeric':'decimal';
  amount.placeholder=unit.step===1?'Bijv. 5':'Bijv. 4,37';
  $('set-load-label').hidden=!exercise.load;
  load.disabled=!exercise.load;
  $('set-unit-hint').textContent=exercise.load??(exercise.unit==='reps'?'Log de herhalingen per set.':'Log één meting of poging.');
}
function resetSetForm(exercise){
  editSet=null;
  setForm.reset();
  field(setForm,'exercise').value=exercise??logSetup().exercises[0]??'squat';
  $('set-form-title').textContent='Set toevoegen';
  $('cancel-set').hidden=true;
  setStatus('set-status','');
  syncSetForm();
}
function eventLogId(item){return 'event:'+item.id;}
function programLogId(date){return 'program:'+START+':'+date;}
function logOptions(date){
  const entry=state.logs[date];
  const options=new Map([['free','Vrij logboek']]);
  const program=programLogId(date), offset=delta(date,START);
  if(planOffset(date)!==null||(offset>=0&&offset<70&&logSession===program))options.set(program,plannedFor(date).title+' · Vertical Jump');
  for(const item of sortedEvents(date))options.set(eventLogId(item),item.title+(item.time?' · '+item.time:''));
  for(const item of entry?.sets??[])if(!options.has(item.session))options.set(item.session,item.title||'Eerdere sessie');
  for(const [id,item] of Object.entries(entry?.sessionNotes??{}))if(!options.has(id))options.set(id,item.title||'Eerdere sessie');
  return options;
}
function logSetup(){
  const title=logOptions(logDate).get(logSession)??'Vrij logboek';
  if(logSession===programLogId(logDate))return {title,exercises:plannedFor(logDate).exercises};
  const event=(state.events[logDate]??[]).find(item=>eventLogId(item)===logSession);
  const type={volleyball:'volleyball',match:'match',recovery:'recovery'};
  return {title,exercises:type[event?.kind]?[type[event.kind]]:[]};
}
function currentSets(){
  return (state.logs[logDate]?.sets??[]).filter(set=>set.session===logSession);
}
function currentNote(){
  const entry=state.logs[logDate];
  return (logSession==='free'?entry?.note:entry?.sessionNotes?.[logSession]?.note)??'';
}
function renderLog(loadNote=false){
  if($('logbook').hidden)return;
  const choices=logOptions(logDate);
  if(!choices.has(logSession))logSession='free';
  const sets=currentSets(), planned=logSetup();
  $('log-date').value=logDate;
  $('log-session').innerHTML=Array.from(choices,([id,title])=>'<option value="'+escapeHTML(id)+'">'+escapeHTML(title)+'</option>').join('');
  $('log-session').value=logSession;
  $('note-label').textContent=logSession==='free'?'Dagnotitie':'Sessienotitie';
  $('log-heading').textContent=planned.title;
  $('log-description').textContent=fmtDate(logDate)+(planned.exercises.length?' · Tik op een oefening om ze te loggen.':' · Kies zelf een oefening.');
  $('log-planned').innerHTML=planned.exercises.map(id=>'<button class="btn small" type="button" data-prefill="'+id+'">'+escapeHTML(exerciseById[id].name)+'</button>').join('');
  $('log-test').innerHTML=logSession===programLogId(logDate)?testMarkup(logDate):'';
  $('set-list').innerHTML=sets.map((set,i)=>
    '<div class="entry"><div><strong>'+escapeHTML(exerciseById[set.exercise].name)+'</strong><small>'+describeSet(set)+'</small></div>'+
    '<div class="actions"><button class="btn small" type="button" data-edit-set="'+escapeHTML(set.id)+'">Wijzig</button><button class="btn small danger" type="button" data-delete-set="'+escapeHTML(set.id)+'" aria-label="Verwijder set '+(i+1)+'">Wis</button></div></div>'
  ).join('')||'<p class="muted small">Je hebt voor deze sessie nog geen sets gelogd.</p>';
  $('copy-set').disabled=!sets.length;
  if(loadNote||field(noteForm,'note').value===displayedLogNote){
    displayedLogNote=currentNote();
    field(noteForm,'note').value=displayedLogNote;
  }
  if(loadNote){
    setStatus('log-note-status','');
  }
}
function selectLog(date,exercise,selected='free',focus=false){
  logDate=date;
  logSession=selected;
  showTab('logbook');
  renderLog(true);
  resetSetForm(exercise);
  if(focus)focusInput(field(setForm,'amount'));
}
function saveDayLog(entry){
  if(entry.sets.length||entry.note||Object.keys(entry.sessionNotes).length)state.logs[logDate]=entry;
  else delete state.logs[logDate];
}
function exerciseHistory(exercise){
  const sets=Object.entries(state.logs).flatMap(([date,entry])=>entry.sets.filter(x=>x.exercise===exercise.id).map(x=>({...x,date})));
  if(['standing','running','triple'].includes(exercise.id)){
    for(const test of allJumpTests()){
      const amount=test[exercise.id];
      if(amount!=null)sets.push({exercise:exercise.id,amount,date:test.date,fromTest:true});
    }
  }
  return sets.sort((a,b)=>b.date.localeCompare(a.date));
}
function exerciseRecords(exercise,history){
  const work=history.filter(x=>!x.warmup);
  const maxBy=(items,key)=>items.reduce((best,x)=>!best||key(x)>key(best)?x:best,null);
  const mode=isTimed(exercise)?(state.timeModes[exercise.id]??'longest'):null;
  const highest=maxBy(work,x=>mode==='fastest'?-x.amount:x.amount);
  const loaded=work.filter(x=>x.load>0);
  const heaviest=maxBy(loaded,x=>x.load);
  const single=exercise.load?maxBy(loaded.filter(x=>x.amount===1),x=>x.load):null;
  const estimate=(set)=>set.load*(1+set.amount/30);
  const estimated=exercise.estimate?maxBy(loaded.filter(x=>x.amount>=2&&x.amount<=10&&x.rpe>=9),estimate):null;
  return {highest,heaviest,single,estimated,mode,est:estimated?estimate(estimated):null};
}
function renderLibrary(){
  if($('library').hidden)return;
  const search=$('library-search').value.trim().toLocaleLowerCase('nl-BE'), group=$('library-filter').value;
  const matches=allExercises().filter(x=>(!group||x.group===group)&&x.name.toLocaleLowerCase('nl-BE').includes(search));
  if(!matches.some(x=>x.id===libraryChoice))libraryChoice=matches[0]?.id??'';
  const picker=$('library-select');
  picker.innerHTML=matches.map(x=>'<option value="'+x.id+'">'+escapeHTML(x.name)+'</option>').join('')||'<option value="">Geen oefeningen gevonden</option>';
  picker.disabled=!matches.length;
  picker.value=libraryChoice;
  $('library-list').innerHTML=matches.map(x=>
    '<button type="button" class="btn library-choice '+(x.id===libraryChoice?'active':'')+'" aria-pressed="'+(x.id===libraryChoice)+'" data-exercise="'+x.id+'">'+escapeHTML(x.name)+' <small>'+escapeHTML(x.group)+'</small></button>'
  ).join('')||'<p class="muted">Geen oefeningen gevonden.</p>';
  const x=exerciseById[libraryChoice];
  if(!x){$('library-detail').hidden=true;return;}
  $('library-detail').hidden=false;
  const history=exerciseHistory(x), record=exerciseRecords(x,history), unit=units[x.unit];
  const metric=(label,set,result)=>'<div class="record"><span>'+label+'</span><strong>'+(set?result:'—')+'</strong>'+(set?'<span>'+fmtDate(set.date)+'</span>':'')+'</div>';
  const loadedMetrics=x.load?[
    metric('Hoogste gewicht',record.heaviest,record.heaviest?num(record.heaviest.load,2)+' kg × '+record.heaviest.amount:''),
    metric('Zwaarste gelogde single',record.single,record.single?num(record.single.load,2)+' kg':''),
    ...(x.estimate?[metric('Geschatte 1RM',record.estimated,record.estimated?'≈ '+num(record.est)+' kg':'')]:[]),
  ]:[];
  $('library-detail').innerHTML='<p class="eyebrow">'+escapeHTML(x.group)+'</p><h3>'+escapeHTML(x.name)+'</h3><p>'+escapeHTML(x.cue)+'</p>'+
    (x.load?'<p class="muted small">Gewichtsnotatie: '+escapeHTML(x.load)+'.</p>':'')+
    (record.mode?'<label>Record vergelijken op<select id="time-mode" data-time-exercise="'+x.id+'"><option value="fastest"'+(record.mode==='fastest'?' selected':'')+'>Snelste tijd</option><option value="longest"'+(record.mode==='longest'?' selected':'')+'>Langste duur</option></select></label>':'')+
    '<div class="record-grid">'+metric(record.mode?{fastest:'Snelste tijd',longest:'Langste duur'}[record.mode]:x.unit==='reps'?'Meeste reps in één set':'Hoogste meting',record.highest,record.highest?num(record.highest.amount,2)+unit.suffix:'')+loadedMetrics.join('')+'</div>'+
    '<p class="muted small">Opwarmsets tellen mee in de geschiedenis. Records komen uit werksets.</p>'+
    (x.estimate?'<p class="muted small">De 1RM-schatting gebruikt Epley (gewicht × (1 + reps / 30)) voor sets van 2–10 reps op RPE 9–10. Volg de trend bij dezelfde oefening en opstelling.</p>':'')+
    '<div class="actions"><button class="btn primary small" type="button" data-log-exercise="'+x.id+'">Log op gekozen datum</button></div><h3 class="subline">Geschiedenis</h3>'+
    (history.length?'<p class="small muted">'+history.length+' gelogde '+(history.length===1?'set':'sets')+'</p><div class="set-list">'+history.slice(0,20).map(item=>
      '<div class="entry"><div><strong>'+describeSet(item)+'</strong><small>'+fmtDate(item.date)+(item.fromTest?' · test':'')+'</small></div>'+
      (item.fromTest?'<button type="button" class="btn small" data-open="about">Bekijk metingen</button>':'<button type="button" class="btn small" data-log-date="'+item.date+'" data-log-session="'+escapeHTML(item.session)+'">Open sessie</button>')+'</div>').join('')+'</div>'+
      (history.length>20?'<p class="muted small">Laatste 20 sets getoond. Oudere sets staan in het daglogboek.</p>':''):'<p class="muted small">Voor deze oefening heb je nog geen sets gelogd.</p>');
}
$('log-date').addEventListener('change',event=>{
  if(!isDate(event.target.value))return;
  logDate=event.target.value;
  logSession='free';
  resetSetForm();
  renderLog(true);
});
$('log-session').addEventListener('change',event=>{
  logSession=event.target.value;
  resetSetForm();
  renderLog(true);
});
$('library-detail').addEventListener('change',event=>{
  const id=event.target.dataset.timeExercise, mode=event.target.value;
  if(!id||!['fastest','longest'].includes(mode))return;
  state.timeModes[id]=mode;
  saveStatus(null,'',storeItem('timeMode',id,mode));
  renderLibrary();
  $('time-mode')?.focus({preventScroll:true});
});
$('library-search').addEventListener('input',renderLibrary);
$('library-filter').addEventListener('change',renderLibrary);
$('library-select').addEventListener('change',event=>{
  libraryChoice=event.target.value;
  renderLibrary();
});
field(setForm,'exercise').addEventListener('change',()=>{
  field(setForm,'load').value='';
  field(setForm,'amount').value='';
  syncSetForm();
});
$('cancel-set').addEventListener('click',()=>resetSetForm());
$('copy-set').addEventListener('click',()=>{
  const previous=currentSets().at(-1);
  if(!previous)return;
  resetSetForm(previous.exercise);
  fillSetForm(previous);
  setStatus('set-status','Vorige set overgenomen. Pas ze aan of bewaar ze als nieuwe set.');
  focusInput(field(setForm,'amount'));
});
function fillSetForm(set){
  for(const k of ['exercise','amount','load','rpe'])field(setForm,k).value=set[k]??'';
  field(setForm,'warmup').checked=set.warmup;
  syncSetForm();
}
function emptyLog(){return {sets:[],note:'',sessionNotes:{}};}
setForm.addEventListener('submit',event=>{
  event.preventDefault();
  const currentEntry=state.logs[logDate]??emptyLog();
  const input=value(setForm,'amount').trim(), amount=/^\d+(?:[.,]\d{1,2})?$/.test(input)?Number(input.replace(',','.')):null;
  const index=editSet===null?-1:currentEntry.sets.findIndex(set=>set.id===editSet);
  if(editSet!==null&&index<0){setStatus('set-status','Deze set werd elders gewist. Annuleer de wijziging of bewaar een nieuwe set.');return;}
  const set=cleanSet({id:editSet??uid(),exercise:value(setForm,'exercise'),amount,session:logSession,title:logSetup().title,
    load:number(setForm,'load'),rpe:number(setForm,'rpe'),warmup:field(setForm,'warmup').checked});
  if(!set){setStatus('set-status','Vul een geldige waarde in. Reps zijn hele getallen. Tijd en afstand mogen decimalen bevatten.');return;}
  const updating=editSet!==null;
  const item=storedListItem('set',set,logDate,currentEntry.sets[index]?.order);
  if(updating)currentEntry.sets[index]=set;
  else currentEntry.sets.push(set);
  saveDayLog(currentEntry);
  resetSetForm(set.exercise);
  saveStatus('set-status',updating?'Set bijgewerkt.':'Set bewaard op '+fmtDate(logDate)+'.',item);
  renderLog();
  renderLibrary();
  renderToday();
  field(setForm,'amount').focus();
});
noteForm.addEventListener('submit',event=>{
  event.preventDefault();
  const entry=state.logs[logDate]??emptyLog();
  const note=value(noteForm,'note').trim(), valueToSave={note,title:logSetup().title};
  if(logSession==='free')entry.note=note;
  else if(note)entry.sessionNotes[logSession]=valueToSave;
  else delete entry.sessionNotes[logSession];
  saveDayLog(entry);
  displayedLogNote=note;
  saveStatus('log-note-status','Notitie bewaard.',note?storeItem('note',logSession,valueToSave,logDate):removeItem('note',logSession,logDate));
  renderToday();
});
document.addEventListener('click',event=>{
  const data=event.target.closest('button')?.dataset;
  if(!data)return;
  if(data.logDate)selectLog(data.logDate,undefined,data.logSession??'free',data.logFocus!==undefined);
  if(data.prefill){
    resetSetForm(data.prefill);
    field(setForm,'amount').focus();
  }
  if(data.logExercise){
    selectLog(logDate,data.logExercise,logSession,true);
  }
  if(data.exercise){
    libraryChoice=data.exercise;
    renderLibrary();
    $('library-list').querySelector('[data-exercise="'+libraryChoice+'"]')?.focus();
  }
  if(data.editSet!==undefined){
    const set=currentSets().find(entry=>entry.id===data.editSet);
    if(!set)return;
    editSet=set.id;
    fillSetForm(set);
    $('set-form-title').textContent='Set wijzigen';
    $('cancel-set').hidden=false;
    setStatus('set-status','');
    syncSetForm();
    field(setForm,'amount').focus();
  }
  if(data.deleteSet!==undefined&&window.confirm('Deze set verwijderen?')){
    const entry=state.logs[logDate];
    if(!entry)return;
    entry.sets=entry.sets.filter(set=>set.id!==data.deleteSet);
    saveDayLog(entry);
    resetSetForm();
    saveStatus('set-status','Set verwijderd.',removeItem('set',data.deleteSet,logDate));
    renderLog();
    renderLibrary();
    renderToday();
  }
});
async function copyText(text,status,message){
  try{
    await navigator.clipboard.writeText(text);
    setStatus(status,message);
  }catch{
    const dialog=$('copy-dialog'), input=$('copy-text');
    input.value=text;
    dialog.showModal();
    input.select();
  }
}
function sessionText(date){
  const i=delta(date,START), d=weekday(date), s=session(Math.floor(i/7),d);
  return [DAYS[d]+' '+fmtDate(date)+' · '+s.title+' · '+s.time,s.intro,...s.moves.map(([name,dose,pause,note])=>name+' — '+dose+' · '+pause+' rust · '+note)].join('\n');
}
function loadStateViews(){
  openedViews.clear();
  setProgramDate(true,false);
  syncExercises();
  agendaWeek=weekMonday(current);
  logDate=foodDay=current;
  logSession='free';
  foodWeek=weekMonday(current);
  resetProductEditor();
  refresh();
}
$('wipe-data').addEventListener('click',async ()=>{
  if(!window.confirm('Alle lokale trainingsdata, recepten, metingen en inname wissen? Download eerst een back-up als je ze wilt bewaren.'))return;
  try {
    await replaceStoredState(emptyState());
    loadStateViews();
    setStatus('backup-status','Je gegevens zijn gewist in deze browser.');
  } catch(error) {
    showStorageError(error);
    setStatus('backup-status','De app kon de gegevens niet wissen. Je kunt de sitegegevens wissen in je browserinstellingen.');
  }
});
if(location.protocol==='https:'||location.protocol==='http:')$('copy-link').hidden=false;
$('copy-link').addEventListener('click',()=>{
  const url=new URL(location.href);
  url.hash='';
  url.search='';
  url.pathname=url.pathname.replace(/\/index\.html$/,'/');
  copyText(url.href,'footer-status','Link gekopieerd.');
});
function setLoading(button,loading){
  button.disabled=loading;
  button.setAttribute('aria-busy',String(loading));
  button.classList.toggle('loading',loading);
}
async function compactMealPhoto(file){
  const source=URL.createObjectURL(file), img=new Image();
  try{
    img.src=source;
    await img.decode();
    const scale=Math.min(1,1280/Math.max(img.naturalWidth,img.naturalHeight));
    if(scale===1&&file.size<240*1024)return file;
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
    canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
    const ctx=canvas.getContext('2d',{alpha:false});
    ctx.fillStyle='#fff';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img,0,0,canvas.width,canvas.height);
    return (await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.82)))??file;
  }finally{
    img.removeAttribute('src');
    URL.revokeObjectURL(source);
  }
}
let photoRequest=0;
$('meal-image').addEventListener('change',async event=>{
  const request=++photoRequest, file=event.target.files[0], preview=$('food-preview');
  if(photoURL)URL.revokeObjectURL(photoURL);
  photoURL=null;
  preview.hidden=true;
  preview.removeAttribute('src');
  if(!file){setStatus('photo-status','');return;}
  if(file.size>MAX_PHOTO){setStatus('photo-status','Kies een foto kleiner dan 18 MB.');return;}
  setStatus('photo-status','Foto voorbereiden…');
  try{
    const compact=await compactMealPhoto(file);
    if(request!==photoRequest)return;
    photoURL=URL.createObjectURL(compact);
    preview.src=photoURL;
    preview.hidden=false;
    setStatus('photo-status','Foto klaar. Kies hieronder een ingrediënt en vul de portie in.');
  }catch{
    if(request===photoRequest)setStatus('photo-status','Je browser kan deze foto niet lezen. Probeer JPEG of PNG.');
  }
});
const agendaForm=$('agenda-form'), recoveryForm=$('recovery-form'), programForm=$('program-form'), exerciseForm=$('exercise-form');
let agendaWeek=weekMonday(current), activeEvent=null;
function setProgramDate(focusToday=false,updateForm=true){
  START=state.program?.start??(weekday(current)===0?current:plusDay(weekMonday(current),7));
  if(focusToday){
    const i=Math.min(69,Math.max(0,delta(current,START)));
    week=Math.floor(i/7);
    day=i%7;
  }
  if(updateForm){
    field(programForm,'start').value=START;
    field(programForm,'enabled').checked=state.program?.enabled??false;
  }
}
programForm.addEventListener('submit',event=>{
  event.preventDefault();
  const start=value(programForm,'start');
  if(!monday(start)){setStatus('program-status','Kies een maandag als startdatum.');return;}
  const prev=state.program?.start;
  if(prev!==start){
    if(prev&&(Object.keys(state.done).length||Object.keys(state.tests).length)){
      state.blocks[prev]={done:state.done,tests:state.tests};
    }
    const previousBlock=state.blocks[start];
    state.done=previousBlock?.done??{};
    state.tests=previousBlock?.tests??{};
    delete state.blocks[start];
  }
  state.program={start,enabled:field(programForm,'enabled').checked};
  setProgramDate(true);
  refresh();
  saveStatus('program-status',state.program.enabled?'Programma actief vanaf '+fmtDate(start)+'.':'Startdatum bewaard. Het programma is beschikbaar onder Programma’s.',storeItem('meta','program',state.program));
});
field(agendaForm,'kind').innerHTML=Object.entries(SPORTS).map(([key,name])=>'<option value="'+key+'">'+name+'</option>').join('');
function agendaRow(date,item,editable){
  const type=SPORTS[item.kind], identifier=escapeHTML(item.id), extra=[type,item.time,item.minutes?item.minutes+' min':''].filter(Boolean).join(' · ');
  return '<div class="entry agenda-entry"><div><strong>'+escapeHTML(item.title)+'</strong><small>'+escapeHTML(extra)+'</small>'+
    (item.note?'<small>'+escapeHTML(item.note)+'</small>':'')+'</div><div class="actions">'+
    '<button type="button" class="btn small" data-log-date="'+date+'" data-log-session="'+escapeHTML(eventLogId(item))+'" data-log-focus>Log een set</button>'+
    '<button type="button" class="btn small'+(item.done?' active':'')+'" aria-pressed="'+item.done+'" data-agenda-date="'+date+'" data-agenda-done="'+identifier+'">'+
    (item.done?'✓ Voltooid':'Voltooien')+'</button>'+
    (editable?'<button type="button" class="btn small" data-agenda-date="'+date+'" data-agenda-edit="'+identifier+'">Wijzig</button>'+
      '<button type="button" class="btn small danger" data-agenda-date="'+date+'" data-agenda-delete="'+identifier+'">Wis</button>':'')+'</div></div>';
}
function sortedEvents(date){
  return [...(state.events[date]??[])].sort((a,b)=>(a.time||'99').localeCompare(b.time||'99'));
}
function renderAgenda(){
  if($('agenda').hidden)return;
  $('agenda-heading').textContent=fmtDate(agendaWeek)+' – '+fmtDate(plusDay(agendaWeek,6));
  $('agenda-list').innerHTML=DAYS.map((name,i)=>{
    const date=plusDay(agendaWeek,i), items=sortedEvents(date), offset=planOffset(date);
    const builtIn=offset===null?'':'<div class="entry agenda-entry"><div><strong>'+escapeHTML(session(Math.floor(offset/7),i).title)+'</strong><small>Vertical Jump'+
      (state.done[date]?' · ✓ voltooid':'')+'</small></div><div class="actions"><button type="button" class="btn small" data-jump="'+date+'">Bekijk sessie</button>'+
      '<button type="button" class="btn small" data-log-date="'+date+'" data-log-session="'+programLogId(date)+'" data-log-focus>Log een set</button></div></div>';
    return '<div class="agenda-day"><div class="row between"><h4>'+name+' <small>'+fmtDate(date)+'</small></h4><button type="button" class="btn small" data-new-agenda="'+date+'">Sessie toevoegen</button></div>'+
      (builtIn||items.length?builtIn+(offset===null?'':testMarkup(date))+items.map(item=>agendaRow(date,item,true)).join(''):'<p class="muted small">Vrij</p>')+'</div>';
  }).join('');
}
function openEventForm(date,item){
  activeEvent=item?{date,id:item.id}:null;
  agendaForm.reset();
  field(agendaForm,'date').value=date;
  $('agenda-repeat').hidden=!!item;
  $('agenda-cancel').hidden=!item;
  $('agenda-form-heading').textContent=item?'Sessie wijzigen':'Sessie plannen';
  $('agenda-submit').textContent=item?'Wijziging bewaren':'Sessie bewaren';
  if(item)for(const key of ['kind','title','time','minutes','note'])field(agendaForm,key).value=item[key]??'';
  setStatus('agenda-status','');
}
function refreshAgenda(){
  renderAgenda();
  renderToday();
  renderFood();
}
agendaForm.addEventListener('submit',event=>{
  event.preventDefault();
  const date=value(agendaForm,'date'), repeat=activeEvent?1:number(agendaForm,'repeat');
  if(!isDate(date)||!Number.isInteger(repeat)||!bounded(repeat,1,12))return;
  const previous=activeEvent&&(state.events[activeEvent.date]??[]).find(x=>x.id===activeEvent.id);
  const item=cleanEvent({id:previous?.id,done:previous?.done,minutes:number(agendaForm,'minutes'),...Object.fromEntries(['kind','title','time','note'].map(k=>[k,value(agendaForm,k)]))});
  if(!item){setStatus('agenda-status','Geef de sessie een naam.');return;}
  const changes=[];
  if(previous){
    deleteEvent(activeEvent.date,previous.id);
    if(activeEvent.date!==date)changes.push(removeItem('event',previous.id,activeEvent.date));
  }
  for(let i=0;i<repeat;i++){
    const day=plusDay(date,i*7);
    const entry=i?{...item,id:uid()}:item;
    (state.events[day]??=[]).push(entry);
    changes.push(storedListItem('event',entry,day,i?undefined:previous?.order));
  }
  agendaWeek=weekMonday(date);
  openEventForm(date);
  refreshAgenda();
  saveStatus('agenda-status',repeat===1?'Sessie bewaard.':repeat+' wekelijkse sessies bewaard.',...changes);
});
function deleteEvent(date,id){
  const items=(state.events[date]??[]).filter(x=>x.id!==id);
  if(items.length)state.events[date]=items;
  else delete state.events[date];
}
$('agenda-cancel').addEventListener('click',()=>openEventForm(field(agendaForm,'date').value||current));
$('agenda-prev').addEventListener('click',()=>{agendaWeek=plusDay(agendaWeek,-7);renderAgenda();});
$('agenda-next').addEventListener('click',()=>{agendaWeek=plusDay(agendaWeek,7);renderAgenda();});
document.addEventListener('click',event=>{
  const data=event.target.closest('button')?.dataset;
  if(!data)return;
  if(data.newAgenda){
    agendaWeek=weekMonday(data.newAgenda);
    showTab('agenda');
    openEventForm(data.newAgenda);
    focusInput(field(agendaForm,'title'));
  }
  if(data.openAgenda){
    agendaWeek=weekMonday(data.openAgenda);
    showTab('agenda');
  }
  const date=data.agendaDate;
  if(date){
    const item=(state.events[date]??[]).find(x=>x.id===(data.agendaDone??data.agendaEdit??data.agendaDelete));
    if(!item)return;
    if(data.agendaDone){
      item.done=!item.done;
      saveStatus('agenda-status',item.done?'Sessie voltooid.':'Sessie opnieuw geopend.',storedListItem('event',item,date));
      refreshAgenda();
      const parent=$('agenda').hidden?$('today-session'):$('agenda-list');
      Array.from(parent.querySelectorAll('[data-agenda-done]')).find(b=>b.dataset.agendaDone===item.id)?.focus({preventScroll:true});
    }
    if(data.agendaEdit){openEventForm(date,item);field(agendaForm,'title').focus();}
    if(data.agendaDelete&&window.confirm('Deze sessie uit de agenda wissen? Je daglogboek blijft bewaard.')){
      deleteEvent(date,item.id);
      if(activeEvent?.id===item.id)openEventForm(date);
      refreshAgenda();
      saveStatus('agenda-status','Sessie gewist.',removeItem('event',item.id,date));
    }
  }
  if(data.recoveryDate){
    showTab('recovery');
    loadCheckin(data.recoveryDate);
    if(data.recoveryFocus!==undefined)focusInput(field(recoveryForm,'sleep'));
  }
});
function checkinLabel(item){
  return [item.sleep===null?'':num(item.sleep,2)+' uur slaap',item.energy===null?'':'Frisheid '+item.energy+'/5',
    item.legs===null?'':'Benen '+item.legs+'/5'].filter(Boolean).join(' · ');
}
function loadCheckin(date){
  const currentCheck=state.checkins[date];
  field(recoveryForm,'date').value=date;
  for(const key of ['sleep','energy','legs','note'])field(recoveryForm,key).value=currentCheck?.[key]??'';
  $('recovery-delete').hidden=!currentCheck;
  setStatus('recovery-status','');
}
function renderRecovery(){
  if($('recovery').hidden)return;
  $('recovery-history').innerHTML=Object.entries(state.checkins).sort(([a],[b])=>b.localeCompare(a)).slice(0,21).map(([date,item])=>
    '<div class="entry"><div><strong>'+fmtDate(date)+'</strong><small>'+checkinLabel(item)+'</small>'+
    (item.note?'<small>'+escapeHTML(item.note)+'</small>':'')+'</div><button type="button" class="btn small" data-recovery-date="'+date+'">Bekijk</button></div>').join('')||
    '<p class="muted small">Je hebt nog geen check-ins.</p>';
}
field(recoveryForm,'date').addEventListener('change',()=>{const date=value(recoveryForm,'date');if(isDate(date))loadCheckin(date);});
recoveryForm.addEventListener('submit',event=>{
  event.preventDefault();
  const date=value(recoveryForm,'date'), item=cleanCheck({sleep:number(recoveryForm,'sleep'),energy:number(recoveryForm,'energy'),legs:number(recoveryForm,'legs'),note:value(recoveryForm,'note').trim()});
  if(!isDate(date)||!item){setStatus('recovery-status','Vul minstens één waarde of een notitie in.');return;}
  state.checkins[date]=item;
  loadCheckin(date);
  saveStatus('recovery-status','Check-in bewaard.',storeItem('checkin',date,item));
  renderRecovery();
  renderToday();
});
$('recovery-delete').addEventListener('click',()=>{
  const date=value(recoveryForm,'date');
  if(!state.checkins[date]||!window.confirm('Deze check-in wissen?'))return;
  delete state.checkins[date];
  loadCheckin(date);
  saveStatus('recovery-status','Check-in gewist.',removeItem('checkin',date));
  renderRecovery();
  renderToday();
});
exerciseForm.addEventListener('submit',event=>{
  event.preventDefault();
  const entry=cleanCustomExercise({id:'custom-'+uid(),...Object.fromEntries(['name','group','type','cue'].map(k=>[k,value(exerciseForm,k)]))});
  if(!entry){setStatus('exercise-status','Geef je oefening een naam.');return;}
  if(allExercises().some(x=>x.name.toLocaleLowerCase('nl-BE')===entry.name.toLocaleLowerCase('nl-BE'))){
    setStatus('exercise-status','Die oefening staat al in je bibliotheek.');
    return;
  }
  state.customExercises[entry.id]=entry;
  const picked=value(setForm,'exercise');
  syncExercises();
  field(setForm,'exercise').value=picked;
  syncSetForm();
  libraryChoice=entry.id;
  $('library-search').value='';
  $('library-filter').value='';
  renderLibrary();
  exerciseForm.reset();
  saveStatus('exercise-status','Oefening toegevoegd.',storeItem('exercise',entry.id,entry));
});
field(exerciseForm,'type').innerHTML=Object.entries(CUSTOM_UNITS).map(([key,name])=>'<option value="'+key+'">'+name+'</option>').join('');
initProducts();
const showLinkedTab=()=>{const tab=location.hash.slice(1);if(tab!=='main')showTab(tab||'today',false);};
async function startApp(){
  await startStorage();
  setProgramDate(true,false);
  syncExercises();
  readyToRender=true;
  $('main').inert=false;
  $('startup-status').hidden=true;
  const initialTab=location.hash.slice(1);
  performance.mark('athlete-hub-render-start');
  showTab(initialTab==='tests'?'about':$(initialTab)?.classList.contains('view')?initialTab:'today',false);
  performance.measure('athlete-hub-first-render','athlete-hub-render-start');
  window.addEventListener('hashchange',showLinkedTab);
  window.addEventListener('popstate',showLinkedTab);
  window.addEventListener('focus',requestSync);
  if(syncRequested)requestSync();
  performance.mark('athlete-hub-ready');
}
startApp();
let installPrompt;
const installedApp=matchMedia('(display-mode: standalone)').matches || navigator.standalone===true;
function showInstalled(){
  for(const button of all('[data-install]'))button.hidden=true;
}
if(installedApp)showInstalled();
window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  installPrompt=event;
});
window.addEventListener('appinstalled',()=>{
  installPrompt=null;
  showInstalled();
});
for(const button of all('[data-install]'))button.addEventListener('click',async ()=>{
  if(!installPrompt){$('install-dialog').showModal();return;}
  const prompt=installPrompt;
  installPrompt=null;
  try{await prompt.prompt();}
  catch{$('install-dialog').showModal();}
});
if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('./sw.js').catch(error=>console.warn('Offline openen is niet beschikbaar.',error));
  });
}
