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
