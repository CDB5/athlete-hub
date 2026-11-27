import { createClient } from 'npm:@supabase/supabase-js@2.119.2';

const url = Deno.env.get('SUPABASE_URL')!;
// Supabase bewaart dit uitsluitend in de functieomgeving, nooit in de website.
const secret = Deno.env.get('ATHLETE_SECRET_KEY') ||
  JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}')['default'] || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const origins = (Deno.env.get('ALLOWED_ORIGINS') || 'https://cdb5.github.io').split(',').map(s=>s.trim());
const admin = createClient(url, secret, {auth:{persistSession:false,autoRefreshToken:false}});
const hash = async (text:string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))))
  .map(n=>n.toString(16).padStart(2,'0')).join('');

Deno.serve(async request => {
  const origin=request.headers.get('origin') || '';
  const headers={
    'Access-Control-Allow-Origin':origins.includes(origin)?origin:origins[0],
    'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin',
    'Content-Type':'application/json','Cache-Control':'no-store',
  };
  const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
  if(origin&&!origins.includes(origin))return reply({error:'Dit webadres is niet toegestaan.'},403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(request.method!=='POST')return reply({error:'Gebruik POST.'},405);
  try{
    const raw=await request.text();
    if(raw.length>6000)return reply({error:'Ongeldige invoer.'},400);
    const {username,password}=JSON.parse(raw);
    if(typeof username!=='string'||!/^[a-z0-9_]{3,24}$/i.test(username)||typeof password!=='string'||password.length>256)
      return reply({error:'Controleer je gebruikersnaam en wachtwoord.'},400);
    const normalized=username.toLowerCase();
    // De Supabase-gateway geeft de oorspronkelijke IP-informatie door.
    const ip=request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const [ipLimit,userLimit]=await Promise.all([
      admin.rpc('consume_athlete_login',{bucket_key:await hash('ip:'+ip),max_attempts:100}),
      admin.rpc('consume_athlete_login',{bucket_key:await hash('user:'+ip+':'+normalized),max_attempts:10}),
    ]);
    if(ipLimit.error||userLimit.error)return reply({error:'Aanmelden is tijdelijk niet beschikbaar.'},503);
    if(!ipLimit.data||!userLimit.data)return reply({error:'Te veel pogingen. Probeer over 15 minuten opnieuw.'},429);
    const lookup=await admin.rpc('athlete_login_email',{login_username:normalized});
    if(lookup.error)return reply({error:'Aanmelden is tijdelijk niet beschikbaar.'},503);
    const email=lookup.data || 'unknown-'+await hash(normalized)+'@example.invalid';
    // De Auth-server verifieert het wachtwoord. Er wordt geen eigen wachtwoordtabel gemaakt.
    const login=await fetch(url+'/auth/v1/token?grant_type=password',{
      method:'POST',signal:AbortSignal.timeout(15000),headers:{apikey:secret,'Content-Type':'application/json'},
      body:JSON.stringify({email,password}),
    });
    const data=await login.json();
    if(!login.ok||!lookup.data)return reply({error:'Gebruikersnaam of wachtwoord onjuist, of bevestig eerst je e-mail.'},401);
    return reply({access_token:data.access_token,refresh_token:data.refresh_token});
  }catch{
    // Geen requestbody, wachtwoord, token of e-mailadres in de logs.
    return reply({error:'Aanmelden is tijdelijk niet beschikbaar.'},503);
  }
});
