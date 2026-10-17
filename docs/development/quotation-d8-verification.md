# Quotation persistence: D8 verification checkpoint

Verified on 2026-10-16. The approved [D8 gate](../architecture/workflow-contracts.md#d8--transaction-verification-gate) **passed for the configured isolated local WorkNest replica set** before affected quotation persistence edits began. The original standalone finding and earlier stopped setup attempts are retained below; the final executed result and lifecycle instructions supersede those intermediate states. This is development-environment evidence, not evidence about production or a claim that existing application services were already transactional.

## Initial configured environment: standalone, before approved isolation

The configured connection came from `backEnd/.env`; no process-level `MONGO_URI` override was present. Only read-only `hello` and `buildInfo` commands were issued to that connection. No URI, credentials, hostname or database name were printed, and no configured-database records were written.

| Evidence | Observed value |
|---|---|
| Configured endpoints | Single endpoint; loopback only |
| MongoDB version | 8.2.2 |
| Logical sessions | Supported; 30-minute timeout |
| Replica-set member | No |
| mongos | No |
| Standalone | Yes |
| Writable primary flag | Yes |
| Multi-document transaction topology | Unsupported in this configuration |

**Initial result:** the standalone connection failed D8. Sessions alone did not establish transaction support. Persistence changes were held until the explicitly approved isolation and successful verification recorded below resolved this gate; a disposable test alone did not override it.

Read-only process/config inspection identified:

- Executable: `/opt/homebrew/opt/mongodb-community/bin/mongod`.
- Configuration: `/opt/homebrew/etc/mongod.conf`; sections are `systemLog`, `storage`, `net`, with no `replication` section.
- Data directory: `/opt/homebrew/var/mongodb`.
- Log: `/opt/homebrew/var/log/mongodb/mongo.log`.
- LaunchAgent: `/Users/deepanshusaini/Library/LaunchAgents/homebrew.mxcl.mongodb-community.plist`.
- Running launch label: `homebrew.mxcl.mongodb-community`, in `gui/501`; `RunAtLoad=true`, `KeepAlive=false`.
- The process has no `--replSet` flag; the configured bind addresses are loopback only.
- `/opt/homebrew/bin/mongodump` and `/opt/homebrew/bin/mongorestore` are available. `mongosh` is absent; the installed Node MongoDB driver can perform initialization/verification without a new dependency.

`brew services list --json` did not list the running MongoDB job; `launchctl list` and the existing LaunchAgent established its actual control mechanism. That Homebrew metadata command automatically refreshed its API cache. No MongoDB configuration, LaunchAgent, application environment or service state was changed.

## Disposable transaction capability proof

Executed `node /private/tmp/worknest-d8-disposable-proof.cjs` against a fresh `MongoMemoryReplSet` on loopback, with a new database. It loaded the existing Quotation and QuotationItem schemas, without connecting to the configured database or calling current application persistence services. MongoDB version: 8.2.1; replica-set membership and logical sessions verified.

All four assertions passed:

1. A committed transaction persists both header and item.
2. A deliberately thrown failure after staging both writes leaves neither new header nor item.
3. Failure validating a replacement item after updating the header and deleting old items restores the original header, original item set and timestamps.
4. Successful replacement commits a complete item set whose line total matches the header total.

The disposable connection and replica-set processes were closed. This proves transaction capability and the schema-level rollback mechanism in the fixture only; application-level failure/concurrency tests remain necessary after implementation.

## Initial local-conversion proposal: superseded by isolation decision

Proposed replica-set name: `worknest-dev`. Use the existing loopback listener and port; do not expose MongoDB on another interface or introduce authentication/deployment changes. This is a single-node development replica set, not a high-availability deployment.

The following is a reviewable procedure, **not work already performed**:

1. Obtain explicit approval for the local MongoDB restart, configuration change and replica-set initialization. Confirm this local instance is not serving another active workflow; stop application processes/other writers for the backup window.
2. Create a private backup directory (for example, `umask 077` followed by `mktemp -d /private/tmp/worknest-d8-backup.XXXXXX`), record its path, and verify sufficient free space. Copy the existing MongoDB config, LaunchAgent and `backEnd/.env` into it without printing secrets. Preserve file permissions. The available dump/restore tools permit an optional logical backup; do not pass a credential-bearing URI through command-line arguments or logs.
3. Stop the exact existing job with `launchctl bootout "gui/$(id -u)" "$HOME/Library/LaunchAgents/homebrew.mxcl.mongodb-community.plist"`. Confirm the process has exited and the configured listener has closed before copying data. Do not force-kill a still-running database to speed up the procedure.
4. Make an offline copy of `/opt/homebrew/var/mongodb` into the private backup directory (for example with `ditto`), and confirm the copy completed. This is the rollback point for all existing local records. Do not proceed if a complete backup cannot be established.
5. Add only the following top-level configuration, preserving the existing storage/log/network settings:

   ```yaml
   replication:
     replSetName: worknest-dev
   ```

6. Restart the existing job with `launchctl bootstrap "gui/$(id -u)" "$HOME/Library/LaunchAgents/homebrew.mxcl.mongodb-community.plist"`. Check its existing log without exposing sensitive data. Use the installed Node MongoDB driver and the existing configured connection with `directConnection: true` for the one-time `replSetInitiate` command. Supply `_id: "worknest-dev"` and one member at the **existing loopback listener/port**; do not infer or print the full application URI. No `mongosh` installation is required.
7. Wait for a writable primary. If the application URI needs an explicit `replicaSet=worknest-dev` option, preserve its credentials, database and existing options and keep the pre-change environment backup. Do not expose the URI in output.
8. Repeat sanitized `hello`/`buildInfo` inspection through the intended application connection. Require the expected replica-set name, logical sessions and writable primary. Re-run disposable rollback checks and the eventual application-level transaction/failure tests before declaring the persistence group verified. If any prerequisite fails, stop rather than falling back to separate header/item writes.

Config/data/service operations outside the workspace will require the environment's filesystem/tool approval as well as the explicit D8 decision. No such operations have been performed at this checkpoint.

## Reversal procedure for the initial proposal

Before accepting new business writes, stop the application and boot out the MongoDB job as above. Preserve the post-attempt data directory separately for diagnosis; do not delete it. Restore the backed-up data directory **while MongoDB is stopped**, restore the original config and any changed environment/LaunchAgent, and bootstrap the original job. Verify the original connection and standalone topology. Use the offline backup to restore an exact pre-conversion state rather than relying only on removing `replSetName` after replica-set metadata has been created.

Restoring this backup would discard writes made after the backup, so keep application writes paused until conversion and the gate are accepted. The main operational cost is the brief local database outage plus backup time; no production deployment or business-data migration is proposed.

## Approved isolation direction and resolved startup checkpoint

The subsequent read-only sharing check found two other non-system databases alongside the configured WorkNest database. Exclusive use was therefore not proven. The user's conditional approval selects a separate local WorkNest replica set in this situation; the existing shared MongoDB service/configuration/data must remain unchanged. The initial in-place conversion procedure above is not being executed.

The isolated setup uses `.worknest-local/mongodb/` for its private config, log and data, and `.worknest-local/backups/` for restricted-permission backup artifacts. The new root `.gitignore` entry excludes that entire directory. The proposed listener is loopback port 27018, with replica-set name `worknest-dev`.

Executed progress:

1. Verified byte-identical private backups of the original MongoDB configuration, existing LaunchAgent and `backEnd/.env`.
2. Computed private source manifests for all eight application collections, including document counts, SHA-256 content digests in `_id` order and index specifications.
3. Created a nonempty WorkNest-only `mongodump` archive. A second source snapshot matched, proving the source was stable during the dump. The archive still needs restore-and-compare verification before being described as a fully verified data backup.
4. Attempted startup using only the new isolated configuration. MongoDB rejected `processManagement.fork` during option validation: `Server fork+exec via --fork or processManagement.fork is incompatible with macOS`.

**Result at that checkpoint:** stopped at this startup failure, before any isolated database listener, replica-set initialization, restore, application-environment switch or quotation persistence change. The original shared instance remained running unchanged. The failed startup did not pass D8; the subsequent explicit approval and passing checks are recorded below.

The startup compatibility correction requires the user's checkpoint approval: remove only `processManagement.fork` from the new isolated config and launch this new process as a detached Node child with private log output. Preserve its loopback binding, port, data path, PID path and replica-set name. After approval, retry startup, restore the WorkNest-only archive, compare content/counts/indexes with the private source manifest, verify the original source/configuration remains unchanged, and run transaction commit/rollback plus Admin Task/Quotation HTTP checks against a separate disposable database on the isolated replica set. Switch only WorkNest's backend connection after every gate succeeds.

The earlier dump command also needed its optional archive argument expressed as `--archive=<path>`. That command-line parsing failure occurred before a dump; it was corrected and the backup stage then succeeded. Neither failure wrote records to the original database.

For the isolated approach, reversal leaves the shared service intact: stop only the isolated process, restore `backEnd/.env` from its private backup if it was later switched, and preserve the isolated directory and archive for review. No overwrite/restore of the original shared data directory is required.

## Final executed result: D8 passed

The user explicitly approved removing the unsupported fork setting from the new isolated config and launching only that instance as a managed detached process. The existing Homebrew service was not changed or restarted.

| Final capability | Verified value |
|---|---|
| MongoDB | 8.2.2; existing executable |
| Listener | `127.0.0.1:27018` only |
| Replica set | `worknest-dev` |
| State | Writable primary; logical sessions supported |
| Private config/data/log directory | `.worknest-local/mongodb/` |
| Lifecycle helper | `backEnd/scripts/local-mongodb.cjs` |
| Original shared instance | Unchanged writable standalone |

Verified backup directory: `.worknest-local/backups/d8-1792164939907/`. It contains the original backend environment, MongoDB config and LaunchAgent, the WorkNest-only archive and private verification manifests. Private directories use mode 0700 and backup/config metadata use mode 0600. The complete `.worknest-local/` tree is ignored by Git.

The archive was restored into the isolated instance. All **eight** application collections matched source document counts, SHA-256 content digests in `_id` order and index specifications. A repeated source snapshot confirmed that the source had not changed. No business records were written in the original or cloned WorkNest database by verification.

The actual isolated 8.2.2 instance then passed **eight** gate checks:

1. Intended connection reaches the expected writable replica-set primary with logical sessions.
2. A transaction commits both quotation header and item.
3. A deliberate failure after staging both writes leaves neither new record.
4. Invalid replacement-item validation after updating a header/deleting items restores the original header, item set and timestamps.
5. Active Admin/Employee login and safe read-self profile work through the actual HTTP application.
6. Admin Task create/list/assignment/editing, Employee status update and reassignment access changes work through HTTP.
7. Admin Quotation create/list/edit/details/approval, Employee submission/read and approved-edit denial work through HTTP.
8. Original and cloned WorkNest collection contents/counts/indexes remain unchanged after all tests.

All test writes used a new disposable database on the isolated replica set. That database was dropped and its absence verified. Only then was WorkNest's untracked `backEnd/.env` `MONGO_URI` switched to the isolated connection, preserving every other environment value. That exact configured connection was checked again and reached the expected writable primary. Existing business records remain intact.

The lifecycle helper's graceful stop/start cycle also passed. The restarted isolated instance returned to writable primary; all eight cloned collection manifests still matched. The shared instance was again verified unchanged and writable. This is a single-node development replica set, not a high-availability deployment. New writes in the isolated database will not appear automatically in the original copy.

One-time verification artifacts are `/private/tmp/worknest-d8-disposable-proof.cjs`, `/private/tmp/worknest-d8-resume.cjs` and `/private/tmp/worknest-d8-configured-gate.cjs`; sanitized results are stored privately in `.worknest-local/mongodb/gate-result.json`. Do not rerun clone/initialization against the existing isolated directory. Application-level transaction/failure/concurrency regressions remain required when implementing the persistence changes; schema-level probes alone do not replace those tests.

## Routine local startup, shutdown and cleanup

From `backEnd`:

```sh
node scripts/local-mongodb.cjs start
node scripts/local-mongodb.cjs status
npm start
```

Start the frontend using the existing instructions. The helper reads the private reviewed setup; it does not initialize a new database, restore data, modify environment files or control Homebrew services. It has no automatic boot/login registration, so run `start` after a machine restart. Repeated `start` is harmless when the tracked instance is already healthy.

After stopping application writers:

```sh
node scripts/local-mongodb.cjs stop
```

The helper verifies that the tracked PID belongs to the exact isolated executable/config path before sending SIGTERM, waits for graceful exit and preserves data/config/backups. It refuses reused PIDs or a different listener. No forced kill or original service control is attempted. Inspect `mongod.log` and `launcher.log` privately on failure; stop for review rather than falling back to separate quotation writes.

### Same-machine reboot and stale PID metadata

The private config, state and data directory survive an ordinary machine restart. There is no automatic boot/login registration: run `node scripts/local-mongodb.cjs start` from `backEnd` after reboot, then require a healthy `status` before starting the application. A graceful stop/start check is evidence of process restart compatibility, not evidence that an actual operating-system reboot was performed.

Normally, PID metadata refers to an exited process and the helper starts the existing isolated data directory. An operating system can reuse an old PID for another process. The helper deliberately refuses to control that process; it does not kill an unrelated process or silently delete metadata.

If startup reports a tracked-PID problem:

1. Read only `.worknest-local/mongodb/launcher.pid` and `mongod.pid`. For each recorded numeric PID, inspect `ps -p <tracked-pid> -o pid=,command=` and compare the executable/config arguments with the isolated paths above. Inspect the listener with `lsof -nP -iTCP:27018 -sTCP:LISTEN`.
2. If an isolated `mongod` is already running with this exact config, or port 27018 already has a listener, do not remove metadata and do not start a duplicate. Verify the owner/topology and resolve the inconsistency before continuing. Do not stop another application's listener.
3. Only when neither recorded PID belongs to a running isolated process **and port 27018 has no listener**, preserve the stale `launcher.pid`/`mongod.pid` files in a private dated recovery directory, then remove only those two stale metadata entries from their active location. Leave `state.json`, `mongod.conf`, all logs, database files, locks and backups untouched.
4. Run the helper's `start` and `status` commands again. Require the expected `worknest-dev` writable primary. Stop for review if this fails; do not remove database locks/data to force startup.

This recovery applies to the existing setup on the same computer. A fresh clone does not contain the ignored private MongoDB config/state/data or backend environment and needs its own reviewed replica-set setup. The one-time verification artifacts in `/private/tmp` are not a portable bootstrap installer.

### M2 runtime compatibility follow-up

After normal application checks completed and fixture writers were stopped, a second coordinated **isolated-only** graceful stop/start passed with the existing backend/frontend processes left in place. All eight current isolated collections were snapshotted immediately before and after the restart, including the Counter's then-current sequence values. Their document counts, SHA-256 content digests and index specifications were identical across restart.

The helper's `stop`, `start` and `status` checks passed. The exact configured connection returned to MongoDB 8.2.2, `worknest-dev` writable primary with logical sessions. Backend environment bytes did not change. The original shared instance remained a writable standalone; its eight collection manifests, MongoDB config and LaunchAgent still matched the pre-D8 backup.

This verifies a process restart on the same machine, **not an actual operating-system reboot**. Post-restart application reconnection subsequently passed: fresh `npm start` used the exact backend environment without database/JWT overrides, and the normal frontend/backend browser checks passed all 11 assertions. Fixtures were cleaned; the seven pre-existing business collections remained byte-hash stable. The quotation Counter advanced by three numbers per review run (six across both runs) and was not rewound. See [M2 runtime compatibility](m2-runtime-compatibility.md) for the application evidence.

A final read-only verification after those tests again confirmed that all eight original shared collections, their indexes, MongoDB config and LaunchAgent matched the pre-D8 backups, with the original instance still a writable standalone. Sanitized restart results are in `.worknest-local/mongodb/runtime-restart-result.json`, with private before/after manifests beside it. The one-time restart check was `/private/tmp/worknest-m2-restart-check.cjs`.

To reverse the connection change, stop application writers and the isolated instance. Preserve any later isolated writes with a new verified backup or preserve its entire stopped data directory. Restore `backEnd/.env` from the verified private `backend.env` backup, preserving permissions, then verify the original connection. No restoration of the original shared MongoDB service/config/data is necessary because none was modified.

For cleanup, verify the isolated process has stopped, then deliberately archive/move its directory and backup directory. Review later business writes before deleting local artifacts, and retain a verified recovery copy. Do not remove active data, lock files or the only backup to work around startup errors. Cleanup must not touch `/opt/homebrew/var/mongodb`, the original MongoDB config or its LaunchAgent.
