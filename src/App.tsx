import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// components
import Home from "./components/home/Home";
import Availability from "./components/Availability/Availability";
import Error404 from "./components/Errors/Error404";
import Overlap from "./components/Overlap/Overlap";
import { ViewportProvider } from "./CustomHooks";

//styles
import "./App.css";



const App: React.FC = () => {
  return (
    <ViewportProvider>

    <Router>
      <div className="App">

        <main id='modalRoot'>
          <Routes>
            <Route path="/" element={<Home />}/>
            <Route path="/availability/:id" element={ <Availability />}/>
            <Route path="/overlapping/:id" element={<Overlap />} />
            <Route path='/error404' element={<Error404 />}/>
          </Routes>
        </main>
      </div>

    </Router>
    </ViewportProvider>
  );
}

export default App;
