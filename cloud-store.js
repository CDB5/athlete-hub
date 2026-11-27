'use strict';

// Lokale cache + outbox per account. Alle netwerkrequests gebruiken een token
// dat aan dit account is gebonden, ook als ondertussen iemand anders inlogt.
window.AthleteCloudStore = (() => {
  const stores=['items','pending','remote','conflicts'];
  const key=row=>[row.collection,row.scope||'',row.id];
  const keyText=row=>JSON.stringify(key(row));
  const uuid=()=>crypto.randomUUID();
  const localRecord=row=>({collection:row.collection,scope:row.scope||'',id:row.id,value:row.value,
    ...(Number.isFinite(row.item_order)?{order:row.item_order}:{})});
  function transaction(db,names,mode,work){
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(names,mode);let result;
      tx.oncomplete=()=>resolve(result);
      tx.onabort=()=>reject(tx.error||Error('Lokale accountopslag onderbroken.'));
      try{work(Object.fromEntries(names.map(name=>[name,tx.objectStore(name)])),value=>{result=value;});}
      catch(error){tx.abort();reject(error);}
    });
  }
  const readAll=(db,name)=>transaction(db,[name],'readonly',(s,done)=>{s[name].getAll().onsuccess=e=>done(e.target.result);});

  async function open({userId,project,credentials,onChanged,onStatus}){
    if(!/^[0-9a-f-]{36}$/i.test(userId))throw Error('Ongeldig account.');
    const name='athlete-hub-account:'+project+':'+userId;
    const db=await new Promise((resolve,reject)=>{
      const request=indexedDB.open(name,1);
      request.onupgradeneeded=()=>stores.forEach(store=>request.result.createObjectStore(store,{keyPath:['collection','scope','id']}));
      request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
    });
    let closed=false,running=null,timer=null,lastSuccess=null,lastError='';
    const channel=typeof BroadcastChannel==='function'?new BroadcastChannel(name):null;
    const signal=()=>{if(closed)return;channel?.postMessage(true);onChanged();void status().then(onStatus).catch(()=>{});};
    if(channel)channel.onmessage=()=>{if(!closed){onChanged();void status().then(onStatus).catch(()=>{});}};
    db.onversionchange=()=>close();

    async function status(){
      if(closed)return {pending:0,conflicts:[],busy:false,error:'',lastSuccess};
      const [pending,conflicts]=await Promise.all([readAll(db,'pending'),readAll(db,'conflicts')]);
      return {pending:pending.length,conflicts,busy:!!running,error:lastError,lastSuccess};
    }
    function schedule(){
      if(closed)return;
      clearTimeout(timer);timer=setTimeout(()=>void sync(),500);
    }
    function queue(s,change){
      const record={...change,scope:change.scope||''};
      s.pending.get(key(record)).onsuccess=e=>{
        const pending=e.target.result;
        s.remote.get(key(record)).onsuccess=event=>{
          const baseVersion=pending?pending.baseVersion:event.target.result?.version??null;
          s.pending.put({...record,baseVersion,mutationId:uuid()});
          if(record.deleted)s.items.delete(key(record));else s.items.put(record);
        };
      };
    }
    async function write(changes){
      if(closed)throw Error('Dit account is afgesloten.');
      await transaction(db,stores,'readwrite',s=>changes.forEach(change=>queue(s,change)));
      signal();schedule();
    }
    async function replace(rows){
      if(closed)throw Error('Dit account is afgesloten.');
      await transaction(db,stores,'readwrite',s=>{
        s.items.getAll().onsuccess=e=>{
          const old=new Map(e.target.result.map(row=>[keyText(row),row]));
          for(const row of rows){
            const before=old.get(keyText(row));
            if(!before||JSON.stringify([before.value,before.order])!==JSON.stringify([row.value,row.order]))queue(s,row);
            old.delete(keyText(row));
          }
          for(const row of old.values())queue(s,{collection:row.collection,scope:row.scope,id:row.id,deleted:true});
        };
      });
      signal();schedule();
    }
    async function request(path,body){
      const config=await credentials(userId);
      if(closed||!config)throw Error('Meld je opnieuw aan om te synchroniseren.');
      const response=await fetch(config.url+'/rest/v1/'+path,{
        method:body===undefined?'GET':'POST',signal:AbortSignal.timeout(20000),
        headers:{apikey:config.key,Authorization:'Bearer '+config.token,'Content-Type':'application/json'},
        ...(body===undefined?{}:{body:JSON.stringify(body)}),
      });
      if(!response.ok)throw Error(response.status===401?'Meld je opnieuw aan om te synchroniseren.':
        response.status===404?'De SQL-databank is nog niet ingesteld.':'Synchroniseren mislukt. Je wijzigingen blijven lokaal bewaard.');
      return response.json();
    }
    async function accept(entries,sent=[]){
      if(closed)return;
      const sentByKey=new Map(sent.map(row=>[keyText(row),row]));
      await transaction(db,stores,'readwrite',s=>{
        for(const entry of entries){
          const remote=entry.record;
          const recordKey=remote?.collection?key(remote):entry.key;
          if(!recordKey)continue;
          const stamp={collection:recordKey[0],scope:recordKey[1],id:recordKey[2]};
          if(remote?.version)s.remote.put({...remote,...stamp});
          else s.remote.delete(recordKey);
          s.pending.get(recordKey).onsuccess=e=>{
            const pending=e.target.result;
            const sentItem=sentByKey.get(JSON.stringify(recordKey));
            if(pending&&remote?.mutation_id===pending.mutationId){
              s.pending.delete(recordKey);s.conflicts.delete(recordKey);
            }else if(pending&&sentItem&&remote?.mutation_id===sentItem.mutationId&&pending.baseVersion===sentItem.baseVersion){
              s.pending.put({...pending,baseVersion:remote.version});s.conflicts.delete(recordKey);
              return; // Een nieuwe lokale wijziging blijft zichtbaar en in de outbox.
            }else if(pending){
              if(pending.baseVersion!==(remote?.version??null))s.conflicts.put({...stamp,remote:remote?.version?remote:null});
              else s.conflicts.delete(recordKey);
              return;
            }
            s.conflicts.delete(recordKey);
            if(!remote||remote.deleted)s.items.delete(recordKey);else s.items.put(localRecord(remote));
          };
        }
      });
      signal();
    }
    async function performSync(){
      const conflicts=new Set((await readAll(db,'conflicts')).map(keyText));
      const outbox=(await readAll(db,'pending')).filter(row=>!conflicts.has(keyText(row)));
      for(let start=0;start<outbox.length;start+=250){
        if(closed)return;
        const sent=outbox.slice(start,start+250);
        const result=await request('rpc/apply_athlete_changes',{changes:sent});
        await accept(result,sent);
      }
      // Volledige, gesorteerde herlezing: geen gemiste commits door een tijdcursor.
      for(let offset=0;!closed;offset+=1000){
        if(offset>=50000)throw Error('Het account is te groot voor deze synchronisatie. Neem contact op via GitHub Issues.');
        const rows=await request('athlete_records?select=collection,scope,id,value,item_order,deleted,version,mutation_id,updated_at&user_id=eq.'+
          encodeURIComponent(userId)+'&order=collection.asc,scope.asc,id.asc&limit=1000&offset='+offset);
        await accept(rows.map(record=>({record})));
        if(rows.length<1000)break;
      }
      lastSuccess=new Date().toISOString();lastError='';
    }
    function sync(){
      if(closed||!navigator.onLine)return Promise.resolve();
      if(running)return running;
      running=(async()=>{
        try{
          if(navigator.locks)await navigator.locks.request(name,async()=>{if(!closed)await performSync();});
          else await performSync();
        }catch(error){lastError=error.message||'Synchroniseren mislukt. Je wijzigingen blijven lokaal bewaard.';}
        finally{
          running=null;
          if(!closed){
            const info=await status();onStatus(info);
            if(!lastError&&info.pending>info.conflicts.length)schedule();
          }
        }
      })();
      void status().then(onStatus).catch(()=>{});
      return running;
    }
    async function resolveConflict(recordKey,choice){
      await transaction(db,stores,'readwrite',s=>{
        s.conflicts.get(recordKey).onsuccess=e=>{
          const conflict=e.target.result;if(!conflict)return;
          if(choice==='cloud'){
            s.pending.delete(recordKey);
            if(conflict.remote&&!conflict.remote.deleted)s.items.put(localRecord(conflict.remote));else s.items.delete(recordKey);
          }else if(choice==='local'){
            s.pending.get(recordKey).onsuccess=event=>{
              if(event.target.result)s.pending.put({...event.target.result,baseVersion:conflict.remote?.version??null,mutationId:uuid()});
            };
          }
          s.conflicts.delete(recordKey);
        };
      });
      signal();schedule();
    }
    function close(){
      if(closed)return;closed=true;clearTimeout(timer);channel?.close();db.close();
    }
    return {accountId:userId,initial:await readAll(db,'items'),read:()=>readAll(db,'items'),write,replace,
      status,sync,resolveConflict,close};
  }
  return {open};
})();
