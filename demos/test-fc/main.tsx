import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'

const App = () => {
  const [visible, setVisible] = useState(false);
  //@ts-ignore
  window.setNum = setVisible;

  return (
    // @ts-ignore
    <div key={1111}>
      {/* 多个节点的时候全局的useState的值会不会时同一个？ */}
      {/* sss */}
      {visible ? <p>p比爱哦圈</p> : <span>是的撒的</span>} 
      </div>
  )
}
const Demo = () => {
  const [str, setStr] = useState('测试');
   //@ts-ignore
  window.setStr = setStr;
  return (
    // @ts-ignore
    <div>{str}</div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  // @ts-ignore
  <App h="1" />
)
