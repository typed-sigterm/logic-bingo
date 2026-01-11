import { copyFile } from 'node:fs/promises';
import path from 'node:path';
import viteArrayBuffer from 'vite-plugin-arraybuffer';
import z3 from 'z3-solver/package.json';

export default defineNuxtConfig({
  compatibilityDate: '2026-01-05',

  modules: [
    '@nuxt/ui',
  ],

  app: {
    head: {
      htmlAttrs: { lang: 'zh-CN' },
      meta: [
        { name: 'referrer', content: 'no-referrer' },
      ],
      title: 'Logic Bingo',
      script: [
        { src: '/z3-built.js' },
      ],
      noscript: [
        { innerHTML: 'Please enable JavaScript to view this website.' },
      ],
    },
  },

  ssr: false,

  css: ['~/app.css'],

  routeRules: {
    '**': {
      headers: {
        // to enable SharedArrayBuffer
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },
    '/': {
      redirect: '/solve',
    },
    '/z3-built.wasm': {
      redirect: `https://registry.npmmirror.com/z3-solver/${z3.version}/files/build/z3-built.wasm`,
    },
  },

  devServer: {
    port: 9308,
  },

  hooks: {
    'nitro:build:public-assets': async (nitro) => {
      copyFile(
        path.resolve(import.meta.dirname, 'node_modules/z3-solver/build/z3-built.js'),
        path.resolve(nitro.options.output.publicDir, 'z3-built.js'),
      );
    },
  },

  vite: {
    plugins: [
      viteArrayBuffer(),
    ],
  },

  fonts: {
    provider: 'bunny',
    providers: {
      google: false,
      googleicons: false,
    },
  },
});
