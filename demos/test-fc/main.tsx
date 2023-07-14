debugger;
import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'

const App = () => {
  const [num,setNum] = useState(1);
  const [str,setStr] = useState('render')
  return (
    // @ts-ignore
    <div key={1111}>
      {/* 多个节点的时候全局的useState的值会不会时同一个？ */}
      {/* sss */}
        <p onClick={()=>setNum(2)}>
          <p onClick={(e)=>{
            // e.stopPropagation();
            setStr("good")
          }}>{str+num}</p>
        </p> 
      </div>
  )
}


ReactDOM.createRoot(document.getElementById('root')!).render(
  // @ts-ignore
  <App h="1" />
)
