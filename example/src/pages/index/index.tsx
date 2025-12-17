import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import React, {Suspense} from "react";
import './index.less'

const AsyncComponentFirst = React.lazy(async () => {
  const result = await import('@/components/async-component-first')
  return {default: result.AsyncComponentFirst}
})

const AsyncComponentSecond = React.lazy(async () => {
  const result = await import('@/components/async-component-second')
  return {default: result.AsyncComponentSecond}
})



export default function Index () {
  useLoad(() => {
    console.log('Page loaded.')
  })

  return (
    <View className='index'>
      <Suspense fallback={<View>Loading...</View>}>
        <AsyncComponentFirst />
        <AsyncComponentSecond />
      </Suspense>
      <Text>Hello world!</Text>
    </View>
  )
}

