import React, { useNavigate } from "react-router-dom";
 


import Error404Image from "../../assets/Error404";

import "./Error404.css";

const Error404 = () => {
  let navigate = useNavigate();

  return(
    <main className="errorPage">
      <div className="imageContainer">
        <Error404Image />
      </div>
      <h1>Whoops! Lost in Space?</h1>
      <div className="textContainer">
        <p>The page you are looking for cannot be found :(</p>
        <p>We suggest you contact the coordinator or go back to home</p>
      </div>
      <button className="error404Btn" onClick={() => navigate("/")}>Go back home</button>
    </main>
  )
}


export default Error404;