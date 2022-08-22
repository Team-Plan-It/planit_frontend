import React, { useState, useEffect }from "react";
import {  useParams, useNavigate } from "react-router-dom";
import axios from "axios";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { DayPilot } from "@daypilot/daypilot-lite-react";

//components
import Sidebar from "../Sidebar/Sidebar";
import AvailabiltyResultsCalendar from "../AvailabilityResultsCalendar/AvailabilityResultsCalendar";
// import { useViewport } from "../../CustomHooks";

//styles
import "./Overlap.css";

// types
import { UserInfo, MeetingInfo, DayObjects, DateInfo } from "../../types";

interface AvailabilityByDate{
  date: string;
  availabilityByDateArray: DayObjects[];
}
interface OverlapResults{
  date: {
    day: number;
    month: string;
    year: number;
    dayOfWeekString: string;
  };
  allAvailableBlocks: AllAvailObj[] | undefined;
}



interface AllAvailObj {
  start: DayPilot.Date;
  end: DayPilot.Date;
}


const Overlap:React.FC= () => {
  // init useParams to get meetingID
  const meetingNumID = useParams().id;

  // init navigate
  let navigate = useNavigate();

  // init custom hook for viewport
  // const { width, height } = useViewport();

  // init state
  // loading
  const [ isLoadingMeetingData, setIsLoadingMeetingData ] = useState<boolean>(true);
  const [ isLoadingOverlapData, setIsLoadingOverlapData ] = useState<boolean>(true);
  // meeting data
  const [ meetingData, setMeetingData ] = useState<MeetingInfo>();
  // user names
  const [ userNames, setUserNames ] = useState<(string | undefined)[]>();
  // number of invitees
  const [ numOfAttendees, setNumOfAttendees ] = useState<number[]>();
  // overlap data
  const [ overlapData, setOverlapData ] = useState<OverlapResults[]>();
  // timeZoneOffset
  const [ timeZoneOffset, setTimeZoneOffset ] = useState<number>();
   // timezone of invitee/person using this page
  const [ currentTimeZone, setCurrentTimeZone ] = useState<string>();
  // show calendar view
  const [ showCalendar, setShowCalendar ] = useState<boolean>(false);

  // dates
  // const [ sundayDate, setSundayDate ] = useState<DateInfo>();
  // const [ mondayDate, setMondayDate ] = useState<DateInfo>();
  // const [ tuesdayDate, setTuesdayDate ] = useState<DateInfo>();
  // const [ wednesdayDate, setWednesdayDate ] = useState<DateInfo>();
  // const [ thursdayDate, setThursdayDate ] = useState<DateInfo>();
  // const [ fridayDate, setFridayDate ] = useState<DateInfo>();
  // const [ saturdayDate, setSaturdayDate ] = useState<DateInfo>();


  // arrays of all available timeblocks
  // const [ sundayAllAvail, setSundayAllAvail ] = useState<AllAvailObj[]>();
  // const [ mondayAllAvail, setMondayAllAvail ] = useState<AllAvailObj[]>();
  // const [ tuesdayAllAvail, setTuesdayAllAvail ] = useState<AllAvailObj[]>();
  // const [ wednesdayAllAvail, setWednesdayAllAvail ] = useState<AllAvailObj[]>();
  // const [ thursdayAllAvail, setThursdayAllAvail ] = useState<AllAvailObj[]>();
  // const [ fridayAllAvail, setFridayAllAvail ] = useState<AllAvailObj[]>();
  // const [ saturdayAllAvail, setSaturdayAllAvail ] = useState<AllAvailObj[]>();
  
  axios.defaults.baseURL = process.env.REACT_APP_BASE_URL_LOCAL


  const getMeetingData = async () => {
    try{
      const meetingResultsUrl = `/dates/results/${meetingNumID}`
      const overlappingUrl = `/dates/overlapping/${meetingNumID}`
      const [meetingResponse, overlapResponse ] = await Promise.all([
      
      axios.get(meetingResultsUrl),
      axios.get(overlappingUrl)]);
      
      if(meetingResponse !== undefined && overlapResponse !== undefined){
        setIsLoadingMeetingData(false)

        // deconstruct info from data
        const { emails, users } = meetingResponse.data[0]!;

        // save data in state
        console.log(meetingResponse.data[0])
        setMeetingData(meetingResponse.data[0]); 

        // populate userNameArray 
        const userNamesArray:(string | undefined)[] = users.map((user:UserInfo) => {
          return user.userName;
        });
        setUserNames(userNamesArray);
            
        // determine number of meeting attendees
        // includes coordinator
        let arrayOfNumOfUsers = [1];
        if(emails.length > 0){
          for (let i= 0; i < emails.length; i++){
            arrayOfNumOfUsers.push(i + 2)
          }
          setNumOfAttendees(arrayOfNumOfUsers);
        }

        setIsLoadingOverlapData(false);
        console.log(overlapResponse.data)
        const overlapResults = await checkOverlapArrays(overlapResponse.data, userNamesArray);
        setOverlapData(overlapResults);
        console.log(overlapResults)

        // get timezoneoffest
        const timeZoneOffset = new Date().getTimezoneOffset();
        setTimeZoneOffset(timeZoneOffset);

        // get current timeZone
        const eventTimeZone = new Date().toLocaleTimeString(undefined, {timeZoneName: "short"}).split(" ")[2];
        setCurrentTimeZone(eventTimeZone);
      }
    }
    catch(error:unknown){
      if(error instanceof Error){
        navigate("/error404");
        console.log("error message: ", error.message)
      }
    }
  }


  useEffect(() => {
    let abortController = new AbortController();
    getMeetingData();
    return () => { abortController.abort(); }
  }, [])

  // useEffect(() => {
  //   let abortController = new AbortController();
  //   if(overlapData !== undefined && meetingData !== undefined && userNames && numOfAttendees && userNames.length === numOfAttendees.length){
  //     const overlapResults = checkOverlapArrays(overlapData);
  //     console.log("its called! overlapdata useeffect")
  //   }
  //   return () => { abortController.abort(); }
  // }, [overlapData])


  
  // function to find the overlapping time by date from the array of availabilites
  const checkOverlapArrays = async (arrayOfDateObjects:AvailabilityByDate[], userNamesArray:(string | undefined)[]) => {
    // function to get the day, month and year
    const getDates = (timeblock:string) => {
      console.log(timeblock)
      const convertedTime = new Date(timeblock.replace(/-/g, '\/'));
  
      console.log(convertedTime)
      // get date
      const day = convertedTime.getDate();
      const year = convertedTime.getFullYear();
      const month = convertedTime.toLocaleString('default', {month: "long"});
      const dayOfWeek = convertedTime.getDay();
      let dayOfWeekString = "";
      switch(dayOfWeek){
        case 0:
          dayOfWeekString = "Sunday";
          break;
        case 1:
          dayOfWeekString = "Monday";
          break;
        case 2:
          dayOfWeekString = "Tuesday";
          break;
        case 3:
          dayOfWeekString = "Wednesday";
          break;
        case 4:
          dayOfWeekString = "Thursday";
          break;
        case 5:
          dayOfWeekString = "Friday";
          break;
        case 6:
          dayOfWeekString = "Saturday";
          break;
      }
      console.log({day, month, year, dayOfWeekString})
  
      return {day, month, year, dayOfWeekString}
    }

    //function to filter out timeslots that have a length > 0
    const checkDayObject = (dayArray:DayObjects[]) => {
      const timeslotsWithAvail:any = dayArray.filter(timeslot => {return timeslot.array.length > 0})
    
      return timeslotsWithAvail;
    }

    // function to get current timeString and convert it to local time of browser
    const convertTimeString = (timeString:string) => {
      const currentTimeString = new DayPilot.Date(timeString);
      const convertedTimeString = currentTimeString.addMinutes(-timeZoneOffset!);
      return convertedTimeString;
    }

    // map through the array of date availability objects and return an array of objects with dates and blocks when all users are available
    const overlapInfoResults = arrayOfDateObjects.map(dateObj => {
      // get date and save it as object with day, month, year
      console.log(dateObj.date)
      const date = getDates(dateObj.date);

      console.log(dateObj.availabilityByDateArray)
      // filter results in availability array to return only slots that are not empty and save them
      const filteredAvailResults = checkDayObject(dateObj.availabilityByDateArray);
      console.log(filteredAvailResults)
      // convert the timeString of each object in the filtered results and save it
      const convertedAvailResults = filteredAvailResults.map((availResult:DayObjects) => {
        const convertedTimeString = convertTimeString(availResult.timeString!);
        availResult.convertedTimeString = convertedTimeString;
        return availResult;
      });
      console.log(convertedAvailResults)
      // get availability blocks when all attendees are available and save
      const allAvailableBlocks = getAvailableBlocks(convertedAvailResults, userNamesArray);

      console.log(allAvailableBlocks)
      return {date, allAvailableBlocks}
    })

   return overlapInfoResults;
  } // end of checkOverlapArrays


  // function to convert timeblock to start and end times with am/pm, and length of timeblock
  const convertAvailTimeString = (timeblock:AllAvailObj) => {
    let startAmPm = "am";
    let endAmPm = "am";
    // get start and end time
    // set start time as am/pm format
    let startHour = timeblock.start.getHours();
    if (startHour === 0){
      startHour = 12;
    }else if(startHour === 12){
      startAmPm = "pm";
    }else if(startHour === 24){
      startHour = 12;
      startAmPm = "am";
    }else if(startHour > 12){
      startHour = startHour - 12;
      startAmPm = "pm";
    }

    // set end time as am/pm format
    let endHour = timeblock.end.getHours();
    if (endHour === 0){
      endHour = 12;
    }else if(endHour === 12){
      endAmPm = "pm";
    }else if(endHour === 24){
      endHour = 12;
      endAmPm = "am";
    }else if(endHour > 12){
      endHour = endHour - 12;
      endAmPm = "pm";
    }
    
    // get start and end minutes
    let startMinString = "00";
    const startMinutes = timeblock.start.getMinutes();
    if (startMinutes === 30){
      startMinString = "30";
    }
    let endMinString = "00";
    const endMinutes = timeblock.end.getMinutes();
    if (endMinutes === 30){
      endMinString = "30";
    }

    // get length of timeblock
    const endTimeOfBlock = timeblock.end.getTimePart();
    const startTimeOfBlock = timeblock.start.getTimePart();
    const diffTime = endTimeOfBlock - startTimeOfBlock;
    let seconds = Math.floor(diffTime / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);

    minutes = minutes % 60;
    let lengthOfTimeBlock = "";
    if(hours === 0){
      lengthOfTimeBlock = `${minutes} minutes`
    }else if(hours === 1 && minutes === 0){
       lengthOfTimeBlock = `${hours} hour`
    }else if(hours === 1){
      lengthOfTimeBlock = `${hours} hour, ${minutes} minutes`
    }else if( minutes === 0){
      lengthOfTimeBlock = `${hours} hours`
    }else {
      lengthOfTimeBlock = `${hours} hours, ${minutes} minutes`

    }

    return { startHour, startMinString, startAmPm, endHour, endMinString, endAmPm, lengthOfTimeBlock }
  }


  // function to return all timeblocks when all attendees are available
  const getAvailableBlocks = (resultsArray:DayObjects[], userNamesArray:(string | undefined)[]) => {
    let startTime:DayPilot.Date;
    let endTime:DayPilot.Date;
    let allAvailBlocks:AllAvailObj[] = [];
    // go through array looking for array length === numOfAttendees
    if(userNamesArray){
      resultsArray.forEach(timeblock => {
  
        if(timeblock.array.length === userNamesArray!.length){
          if(!startTime && !endTime){
           // set start time as time of first timeString
            startTime = new DayPilot.Date(timeblock.convertedTimeString);
            // set end time as start time plus 30 minutes
            endTime = new DayPilot.Date(timeblock.convertedTimeString);
            endTime = endTime.addMinutes(30);
        
          }else if(timeblock.convertedTimeString === endTime){
            // check if convertedTimeString same as end time
            // if true, change endtime to results starttime plus 30 minutes
            endTime = new DayPilot.Date(timeblock.convertedTimeString);
            endTime = endTime.addMinutes(30);

          }else{
            // start and end time are defined but start time of current timestring does not equel the end time => it is a new timeblock
            // push current values of start and end time
            allAvailBlocks.push({ start:startTime, end:endTime });
            // set start time as time of current timeString
            startTime = new DayPilot.Date(timeblock.convertedTimeString);
            // set end time as start time plus 30 minutes
            endTime = new DayPilot.Date(timeblock.convertedTimeString);
            endTime = endTime.addMinutes(30);
          }
    
        }else{
          console.log("array length not equal to userName length")
        }
      })
      if(startTime !== undefined && endTime !== undefined){
        allAvailBlocks.push({ start:startTime, end:endTime })
    
      }
      return allAvailBlocks;
    }else {
      console.log("usernames not defined")
    }
  }


  return(
    <>
      {
        isLoadingMeetingData && isLoadingOverlapData && !overlapData && !meetingData
        ?<p>Please standby. Loading meeting data....</p>
        :<div className="overlapResults">
          <Sidebar userNames={userNames} numOfAttendees={numOfAttendees} results={true}/>

          <div className="overlapInfo">
            <header className="overlapInfoIntro">
              <h1>Time Available for <span className="text">Everyone</span></h1>
              <h2>{meetingData ?meetingData.eventName :null}</h2>
              <button onClick={() => navigate("/")}>+ Plan another meeting</button>
            </header>

            <p className="banner">You are viewing the times in: {currentTimeZone}</p>

            <div className="toggleButtons">
              <button className={!showCalendar ?"border" :"overlapBtn"} onClick={() => {
                setShowCalendar(false);
                }}>Available Times</button>
              <button className={showCalendar ?"border" :"calendarBtn"} onClick={() => {
                setShowCalendar(true);
              }}>Calendar View</button>
            </div>
            <div className="overlapContainer">

          
            {
              !showCalendar
              ?
              <div className="overlapInfoDetails">
              {
                userNames && numOfAttendees && userNames!.length !== numOfAttendees!.length
                //  if not all invitees have completed their availability 
                  ?<h2 className="notAllAvail">{userNames!.length} of {numOfAttendees!.length} attendees have filled out their availability</h2>
                //  show all available times
                  : <>
                    {/* <h2>Time Available for Everyone</h2> */}
                    <ul className="availableTimes">
                      {
                        overlapData !== undefined

                        
                        // map through overlapdata  and display the date info for each dataObject
                       ? overlapData?.map((dataObject, index) => {
                      
                          return(
                            <>
                              <li key={index}>
                                {
                                  dataObject.allAvailableBlocks!.length > 0
                                    ? <h3 className="day"><span className="text">{dataObject.date.dayOfWeekString}</span> {dataObject.date.month} {dataObject.date.day}, {dataObject.date.year}</h3>
                                    : null
                                }
                                <ul>
                                
                                  {
                                    // map through the array of availability timeblocks for this date
                                    dataObject.allAvailableBlocks!.map(timeblock => {
                                      const timeResults = convertAvailTimeString(timeblock);
                                      const { startHour, startMinString, startAmPm, endHour, endMinString, endAmPm, lengthOfTimeBlock } = timeResults;
                                      return(
                                        <li key={startHour}>
                                          <div className="availDisplay">
                                            <p className="timeP">{startHour}:{startMinString} {startAmPm} - {endHour}:{endMinString} {endAmPm} {currentTimeZone}</p>
                                            <p className="length">Everyone is available for <span className="text">{lengthOfTimeBlock}</span></p>
                                              </div>
                                          <ul className="userNames">
                                            {
                                              userNames!.map((name, index) => {
                                                  return(
                                                    <li key={`${index}${name}` } className={`user${index + 1}`}>{name!.charAt(0).toUpperCase()}</li>
                                                  )
                                              })
                                            }
                                            <li key={"userLength"} className="userLength">{userNames!.length}/{userNames!.length}</li>
                                          </ul>
                                        </li>
                                      )
                                    })
                                  }

                                </ul>
                              </li>
                            </>
                          )
                        })
                        :null
                      }
                    </ul>
                  </>
                }
              </div>

            :<div className="calendarComponent">
              <AvailabiltyResultsCalendar meetingNumID={meetingNumID}/>
              </div>
            }
            </div>
          </div>
        </div>
      }
  
    </>
  )
}


export default Overlap;