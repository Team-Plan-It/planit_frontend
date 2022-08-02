// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { DayPilot } from "@daypilot/daypilot-lite-react";


export type AvailabilityI = {
    start: string;
    end:string;
    id: number;
    text: string;
}

export type UserInfo = {
    userName?: string;
    timeZone?: string;
    availability?: AvailabilityI[];
    id?: string;
} 

export type TimeObj ={
    start: string;
    startObj: Date;
    end: string;
    endObj: Date;
    user:string;
}

export interface MeetingInfo {
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
  
export interface AvailabilityArray{
    sunday?: UserInfo[];
    monday?: UserInfo[];
    tuesday?: UserInfo[];
    wednesday?: UserInfo[];
    thursday?: UserInfo[];
    friday?: UserInfo[];
    saturday?: UserInfo[];
}

export interface DayObjects{
    time: string;
    timeString?: string;
    convertedTimeString?: DayPilot.Date;
    array: TimeObj[];
}

export interface DateInfo{
    day: number;
    month: string;
    year: number;
}