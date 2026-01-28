export default defineAppConfig({
  pages: [
    'pages/index/index'
  ],
  subpackages:[
    {
      root:'pages/test',
      pages:['index']
    }
  ],
  preloadRule: {
    'pages/index/index': {
      network: 'all',
      packages: ['pages/test'],
    },
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'WeChat',
    navigationBarTextStyle: 'black'
  }
})
