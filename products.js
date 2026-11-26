'use strict';

const PRODUCT_STATUSES = {regular:'Koop ik',try:'Wil ik proberen'};
let productForm;
let editingProduct = null;
let foodProductContext = {};

function validBarcode(code) {
  return code === '' || /^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(code);
}

function cleanProduct(product) {
  if (!product || typeof product.id!=='string' || !product.id || product.id.length>150 ||
      typeof product.name!=='string' || !product.name.trim() || product.name.length>100 ||
      !['g','ml'].includes(product.unit) || !Object.hasOwn(PRODUCT_STATUSES,product.status)) return null;
  const barcode=String(product.barcode??'').trim();
  if (!validBarcode(barcode) || !bounded(product.kcal,0,30000) ||
      ![product.p,product.c,product.f].every(n=>bounded(n,0,10000))) return null;
  return {
    id:product.id,name:product.name.trim(),brand:String(product.brand??'').trim().slice(0,80),
    shop:String(product.shop??'').trim().slice(0,100),barcode,unit:product.unit,status:product.status,
    kcal:product.kcal,p:product.p,c:product.c,f:product.f,source:String(product.source??'Handmatig').slice(0,120),
  };
}

function personalProducts() {
  return Object.values(state.products).sort((a,b)=>a.name.localeCompare(b.name,'nl-BE') || a.brand.localeCompare(b.brand,'nl-BE'));
}

function renderProducts() {
  if ($('food').hidden) return;
  const products=personalProducts();
  const selection=$('personal-product').value;
  $('personal-product').innerHTML='<option value="">Kies een bewaard product</option>'+products.map(product=>
    '<option value="'+escapeHTML(product.id)+'">'+escapeHTML(product.name+(product.brand?' · '+product.brand:''))+'</option>').join('');
  if (products.some(product=>product.id===selection)) $('personal-product').value=selection;
  const query=$('product-search').value.trim().toLocaleLowerCase('nl-BE'), status=$('product-filter').value;
  const matches=products.filter(product=>(!status||status===product.status) &&
    [product.name,product.brand,product.shop,product.barcode].some(text=>text.toLocaleLowerCase('nl-BE').includes(query)));
  $('product-count').textContent=matches.length+' van '+products.length+' '+(products.length===1?'product':'producten');
  $('product-list').innerHTML=matches.map(product=>{
    const id=escapeHTML(product.id);
    return '<div class="entry product-entry"><div><strong>'+escapeHTML(product.name)+'</strong>'+
      '<small>'+escapeHTML([product.brand,product.shop,PRODUCT_STATUSES[product.status]].filter(Boolean).join(' · '))+'</small>'+
      '<small>Per 100 '+product.unit+' · '+entryMacros(product)+'</small>'+
      (product.barcode?'<small>Barcode '+escapeHTML(product.barcode)+'</small>':'')+
      (product.source.startsWith('Open Food Facts')?'<small><a href="https://world.openfoodfacts.org/product/'+product.barcode+'">Open Food Facts</a> · controleer het etiket</small>':'')+
      '</div><div class="actions"><button class="btn small primary" type="button" data-product-use="'+id+'">Portie loggen</button>'+
      '<button class="btn small" type="button" data-product-edit="'+id+'">Wijzig</button>'+
      '<button class="btn small danger" type="button" data-product-delete="'+id+'">Wis</button></div></div>';
  }).join('') || '<p class="muted small">'+(products.length?'Geen producten gevonden.':'Bewaar je eerste product via het etiket of de barcodezoekfunctie.')+'</p>';
}

function resetProductEditor() {
  editingProduct=null;
  productForm.reset();
  $('product-save').textContent='Product bewaren';
  $('product-cancel').hidden=true;
  setStatus('product-status','');
}

function openProductEditor(product) {
  resetProductEditor();
  editingProduct=product?.id??null;
  if (product) for (const name of ['name','brand','barcode','unit','shop','status','kcal','p','c','f']) {
    field(productForm,name).value=product[name]??'';
  }
  productForm.dataset.source=product?.source??'Handmatig';
  $('product-save').textContent=editingProduct?'Wijziging bewaren':'Product bewaren';
  $('product-cancel').hidden=!product;
  $('product-editor').open=true;
  focusInput(field(productForm,'name'));
}

function usePersonalProduct(id) {
  const product=state.products[id];
  if (!product) return;
  // Start a new entry when the user selects a saved product during an existing edit.
  resetFoodForm();
  foodMode('manual');
  setFoodFields({...product,basis:100,savedProductId:product.id,source:'Mijn producten · '+product.name});
  $('personal-product').value=id;
  setStatus('food-status','Vul je portie in '+product.unit+' in voor '+fmtDate(foodDay)+'.');
  focusInput(field(foodForm,'amount'));
}

function setFoodProductContext(entry) {
  foodProductContext={
    id:entry.savedProductId??null,brand:entry.brand??'',shop:entry.shop??'',unit:entry.unit??'g',
    barcode:entry.barcode??entry.source?.match(/^Open Food Facts · (\d{8,14})$/)?.[1]??'',
  };
}

function saveFoodAsProduct() {
  const name=value(foodForm,'name').trim();
  const macros=Object.fromEntries(totalsKeys.map(key=>[key,number(foodForm,key)]));
  if (!name || totalsKeys.some(key=>macros[key]===null || !bounded(macros[key],0,key==='kcal'?30000:10000))) {
    setStatus('food-status','Vul productnaam en voedingswaarden in om het product te bewaren.');
    return;
  }
  if (value(foodForm,'basis')==='portion') {
    const amount=number(foodForm,'amount');
    if (!bounded(amount,.1,10000)) {
      setStatus('food-status','Vul de portie in gram of ml in om de waarden per 100 te berekenen.');
      return;
    }
    for (const key of totalsKeys) macros[key]=Math.round(macros[key]/amount*100*100)/100;
  }
  const saved=state.products[foodProductContext.id] ??
    Object.values(state.products).find(product=>foodProductContext.barcode && product.barcode===foodProductContext.barcode);
  openProductEditor({
    ...foodProductContext,id:saved?.id,brand:foodProductContext.brand||saved?.brand,
    shop:foodProductContext.shop||saved?.shop,status:saved?.status??'regular',
    name,...macros,source:sourceLabel||'Handmatig',
  });
  setStatus('product-status','Controleer de waarden per 100 '+value(productForm,'unit')+' en bewaar het product.');
}

function initProducts() {
  productForm=$('product-form');
  $('product-search').addEventListener('input',renderProducts);
  $('product-filter').addEventListener('change',renderProducts);
  $('personal-product').addEventListener('change',event=>usePersonalProduct(event.target.value));
  $('food-save-product').addEventListener('click',saveFoodAsProduct);
  $('product-new').addEventListener('click',()=>openProductEditor());
  $('product-cancel').addEventListener('click',()=>{
    resetProductEditor();
    $('product-editor').open=false;
  });
  $('open-products').addEventListener('click',()=>focusInput($('product-search')));
  $('product-via-barcode').addEventListener('click',()=>{
    foodMode('barcode');
    focusInput($('barcode-value'));
  });
  productForm.addEventListener('submit',event=>{
    event.preventDefault();
    const previous=editingProduct?state.products[editingProduct]:null;
    if (editingProduct&&!previous) {
      setStatus('product-status','Dit product werd elders gewist. Open een nieuw product om het opnieuw toe te voegen.');
      return;
    }
    const barcode=value(productForm,'barcode').trim();
    const existing=personalProducts().find(product=>barcode && product.barcode===barcode && product.id!==editingProduct);
    if (existing) {
      setStatus('product-status','Deze barcode staat al bij '+existing.name+'. Wijzig het bestaande product.');
      return;
    }
    const product=cleanProduct({
      id:editingProduct??uid(),...Object.fromEntries(['name','brand','barcode','unit','shop','status'].map(key=>[key,value(productForm,key)])),
      ...Object.fromEntries(totalsKeys.map(key=>[key,number(productForm,key)])),
      source:productForm.dataset.source||'Handmatig',
    });
    if (!product) {setStatus('product-status','Controleer de naam, barcode en voedingswaarden.');return;}
    state.products[product.id]=product;
    resetProductEditor();
    $('product-editor').open=false;
    saveStatus('products-status',previous?'Product bijgewerkt.':'Product bewaard.',storeItem('product',product.id,product));
    renderProducts();
    $('product-new').focus({preventScroll:true});
  });
  $('product-list').addEventListener('click',event=>{
    const data=event.target.closest('button')?.dataset;
    if (!data) return;
    if (data.productUse) usePersonalProduct(data.productUse);
    if (data.productEdit) openProductEditor(state.products[data.productEdit]);
    if (data.productDelete&&window.confirm('Dit product uit je lijst wissen? Je gelogde maaltijden blijven bewaard.')) {
      delete state.products[data.productDelete];
      if (editingProduct===data.productDelete) resetProductEditor();
      saveStatus('products-status','Product gewist.',removeItem('product',data.productDelete));
      renderProducts();
    }
  });
}
