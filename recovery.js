'use strict';

const POLAR_DEVICE = 'polar-pacer-pro';
const NIGHTLY_LABELS = {
  very_poor:'Zeer slecht',poor:'Slecht',compromised:'Verminderd',ok:'OK',good:'Goed',very_good:'Zeer goed',
};
const WEARABLE_FIELDS = {
  restingHR:{label:'Rusthartslag in de ochtend',min:20,max:220,unit:' bpm'},
  nightHR:{label:'Hartslag eerste 4 uur slaap',min:20,max:220,unit:' bpm'},
  hrv:{label:'HRV eerste 4 uur slaap',min:1,max:1000,unit:' ms'},
  breathing:{label:'Ademfrequentie eerste 4 uur',min:3,max:60,unit:' /min'},
  sleepScore:{label:'Polar-slaapscore',min:1,max:100,unit:' /100'},
  ansCharge:{label:'ANS charge',min:-10,max:10,unit:''},
};
const RECOVERY_LEVELS = {
  empty:'Check-in nodig',limited:'Beperkte gegevens',normal:'Volgens plan',
  check:'Extra opwarmcheck',light:'Lichter voorstel',
};

function cleanWearable(value) {
  if (!value || value.device!==POLAR_DEVICE) return null;
  const clean={device:POLAR_DEVICE};
  for (const [key,field] of Object.entries(WEARABLE_FIELDS)) {
    clean[key]=bounded(value[key],field.min,field.max)?value[key]:null;
  }
  for (const key of ['sleepStart','wakeTime']) {
    clean[key]=/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value[key])?value[key]:'';
  }
  clean.nightly=Object.hasOwn(NIGHTLY_LABELS,value.nightly)?value.nightly:'';
  return Object.keys(WEARABLE_FIELDS).some(key=>clean[key]!==null) ||
    clean.nightly || clean.sleepStart || clean.wakeTime ? clean : null;
}

function cleanAdjustment(value,date) {
  return value?.mode==='light' && monday(value.programStart) &&
    delta(date,value.programStart)>=0 && delta(date,value.programStart)<70 ?
    {mode:'light',programStart:value.programStart} : null;
}

function median(values) {
  const sorted=[...values].sort((a,b)=>a-b), middle=Math.floor(sorted.length/2);
  return sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2;
}

function wearableReference(date,key,data=state) {
  const observations=Object.entries(data.wearables)
    .filter(([day,value])=>delta(date,day)>0 && delta(date,day)<=28 &&
      value.device===POLAR_DEVICE && typeof value[key]==='number' && Number.isFinite(value[key]))
    .map(([,value])=>value[key]);
  return {count:observations.length,usual:observations.length>=7?median(observations):null};
}

function recoveryAssessment(date,data=state) {
  const check=data.checkins[date], watch=data.wearables[date];
  const reference={
    restingHR:wearableReference(date,'restingHR',data),hrv:wearableReference(date,'hrv',data),
  };
  const signals=[], domains=new Set(), available=new Set();
  const add=(domain,text)=>{domains.add(domain);signals.push(text);};
  let severe=false;
  if (check?.sleep!=null) {
    available.add('sleep');
    if (check.sleep<7) add('sleep','Slaapduur '+num(check.sleep,2)+' uur ligt onder 7 uur.');
    if (check.sleep<6) severe=true;
  }
  if (check?.quality!=null) {
    available.add('sleep');
    if (check.quality<=2) add('sleep','Je beoordeelt je slaapkwaliteit als laag ('+check.quality+'/5).');
  }
  if (check?.energy!=null || check?.legs!=null) {
    available.add('feeling');
    if (check.energy!=null && check.energy<=2) add('feeling','Je voelt je moe ('+check.energy+'/5).');
    if (check.legs!=null && check.legs<=2) add('feeling','Je benen voelen zwaar ('+check.legs+'/5).');
    if (check.energy===1 || check.legs===1) severe=true;
  }
  if (watch?.nightly) {
    available.add('watch');
    if (['very_poor','poor','compromised'].includes(watch.nightly)) {
      add('watch','Polar Nightly Recharge is '+NIGHTLY_LABELS[watch.nightly].toLowerCase()+'.');
    }
  }
  if (watch?.restingHR!=null && reference.restingHR.usual!==null) {
    available.add('watch');
    const change=watch.restingHR-reference.restingHR.usual;
    if (change>=5) add('watch','Je ochtend-rusthartslag ligt '+num(change)+' bpm boven je eigen mediaan.');
  }
  if (watch?.hrv!=null && reference.hrv.usual!==null) {
    available.add('watch');
    const change=(watch.hrv/reference.hrv.usual-1)*100;
    if (change<=-20) add('watch','Je nachtelijke HRV ligt '+num(-change,0)+'% onder je eigen mediaan.');
  }
  // Nightly Recharge already contains sleep information. A sleep flag plus a
  // watch flag needs a subjective fatigue flag before it reduces training.
  const combined=domains.has('feeling') && (domains.has('sleep') || domains.has('watch'));
  const hasData=!!watch || !!check;
  const level=severe||combined?'light':signals.length?'check':
    available.size>=2 && available.has('feeling')?'normal':hasData?'limited':'empty';
  return {level,label:RECOVERY_LEVELS[level],signals,reference,watch,check,available:available.size};
}

function recoverySummary(date) {
  const assessment=recoveryAssessment(date);
  return '<span class="pill recovery-pill '+assessment.level+'">'+assessment.label+'</span>';
}

function recoveryAdviceMarkup(date,compact=false) {
  const assessment=recoveryAssessment(date), {level}=assessment;
  const text={
    empty:'Voeg slaap, je gevoel en eventueel Polar-gegevens toe voor een advies voor deze dag.',
    limited:'Vul ook je slaapduur en eigen gevoel in. Je beschikbare gegevens geven nog beperkt houvast.',
    normal:'Volg het geplande volume als je techniek en snelheid in de opwarming goed zijn.',
    check:'Neem extra tijd voor de opwarming. Beoordeel je eerste werksets en sprongen vóór je verder opbouwt.',
    light:'Overweeg vandaag minder werksets en een rustigere trainingsprikkel. De lichte optie is beschikbaar bij je gymsessie.',
  }[level];
  return '<div class="recovery-advice '+level+'"><div class="row between"><h3>Trainingsadvies</h3>'+recoverySummary(date)+'</div>'+
    '<p>'+text+'</p>'+(assessment.signals.length?'<ul class="recovery-reasons">'+assessment.signals.map(text=>'<li>'+escapeHTML(text)+'</li>').join('')+'</ul>':'')+
    (compact?'':'<p class="small muted">Praktische schatting op basis van deze dag. Toets het advies aan je opwarming en hoe je je voelt.</p>')+'</div>';
}

function renderRecoveryAssessment() {
  if ($('recovery').hidden) return;
  const date=value(recoveryForm,'date') || current, assessment=recoveryAssessment(date);
  $('recovery-advice').innerHTML=recoveryAdviceMarkup(date);
  $('recovery-advice-date').textContent='Advies voor '+fmtDate(date);
  const rows=['restingHR','hrv'].map(key=>{
    const field=WEARABLE_FIELDS[key], reference=assessment.reference[key];
    const currentValue=assessment.watch?.[key];
    const difference=currentValue!=null && reference.usual!==null ? currentValue-reference.usual : null;
    return '<tr><th scope="row">'+field.label+'</th><td>'+(currentValue==null?'—':num(currentValue)+field.unit)+'</td>'+
      '<td>'+(reference.usual===null?'Nog '+Math.max(0,7-reference.count)+' metingen nodig':num(reference.usual)+field.unit)+'</td>'+
      '<td>'+reference.count+'/28</td><td>'+(difference===null?'—':(difference>0?'+':'')+num(difference)+field.unit)+'</td></tr>';
  }).join('');
  $('recovery-baseline').innerHTML='<table><thead><tr><th>Meting</th><th>Deze dag</th><th>Eigen mediaan</th><th>Eerdere dagen</th><th>Verschil</th></tr></thead><tbody>'+rows+'</tbody></table>';
  const offset=planOffset(date);
  $('recovery-session-link').innerHTML=offset!==null?'<button class="btn small" type="button" data-jump="'+date+'">Bekijk de geplande sessie</button>':'';
}

function renderRecoveryDevice() {
  if ($('recovery').hidden) return;
  $('recovery-device').value=state.recoveryDevice??'';
  const selected=state.recoveryDevice===POLAR_DEVICE;
  $('polar-fields').hidden=!selected;
  for (const input of all('#polar-fields input, #polar-fields select')) input.disabled=!selected;
  $('polar-source-note').hidden=!selected;
}

function loadWearableFields(date) {
  const watch=state.wearables[date];
  for (const key of [...Object.keys(WEARABLE_FIELDS),'nightly','sleepStart','wakeTime']) {
    field(recoveryForm,key).value=watch?.[key]??'';
  }
  renderRecoveryDevice();
}

function readWearableFields() {
  if (state.recoveryDevice!==POLAR_DEVICE) return null;
  return cleanWearable({
    device:POLAR_DEVICE,
    ...Object.fromEntries(Object.keys(WEARABLE_FIELDS).map(key=>[key,number(recoveryForm,key)])),
    ...Object.fromEntries(['nightly','sleepStart','wakeTime'].map(key=>[key,value(recoveryForm,key)])),
  });
}

function wearableLabel(watch) {
  if (!watch) return '';
  return [watch.nightly?'Nightly Recharge '+NIGHTLY_LABELS[watch.nightly]:'',
    watch.restingHR==null?'':'Ochtend-rusthartslag '+num(watch.restingHR)+' bpm',
    watch.sleepScore==null?'':'Slaapscore '+num(watch.sleepScore)+'/100',
    watch.hrv==null?'':'HRV '+num(watch.hrv)+' ms'].filter(Boolean).join(' · ') || 'Polar Pacer Pro · extra metingen';
}

function lightGymSession(original) {
  const capRPE=text=>text.replace(/RPE (\d+(?:[,\.]\d+)?(?:[–-]\d+(?:[,\.]\d+)?)?)/g,
    (phrase,target)=>parseFloat(target.replace(',','.'))<7?phrase:'RPE 6–7');
  const moves=original.moves
    .filter(([name])=>!['Nordic curl (geassisteerd)','Reverse lunge'].includes(name))
    .map(([name,dose,pause,note])=>{
      let reduced=capRPE(dose.replace(/^(\d+) ×/,(_,sets)=>Math.max(1,Number(sets)-1)+' ×'));
      if (name==='Aanloopsprong') reduced=reduced.replace(/\d+[–-]\d+%/,'85–90%');
      const intent=['Power clean','Clean pull','Aanloopsprong'].includes(name)?
        'Houd snelheid en landing goed. Stop het blok als je uitvoering duidelijk terugvalt.':
        'Houd bij krachtwerk minstens drie goede herhalingen over. RPE maximaal 6–7.';
      return [name,reduced,pause,capRPE(note)+' '+intent];
    });
  return {...original,time:'Kortere sessie',intro:'Lichte versie gekozen op basis van je herstel. Werk gecontroleerd en beoordeel je opwarming.',moves};
}

function sessionForDate(date) {
  const offset=delta(date,START), day=weekday(date), original=session(Math.floor(offset/7),day);
  return [0,1].includes(day) && state.sessionAdjustments[date]?.programStart===START ?
    lightGymSession(original) : original;
}

function recoveryPlanMarkup(date) {
  const offset=delta(date,START), day=weekday(date), assessment=recoveryAssessment(date);
  if (offset<0 || offset>=70 || ![0,1].includes(day)) return '';
  const light=state.sessionAdjustments[date]?.programStart===START;
  if (!light && assessment.level!=='light' && assessment.level!=='check') return '';
  return '<div class="recovery-plan notice"><div class="row between"><strong>'+(light?'Lichte sessie gekozen':assessment.label)+'</strong>'+
    '<button class="btn small" type="button" data-recovery-date="'+date+'">Bekijk herstel</button></div>'+
    '<p class="small spaced">'+(light?'Eén werkset minder per oefening, minimaal één set. Nordic curls en reverse lunges vervallen. Aanloopsprongen op 85–90%, krachtwerk maximaal RPE 6–7 met minstens drie goede reps over.':
      'Je herstelgegevens geven aanleiding om de opwarming extra te beoordelen. Je kunt hieronder een lichtere gymsessie kiezen.')+'</p>'+
    (testStage(date)?'<p class="small">Er staat ook een sprongtest gepland. Noteer je herstel bij het resultaat en test bij voorkeur onder vergelijkbare omstandigheden.</p>':'')+
    '<button class="btn small" type="button" data-recovery-plan="'+date+'" data-recovery-mode="'+(light?'original':'light')+'">'+
    (light?'Oorspronkelijke sessie tonen':'Lichtere sessie gebruiken')+'</button></div>';
}

function initRecovery() {
  $('recovery-device').addEventListener('change',event=>{
    state.recoveryDevice=event.target.value===POLAR_DEVICE?POLAR_DEVICE:null;
    saveStatus('recovery-device-status',state.recoveryDevice?'Polar Pacer Pro gekozen. Neem je waarden over uit Polar Flow.':'Apparaatkeuze gewist.',
      state.recoveryDevice?storeItem('meta','recoveryDevice',state.recoveryDevice):removeItem('meta','recoveryDevice'));
    loadWearableFields(value(recoveryForm,'date') || current);
  });
  document.addEventListener('click',event=>{
    const data=event.target.closest('button')?.dataset;
    if (!data?.recoveryPlan) return;
    const date=data.recoveryPlan;
    const offset=delta(date,START);
    if (!isDate(date) || offset<0 || offset>=70 || ![0,1].includes(weekday(date))) return;
    if (data.recoveryMode==='light') {
      state.sessionAdjustments[date]={mode:'light',programStart:START};
      saveStatus(null,'',storeItem('adjustment',date,state.sessionAdjustments[date]));
    } else {
      delete state.sessionAdjustments[date];
      saveStatus(null,'',removeItem('adjustment',date));
    }
    renderTraining();
    renderLog();
    renderToday();
  });
}
