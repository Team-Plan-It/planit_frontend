import { useContext } from "react";
import { useState, useEffect, createContext } from "react";

const viewportContext = createContext({});

interface PropsTypes{
  width?: number;
  height?: number;
}

// puts a single event listener on all of the components
export const ViewportProvider = ({ children }:any) => {
   // window resizing
   const [ width, setWidth ] = useState<number>(window.innerWidth);
   const [ height, setHeight ] = useState<number>(window.innerHeight);


   const handleWindowResize = () => {
       setWidth(window.innerWidth);
       setHeight(window.innerHeight);
     }

  // add event listener for window resize
   useEffect(() => {
     window.addEventListener("resize", handleWindowResize);
 
     return () => window.removeEventListener("resize", handleWindowResize);
   }, []);

   return(
     <viewportContext.Provider value={{ width, height }}>
       {children}
     </viewportContext.Provider>
   )
}



// returns the width and height of the screen
export const useViewport = () => {
 
  const { width, height }:PropsTypes = useContext(viewportContext);
   
   return { width, height };
}

// returns the orientation of the device
export const useOrientation = () => {
  const [ orientation, setOrientation ] = useState<string>();

  const { width, height }:PropsTypes = useContext(viewportContext);

  useEffect(() => {
    if(width! < height!){
      setOrientation("portrait");
    }else{
      setOrientation("landscape");
    }
  }, [width, height])

  return orientation
}