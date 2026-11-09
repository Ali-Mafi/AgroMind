// Disposable SQL-fixture rehearsal. This does not run Supabase Auth/PostgREST.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { randomUUID, randomBytes } from 'node:crypto';
import EmbeddedPostgres from 'embedded-postgres';
import { PGlite } from '@electric-sql/pglite';

const native = process.env.AGROMIND_TEST_DATABASE_ENGINE === 'native';
const passwordFile = '20261107161451_password_reset_authorization.sql';
const usernameFile = '20261107162535_username_single_use_authorization.sql';
const manifests = new Map();
async function fixture() {
  let postgres, db, directory;
  if (native) {
    directory = await mkdtemp(path.join(tmpdir(), 'agromind-integration-'));
    const server = net.createServer();
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    await new Promise(resolve => server.close(resolve));
    postgres = new EmbeddedPostgres({ databaseDir: path.join(directory, 'database'), port,
      user: 'postgres', password: randomBytes(24).toString('hex'), persistent: false, onLog() {}, onError() {} });
    await postgres.initialise(); await postgres.start();
    db = postgres.getPgClient(); await db.connect();
  } else { db = new PGlite(); await db.waitReady; }
  return {
    query: (sql, params = []) => db.query(sql, params),
    exec: sql => native ? db.query(sql) : db.exec(sql),
    async close() { if (native) { await db.end(); await postgres.stop(); await rm(directory, {recursive:true,force:true}); } else await db.close(); },
  };
}
async function seedSchema(db) {
  await db.exec(`create role anon nologin; create role authenticated nologin; create role service_role nologin;
    create schema auth;
    create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb not null default '{}',email_confirmed_at timestamptz);
    create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id),created_at timestamptz default now(),not_after timestamptz);
    create table auth.mfa_factors(id uuid primary key,user_id uuid references auth.users(id),status text not null,factor_type text default 'totp');
    create function auth.uid() returns uuid language sql stable as 'select nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';
    create function auth.jwt() returns jsonb language sql stable as 'select coalesce(nullif(current_setting(''request.jwt.claims'',true),''''),''{}'')::jsonb';
    grant usage on schema auth to authenticated,anon;
    grant execute on function auth.uid(),auth.jwt() to authenticated,anon;`);
  for (const name of (await readdir('supabase/migrations')).filter(n => n.endsWith('.sql') && ![passwordFile,usernameFile].includes(n)).sort())
    await db.exec(await readFile(path.join('supabase/migrations',name),'utf8'));
}
async function actor(db, user, sql, params = []) {
  await db.exec('begin; set local role authenticated;');
  try {
    await db.query("select set_config('request.jwt.claim.sub',$1,true)",[user]);
    await db.query("select set_config('request.jwt.claims',$1,true)",[JSON.stringify({sub:user,session_id:user,aal:'aal2',amr:[]})]);
    const result = await db.query(sql,params); await db.exec('commit'); return result;
  } catch(error) { await db.exec('rollback'); throw error; }
}
async function snapshot(db) {
  const result = {};
  for (const table of ['auth.users','auth.sessions','auth.mfa_factors','public.profiles','public.accounts','public.subscriptions','public.farms','public.irrigation_schedules'])
    result[table] = (await db.query(`select to_jsonb(t) as row from ${table} t order by to_jsonb(t)::text`)).rows;
  return result;
}
async function catalog(db) {
  return (await db.query(`select n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) as args,
    pg_get_functiondef(p.oid) as definition,coalesce(p.proacl::text,'') as acl
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname in ('public','private') and (p.proname like 'password_%' or p.proname like 'username_%' or p.proname like 'change_username%')
    order by 1,2,3`)).rows;
}

for (const [label, order] of [['password-first',[passwordFile,usernameFile]],['username-first',[usernameFile,passwordFile]]]) {
  test(`integration SQL fixture: ${label}, seeded data, transition contracts and forward recovery`, {timeout:90000}, async () => {
    const db = await fixture();
    try {
      await seedSchema(db);
      const user=randomUUID(), shortUser=randomUUID(), factor=randomUUID();
      for (const [id,name] of [[user,'ordinary_name'],[shortUser,'old']]) {
        await db.query('insert into auth.users(id,email,raw_user_meta_data,email_confirmed_at) values($1,$2,$3,now())',[id,`${id}@example.test`,JSON.stringify({full_name:'Synthetic acceptance',language:'fa'})]);
        await db.query('insert into auth.sessions(id,user_id) values($1,$1)',[id]);
        await db.query('update public.profiles set username=$1 where id=$2',[name,id]);
      }
      await db.query("insert into auth.mfa_factors values($1,$2,'verified','totp')",[factor,user]);
      await actor(db,user,'select create_farm($1::jsonb)',[JSON.stringify({id:'existing-field',name:'Synthetic field',location:'Synthetic location',area:40000,type:'farm'})]);
      await actor(db,user,'select save_irrigation_schedule($1,$2::jsonb)',['existing-field',JSON.stringify({id:'existing-schedule',revision:1,date:'2027-06-20',time:'08:30',duration:45,timeZone:'Asia/Tehran',createdAt:'2026-09-13T00:00:00.000Z',updatedAt:'2026-09-13T00:00:00.000Z'})]);
      // Baseline protocol: old username client works before its migration.
      assert.equal((await actor(db,user,"select change_username('baseline_name') as name")).rows[0].name,'baseline_name');
      await assert.rejects(db.query('select password_reserve(null,null,null,null,null)'),/does not exist/);
      await assert.rejects(db.query('select change_username_authorized(null,null)'),/does not exist/);
      let passwordPresent=false, usernamePresent=false;
      for (const file of order) {
        const before=await snapshot(db);
        await db.exec(await readFile(path.join('supabase/migrations',file),'utf8'));
        assert.deepEqual(await snapshot(db),before,'forward DDL preserves seeded Auth/profile/account/subscription rows');
        passwordPresent ||= file===passwordFile; usernamePresent ||= file===usernameFile;
        const acl=(await db.query("select has_function_privilege('authenticated','public.change_username(text)','execute') as legacy")).rows[0];
        assert.equal(acl.legacy,!usernamePresent);
        if(usernamePresent) await assert.rejects(actor(db,user,"select change_username('blocked_name')"),/permission denied/);
        else assert.equal((await actor(db,user,"select change_username('transition_name') as name")).rows[0].name,'transition_name');
        if(passwordPresent) {
          for(const role of ['anon','authenticated','service_role']) {
            const allowed=(await db.query("select has_function_privilege($1,'public.password_reserve(uuid,uuid,text,text,text)','execute') as ok",[role])).rows[0].ok;
            assert.equal(allowed,role==='service_role');
          }
        }
        assert.equal((await db.query("select username_available('available_name') as ok")).rows[0].ok,true);
        assert.equal((await db.query('select username from profiles where id=$1',[shortUser])).rows[0].username,'old');
      }
      // Matching new contracts coexist; service attestation below is synthetic.
      const pg=(await db.query("select password_reserve($1,$1,'password_change',$2,null) as g",[shortUser,'a'.repeat(64)])).rows[0].g;
      const consume=()=>db.query("select password_consume($1,$2,$2,'password_change',$3,'password',null,$4) as ok",[pg.id,shortUser,'a'.repeat(64),'b'.repeat(64)]);
      assert.equal((await consume()).rows[0].ok,true);
      const grant=(await db.query('select username_reserve_grant($1,$1,$2,$3) as id',[user,factor,'integrated_name'])).rows[0].id;
      await db.query('select username_verify_grant($1,$2,$2,$3,$4)',[grant,user,factor,'c'.repeat(64)]);
      assert.equal((await actor(db,user,'select change_username_authorized($1,$2) as name',[grant,' INTEGRATED_NAME '])).rows[0].name,'integrated_name');
      // Containment/forward recovery retains receipts and legacy denial.
      await assert.rejects(consume(),/AUTHORIZATION_REQUIRED/);
      await assert.rejects(actor(db,user,'select change_username_authorized($1,$2)',[grant,'integrated_name']),/FRESH_USERNAME_AUTHORIZATION_REQUIRED/);
      await assert.rejects(actor(db,user,"select change_username('old_app')"),/permission denied/);
      assert.equal((await db.query('select count(*)::int as n from private.username_change_audit where grant_id=$1',[grant])).rows[0].n,1);
      const signup=randomUUID();
      await db.query('insert into auth.users(id,email,raw_user_meta_data,email_confirmed_at) values($1,$2,$3,now())',[signup,`${signup}@example.test`,JSON.stringify({full_name:'Synthetic signup',language:'en'})]);
      assert.equal((await db.query('select count(*)::int as n from profiles where id=$1',[signup])).rows[0].n,1);
      assert.equal((await db.query("select username_available('available_name') as ok")).rows[0].ok,true);
      manifests.set(label,await catalog(db));
    } finally { await db.close(); }
  });
}
test('integration SQL fixture: both migration orders retain identical function definitions and ACLs',()=>{
  assert.equal(manifests.size,2);
  assert.deepEqual(manifests.get('password-first'),manifests.get('username-first'));
});
