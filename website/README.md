# Native UIX documentation website

Run Node 24. From the repository root:

```sh
npm --prefix website ci
npm run docs:dev
```

Build with `npm run docs:build`. Preview the static output with
`npm run docs:preview`. Output: `website/.vitepress/dist`.

The predev/prebuild hook mirrors canonical public `docs/*.md` into the ignored
`reference/` directory. Edit those original files rather than generated copies;
restart dev after changing canonical reference Markdown. Website-specific guides,
status and gallery pages live here. No private planning content is imported.

The default base is `/`. Build for a subpath with `DOCS_BASE=/native-uix/ npm run docs:build`.
The site is prepared locally; no deployment or publication occurs in these scripts.
Capture slots are reserved; publication of native screenshots is deferred.

## GitHub Actions

`CI` runs library tests, typecheck and package-content checks, example TypeScript
and zero-warning ESLint, native example builds and packed-consumer jobs on push
and pull requests. It can also be run manually. Native builds are not device
acceptance or a performance benchmark.

`Docs` installs the website lockfile and builds with `/native-uix/` as its base
path on relevant pushes/PRs or manual dispatch. VitePress rejects dead internal
Markdown links. Every build uploads a seven-day `documentation-site` artifact.
PRs never deploy. On main, deployment requires Settings → Pages → Source:
GitHub Actions; otherwise the build succeeds with a configuration warning.
The intended Pages URL is `https://bear-block.github.io/native-uix/`.
No daily sponsor refresh is needed because the sponsor page is static.

The workflows are source configuration until a hosted run completes. Local
builds do not establish that GitHub runner toolchains or Pages are configured.
