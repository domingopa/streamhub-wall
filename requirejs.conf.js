require.config({
  paths: {
    jquery: 'lib/jquery/jquery',
    text: 'lib/requirejs-text/text',
    base64: 'lib/base64/base64',
    hogan: 'lib/hogan/web/builds/2.0.0/hogan-2.0.0.amd',
    hgn: 'lib/requirejs-hogan-plugin/hgn',
    jasmine: 'lib/jasmine/lib/jasmine-core/jasmine',
    'jasmine-html': 'lib/jasmine/lib/jasmine-core/jasmine-html',
    'jasmine-jquery': 'lib/jasmine-jquery/lib/jasmine-jquery',
    'event-emitter': 'lib/event-emitter/src/event-emitter',
    inherits: 'lib/inherits/inherits',
    mout: 'lib/mout/src',
    json: 'lib/requirejs-plugins/src/json',
    debug: 'lib/debug/debug',
    rework: 'lib/rework/rework',
    observer: 'lib/observer/src/observer'
  },
  packages: [{
    name: "streamhub-wall",
    location: "./src"
  },{
    name: "streamhub-sdk",
    location: "lib/streamhub-sdk/src/"
  },{
    name: "streamhub-sdk/modal",
    location: "lib/streamhub-sdk/src/modal"
  },{
    name: "streamhub-sdk/collection",
    location: 'lib/streamhub-sdk/src/collection'
  },{
    name: "streamhub-sdk/auth",
    location: 'lib/streamhub-sdk/src/auth'
  },{
    name: "streamhub-sdk/content",
    location: 'lib/streamhub-sdk/src/content'
  },{
    name: 'streamhub-sdk-tests',
    location: 'lib/streamhub-sdk/tests/'
  },{
    name: "stream",
    location: "lib/stream/src"
  },{
    name: "view",
    location: "lib/view/src",
    main: "view"
  },{
    name: 'auth',
    location: 'lib/auth/src'
  },{
    name: 'livefyre-auth',
    location: 'lib/livefyre-auth/src'
  },{
    name: 'streamhub-input',
    location: 'lib/streamhub-input/src',
    main: 'javascript/main'
  },{
    name: 'streamhub-editor',
    location: 'lib/streamhub-editor/src/javascript'
  },{
    name: 'streamhub-editor/templates',
    location: 'lib/streamhub-editor/src/templates'
  },{
    name: "css",
    location: "lib/require-css",
    main: "css"
  },{
    name: "less",
    location: "lib/require-less",
    main: "less"
  }],
  shim: {
    jquery: {
        exports: '$'
    },
    jasmine: {
        exports: 'jasmine'
    },
    'jasmine-html': {
        deps: ['jasmine'],
        exports: 'jasmine'
    },
    'jasmine-jquery': {
        deps: ['jquery', 'jasmine']
    },
    rework: {
        exports: 'rework'
    }
  },
  css: {
    clearFileEachBuild: 'dist/streamhub-wall.min.css',
    transformEach: {
      requirejs: 'tools/prefix-css-requirejs',
      node: 'tools/prefix-css-node'
    }
  },
  less: {
    browserLoad: 'dist/streamhub-wall.min',
    paths: ['lib'],
    relativeUrls: true,
    modifyVars: {
      '@icon-font-path': "\"http://cdn.livefyre.com/libs/livefyre-bootstrap/v1.1.0/fonts/\""
    }
  }
});
