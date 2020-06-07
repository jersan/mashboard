import { DaybookTimeScheduleStatus } from "./daybook-time-schedule-status.enum";
import { DaybookTimelogEntryDataItem } from "../data-items/daybook-timelog-entry-data-item.interface";
import { DaybookSleepInputDataItem } from "../data-items/daybook-sleep-input-data-item.interface";
import * as moment from 'moment';
import { TimelogEntryItem } from "../../widgets/timelog/timelog-large-frame/timelog-body/timelog-entry/timelog-entry-item.class";
import { SleepEntryItem } from "../../widgets/timelog/timelog-entry-form/sleep-entry-form/sleep-entry-item.class";
import { TimelogEntryBuilder } from "../../widgets/timelog/timelog-large-frame/timelog-body/timelog-entry/timelog-entry-builder.class";

export class DaybookTimeScheduleItem {

    private _status: DaybookTimeScheduleStatus;
    private _startTime: moment.Moment;
    private _endTime: moment.Moment;
    private _timelogEntry: TimelogEntryItem;
    private _sleepEntry: SleepEntryItem;

    public get status(): DaybookTimeScheduleStatus { return this._status; }
    public get startTime(): moment.Moment { return this._startTime; }
    public get endTime(): moment.Moment { return this._endTime; }
    public get timelogEntry(): TimelogEntryItem { return this._timelogEntry; }
    public get sleepEntry(): SleepEntryItem { return this._sleepEntry; }

    public set status(status: DaybookTimeScheduleStatus){ this._status = status; }
    public set startTime(time: moment.Moment) {this._startTime = moment(time);}
    public set endTime(time: moment.Moment) {this._endTime = moment(time);}

    public toString(): string {
        return ' ' + this._startTime.format('YYYY-MM-DD hh:mm a') + ' to ' + this._endTime.format('YYYY-MM-DD hh:mm a') + ' :' + this.status;
    }


    constructor(status: DaybookTimeScheduleStatus, startTime: moment.Moment, endTime: moment.Moment, timelogEntry?: DaybookTimelogEntryDataItem, sleepEntry?: DaybookSleepInputDataItem) {
        this._status = status;
        this._startTime = moment(startTime);
        this._endTime = moment(endTime);
        if (status === DaybookTimeScheduleStatus.ACTIVE) {
            if (timelogEntry) {
                this._buildFromTimelogEntry(timelogEntry);
            } else {
                // console.log("Error: no timelogEntryDataItem provided")
            }
        } else if (status === DaybookTimeScheduleStatus.SLEEP) {
            if (sleepEntry) {
                this._buildFromSleepEntry(sleepEntry);
            } else {
                // console.log("Error: no sleepEntry item provided");
            }
        } else if (status === DaybookTimeScheduleStatus.AVAILABLE) {

        }
    }

    public exportToSleepDataItem(): DaybookSleepInputDataItem { 
        if(this._sleepEntry){
            return this._sleepEntry.exportToDataItem();
        }else{
            return {
                startSleepTimeISO: this.startTime.toISOString(),
                startSleepTimeUtcOffsetMinutes: this.startTime.utcOffset(),
                endSleepTimeISO: this.endTime.toISOString(),
                endSleepTimeUtcOffsetMinutes: this.endTime.utcOffset(),
                percentAsleep: 100,
                embeddedNote: '',
                activities: [],
                energyAtEnd: 100,
            }
        }
    }

    private _buildFromTimelogEntry(timelogEntry: DaybookTimelogEntryDataItem) {
        const builder = new TimelogEntryBuilder();
        this._timelogEntry = builder.buildFromDataItem(timelogEntry);
        this._startTime = moment(this._timelogEntry.startTime);
        this._endTime = moment(this._timelogEntry.endTime);
    }

    private _buildFromSleepEntry(sleepEntry: DaybookSleepInputDataItem) {
        const startTime = moment(sleepEntry.startSleepTimeISO);
        const endTime = moment(sleepEntry.endSleepTimeISO);
        this._sleepEntry = new SleepEntryItem(startTime, endTime, sleepEntry);
        this._startTime = moment(startTime);
        this._endTime = moment(endTime);
    }
}