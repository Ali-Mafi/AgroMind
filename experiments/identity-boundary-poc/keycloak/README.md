# Real Keycloak 26.8.1 disposable direct-API lab

**Research only. NEVER wire this to AgroMind production Auth.**

The [dedicated GitHub Actions workflow](../../../.github/workflows/identity-keycloak-lab.yml) runs unmodified open-source Keycloak inside a single isolated `ubuntu-latest` runner with ephemeral H2 storage. The test uses localhost-only ports and secrets/identities generated per run. No production app, Supabase, OAuth credentials or paid provider account is touched.

The test script is `lab.mjs`. Usage in a controlled, disposable Node 22+ + Docker environment:

```sh
node --check experiments/identity-boundary-poc/keycloak/lab.mjs
node experiments/identity-boundary-poc/keycloak/lab.mjs --prepare
# Start quay.io/keycloak/keycloak:26.8.1 start-dev --import-realm
# with a read-only mount from $RUNNER_TEMP/agromind-keycloak-lab/import
# into /opt/keycloak/data/import and port 127.0.0.1:18080:8080
node experiments/identity-boundary-poc/keycloak/lab.mjs --test
```

**No `docker run` command in this README is a production installation instruction**; inspect the exact CI workflow. Credentials generated under the runner temp dir must never be committed or uploaded.

Expected research finding: if native `DELETE /realms/agromind-idp-lab/account/sessions?current=false` acts on two authenticated MFA sessions without fresh operation-specific TOTP, mark **F02 provider-native enforcement FAIL** even when the workflow is green. Real OIDC/JWKS verification is separate from a hosted Supabase integration.

[Full evidence and limitations](../../../docs/SECURITY_KEYCLOAK_LIVE_API_LAB.md).
