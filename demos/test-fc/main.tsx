// @ts-ignore
import React, { useState,useEffect } from 'react'
import ReactDOM from 'react-dom/client'

function App() {
  const [num, updateNum] = useState(0);
  useEffect(() => {
    console.log('App mount');
  }, []);

  useEffect(() => {
    console.log('num change create', num); 
    return () => {
      console.log('num change destroy', num);
    };
  }, [num]); //

  return (
    <div onClick={() => updateNum(num + 1)}>
      {num%2 === 0 ? <Child /> : 'noop'}
      {/* {num} */}
     
    </div>
  );
}

function Child() {
  useEffect(() => {
    console.log('Child mount');
    return () => console.log('Child unmount');
  }, []);

  return 'i am child';
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  // @ts-ignore
  <App h="1" />
)
