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
console.log("jsx", jsx);
console.log(ctxA)

function App() {
  return (
    <div>
    {jsx}
    </div>
  );
}


function Cpn() {
  const a = useContext(ctxA);
  const b = useContext(ctxB);
  console.log("a",b)

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
