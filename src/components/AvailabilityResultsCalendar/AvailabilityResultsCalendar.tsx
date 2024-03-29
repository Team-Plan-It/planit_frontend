import axios from "axios";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { DayPilot, DayPilotCalendar } from "@daypilot/daypilot-lite-react";

//components
import rightArrow from "../../assets/right-arrow.png"
import leftArrow from "../../assets/left-arrow.png"

//styles
import "./AvailabilityResultsCalendar.css";


// types
import { AvailabilityI, UserInfo, MeetingInfo } from "../../types";

interface PropsInfo{
  meetingData?:MeetingInfo;
  timeZoneOffset?:number;
  meetingNumID?: string;
}

// {meetingData, timeZoneOffset}:PropsInfo
const AvailabilityResultsCalendar = ({meetingNumID}:PropsInfo) => {
  let calendar = DayPilot.Calendar;
  let navigate = useNavigate();

  //initialize state
  // user info array
  const [ userInfoData, setUserInfoData ] = useState<UserInfo[]>()
  // if an event has been created
  const [ eventCreated, setEventCreated ] = useState<boolean>(false);
  // calendar month
  const [ calendarMonth, setCalendarMonth ] = useState<string>();
  // calendar year
  const [ calendarYear , setCalendarYear ] = useState<number>();
  // loading
  const [ isLoading, setIsLoading ] = useState<boolean>(true);
    // timeZoneOffset
  const [ timeZoneOffset, setTimeZoneOffset ] = useState<number>();
  // date selected by coordinator
  const [ selectedDate, setSelectedDate ] = useState<string>();
  // show or hide weekends of results calendar
  const [ showWeekends, setShowWeekends ] = useState<boolean>(true);
  // meeting data
  // const [ meetingData, setMeetingData ] = useState<MeetingInfo>();

  axios.defaults.baseURL = process.env.REACT_APP_BASE_URL_LOCAL;


  // on page load
  useEffect(() => {
    let abortController = new AbortController();
    getData();
    
    // get timezoneoffest
    const timeZoneOffset = new Date().getTimezoneOffset();
    setTimeZoneOffset(timeZoneOffset);

    return () => { abortController.abort(); }
  }, [])

  // axios call in async function
  const getData = async () => {
  
    try{
        const resultsUrl = `/dates/results/${meetingNumID}`
        const response = await axios.get(resultsUrl);
    
        if(response !== undefined){
           setIsLoading(false);
                   
           // deconstruct info from data
           const { date,  users } = response.data[0]!;

           
           // set event created to false
           setEventCreated(false)
           // save data in state
          //  setMeetingData(response.data[0])
           setSelectedDate(date);
           setUserInfoData(users);
            
            // get month as string from event date
            const month = new Date(date).toLocaleString('default', {month: "long"});
            setCalendarMonth(month);
            //get year
            const year = new Date(date).getFullYear();
            setCalendarYear(year);

        }else{
          // console.log("response undefined for results")
        }
        

    }catch(error:unknown){
      if(error instanceof Error){
        navigate("/error404");
        console.log("error message: ", error.message)
      }
    }
  }



  useEffect(() => {
    let abortController = new AbortController();
    if(userInfoData && !eventCreated){
      createEventList(userInfoData);
    calendar.update();
    }
    return () => { abortController.abort(); }
  }, [userInfoData])


  // function for creating event
  const createNewEvent = (availBlock:AvailabilityI, userArray:UserInfo, userNum:number) => {
      // for each object, get start and end value
      let currentStart = new DayPilot.Date(availBlock.start);
      let currentEnd = new DayPilot.Date(availBlock.end);
      // subtract the timeZoneOffset in minutes to currentTime
      let newStart =  currentStart.addMinutes(-timeZoneOffset!);
      let newEnd = currentEnd.addMinutes(-timeZoneOffset!);
      //  create a new event for each availability block
      let newEvent:any[] = new DayPilot.Event({
        start: newStart,
        end: newEnd,
        id: "user1",
        text: userArray.userName!.charAt(0).toUpperCase(),
        toolTip: userArray.userName,
        fontColor: "#000000",
        cssClass:`user${userNum}`,
        ref:`user${userNum}`
       });
      //  add the new event to the events list
      if (calendar !== undefined && newEvent){
        calendar.events.add(newEvent);
      }else{
        // console.log("calendar not initialized")
      }
  }

  const createEventList = (userData:UserInfo[]) => {
  
    if(!eventCreated ){
     userData!.every((user, index) => {
  
             switch(index){
               case 0:
                  let user1array = user;
                  
                   // loop through the availability for the user
                  user1array.availability!.forEach((availBlock, index) => {
                    createNewEvent(availBlock, user1array, 1);
                  })
                  break;
                case 1:
                  let user2array = user;

                  // loop through the availability for the user
                  user2array.availability!.forEach(availBlock => {
                    createNewEvent(availBlock, user2array, 2);
                  })
                  break;
                case 2:
                  let user3array = user;
  
                  // loop through the availability for the user
                  user3array.availability!.forEach(availBlock => {
                    createNewEvent(availBlock, user3array, 3);
                  })
                  break;
                case 3:
                  let user4array = user; 
  
                  // loop through the availability for the user
                  user4array.availability!.forEach(availBlock => {
                    createNewEvent(availBlock, user4array, 4);
                  })
                  break;
                case 4:
                  let user5array = user;

                  // loop through the availability for the user
                  user5array.availability!.forEach(availBlock => {
                    createNewEvent(availBlock, user5array, 5);
                  })
                  break;
                case 5:
                  let user6array = user;

                  // loop through the availability for the user
                  user6array.availability!.forEach(availBlock => {
                    createNewEvent(availBlock, user6array, 6);
                  })
                  break;
             }
  
              if (index === userData!.length -1){
                setEventCreated(true)
                calendar.events.update();
                return false
              }else {
                setEventCreated(false)
                return true
              }
        })
    }
  }

  return(
     <div className="resultsCal"> 
            <div className="resultsCalIntro">
                <p>{calendarMonth} {calendarYear} </p>
                <button className="toggleWeekends" onClick={() => setShowWeekends(!showWeekends)}>
                  {showWeekends 
                    ?<>Hide Weekends <span><img src={leftArrow} alt="left arrow" /></span></> 
                    :<>Show Weekends <span><img src={rightArrow} alt="right arrow" /></span></>}  
                </button>
              </div>

          <div className="resultsCalendar" id="calendar">
            {
              isLoading && !userInfoData && eventCreated
              ? <p>Is loading.....</p>
    
              : 
              <DayPilotCalendar 
                      durationBarVisible={false}
                      startDate={selectedDate}
                      viewType = {showWeekends ?"Week" :"WorkWeek"}
                      headerDateFormat={"ddd dd"}
                      heightSpec={"Full"}
                      showToolTip={"true"}
                      id={"calendar"}
                      cellHeight={15}
                      columnWidth={100}
                      // width={"90%"}
                      CssOnly={true}
                      eventMoveHandling={"Disabled"}
                      eventResizeHandling={"Diasbled"}
                      timeRangeSelectedHandling={"Disabled"}
                      ref={(component:any | void) => {
                        calendar = component && component.control;
                      }} 
                  />
              }
          </div>
        </div>
  )
}
 
export default AvailabilityResultsCalendar;