import z3 from 'z3-solver/package.json';

export default defineNuxtConfig({
  compatibilityDate: '2026-01-05',

  modules: [
    '@nuxt/ui',
  ],

  app: {
    head: {
      htmlAttrs: { lang: 'zh-CN' },
      title: 'Logic Bingo',
      script: [
        { src: `https://registry.npmmirror.com/z3-solver/${z3.version}/files/build/z3-built.js` },
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
    '/z3-built.wasm': {
      redirect: `https://registry.npmmirror.com/z3-solver/${z3.version}/files/build/z3-built.wasm`,
    },
  },

  devServer: {
    port: 9308,
  },

  fonts: {
    provider: 'bunny',
    providers: {
      google: false,
      googleicons: false,
    },
  },
});
