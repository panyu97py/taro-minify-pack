<template>
  <view class="index">
    <Suspense>
      <template #default>
        <view>
          <AsyncComponentFirst/>
          <AsyncComponentSecond/>
        </view>
      </template>
      <template #fallback>
        <view>loading...</view>
      </template>
    </Suspense>
    <text>{{ msg }}</text>
  </view>
</template>

<script setup>
import {defineAsyncComponent, ref} from 'vue'
import './index.less'

const AsyncComponentFirst = defineAsyncComponent(async () => {
  return  import('@/components/async-component-first')
  }
)

const AsyncComponentSecond = defineAsyncComponent(() =>
  import('@/components/async-component-second')
)

const msg = ref('Hello world')

</script>
