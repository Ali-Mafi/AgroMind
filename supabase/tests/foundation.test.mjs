import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import net from "node:net";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import EmbeddedPostgres from "embedded-postgres";
import { PGlite } from "@electric-sql/pglite";
const native = process.env.AGROMIND_TEST_DATABASE_ENGINE === "native";
let embedded;
function wasmResult(result) {
  return {
    ...result,
    rowCount: result.rows.length || result.affectedRows || 0,
  };
}
function wasmClient(user, level = "aal1", sessionId = user, fresh = false) {
  return {
    connect: async () => {},
    end: async () => {},
    query: async (sql, params = []) => {
      const values = params.map((value) =>
        typeof value === "object" && value !== null
          ? JSON.stringify(value)
          : value,
      );
      if (!user) {
        if (sql.trim() === "set role anon") return { rows: [], rowCount: 0 };
        if (sql.includes("create role anon")) return embedded.exec(sql);
        return wasmResult(await embedded.query(sql, values));
      }
      return embedded.transaction(async (tx) => {
        await tx.exec(
          user === "anon"
            ? "set local role anon"
            : "set local role authenticated",
        );
        if (user !== "anon")
          await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [
            user,
          ]);
        await tx.query("select set_config('request.jwt.claims',$1,true)", [
          JSON.stringify({ sub: user, aal: level, session_id: sessionId, amr: fresh ? [{ method: "totp", timestamp: Math.floor(Date.now()/1000) }] : [] }),
        ]);
        return wasmResult(await tx.query(sql, values));
      });
    },
  };
}
let postgres, admin, directory;
const upgradeUser = randomUUID();
const users = Array.from({ length: 21 }, () => randomUUID());
const farm = (id, extra = {}) => ({
  id,
  name: "Test field",
  location: "Test location",
  area: 40000,
  type: "farm",
  ...extra,
});
const schedule = {
  id: "schedule-1",
  revision: 1,
  date: "2027-06-20",
  time: "08:30",
  duration: 45,
  timeZone: "Asia/Tehran",
  createdAt: "2026-09-13T00:00:00.000Z",
  updatedAt: "2026-09-13T00:00:00.000Z",
};
async function port() {
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const value = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return value;
}
async function asUser(user, level = "aal1", sessionId = user, fresh = false) {
  if (!native) return wasmClient(user, level, sessionId, fresh);
  const client = postgres.getPgClient();
  await client.connect();
  await client.query("set role authenticated");
  await client.query("select set_config('request.jwt.claim.sub',$1,false)", [
    user,
  ]);
  await client.query("select set_config('request.jwt.claims',$1,false)", [
    JSON.stringify({ sub: user, aal: level, session_id: sessionId, amr: fresh ? [{ method: "totp", timestamp: Math.floor(Date.now()/1000) }] : [] }),
  ]);
  return client;
}
async function account(user) {
  return (
    await admin.query("select id from public.accounts where owner_user_id=$1", [
      user,
    ])
  ).rows[0].id;
}
async function create(client, data) {
  return client.query("select public.create_farm($1::jsonb)", [
    JSON.stringify(data),
  ]);
}
before(
  async () => {
    if (native) {
      directory = await mkdtemp(path.join(tmpdir(), "agromind-db-test-"));
      postgres = new EmbeddedPostgres({
        databaseDir: path.join(directory, "database"),
        port: await port(),
        user: "postgres",
        password: randomBytes(24).toString("hex"),
        persistent: false,
        onLog: () => {},
        onError: () => {},
      });
      await postgres.initialise();
      await postgres.start();
      admin = postgres.getPgClient();
      await admin.connect();
    } else {
      embedded = new PGlite();
      await embedded.waitReady;
      admin = wasmClient();
    }
    await admin.query(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin; create schema auth;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb not null default '{}', email_confirmed_at timestamptz);
    create table auth.sessions (id uuid primary key,user_id uuid references auth.users(id),created_at timestamptz default now(),not_after timestamptz,refreshed_at timestamp);
    create function auth.test_session() returns trigger language plpgsql as 'begin insert into auth.sessions(id,user_id) values(new.id,new.id); return new; end';
    create trigger test_session after insert on auth.users for each row execute function auth.test_session();
    create table auth.mfa_factors (id uuid primary key, user_id uuid references auth.users(id), status text not null, factor_type text not null default 'totp');
    create function auth.uid() returns uuid language sql stable as 'select nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';
    create function auth.jwt() returns jsonb language sql stable as 'select coalesce(nullif(current_setting(''request.jwt.claims'',true),''''),''{}'')::jsonb';
    grant usage on schema auth to authenticated,anon;
    grant execute on function auth.uid() to authenticated,anon;
    grant execute on function auth.jwt() to authenticated,anon;
  `);
    for (const file of (await readdir("supabase/migrations"))
      .filter((n) => n.endsWith(".sql"))
      .sort()) {
      if (file.endsWith('_account_security_remediation.sql')) {
        await admin.query("insert into auth.users(id,email,email_confirmed_at) values($1,'upgrade@example.test',now())", [upgradeUser]);
        await admin.query("select security_observe_session($1,$1,'{}','password','aal1')", [upgradeUser]);
        await admin.query("update private.support_outbox set attempts=1,first_attempt_at=now(),lease_until=now()+interval '5 minutes' where recipient_id=$1", [upgradeUser]);
        await admin.query("insert into private.security_denied_sessions(session_id,user_id) values($1,$1)", [upgradeUser]);
      }
      await (native
        ? admin.query(
            await readFile(path.join("supabase/migrations", file), "utf8"),
          )
        : embedded.exec(
            await readFile(path.join("supabase/migrations", file), "utf8"),
          ));
    }
    for (const [index, id] of users.entries())
      await admin.query(
        "insert into auth.users(id,email,raw_user_meta_data,email_confirmed_at) values($1,$2,$3,now())",
        [
          id,
          `user-${index}@example.test`,
          { full_name: "Test user", language: "fa" },
        ],
      );
  },
  { timeout: 60000 },
);
after(async () => {
  await admin?.end();
  await postgres?.stop();
  await embedded?.close();
  if (directory) await rm(directory, { recursive: true, force: true });
});
test("MFA guards privileged RPCs, table access and writes until AAL2", async () => {
  const user = users[10];
  const factor = randomUUID();
  await admin.query("insert into auth.mfa_factors values($1,$2,'verified')", [factor, user]);
  const low = await asUser(user), high = await asUser(user, "aal2");
  const snapshot = { farms: [farm("mfa-import")], schedules: { "mfa-import": schedule } };
  const ids = '["mfa-import"]';
  try {
    assert.deepEqual((await low.query("select get_entitlements() as e")).rows[0].e, {});
    assert.equal((await low.query("select * from profiles")).rowCount, 0);
    await assert.rejects(low.query("select complete_onboarding()"), /MFA_REQUIRED/);
    await assert.rejects(low.query("select import_legacy_data($1,$2)", [snapshot, ids]), /MFA_REQUIRED/);
    await assert.rejects(create(low, farm("mfa-direct")), /row-level security/i);
    assert.equal((await high.query("select * from farms")).rowCount, 0);
    assert.equal((await high.query("select * from legacy_imports")).rowCount, 0);
    assert.equal((await high.query("select get_entitlements() as e")).rows[0].e.max_farms, 3);
    await high.query("select import_legacy_data($1,$2)", [snapshot, ids]);
    await high.query("update profiles set country_code='IR'");
    await high.query("select complete_onboarding()");
    assert.equal((await high.query("select onboarding_completed from profiles")).rows[0].onboarding_completed, true);
    // The existing receipt and populated account must not make AAL1 retries succeed.
    await assert.rejects(low.query("select import_legacy_data($1,$2)", [snapshot, ids]), /MFA_REQUIRED/);
    await assert.rejects(low.query("select complete_onboarding()"), /MFA_REQUIRED/);
    assert.equal((await low.query("select * from farms")).rowCount, 0);
    assert.equal((await low.query("update profiles set full_name='Blocked'")).rowCount, 0);
    assert.equal((await low.query("delete from irrigation_schedules")).rowCount, 0);
    assert.equal((await high.query("select * from irrigation_schedules")).rowCount, 1);
    await admin.query("delete from auth.mfa_factors where id=$1", [factor]);
    assert.equal((await low.query("select get_entitlements() as e")).rows[0].e.max_farms, 3);
  } finally {
    await low.end();
    await high.end();
  }
});

test("new usernames reject short handles while valid handles stay available", async () => {
  const c = await asUser(users[0]);
  try {
    assert.equal(
      (await c.query("select username_available('hello') as available")).rows[0]
        .available,
      false,
    );
    assert.equal(
      (await c.query("select username_available('admin') as available")).rows[0]
        .available,
      false,
    );
    assert.equal(
      (
        await c.query(
          "select username_available('farmer_1384') as available",
        )
      ).rows[0].available,
      true,
    );
  } finally {
    await c.end();
  }
});

test("unverified MFA enrollment does not lock a password-only account", async () => {
  const user = users[11];
  await admin.query("insert into auth.mfa_factors values($1,$2,'unverified')", [randomUUID(), user]);
  const c = await asUser(user);
  try {
    await create(c, farm("unverified-factor"));
    assert.equal((await c.query("select * from farms")).rowCount, 1);
  } finally { await c.end(); }
});

test("signup bootstrap creates a profile, account and data-driven Free subscription", async () => {
  const c = await asUser(users[0]);
  try {
    const profiles = (await c.query("select * from profiles")).rows;
    assert.equal(profiles.length, 1);
    assert.equal(profiles[0].id, users[0]);
    assert.equal(profiles[0].language, "fa");
    assert.equal(profiles[0].onboarding_completed, false);
    assert.equal((await c.query("select * from subscriptions")).rowCount, 1);
    assert.deepEqual(
      (await c.query("select get_entitlements() as e")).rows[0].e,
      {
        max_farms: 3,
        max_sensors: 5,
        max_team_members: 0,
        ai_requests_per_month: 50,
        advanced_irrigation: false,
        automation_access: false,
        advanced_analytics: false,
      },
    );
  } finally {
    await c.end();
  }
});
test("RLS isolates all CRUD operations and rejects cross-owner schedules", async () => {
  const a = await asUser(users[0]),
    b = await asUser(users[1]);
  try {
    await create(a, farm("a-farm"));
    await create(b, farm("b-farm"));
    const aid = await account(users[0]),
      bid = await account(users[1]);
    assert.equal(
      (await b.query("select * from farms where account_id=$1", [aid]))
        .rowCount,
      0,
    );
    await assert.rejects(
      b.query("insert into farms(account_id,id,data) values($1,'stolen',$2)", [
        aid,
        farm("stolen"),
      ]),
      /row-level security/i,
    );
    assert.equal(
      (
        await b.query("update farms set data=$1 where account_id=$2", [
          farm("a-farm", { name: "Hijacked" }),
          aid,
        ])
      ).rowCount,
      0,
    );
    assert.equal(
      (await b.query("delete from farms where account_id=$1", [aid])).rowCount,
      0,
    );
    await a.query("select save_irrigation_schedule('a-farm',$1)", [schedule]);
    assert.equal(
      (await b.query("select * from irrigation_schedules")).rowCount,
      0,
    );
    await assert.rejects(
      b.query(
        "insert into irrigation_schedules(account_id,farm_id,data) values($1,'a-farm',$2)",
        [bid, schedule],
      ),
      /foreign key/i,
    );
    await assert.rejects(
      b.query(
        "insert into irrigation_schedules(account_id,farm_id,data) values($1,'a-farm',$2)",
        [aid, schedule],
      ),
      /row-level security/i,
    );
    assert.equal(
      (
        await b.query(
          "update irrigation_schedules set data=$1 where account_id=$2",
          [schedule, aid],
        )
      ).rowCount,
      0,
    );
    assert.equal(
      (
        await b.query("delete from irrigation_schedules where account_id=$1", [
          aid,
        ])
      ).rowCount,
      0,
    );
  } finally {
    await a.end();
    await b.end();
  }
});
test("farm collaboration enforces seats and role-scoped access without weakening ownership", async () => {
  const ownerId = users[12];
  const managerId = users[13];
  const workerId = users[14];
  const viewerId = users[15];
  const extraId = users[16];
  const owner = await asUser(ownerId);
  const manager = await asUser(managerId);
  const worker = await asUser(workerId);
  const viewer = await asUser(viewerId);
  const extra = await asUser(extraId);

  try {
    await create(owner, farm("shared-a"));
    await create(owner, farm("shared-b"));
    const ownerAccount = await account(ownerId);

    await assert.rejects(
      owner.query("select set_farm_member($1,'shared-a',$2,'viewer')", [
        ownerAccount,
        viewerId,
      ]),
      /TEAM_MEMBER_LIMIT_REACHED/,
    );

    const teamPlan = (
      await admin.query(
        "insert into plans(code,name) values('team-test','Team Test') returning id",
      )
    ).rows[0].id;
    await admin.query(
      "insert into plan_entitlements(plan_id,key,value) values($1,'max_farms','3'::jsonb),($1,'max_team_members','3'::jsonb)",
      [teamPlan],
    );
    await admin.query(
      "update subscriptions set plan_id=$1 where account_id=$2",
      [teamPlan, ownerAccount],
    );

    await owner.query(
      "select set_farm_member($1,'shared-a',$2,'manager')",
      [ownerAccount, managerId],
    );
    await owner.query(
      "select set_farm_member($1,'shared-a',$2,'worker')",
      [ownerAccount, workerId],
    );
    await owner.query(
      "select set_farm_member($1,'shared-a',$2,'viewer')",
      [ownerAccount, viewerId],
    );

    // The same person can collaborate on several farms without consuming a
    // second account-wide seat.
    await owner.query(
      "select set_farm_member($1,'shared-b',$2,'manager')",
      [ownerAccount, managerId],
    );

    await assert.rejects(
      owner.query("select set_farm_member($1,'shared-a',$2,'viewer')", [
        ownerAccount,
        extraId,
      ]),
      /TEAM_MEMBER_LIMIT_REACHED/,
    );
    await assert.rejects(
      owner.query("select set_farm_member($1,'shared-a',$2,'manager')", [
        ownerAccount,
        ownerId,
      ]),
      /OWNER_MEMBERSHIP_FORBIDDEN/,
    );

    assert.equal(
      (
        await manager.query(
          "select * from farms where account_id=$1 order by id",
          [ownerAccount],
        )
      ).rowCount,
      2,
    );
    assert.equal(
      (
        await worker.query("select * from farms where account_id=$1", [
          ownerAccount,
        ])
      ).rowCount,
      1,
    );
    assert.equal(
      (
        await viewer.query("select * from farms where account_id=$1", [
          ownerAccount,
        ])
      ).rowCount,
      1,
    );
    assert.equal(
      (
        await extra.query("select * from farms where account_id=$1", [
          ownerAccount,
        ])
      ).rowCount,
      0,
    );

    assert.equal(
      (
        await manager.query(
          "update farms set data=$1 where account_id=$2 and id='shared-a'",
          [farm("shared-a", { name: "Managed field" }), ownerAccount],
        )
      ).rowCount,
      1,
    );
    assert.equal(
      (
        await worker.query(
          "update farms set data=$1 where account_id=$2 and id='shared-a'",
          [farm("shared-a", { name: "Worker edit" }), ownerAccount],
        )
      ).rowCount,
      0,
    );
    assert.equal(
      (
        await viewer.query(
          "update farms set data=$1 where account_id=$2 and id='shared-a'",
          [farm("shared-a", { name: "Viewer edit" }), ownerAccount],
        )
      ).rowCount,
      0,
    );

    await owner.query("select save_irrigation_schedule('shared-a',$1)", [
      schedule,
    ]);
    assert.equal(
      (
        await worker.query(
          "select * from irrigation_schedules where account_id=$1 and farm_id='shared-a'",
          [ownerAccount],
        )
      ).rowCount,
      1,
    );
    assert.equal(
      (
        await viewer.query(
          "select * from irrigation_schedules where account_id=$1 and farm_id='shared-a'",
          [ownerAccount],
        )
      ).rowCount,
      1,
    );

    const changedSchedule = { ...schedule, duration: 60 };
    await worker.query(
      "select save_shared_irrigation_schedule($1,'shared-a',$2)",
      [ownerAccount, changedSchedule],
    );
    assert.equal(
      (
        await worker.query(
          "select (data->>'duration')::int as duration from irrigation_schedules where account_id=$1 and farm_id='shared-a'",
          [ownerAccount],
        )
      ).rows[0].duration,
      60,
    );

    const ownerSnapshot = (
      await owner.query("select get_cloud_snapshot() as snapshot")
    ).rows[0].snapshot;
    assert.equal(ownerSnapshot.farms.length, 2);
    assert.deepEqual(ownerSnapshot.sharedFarms, []);
    assert.equal(ownerSnapshot.irrigationSchedules["shared-a"].duration, 60);

    const managerSnapshot = (
      await manager.query("select get_cloud_snapshot() as snapshot")
    ).rows[0].snapshot;
    assert.deepEqual(managerSnapshot.farms, []);
    assert.equal(managerSnapshot.sharedFarms.length, 2);
    assert.deepEqual(
      managerSnapshot.sharedFarms.map((item) => [item.farm_id, item.role]),
      [
        ["shared-a", "manager"],
        ["shared-b", "manager"],
      ],
    );
    assert.equal(managerSnapshot.sharedIrrigationSchedules.length, 1);
    assert.equal(
      managerSnapshot.sharedIrrigationSchedules[0].data.duration,
      60,
    );

    const workerSnapshot = (
      await worker.query("select get_cloud_snapshot() as snapshot")
    ).rows[0].snapshot;
    assert.equal(workerSnapshot.sharedFarms.length, 1);
    assert.equal(workerSnapshot.sharedFarms[0].role, "worker");
    assert.equal(
      (
        await viewer.query(
          "update irrigation_schedules set data=$1 where account_id=$2 and farm_id='shared-a'",
          [{ ...schedule, duration: 75 }, ownerAccount],
        )
      ).rowCount,
      0,
    );

    await assert.rejects(
      manager.query(
        "insert into farm_memberships(account_id,farm_id,user_id,role) values($1,'shared-a',$2,'viewer')",
        [ownerAccount, extraId],
      ),
      /permission denied/i,
    );
    await assert.rejects(
      manager.query("select set_farm_member($1,'shared-a',$2,'viewer')", [
        ownerAccount,
        extraId,
      ]),
      /OWNER_REQUIRED/,
    );

    assert.equal(
      (
        await viewer.query(
          "select * from farm_memberships where account_id=$1 and farm_id='shared-a'",
          [ownerAccount],
        )
      ).rowCount,
      1,
    );
    assert.equal(
      (
        await manager.query(
          "select * from farm_memberships where account_id=$1",
          [ownerAccount],
        )
      ).rowCount,
      4,
    );

    await owner.query(
      "select remove_farm_member($1,'shared-a',$2)",
      [ownerAccount, viewerId],
    );
    assert.equal(
      (
        await viewer.query("select * from farms where account_id=$1", [
          ownerAccount,
        ])
      ).rowCount,
      0,
    );
  } finally {
    await owner.end();
    await manager.end();
    await worker.end();
    await viewer.end();
    await extra.end();
  }
});

test("farm invitations reserve seats, rotate tokens, verify email and activate shared access", async () => {
  const ownerId = users[17];
  const inviteeId = users[18];
  const mismatchId = users[19];
  const secondInviteeId = users[20];
  const owner = await asUser(ownerId);
  const invitee = await asUser(inviteeId);
  const mismatch = await asUser(mismatchId);
  const secondInvitee = await asUser(secondInviteeId);

  const inviteeEmail = "user-18@example.test";
  const mismatchEmail = "user-19@example.test";
  const secondEmail = "user-20@example.test";
  const hashA = "a".repeat(64);
  const hashB = "b".repeat(64);
  const hashC = "c".repeat(64);
  const hashD = "d".repeat(64);
  const hashE = "e".repeat(64);

  try {
    await create(owner, farm("invite-a", { name: "North field" }));
    await create(owner, farm("invite-b", { name: "South field" }));
    const ownerAccount = await account(ownerId);

    const teamPlan = (
      await admin.query(
        "insert into plans(code,name) values('invite-team-test','Invite Team Test') returning id",
      )
    ).rows[0].id;
    await admin.query(
      "insert into plan_entitlements(plan_id,key,value) values($1,'max_farms','3'::jsonb),($1,'max_team_members','2'::jsonb)",
      [teamPlan],
    );
    await admin.query(
      "update subscriptions set plan_id=$1 where account_id=$2",
      [teamPlan, ownerAccount],
    );

    const created = (
      await owner.query(
        "select create_farm_invitation('invite-a',$1,'worker',$2) as invitation",
        [inviteeEmail.toUpperCase(), hashA],
      )
    ).rows[0].invitation;
    assert.equal(created.farm_name, "North field");
    assert.ok(created.id);

    let overview = (
      await owner.query("select get_team_overview() as overview")
    ).rows[0].overview;
    assert.equal(overview.activeSeats, 0);
    assert.equal(overview.pendingSeats, 1);
    assert.equal(overview.invitations.length, 1);
    assert.equal(overview.invitations[0].email, inviteeEmail);
    assert.equal(overview.invitations[0].role, "worker");

    // Resend rotates the token, extends expiry and is throttled so the Resend
    // provider cannot be hammered by repeated clicks.
    await assert.rejects(
      owner.query(
        "select resend_farm_invitation($1,$2)",
        [created.id, hashB],
      ),
      /INVITATION_RESEND_TOO_SOON/,
    );
    await admin.query(
      "update private.farm_invitations set created_at=now()-interval '2 minutes' where id=$1",
      [created.id],
    );
    const resent = (
      await owner.query(
        "select resend_farm_invitation($1,$2) as invitation",
        [created.id, hashB],
      )
    ).rows[0].invitation;
    assert.equal(resent.id, created.id);
    assert.equal(resent.email, inviteeEmail);
    assert.equal(resent.role, "worker");
    assert.equal(resent.farm_name, "North field");
    await assert.rejects(
      invitee.query("select accept_farm_invitation($1)", [hashA]),
      /INVITATION_INVALID/,
    );

    // The same person can hold pending invitations for multiple farms while
    // consuming only one account-wide team seat.
    await owner.query(
      "select create_farm_invitation('invite-b',$1,'manager',$2)",
      [inviteeEmail, hashC],
    );
    overview = (
      await owner.query("select get_team_overview() as overview")
    ).rows[0].overview;
    assert.equal(overview.pendingSeats, 1);
    assert.equal(overview.invitations.length, 2);

    await owner.query(
      "select create_farm_invitation('invite-a',$1,'worker',$2)",
      [secondEmail, hashD],
    );
    overview = (
      await owner.query("select get_team_overview() as overview")
    ).rows[0].overview;
    assert.equal(overview.pendingSeats, 2);

    await assert.rejects(
      owner.query(
        "select create_farm_invitation('invite-b','future@example.test','viewer',$1)",
        [hashE],
      ),
      /TEAM_MEMBER_LIMIT_REACHED/,
    );
    await assert.rejects(
      owner.query(
        "select create_farm_invitation('invite-a','user-17@example.test','viewer',$1)",
        ["f".repeat(64)],
      ),
      /CANNOT_INVITE_OWNER/,
    );

    await assert.rejects(
      mismatch.query("select accept_farm_invitation($1)", [hashB]),
      /INVITATION_EMAIL_MISMATCH/,
    );

    const accepted = (
      await invitee.query(
        "select accept_farm_invitation($1) as accepted",
        [hashB],
      )
    ).rows[0].accepted;
    assert.equal(accepted.farm_id, "invite-a");
    assert.equal(accepted.role, "worker");
    assert.equal(
      (
        await invitee.query(
          "select * from farms where account_id=$1 and id='invite-a'",
          [ownerAccount],
        )
      ).rowCount,
      1,
    );
    await assert.rejects(
      invitee.query("select accept_farm_invitation($1)", [hashB]),
      /INVITATION_INVALID/,
    );

    // Once active anywhere in the account, another farm assignment for the
    // same user no longer consumes a pending seat.
    overview = (
      await owner.query("select get_team_overview() as overview")
    ).rows[0].overview;
    assert.equal(overview.activeSeats, 1);
    assert.equal(overview.pendingSeats, 1);

    await invitee.query("select accept_farm_invitation($1)", [hashC]);
    overview = (
      await owner.query("select get_team_overview() as overview")
    ).rows[0].overview;
    assert.equal(overview.activeSeats, 1);
    assert.equal(overview.pendingSeats, 1);
    assert.equal(
      overview.members.filter((member) => member.user_id === inviteeId).length,
      2,
    );

    await owner.query(
      "select set_farm_member($1,'invite-a',$2,'manager')",
      [ownerAccount, inviteeId],
    );
    overview = (
      await owner.query("select get_team_overview() as overview")
    ).rows[0].overview;
    assert.equal(
      overview.members.find(
        (member) =>
          member.user_id === inviteeId && member.farm_id === "invite-a",
      ).role,
      "manager",
    );

    const pending = overview.invitations.find(
      (invitation) => invitation.email === secondEmail,
    );
    await owner.query("select revoke_farm_invitation($1)", [pending.id]);
    overview = (
      await owner.query("select get_team_overview() as overview")
    ).rows[0].overview;
    assert.equal(overview.pendingSeats, 0);
    assert.equal(overview.invitations.length, 0);

    // Decline is recipient-only and leaves no active membership.
    await owner.query(
      "select create_farm_invitation('invite-a',$1,'viewer',$2)",
      [mismatchEmail, hashE],
    );
    await secondInvitee.query(
      "select create_farm_invitation('missing',$1,'viewer',$2)",
      ["nobody@example.test", "1".repeat(64)],
    ).then(
      () => assert.fail("non-owner account should not contain the owner's farm"),
      (error) => assert.match(String(error), /FARM_NOT_FOUND/),
    );
    await mismatch.query("select decline_farm_invitation($1)", [hashE]);
    await assert.rejects(
      mismatch.query("select accept_farm_invitation($1)", [hashE]),
      /INVITATION_INVALID/,
    );
    assert.equal(
      (
        await mismatch.query(
          "select * from farms where account_id=$1 and id='invite-a'",
          [ownerAccount],
        )
      ).rowCount,
      0,
    );
  } finally {
    await owner.end();
    await invitee.end();
    await mismatch.end();
    await secondInvitee.end();
  }
});

test("clients cannot modify owners, counters, plans or completion flags", async () => {
  const c = await asUser(users[0]);
  try {
    for (const sql of [
      "update accounts set farm_count=0",
      "update accounts set owner_user_id=gen_random_uuid()",
      "update profiles set onboarding_completed=true",
      "update subscriptions set plan_id=gen_random_uuid()",
      "update plan_entitlements set value='9999'",
      "update farms set account_id=gen_random_uuid()",
      "delete from legacy_imports",
    ])
      await assert.rejects(c.query(sql), /permission denied/i);
  } finally {
    await c.end();
  }
});
test("fourth farm is rejected through RPC and SQL; retries do not consume slots", async () => {
  const c = await asUser(users[2]);
  try {
    for (let i = 1; i <= 3; i++) await create(c, farm("farm-" + i));
    await create(c, farm("farm-1"));
    assert.equal(
      (await c.query("select farm_count from accounts")).rows[0].farm_count,
      3,
    );
    await assert.rejects(create(c, farm("fourth")), /FARM_LIMIT_REACHED/);
    await assert.rejects(
      c.query(
        "insert into farms(account_id,id,data) values(private.current_account_id(),'direct',$1)",
        [farm("direct")],
      ),
      /FARM_LIMIT_REACHED/,
    );
    assert.equal((await c.query("select * from farms")).rowCount, 3);
    await c.query("delete from farms where id='farm-2'");
    await create(c, farm("replacement"));
    assert.equal(
      (await c.query("select farm_count from accounts")).rows[0].farm_count,
      3,
    );
  } finally {
    await c.end();
  }
});
test(
  "eight concurrent transactions compete safely for the final farm slot",
  {
    skip:
      !native &&
      "Requires native PostgreSQL with concurrent sessions; run test:db:native.",
  },
  async () => {
    const seed = await asUser(users[3]);
    await create(seed, farm("one"));
    await create(seed, farm("two"));
    await seed.end();
    const clients = await Promise.all(
      Array.from({ length: 8 }, () => asUser(users[3])),
    );
    try {
      const results = await Promise.allSettled(
        clients.map((c, i) => create(c, farm("parallel-" + i))),
      );
      assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
      assert.equal(
        results.filter(
          (r) =>
            r.status === "rejected" &&
            r.reason.message.includes("FARM_LIMIT_REACHED"),
        ).length,
        7,
      );
      assert.deepEqual(
        (
          await clients[0].query(
            "select farm_count,(select count(*) from farms)::int as actual from accounts",
          )
        ).rows[0],
        { farm_count: 3, actual: 3 },
      );
    } finally {
      await Promise.all(clients.map((c) => c.end()));
    }
  },
);
test("migration is atomic and idempotent and retains unselected farms in its full backup", async () => {
  const c = await asUser(users[4]);
  try {
    const snapshot = {
      farms: [
        farm("old-1", {
          coordinates: { latitude: 36, longitude: 50 },
          crop: { id: "corn", name: "Corn" },
          irrigationType: "flood",
          extension: { retained: true },
        }),
        farm("old-2"),
        farm("old-3"),
        farm("old-4"),
      ],
      schedules: { "old-1": schedule, "old-4": schedule },
    };
    const ids = '["old-1","old-2","old-3"]';
    const first = (
      await c.query("select import_legacy_data($1,$2) as r", [snapshot, ids])
    ).rows[0].r;
    assert.equal(first.farms, 3);
    assert.equal(first.schedules, 1);
    assert.equal(
      (await c.query("select import_legacy_data($1,$2) as r", [snapshot, ids]))
        .rows[0].r.alreadyImported,
      true,
    );
    assert.equal(
      (await c.query("select farm_count from accounts")).rows[0].farm_count,
      3,
    );
    assert.deepEqual(
      (await c.query("select snapshot from legacy_imports")).rows[0].snapshot,
      snapshot,
    );
    assert.deepEqual(
      (await c.query("select data from farms where id='old-1'")).rows[0].data,
      snapshot.farms[0],
    );
    assert.deepEqual(
      (await c.query("select data from irrigation_schedules")).rows[0].data,
      schedule,
    );
    await assert.rejects(
      c.query("select import_legacy_data($1,$2)", [snapshot, '["old-4"]']),
      /IMPORT_ALREADY_COMPLETED/,
    );
  } finally {
    await c.end();
  }
});
test("failed imports roll back every row and counter; a valid retry succeeds", async () => {
  const c = await asUser(users[5]);
  try {
    const snapshot = {
      farms: [farm("retry")],
      schedules: { retry: { ...schedule, duration: -1 } },
    };
    await assert.rejects(
      c.query("select import_legacy_data($1,$2)", [snapshot, '["retry"]']),
      /INVALID_IMPORT/,
    );
    assert.equal((await c.query("select * from farms")).rowCount, 0);
    assert.equal((await c.query("select * from legacy_imports")).rowCount, 0);
    assert.equal(
      (await c.query("select farm_count from accounts")).rows[0].farm_count,
      0,
    );
    snapshot.schedules.retry = schedule;
    await c.query("select import_legacy_data($1,$2)", [snapshot, '["retry"]']);
    const other = await asUser(users[6]);
    try {
      await assert.rejects(
        other.query("select import_legacy_data($1,$2)", [
          { farms: [1, 2, 3, 4].map((n) => farm("many-" + n)), schedules: {} },
          '["many-1","many-2","many-3","many-4"]',
        ]),
        /FARM_LIMIT_REACHED/,
      );
      await create(other, farm("cloud"));
      await assert.rejects(
        other.query("select import_legacy_data($1,$2)", [
          snapshot,
          '["retry"]',
        ]),
        /CLOUD_NOT_EMPTY/,
      );
    } finally {
      await other.end();
    }
  } finally {
    await c.end();
  }
});
test("onboarding requires profile details and a first farm; deletion cascades schedules", async () => {
  const c = await asUser(users[7]);
  try {
    await assert.rejects(
      c.query("select complete_onboarding()"),
      /FIRST_FARM_REQUIRED/,
    );
    await create(c, farm("first"));
    await assert.rejects(
      c.query("select complete_onboarding()"),
      /PROFILE_INCOMPLETE/,
    );
    await assert.rejects(
      c.query("update profiles set timezone='invalid/timezone'"),
      /INVALID_TIMEZONE/,
    );
    await c.query(
      "update profiles set first_name='New',last_name='Name',full_name='New Name',country_code='IR',language='fa',timezone='Asia/Tehran',onboarding_step=4",
    );
    assert.equal(
      (await c.query("select onboarding_step from profiles")).rows[0]
        .onboarding_step,
      4,
    );
    await c.query("select complete_onboarding()");
    const completedProfile = (
      await c.query("select onboarding_completed,onboarding_step from profiles")
    ).rows[0];
    assert.equal(completedProfile.onboarding_completed, true);
    assert.equal(completedProfile.onboarding_step, 5);
    await c.query("select save_irrigation_schedule('first',$1)", [schedule]);
    await c.query("delete from farms where id='first'");
    assert.equal(
      (await c.query("select * from irrigation_schedules")).rowCount,
      0,
    );
    assert.equal(
      (await c.query("select farm_count from accounts")).rows[0].farm_count,
      0,
    );
  } finally {
    await c.end();
  }
});
test("anonymous and unverified users cannot read or create cloud data", async () => {
  const anon = native ? postgres.getPgClient() : wasmClient("anon");
  await anon.connect();
  if (native) await anon.query("set role anon");
  try {
    for (const table of [
      "profiles",
      "accounts",
      "farms",
      "irrigation_schedules",
      "subscriptions",
      "legacy_imports",
    ])
      await assert.rejects(
        anon.query("select * from " + table),
        /permission denied/,
      );
    await assert.rejects(
      anon.query("select create_farm($1)", [farm("anon")]),
      /permission denied/,
    );
  } finally {
    await anon.end();
  }
  await admin.query(
    "update auth.users set email_confirmed_at=null where id=$1",
    [users[8]],
  );
  const c = await asUser(users[8]);
  try {
    assert.equal((await c.query("select * from profiles")).rowCount, 0);
    await assert.rejects(create(c, farm("unverified")), /AUTH_REQUIRED/);
  } finally {
    await c.end();
  }
});
test("database constraints reject malformed documents when bypassing Next.js", async () => {
  const c = await asUser(users[9]);
  try {
    for (const bad of [
      farm("bad", { type: null }),
      farm("bad", { area: -5 }),
      farm("bad", { coordinates: { latitude: 91, longitude: 2 } }),
      farm("bad", { irrigationType: "anything" }),
    ])
      await assert.rejects(create(c, bad), /check constraint/i);
    await create(c, farm("valid"));
    for (const bad of [
      { ...schedule, date: "2027-02-30" },
      { ...schedule, time: "24:99" },
      { ...schedule, duration: 0 },
      { ...schedule, timeZone: "wrong/zone" },
    ])
      await assert.rejects(
        c.query("select save_irrigation_schedule('valid',$1)", [bad]),
        /check constraint/i,
      );
  } finally {
    await c.end();
  }
});

test("retired plans remain visible to their subscriber but grant no entitlements", async () => {
  const plan = (
    await admin.query(
      "insert into plans(code,name,is_active) values('retired-test','Retired test',false) returning id",
    )
  ).rows[0].id;
  await admin.query(
    "insert into plan_entitlements(plan_id,key,value) values($1,'max_farms','12')",
    [plan],
  );
  await admin.query("update subscriptions set plan_id=$1 where account_id=$2", [
    plan,
    await account(users[9]),
  ]);
  const c = await asUser(users[9]);
  try {
    assert.equal(
      (await c.query("select name from plans where id=$1", [plan])).rows[0]
        .name,
      "Retired test",
    );
    assert.deepEqual(
      (await c.query("select get_entitlements() as e")).rows[0].e,
      {},
    );
    await assert.rejects(
      create(c, farm("retired-plan-farm")),
      /FARM_LIMIT_REACHED/,
    );
  } finally {
    await c.end();
  }
});

test("revoked, expired, missing and cross-user session claims fail closed", async () => {
  const user=users[9], valid=await asUser(user), other=await asUser(user,"aal1",users[8]);
  const missing=await asUser(user,"aal1",null), malformed=await asUser(user,"aal1","not-a-uuid");
  try {
    assert.ok((await valid.query("select get_current_session() as s")).rows[0].s.created_at);
    for(const c of [other,missing,malformed]) {
      assert.equal((await c.query("select get_current_session() as s")).rows[0].s,null);
      assert.equal((await c.query("select * from profiles")).rowCount,0);
      assert.deepEqual((await c.query("select get_entitlements() as e")).rows[0].e,{});
      await assert.rejects(c.query("select complete_onboarding()"),/AUTH_REQUIRED/);
    }
    await admin.query("update auth.sessions set not_after=now()-interval '1 second' where id=$1",[user]);
    assert.equal((await valid.query("select get_current_session() as s")).rows[0].s,null);
    await admin.query("delete from auth.sessions where id=$1",[user]);
    assert.equal((await valid.query("select * from accounts")).rowCount,0);
    await assert.rejects(create(valid,farm("revoked-farm")),/AUTH_REQUIRED|row-level security/);
    await assert.rejects(valid.query("select import_legacy_data($1,$2)",[{farms:[],schedules:{}},[]]),/AUTH_REQUIRED/);
  } finally {
    await admin.query("insert into auth.sessions(id,user_id) values($1,$1) on conflict(id) do update set not_after=null",[user]);
    for(const c of [valid,other,missing,malformed])await c.end();
  }
});

test("missing MFA infrastructure denies opted-out users too", async()=>{
  const c=await asUser(users[0]);
  try {
    await admin.query("alter table auth.mfa_factors rename to unavailable_factors");
    assert.equal((await c.query("select private.mfa_access_allowed() as allowed")).rows[0].allowed,false);
    assert.equal((await c.query("select * from farms")).rowCount,0);
  } finally {await admin.query("alter table auth.unavailable_factors rename to mfa_factors");await c.end();}
});

test("username login limits are durable, atomic and inaccessible to users",async()=>{
  const c=await asUser(users[0]);
  await admin.query("delete from private.username_login_limits");
  try {
    await assert.rejects(c.query("select consume_username_login_attempt($1)",["a".repeat(64)]),/permission denied/);
    await assert.rejects(c.query("select * from private.username_login_limits"),/permission denied/);
    const clients=native?await Promise.all(Array.from({length:20},async()=>{const x=postgres.getPgClient();await x.connect();return x;})):Array.from({length:20},()=>admin);
    try {
      const results=await Promise.all(clients.map(x=>x.query("select consume_username_login_attempt($1) as ok",["a".repeat(64)])));
      assert.equal(results.filter(r=>r.rows[0].ok).length,10);
    } finally {if(native)await Promise.all(clients.map(x=>x.end()));}
    await admin.query("update private.username_login_limits set expires_at=now()-interval '1 second'");
    assert.equal((await admin.query("select consume_username_login_attempt($1) as ok",["a".repeat(64)])).rows[0].ok,true);
    await admin.query("update private.username_login_limits set attempts=300 where bucket='global'");
    assert.equal((await admin.query("select consume_username_login_attempt($1) as ok",["b".repeat(64)])).rows[0].ok,false);
    assert.equal((await admin.query("select * from private.username_login_limits where bucket=$1",["user:"+"b".repeat(64)])).rowCount,0);
  }finally{await c.end();await admin.query("delete from private.username_login_limits");}
});

const supportCommand = async (client, payload) => (await client.query("select public.support_command($1) as result", [payload])).rows[0].result;
const supportRead = async (client, payload) => (await client.query("select public.support_read($1) as result", [payload])).rows[0].result;
const newTicket = () => ({ action: "create", requestId: randomUUID(), subject: "Support test", category: "Other", body: "Please help with this test issue." });
test("support ownership, direct DML denial, validation, idempotency and rate limits", async () => {
 const owner = await asUser(users[18]), other = await asUser(users[19]);
 try {
  const payload = newTicket(); const { id } = await supportCommand(owner,payload);
  assert.equal((await supportCommand(owner,payload)).id,id);
  await assert.rejects(supportCommand(owner,{ ...payload, subject: "Changed" }), /SUPPORT_CONFLICT/);
  assert.equal((await owner.query("select * from support_tickets where id=$1",[id])).rowCount,1);
  assert.equal((await other.query("select * from support_tickets where id=$1",[id])).rowCount,0);
  assert.equal((await other.query("select * from support_ticket_messages where ticket_id=$1",[id])).rowCount,0);
  await assert.rejects(supportRead(other,{ticketId:id}),/SUPPORT_DENIED/);
  await assert.rejects(supportRead(other,{staff:true}),/SUPPORT_DENIED/);
  await assert.rejects(supportCommand(other,{action:"reply",ticketId:id,requestId:randomUUID(),body:"Intrusion",internal:false}),/SUPPORT_DENIED/);
  await assert.rejects(owner.query("update support_tickets set priority='high' where id=$1",[id]),/permission denied/);
  await assert.rejects(owner.query("insert into support_ticket_messages(ticket_id,author_id,body) values($1,$2,'Bypass')",[id,users[18]]),/permission denied/);
  await assert.rejects(owner.query("select * from private.support_outbox"),/permission denied/);
  await assert.rejects(owner.query("select support_email_jobs()"),/permission denied/);
  await assert.rejects(supportCommand(owner,{...newTicket(),body:"short"}),/SUPPORT_INVALID/);
  await assert.rejects(supportCommand(owner,{...newTicket(),category:"fake"}),/check constraint/);
  await assert.rejects(supportCommand(owner,{action:"reply",ticketId:id,requestId:randomUUID(),body:"note",internal:true}),/SUPPORT_INVALID/);
  await assert.rejects(supportCommand(owner,{action:"update",ticketId:id,requestId:randomUUID(),version:1,status:"closed",priority:"high"}),/SUPPORT_DENIED/);
  for(let i=0;i<4;i++) await supportCommand(owner,newTicket());
  await assert.rejects(supportCommand(owner,newTicket()),/SUPPORT_RATE/);
  assert.equal((await admin.query("select count(*)::int as n from private.support_outbox where ticket_id=$1",[id])).rows[0].n,2);
 } finally { await owner.end(); await other.end(); }
});
test("support staff registry, AAL2 freshness, internal-note privacy, transitions and audit", async () => {
 const actor=users[20];
 await admin.query("insert into private.support_staff(user_id,granted_by) values($1,'test')",[actor]);
 const staff=await asUser(actor,"aal2",actor,true), stale=await asUser(actor,"aal2"), low=await asUser(actor), owner=await asUser(users[19]);
 try {
  const {id}=await supportCommand(owner,newTicket());
  assert.equal((await low.query("select support_is_staff() as ok")).rows[0].ok,false);
  await assert.rejects(supportRead(low,{staff:true}),/SUPPORT_DENIED/);
  await assert.rejects(supportCommand(stale,{action:"reply",ticketId:id,requestId:randomUUID(),body:"test",internal:false}),/SUPPORT_MFA/);
  await supportCommand(staff,{action:"reply",ticketId:id,requestId:randomUUID(),body:"Private investigation",internal:true});
  assert.equal((await supportRead(owner,{ticketId:id})).messages.length,1);
  assert.equal((await owner.query("select * from support_ticket_messages where ticket_id=$1",[id])).rowCount,1);
  assert.equal((await supportRead(staff,{ticketId:id,staff:true})).messages.length,2);
  await supportCommand(staff,{action:"reply",ticketId:id,requestId:randomUUID(),body:"Public answer",internal:false});
  let view=await supportRead(owner,{ticketId:id}); assert.equal(view.ticket.status,"waiting_for_user");
  await supportCommand(owner,{action:"reply",ticketId:id,requestId:randomUUID(),body:"Thank you",internal:false});
  view=await supportRead(owner,{ticketId:id}); assert.equal(view.ticket.status,"waiting_for_support");
  const change={action:"update",ticketId:id,requestId:randomUUID(),version:view.ticket.version,status:"resolved",priority:"high"};
  await supportCommand(staff,change);
  await assert.rejects(supportCommand(staff,{...change,requestId:randomUUID()}),/SUPPORT_CONFLICT/);
  await assert.rejects(supportCommand(owner,{action:"reply",ticketId:id,requestId:randomUUID(),body:"Reply",internal:false}),/SUPPORT_CLOSED/);
  await supportCommand(owner,{action:"reopen",ticketId:id,requestId:randomUUID()});
  view=await supportRead(owner,{ticketId:id}); assert.equal(view.ticket.status,"waiting_for_support");
  assert.equal(view.ticket.priority,"high");
  assert.equal((await admin.query("select count(*)::int as n from private.support_audit where ticket_id=$1",[id])).rows[0].n,3);
  await admin.query("delete from private.support_staff where user_id=$1",[actor]);
  await assert.rejects(supportRead(staff,{ticketId:id}),/SUPPORT_DENIED/);
 } finally { await staff.end();await stale.end();await low.end();await owner.end(); }
});
test("support notification leases recover failure and do not re-send acknowledged jobs", async () => {
 const jobs=(await admin.query("select transactional_email_jobs_v2(true,false) as jobs")).rows[0].jobs;
 assert.ok(jobs.length>0); const job=jobs[0];
 await admin.query("select support_email_ack($1,$2,false)",[job.id,job.lease]);
 assert.equal((await admin.query("select sent_at from private.support_outbox where id=$1",[job.id])).rows[0].sent_at,null);
 await admin.query("update private.support_outbox set lease_until=now()-interval '1 second' where id=$1",[job.id]);
 const retried=(await admin.query("select transactional_email_jobs_v2(true,false) as jobs")).rows[0].jobs.find(j=>j.id===job.id);
 assert.ok(retried); assert.notEqual(retried.lease,job.lease);
 await admin.query("select support_email_ack($1,$2,true)",[job.id,job.lease]);
 assert.equal((await admin.query("select sent_at from private.support_outbox where id=$1",[job.id])).rows[0].sent_at,null);
 await admin.query("select support_email_ack($1,$2,true)",[job.id,retried.lease]);
 assert.ok((await admin.query("select sent_at from private.support_outbox where id=$1",[job.id])).rows[0].sent_at);
 assert.ok(!(await admin.query("select transactional_email_jobs_v2(true,false) as jobs")).rows[0].jobs.some(j=>j.id===job.id));
});
test("support pagination, unread receipts and hourly reply limit",async()=>{
 const owner=await asUser(users[17]);
 try {
  const {id}=await supportCommand(owner,newTicket());
  // Simulate a persisted public staff response without granting any user staff access.
  await admin.query("insert into support_ticket_messages(ticket_id,author_id,body,staff) values($1,$2,'Answer',true)",[id,users[20]]);
  await admin.query("update support_tickets set last_staff_at=now() where id=$1",[id]);
  assert.equal((await supportRead(owner,{})).tickets.find(t=>t.id===id).unread,true);
  await supportRead(owner,{ticketId:id});
  // Read receipts use the message timestamp, not read completion time.
  await admin.query("update support_tickets set last_staff_at=(select max(created_at) from support_ticket_messages where ticket_id=$1) where id=$1",[id]);
  assert.equal((await supportRead(owner,{})).tickets.find(t=>t.id===id).unread,false);
  for(let i=0;i<59;i++) await supportCommand(owner,{action:'reply',ticketId:id,requestId:randomUUID(),body:`Message ${i}`,internal:false});
  const first=await supportRead(owner,{ticketId:id,page:0}),second=await supportRead(owner,{ticketId:id,page:1});
  assert.equal(first.messages.length,50);assert.equal(first.hasMore,true);assert.equal(second.messages.length,11);assert.equal(second.hasMore,false);
  assert.equal(new Set([...first.messages,...second.messages].map(m=>m.id)).size,61);
  await assert.rejects(supportCommand(owner,{action:'reply',ticketId:id,requestId:randomUUID(),body:'Limited',internal:false}),/SUPPORT_RATE/);
 }finally{await owner.end();}
});
test("native concurrent duplicate support replies create one message", {skip:!native},async()=>{
 const a=await asUser(users[16]),b=await asUser(users[16]);
 try {
  const {id}=await supportCommand(a,newTicket());
  const reply={action:'reply',ticketId:id,requestId:randomUUID(),body:'Concurrent reply',internal:false};
  await Promise.all([supportCommand(a,reply),supportCommand(b,reply)]);
  assert.equal((await supportRead(a,{ticketId:id})).messages.length,2);
 }finally{await a.end();await b.end();}
});

test("support notifications keep the ticket owner's language across staff replies and status updates", async () => {
  const owner = await asUser(users[15]);
  const staffId = users[20];
  await admin.query("insert into private.support_staff(user_id,granted_by) values($1,'locale-test') on conflict(user_id) do nothing", [staffId]);
  const staff = await asUser(staffId, "aal2", staffId, true);
  try {
    // Profile is Persian; the actual submit UI was English. Ticket language wins.
    await admin.query("update public.profiles set language='fa' where id=$1", [users[15]]);
    // This last test isolates the new jobs from the outbox/lease tests above.
    await admin.query("update private.support_outbox set sent_at=now() where sent_at is null");
    const { id } = await supportCommand(owner, { ...newTicket(), language: "en" });
    assert.equal((await admin.query("select notification_language from public.support_tickets where id=$1", [id])).rows[0].notification_language, "en");
    let jobs = (await admin.query("select public.transactional_email_jobs_v2(true,false) as jobs")).rows[0].jobs.filter(j => j.ticketId === id);
    assert.equal(jobs.find(j => j.audience === "user" && j.event === "created")?.language, "en");
    assert.equal(jobs.find(j => j.audience === "staff" && j.event === "created")?.language, "fa");
    for (const job of jobs) await admin.query("select public.support_email_ack($1,$2,true)", [job.id,job.lease]);

    await supportCommand(staff, { action:"reply",ticketId:id,requestId:randomUUID(),body:"Thank you for contacting our team.",internal:false });
    jobs = (await admin.query("select public.transactional_email_jobs_v2(true,false) as jobs")).rows[0].jobs.filter(j => j.ticketId === id);
    assert.equal(jobs.find(j => j.audience === "user" && j.event === "reply")?.language, "en");
    for (const job of jobs) await admin.query("select public.support_email_ack($1,$2,true)", [job.id,job.lease]);

    const ticket = await supportRead(staff, { ticketId:id, staff:true });
    await supportCommand(staff, { action:"update",ticketId:id,requestId:randomUUID(),version:ticket.ticket.version,status:"resolved",priority:"normal" });
    jobs = (await admin.query("select public.transactional_email_jobs_v2(true,false) as jobs")).rows[0].jobs.filter(j => j.ticketId === id);
    assert.equal(jobs.find(j => j.audience === "user" && j.event === "status")?.language, "en");
    for (const job of jobs) await admin.query("select public.support_email_ack($1,$2,true)", [job.id,job.lease]);

    await admin.query("update public.profiles set language='en' where id=$1", [users[15]]);
    assert.equal((await admin.query("select notification_language from public.support_tickets where id=$1", [id])).rows[0].notification_language, "en");
    const persian = await supportCommand(owner, { ...newTicket(), language:"fa" });
    assert.equal((await admin.query("select notification_language from public.support_tickets where id=$1", [persian.id])).rows[0].notification_language, "fa");
    await assert.rejects(supportCommand(owner, { ...newTicket(), language:"invalid" }), /SUPPORT_INVALID/);

    const legacy = await supportCommand(owner, newTicket());
    assert.equal((await admin.query("select notification_language from public.support_tickets where id=$1", [legacy.id])).rows[0].notification_language, "en");
  } finally {
    await staff.end();
    await owner.end();
    await admin.query("delete from private.support_staff where user_id=$1", [staffId]);
  }
});

// Account security: these fixtures use isolated accounts and actual migrations.
async function securityFixture() {
 const user=randomUUID(), session=randomUUID(), factor=randomUUID();
 await admin.query("insert into auth.users(id,email,email_confirmed_at) values($1,'security@example.test',now())",[user]);
 await admin.query("insert into auth.sessions(id,user_id) values($1,$2)",[session,user]);
 await admin.query("insert into auth.mfa_factors values($1,$2,'verified')",[factor,user]);
 return {user,session,factor};
}
async function observeSecurity(user,session,provider='password',aal='aal2',client=admin) {
 return (await client.query("select public.security_observe_session($1,$2,$3,$4,$5) as queued",[user,session,{device:'Mobile',os:'iOS',browser:'Safari',ip:'203.0.113.9',city:'Qazvin'},provider,aal])).rows[0].queued;
}
async function beginSecurity(f,hash='a'.repeat(64),scope='others',client=admin) {
 return (await client.query("select security_begin_revocation($1,$2,$3,$4,$5) as id",[f.user,f.session,f.factor,scope,hash])).rows[0].id;
}
test("new password/Google sessions enqueue exactly once only after required MFA; refresh/reload/tabs are idempotent",async()=>{
 for(const provider of ['password','google']) {
  const f=await securityFixture();
  assert.equal(await observeSecurity(f.user,f.session,provider,'aal1'),false);
  assert.equal((await admin.query("select count(*)::int n from private.security_events where user_id=$1",[f.user])).rows[0].n,0);
  assert.equal(await observeSecurity(f.user,f.session,provider),true);
  for(let i=0;i<4;i++) assert.equal(await observeSecurity(f.user,f.session,provider),false);
  const rows=(await admin.query("select e.kind,e.details,o.security_payload from private.security_events e join private.support_outbox o on o.security_event_id=e.id where e.user_id=$1",[f.user])).rows;
  assert.equal(rows.length,1);assert.equal(rows[0].details.provider,provider);assert.equal(rows[0].security_payload.details.metadata.city,'Qazvin');
 }
 const f=await securityFixture();await admin.query("delete from auth.mfa_factors where id=$1",[f.factor]);
 assert.equal(await observeSecurity(f.user,f.session,'password','aal1'),true);
});
test("baseline sessions, missing metadata, ownership and immutable user-scoped security history",async()=>{
 const f=await securityFixture(), foreign=await securityFixture();
 await admin.query("insert into private.security_sessions(session_id,user_id,created_at,baseline) values($1,$2,now(),true)",[f.session,f.user]);
 assert.equal(await observeSecurity(f.user,f.session),false);
 assert.equal(await observeSecurity(foreign.user,f.session),false);
 const owner=await asUser(f.user,'aal2',f.session), other=await asUser(foreign.user,'aal2',foreign.session), low=await asUser(f.user,'aal1',f.session);
 try {
  const own=(await owner.query("select security_snapshot() as s")).rows[0].s;
  assert.ok(own.sessions.some(s=>s.id===f.session&&s.current));assert.ok(own.sessions.every(s=>s.id!==foreign.session));
  assert.deepEqual(own.sessions.find(s=>s.id===f.user).metadata,{});
  await admin.query("select security_record_event($1,$2,'logout',$3)",[f.user,f.session,f.session]);
  await admin.query("select security_record_event($1,$2,'logout',$3)",[f.user,f.session,f.session]);
  assert.equal((await owner.query("select security_snapshot() as s")).rows[0].s.events.length,1);
  assert.equal((await other.query("select security_snapshot() as s")).rows[0].s.events.length,0);
  await assert.rejects(low.query("select security_snapshot()"),/SECURITY_DENIED/);
  for(const sql of ["select * from private.security_events","delete from private.security_events","select security_prune()","select security_observe_session(null,null,'{}',null,null)","select security_begin_revocation(null,null,null,'others',null)","select transactional_email_jobs_v2(true,true)"])
   await assert.rejects(owner.query(sql),/permission denied/);
 }finally{await owner.end();await other.end();await low.end();}
});
test("single-use, expiring proof denies old JWTs before native sign-out and never blocks a foreign/current session for others",async()=>{
 const f=await securityFixture(), foreign=await securityFixture();
 const current=await asUser(f.user,'aal2',f.session), remote=await asUser(f.user,'aal2',f.user), other=await asUser(foreign.user,'aal2',foreign.session);
 try {
  const op=await beginSecurity(f);
  await assert.rejects(admin.query("select security_consume_revocation($1,$2,$3)",[op,foreign.user,foreign.session]),/SECURITY_REPLAY/);
  const consumed=(await admin.query("select security_consume_revocation($1,$2,$3) as result",[op,f.user,f.session])).rows[0].result;
  assert.equal(consumed.scope,'others');assert.equal(consumed.count,1);
  await assert.rejects(admin.query("select security_consume_revocation($1,$2,$3)",[op,f.user,f.session]),/SECURITY_REPLAY/);
  assert.ok((await current.query("select get_current_session() as s")).rows[0].s);
  assert.ok((await other.query("select get_current_session() as s")).rows[0].s);
  assert.equal((await remote.query("select get_current_session() as s")).rows[0].s,null);
  assert.equal((await remote.query("select * from profiles")).rowCount,0);
  await assert.rejects(create(remote,farm('revoked-security-farm')),/AUTH_REQUIRED/);
  await assert.rejects(remote.query("select complete_onboarding()"),/AUTH_REQUIRED|MFA_REQUIRED/);
  assert.equal((await admin.query("select security_finish_revocation($1,$2,true) as done",[op,f.user])).rows[0].done,false);
  assert.equal((await current.query("select security_snapshot() as s")).rows[0].s.sessions.find(s=>s.id===f.user).state,'blocked');
  // Native Auth deletion is simulated only in the isolated auth fixture, never production.
  await admin.query("delete from auth.sessions where id=$1",[f.user]);
  const next=await beginSecurity(f,'b'.repeat(64));
  await admin.query("update private.security_revocations set expires_at=now()-interval '1 second' where id=$1",[next]);
  await assert.rejects(admin.query("select security_consume_revocation($1,$2,$3)",[next,f.user,f.session]),/SECURITY_REPLAY/);
  await assert.rejects(beginSecurity({...f,factor:foreign.factor},'c'.repeat(64)),/SECURITY_DENIED/);
 }finally{await current.end();await remote.end();await other.end();}
});
test("security quota and replay apply across requests; global sign-out preserves no app access",async()=>{
 const f=await securityFixture();
 for(let i=0;i<5;i++){
  const op=await beginSecurity(f,String(i).repeat(64));
  await admin.query("select security_finish_revocation($1,$2,false)",[op,f.user]);
 }
 await assert.rejects(beginSecurity(f,'f'.repeat(64)),/SECURITY_RATE/);
 const g=await securityFixture();const op=await beginSecurity(g,'a'.repeat(64));
 await admin.query("select security_finish_revocation($1,$2,false)",[op,g.user]);
 await assert.rejects(beginSecurity(g,'a'.repeat(64)),/SECURITY_REPLAY/);
 const all=await beginSecurity(g,'b'.repeat(64),'global');
 await admin.query("select security_consume_revocation($1,$2,$3)",[all,g.user,g.session]);
 const c=await asUser(g.user,'aal2',g.session);
 try{assert.equal((await c.query("select get_current_session() as s")).rows[0].s,null);}finally{await c.end();}
 await admin.query("delete from auth.sessions where user_id=$1",[g.user]);
 assert.equal((await admin.query("select security_finish_revocation($1,$2,true) as done",[all,g.user])).rows[0].done,true);
 assert.equal((await admin.query("select security_finish_revocation($1,$2,true) as done",[all,g.user])).rows[0].done,true);
});
test("security emails share durable leases, immutable retry payloads and retention cleanup",async()=>{
 const f=await securityFixture();await observeSecurity(f.user,f.session);
 let jobs=(await admin.query("select transactional_email_jobs_v2(false,true) as jobs")).rows[0].jobs;
 const job=jobs.find(j=>j.securityDetails?.metadata?.ip==='203.0.113.9'&&j.to==='security@example.test');assert.ok(job);
 await admin.query("select support_email_ack($1,$2,false)",[job.id,job.lease]);
 await admin.query("update private.support_outbox set lease_until=now()-interval '1 second' where id=$1",[job.id]);
 await admin.query("update profiles set language='en' where id=$1",[f.user]);
 await admin.query("update auth.users set email='changed@example.test' where id=$1",[f.user]);
 const retried=(await admin.query("select transactional_email_jobs_v2(false,true) as jobs")).rows[0].jobs.find(j=>j.id===job.id);
 assert.ok(retried);assert.equal(retried.to,job.to);assert.equal(retried.language,job.language);assert.deepEqual(retried.securityDetails,job.securityDetails);
 await admin.query("select support_email_ack($1,$2,true)",[job.id,job.lease]);
 assert.equal((await admin.query("select sent_at from private.support_outbox where id=$1",[job.id])).rows[0].sent_at,null);
 await admin.query("select support_email_ack($1,$2,true)",[job.id,retried.lease]);
 assert.ok(!(await admin.query("select transactional_email_jobs_v2(false,true) as jobs")).rows[0].jobs.some(j=>j.id===job.id));
 await admin.query("update private.security_sessions set observed_at=now()-interval '31 days' where user_id=$1",[f.user]);
 await admin.query("update private.security_events set created_at=now()-interval '31 days' where user_id=$1",[f.user]);
 await admin.query("select security_prune()");
 assert.deepEqual((await admin.query("select metadata from private.security_sessions where session_id=$1",[f.session])).rows[0].metadata,{});
 assert.ok(!(await admin.query("select details from private.security_events where user_id=$1",[f.user])).rows[0].details.metadata);
 await admin.query("update private.security_events set created_at=now()-interval '91 days' where user_id=$1",[f.user]);
 await admin.query("select security_prune()");
 assert.equal((await admin.query("select count(*)::int n from private.security_events where user_id=$1",[f.user])).rows[0].n,0);
});
test("native concurrent login completion and revocation proof consumption have exactly one winner",{skip:!native},async()=>{
 const f=await securityFixture();const a=postgres.getPgClient(),b=postgres.getPgClient();await a.connect();await b.connect();
 try{
  const queued=await Promise.all([observeSecurity(f.user,f.session,'password','aal2',a),observeSecurity(f.user,f.session,'password','aal2',b)]);
  assert.equal(queued.filter(Boolean).length,1);
  const begun=await Promise.allSettled([beginSecurity(f,'d'.repeat(64),'others',a),beginSecurity(f,'e'.repeat(64),'others',b)]);
  assert.equal(begun.filter(r=>r.status==='fulfilled').length,1);
  const op=begun.find(r=>r.status==='fulfilled').value;
  const consumed=await Promise.allSettled([a.query("select security_consume_revocation($1,$2,$3)",[op,f.user,f.session]),b.query("select security_consume_revocation($1,$2,$3)",[op,f.user,f.session])]);
  assert.equal(consumed.filter(r=>r.status==='fulfilled').length,1);
 }finally{await a.end();await b.end();}
});
test("hardening prevents destructive legacy rollback and retains deny/audit records",async()=>{
 const f=await securityFixture(); const op=await beginSecurity(f,'9'.repeat(64));
 await admin.query("select security_consume_revocation($1,$2,$3)",[op,f.user,f.session]);
 const script=await readFile('supabase/rollback/account_session_security.sql','utf8');
 await assert.rejects(native?admin.query(script):embedded.exec(script),/ROLLBACK_BLOCKED/);
 await admin.query('rollback');
 assert.ok((await admin.query("select to_regclass('private.security_events') as t")).rows[0].t);
 assert.equal((await admin.query("select count(*)::int n from private.security_denied_sessions where user_id=$1",[f.user])).rows[0].n,1);
});

// Remediation regressions: actual migration functions, role checks and transaction outcomes.
const payloadHash = value => createHash('sha256').update(value).digest('hex');
async function actionGrant(f, operation='username', payload='secure_name', overrides={}, client=admin) {
 const args={user:f.user,session:f.session,operation,hash:payloadHash(payload),kind:'totp',factor:f.factor,proof:randomBytes(32).toString('hex'),recovery:null,...overrides};
 const result=await client.query("select security_begin_action($1,$2,$3,$4,$5,$6,$7,$8) as id",Object.values(args));
 return {id:result.rows[0].id,...args};
}
async function authorizeGrant(g, client=admin) {
 await client.query("select security_authorize_action($1,$2,$3,true)",[g.id,g.user,g.session]);
}
async function consumeGrant(g, client=admin) {
 return client.query("select security_consume_action($1,$2,$3,$4,$5)",[g.id,g.user,g.session,g.operation,g.hash]);
}
test("upgrade quarantines legacy unknown sends, retains denial, disables old workers and restricts new RPCs",async()=>{
 const row=(await admin.query("select delivery_hold,last_error from private.support_outbox where recipient_id=$1",[upgradeUser])).rows[0];
 assert.equal(row.delivery_hold,true); assert.equal(row.last_error,'LEGACY_PAYLOAD_UNKNOWN');
 assert.equal((await admin.query("select count(*)::int n from private.security_denied_sessions where user_id=$1",[upgradeUser])).rows[0].n,1);
 assert.deepEqual((await admin.query("select transactional_email_jobs(true,true) as jobs")).rows[0].jobs,[]);
 const f=await securityFixture(), c=await asUser(f.user,'aal2',f.session);
 try {
  for(const sql of ["select security_issue_recovery(null,null,null)","select security_has_recovery(null,null,null)","select security_begin_action(null,null,null,null,null,null,null,null)","select security_authorize_action(null,null,null,true)","select security_consume_action(null,null,null,null,null)","select security_password_changed(null,null,null)","select security_reconcile_revocations()","select security_freeze_email(null,null,'{}')","select security_email_health()","select * from private.security_action_grants","select * from private.security_recovery_tickets"])
   await assert.rejects(c.query(sql),/permission denied/);
 } finally { await c.end(); }
});
test("F03 old AAL2 direct username bypass is denied; new mutation consumes exact proof and audits atomically",async()=>{
 const f=await securityFixture(), c=await asUser(f.user,'aal2',f.session), foreign=await securityFixture(), other=await asUser(foreign.user,'aal2',foreign.session);
 try {
  await assert.rejects(c.query("select change_username('old_aal2_bypass')"),/permission denied|SECURITY_FRESH_REQUIRED/);
  const g=await actionGrant(f);
  await assert.rejects(c.query("select security_change_username('secure_name',$1,$2)",[g.id,g.hash]),/SECURITY_REPLAY/);
  await authorizeGrant(g);
  await assert.rejects(other.query("select security_change_username('secure_name',$1,$2)",[g.id,g.hash]),/SECURITY_REPLAY/);
  await assert.rejects(c.query("select security_change_username('other_value',$1,$2)",[g.id,g.hash]),/SECURITY_INVALID/);
  await c.query("select security_change_username('secure_name',$1,$2)",[g.id,g.hash]);
  await assert.rejects(c.query("select security_change_username('secure_name',$1,$2)",[g.id,g.hash]),/SECURITY_REPLAY/);
  assert.equal((await admin.query("select username from profiles where id=$1",[f.user])).rows[0].username,'secure_name');
  assert.equal((await admin.query("select count(*)::int n from private.security_events where user_id=$1 and kind='username_changed'",[f.user])).rows[0].n,1);
 } finally {await c.end();await other.end();}
});
test("username audit failure rolls mutation and consumption back together",async()=>{
 const f=await securityFixture(),g=await actionGrant(f,'username','atomic_name'); await authorizeGrant(g);
 const c=await asUser(f.user,'aal2',f.session);
 await admin.query("insert into private.security_events(user_id,kind,event_key) values($1,'test','username-grant:'||$2)",[f.user,g.id]);
 try {
  await assert.rejects(c.query("select security_change_username('atomic_name',$1,$2)",[g.id,g.hash]),/duplicate key/);
  assert.equal((await admin.query("select username from profiles where id=$1",[f.user])).rows[0].username,null);
  assert.equal((await admin.query("select state from private.security_action_grants where id=$1",[g.id])).rows[0].state,'verified');
 } finally {await c.end();}
});
test("action grants reject foreign factor/session, wrong operation/payload, expired and replayed proof, and late MFA enrollment",async()=>{
 const f=await securityFixture(), other=await securityFixture();
 await assert.rejects(actionGrant(f,'username','name',{factor:other.factor}),/SECURITY_DENIED/);
 await assert.rejects(actionGrant(f,'username','name',{session:other.session}),/SECURITY_DENIED/);
 const g=await actionGrant(f,'password_change','new password');await authorizeGrant(g);
 await assert.rejects(consumeGrant({...g,session:f.user}),/SECURITY_REPLAY/);
 await assert.rejects(consumeGrant({...g,operation:'username'}),/SECURITY_REPLAY/);
 await assert.rejects(consumeGrant({...g,hash:payloadHash('other')}),/SECURITY_REPLAY/);
 await admin.query("update private.security_action_grants set expires_at=now()-interval '1 second' where id=$1",[g.id]);
 await assert.rejects(consumeGrant(g),/SECURITY_REPLAY/);
 await assert.rejects(actionGrant(f,'password_change','new password',{proof:g.proof}),/SECURITY_REPLAY/);
 await assert.rejects(beginSecurity(f,g.proof),/SECURITY_REPLAY/);
 const plain=await securityFixture();await admin.query("delete from auth.mfa_factors where user_id=$1",[plain.user]);
 const pg=await actionGrant(plain,'password_change','test',{kind:'password',factor:null});await authorizeGrant(pg);
 await admin.query("insert into auth.mfa_factors(id,user_id,status) values($1,$2,'verified')",[plain.factor,plain.user]);
 await assert.rejects(consumeGrant(pg),/SECURITY_DENIED/);
});
test("sensitive-operation quota counts failed attempts across action types and revocation",async()=>{
 const f=await securityFixture();
 for(let i=0;i<5;i++){
  const g=await actionGrant(f,'password_change');
  await admin.query("select security_authorize_action($1,$2,$3,false)",[g.id,g.user,g.session]);
 }
 await assert.rejects(actionGrant(f),/SECURITY_RATE/);
 await assert.rejects(beginSecurity(f),/SECURITY_RATE/);
});
test("F01 recovery requires an owned unexpired single-use ticket plus MFA where enrolled",async()=>{
 const f=await securityFixture(), ticket='a'.repeat(64);
 await assert.rejects(actionGrant(f,'password_recovery','test',{recovery:ticket}),/SECURITY_RECOVERY_REQUIRED/);
 await admin.query("select security_issue_recovery($1,$2,$3)",[f.user,f.session,ticket]);
 await assert.rejects(actionGrant(f,'password_recovery','test',{kind:'recovery_link',factor:null,recovery:ticket}),/SECURITY_DENIED/);
 const g=await actionGrant(f,'password_recovery','test',{recovery:ticket});await authorizeGrant(g);await consumeGrant(g);
 assert.equal((await admin.query("select security_has_recovery($1,$2,$3) as ok",[f.user,f.session,ticket])).rows[0].ok,false);
 await assert.rejects(consumeGrant(g),/SECURITY_REPLAY/);
 await assert.rejects(admin.query("select security_issue_recovery($1,$2,$3)",[f.user,f.session,'b'.repeat(64)]),/duplicate key/);
 const plain=await securityFixture();await admin.query("delete from auth.mfa_factors where user_id=$1",[plain.user]);
 await admin.query("select security_issue_recovery($1,$2,$3)",[plain.user,plain.session,'c'.repeat(64)]);
 const pg=await actionGrant(plain,'password_recovery','test',{kind:'recovery_link',factor:null,recovery:'c'.repeat(64)});await authorizeGrant(pg);
 await admin.query("select security_prepare_password_change($1,$2,$3,'password_recovery',$4)",[pg.id,pg.user,pg.session,pg.hash]);
 await admin.query("select security_password_changed($1,$2,$3)",[pg.id,pg.user,pg.session]);
 assert.equal((await admin.query("select count(*)::int n from private.security_denied_sessions where user_id=$1",[plain.user])).rows[0].n,2);
 assert.equal((await admin.query("select count(*)::int n from private.security_events where user_id=$1 and kind='password_changed'",[plain.user])).rows[0].n,1);
 await admin.query("select security_password_changed($1,$2,$3)",[pg.id,pg.user,pg.session]);
});
test("expired recovery tickets and tickets from a different user/session cannot authorize",async()=>{
 const f=await securityFixture(),ticket=randomBytes(32).toString('hex');
 await admin.query("select security_issue_recovery($1,$2,$3)",[f.user,f.session,ticket]);
 assert.equal((await admin.query("select security_has_recovery($1,$2,$3) as ok",[f.user,f.user,ticket])).rows[0].ok,false);
 await admin.query("update private.security_recovery_tickets set expires_at=now()-interval '1 second' where token_hash=$1",[ticket]);
 await assert.rejects(actionGrant(f,'password_recovery','test',{recovery:ticket}),/SECURITY_RECOVERY_REQUIRED/);
});
test("F05 denied-session recovery uses a new login and new TOTP; reconciliation is idempotent and keeps history",async()=>{
 const f=await securityFixture(),op=await beginSecurity(f,'1'.repeat(64),'global');
 await admin.query("select security_consume_revocation($1,$2,$3)",[op,f.user,f.session]);
 assert.equal((await admin.query("select security_finish_revocation($1,$2,false) as done",[op,f.user])).rows[0].done,false);
 const denied=await asUser(f.user,'aal2',f.session);
 try {
  assert.equal((await denied.query("select get_current_session() as s")).rows[0].s,null);
  assert.equal((await denied.query("select * from farms")).rowCount,0);
 }finally{await denied.end();}
 await assert.rejects(beginSecurity(f,'2'.repeat(64),'global'),/SECURITY_DENIED/);
 await admin.query("update private.security_revocations set created_at=now()-interval '2 days' where id=$1",[op]);
 await admin.query("select security_prune()");
 assert.equal((await admin.query("select state from private.security_revocations where id=$1",[op])).rows[0].state,'pending');
 const newSession=randomUUID();await admin.query("insert into auth.sessions(id,user_id) values($1,$2)",[newSession,f.user]);
 const next=await beginSecurity({...f,session:newSession},'3'.repeat(64),'global');
 await admin.query("select security_consume_revocation($1,$2,$3)",[next,f.user,newSession]);
 await assert.rejects(admin.query("select security_consume_revocation($1,$2,$3)",[next,f.user,newSession]),/SECURITY_REPLAY/);
 // Only the isolated fixture simulates supported provider logout completing.
 await admin.query("delete from auth.sessions where user_id=$1",[f.user]);
 // Model response loss: no successful finish callback, then cron reconciliation.
 await admin.query("select security_reconcile_revocations()");await admin.query("select security_reconcile_revocations()");
 assert.deepEqual((await admin.query("select state from private.security_revocations where user_id=$1 order by created_at",[f.user])).rows.map(r=>r.state),['completed','completed']);
 assert.equal((await admin.query("select count(*)::int n from private.security_events where user_id=$1 and kind='sessions_revoked'",[f.user])).rows[0].n,2);
});
test("F04 freeze is lease-fenced, write-once and preserves the complete send payload across retries",async()=>{
 await admin.query("update private.support_outbox set sent_at=now() where sent_at is null and not delivery_hold");
 const f=await securityFixture();await observeSecurity(f.user,f.session);
 const job=(await admin.query("select transactional_email_jobs_v2(false,true) as jobs")).rows[0].jobs[0];assert.ok(job);
 const original={to:'security@example.test',from:'AgroMind <accounts@agromind.ir>',subject:'Original',html:'<p>2026</p>',text:'2026',language:'fa',version:'signature-premium-v1'};
 await assert.rejects(admin.query("select security_freeze_email($1,$2,$3)",[job.id,randomUUID(),original]),/EMAIL_LEASE_LOST/);
 assert.deepEqual((await admin.query("select security_freeze_email($1,$2,$3) as p",[job.id,job.lease,original])).rows[0].p,original);
 await admin.query("select support_email_ack($1,$2,false)",[job.id,job.lease]);
 await admin.query("update private.support_outbox set lease_until=now()-interval '1 second' where id=$1",[job.id]);
 const retry=(await admin.query("select transactional_email_jobs_v2(false,true) as jobs")).rows[0].jobs[0];
 assert.deepEqual(retry.deliveryPayload,original);
 const changed={...original,to:'other@example.test',subject:'New template',html:'<p>2027</p>',text:'2027',language:'en'};
 assert.deepEqual((await admin.query("select security_freeze_email($1,$2,$3) as p",[job.id,retry.lease,changed])).rows[0].p,original);
 await assert.rejects(admin.query("select security_freeze_email($1,$2,$3)",[job.id,job.lease,original]),/EMAIL_LEASE_LOST/);
});
test("native concurrent credential consumption and reconciliation have one mutation and one completion event",{skip:!native},async()=>{
 const f=await securityFixture(),g=await actionGrant(f,'username','race_username');await authorizeGrant(g);
 const a=await asUser(f.user,'aal2',f.session),b=await asUser(f.user,'aal2',f.session);
 try {
  const results=await Promise.allSettled([a.query("select security_change_username('race_username',$1,$2)",[g.id,g.hash]),b.query("select security_change_username('race_username',$1,$2)",[g.id,g.hash])]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  assert.equal((await admin.query("select count(*)::int n from private.security_events where user_id=$1 and kind='username_changed'",[f.user])).rows[0].n,1);
 } finally {await a.end();await b.end();}
 const op=await beginSecurity(f,'8'.repeat(64),'global');await admin.query("select security_consume_revocation($1,$2,$3)",[op,f.user,f.session]);
 await admin.query("delete from auth.sessions where user_id=$1",[f.user]);
 const x=postgres.getPgClient(),y=postgres.getPgClient();await x.connect();await y.connect();
 try {
  await Promise.all([x.query("select security_reconcile_revocations()"),y.query("select security_reconcile_revocations()")]);
  assert.equal((await admin.query("select count(*)::int n from private.security_events where user_id=$1 and kind='sessions_revoked'",[f.user])).rows[0].n,1);
 }finally{await x.end();await y.end();}
});
test("F02 native logout without app tombstones cannot restore sensitive-data access",async()=>{
 const f=await securityFixture(), foreign=await securityFixture();
 const current=await asUser(f.user,'aal2',f.session), remote=await asUser(f.user,'aal2',f.user), other=await asUser(foreign.user,'aal2',foreign.session);
 try {
  assert.equal((await admin.query("select count(*)::int n from private.security_denied_sessions where user_id=$1",[f.user])).rows[0].n,0);
  // Model supported native 'others' deletion, without any AgroMind authorization.
  // Fixture SQL is not a hosted Auth request and never runs against production.
  await admin.query("delete from auth.sessions where user_id=$1 and id<>$2",[f.user,f.session]);
  assert.equal((await remote.query("select get_current_session() as s")).rows[0].s,null);
  assert.equal((await remote.query("select * from profiles")).rowCount,0);
  assert.equal((await remote.query("select * from farms")).rowCount,0);
  await assert.rejects(create(remote,farm('native-revoked')),/AUTH_REQUIRED/);
  await assert.rejects(remote.query("select security_snapshot()"),/SECURITY_DENIED/);
  assert.ok((await current.query("select get_current_session() as s")).rows[0].s);
  assert.ok((await other.query("select get_current_session() as s")).rows[0].s);
  await admin.query("delete from auth.sessions where user_id=$1",[f.user]);
  assert.equal((await current.query("select get_current_session() as s")).rows[0].s,null);
  await assert.rejects(current.query("select complete_onboarding()"),/AUTH_REQUIRED|MFA_REQUIRED/);
  assert.ok((await other.query("select get_current_session() as s")).rows[0].s);
 } finally {await current.end();await remote.end();await other.end();}
});

test("F06 prepared credential mutation denies native snapshots before provider work",async()=>{
 const f=await securityFixture();
 const g=await actionGrant(f,'password_change','synthetic-password');
 await authorizeGrant(g);
 assert.equal((await admin.query("select security_prepare_password_change($1,$2,$3,$4,$5) as ok",[g.id,g.user,g.session,g.operation,g.hash])).rows[0].ok,true);
 assert.equal((await admin.query("select state from private.security_action_grants where id=$1",[g.id])).rows[0].state,'consumed');
 assert.equal((await admin.query("select password_result from private.security_revocations where id=$1",[g.id])).rows[0].password_result,'pending');
 const denied=await asUser(f.user,'aal2',f.session);
 try{assert.equal((await denied.query("select get_current_session() as s")).rows[0].s,null);}
 finally{await denied.end();}
 await assert.rejects(consumeGrant(g),/SECURITY_REPLAY/);
 await admin.query("select security_password_changed($1,$2,$3)",[g.id,g.user,g.session]);
 await admin.query("select security_password_changed($1,$2,$3)",[g.id,g.user,g.session]);
 assert.equal((await admin.query("select count(*)::int as n from private.security_events where user_id=$1 and kind='password_changed'",[f.user])).rows[0].n,1);
 const state=(await admin.query("select security_revocation_status($1,$2,$3) as v",[g.id,g.user,g.session])).rows[0].v;
 assert.equal(state.consumed,true);assert.equal(state.scope,'global');
});
test("F06 failed preparation rolls back consumption and denial; F08 reauth is throttled",async()=>{
 const f=await securityFixture(),g=await actionGrant(f,'password_change','synthetic-password');
 await authorizeGrant(g);
 await assert.rejects(admin.query("select security_prepare_password_change($1,$2,$3,$4,$5)",[g.id,g.user,g.session,g.operation,payloadHash('different')]),/SECURITY_REPLAY/);
 assert.equal((await admin.query("select state from private.security_action_grants where id=$1",[g.id])).rows[0].state,'verified');
 assert.equal((await admin.query("select count(*)::int as n from private.security_denied_sessions where user_id=$1",[f.user])).rows[0].n,0);
 assert.equal((await admin.query("select security_reserve_reauthentication($1,$2) as ok",[f.user,f.session])).rows[0].ok,true);
 await assert.rejects(admin.query("select security_reserve_reauthentication($1,$2)",[f.user,f.session]),/SECURITY_REAUTH_RATE_LIMIT/);
});
