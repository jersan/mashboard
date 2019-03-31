import { TimeSegment } from "./time-segment.model";
import * as moment from 'moment';

export class TimeSegmentTile{

    timeSegment: TimeSegment;
    style: any;
    private _startTime: moment.Moment;
    private _endTime: moment.Moment;
    private _isLarge: boolean = false; 
    private _isBlank: boolean = false;
    private _isScheduled: boolean = false;

    public mouseOver: boolean = false;



    public get startTime(): moment.Moment { 
        return moment(this._startTime);
    }    
    public get endTime(): moment.Moment {
        return moment(this._endTime);
    }

    public set startTime(time: moment.Moment){
        this._startTime = moment(time);
        this.setIsLarge();
    }
    public set endTime(time: moment.Moment){
        this._endTime = moment(time);
        this.setIsLarge();
    }


    private setIsLarge(){
        let minutesLimit: number = 20;
        if(moment(this._endTime).diff(moment(this._startTime),'minutes') > minutesLimit){
            this._isLarge = true;
        }else{
            this._isLarge = false;
        }
    }
    public get isLarge(): boolean {
        return this._isLarge;
    }
    public get isBlank(): boolean{ 
        return this._isBlank;
    }
    public get isScheduled(): boolean{
        return this._isScheduled;
    }




    constructor(timeSegment: TimeSegment, startTime: moment.Moment, endTime: moment.Moment){
        if(timeSegment){
            this.timeSegment = timeSegment;
        }else{
            this.timeSegment = new TimeSegment('','', moment(startTime).toISOString(), moment(endTime).toISOString(), '');
            this._isBlank = true;
        }

        if(moment(startTime).isAfter(moment())){
            this._isScheduled = true;
        }
        
        this._startTime = moment(startTime);
        this._endTime = moment(endTime);
        this.setIsLarge();
    }
}