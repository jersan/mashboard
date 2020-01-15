import { SleepEnergyLevelInput } from '../api/data-items/energy-level-input.interface';

import * as moment from 'moment';
import { DaybookEnergyItem } from './daybook-energy-item.class';
import { DaybookEnergyLevel } from './daybook-energy-level.enum';
import { TimeScheduleItem } from '../../../shared/utilities/time-utilities/time-schedule-item.class';

export class DaybookEnergyController {


    private _sleepSchedule: TimeScheduleItem[];
    private _allEnergyLevelInputs: SleepEnergyLevelInput[];
    private _awakeToAsleepRatio: number;
    private _energyItems: DaybookEnergyItem[] = [];
    private _dateYYYYMMDD: string;

    constructor(dateYYYYMMDD: string, sleepTimes: TimeScheduleItem[],
        sleepEnergyLevelInputs: SleepEnergyLevelInput[], sleepRatio: number) {

        this._dateYYYYMMDD = dateYYYYMMDD;
        this._awakeToAsleepRatio = sleepRatio;
        this._sleepSchedule = sleepTimes;
        this._allEnergyLevelInputs = sleepEnergyLevelInputs;

        this._calculateSchedule();
        console.log("Sleep controller:  at current time, ("+moment().format('hh:mm a')+") sleep level is: " + (this.getEnergyAtTime(moment())*100).toFixed(0));
    }

    public getEnergyLevelAtTime(timeToCheck: moment.Moment): DaybookEnergyLevel {
        const foundItem = this._energyItems.find((item) => {
            return timeToCheck.isSameOrAfter(item.startTime) && timeToCheck.isSameOrBefore(item.endTime);
        });
        if (foundItem) {
            return foundItem.getEnergyLevelAtTime(timeToCheck);
        } else {
            console.log('Error: no energy item');
        }
    }
    public getEnergyAtTime(timeToCheck: moment.Moment): number {
        const foundItem = this._energyItems.find((item) => {
            return timeToCheck.isSameOrAfter(item.startTime) && timeToCheck.isSameOrBefore(item.endTime);
        });
        if (foundItem) { return foundItem.getEnergyAtTime(timeToCheck); }
        else { console.log('Error: no energy item'); }
    }

    private _calculateSchedule() {
        const awakeHoursPerDay: number = (this._awakeToAsleepRatio * 24) / (this._awakeToAsleepRatio + 1);
        const asleepHoursPerDay: number = 24 - awakeHoursPerDay;

        const energyDecayPerHourAwake: number = 1 / awakeHoursPerDay;
        const energyGainPerHourAsleep: number = 1 / asleepHoursPerDay;
        let energyItems: DaybookEnergyItem[] = [];
        let currentEnergy = 0;

        let topValue: number = 0;
        let bottomValue: number = 0;

        this._sleepSchedule.forEach((item) => {
            let rate: number;
            if (item.hasValue) {
                rate = energyGainPerHourAsleep;
            } else {
                rate = energyDecayPerHourAwake * -1;
            }
            if (currentEnergy < bottomValue) { bottomValue = currentEnergy; }
            if (currentEnergy > bottomValue) { topValue = currentEnergy; }
            // console.log("Rate is " + rate)
            const energyItem = new DaybookEnergyItem(item.startTime, item.endTime, currentEnergy, rate);
            energyItems.push(energyItem);

            currentEnergy = energyItem.getEnergyAtTime(item.endTime);
            // console.log("current energy is : " + currentEnergy);
        });

        if (bottomValue < 0) {
            const offset = Math.abs(bottomValue);
            energyItems = energyItems.map((item) => {
                const newStartEnergy = item.energyLevelStart + offset;
                return new DaybookEnergyItem(item.startTime, item.endTime, newStartEnergy, item.energyLevelRateOfChangePerHour);
            });
        }else if(bottomValue > 0){
            console.log('Error with calculation: bottom value (' + bottomValue + ') is greater than 0');
        }
        this._energyItems = energyItems;
    }

}
