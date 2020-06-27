import * as moment from 'moment';
import { TimeSelectionRow } from '../time-selection-row/time-selection-row.class';
import { DaybookDisplayService } from '../../../../../../daybook/daybook-display.service';
import { TimelogDelineatorType, TimelogDelineator } from '../../../timelog-delineator.class';
import { Subscription, Subject, Observable, range } from 'rxjs';
import { DaybookTimeScheduleStatus } from '../../../../../api/daybook-time-schedule/daybook-time-schedule-status.enum';
import { DaybookTimeScheduleItem } from '../../../../../api/daybook-time-schedule/daybook-time-schedule-item.class';
import { TimeRangeRelationship } from '../../../../../../../shared/time-utilities/time-range-relationship.enum';
import { TimeScheduleItem } from '../../../../../../../shared/time-utilities/time-schedule-item.class';

export class TimeSelectionColumn {

    private _startTime: moment.Moment;
    private _endTime: moment.Moment;

    private _divisorMinutes: number = 5;

    private _rows: TimeSelectionRow[] = [];


    public get startTime(): moment.Moment { return this._startTime; }
    public get endTime(): moment.Moment { return this._endTime; }
    public get rows(): TimeSelectionRow[] { return this._rows; }


    private _daybookService: DaybookDisplayService;

    constructor(daybookService: DaybookDisplayService) {
        console.log("** Construction TimeSelectionColumn")
        this._daybookService = daybookService;
        this._startTime = moment(this._daybookService.displayStartTime);
        this._endTime = moment(this._daybookService.displayEndTime);
        this._calculateDivisorMinutes();
        this._buildRows();
    }


    private _buildRows() {
        // console.log("   Rebuilding rows in TimeSelectionColumn.class")
        const durationMinutes: number = this.endTime.diff(this.startTime, 'minutes');
        const rowCount = durationMinutes / this._divisorMinutes;
        const rows: TimeSelectionRow[] = [];
        const timeScheduleItems = this._daybookService.schedule.timeScheduleItems;
        let currentTime: moment.Moment = moment(this.startTime);
        const availableItems: DaybookTimeScheduleItem[] = this._getMergedAvailableItems();
        for (let i = 0; i < rowCount; i++) {
            const startTime: moment.Moment = moment(currentTime);
            const endTime: moment.Moment = moment(currentTime).add(this._divisorMinutes, 'minutes');
            const sectionIndex = this._findSectionIndex(startTime, endTime, availableItems);
            const newRow = new TimeSelectionRow(startTime, endTime, sectionIndex);
            const delineator = this._findDelineator(newRow);
            if (delineator) {
                newRow.markTimelogDelineator(delineator);
            }
            rows.push(newRow);
            currentTime = moment(currentTime).add(this._divisorMinutes, 'minutes');
        }
        this._rows = rows;
        // this._rows.forEach((item) => { console.log("  " + item.toString()) })
        this._updateRowSubscriptions();
    }


    private _deleteDelineator$: Subject<moment.Moment> = new Subject();
    private _startDragging$: Subject<TimeSelectionRow> = new Subject();
    private _updateDragging$: Subject<TimeSelectionRow> = new Subject();
    private _stopDragging$: Subject<TimeSelectionRow> = new Subject();

    public get deleteDelineator$(): Observable<moment.Moment> { return this._deleteDelineator$.asObservable(); }
    public get startDragging$(): Observable<TimeSelectionRow> { return this._startDragging$.asObservable(); }
    public get updateDragging$(): Observable<TimeSelectionRow> { return this._updateDragging$.asObservable(); }
    public get stopDragging$(): Observable<TimeSelectionRow> { return this._stopDragging$.asObservable(); }

    private _rowSubscriptions: Subscription[] = [];
    private _updateRowSubscriptions() {
        this._rowSubscriptions.forEach(s => s.unsubscribe());
        this._rowSubscriptions = [];
        const deleteSubscriptions = this.rows.map(row => row.deleteDelineator$.subscribe((del: moment.Moment) => {
            this._deleteDelineator$.next(del);
        }));
        const editSubscriptions = this.rows.map(row => row.editDelineator$.subscribe((saveNewDelineator: moment.Moment) => {
            this._daybookService.activeDayController.updateDelineator(row.markedDelineator.time, saveNewDelineator);
        }));
        const startDragSubs = this.rows.map(row => row.startDragging$.subscribe((startDragging: TimeSelectionRow) => {
            if (startDragging) { this._startDragging$.next(startDragging); }
        }));
        const updateDragSubs = this.rows.map(row => row.updateDragging$.subscribe((updateDragging: TimeSelectionRow) => {
            if (updateDragging) { this._updateDragging$.next(updateDragging); }
        }));
        const stopDragSbus = this.rows.map(row => row.stopDragging$.subscribe((stopDragging: TimeSelectionRow) => {
            if (stopDragging) { this._stopDragging$.next(stopDragging); }
        }));
        this._rowSubscriptions = [
            ...deleteSubscriptions,
            ...editSubscriptions,
            ...startDragSubs,
            ...stopDragSbus,
            ...updateDragSubs,
        ];
    }

    public reset() {
        this._rows.forEach((row) => {
            row.reset();
        });
    }

    private _findDelineator(newRow: TimeSelectionRow): TimelogDelineator {
        const priority = [
            TimelogDelineatorType.FRAME_START,
            TimelogDelineatorType.FRAME_END,
            TimelogDelineatorType.NOW,
            TimelogDelineatorType.WAKEUP_TIME,
            TimelogDelineatorType.FALLASLEEP_TIME,
            TimelogDelineatorType.SAVED_DELINEATOR,
            TimelogDelineatorType.TIMELOG_ENTRY_START,
            TimelogDelineatorType.TIMELOG_ENTRY_END,
            TimelogDelineatorType.DAY_STRUCTURE,
        ];
        // const percentThreshold: number = 0.03;
        // const totalViewMS = this.endTime.diff(this.startTime, 'milliseconds');
        // const rangeMS = totalViewMS * percentThreshold;
        // const rangeStart = moment(newRow.startTime).subtract(rangeMS, 'milliseconds');
        // const rangeEnd = moment(newRow.startTime).add(rangeMS, 'milliseconds');
        const foundRangeItems = this._daybookService.timelogDelineators.filter(item => {
            return item.time.isSameOrAfter(newRow.startTime) && item.time.isSameOrBefore(newRow.endTime);
        });
        let foundDelineator: TimelogDelineator;
        if (foundRangeItems.length > 0) {
            const foundItems = this._daybookService.timelogDelineators.filter(item =>
                item.time.isSameOrAfter(newRow.startTime) && item.time.isBefore(newRow.endTime));
            if (foundItems.length === 1) {
                foundDelineator = foundItems[0];
            } else if (foundItems.length > 1) {

                let foundItem = foundItems[0];
                for (let i = 1; i < foundItems.length; i++) {
                    if (priority.indexOf(foundItems[i].delineatorType) < priority.indexOf(foundItems[i - 1].delineatorType)) {
                        foundItem = foundItems[i];
                    }
                }
                foundDelineator = foundItem;
            }
        }
        return foundDelineator;
    }

    private _findSectionIndex(startTime: moment.Moment, endTime: moment.Moment, availableItems: DaybookTimeScheduleItem[]): number {
        if (availableItems.length === 0) {
            console.log('Error: no item found')
            return -1;
        } else if (availableItems.length === 1) {
            return 0;
        } else if (availableItems.length > 1) {
            const foundIndex = availableItems.findIndex(availableItem =>{
                const sameStart = startTime.isSame(availableItem.startTime);
                const isDuring = startTime.isSameOrAfter(availableItem.startTime) && endTime.isSameOrBefore(availableItem.endTime);
                if(sameStart || isDuring){
                    return true;
                }
                else{
                    const sameEnd = startTime.isBefore(availableItem.endTime) && endTime.isSame(availableItem.endTime);
                    return sameEnd;
                }
            });
            return foundIndex;
        }
    }

    private _getMergedAvailableItems(): DaybookTimeScheduleItem[] {
        let allAvailableItems = this._daybookService.schedule.getAvailableScheduleItems();
        if (allAvailableItems.length > 1) {
            const mergeDelineators: TimelogDelineator[] = this._daybookService.timelogDelineators
                .filter(item => {
                    return (item.delineatorType === TimelogDelineatorType.NOW || item.delineatorType === TimelogDelineatorType.DAY_STRUCTURE);
                });
            for (let i = 1; i < allAvailableItems.length; i++) {
                const item1 = allAvailableItems[i - 1];
                const item2 = allAvailableItems[i];
                const itemsAreContinuous: boolean = item1.getRelationshipTo(item2) === TimeRangeRelationship.IMMEDIATELY_BEFORE;
                if (itemsAreContinuous) {
                    let mergeOver: boolean = false;
                    for (let j = 0; j < mergeDelineators.length; j++) {
                        if (item2.startTime.isSame(mergeDelineators[j].time)) {
                            // console.log("ITS THE SAME, BABY!" + mergeDelineators[j].toString())
                            mergeOver = true;
                        }
                    }
                    if (mergeOver) {
                        item1.changeEndTime(item2.endTime);
                        allAvailableItems.splice(i, 1);
                        i--;
                    }
                }
            }
        }
        return allAvailableItems;
    }

    private _calculateDivisorMinutes() {
        // for performance reasons we don't want too many, but for functionality reasons we don't want too few.
        //  100-200 seems like a pretty good range.
        const nearestTo = 100;
        const durationMinutes: number = this.endTime.diff(this.startTime, 'minutes');
        let nearest = 5;
        let nearestDistance = Math.abs(nearestTo - (durationMinutes / nearest));
        [5, 10, 15, 30, 60].forEach((numberOfMinutes) => {
            const divisions = durationMinutes / numberOfMinutes;
            const distanceTo = Math.abs(nearestTo - divisions);
            if (distanceTo < nearestDistance) {
                nearestDistance = distanceTo;
                nearest = numberOfMinutes;
            }
        });
        this._divisorMinutes = nearest;
    }
}