import {defineConfig} from 'vitepress';

export default defineConfig({
  title: 'Native UIX',
  description: 'Native controls and navigation for React Native. UIKit on iOS, Material on Android.',
  lang: 'en-US',
  base: process.env.DOCS_BASE || '/',
  cleanUrls: true,
  lastUpdated: true,
  head: [['link', {rel: 'icon', href: `${process.env.DOCS_BASE || '/'}mark.svg`}]],
  themeConfig: {
    logo: '/mark.svg',
    search: {provider: 'local'},
    outline: [2, 3],
    nav: [
      {text: 'Guide', link: '/guide/getting-started'},
      {text: 'Components', link: '/components/'},
      {text: 'Capture plan', link: '/guide/gallery'},
      {text: 'Status', link: '/project/status'},
    ],
    sidebar: [
      {text: 'Start here', items: [
        {text: 'Introduction', link: '/guide/introduction'},
        {text: 'Run the example', link: '/guide/getting-started'},
        {text: 'Native specs & behaviors', link: '/guide/native-specs'},
        {text: 'Configuration', link: '/reference/CONFIGURATION'},
        {text: 'Capture plan', link: '/guide/gallery'},
      ]},
      {text: 'Components', items: [
        {text: 'Overview', link: '/components/'},
        {text: 'Button', link: '/reference/BUTTON'},
        {text: 'TextField', link: '/reference/TEXT-FIELD'},
        {text: 'Switch & SegmentedControl', link: '/components/selection'},
        {text: 'Lists & Form', link: '/reference/LISTS-AND-FORMS'},
        {text: 'Sheet', link: '/components/sheet'},
        {text: 'TabContent & motion', link: '/components/motion'},
      ]},
      {text: 'Navigation', items: [
        {text: 'Stack, Tabs & restoration', link: '/reference/NAVIGATION'},
        {text: 'API reference', link: '/reference/API-PROPOSAL'},
      ]},
      {text: 'Project', items: [
        {text: 'Implementation status', link: '/project/status'},
        {text: 'Not implemented yet', link: '/project/coverage'},
        {text: 'Compatibility', link: '/reference/COMPATIBILITY'},
        {text: 'Contributing', link: '/CONTRIBUTING'},
      ]},
    ],
    socialLinks: [{icon: 'github', link: 'https://github.com/bear-block/native-uix'}],
    footer: {message: 'Experimental · New Architecture only', copyright: 'Native UIX · MIT License'},
  },
});
