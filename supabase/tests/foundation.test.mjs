import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import net from "node:net";
import { randomUUID, randomBytes } from "node:crypto";
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
function wasmClient(user, level = "aal1", sessionId = user) {
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
          JSON.stringify({ sub: user, aal: level, session_id: sessionId }),
        ]);
        return wasmResult(await tx.query(sql, values));
      });
    },
  };
}
let postgres, admin, directory;
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
async function asUser(user, level = "aal1", sessionId = user) {
  if (!native) return wasmClient(user, level, sessionId);
  const client = postgres.getPgClient();
  await client.connect();
  await client.query("set role authenticated");
  await client.query("select set_config('request.jwt.claim.sub',$1,false)", [
    user,
  ]);
  await client.query("select set_config('request.jwt.claims',$1,false)", [
    JSON.stringify({ sub: user, aal: level, session_id: sessionId }),
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
    create table auth.sessions (id uuid primary key,user_id uuid references auth.users(id),created_at timestamptz default now(),not_after timestamptz);
    create function auth.test_session() returns trigger language plpgsql as 'begin insert into auth.sessions(id,user_id) values(new.id,new.id); return new; end';
    create trigger test_session after insert on auth.users for each row execute function auth.test_session();
    create table auth.mfa_factors (id uuid primary key, user_id uuid references auth.users(id), status text not null);
    create function auth.uid() returns uuid language sql stable as 'select nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';
    create function auth.jwt() returns jsonb language sql stable as 'select coalesce(nullif(current_setting(''request.jwt.claims'',true),''''),''{}'')::jsonb';
    grant usage on schema auth to authenticated,anon;
    grant execute on function auth.uid() to authenticated,anon;
    grant execute on function auth.jwt() to authenticated,anon;
  `);
    for (const file of (await readdir("supabase/migrations"))
      .filter((n) => n.endsWith(".sql"))
      .sort())
      await (native
        ? admin.query(
            await readFile(path.join("supabase/migrations", file), "utf8"),
          )
        : embedded.exec(
            await readFile(path.join("supabase/migrations", file), "utf8"),
          ));
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

    // Reissuing the same farm/email rotates the token and role without another
    // seat. The old token immediately becomes invalid.
    const rotated = (
      await owner.query(
        "select create_farm_invitation('invite-a',$1,'viewer',$2) as invitation",
        [inviteeEmail, hashB],
      )
    ).rows[0].invitation;
    assert.equal(rotated.id, created.id);
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
    assert.equal(accepted.role, "viewer");
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
