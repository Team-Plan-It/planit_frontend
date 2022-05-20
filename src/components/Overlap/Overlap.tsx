import React, { useState, useEffect }from "react";
import {  useParams, useNavigate } from "react-router-dom";
import axios from "axios";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { DayPilot } from "@daypilot/daypilot-lite-react";

//components
import Sidebar from "../Sidebar/Sidebar";
import AvailabiltyResultsCalendar from "../AvailabilityResultsCalendar/AvailabilityResultsCalendar";
import { useViewport } from "../../CustomHooks";

//styles
import "./Overlap.css";

// types
type Availability = {
    start: string;
    end:string;
    id: number;
    text: string;
  }
type UserInfo = {
  userName?: string;
  timeZone?: string;
  availability?: Availability[];
  id?: string;
} 
type TimeObj ={
  start: string;
  startObj: Date;
  end: string;
  endObj: Date;
  user:string;
}

interface MeetingInfo {
  id: string;
  eventName: string;
  date: string;
  length: string;
  meetingNumber: string;
  timezone: string;
  emails: string[];
  users:UserInfo[];
  availabilityArray: AvailabilityArray;
}

interface AvailabilityArray{
  sunday?: UserInfo[];
  monday?: UserInfo[];
  tuesday?: UserInfo[];
  wednesday?: UserInfo[];
  thursday?: UserInfo[];
  friday?: UserInfo[];
  saturday?: UserInfo[];
}
interface DayObjects{
  time: string;
  timeString?: string;
  convertedTimeString?: DayPilot.Date;
  array: TimeObj[];
}
interface AllDayArrays {
  day0array: DayObjects[];
  day1array: DayObjects[];
  day2array: DayObjects[];
  day3array: DayObjects[];
  day4array: DayObjects[];
  day5array: DayObjects[];
  day6array: DayObjects[];
}

interface DateInfo{
  day: number;
  month: string;
  year: number;
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
  const { width, height } = useViewport();

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
  const [ overlapData, setOverlapData ] = useState<AllDayArrays>();
  // timeZoneOffset
  const [ timeZoneOffset, setTimeZoneOffset ] = useState<number>();
   // timezone of invitee/person using this page
  const [ currentTimeZone, setCurrentTimeZone ] = useState<string>();
  // show calendar view
  const [ showCalendar, setShowCalendar ] = useState<boolean>(false);

  // dates
  const [ sundayDate, setSundayDate ] = useState<DateInfo>();
  const [ mondayDate, setMondayDate ] = useState<DateInfo>();
  const [ tuesdayDate, setTuesdayDate ] = useState<DateInfo>();
  const [ wednesdayDate, setWednesdayDate ] = useState<DateInfo>();
  const [ thursdayDate, setThursdayDate ] = useState<DateInfo>();
  const [ fridayDate, setFridayDate ] = useState<DateInfo>();
  const [ saturdayDate, setSaturdayDate ] = useState<DateInfo>();


  // arrays of all available timeblocks
  const [ sundayAllAvail, setSundayAllAvail ] = useState<AllAvailObj[]>();
  const [ mondayAllAvail, setMondayAllAvail ] = useState<AllAvailObj[]>();
  const [ tuesdayAllAvail, setTuesdayAllAvail ] = useState<AllAvailObj[]>();
  const [ wednesdayAllAvail, setWednesdayAllAvail ] = useState<AllAvailObj[]>();
  const [ thursdayAllAvail, setThursdayAllAvail ] = useState<AllAvailObj[]>();
  const [ fridayAllAvail, setFridayAllAvail ] = useState<AllAvailObj[]>();
  const [ saturdayAllAvail, setSaturdayAllAvail ] = useState<AllAvailObj[]>();
  
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

        setIsLoadingOverlapData(false);
        setOverlapData(overlapResponse.data);

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

  useEffect(() => {
    let abortController = new AbortController();
    if(overlapData !== undefined && meetingData !== undefined && userNames && numOfAttendees && userNames.length === numOfAttendees.length){
      checkOverlapArrays(overlapData);
      console.log("its called! overlapdata useeffect")
    }
    return () => { abortController.abort(); }
  }, [overlapData])

  // function to get the day, month and year
  const getDates = (timeblock:DayObjects) => {
    const convertedTime = new Date(timeblock.timeString!);

    // get date
    const day = convertedTime.getDate();
    const year = convertedTime.getFullYear();
    const month = convertedTime.toLocaleString('default', {month: "long"});

    return {day, month, year}
  }

  // check each day array of overlapping results for timeslots that have length > 0
  const checkOverlapArrays = (arrayOfDayArrays:AllDayArrays) => {
    //function to filter out timeslots that have a length > 0
    const checkDayArray = (dayArray:DayObjects[]) => {
      const timeslotsWithAvail:any = dayArray.filter(timeslot => {return timeslot.array.length > 0})
    
      return timeslotsWithAvail;
    }

    // function to get current timeString and convert it to local time of browser
    const convertTimeString = (timeString:string) => {
      const currentTimeString = new DayPilot.Date(timeString);
      const convertedTimeString = currentTimeString.addMinutes(-timeZoneOffset!);
      return convertedTimeString;
    }

    // if array for each day of the week has content
    if(arrayOfDayArrays.day0array.length > 0){
      // get date and save in state
      const sundayDate = getDates(arrayOfDayArrays.day0array[0]);
      setSundayDate(sundayDate);

      // save filtered results in a variable for each day
      const sundayResults = checkDayArray(arrayOfDayArrays.day0array);
      
      // convert timeString of each object in the array and add it to the array and save in state
      sundayResults.forEach((timeblock:DayObjects, index:number) => {
        let convertedTimeString = convertTimeString(timeblock.timeString!);
        sundayResults[index].convertedTimeString = convertedTimeString;
      })
      // get availability blocks when all attendees are available and save in state
      const sundayAvailBlocks = getAvailableBlocks(sundayResults);
      setSundayAllAvail(sundayAvailBlocks!);
    }
   
    if(arrayOfDayArrays.day1array.length > 0){
      const mondayDate = getDates(arrayOfDayArrays.day1array[0]);
      setMondayDate(mondayDate);

      const mondayResults = checkDayArray(arrayOfDayArrays.day1array);
      
      mondayResults.forEach((timeblock:DayObjects, index:number) => {
        let convertedTimeString = convertTimeString(timeblock.timeString!);
        mondayResults[index].convertedTimeString = convertedTimeString;
      })

      const mondayAvailBlocks = getAvailableBlocks(mondayResults);
      if(mondayAvailBlocks !== undefined){
        setMondayAllAvail(mondayAvailBlocks!);
      }
    }

    if(arrayOfDayArrays.day2array.length > 0){
      const tuesdayDate = getDates(arrayOfDayArrays.day2array[0]);
     
      setTuesdayDate(tuesdayDate);
      const tuesdayResults = checkDayArray(arrayOfDayArrays.day2array);
      tuesdayResults.forEach((timeblock:DayObjects, index:number) => {
        let convertedTimeString = convertTimeString(timeblock.timeString!);
        tuesdayResults[index].convertedTimeString = convertedTimeString;
      })
      const tuesdayAvailBlocks = getAvailableBlocks(tuesdayResults);
      if(tuesdayAvailBlocks !== undefined){
        setTuesdayAllAvail(tuesdayAvailBlocks!);
      }
    }

    if(arrayOfDayArrays.day3array.length > 0){
      const wednesdayDate = getDates(arrayOfDayArrays.day3array[0]);
      setWednesdayDate(wednesdayDate);
      const wednesdayResults = checkDayArray(arrayOfDayArrays.day3array);

      wednesdayResults.forEach((timeblock:DayObjects, index:number) => {
        let convertedTimeString = convertTimeString(timeblock.timeString!);
        wednesdayResults[index].convertedTimeString = convertedTimeString;
      })

      const wednesdayAvailBlocks = getAvailableBlocks(wednesdayResults);
      if(wednesdayAvailBlocks !== undefined){
        setWednesdayAllAvail(wednesdayAvailBlocks!);
      }
    }

    if(arrayOfDayArrays.day4array.length > 0){
      const thursdayDate = getDates(arrayOfDayArrays.day4array[0]);
      setThursdayDate(thursdayDate);
      const thursdayResults = checkDayArray(arrayOfDayArrays.day4array);

      thursdayResults.forEach((timeblock:DayObjects, index:number) => {
        let convertedTimeString = convertTimeString(timeblock.timeString!);
        thursdayResults[index].convertedTimeString = convertedTimeString;
      })

      const thursdayAvailBlocks = getAvailableBlocks(thursdayResults);
      if(thursdayAvailBlocks !== undefined){
        setThursdayAllAvail(thursdayAvailBlocks!);
      }
    }

    if(arrayOfDayArrays.day5array.length > 0){
      const fridayDate = getDates(arrayOfDayArrays.day5array[0]);
      setFridayDate(fridayDate);
      const fridayResults = checkDayArray(arrayOfDayArrays.day5array);

      fridayResults.forEach((timeblock:DayObjects, index:number) => {
        let convertedTimeString = convertTimeString(timeblock.timeString!);
        fridayResults[index].convertedTimeString = convertedTimeString;
      })

      const fridayAvailBlocks = getAvailableBlocks(fridayResults);
      if(fridayAvailBlocks !== undefined){
        setFridayAllAvail(fridayAvailBlocks!);
      }
    }

    if(arrayOfDayArrays.day6array.length > 0){
      const saturdayDate = getDates(arrayOfDayArrays.day6array[0]);
      setSaturdayDate(saturdayDate);
      const saturdayResults = checkDayArray(arrayOfDayArrays.day6array);

      saturdayResults.forEach((timeblock:DayObjects, index:number) => {
        let convertedTimeString = convertTimeString(timeblock.timeString!);
        saturdayResults[index].convertedTimeString = convertedTimeString;
      })

      const saturdayAvailBlocks = getAvailableBlocks(saturdayResults);
      if(saturdayAvailBlocks !== undefined){
        setSaturdayAllAvail(saturdayAvailBlocks!);
      }
    }
  }


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


  const getAvailableBlocks = (resultsArray:DayObjects[]) => {
    let startTime:DayPilot.Date;
    let endTime:DayPilot.Date;
    let allAvailBlocks:AllAvailObj[] = [];
    // go through array looking for array length === numOfAttendees
    if(userNames){
      resultsArray.forEach(timeblock => {
  
        if(timeblock.array.length === userNames!.length){
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
                      <li>
                        
                        {
                          sundayDate && sundayAllAvail && sundayAllAvail.length > 0
                          ?<h3 className="day"><span className="text">Sunday</span> {sundayDate.month} {sundayDate.day}, {sundayDate.year}</h3>
                          :null
                          
                        }
                          
                        {
                          sundayAllAvail && sundayAllAvail.length > 0 && userNames
                          ? <>
                                <ul className="dayTimes">
                                  {
                                    sundayAllAvail.map((timeblock) => {
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
                                                userNames.map((name, index) => {
                                                    return(
                                                      <li key={`${index}${name}` } className={`user${index + 1}`}>{name!.charAt(0).toUpperCase()}</li>
                                                    )
                                                })
                                              }
                                              <li key={"userLength"} className="userLength">{userNames.length}/{userNames.length}</li>
                                            </ul>

                                          </li>
                                        )
                                    })
                                  }
                                </ul>
                            </>
                          : null
                        }
                      </li>
                      <li>
                        
                        {
                          mondayDate && mondayAllAvail && mondayAllAvail.length > 0
                          ?<h3 className="day"><span className="text">Monday</span> {mondayDate.month} {mondayDate.day}, {mondayDate.year}</h3>
                          :null
                        }
                        {
                          mondayAllAvail && mondayAllAvail.length > 0 && userNames
                          ? <>
                                <ul className="dayTimes">
                                  {
                                    mondayAllAvail.map((timeblock) => {
                        
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
                                                userNames
                                                ? userNames.map((name, index) => {
                                                    return(
                                                      <li key={`${index}${name}` } className={`user${index + 1}`}>{name!.charAt(0).toUpperCase()}</li>
                                                    )
                                                })
                                                :null
                                              }
                                              <li key={"userLength"} className="userLength">{userNames.length}/{userNames.length}</li>
                                            </ul>
                                          </li>
                                        )
                                    })
                                  }
                                </ul>
                            </>
                          : null
                        }
                      </li>
                      <li>
                        
                        {
                          tuesdayDate && tuesdayAllAvail && tuesdayAllAvail.length > 0
                          ?<h3 className="day"><span className="text">Tuesday</span> {tuesdayDate.month} {tuesdayDate.day}, {tuesdayDate.year}</h3>
                          :null
                        }
                        {
                          tuesdayAllAvail && tuesdayAllAvail.length > 0 && userNames
                          ? <>
                                <ul className="dayTimes">
                                  {
                                    tuesdayAllAvail.map((timeblock) => {
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
                                                userNames.map((name, index) => {
                                                    return(
                                                      <li key={`${index}${name}` } className={`user${index + 1}`}>{name!.charAt(0).toUpperCase()}</li>
                                                    )
                                                })
                                              }
                                              <li key={"userLength"} className="userLength">{userNames.length}/{userNames.length}</li>
                                            </ul>
                                          </li>
                                        )
                                    })
                                  }
                                </ul>
                            </>
                          : null
                        }
                      </li>
                      <li>
                        
                        {
                          wednesdayDate && wednesdayAllAvail && wednesdayAllAvail.length > 0
                          ?<h3 className="day"><span className="text">Wednesday</span> {wednesdayDate.month} {wednesdayDate.day}, {wednesdayDate.year}</h3>
                          :null
                        }
                        {
                          wednesdayAllAvail && wednesdayAllAvail.length > 0 && userNames
                          ? <>
                                <ul className="dayTimes">
                                  {
                                    wednesdayAllAvail.map((timeblock) => {
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
                                                userNames.map((name, index) => {
                                                    return(
                                                      <li key={`${index}${name}` } className={`user${index + 1}`}>{name!.charAt(0).toUpperCase()}</li>
                                                    )
                                                })
                                              }
                                              <li key={"userLength"} className="userLength">{userNames.length}/{userNames.length}</li>
                                            </ul>
                                          </li>
                                        )
                                    })
                                  }
                                </ul>
                            </>
                          : null
                        }
                      </li>
                      <li>
                        
                        {
                          thursdayDate && thursdayAllAvail && thursdayAllAvail.length > 0
                          ?<h3 className="day"><span className="text">Thursday</span> {thursdayDate.month} {thursdayDate.day}, {thursdayDate.year}</h3>
                          :null
                        }
                        {
                          thursdayAllAvail && thursdayAllAvail.length > 0 && userNames
                          ? <>
                                <ul className="dayTimes">
                                  {
                                    thursdayAllAvail.map((timeblock) => {
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
                                                userNames.map((name, index) => {
                                                    return(
                                                      <li key={`${index}${name}` } className={`user${index + 1}`}>{name!.charAt(0).toUpperCase()}</li>
                                                    )
                                                })
                                              }
                                              <li key={"userLength"} className="userLength">{userNames.length}/{userNames.length}</li>
                                            </ul>
                                          </li>
                                        )
                                    })
                                  }
                                </ul>
                            </>
                          : null
                        }
                      </li>
                      <li>
                        
                        {
                          fridayDate && fridayAllAvail && fridayAllAvail.length > 0
                          ?<h3 className="day"><span className="text">Friday</span> {fridayDate.month} {fridayDate.day}, {fridayDate.year}</h3>
                          :null
                        }
                        {
                          fridayAllAvail && fridayAllAvail.length > 0 && userNames
                          ? <>
                                <ul className="dayTimes">
                                  {
                                    fridayAllAvail.map((timeblock) => {
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
                                                userNames.map((name, index) => {
                                                    return(
                                                      <li key={`${index}${name}` } className={`user${index + 1}`}>{name!.charAt(0).toUpperCase()}</li>
                                                    )
                                                })
                                              }
                                              <li key={"userLength"} className="userLength">{userNames.length}/{userNames.length}</li>
                                            </ul>
                                          </li>
                                        )
                                    })
                                  }
                                </ul>
                            </>
                          : null
                        }
                      </li>
                      <li>
                        
                        {
                          saturdayDate && saturdayAllAvail && saturdayAllAvail.length > 0
                          ?<h3 className="day"><span className="text">Saturday</span> {saturdayDate.month} {saturdayDate.day}, {saturdayDate.year}</h3>
                          :null
                        }
                        {
                          saturdayAllAvail && saturdayAllAvail.length > 0 && userNames
                          ? <>
                                <ul className="dayTimes">
                                  {
                                    saturdayAllAvail.map((timeblock) => {
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
                                                userNames.map((name, index) => {
                                                    return(
                                                      <li key={`${index}${name}` } className={`user${index + 1}`}>{name!.charAt(0).toUpperCase()}</li>
                                                    )
                                                })
                                              }
                                              <li key={"userLength"} className="userLength">{userNames.length}/{userNames.length}</li>
                                            </ul>
                                          </li>
                                        )
                                    })
                                  }
                                </ul>
                            </>
                          : null
                        }
                      </li>
                      <li key={"noAvailList"}>
                        {
                          (!sundayAllAvail || sundayAllAvail.length === 0) && (!mondayAllAvail || mondayAllAvail!.length === 0) && (!tuesdayAllAvail || tuesdayAllAvail!.length === 0) && (!wednesdayAllAvail || wednesdayAllAvail!.length === 0) && (!thursdayAllAvail || thursdayAllAvail!.length === 0) && (!fridayAllAvail || fridayAllAvail!.length === 0) && (!saturdayAllAvail || saturdayAllAvail!.length === 0)

                          ?<h3 className="noAvail">I'm afraid we could not find a time when everyone was available</h3>
                          :null
                        }
                      </li>
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