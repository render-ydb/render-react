// @ts-ignore
import React, { useState,useEffect } from 'react'
import ReactDOM from 'react-dom/client'

function App() {
  const [num, updateNum] = useState(100);
  return (
    <ul onClick={()=>updateNum(50)}>
      {
        new Array(num).fill(0).map((_,i)=>{
          return <Child key={i}>{i}</Child>
        })
      }
    </ul>
  );
}

function Child({children}) {
  const now = performance.now();
  while(performance.now()-now <4) {}

  return <li>{children}</li>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  // @ts-ignore
  <App h="1" />
)
