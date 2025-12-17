import {View} from "@tarojs/components";
import React from "react";
import './async-component-first.less'

export const AsyncComponentFirst: React.FC = () => {
  return <View className='async-component-first'>{`I'm async component first`}</View>
}
