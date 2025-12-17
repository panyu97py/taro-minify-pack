// babel-preset-taro 更多选项和默认值：
// https://docs.taro.zone/docs/next/babel-config
module.exports = {
  presets: [
    ['taro', {
      framework: 'react',
      ts: true,
      compiler: 'webpack5',
      'dynamic-import-node': process.env.TARO_ENV !== 'weapp', // 在原有基础上添加这个配置即可
    }]
  ]
}
