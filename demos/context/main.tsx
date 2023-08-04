import React, { useState, useEffect, useRef, useContext, createContext } from 'react'
import ReactDOM from 'react-dom/client'

const ctxA = createContext<any>(null);
const ctxB = createContext<any>('undefined');

const jsx = (
  <ctxA.Provider value={'A0'}>
    <ctxB.Provider value={'B0'}>
      <ctxA.Provider value={'A1'}>
        <Cpn />
      </ctxA.Provider>
      <Cpn />
    </ctxB.Provider>
    <Cpn />
  </ctxA.Provider>
);
const jsx1 = (
  <p>1111</p>
)
// console.log("jsx1jsx1jsx1", jsx1);

function App() {
  const [num, setNum] = useState(0)
  const handleClick = () => {
    setNum(num + 1); // =>1
    console.log("num", num);
    setNum(num + 1);// =>1
    console.log("num", num)
    setNum(num + 1);// =>1
    console.log("num", num);
    // lane模型批处理
  }
  console.log('hahhah', num)
  return (
    <div onClick={handleClick}>
      {jsx}
    </div>
  );
}


function Cpn() {
  const a = useContext(ctxA);
  const b = useContext(ctxB);


  return (
    <div>
      <p>A: {a} </p>
      <p>sdadsad</p>
      {/* <p>B: {b}</p> */}
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  // @ts-ignore
  <App />
)
