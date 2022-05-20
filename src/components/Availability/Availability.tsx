import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { ErrorMessage } from "@hookform/error-message";
import Modal from "react-modal";
import axios from "axios";
import {  useNavigate, useParams  } from "react-router-dom";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { DayPilot, DayPilotCalendar } from "@daypilot/daypilot-lite-react";

// components
import Sidebar from "../Sidebar/Sidebar";
import blueTextLogo from "../../assets/blueLetterLogo.png";
import { useOrientation, useViewport } from "../../CustomHooks";

//styles
import "./Availability.css";

//types
type UserName = string;
type AvailabilityArray = any[];
type Timezone = string;



type FormData = {
  userName: UserName;
  availability: AvailabilityArray;
  timezone: Timezone;
  
}



const Availability = (props: any) => {

  // get meetingID from useParams of url
  const meetingNumID = useParams().id;
  
  let navigate = useNavigate();

  let calendar = DayPilot.Calendar;

  // initialize useForm
  const { register, handleSubmit, setValue, formState: { errors}, reset } = useForm<FormData>();

  // init modal
  Modal.setAppElement('#root');

  //  init custom hook for device orientation
  const orientation = useOrientation();

  // init custom hook for window height and width
  const { width, height } = useViewport();

  // initialize state
  // all availabilites selected by user
  const [ eventArray, setEventArray ] = useState<AvailabilityArray>([]);
  // timezone of invitee/person using this page
  const [ timezone, setTimezone ] = useState<string>();
  // timeZoneOffset
  const [ timeZoneOffset, setTimeZoneOffset ] = useState<number>();
  // availability modal open
  const [ availabilityModalIsOpen, setAvailabilityModalIsOpen ] = useState<boolean>(false);
  // event name
  const [ eventName, setEventName ] = useState<string>();
  // date selected by coordinator
  const [ selectedDate, setSelectedDate ] = useState<string>();
   // time zone of coordinator
  const [ coordTimeZone, setCoordTimeZone ] = useState<string>();
  // calendar month
  const [ calendarMonth, setCalendarMonth ] = useState<string>();
  // calendar year
  const [ calendarYear , setCalendarYear ] = useState<number>();
  // number of invitees
  const [ numOfAttendees, setNumOfAttendees ] = useState<number[]>();
  // modal that opens if user enters no availability
  const [ noAvailIsOpen, setNoAvailIsOpen ] = useState<boolean>(false);
  // all data to be sent to axios post
  const [ allData, setAllData ] = useState<FormData>();

  axios.defaults.baseURL = process.env.REACT_APP_BASE_URL_LOCAL

  // get timezone of user
  useEffect(() => {
    // async function for axios call
    let abortController = new AbortController();
    const getData = async() => {
      try{
        const url = `dates/results/${meetingNumID}`
        const response = await axios.get(url);
      
        if(response !== undefined){

          //deconstruct data from response
          const { eventName, date, timezone, emails } = response.data[0];

          // save data in state
          setEventName(eventName);
          setSelectedDate(date);
          setCoordTimeZone(timezone);

          // get month as string from event date
          const month = new Date(date).toLocaleString('default', {month: "long"});
          setCalendarMonth(month);
          //get year
          const year = new Date(date).getFullYear();
          setCalendarYear(year);

          // get current timeZone
          const eventTimeZone = new Date().toLocaleTimeString(undefined, {timeZoneName: "short"}).split(" ")[2];
          setTimezone(eventTimeZone);

          // get timezoneoffest
          const timeZoneOffset = new Date().getTimezoneOffset();
          setTimeZoneOffset(timeZoneOffset);

          // determine number of meeting attendees
          // includes coordinator
          let arrayOfNumOfUsers = [1];
          if(emails.length > 0){
            for (let i= 0; i < emails.length; i++){
              arrayOfNumOfUsers.push(i + 2)
            }
            setNumOfAttendees(arrayOfNumOfUsers);
          }
        }
      }
      catch(error){
        if(error instanceof Error){
          navigate("/error404");
          console.log("error message: ", error.message)
        }
      }
    }
    // open modal
    setAvailabilityModalIsOpen(true);
    // make axios call to get data
    getData();
    return () => { abortController.abort(); }
    
  }, [])



  // function to put time in hours/minutes in am/pm format
  const timeFormatCalc = (time:any) => {
    const hours = time.getHours();
    const hour = (hours % 12) || 12;
    let pm = false;
    if(hours > 11){
      pm = true;
    }
    const minutes = time.getMinutes() <= 9 ? "0" + time.getMinutes() : time.getMinutes();

    return `${hour}:${minutes} ${pm ?"pm" :"am"}`
  }

  // creates an event when the user clicks on a time block
  const handleTimeSelected = (args:any) => {
    // the two parameters of the event time block in string format
    // eg. "2022-04-05T09:00:00"
    const start = args.start;
    const end = args.end;
  
    // get day of week number
    const dayOfWeek = start.getDayOfWeek();

    // create text with start and end time of selection
    const startText = timeFormatCalc(start);
    const endText = timeFormatCalc(end);
       

    const dp = args.control;
    dp.clearSelection();

    dp.events.add(
      new DayPilot.Event({
        start: start,
        end: end,
        id: dayOfWeek,
        text: `Avail: ${startText} - ${endText}`,
      })
    );
    // dp.events.list contains all of the events that have been created
    setEventArray(dp.events.list);
  };


  // deletes the event when the user clicks on it
  const handleEventClicked = (args: any) => {
    const dp = args.control;
    dp.events.remove(args.e);
    setEventArray(dp.events.list);
  }

  const handleNoAvailClose = () => {
    // user has no availability to submit
    // axios POST
    const noAvailUrl = `/dates/availability/${meetingNumID}`
    axios.post(noAvailUrl, allData)
    .then(() => {
      navigate(`/overlapping/${meetingNumID}`, { 
        state: {
          meetingNumID: meetingNumID
        }
       });
    })
  }





  // makes axios post call when user submits availability form
  const onSubmit = handleSubmit<FormData>(data => {
    
    if(data.availability.length === 0){
      setAllData(data);
      setNoAvailIsOpen(true);
    }else{

    
    // convert times to UTC0
    let availToChange = data.availability;
    availToChange.forEach((availBlock) => {
      // for each object, get start and end value
      let currentStart = availBlock.start;
      let currentEnd = availBlock.end;
      // add the timeZoneOffset in minutes to currentTime
      let newStart =  currentStart.addMinutes(timeZoneOffset);
      let newEnd = currentEnd.addMinutes(timeZoneOffset);
      // save new value as start and end time
      availBlock.start = newStart;
      availBlock.end = newEnd;

    })

    // axios POST
    const postUrl = `/dates/availability/${meetingNumID}`
    axios.post(postUrl, data)
    .then(() => {
      navigate(`/overlapping/${meetingNumID}`, { 
        state: {
          meetingNumID: meetingNumID
        }
       });
    })

    //reset form fields
    // reset();
    }
  })

  return(
    <div className="availability">
        <Sidebar numOfAttendees={numOfAttendees} results={false}/>
        <div className="background">
           
        </div>
        <Modal 
          className={"availabilityModal"}
          overlayClassName={"availabilityOverlay"}
          isOpen={availabilityModalIsOpen}
          shouldCloseOnOverlayClick={false}
          contentLabel="Availability page"
          style={{content: {WebkitOverflowScrolling: 'touch',}}}
          >
            <div className="availabilityModalInfo">
              <h1>Add <span className="text">Availability</span></h1>
            
              <h2>{eventName}</h2>

          
              <p className="bold">Click and drag to add your availability.</p>
              <p>Please note that you are inputting your availability in your local time <span className="text bold">{timezone}</span> and it will be converted to the coordinator's time zone <span className="text bold">{coordTimeZone}</span>.</p>
            </div>
          
          {
           (width! >= 810 && height! >= 810) || (orientation === "landscape" && width! > 700)
           ? <form onSubmit={ onSubmit }>
            
            <section className="userNameInput">
                <label htmlFor="userName">Name</label>
                <input 
                  id="userName"
                  type="text" 
                  className={errors.userName ?"error" :"success"}
                  placeholder={"Input text"}
                  aria-label="Enter name here"
                  aria-invalid={errors.userName ?"true" :"false"}
                  {...register("userName", {required: "Name is required" })} 
                />
                {/* error message if no name entered */}
                <ErrorMessage errors={errors} name="userName" as="p" className="errorMessage"/>


                <button
                  type="submit"
                  className="availabilitySubmitBtn"
                  onClick={() => {
                    setValue("availability", eventArray ?eventArray :[])
                    setValue("timezone", timezone ?timezone :"")
                  }}> 
                  Add Availability
                </button>
            </section>
            


                <section className="calendarContainer">
                  <div className="calendarHeader">
                    <p>{calendarMonth} {calendarYear}</p>
                  </div>
                  <DayPilotCalendar 
                    viewType={"Week"}
                    // headerDateFormat={"ddd MMMM dd yyyy"}
                    headerDateFormat={"ddd dd"}
                    startDate={selectedDate}
                    onTimeRangeSelected={handleTimeSelected}
                    onEventClick={handleEventClicked}
                    durationBarVisible = {false}
                    heightSpec={"Full"}
                    cellHeight={20}
                    width={"95%"}
                  />
                </section>
            
            </form>
            
            : <div className="deviceMessage">
                <p>This app is best used on a larger screen, such as a laptop or desktop computer.</p>
                {
                  (orientation === "landscape" && width! > 700) || (orientation === "portrait" && width! > 700)
                  ?<p>Turn your phone to landscape for a better view.</p>
                  :null
                }
            </div>
          }

        </Modal>

      {/* no avialability entered modal */}
        <Modal
          className={"noAvailModal"}
          overlayClassName={"noAvailOvrlay"}
          isOpen={noAvailIsOpen}
          shouldCloseOnOverlayClick={false}
          onRequestClose={handleNoAvailClose}
          contentLabel="No Availability entered page"
          style={{content: {WebkitOverflowScrolling: 'touch',}}}
        >
          <img src={blueTextLogo} alt="plan-it paper airplane logo with blue text"/>
          <h1>Oops! You did not enter your availability for the week.</h1>
          <h2>Would you like to go back and enter your availability?</h2>
         
          <div className="buttons">
            <button className="backToAvail" onClick={() => setNoAvailIsOpen(false)}>Yes! Take me back.</button>
            <button className="noAvailability" onClick={() => handleNoAvailClose()}>No. I have no time that week.</button>
          </div>
        </Modal>

    
    </div>
  )
}

export default Availability;