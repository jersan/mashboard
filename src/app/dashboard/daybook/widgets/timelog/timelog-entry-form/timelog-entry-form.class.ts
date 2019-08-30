import * as moment from 'moment';
import { timer } from 'rxjs';
import { DurationString } from '../../../../../shared/utilities/duration-string.class';
import { TimelogEntryFormSection } from './timelog-entry-form-section/timelog-entry-form-section.class';
import { TimelogEntryFormSectionType } from './timelog-entry-form-section/timelog-entry-form-section-type.enum';
import { SleepBatteryConfiguration } from '../../sleep-battery/sleep-battery-configuration.interface';

export class TimelogEntryForm {
    constructor() {
        // this.buildFormSections();
        this.updateTimes();
        timer(0, 1000).subscribe((tick) => {
            this._currentTime = moment();
        });
        timer(0, 60000).subscribe((tick) => {
            this.updateTimes();
        })
    }

    
    private _message: string = "";
    public get message(): string {
        return this._message;
    }

    private _currentTime = moment();
    public get currentTime(): moment.Moment {
        return moment(this._currentTime);
    }

    private _bedTime: moment.Moment = moment().hour(22).minute(30).second(0).millisecond(0);
    private _timeUntilBedtime: string = "";
    public get timeUntilBedtime(): string {
        return this._timeUntilBedtime;
    }
    public get bedtime(): moment.Moment {
        return moment(this._bedTime);
    }
    public get wakeupTime(): moment.Moment {
        return moment(this._wakeupTime);
    }

    private _wakeupTime: moment.Moment = moment().hour(7).minute(0).second(0).millisecond(0);
    private _timeSinceWakeup: string = "";
    public get timeSinceWakeup(): string {
        return this._timeSinceWakeup;
    }
    public get wakeupTimeHHmm(): string {
        return this._wakeupTime.format("HH:mm");
    }
    private _lastNightFallAsleepTime: moment.Moment = moment(this._bedTime).subtract(1, "days");
    public get lastNightFallAsleepTimeHHmm(): string {
        return this._lastNightFallAsleepTime.format("HH:mm");
    }


    public onClickBanner(bannerName: string){
        if(bannerName == "SLEEP_SECTION"){
            this.sleepSectionExpanded = true;
            this._batteryConfiguration["shape"] = "LARGE";
        }
    }

    public onClickSaveSleepTimes(wakeupTime: { hour: number, minute: number }, fallAsleepTime: { hour: number, minute: number }) {
        // console.log("boola woola", wakeupTime);
        // console.log("ola bolw", fallAsleepTime);
        this._wakeupTime = moment(this._wakeupTime).hour(wakeupTime.hour).minute(wakeupTime.minute);
        this._lastNightFallAsleepTime = moment(this._lastNightFallAsleepTime).hour(fallAsleepTime.hour).minute(fallAsleepTime.minute);
        // console.log("Warning:  this method does not account for fall asleep times which occurred after midnight (therefore this morning)")
        // console.log("currently, it is assumed that you fell asleep yesterday, before midnight.  therefore any times past midnight will yield... incorrect results")
        this.updateTimes();
        this.sleepSectionExpanded = false;
        this._batteryConfiguration["shape"] = "SMALL";
    }

    private _formSections: any[] = [];
    private buildFormSections() {
        /**
         *     SleepTimes = "SLEEP_TIMES",
    Bedtime = "BEDTIME",
    MorningRoutine = "MORNING_ROUTINE",
    EveningRoutine = "EVENING_ROUTINE",
    MorningActivities = "MORNING_ACTIVITIES",
    AfternoonActivities = "AFTERNOON_ACTIVITIES",
    EveningActivities = "EVENING_ACTIVITIES",
         */


        let formSections: any[] = [];
        formSections.push(new TimelogEntryFormSection(TimelogEntryFormSectionType.SleepTimes));
        formSections.push(new TimelogEntryFormSection(TimelogEntryFormSectionType.MorningRoutine));
        formSections.push(new TimelogEntryFormSection(TimelogEntryFormSectionType.MorningRoutine));
        formSections.push(new TimelogEntryFormSection(TimelogEntryFormSectionType.MorningRoutine));
        formSections.push(new TimelogEntryFormSection(TimelogEntryFormSectionType.MorningRoutine));
        formSections.push(new TimelogEntryFormSection(TimelogEntryFormSectionType.MorningRoutine));
        formSections.push(new TimelogEntryFormSection(TimelogEntryFormSectionType.MorningRoutine));
        formSections.push(new TimelogEntryFormSection(TimelogEntryFormSectionType.MorningRoutine));
        this._formSections = formSections;
    }
    public get formSections(): any[] {
        return this._formSections;
    }

    sleepSectionExpanded: boolean = false;



    private updateTimes() {

        if (this.currentTime.hour() < 12) {
            this._message = "Good morning Jeremy";
        } else if (this.currentTime.hour() >= 12 && this.currentTime.hour() < 18) {
            this._message = "Good afternoon Jeremy";
        } else if (this.currentTime.hour() >= 18) {
            this._message = "Good evening Jeremy";
        }


        let timeUntilBedtime = "";
        if (this.currentTime.isBefore(this._bedTime)) {
            timeUntilBedtime = DurationString.calculateDurationString(this.currentTime, this._bedTime, true) + " until bedtime";
        } else {
            timeUntilBedtime = DurationString.calculateDurationString(this._bedTime, this.currentTime, true) + " past bedtime";
        }
        this._timeUntilBedtime = timeUntilBedtime;

        let timeSinceWakeup = "";
        if (this.currentTime.isBefore(this._wakeupTime)) {
            timeSinceWakeup = "";
        } else if (this.currentTime.isAfter(this._wakeupTime)) {
            timeSinceWakeup = DurationString.calculateDurationString(this._wakeupTime, this.currentTime, true) + " since wake up";
        }
        this._timeSinceWakeup = timeSinceWakeup;
        this.updateBatteryConfiguration();
    }

    private updateBatteryConfiguration(){
        let shape:string = "LARGE";
        if(!this.sleepSectionExpanded){
            shape = "SMALL"
        }
        let batteryConfiguration: SleepBatteryConfiguration = {
            wakeupTime: this.wakeupTime,
            bedtime: this.bedtime,
            shape: shape,
        }
        this._batteryConfiguration = batteryConfiguration;
    }

    private _batteryConfiguration: SleepBatteryConfiguration = null;
    public get batteryConfiguration(): SleepBatteryConfiguration{
        return this._batteryConfiguration;
    }

}