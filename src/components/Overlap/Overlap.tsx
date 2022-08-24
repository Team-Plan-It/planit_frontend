import React, { useState, useEffect }from "react";
import {  useParams, useNavigate } from "react-router-dom";
import axios from "axios";


//components
import Sidebar from "../Sidebar/Sidebar";
import AvailabiltyResultsCalendar from "../AvailabilityResultsCalendar/AvailabilityResultsCalendar";
// import { useViewport } from "../../CustomHooks";

//styles
import "./Overlap.css";

// types
import { UserInfo, MeetingInfo, DayObjects } from "../../types";

interface AvailabilityByDate{
  date: string;
  availabilityByDateArray: DayObjects[];
}
interface OverlapResults{
  deconstructedDate: {
    startHour: number;
    startMinString: string; 
    startAmPm: string; 
    endHour: number; 
    endMinString: string; 
    endAmPm: string;
    lengthOfTimeBlock: string;
  };
  date:{
    day: number;
    month: string;
    year: number;
    dayOfWeekString: string;
  };
  allAvailableTimeBlocks: AllAvailObj;
}
interface AllAvailObj {
  start: Date;
  end: Date;
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
  // timezone of invitee/person using this page
  const [ currentTimeZone, setCurrentTimeZone ] = useState<string>();
  // show calendar view
  const [ showCalendar, setShowCalendar ] = useState<boolean>(false);
  
  // axios URL
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

        // get current timeZone
        const eventTimeZone = new Date().toLocaleTimeString(undefined, {timeZoneName: "short"}).split(" ")[2];
        setCurrentTimeZone(eventTimeZone);

        // calculate overlap from overlapResponse data
        setIsLoadingOverlapData(false);

        const overlapResults = await checkOverlapArrays(overlapResponse.data, userNamesArray);
        if(overlapResults !== undefined){
          setOverlapData(overlapResults);
        }

      }
    }
    catch(error:unknown){
      if(error instanceof Error){
        navigate("/error404");
        console.error("error message: ", error.message)
      }
    }
  }


  useEffect(() => {
    let abortController = new AbortController();
    getMeetingData();
    return () => { abortController.abort(); }
  }, [])


 

  // function to find the overlapping time by date from the array of availabilites
  const checkOverlapArrays = async (arrayOfDateObjects:AvailabilityByDate[], userNamesArray:(string | undefined)[]) => {
    // concat all of the dateObjects into one array
    let mergedObjectsArray:DayObjects[] = [];
    for(let object of arrayOfDateObjects){

      mergedObjectsArray.push(...object.availabilityByDateArray);
    }

    // iterate through mergedObjectsArray and convert all of the timestrings to the local browser timezone
    const convertedMergedObjectsArray = mergedObjectsArray.map(mergedObject => {
      const convertedTimeString = convertTimeString(mergedObject.timeString!);
      mergedObject.convertedTimeString = convertedTimeString;
      return mergedObject;
    })

    // get the timeblocks where only ALL attendees are available
    const blocksWithAllAvail = getAvailableBlocks(convertedMergedObjectsArray, userNamesArray);


    // deconstruct date information from the dateString of each object
    const blocksWithAllAvailAndDate = blocksWithAllAvail?.map(availObj => {
      const deconstructedDate = deconstructAvailTimeString(availObj);
      const dateInfo = getDates(availObj.start)
      return {deconstructedDate:deconstructedDate, date: dateInfo, allAvailableTimeBlocks:availObj}
    })

    return blocksWithAllAvailAndDate
  } // end of checkOverlapArrays

  // function to get current timeString and convert it to local time of browser
  const convertTimeString = (timeString:string) => {
    const currentTime = new Date(timeString);

    // get timezoneoffest from local browser
    const timezoneOffset = new Date().getTimezoneOffset();
    const convertedTime = addMinutes(-timezoneOffset, currentTime);

    return convertedTime;
  } // end of function

  // function to return all timeblocks when all attendees are available
  const getAvailableBlocks = (resultsArray:DayObjects[], userNamesArray:(string | undefined)[]) => {
  let startTime:Date | undefined = undefined;
  let endTime:Date | undefined = undefined;
  let allAvailBlocks:AllAvailObj[] = [];
  if(userNamesArray){
    for(let timeblock of resultsArray){
      if(timeblock.array.length === userNamesArray!.length){
        // everyone has completed their availability
        let currentStartTime = timeblock.convertedTimeString;

        if(!startTime && !endTime){
          // set start time as time of first timeString
          startTime = new Date(currentStartTime);
          // set end time as start time plus 30 minutes
          endTime = new Date(currentStartTime);
          endTime = addMinutes(30, endTime);

        }else if(currentStartTime.toTimeString() === endTime?.toTimeString()){
          // check if currentStartTime same as end time
          // if true, change endtime to results starttime plus 30 minutes
          endTime = new Date(currentStartTime)
          endTime = addMinutes(30, endTime);
          
        }else{
          // start and end time are defined but start time of current timestring does not equal the end time => it is a new timeblock
          // push current values of start and end time
          allAvailBlocks.push({ start:startTime!, end:endTime! });
          // set start time as time of current timeString
          startTime = new Date(currentStartTime);
          // set end time as start time plus 30 minutes
          endTime = new Date(currentStartTime)
          endTime = addMinutes(30, endTime);
        }
      }else{
        // console.log("array length not equal to userName length")
      }
    }
    if(startTime !== undefined && endTime !== undefined){
      allAvailBlocks.push({ start:startTime, end:endTime });
      return allAvailBlocks
    }
  }else {
    console.log("usernames not defined")
  }
  }// end of getAvailBlocks

  // function to add minutes to a date
  const addMinutes = (numOfMinutes:number, date = new Date()) => {
    date.setMinutes(date.getMinutes() + numOfMinutes);

    return date;
  }

  // function to deconstruct timeblock to start and end times with am/pm, and length of timeblock
  const deconstructAvailTimeString = (timeblock:AllAvailObj) => {
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
    const endTimeOfBlock = timeblock.end.getTime();
    const startTimeOfBlock = timeblock.start.getTime();

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

   // function to get the day, month and year from a timeblock
   const getDates = (date:Date) => {
    const day = date.getDate();
    const year = date.getFullYear();
    const month = date.toLocaleString('default', {month: "long"});
    const dayOfWeek = date.getDay();
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

    return {day, month, year, dayOfWeekString}
  } // end of getDates function

 


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
                    <ul className="availableTimes">
                      {
                        overlapData !== undefined

                        // map through overlapdata  and display the date info for each dataObject
                       ? overlapData?.map((dataObject, index) => {
                      
                          return(
                              <li key={`DataObj${index}`}>

                                <h3 key={`header${index}`} className="day"><span className="text">{dataObject.date.dayOfWeekString}</span> {dataObject.date.month} {dataObject.date.day}, {dataObject.date.year}</h3>
                                <div className="dayTimes">
                                  <div className="availDisplay">
                                    <p className="timeP">{dataObject.deconstructedDate.startHour}:{dataObject.deconstructedDate.startMinString} {dataObject.deconstructedDate.startAmPm} - {dataObject.deconstructedDate.endHour}:{dataObject.deconstructedDate.endMinString} {dataObject.deconstructedDate.endAmPm} {currentTimeZone}</p>
                                    <p className="length">Everyone is available for <span className="text">{dataObject.deconstructedDate.lengthOfTimeBlock}</span></p>
                                  </div>
                                  <ul className="userNames">
                                    {
                                      userNames!.map((name, index) => {
                                          return(
                                            <li key={`${index}${name}` } className={`user${index + 1}`}>{name!.charAt(0).toUpperCase()}</li>
                                          )
                                      })
                                    }
                                    <li key={`userLength${index}`} className="userLength">{userNames!.length}/{userNames!.length}</li>
                                  </ul>
                                </div>
                              </li>
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