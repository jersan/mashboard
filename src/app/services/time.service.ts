import { Moment } from 'moment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Event } from './../models/event.model';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import 'rxjs/Rx';
import * as moment from 'moment';

@Injectable()
export class TimeService {

  constructor(private httpClient: HttpClient) {}

  serverUrl = "https://www.mashboard.app";
  now: Moment = moment();
  private activeDate: Moment = moment();

  private dayEventStartTime: Moment;
  private dayEventEndTime: Moment;

  private eventList: Event[] = [];

  getDate(): Moment{
    return this.now;
  }
  setActiveDate(date: Moment){
    this.activeDate = moment(date);
  }

  getActiveDate(): Moment{
    return this.activeDate;
  }

  setDayEventTimes(startTime: Moment, endTime: Moment){
    this.dayEventStartTime = startTime;
    this.dayEventEndTime = endTime;
  }
  getDayEventStartTime(): Moment{
    return this.dayEventStartTime;
  }
  getDayEventEndTime(): Moment{
    return this.dayEventEndTime;
  }
  saveEvent(event: Event){
    //receives Event object from Event-form modal, then saves it to database
    // Regarding Date objects / types:  use the toJSON() method to pass via JSON object
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toJSON
    
    const postUrl = this.serverUrl + "/event/create";
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
        // 'Authorization': 'my-auth-token'
      })
    };
    return this.httpClient.post<Event>(postUrl,event,httpOptions);
  }


  getEventsByDate(date: Moment): Observable<Event[]> {
    const getUrl = this.serverUrl + "/event/byDate";
    const body = {
      'startDate':date.format('YYYY-MM-DD'),
      'endDate':moment(date).add(1, 'day').format('YYYY-MM-DD')
    };
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
        // 'Authorization': 'my-auth-token'
      })
    };
    let request = this.httpClient.post<Event[]>(getUrl, body, httpOptions);
    return request;

  }



}
