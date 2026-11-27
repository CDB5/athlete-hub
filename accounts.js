'use strict';

let accountClient=null,accountUser=null,accountInfo=null,accountError='',accountSwitch=Promise.resolve();
let accountConfig=null,accountReady=false,accountStorageKey='',accountRecovery=false;
let storageGeneration=0;

function configuredCloud(){
  const config=window.ATHLETE_CLOUD_CONFIG;
  if(!config?.url&&!config?.publishableKey)return null;
  try{
    const url=new URL(config.url);
    if(url.protocol!=='https:'||url.pathname!=='/'||url.username||url.password||url.search||url.hash||
      !/^sb_publishable_[A-Za-z0-9_-]+$/.test(config.publishableKey))throw Error();
    return {url:url.origin,key:config.publishableKey,project:url.hostname};
  }catch{throw Error('Controleer de publieke Supabase-project-URL en publishable key in cloud-config.js.');}
}
function accountSummaryText(){
  if(!accountUser)return 'Op dit toestel';
  if(!navigator.onLine)return 'Offline · wijzigingen blijven op dit toestel';
  if(accountInfo?.conflicts.length)return accountInfo.conflicts.length+' verschil(len) bekijken';
  if(accountInfo?.pending)return accountInfo.pending+' wijziging(en) wachten op synchronisatie';
  if(accountInfo?.busy)return 'Synchroniseren…';
  if(accountInfo?.error||accountError)return 'Synchronisatie vraagt aandacht';
  return accountInfo?.lastSuccess?'Gesynchroniseerd':'Account laden…';
}
function accountBadge(){
  return '<button type="button" class="btn small account-badge" data-open="account">'+
    escapeHTML(accountUser?.username||accountUser?.user_metadata?.username||'Account')+' · '+escapeHTML(accountSummaryText())+'</button>';
}
function renderAccount(){
  if(!$('account'))return;
  $('account-short-status').textContent=accountUser?(accountUser.username||accountUser.user_metadata?.username||'Aangemeld')+' · '+accountSummaryText():
    'Je gebruikt de app lokaal op dit toestel.';
  if($('account').hidden)return;
  $('account-setup').hidden=!!accountConfig;
  $('account-signin').hidden=!!accountUser||!accountConfig;
  $('account-signed-in').hidden=!accountUser;
  $('account-reset').hidden=!accountUser||!accountRecovery;
  $('account-name').textContent=accountUser?.username||accountUser?.user_metadata?.username||'Mijn account';
  $('account-sync-state').textContent=accountSummaryText();
  $('account-sync-detail').textContent=accountInfo?.error||accountError||
    (accountInfo?.lastSuccess?'Laatste synchronisatie: '+new Date(accountInfo.lastSuccess).toLocaleString('nl-BE'):'');
  const names={product:'Product',meal:'Maaltijd',set:'Trainingsset',event:'Agendasessie',meta:'Instelling',wearable:'Polar-meting',checkin:'Herstelcheck-in',note:'Notitie',profile:'Profiel',body:'Lichaamsmeting'};
  $('account-conflicts').innerHTML=(accountInfo?.conflicts||[]).map((conflict,index)=>
    '<article class="notice"><strong>'+escapeHTML(names[conflict.collection]||conflict.collection)+' · '+escapeHTML(conflict.scope||conflict.id)+'</strong>'+
    '<p class="small">Dit item is ook op een ander toestel gewijzigd. Beide versies blijven beschikbaar totdat je kiest.</p>'+
    '<div class="conflict-versions"><div><b>Dit toestel</b><pre id="local-conflict-'+index+'"></pre></div><div><b>Online</b><pre>'+escapeHTML(JSON.stringify(conflict.remote?.deleted?'Verwijderd':conflict.remote?.value??'Geen online item',null,2))+'</pre></div></div>'+
    '<div class="actions"><button class="btn small" type="button" data-resolve="'+index+'" data-version="local">Versie van dit toestel bewaren</button>'+
    '<button class="btn small" type="button" data-resolve="'+index+'" data-version="cloud">Online versie gebruiken</button></div></article>').join('');
  if(accountUser&&database?.accountId){
    const owner=database;
    void owner.read().then(rows=>{
      if(owner!==database)return;
      const records=new Map(rows.map(row=>[JSON.stringify([row.collection,row.scope,row.id]),row]));
      for(const [i,item] of (accountInfo?.conflicts||[]).entries()){
        const target=$('local-conflict-'+i);
        if(target)target.textContent=JSON.stringify(records.get(JSON.stringify([item.collection,item.scope,item.id]))?.value??'Verwijderd',null,2);
      }
    }).catch(()=>{});
  }
}
function cloudStatus(info){
  accountInfo=info;renderAccount();renderToday();
}
async function accountCredentials(userId){
  if(!accountClient||accountUser?.id!==userId)return null;
  const {data,error}=await accountClient.auth.getSession();
  if(error||data.session?.user.id!==userId||accountUser?.id!==userId)return null;
  return {...accountConfig,token:data.session.access_token};
}
async function switchAccount(session,event){
  const user=session?.user??null;
  if(event==='PASSWORD_RECOVERY')accountRecovery=true;
  if(user?.id===accountUser?.id){
    if(user)accountUser={...accountUser,...user};renderAccount();
    if(readyToRender&&event==='PASSWORD_RECOVERY')showTab('account');
    return;
  }
  const previous=database;
  if(readyToRender)$('main').inert=true;
  while(pendingWrites)await new Promise(resolve=>setTimeout(resolve,25));
  storageGeneration++;
  accountUser=user;accountInfo=null;accountError='';
  let next;
  try{
    if(user){
      next=await AthleteCloudStore.open({userId:user.id,project:accountConfig.project,credentials:accountCredentials,
        onChanged:requestSync,onStatus:info=>{if(accountUser?.id===user.id)cloudStatus(info);}});
    }else{
      next=await AthleteStorage.open(()=>recordsFromState(readLegacy()),requestSync);
      accountRecovery=false;
    }
    previous?.close?.();database=next;storageFailed=false;
    state=stateFromRecords(next.initial);delete next.initial;
    if(readyToRender){loadStateViews();$('main').inert=false;}
    if(user){
      void next.sync();
      void accountClient.from('profiles').select('username').eq('id',user.id).single().then(({data})=>{
        if(data&&accountUser?.id===user.id){accountUser.username=data.username;renderAccount();renderToday();}
      }).catch(()=>{});
    }
  }catch(error){
    accountError='Accountopslag kon niet worden geopend. Herlaad de app.';
    // Toon bij een mislukte wissel geen gegevens van het vorige account.
    database=undefined;state=emptyState();previous?.close?.();
    if(readyToRender){loadStateViews();$('main').inert=false;}
  }
  renderAccount();renderToday();
  if(readyToRender&&event==='PASSWORD_RECOVERY')showTab('account');
}
function queueAccount(session,event){
  accountSwitch=accountSwitch.then(()=>switchAccount(session,event)).catch(()=>{
    accountError='Account wisselen mislukt. Herlaad de app.';renderAccount();
  });
  return accountSwitch;
}
function accountMessage(text){setStatus('account-message',text);}
async function initAccounts(){
  try{accountConfig=configuredCloud();}catch(error){accountError=error.message;accountMessage(error.message);}
  if(!accountConfig){accountReady=true;renderAccount();return;}
  accountStorageKey='athlete-hub:auth:'+accountConfig.project;
  accountClient=supabase.createClient(accountConfig.url,accountConfig.key,{
    auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:accountStorageKey},
  });
  let cached=null;
  try{cached=JSON.parse(localStorage.getItem(accountStorageKey)||'null');}catch{}
  if(!navigator.onLine&&cached?.user?.id)await queueAccount(cached,'INITIAL_SESSION');
  accountClient.auth.onAuthStateChange((event,session)=>{
    // Buiten de Auth-callback draaien, zodat getSession de SDK-lock kan gebruiken.
    if(!navigator.onLine&&!session&&accountUser&&['INITIAL_SESSION','SIGNED_OUT'].includes(event))return;
    setTimeout(()=>void queueAccount(session,event),0);
  });
  if(navigator.onLine){
    try{
      const {data,error}=await Promise.race([accountClient.auth.getSession(),new Promise((_,reject)=>setTimeout(()=>reject(Error('timeout')),8000))]);
      if(error)throw error;
      await queueAccount(data.session,'INITIAL_SESSION');
    }catch{
      accountError='Je account kon nog niet worden gecontroleerd. Controleer je verbinding.';
      if(cached?.user?.id)await queueAccount(cached,'INITIAL_SESSION');
    }
  }
  accountReady=true;renderAccount();
}
async function runAccountAction(form,action){
  const button=form.querySelector('button[type=submit]');button.disabled=true;accountMessage('Even wachten…');
  try{await action();}catch(error){accountMessage(error.message||'Dit lukte niet. Probeer opnieuw.');}
  finally{button.disabled=false;for(const input of form.querySelectorAll('input[type=password]'))input.value='';}
}
async function registrationReady(){
  const response=await fetch(accountConfig.url+'/rest/v1/profiles?select=id&limit=0',{
    headers:{apikey:accountConfig.key},signal:AbortSignal.timeout(10000),
  });
  const data=await response.json();
  // Een anonieme gebruiker hoort geen toegang tot profielen te hebben. Deze
  // controle voorkomt registratie vóór het aanmaken van de signup-trigger.
  if(!response.ok&&!([401,403].includes(response.status)&&data.code==='42501'))
    throw Error('Accounts worden nog ingesteld. Probeer het later opnieuw.');
}
function initAccountControls(){
  const login=$('account-login-form'),register=$('account-register-form'),reset=$('account-password-form');
  login.addEventListener('submit',event=>{
    event.preventDefault();if(!accountClient)return;
    void runAccountAction(login,async()=>{
      const identifier=value(login,'identifier').trim(),password=value(login,'password');
      let result;
      if(identifier.includes('@'))result=await accountClient.auth.signInWithPassword({email:identifier,password});
      else{
        const response=await fetch(accountConfig.url+'/functions/v1/username-login',{
          method:'POST',signal:AbortSignal.timeout(20000),headers:{apikey:accountConfig.key,'Content-Type':'application/json'},
          body:JSON.stringify({username:identifier.toLowerCase(),password}),
        });
        const data=await response.json();
        if(!response.ok)throw Error(response.status===404?'Aanmelden met gebruikersnaam is nog niet beschikbaar. Gebruik je e-mail.':data.error||'Aanmelden mislukt.');
        result=await accountClient.auth.setSession(data);
      }
      if(result.error)throw Error('Aanmelden mislukt. Controleer je gegevens en bevestig je e-mail.');
      accountClient.auth.startAutoRefresh();
      await queueAccount(result.data.session,'SIGNED_IN');accountMessage('Aangemeld. Je gegevens worden gesynchroniseerd.');
    });
  });
  register.addEventListener('submit',event=>{
    event.preventDefault();if(!accountClient)return;
    void runAccountAction(register,async()=>{
      const password=value(register,'password');
      if(password!==value(register,'repeat'))throw Error('De wachtwoorden komen niet overeen.');
      await registrationReady();
      const result=await accountClient.auth.signUp({email:value(register,'email').trim(),password,
        options:{data:{username:value(register,'username').trim().toLowerCase()},emailRedirectTo:new URL('./',location.href).href}});
      if(result.error)throw Error('Registreren mislukt. Probeer een andere gebruikersnaam en controleer je e-mail en wachtwoord.');
      if(result.data.session)await queueAccount(result.data.session,'SIGNED_IN');
      accountMessage('Registratie verwerkt. Controleer je e-mail om je account te bevestigen en meld je daarna aan.');
    });
  });
  $('account-forgot-form').addEventListener('submit',event=>{
    event.preventDefault();const form=event.target;if(!accountClient)return;
    void runAccountAction(form,async()=>{
      const {error}=await accountClient.auth.resetPasswordForEmail(value(form,'email').trim(),{redirectTo:new URL('./',location.href).href});
      if(error)throw Error('Herstel aanvragen mislukt. Probeer later opnieuw.');
      accountMessage('Als dit e-mailadres een account heeft, ontvang je een herstellink.');
    });
  });
  reset.addEventListener('submit',event=>{
    event.preventDefault();if(!accountClient)return;
    void runAccountAction(reset,async()=>{
      if(value(reset,'password')!==value(reset,'repeat'))throw Error('De wachtwoorden komen niet overeen.');
      const {error}=await accountClient.auth.updateUser({password:value(reset,'password')});
      if(error)throw Error('Wachtwoord wijzigen mislukt. Open eventueel een nieuwe herstellink.');
      accountRecovery=false;renderAccount();accountMessage('Je wachtwoord is gewijzigd.');
    });
  });
  $('account-signout').addEventListener('click',async()=>{
    if(!accountClient)return;
    const {error}=await accountClient.auth.signOut({scope:'local'});
    if(error){accountClient.auth.stopAutoRefresh();localStorage.removeItem(accountStorageKey);}
    await queueAccount(null,'SIGNED_OUT');
    accountMessage('Afgemeld op dit toestel. Eventuele niet-verzonden wijzigingen blijven in de cache van je account.');
  });
  $('account-sync').addEventListener('click',()=>void database?.sync?.());
  $('account-import-local').addEventListener('click',async()=>{
    if(!database?.accountId||!$('account-confirm-local').checked){accountMessage('Bevestig eerst dat de lokale gegevens van jou zijn.');return;}
    const owner=database;let guest;
    try{
      guest=await AthleteStorage.open(()=>recordsFromState(readLegacy()),()=>{});
      const existing=new Set((await owner.read()).map(row=>JSON.stringify([row.collection,row.scope,row.id])));
      const additions=guest.initial.filter(row=>!existing.has(JSON.stringify([row.collection,row.scope,row.id])));
      if(owner!==database)throw Error('Het account is ondertussen gewijzigd.');
      await owner.write(additions);accountMessage(additions.length+' lokale items toegevoegd. Bestaande accountitems zijn behouden.');
      $('account-confirm-local').checked=false;
    }catch(error){accountMessage(error.message||'Overnemen mislukt.');}finally{guest?.close?.();}
  });
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-resolve]');if(!button||!database?.accountId)return;
    const conflict=accountInfo?.conflicts[Number(button.dataset.resolve)];if(!conflict)return;
    void database.resolveConflict([conflict.collection,conflict.scope,conflict.id],button.dataset.version);
  });
  const synchronize=()=>{if(!document.hidden)void database?.sync?.();};
  setInterval(synchronize,30000);window.addEventListener('focus',synchronize);
  window.addEventListener('online',synchronize);document.addEventListener('visibilitychange',synchronize);
}
