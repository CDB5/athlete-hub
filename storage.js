'use strict';

const AthleteStorage = (() => {
  const DATABASE = 'athlete-hub';
  const STORE = 'items';
  const CHANNEL = 'athlete-hub:items';
  const keyOf = ({collection, scope, id}) => [collection, scope, id];
  const item = (collection, id, value, scope = '') => ({collection, scope, id, value});
  const remove = (collection, id, scope = '') => ({collection, scope, id, deleted: true});

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE, {keyPath:['collection','scope','id']});
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('De databank is geblokkeerd door een ander tabblad.'));
    });
  }

  // Keep request callbacks inside their transaction, including the one-time migration.
  function transact(db, mode, work) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, mode);
      let result;
      let failure;
      const finish = value => { result = value; };
      const abort = error => { failure = error; transaction.abort(); };
      transaction.oncomplete = () => resolve(result);
      transaction.onabort = () => reject(failure ?? transaction.error ?? new Error('Opslag onderbroken.'));
      try { work(transaction.objectStore(STORE), finish, abort); }
      catch (error) { abort(error); }
    });
  }

  const migrationMarker = () => item('meta','migrated',true);
  const isMarker = row => row.collection==='meta'&&row.id==='migrated';
  function applyChanges(store, changes) {
    for (const change of changes) {
      if (change.deleted) store.delete(keyOf(change));
      else {
        const {collection,scope,id,value,order} = change;
        store.put({collection,scope,id,value,order});
      }
    }
  }

  async function open(loadLegacy, onChanged) {
    const db = await openDatabase();
    db.onversionchange = () => db.close();
    const initial = await transact(db,'readwrite',(store,finish,abort) => {
      const request = store.getAll();
      request.onsuccess = () => {
        if (request.result.some(isMarker)) {
          finish(request.result.filter(row => !isMarker(row)));
          return;
        }
        try {
          const rows=loadLegacy();
          applyChanges(store,rows);
          store.put(migrationMarker());
          finish(rows);
        } catch (error) { abort(error); }
      };
    });
    const channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel(CHANNEL) : null;
    if (channel) channel.onmessage = () => onChanged();
    else window.addEventListener('storage', event => { if (event.key===CHANNEL) onChanged(); });
    function signal() {
      if (channel) channel.postMessage(true);
      else {
        try { localStorage.setItem(CHANNEL, String(Date.now()) + Math.random()); }
        catch { /* The next focus event still reads the database. */ }
      }
    }

    return {
      initial,
      read: () => transact(db,'readonly',(store,finish) => {
        const request = store.getAll();
        request.onsuccess = () => finish(request.result.filter(row => !isMarker(row)));
      }),
      async write(changes) {
        await transact(db,'readwrite', store => applyChanges(store,changes));
        signal();
      },
      async replace(rows) {
        await transact(db,'readwrite', store => {
          store.clear();
          applyChanges(store,rows);
          store.put(migrationMarker());
        });
        signal();
      },
    };
  }

  return {open,item,remove};
})();

const {item:storeItem,remove:removeItem} = AthleteStorage;
const LEGACY_KEY = 'athlete-hub-v1';
let database;
let latestOrder = 0;
let pendingWrites = 0;
let localChanges = 0;
let syncRequested = false;
let syncRunning = false;
let storageFailed = false;

function storedListItem(collection, value, scope = '', order = value.order) {
  if (!Number.isFinite(order)) {
    latestOrder = Math.max(Date.now()*1000, latestOrder+1);
    order = latestOrder;
  }
  value.order = order;
  return {...storeItem(collection,value.id,value,scope),order};
}

function recordsFromState(data) {
  const rows = [];
  function entries(collection, values, scope = '') {
    for (const [id,value] of Object.entries(values)) rows.push(storeItem(collection,id,value,scope));
  }
  function items(collection, values, scope = '') {
    values.forEach((value,index) => rows.push(storedListItem(collection,{...value},scope,index)));
  }
  if (data.program) rows.push(storeItem('meta','program',data.program));
  for (const [start,block] of Object.entries({...data.blocks,[data.program?.start??LEGACY_START]:data})) {
    entries('done',block.done,start);
    entries('test',block.tests,start);
  }
  for (const [date,values] of Object.entries(data.events)) items('event',values,date);
  for (const [date,values] of Object.entries(data.meals)) items('meal',values,date);
  for (const [date,log] of Object.entries(data.logs)) {
    items('set',log.sets,date);
    if (log.note) rows.push(storeItem('note','free',{note:log.note,title:''},date));
    entries('note',log.sessionNotes??{},date);
  }
  for (const [kind,value] of Object.entries(data.goals)) {
    if (data.goalsDefined[kind]) rows.push(storeItem('goal',kind,value));
  }
  items('body',data.body);
  items('profile',data.profiles);
  items('recipe',data.recipes);
  entries('exercise',data.customExercises);
  entries('checkin',data.checkins);
  entries('freeTest',data.freeTests);
  entries('timeMode',data.timeModes);
  return rows;
}

function stateFromRecords(rows) {
  const data = emptyState();
  const lists = {meal:data.meals,event:data.events};
  const maps = {checkin:data.checkins,exercise:data.customExercises,freeTest:data.freeTests,timeMode:data.timeModes};
  const logFor = date => data.logs[date]??={sets:[],note:'',sessionNotes:{}};
  rows.sort((a,b)=>(a.order??0)-(b.order??0));
  for (const {collection,id,scope,value,order} of rows) {
    if (Number.isFinite(order)) value.order=order;
    if (Object.hasOwn(maps,collection)) maps[collection][id]=value;
    else if (Object.hasOwn(lists,collection)) (lists[collection][scope]??=[]).push(value);
    else if (collection==='set') logFor(scope).sets.push(value);
    else if (collection==='note') {
      const log=logFor(scope);
      if (id==='free') log.note=value.note;
      else log.sessionNotes[id]=value;
    }
    else if (collection==='body') data.body.push(value);
    else if (collection==='profile') data.profiles.push(value);
    else if (collection==='recipe') data.recipes.push(value);
    else if (collection==='goal') {
      data.goals[id]=value;
      data.goalsDefined[id]=true;
    }
    else if (collection==='done'||collection==='test') {
      const block=data.blocks[scope]??={done:{},tests:{}};
      block[collection==='done'?'done':'tests'][id]=value;
    }
    else if (collection==='meta'&&id==='program') data.program=value;
  }
  const start=data.program?.start??LEGACY_START;
  if (data.blocks[start]) {
    ({done:data.done,tests:data.tests}=data.blocks[start]);
    delete data.blocks[start];
  }
  return data;
}

function readLegacy() {
  let saved;
  try { saved=localStorage.getItem(LEGACY_KEY); }
  catch { return emptyState(); }
  return saved?validateState(JSON.parse(saved)):emptyState();
}

async function startStorage() {
  try {
    database = await AthleteStorage.open(() => recordsFromState(readLegacy()), requestSync);
    state = stateFromRecords(database.initial);
    delete database.initial;
  } catch (error) {
    database=undefined;
    try { state=readLegacy(); } catch { console.warn('De bestaande back-up kon niet worden geladen.'); }
    showStorageError(error);
  }
}

function showStorageError(error) {
  $('storage-note').hidden=false;
  console.warn('Athlete Hub opslag:',error);
}

async function saveStatus(id, message, ...changes) {
  localChanges++;
  pendingWrites++;
  if (id) setStatus(id,'Opslaan…');
  try {
    if (!database) throw new Error('IndexedDB is niet beschikbaar.');
    await database.write(changes);
    if (id) setStatus(id,message);
  } catch (error) {
    storageFailed=true;
    showStorageError(error);
    if (id) setStatus(id,'Alleen tijdelijk bewaard. Exporteer eventueel een back-up via Instellingen.');
  } finally {
    pendingWrites--;
    if (syncRequested) requestSync();
  }
}

async function requestSync() {
  syncRequested=true;
  if (!database||syncRunning||pendingWrites||storageFailed||$('main').inert) return;
  syncRunning=true;
  try {
    while (syncRequested&&!pendingWrites&&!$('main').inert) {
      syncRequested=false;
      const version=localChanges;
      const rows=await database.read();
      if (version!==localChanges||pendingWrites||$('main').inert) {
        syncRequested=true;
        continue;
      }
      const oldStart=START;
      const exerciseIds=Object.keys(state.customExercises).join('|');
      state=stateFromRecords(rows);
      if (exerciseIds!==Object.keys(state.customExercises).join('|')) syncExercises(true);
      if (oldStart!==state.program?.start) setProgramDate(false,false);
      refresh();
    }
  } catch (error) {
    showStorageError(error);
  } finally {
    syncRunning=false;
  }
}

async function replaceStoredState(next) {
  if (!database) throw new Error('IndexedDB is niet beschikbaar.');
  localChanges++;
  $('main').inert=true;
  try {
    await database.replace(recordsFromState(next));
    state=stateFromRecords(await database.read());
    storageFailed=false;
    try {
      localStorage.removeItem(LEGACY_KEY);
    } catch { /* The migration marker prevents old data from being imported again. */ }
  } finally {
    $('main').inert=false;
    if (syncRequested) requestSync();
  }
}
