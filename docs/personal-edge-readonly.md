# Personal Edge / read-only integration (2026-10-10)

This fork preserves upstream `main` at `24136945847afbfad266c6c46a8cd335377f9112` and the rollback branch `baseline/upstream-2026-10-10`. The installed CLI identifies itself as `1.8.8-yuumi.1`. `upstream` tracks jackwener/OpenCLI; `origin` is yuumiqwq/OpenCLI. No upstream pull request, comment, scheduled sync, or scheduled update is created.

## Reviewed changes

| Source | Decision | Reason / boundary |
| --- | --- | --- |
| [PR 2563](https://github.com/jackwener/OpenCLI/pull/2563), `73191a45aa9d173bb3c045d19bd6ee21bd65a5eb` | Adopted | Select visible, interactive filter chips; reject transparent or hidden duplicates. Original ambiguity rejection stays intact. |
| [PR 2572](https://github.com/jackwener/OpenCLI/pull/2572), `04158f3e6f85b1f572d662f12a9c2b69a47c358f` | Adopted | Require the published extension Origin, or a specifically configured sideload ID. Missing and unrelated origins are rejected by real-daemon tests. |
| [PR 2594](https://github.com/jackwener/OpenCLI/pull/2594), `006c597995b0e3f5ed1f667b460383e37695401b` | Partially adopted | Keep CAPTCHA/security-page recognition, AI-chat filter selectors, and inner-container scrolling. Preserve upstream direct search navigation. The proposed explore/search-button navigation has no login-wall result, so logged-out search can become a navigation timeout; no authenticated Edge session was available to justify that broader behavior change. |
| [PR 2583](https://github.com/jackwener/OpenCLI/pull/2583), `e2ea2ca31d8bfc1d2b8f9c42d27b29e81612751d` | Plugin checks only | Apply plugin-name containment on installation and removal; add update protection and Windows drive-relative paths, alternate streams, device names, and trailing alias checks. |

The HTTP token part of PR 2583 is deferred. It leaves the extension's `/status` request, uninstall hook, and existing raw HTTP tests sending the old literal header. Token creation is read-then-write (concurrent creators can disagree), treats all read errors as absence, and follows existing filesystem links. `chmod(0600)` is not a Windows ACL guarantee. The patch does not authenticate the WebSocket channel. Applying it wholesale would misrepresent the security coverage and require a coordinated protocol migration.

The additional production dependency change pins `undici` to `7.30.0` in package.json and both lockfiles. The npm audit initially reported one high-severity production package; after the change it reports zero production vulnerabilities. See the [official release](https://github.com/nodejs/undici/releases/tag/v7.30.0) and [upstream advisory](https://github.com/nodejs/undici/security/advisories/GHSA-w293-vg96-wgc3). This does not assert that every advisory is exercised by OpenCLI.

## Local validation

Windows, Node `24.19.0`, npm `11.17.0`:

- Baseline: typecheck, build, and all 64 search tests passed.
- Selected integration: typecheck and build passed; the generated manifest retains 1,366 commands.
- Focused adapter/core tests: 486 passed, 0 failed, 0 skipped, across 26 files (Xiaohongshu, plugin, extension-origin, daemon client, and network configuration).
- Real daemon with a scripted fake extension: 10 passed, 0 failed, 0 skipped. This verifies loopback transport and rejected Origin handshakes, not a real Edge extension or website account.
- Plugin fixtures use Windows directory junctions, matching production, without requiring extra symbolic-link privileges. Tests run with a child-process-only temporary home, isolated from user plugins.
- Installed CLI: version/help/list checks and `validate xiaohongshu` passed (25 commands; 0 errors/warnings). A public Hacker News API smoke command returned three items.
- `doctor` starts the local daemon successfully but reports **extension not connected / connectivity failed**. Its process exit code is zero even in this state; the report contents, not the exit code, determine readiness. The diagnostic daemon was stopped afterward.

Dependencies were installed with lifecycle scripts disabled, and the local tarball was installed with `--ignore-scripts`. The distributable bundles the tested production dependencies and adds `npm-shrinkwrap.json` from the reviewed npm lockfile. An initial global installation demonstrated range drift in turndown/ws, including when shrinkwrap alone was present; it was replaced with this bundled artifact and checked against the tested dependency versions. No remote adapter-fetch installer was run. This package was not published to npm.

The workflow `Personal Edge read-only checks` runs only on this personal branch's pushes or explicit dispatch. It has read-only repository permissions, no schedule, and Windows/Linux jobs for the focused tests and daemon contracts. Check the actual run results in GitHub; creation of a workflow is not a passing result.

## Browser handoff and residual risks

CLI installation, extension connection, site login, and a successful real search are separate stages. Real Xiaohongshu search and note extraction remain unverified: the observed Edge page requested login when a read-only search was submitted, and no OpenCLI bridge connected. No posting, liking, commenting, private download, or CAPTCHA solving was performed.

The browser tool cannot visit `edge://extensions`; do not work around this policy with raw browser commands or profile edits. Extension installation/permission decisions and site login are a user handoff.

The official [OpenCLI extension](https://chromewebstore.google.com/detail/opencli/ildkmabpimmkaediidaifkhjpohdnifk) has ID `ildkmabpimmkaediidaifkhjpohdnifk`, accepted by this fork. Its reviewed manifest declares `debugger`, `tabs`, `cookies`, `activeTab`, `alarms`, `storage`, `tabGroups`, `downloads`, and `<all_urls>`. It is a general browser bridge, not a technically restricted read-only Xiaohongshu extension. `debugger` is particularly powerful; restricting host access alone is not a complete tab-control boundary. No new persistent browser permission was granted in this task. A dedicated Edge profile containing only intended site sessions reduces exposure if the user approves installation. An unpacked extension gets a different ID and needs its exact observed ID in `OPENCLI_ALLOWED_EXTENSION_IDS`; never allow arbitrary extension IDs.

After the user approves the extension's actual permissions and signs into Xiaohongshu in the same Edge profile:

```powershell
opencli doctor
opencli profile list
opencli xiaohongshu search "深圳图书馆" --limit 3 -f json
opencli xiaohongshu note "<full URL returned by search, including xsec_token>" -f json
opencli daemon stop
```

Stop at login/security challenges and return them to the user. Verify nonempty, deduplicated search rows and actual note text before describing site functionality as working. This combination retains the existing 1–100 limit, scrolling budget, and deduplication; it does not attempt a search rewrite.

Origin allowlisting is not cryptographic authentication against local clients that can forge HTTP/WebSocket headers. HTTP still uses the upstream non-secret `X-OpenCLI` header. Untrusted local processes remain a risk; plugins are executable Node code, not sandboxed data. The previously identified Xiaohongshu media-download Cookie-domain issue is outside this change and remains unresolved; the scoped search/note commands do not use that download path.

## Recovery

The baseline branch and upstream remote remain available. The local installation tarball and SHA-256 are retained in task evidence; reinstall that exact tarball with `npm install -g --ignore-scripts <tarball>`. A plain npm update from the upstream package can replace the personal fixes. Do not use force-push to update this fork or silently change browser permissions during maintenance.
