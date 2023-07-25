
import React, { useState,useEffect,useRef } from 'react'
import ReactDOM from 'react-dom/client'

function App() {
  const [isDel, del] = useState(false);
  const divRef = useRef(null);
  const numRef = useRef(0);
  console.warn("render divRef",divRef.current);
  console.warn("render numRef",numRef.current);
  
  const handleClick= ()=>{
    // alert(1)
    numRef.current =  numRef.current+1;
    del(true)
  }
  useEffect(()=>{
    console.log("create");
    return ()=>{
      console.log("destroy")
    }
  },[])

  return (
    <div ref={divRef} onClick={handleClick}>
      {isDel ? 'null': <Child />}
    </div>
  );
}


function Child() {
   return <p ref={dom=>console.warn("dom is:",dom)}>Child</p>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  // @ts-ignore
  <App h="1" />
)
