import { DaybookTimeScheduleItem } from './daybook-time-schedule-item.class';
import * as moment from 'moment';
import { DaybookTimeScheduleStatus } from './daybook-time-schedule-status.enum';
import { SleepEntryItem } from '../../widgets/timelog/timelog-entry-form/sleep-entry-form/sleep-entry-item.class';
import { DaybookSleepInputDataItem } from '../data-items/daybook-sleep-input-data-item.interface';
import { TimelogDelineator, TimelogDelineatorType } from '../../widgets/timelog/timelog-delineator.class';

export class DaybookTimeScheduleSleepItem extends DaybookTimeScheduleItem {
    constructor(startTime: moment.Moment, endTime: moment.Moment, sleepEntry: DaybookSleepInputDataItem) {
        super(startTime, endTime);
        this._scheduleStatus = DaybookTimeScheduleStatus.SLEEP;
        if (sleepEntry) {
            this._buildSleepEntry(sleepEntry);
        } else {
            console.log('No sleep entry provided.  TO DO:  BUild a default one.')
        }

    }

    private _buildSleepEntry(sleepEntry: DaybookSleepInputDataItem) {
        if (sleepEntry) {
            const startTime = moment(sleepEntry.startSleepTimeISO);
            const endTime = moment(sleepEntry.endSleepTimeISO);
            this._sleepEntry = new SleepEntryItem(startTime, endTime, sleepEntry);
            this._startDelineator = new TimelogDelineator(this._sleepEntry.startTime, TimelogDelineatorType.FALLASLEEP_TIME);
            this._endDelineator = new TimelogDelineator(this._sleepEntry.startTime, TimelogDelineatorType.WAKEUP_TIME);
        }
    }
}