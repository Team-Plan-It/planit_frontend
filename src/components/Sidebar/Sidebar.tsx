import React, { useState } from "react";
import { useEffect } from "react";
import WhiteLetterLogo from "../../assets/whiteLetterLogo";
import "./Sidebar.css";

// types
interface NameProps {
  userNames?: (string | undefined)[];
  numOfAttendees?: number[];
  results: boolean;
}

interface AttendeeInfo{
  name: string;
  complete: boolean;
}

const Sidebar:React.FC<NameProps> = ({ userNames, numOfAttendees, results }) => {
  // init state
  const [ attendeeNames, setAttendeeNames ] = useState<(AttendeeInfo | undefined)[]>();
  // create an array that holds user name or string with number for users that haven't entered availability yet
  // 0 if userNames.length === 1 ?userName[0] :"Coordinator"
  // 1 if userNames.length === 2 ?userName[1] :"Invitee 1"
  // // etc
  useEffect(() => {
    let abortController = new AbortController();
    console.log("sidebar useeffect is being called")
    let namesToDisplay = numOfAttendees?.map((num) => {
      let name = "";
      let complete = false;

      switch(num){
        case 1:
          if (results && userNames && userNames.length >= 1){
            name = userNames[0]!;
            complete = true
          } else if (results){
            name = "Coordinator";
            complete = false;
          } else{
            name = "Coordinator";
            complete = true;
          }
          return {name: name, complete: complete}
        case 2:
          if (results && userNames && userNames.length >= 2){
            name = userNames[1]!;
            complete = true
          } else if (results){
            name = "Invitee 1";
            complete = false;
          }else {
            name = "Invitee 1";
            complete = true;
          }
          return {name: name, complete: complete}
        case 3:
          if (results && userNames && userNames.length >= 3){
            name = userNames[2]!;
            complete = true
          } else if (results){
            name = "Invitee 2";
            complete = false;
          }else {
            name = "Invitee 2";
            complete = true;
          }         
          return {name: name, complete: complete}
        case 4:
          if (results && userNames && userNames.length >= 4){
            name = userNames[3]!;
            complete = true
          } else if(results){
            name = "Invitee 3";
            complete = false;
          }else {
            name = "Invitee 3";
            complete = true;
          }           
          return {name: name, complete: complete}
        case 5:
          if (results && userNames && userNames.length >= 5){
            name = userNames[4]!;
            complete = true
          } else if (results){
            name = "Invitee 4";
            complete = false;
          }else{
            name = "Invitee 4";
            complete = true;
          }           
          return {name: name, complete: complete}
        case 6:
          if (results && userNames && userNames.length === 6){
            name = userNames[5]!;
            complete = true
          } else if (results){
            name = "Invitee 5";
            complete = false;
          }else {
            name = "Invitee 5";
            complete = true;
          }           
          return {name: name, complete: complete}
      }
    })
    setAttendeeNames(namesToDisplay!);
    return () => { abortController.abort(); }
  
  }, [userNames, numOfAttendees, results])
 
  

  
  return(
        <div className="sidebar">
          <WhiteLetterLogo />

            <div className="displayNames">
           {/*  
                loop through attendeeNames;
                either a user name will be displayed or a generic name
          */}
            <ul>

              {
                attendeeNames

                ? 
                  attendeeNames.map((attendee, index) => {
                    return(
                      <li key={index} className={`user${index + 1}`}>
                        <div className={`circle ${attendee!.complete ?"fill" :"noFill"}`}>{attendee!.name.charAt(0).toUpperCase()}</div>
                        <p className="users">{attendee!.name}</p>
                      </li>
                    )
                })
                :null
              }
            </ul>
          </div>


        </div>
  )
}


export default Sidebar;