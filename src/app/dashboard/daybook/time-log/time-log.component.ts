import { Component, OnInit, Input, OnDestroy, Output, EventEmitter } from '@angular/core';
import * as moment from 'moment';
import { Subscription, timer, Subject } from 'rxjs';
import { ITimeSegmentTile } from './time-segment-tile.interface';
import { TimeSegment } from './time-segment.model';
import { TimelogService } from './timelog.service';
import { faSpinner, faCaretUp, faCaretDown } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-time-log',
  templateUrl: './time-log.component.html',
  styleUrls: ['./time-log.component.css']
})
export class TimeLogComponent implements OnInit, OnDestroy {

  constructor(private timelogService: TimelogService) { }

  faSpinner = faSpinner;
  faCaretUp = faCaretUp;
  faCaretDown = faCaretDown;

  nowLineContainerStyle: any = {};
  nowTime: moment.Moment = moment();
  nowTimeContainerStyle: any = {};
  ifNowLine: boolean = false;


  ifLoading: boolean = true;

  private _nowSubscription: Subscription = new Subscription();
  private _fetchTimeSegmentsSubscription: Subscription = new Subscription();

  timeSegmentTiles: ITimeSegmentTile[] = [];
  nextTimeSegmentTile: ITimeSegmentTile = null;
  nextTimeSegment: TimeSegment = null


  timelogViewStyle: any = {};
  hourLabels: {hour:string, style:any}[] = [];
  hourLines: { time: moment.Moment , style: any }[] = [];
  bookLines: {
    line: number,
    style: any,
    startTime: moment.Moment,
    endTime: moment.Moment
  }[] = [];


  private _currentDate: moment.Moment = moment();
  private _currentDate$: Subject<moment.Moment> = new Subject();
  private _currentDateSubscription: Subscription = new Subscription();

  @Input() set currentDate(date: moment.Moment) {
    this._currentDate = moment(date);
    this._currentDate$.next(moment(this._currentDate));
  }
  @Output() clickTimeSegment: EventEmitter<ITimeSegmentTile> = new EventEmitter();
  @Output() clickNextTimeSegment: EventEmitter<TimeSegment> = new EventEmitter();
  @Output() changedDate: EventEmitter<moment.Moment> = new EventEmitter();

  private _timeWindow: { startTime: moment.Moment, endTime: moment.Moment } = null;
  private _timeWindow$: Subject<{ startTime: moment.Moment, endTime: moment.Moment }> = new Subject();
  private _timeWindowSubscription: Subscription = new Subscription();

  private _windowLapsedDay: boolean = false;

  private setTimeWindow(timeWindow: { startTime: moment.Moment, endTime: moment.Moment }) {
    this._timeWindow = timeWindow;
    this._timeWindow$.next(this._timeWindow);
    if(moment(this._timeWindow.startTime).format('YYYY-MM-DD') != this._currentDate.format('YYYY-MM-DD')){
      this._windowLapsedDay = true;
      this.changedDate.emit(this._timeWindow.startTime);
    }
  }

  timeSegments: TimeSegment[] = [];

  ngOnInit() {

    this._nowSubscription.unsubscribe();
    this._fetchTimeSegmentsSubscription.unsubscribe();
    this.ifLoading = false;

    this._currentDateSubscription = this._currentDate$.subscribe((date: moment.Moment) => {
      let defaultTimeWindow: { startTime: moment.Moment, endTime: moment.Moment } = { startTime: moment(date).hour(7).minute(30).second(0).millisecond(0), endTime: moment(date).hour(22).minute(50).second(0).millisecond(0)};
    
      this._timeWindowSubscription.unsubscribe();
      this._timeWindowSubscription = this._timeWindow$.subscribe((timeWindow:  {startTime: moment.Moment, endTime: moment.Moment }) => {
        this.buildDisplay(timeWindow);
      });

      if(this._windowLapsedDay){
        this._windowLapsedDay = false;
      }else{
        // if(moment().format('YYYY-MM-DD') == moment(date).format('YYYY-MM-DD') ){
        //   if(moment().isBefore(moment(defaultTimeWindow.startTime).add(1, 'hour'))){
            
        //     let windowStart: moment.Moment = moment().
        //   }else if(moment().isAfter(moment(defaultTimeWindow.endTime).subtract(1,'hour'))){

        //   }
        // }
        this.setTimeWindow(defaultTimeWindow);
      }
      
    });
    this._currentDate$.next(moment());

  }

  private buildDisplay(timeWindow: {startTime: moment.Moment, endTime: moment.Moment}){
    // console.log("Building display from " + startTime.format('hh:mm a') + " to " + endTime.format('hh:mm a'));

    function roundTimes(timeWindow){
      /*
        The simple approach here is to retain a single layout shape, which is one where the hourLabels are offset directly in the center
        of where the bottom of one of the hourLines are.  By doing this, we need to start the frame above by a half hour and below by a half hour of a given hour.

        An alternative solution, to start at exactly 8:00am and not 7:30am, would be to design a different layout to accommodate that, but as of now, the approach is that
        if the day start time is 8:00am, then it gets rounded down to 7:30am to retain the layout shape.
      */
      let startTime:moment.Moment = moment(timeWindow.startTime);
      let earliestStart = (moment(startTime).hour(startTime.hour()).minute(0).second(0).millisecond(0)).subtract(30,'minutes');
      if(startTime.isBefore(moment(earliestStart).add(1,'hour'))){
        startTime = moment(earliestStart);
      }else if(startTime.isSameOrAfter(moment(earliestStart).add(1,'hour'))){
        startTime = moment(earliestStart).add(1,'hour');
      }
      let endTime: moment.Moment = moment(timeWindow.endTime);
      let latestEnd = (moment(endTime).hour(endTime.hour()).minute(0).second(0).millisecond(0)).add(1,'hour').add(30,'minutes');
      if(endTime.isSameOrBefore(moment(latestEnd).subtract(1,'hour'))){
        endTime = moment(latestEnd).subtract(1,'hour');
      }else if(endTime.isAfter(moment(latestEnd).subtract(1,'hour'))){
        endTime = moment(latestEnd);
      }
      return {startTime: startTime, endTime: endTime};
    }
    timeWindow = roundTimes(timeWindow);
    

    // let halfHours: number = moment(timeWindow.endTime).diff(moment(timeWindow.startTime), 'minutes') / 30;


    
    let hourLabels: {hour:string, style: any}[] = []
    let hourLines: {time:moment.Moment, style: any}[] = [];
    let currentHalfHour:moment.Moment = moment(timeWindow.startTime);

    let labelRowCount: number = 1;
    let lineRowCount: number = 1;

    while(moment(currentHalfHour).isSameOrBefore(moment(timeWindow.endTime))){
      let labelGridRowStyle: string = "" + labelRowCount + " / span 2";
      let lineGridRowStyle: string = "" + lineRowCount + " / span 1";

      let lastLineBorderBottom: string = "none";
      let midnightBorderTop: string = "1px solid rgb(220, 253, 255);";
      if(moment(currentHalfHour).isSame(moment(timeWindow.endTime))){
        lastLineBorderBottom = "1px solid rgb(220, 253, 255)";
      }
      if(moment(currentHalfHour).hour() == 0 && moment(currentHalfHour).minute() == 0){
        midnightBorderTop = "1px solid gray";
      } 

      hourLines.push({time: currentHalfHour, style: { "grid-row": lineGridRowStyle , "border-bottom":lastLineBorderBottom, "border-top": midnightBorderTop }});
      if(currentHalfHour.minute() == 0){
        hourLabels.push({hour: moment(currentHalfHour).format('h a'), style: { "grid-row": labelGridRowStyle}});
        labelRowCount += 2;
      }
      currentHalfHour = moment(currentHalfHour).add(30,'minutes');
      lineRowCount ++; 
    }

    this.hourLabels = hourLabels;
    this.hourLines = hourLines;
  }

  onClickCaret(direction: string){

    let timeWindow: {startTime: moment.Moment, endTime: moment.Moment} = this._timeWindow;

    if(direction == "UP"){
      timeWindow.startTime = moment(timeWindow.startTime).subtract(1,'hour');
      timeWindow.endTime = moment(timeWindow.endTime).subtract(1,'hour');
    }else if(direction == "DOWN"){
      timeWindow.startTime = moment(timeWindow.startTime).add(1,'hour');
      timeWindow.endTime = moment(timeWindow.endTime).add(1,'hour');
    }
    this.setTimeWindow(timeWindow);
  }



  // private displayNextTimeSegment(startTime: moment.Moment, endTime: moment.Moment) {
  //   if (moment(this.currentDate).format('YYYY-MM-DD') == moment().format('YYYY-MM-DD')) {
  //     let lastEndTime = this.getLastEndTime();
  //     this.nextTimeSegment = new TimeSegment('NEXT_TIME_SEGMENT', '', lastEndTime, moment().toISOString(), '');
  //     if (moment().diff(lastEndTime, 'minutes') > 5) {
  //       this.nextTimeSegmentTile = this.buildTimeSegmentTile(this.nextTimeSegment, startTime, endTime);
  //     } else {
  //       this.nextTimeSegmentTile = null;
  //     }
  //   } else {
  //     this.nextTimeSegmentTile = null;
  //   }
  // }

  // private getLastEndTime(): string {
  //   if (this.timeSegments.length > 0) {
  //     let latestTime = moment(this.timeSegments[0].endTime);
  //     for (let timeSegment of this.timeSegments) {
  //       if (moment(timeSegment.endTime).isAfter(latestTime)) {
  //         latestTime = moment(timeSegment.endTime);
  //       }
  //     }
  //     return latestTime.toISOString();
  //   } else {
  //     moment().toISOString();
  //   }

  // }

  // private buildTimeSegmentTile(timeSegment: TimeSegment, startTime: moment.Moment, endTime: moment.Moment): ITimeSegmentTile {
  //   let tile: ITimeSegmentTile = null;
  //   let segmentStart: moment.Moment = moment(timeSegment.startTime);
  //   let segmentEnd: moment.Moment = moment(timeSegment.endTime);

  //   if (segmentStart.isSameOrAfter(endTime) || segmentEnd.isSameOrBefore(startTime)) {
  //     return null;
  //   }
  //   if (segmentStart.isBefore(startTime) && segmentEnd.isAfter(startTime) && segmentEnd.isSameOrBefore(endTime)) {
  //     segmentStart = moment(startTime);
  //   }
  //   if (segmentEnd.isAfter(endTime) && segmentStart.isBefore(endTime) && segmentStart.isSameOrAfter(startTime)) {
  //     segmentEnd = moment(endTime);
  //   }

  //   let duration = segmentEnd.diff(segmentStart, 'minutes');


  //   let lineStart: {
  //     line: number,
  //     style: any,
  //     startTime: moment.Moment,
  //     endTime: moment.Moment
  //   } = null;
  //   let lineEnd: {
  //     line: number,
  //     style: any,
  //     startTime: moment.Moment,
  //     endTime: moment.Moment
  //   } = null;
  //   let gridMax: number = 1;


  //   for (let gridLine of this.bookLines) {
  //     if (moment(segmentStart).isSameOrAfter(moment(gridLine.startTime))) {
  //       lineStart = gridLine;
  //     }
  //     if (moment(segmentEnd).isSameOrBefore(moment(gridLine.endTime)) && moment(segmentEnd).isSameOrAfter(moment(gridLine.startTime))) {
  //       let index = this.bookLines.indexOf(gridLine) + 1;
  //       if (index > this.bookLines.length) {
  //         index = this.bookLines.length - 1;
  //       }
  //       lineEnd = this.bookLines[index];
  //     }

  //     if (gridLine.line > gridMax) {
  //       gridMax = gridLine.line;
  //     }
  //   }

  //   let containerSpan = moment(lineEnd.startTime).diff(lineStart.startTime, 'minutes');

  //   let percentStart = (moment(segmentStart).diff(lineStart.startTime, 'minutes') / containerSpan) * 100;
  //   let percentDuration = (duration / containerSpan) * 100;
  //   let percentEnd = 100 - (percentStart + percentDuration);

  //   let containerStyle = {
  //     "grid-row": "" + lineStart.line + " / " + lineEnd.line,
  //     "grid-template-rows": + percentStart + "% " + percentDuration + "% " + percentEnd + "%"
  //   };
  //   let durationStyle = {};
  //   if (duration < 30) {
  //     durationStyle = { "display": "none" };
  //   } else if (duration >= 30) {
  //     durationStyle = {};
  //   }

  //   tile = { timeSegment: timeSegment, containerStyle: containerStyle, durationStyle: durationStyle };
  //   return tile;
  // }


  // private displayTimeSegments(timeSegments: TimeSegment[], startTime: moment.Moment, endTime: moment.Moment) {
  //   let tiles: ITimeSegmentTile[] = [];
  //   for (let timeSegment of timeSegments) {
  //     let timeSegmentTile: ITimeSegmentTile = this.buildTimeSegmentTile(timeSegment, startTime, endTime);
  //     if (timeSegmentTile) {
  //       tiles.push(timeSegmentTile);
  //     }
  //   }
  //   this.timeSegmentTiles = tiles;
  // }

  // private buildDisplayOld(dayStartTime: moment.Moment, dayEndTime: moment.Moment) {

  //   if (moment().isSameOrAfter(moment(dayStartTime)) && moment().isSameOrBefore(moment(dayEndTime))) {
  //     this.ifNowLine = true;
  //   } else {
  //     this.ifNowLine = false;
  //   }


  //   let hour: number = 0;
  //   hour = dayStartTime.hour();

  //   let currentTime = moment(dayStartTime).subtract(30, 'minutes');
  //   if (currentTime.minute() <= 15) {
  //     currentTime.minute(0);
  //   } else if (currentTime.minute() > 15 && currentTime.minute() <= 45) {
  //     currentTime.minute(30);
  //   } else {
  //     currentTime.minute(60);
  //   }

  //   let endTime = moment(dayEndTime).add(30, 'minutes');
  //   // let endTime = moment(this.dayEndTime);

  //   let hourLabels: any[] = [];
  //   let gridLines: {
  //     line: number,
  //     style: any,
  //     startTime: moment.Moment,
  //     endTime: moment.Moment
  //   }[] = [];

  //   let gridIndex: number = 1;

  //   let now = moment();
  //   let nowLineContainerStyle: any = {};
  //   let nowTimeContainerStyle: any = {};
  //   // let bedTimeStyle: any = {};

  //   function getGridTemplateRowsStyle(referenceTime: moment.Moment, currentSegmentTime: moment.Moment, rows: number): string {
  //     let percentage: number = 1;
  //     let seconds = moment(referenceTime).diff(moment(currentSegmentTime), 'seconds');


  //     percentage = ((seconds / (30 * 60 * rows)) * 100);
  //     let gridTemplateRows = "" + percentage.toFixed(0) + "% " + (100 - percentage).toFixed(0) + "%";
  //     return gridTemplateRows;
  //   }

  //   while (currentTime.isSameOrBefore(endTime)) {

  //     let segmentEnd = moment(currentTime).add(30, 'minutes');
  //     if (moment(now).format('YYYY-MM-DD') != moment(currentTime).format('YYYY-MM-DD')) {
  //       nowLineContainerStyle = { "display": "none" };
  //       nowTimeContainerStyle = { "display": "none" };
  //     } else {
  //       if (moment(now).isAfter(currentTime) && moment(now).isSameOrBefore(segmentEnd)) {
  //         nowLineContainerStyle = { "grid-row": "" + gridIndex + " / span 1", "grid-template-rows": getGridTemplateRowsStyle(now, currentTime, 1) };
  //         nowTimeContainerStyle = { "grid-row": "" + (gridIndex - 1) + " / span 3", "grid-column": "1 / span 2", "grid-template-rows": getGridTemplateRowsStyle(now, moment(currentTime).subtract(30, 'minutes'), 3) };
  //       }
  //     }

  //     // if (moment(this.bedTime).isAfter(currentTime) && moment(this.bedTime).isSameOrBefore(segmentEnd)) {
  //     //   bedTimeStyle = { "grid-row": "" + (gridIndex + 1) + " / -1 ", "grid-template-rows": getGridTemplateRowsStyle(this.bedTime, currentTime, 1) }
  //     // }


  //     let gridBorderBottom: string = "";
  //     if (moment(currentTime).minute() == 30) {
  //       gridBorderBottom = "1px solid rgb(150, 200, 220)";
  //     } else {
  //       gridBorderBottom = "1px solid rgb(205, 230, 240)";
  //     }
  //     let gridLine = {
  //       line: gridIndex,
  //       style: { "grid-column": " 2 / span 2", "grid-row": "" + gridIndex + " / span 1", "border-bottom": gridBorderBottom },
  //       startTime: moment(currentTime),
  //       endTime: moment(currentTime).add(30, 'minutes')
  //     };
  //     gridLines.push(gridLine);

  //     if (currentTime.minute() != 30) {
  //       let hourLabel = {
  //         "time": currentTime.format("h a"),
  //         "style": { "grid-column": "1 / span 1", "grid-row": "" + gridIndex + " / span 2" }
  //       };
  //       if (gridIndex == 1) {
  //         hourLabel = {
  //           "time": '',
  //           "style": { "grid-column": "1 / span 2", "grid-row": "" + gridIndex + " / span 2" }
  //         };
  //       }
  //       hourLabels.push(hourLabel);
  //     }
  //     currentTime.add(30, 'minutes');
  //     gridIndex += 1;
  //   }

  //   this.timelogViewStyle = { "grid-template-rows": "repeat(" + gridIndex.toFixed(0) + ", 1fr)" }
  //   this.hourLabels = hourLabels;
  //   this.bookLines = gridLines;

  //   this.nowLineContainerStyle = nowLineContainerStyle;
  //   this.nowTimeContainerStyle = nowTimeContainerStyle;
  //   this.nowTime = now;


  //   // this.bedTimeString = this.calculateBedTimeString(now);

  //   // this.bedTimeStyle = bedTimeStyle;
  // }

  // onClickNextTimeSegment(timeSegment: TimeSegment) {
  //   this.clickNextTimeSegment.emit(timeSegment);
  // }

  // onClickTimeSegmentTile(timeSegmentTile: ITimeSegmentTile) {
  //   this.clickTimeSegment.emit(timeSegmentTile);
  // }

  ngOnDestroy() {
    this._fetchTimeSegmentsSubscription.unsubscribe();
    this._nowSubscription.unsubscribe();
    this._currentDateSubscription.unsubscribe();
    this._timeWindowSubscription.unsubscribe();

  }

  segmentBackgroundColor(timeSegment: TimeSegment): string {

    function hexToRGB(hex: string, alpha: number) {
      var r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);

      if (alpha) {
        return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
      } else {
        return "rgb(" + r + ", " + g + ", " + b + ")";
      }
    }

    if (timeSegment.activities.length > 0) {
      let color = timeSegment.activities[0].activity.color;
      return hexToRGB(color, 0.5);

    } else {
      return "white";
    }
  }


  activityName(tile: ITimeSegmentTile): string {
    if (tile.timeSegment.activities.length > 0) {
      return tile.timeSegment.activities[0].activity.name;
    } else {
      return "";
    }
  }


}
