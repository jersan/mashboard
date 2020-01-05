import * as moment from 'moment';

import { DaybookEnergyController } from './daybook-energy-controller.class';
import { DaybookDayItem } from '../api/daybook-day-item.class';
import { DaybookDayItemTimelog } from './daybook-day-item-timelog.class';
import { DaybookTimelogController } from './daybook-timelog-controller.class';
import { TimelogEntryItem } from '../widgets/timelog/timelog-large/timelog-body/timelog-entry/timelog-entry-item.class';
import { TimeSpanItem } from '../api/data-items/time-span-item.interface';
import { DaybookSleepController } from './daybook-sleep-controller.class';
import { Subject, Observable, Subscription } from 'rxjs';
import { DaybookEnergyLevel } from './daybook-energy-level.enum';
import { DaybookTimelogEntryTemplate } from './interfaces/daybook-timelog-entry-template.interface';


export class DaybookController {

    private _previousDay: DaybookDayItem;
    private _thisDay: DaybookDayItem;
    private _followingDay: DaybookDayItem;

    private _sleepController: DaybookSleepController;
    private _timelogController: DaybookTimelogController;
    private _energyController: DaybookEnergyController;

    private _awakeToAsleepRatio = 2;

    private _dataChanged$: Subject<{ prevDayChanged: boolean, thisDayChanged: boolean, nextDayChanged: boolean }> = new Subject();

    private _subscriptions: Subscription[] = [];

    constructor(dayItem: { prevDay: DaybookDayItem, thisDay: DaybookDayItem, nextDay: DaybookDayItem }) {
        console.log("Constructing the controller: ", dayItem);
        this._reload(dayItem);
    }

    public reload(dayItem: { prevDay: DaybookDayItem, thisDay: DaybookDayItem, nextDay: DaybookDayItem }) {
        console.log("Reloading the controller: ", dayItem)
        this._reload(dayItem);
    }

    public setAwakeToAsleepRatio(ratio: number) {
        console.log('Ratio was changed from default of 2 to ' + ratio);
        this._awakeToAsleepRatio = ratio;
    }

    public get dateYYYYMMDD(): string { return this._thisDay.dateYYYYMMDD; }
    public get isToday(): boolean { return this._thisDay.dateYYYYMMDD === moment().format('YYYY-MM-DD'); }
    public get controllerStartTime(): moment.Moment { return moment(this._thisDay.dateYYYYMMDD).startOf('day').subtract(1, 'days'); }
    public get controllerEndTime(): moment.Moment { return moment(this._thisDay.dateYYYYMMDD).startOf('day').add(2, 'days'); }

    public get previousDay(): DaybookDayItem { return this._previousDay; }
    public get thisDay(): DaybookDayItem { return this._thisDay; }
    public get followingDay(): DaybookDayItem { return this._followingDay; }

    public get dailyWeightLogEntryKg(): number { return this._thisDay.dailyWeightLogEntryKg; }

    private get startOfPrevDay(): moment.Moment { return moment(this.previousDay.dateYYYYMMDD).startOf('day'); }
    private get startOfThisDay(): moment.Moment { return moment(this.thisDay.dateYYYYMMDD).startOf('day'); }
    private get endOfPrevDay(): moment.Moment { return this.startOfThisDay; }
    private get endOfThisDay(): moment.Moment { return moment(this.thisDay.dateYYYYMMDD).startOf('day').add(24, 'hours'); }
    private get startOfNextDay(): moment.Moment { return this.endOfThisDay; }
    private get endOfNextDay(): moment.Moment { return moment(this.followingDay.dateYYYYMMDD).startOf('day').add(1, 'days'); };




    public get dataChanged$(): Observable<{ prevDayChanged: boolean, thisDayChanged: boolean, nextDayChanged: boolean }> {
        return this._dataChanged$.asObservable();
    }

    public get timelogController(): DaybookTimelogController { return this._timelogController; }
    public get sleepController(): DaybookSleepController { return this._sleepController; }
    public get energyController(): DaybookEnergyController { return this._energyController; }

    public getNewCurrentTLETemplate(): DaybookTimelogEntryTemplate {
        let startTime: moment.Moment;
        let endTime: moment.Moment = moment();
        if (this.sleepController.wakeupTimeIsSet) {
            startTime = this.timelogController.getNewTLEStartTime(this.sleepController.firstWakeupTime);
        } else {
            startTime = this.sleepController.firstWakeupTime;
        }
        return {
            timelogEntry: new TimelogEntryItem(startTime, endTime),
            isFirstOfDay: this._isNewTLEFirstOfDay(endTime),
            isLastOfDay: this._isNewTLELastOfDay(endTime),
        };
    }


    private _reload(dayItem: { prevDay: DaybookDayItem, thisDay: DaybookDayItem, nextDay: DaybookDayItem }) {
        this._previousDay = dayItem.prevDay;
        this._thisDay = dayItem.thisDay;
        this._followingDay = dayItem.nextDay;

        console.log("Building controller.  dayItem received:", dayItem)
        console.log("  prevDay: " + dayItem.prevDay.dateYYYYMMDD, this._previousDay)
        console.log("  thisDay: " + dayItem.thisDay.dateYYYYMMDD, this._thisDay)
        console.log("  nextDay: " + dayItem.nextDay.dateYYYYMMDD, this._followingDay)
        this._buildController();
    }

    private _buildController() {

        console.log("PRev day: " , this._previousDay)
        console.log(" cur day"  ,this._thisDay)
        console.log("next day: " , this._followingDay)
        const timelogDataItems = this._previousDay.timelogEntryDataItems.concat(this._thisDay.timelogEntryDataItems)
            .concat(this._followingDay.timelogEntryDataItems);
        const allTimeSpanItems = this._previousDay.sleepTimes.concat(this._thisDay.sleepTimes).concat(this._followingDay.sleepTimes);
        const allEnergyLevelInputs = this._previousDay.sleepEnergyLevelInputs.concat(this._thisDay.sleepEnergyLevelInputs)
            .concat(this._followingDay.sleepEnergyLevelInputs);

        this._sleepController = new DaybookSleepController(this._previousDay.sleepTimes,
            this._thisDay.sleepTimes, this._followingDay.sleepTimes, this.dateYYYYMMDD, this._awakeToAsleepRatio);
        this._timelogController = new DaybookTimelogController(this.dateYYYYMMDD, timelogDataItems, allTimeSpanItems);
        this._energyController = new DaybookEnergyController(this.dateYYYYMMDD, this._sleepController.sleepSchedule,
            allEnergyLevelInputs, this._awakeToAsleepRatio);
        this._updateSubscriptions();
    }


    private _isNewTLEFirstOfDay(currentTime: moment.Moment): boolean{
        let newTLEisStartOfDay: boolean = true;
        if (this.sleepController.wakeupTimeIsSet) {
            newTLEisStartOfDay = false;
        }else if(this.timelogController.lastTimelogEntryItemTime){
            /**
             * if there is a previous time in the timelog, then that means that the user was active in the previous day, 
             * but now it's a new day and the wakeuptime is not set. 
             */
            console.log("Assumption taken that it is past midnight but sleep time is imminent.")
            console.log("With this, the energy level is probably low: " + this.energyController.getEnergyLevelAtTime(currentTime));
            newTLEisStartOfDay = false;
        }
        return newTLEisStartOfDay;
    }


    private _isNewTLELastOfDay(currentTime: moment.Moment): boolean{
        let isLast: boolean = false;
        if(this.sleepController.wakeupTimeIsSet){
            const checkWithinHours: number = 2;
            const askTimeDelineation: moment.Moment = moment(this.sleepController.bedTime).subtract(checkWithinHours, 'hours')
            if(currentTime.isSameOrAfter(askTimeDelineation)){
                isLast = true;
            }
        }else{
            if(this.energyController.getEnergyLevelAtTime(currentTime) === DaybookEnergyLevel.Low){
                isLast = true;
            }
        }
        return isLast;
    }

    private _updateSubscriptions() {
        this._subscriptions.forEach(s => s.unsubscribe());
        this._subscriptions = [];
        const timelogSub = this._timelogController.timelogUpdated$.subscribe((update) => {
            console.log("Received an update from timelog.  Updating.")
            this._updateTimelog(update);
        });
        const sleepSub = this._sleepController.sleepTimesUpdated$.subscribe((sleepTimes) => {
            this._updateThisDaySleepTimes(sleepTimes);
        });
        this._subscriptions = [timelogSub, sleepSub];
    }

    private _updateThisDaySleepTimes(sleepTimes: TimeSpanItem[]) {
        console.log("Warning:  this method for some reason is only updating sleep times for the CURRENT DAY. (" + this.dateYYYYMMDD + ")");
        let thisDayTimes = sleepTimes
            .filter(time => moment(time.startTimeISO).isSameOrAfter(this.startOfThisDay) && moment(time.endTimeISO).isSameOrBefore(this.endOfThisDay));

        this._thisDay.sleepTimes = thisDayTimes;

        const daysChanged = {
            prevDayChanged: false,
            thisDayChanged: true,
            nextDayChanged: false,
        };
        this._dataChanged$.next(daysChanged);
    }

    private _updateTimelog(update) {
        console.log("Updating timelog: ", update);
        let prevDayChanged = false, thisDayChanged = false, nextDayChanged = false;
        if (update.prevDayItems) {
            this._previousDay.timelogEntryDataItems = update.prevDayItems;
            prevDayChanged = true;
        }
        if (update.thisDayItems) {
            this._thisDay.timelogEntryDataItems = update.thisDayItems;
            thisDayChanged = true;
        }
        if (update.nextDayItems) {
            this._followingDay.timelogEntryDataItems = update.nextDayItems;
            nextDayChanged = true;
        }
        const daysChanged = {
            prevDayChanged: prevDayChanged,
            thisDayChanged: thisDayChanged,
            nextDayChanged: nextDayChanged,
        };
        console.log("Next: ", daysChanged);
        this._dataChanged$.next(daysChanged);
    }


}
