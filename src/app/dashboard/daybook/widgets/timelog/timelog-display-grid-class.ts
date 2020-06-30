import * as moment from 'moment';
import { TimelogDelineator, TimelogDelineatorType } from "./timelog-delineator.class";
import { TimelogDisplayGridItem } from './timelog-display-grid-item.class';
import { TimelogEntryItem } from './timelog-large-frame/timelog-body/timelog-entry/timelog-entry-item.class';
import { DaybookController } from '../../controller/daybook-controller.class';
import { TimeScheduleItem } from '../../../../shared/time-utilities/time-schedule-item.class';
import { TLEFController } from './timelog-entry-form/TLEF-controller.class';
import { TLEFControllerItem } from './timelog-entry-form/TLEF-controller-item.class';
import { DaybookTimeScheduleStatus } from '../../api/daybook-time-schedule/daybook-time-schedule-status.enum';
import { DaybookTimeSchedule } from '../../api/daybook-time-schedule/daybook-time-schedule.class';
import { DaybookTimeScheduleItem } from '../../api/daybook-time-schedule/daybook-time-schedule-item.class';
import { TimeRangeRelationship } from '../../../../shared/time-utilities/time-range-relationship.enum';

export class TimelogDisplayGrid {

  constructor(startTime: moment.Moment, endTime: moment.Moment, delineators: TimelogDelineator[], schedule: DaybookTimeSchedule, activeDayController: DaybookController) {
    // console.log("Constructing timelogDisplayGrid: delineators: ", delineators);
    this._startTime = moment(startTime);
    this._endTime = moment(endTime);
    this._timeDelineators = delineators;
    this._activeController = activeDayController;
    // this._tlefController = tlefController;
    this._daybookSchedule = schedule;
    this._buildGrid();
  }

  private _startTime: moment.Moment;
  private _endTime: moment.Moment
  private _timeDelineators: TimelogDelineator[];
  private _activeController: DaybookController;
  // private _tlefController: TLEFController;
  private _daybookSchedule: DaybookTimeSchedule;


  private _gridItems: TimelogDisplayGridItem[] = [];

  public get startTime(): moment.Moment { return this._startTime; }
  public get endTime(): moment.Moment { return this._endTime; }
  public get totalViewMilliseconds(): number { return this._endTime.diff(this._startTime, 'milliseconds') };
  public get timeDelineators(): TimelogDelineator[] { return this._timeDelineators; }
  public get gridItems(): TimelogDisplayGridItem[] { return this._gridItems; }

  public ngStyle: any = {};

  public setActiveItemByIndex(currentActiveIndex: number) {
    this.gridItems.forEach((item) => {
      item.isActiveFormItem = false;
    });
    this.gridItems[currentActiveIndex].isActiveFormItem = true;
  }

  private _buildGrid() {
    let displayGridNgStyle: any = {};
    let gridItems: TimelogDisplayGridItem[] = this._daybookSchedule.getItemsInRange(this.startTime, this.endTime)
      .map(item => {
        const percent: number = (item.durationMs / this.totalViewMilliseconds) * 100;
        let timelogEntry: TimelogEntryItem = item.timelogEntry;
        const newGridItem = new TimelogDisplayGridItem(item.startTime, item.endTime, percent, item.status, timelogEntry);
        return newGridItem;
      });
    gridItems = this._splitAvailableItems(gridItems);
    for (let i = 0; i < gridItems.length; i++) {
      gridItems[i].setItemIndex(i);
    }
    let length = gridItems.length;
    for (let i = 1; i < length; i++) {
      const minPercent = 2.5;
      const smallPercent = 6;
      const largePercent = 15;
      if (gridItems[i - 1].timeScheduleStatus === gridItems[i].timeScheduleStatus) {
        let merge = false;
        if (gridItems[i].isTimelogEntry) {
          // console.log(gridItems[i].percent, gridItems[i - 1].percent)
          if ((gridItems[i].percent < minPercent) || (gridItems[i - 1].percent < minPercent)) {
            merge = true;
            gridItems[i].isVerySmallItem = true;
          } else if (gridItems[i].percent >= minPercent && gridItems[i].percent < smallPercent) {
            gridItems[i].isSmallGridItem = true;
          } else if (gridItems[i].percent >= largePercent) {
            gridItems[i].isLargeGridItem = true;
          }
        }
        if (merge) {
          gridItems[i].timelogEntries.forEach((tle) => gridItems[i - 1].timelogEntries.push(tle));
          gridItems[i - 1].percent = gridItems[i - 1].percent + gridItems[i].percent;
          gridItems[i - 1].changeEndTime(gridItems[i].endTime);
          gridItems[i - 1].isMerged = true;
          if (gridItems[i - 1].percent > smallPercent) {
            gridItems[i - 1].isSmallGridItem = false;
            gridItems[i - 1].isVerySmallItem = false;
          } else if (gridItems[i - 1].percent > minPercent) {
            gridItems[i - 1].isSmallGridItem = true;
            gridItems[i - 1].isVerySmallItem = false;
          } else {
            gridItems[i - 1].isVerySmallItem = true;
          }
          gridItems.splice(i, 1);
          length = gridItems.length;
          i--;
        }
      } else {
        if (gridItems[i].percent < minPercent) {
          gridItems[i].isVerySmallItem = true;
        } else if (gridItems[i].percent >= minPercent && gridItems[i].percent < smallPercent) {
          gridItems[i].isSmallGridItem = true;
        } else if (gridItems[i].percent >= largePercent) {
          gridItems[i].isLargeGridItem = true;
        }
      }
    }
    let gridTemplateRows: string = "";
    gridItems.forEach((gridItem) => {
      gridTemplateRows += "" + gridItem.percent.toFixed(3) + "% ";
    });
    displayGridNgStyle['grid-template-rows'] = gridTemplateRows;
    this.ngStyle = displayGridNgStyle;
    this._gridItems = gridItems;

    // console.log("Grid items:")
    // this._gridItems.forEach(item => console.log(item.toString()))

  }

  private _splitAvailableItems(gridItems: TimelogDisplayGridItem[]): TimelogDisplayGridItem[] {
    let splitItems: TimelogDisplayGridItem[] = [];
    for (let i = 0; i < gridItems.length; i++) {
      if (gridItems[i].timeScheduleStatus === DaybookTimeScheduleStatus.AVAILABLE) {
        const relevantDelineators = this.timeDelineators.filter((item) => {
          const overlaps: boolean = gridItems[i].getRelationshipToTime(item.time) === TimeRangeRelationship.OVERLAPS;
          const validType: boolean = ([
            TimelogDelineatorType.NOW, TimelogDelineatorType.DAY_STRUCTURE, TimelogDelineatorType.SAVED_DELINEATOR
          ].indexOf(item.delineatorType)) > -1;
          return overlaps && validType;
        });

        if (relevantDelineators.length > 0) {
          // console.log("RELEVANT ITEMS: ")
          // relevantDelineators.forEach((item) => console.log("  " + item.toString()))
          let currentTime = moment(gridItems[i].startTime);
          for (let j = 0; j < relevantDelineators.length; j++) {
            const schedItem = new TimeScheduleItem(currentTime.toISOString(), relevantDelineators[j].time.toISOString());
            const percent: number = (schedItem.durationMs / gridItems[i].durationMs) * gridItems[i].percent;
            const newGridItem = new TimelogDisplayGridItem(schedItem.startTime, schedItem.endTime, percent, gridItems[i].timeScheduleStatus);
            splitItems.push(newGridItem);
            currentTime = moment(relevantDelineators[j].time);
          }
          const schedItem = new TimeScheduleItem(currentTime.toISOString(), gridItems[i].endTime.toISOString());
          const percent: number = (schedItem.durationMs / gridItems[i].durationMs) * gridItems[i].percent;
          const newGridItem = new TimelogDisplayGridItem(schedItem.startTime, schedItem.endTime, percent, gridItems[i].timeScheduleStatus);
          splitItems.push(newGridItem);
        } else {
          splitItems.push(gridItems[i]);
        }
      } else {
        splitItems.push(gridItems[i]);
      }
    }
    return splitItems;
  }


  public updateOnToolChange(toolChange: { startTime: moment.Moment, endTime: moment.Moment }) {
    if (toolChange) {
      // console.log("Tool change "  +  toolChange.startTime.format('YYYY-MM-DD hh:mm a') + " to " + toolChange.endTime.format('YYYY-MM-DD hh:mm a'))

      const foundItem = this.gridItems.find((item) => {
        const startsAfterStart = item.startTime.isSameOrAfter(toolChange.startTime);
        const startsBeforeEnd = item.startTime.isSameOrBefore(toolChange.endTime);
        const endsAfterStart = item.endTime.isSameOrAfter(toolChange.startTime);
        const endsBeforeEnd = item.endTime.isSameOrBefore(toolChange.endTime);
        return startsAfterStart && startsBeforeEnd && endsAfterStart && endsBeforeEnd;
      });
      if (foundItem) {
        this.gridItems.forEach((item) => {
          item.isActiveFormItem = false;
        });
        foundItem.isActiveFormItem = true;
      } else {
        console.log("Error: unable to find grid item from toolChange " + toolChange.startTime.format('hh:mm a') + " to " + toolChange.endTime.format('hh:mm a'))
      }
    } else {
      this.gridItems.forEach((item) => {
        item.isActiveFormItem = false;
      });
    }

  }

}