import * as moment from 'moment';
import { DaybookDayItem } from '../../api/daybook-day-item.class';
import { DaybookSleepInputDataItem } from '../../api/data-items/daybook-sleep-input-data-item.interface';
import { DaybookTimeSchedule } from '../../api/daybook-time-schedule/daybook-time-schedule.class';
import { TimeScheduleItem } from '../../../../shared/time-utilities/time-schedule-item.class';
import { UAPAppConfiguration } from '../../../user-account-profile/api/uap-app-configuraiton.interface';
import { TimeSchedule } from '../../../../shared/time-utilities/time-schedule.class';

export class DaybookSleepCycle {


    // private _isValid: boolean ;
    private _relevantItems: DaybookDayItem[] = [];
    private _appConfig: UAPAppConfiguration;
    /**
     * The purpose of this class is to be able to try and determine a sleep pattern based on previous sleep items.
     * see daybook-sleep-cycle.jpg
     */

    private _previousFallAsleepTime: moment.Moment;
    private _previousWakeupTime: moment.Moment;
    private _nextFallAsleepTime: moment.Moment;
    private _nextWakeupTime: moment.Moment;
    private _energyAtWakeup: number;

    // public get isValid(): boolean { return this._isValid; }

    constructor(dateYYYYMMDD: string, relevantItems: DaybookDayItem[], appConfig: UAPAppConfiguration,
        prevFallAsleepTime: moment.Moment, prevWakeupTime: moment.Moment, nextFallAsleepTime: moment.Moment, nextWakeupTime: moment.Moment) {
        this._relevantItems = relevantItems;
        this._appConfig = appConfig;
        // this._setDefaults();
        this._previousFallAsleepTime = moment(prevFallAsleepTime);
        this._previousWakeupTime = moment(prevWakeupTime);
        this._nextFallAsleepTime = moment(nextFallAsleepTime);
        this._nextWakeupTime = moment(nextWakeupTime);

        // console.log("TIME VALUES SET: ")
        // console.log("PREV FALL ASLEEP: " , this._previousFallAsleepTime.format('YYYY-MM-DD hh:mm a'))
        // console.log("PREV WAKE: " , this._previousWakeupTime.format('YYYY-MM-DD hh:mm a'))
        // console.log("NEXT FALL ASLEEP: " , this._nextFallAsleepTime.format('YYYY-MM-DD hh:mm a'))
        // console.log("NEXT WAKE: " , this._nextWakeupTime.format('YYYY-MM-DD hh:mm a'))
    }

    public get72HourSleepDataItems(dateYYYYMMDD: string, splitAtMidnight = true): TimeScheduleItem[] {
        let sleepItems: TimeScheduleItem[] = [
            ...this._sleepTimeRangesForDate(moment(dateYYYYMMDD).subtract(24, 'hours').format('YYYY-MM-DD')),
            ...this._sleepTimeRangesForDate(dateYYYYMMDD),
            ...this._sleepTimeRangesForDate(moment(dateYYYYMMDD).add(24, 'hours').format('YYYY-MM-DD')),
        ];
        if (splitAtMidnight === false) {
            sleepItems = this._mergeSleepItems(sleepItems);
        }
        // console.log("Returning sleep items: ")
        // sleepItems.forEach((item) => { console.log("  " + item.toString()) })
        return sleepItems;
    }

    public get averageSleepDurationMs(): number {
        const averageRatio = this._calculateSleepAverage();
        const msPerDay = 1000 * 60 * 60 * 24;
        return averageRatio * msPerDay;
    }

    public getDayStartTime(dateYYYYMMDD: string): moment.Moment {
        const todayYYYYMMDD: string = moment().format('YYYY-MM-DD');
        const isToday: boolean = dateYYYYMMDD === todayYYYYMMDD;
        const isTomorrow: boolean = dateYYYYMMDD === moment(todayYYYYMMDD).add(24, 'hours').format('YYYY-MM-DD');
        const isYesterday: boolean = dateYYYYMMDD === moment(todayYYYYMMDD).subtract(24, 'hours').format('YYYY-MM-DD');
        if (isToday) {
            return this._previousWakeupTime;
        } else if (isTomorrow) {
            return this._nextWakeupTime;
        } else {
            return this._findDayStartTime(dateYYYYMMDD);
        }
    }
    public getDayEndTime(dateYYYYMMDD: string): moment.Moment {
        const todayYYYYMMDD: string = moment().format('YYYY-MM-DD');
        const isToday: boolean = dateYYYYMMDD === todayYYYYMMDD;
        const isTomorrow: boolean = dateYYYYMMDD === moment(todayYYYYMMDD).add(24, 'hours').format('YYYY-MM-DD');
        const isYesterday: boolean = dateYYYYMMDD === moment(todayYYYYMMDD).subtract(24, 'hours').format('YYYY-MM-DD');
        if (isToday) {
            return this._nextFallAsleepTime;
        } else if (isYesterday) {
            return this._previousFallAsleepTime;
        } else {
            return this._findDayEndTime(dateYYYYMMDD);
        }
    }


    private _mergeSleepItems(sleepItems: TimeScheduleItem[]): TimeScheduleItem[] {
        for (let i = 0; i < sleepItems.length; i++) {
            if (i < sleepItems.length - 1) {
                if (sleepItems[i].endTime.isSame(sleepItems[i + 1].startTime)) {
                    sleepItems[i].changeEndTime(sleepItems[i + 1].endTime);
                    sleepItems.splice(i + 1, 1);
                    i--;
                }
            }
        }
        return sleepItems;
    }


    /**
     * Gives sleep time ranges for a 24 hour period only.
     */
    private _sleepTimeRangesForDate(dateYYYYMMDD: string): TimeScheduleItem[] {
        const todayYYYYMMDD: string = moment().format('YYYY-MM-DD');
        const isToday: boolean = dateYYYYMMDD === todayYYYYMMDD;
        const isTomorrow: boolean = dateYYYYMMDD === moment(todayYYYYMMDD).add(24, 'hours').format('YYYY-MM-DD');
        const isYesterday: boolean = dateYYYYMMDD === moment(todayYYYYMMDD).subtract(24, 'hours').format('YYYY-MM-DD');
        let items: TimeScheduleItem[] = [];
        if (isToday) {
            items = this._getTodaySleepTimeRanges();
        } else if (isTomorrow) {
            items = this._getTomorrowSleepTimeRanges();
        } else if (isYesterday) {
            items = this._getYesterdaySleepTimeRanges();
        } else {
            const foundItem = this._relevantItems.find(item => item.dateYYYYMMDD === dateYYYYMMDD);
            if (foundItem) {
                if (foundItem.hasSleepItems) {
                    items = foundItem.sleepInputItems.map((sleepItem) => {
                        return new TimeScheduleItem(sleepItem.startSleepTimeISO, sleepItem.endSleepTimeISO, sleepItem.startSleepTimeUtcOffsetMinutes, sleepItem.endSleepTimeUtcOffsetMinutes);
                    });
               
                }else{
                    items = this._getDefaultSleepItemsTemplate(dateYYYYMMDD);
                }
            }else{
                items = this._getDefaultSleepItemsTemplate(dateYYYYMMDD);
            }
            
        }
        // console.log("** ITEMS FOR DATE:  " + dateYYYYMMDD)
        // items.forEach((item) => { console.log("  " + item.toString()) });
        return items
    }
    private _getYesterdaySleepTimeRanges(): TimeScheduleItem[] {
        const yesterdate = moment().subtract(24, 'hours').format('YYYY-MM-DD');
        const foundItem = this._relevantItems.find(item => item.dateYYYYMMDD === yesterdate);
        if (foundItem) {
            const items = foundItem.sleepInputItems.map((sleepItem) => {
                return new TimeScheduleItem(sleepItem.startSleepTimeISO, sleepItem.endSleepTimeISO, sleepItem.startSleepTimeUtcOffsetMinutes, sleepItem.endSleepTimeUtcOffsetMinutes);
            });
            // console.log("Returning YESTERDAY ITEMS: " )
            // items.forEach(item => console.log("  " + item.toString()))
            return items;
        } else {
            console.log("Error finding yesterday sleep items");
            return [];
        }

    }
    private _getTodaySleepTimeRanges(): TimeScheduleItem[] {
        const startOfThisDay = moment().startOf('day');
        const endOfThisDay = moment(startOfThisDay).add(24, 'hours');
        const sleepTimes: TimeScheduleItem[] = [];
        if (this._previousFallAsleepTime.isAfter(startOfThisDay)) {
            sleepTimes.push(new TimeScheduleItem(this._previousFallAsleepTime.toISOString(), this._previousWakeupTime.toISOString(), this._previousFallAsleepTime.utcOffset(), this._previousWakeupTime.utcOffset()));
        } else {
            sleepTimes.push(new TimeScheduleItem(startOfThisDay.toISOString(), this._previousWakeupTime.toISOString(), this._previousFallAsleepTime.utcOffset(), this._previousWakeupTime.utcOffset()));

        }
        if (this._nextFallAsleepTime.isBefore(endOfThisDay)) {
            if (this._nextWakeupTime.isAfter(endOfThisDay)) {
                sleepTimes.push(new TimeScheduleItem(this._nextFallAsleepTime.toISOString(), endOfThisDay.toISOString(), this._nextFallAsleepTime.utcOffset(), endOfThisDay.utcOffset()));
            } else {
                console.log("Unusual circumstance: ", this._nextFallAsleepTime.format('YYYY-MM-DD hh:mm a') + " - " + this._nextWakeupTime.format('YYYY-MM-DD hh:mm a'));
                sleepTimes.push(new TimeScheduleItem(this._nextFallAsleepTime.toISOString(), this._nextWakeupTime.toISOString(), this._nextFallAsleepTime.utcOffset(), this._nextWakeupTime.utcOffset()));
            }
        }
        // console.log("TODAY ITEMS " )
        // sleepTimes.forEach(item => console.log("  " + item.toString()))
        return sleepTimes;
    }
    private _getTomorrowSleepTimeRanges(): TimeScheduleItem[] {
        const startOfThisDay = moment().add(24, 'hours').startOf('day');
        const endOfThisDay = moment(startOfThisDay).add(24, 'hours');
        const sleepTimes: TimeScheduleItem[] = [];
        if (this._nextFallAsleepTime.isAfter(startOfThisDay)) {
            sleepTimes.push(new TimeScheduleItem(this._nextFallAsleepTime.toISOString(), this._nextWakeupTime.toISOString(), this._nextFallAsleepTime.utcOffset(), this._nextWakeupTime.utcOffset()));
        } else {
            sleepTimes.push(new TimeScheduleItem(startOfThisDay.toISOString(), this._nextWakeupTime.toISOString(), startOfThisDay.utcOffset(), this._nextWakeupTime.utcOffset()));
        }
        const tomorrowFallAsleepTime = moment(this._nextFallAsleepTime).add(24, 'hours');
        if (tomorrowFallAsleepTime.isBefore(endOfThisDay)) {
            sleepTimes.push(new TimeScheduleItem(tomorrowFallAsleepTime.toISOString(), endOfThisDay.toISOString(), tomorrowFallAsleepTime.utcOffset(), endOfThisDay.utcOffset()));
        }
        // console.log("TOMORRWO ITEMS " )
        // sleepTimes.forEach(item => console.log("  " + item.toString()))
        return sleepTimes;


    }

    private _getDefaultSleepItemsTemplate(dateYYYYMMDD: string): TimeScheduleItem[] {
        const dateStartTime = moment(dateYYYYMMDD).startOf('day');
        const dateEndTime = moment(dateStartTime).add(24, 'hours');
        const defaultWakeupTime = this._defaultWakeupTime(dateYYYYMMDD);
        const defaultSleepTime = this._defaultFallAsleepTime(dateYYYYMMDD);
        const items: TimeScheduleItem[] = [];
        if (defaultWakeupTime.isAfter(dateStartTime) && defaultWakeupTime.isBefore(dateEndTime)) {
            items.push(new TimeScheduleItem(dateStartTime.toISOString(), defaultWakeupTime.toISOString(), dateStartTime.utcOffset(), defaultWakeupTime.utcOffset()));
        } else if (defaultWakeupTime.isBefore(dateStartTime)) {
            const sleepEndTime = moment(defaultWakeupTime).add(1, 'days');
            const defaultFallAsleepTime = moment(this._defaultFallAsleepTime(dateYYYYMMDD));
            let sleepStartTime = moment(defaultFallAsleepTime);
            if (defaultFallAsleepTime.isBefore(dateEndTime)) {
                items.push(new TimeScheduleItem(defaultFallAsleepTime.toISOString(), sleepEndTime.toISOString(), defaultFallAsleepTime.utcOffset(), sleepEndTime.utcOffset()));
            } else {
                console.log("Error or rare situation (wake up before start of day and go to sleep after end of day) - no sleep time within 24 hrs");
            }
        }
        if (defaultSleepTime.isBefore(dateEndTime)) {
            items.push(new TimeScheduleItem(defaultSleepTime.toISOString(), dateEndTime.toISOString(), defaultSleepTime.utcOffset(), dateEndTime.utcOffset()));
        }
        return items;
    }

    private _defaultWakeupTime(dateYYYYMMDD: string): moment.Moment {
        const startOfDay = moment(dateYYYYMMDD).startOf('day');
        // console.log("App config hours, minutes: ", this._appConfig.defaultWakeupHour, this._appConfig.defaultWakeupMinute)
        return moment(startOfDay).add(this._appConfig.defaultWakeupHour, 'hours').add(this._appConfig.defaultWakeupMinute, 'minutes');
    }

    private _defaultFallAsleepTime(dateYYYYMMDD: string): moment.Moment {
        const startOfDay = moment(dateYYYYMMDD).startOf('day');
        // console.log("App config hours, minutes: ", this._appConfig.defaultFallAsleepHour, this._appConfig.defaultFallAsleepMinute)
        return moment(startOfDay).add(this._appConfig.defaultFallAsleepHour, 'hours').add(this._appConfig.defaultFallAsleepMinute, 'minutes');
    }

    private _findDayStartTime(dateYYYYMMDD: string): moment.Moment {
        const foundItem = this._relevantItems.find(item => item.dateYYYYMMDD === dateYYYYMMDD);
        if (foundItem) {
            const sleepItems = this.get72HourSleepDataItems(dateYYYYMMDD, false);
            const awakeItems = this._get72HAwakeItems(sleepItems, dateYYYYMMDD);
            const largest = this._findLargestWakeItem(awakeItems, dateYYYYMMDD);
            return largest.startTime;
        } else {
            return this._defaultWakeupTime(dateYYYYMMDD);
        }
    }
    private _findDayEndTime(dateYYYYMMDD: string): moment.Moment {
        const foundItem = this._relevantItems.find(item => item.dateYYYYMMDD === dateYYYYMMDD);
        if (foundItem) {
            const sleepItems = this.get72HourSleepDataItems(dateYYYYMMDD, false);
            const awakeItems = this._get72HAwakeItems(sleepItems, dateYYYYMMDD);
            const largest = this._findLargestWakeItem(awakeItems, dateYYYYMMDD);
            return largest.endTime;
        } else {
            return this._defaultFallAsleepTime(dateYYYYMMDD);
        }
    }



    private _calculateSleepAverage(): number {
        let ratios: number[] = [];
        const defaultRatio = 0.33;
        const relevantItems = this._relevantItems;
        if (relevantItems.length < 7) {
            // console.log("Returning default ratio: 0.33");
            return defaultRatio;
        } else if (relevantItems.length >= 7) {
            ratios = relevantItems.map(item => this._getSleepRatio(item));
        }
        let sum: number = 0;
        ratios.forEach((ratio) => {
            sum += ratio;
        });
        // console.log("returning ratio: " + (sum / ratios.length))
        return (sum / ratios.length);
    }

    /**
     * returns a number >= 0 and <= 1
     */
    private _getSleepRatio(daybookDayItem: DaybookDayItem): number {
        const sleepItems = daybookDayItem.sleepInputItems;
        const dayMs: number = 1000 * 60 * 60 * 24;
        let sleepMs: number = 0;
        sleepItems.forEach((item) => {
            sleepMs += (moment(item.endSleepTimeISO).diff(item.startSleepTimeISO, 'milliseconds'));
        });
        return sleepMs / dayMs;
    }

    private _get72HAwakeItems(sleepItems: TimeScheduleItem[], dateYYYYMMDD: string): TimeScheduleItem[] {
        const startTime = moment(dateYYYYMMDD).startOf('day').subtract(24, 'hours');
        const endTime = moment(dateYYYYMMDD).startOf('day').add(48, 'hours');
        const schedule: TimeSchedule = new TimeSchedule(startTime, endTime);
        const wakeItems = schedule.getInverseItems(sleepItems);
        console.log("Wake items: " )
        wakeItems.forEach(item => console.log("  " + item.toString()))
        const startOfThisDay: moment.Moment = moment(dateYYYYMMDD).startOf('day');
        const endOfThisDay: moment.Moment = moment(dateYYYYMMDD).startOf('day').add(24, 'hours');

        const thisDaywakeItems = wakeItems.filter((wakeItem) => {
            const crossesStart = wakeItem.startTime.isBefore(startOfThisDay) && wakeItem.endTime.isAfter(startOfThisDay);
            const crossesEnd = wakeItem.startTime.isBefore(endOfThisDay) && wakeItem.endTime.isAfter(endOfThisDay);
            const isInside = wakeItem.startTime.isSameOrAfter(startOfThisDay) && wakeItem.endTime.isSameOrBefore(endOfThisDay);
            const encapsulates = wakeItem.startTime.isSameOrBefore(startOfThisDay) && wakeItem.endTime.isSameOrAfter(endOfThisDay);
            return crossesStart || crossesEnd || isInside || encapsulates;
        });
        console.log("THIS DAY WAKE ITEMS: (" + dateYYYYMMDD + " )")
        thisDaywakeItems.forEach((item) => { console.log("   " + item.toString()) })
        return thisDaywakeItems;
    }

    private _findLargestWakeItem(thisDayWakeItems: TimeScheduleItem[], dateYYYYMMDD: string): TimeScheduleItem {
        const startOfThisDay: moment.Moment = moment(dateYYYYMMDD);
        const endOfThisDay: moment.Moment = moment(dateYYYYMMDD);
        const getMilliseconds = function (wakeItem: TimeScheduleItem): number {
            const crossesStart = wakeItem.startTime.isBefore(startOfThisDay) && wakeItem.endTime.isSameOrBefore(endOfThisDay);
            const crossesEnd = wakeItem.startTime.isSameOrAfter(startOfThisDay) && wakeItem.endTime.isAfter(endOfThisDay);
            const isInside = wakeItem.startTime.isSameOrAfter(startOfThisDay) && wakeItem.endTime.isSameOrBefore(endOfThisDay);
            const encapsulates = wakeItem.startTime.isSameOrBefore(startOfThisDay) && wakeItem.endTime.isSameOrAfter(endOfThisDay);
            let startTime: moment.Moment;
            let endTime: moment.Moment;
            if (crossesStart) {
                startTime = moment(startOfThisDay);
                endTime = moment(wakeItem.endTime);
            } else if (isInside) {
                startTime = moment(wakeItem.startTime);
                endTime = moment(wakeItem.endTime)
            } else if (crossesEnd) {
                startTime = moment(wakeItem.startTime);
                endTime = moment(endOfThisDay);
            } else if (encapsulates) {
                console.log('Big badaboom.  Bada big boom.');
            }
            return moment(endTime).diff(startTime, 'milliseconds');
        }
        let largestItem = thisDayWakeItems[0];
        let largestMs = getMilliseconds(largestItem);
        for (let i = 1; i < thisDayWakeItems.length; i++) {
            let currentMs = getMilliseconds(thisDayWakeItems[i]);
            if (currentMs > largestMs) {
                largestItem = thisDayWakeItems[i];
            }
        }
        return largestItem;
    }
}