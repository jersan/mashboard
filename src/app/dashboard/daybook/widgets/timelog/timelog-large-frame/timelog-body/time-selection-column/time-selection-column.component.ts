import { Component, OnInit, Input, Output, EventEmitter, HostListener, OnDestroy } from '@angular/core';
import * as moment from 'moment';
import { TimeSelectionRow } from '../time-selection-row/time-selection-row.class';
import { Subscription } from 'rxjs';
import { TimelogEntryItem } from '../timelog-entry/timelog-entry-item.class';
import { TimelogDelineator, TimelogDelineatorType } from '../../../timelog-delineator.class';
import { DaybookDisplayService } from '../../../../../daybook-display.service';
import { DaybookDisplayUpdateType } from '../../../../../controller/items/daybook-display-update.interface';
import { TimeSelectionColumn } from './time-selection-column.class';
import { TimeScheduleItem } from '../../../../../../../shared/time-utilities/time-schedule-item.class';

@Component({
  selector: 'app-time-selection-column',
  templateUrl: './time-selection-column.component.html',
  styleUrls: ['./time-selection-column.component.css']
})
export class TimeSelectionColumnComponent implements OnInit, OnDestroy {

  constructor(private daybookDisplayService: DaybookDisplayService) { }

  private _mouseIsInComponent: boolean;
  private _startRow: TimeSelectionRow;
  private _endRow: TimeSelectionRow;
  private _timeDelineators: TimelogDelineator[] = [];
  private _isDrawing: boolean = false;

  @HostListener('window:mouseup', ['$event.target']) onMouseUp() {
    if (!this._mouseIsInComponent) {
      this._reset();
    }
  }

  public get rows(): TimeSelectionRow[] { return this._column.rows; }
  public get startTime(): moment.Moment { return this.daybookDisplayService.displayStartTime; }
  public get endTime(): moment.Moment { return this.daybookDisplayService.displayEndTime; }
  public get startRow(): TimeSelectionRow { return this._startRow; }
  public get endRow(): TimeSelectionRow { return this._endRow; }
  public get timeDelineators(): TimelogDelineator[] { return this._timeDelineators; }
  public get isDrawing(): boolean { return this._isDrawing; }

  private _column: TimeSelectionColumn;

  private _displaySub: Subscription = new Subscription();
  private _columnSubs: Subscription[] = [];

  ngOnInit() {
    console.log("TimeSelectionColumn")
    this._rebuild();
    this._displaySub = this.daybookDisplayService.displayUpdated$.subscribe((update) => {
      this._rebuild();
    });
  }

  private _rebuild() {
    this._timeDelineators = Object.assign([], this.daybookDisplayService.timelogDelineators);
    this._timeDelineators.push(new TimelogDelineator(moment().startOf('minute'), TimelogDelineatorType.NOW));
    this._column = new TimeSelectionColumn(this.daybookDisplayService);
    this._subscribeToColumn();
  }

  private _subscribeToColumn() {
    this._columnSubs.forEach(sub => sub.unsubscribe());
    this._columnSubs = [
      this._column.deleteDelineator$.subscribe((deleteDelineator) => { this._onDeleteDelineator(deleteDelineator); }),
      this._column.startDragging$.subscribe((startRow) => { this._startDragging(startRow); }),
      this._column.updateDragging$.subscribe((updateRow) => { this._updateDragging(updateRow); }),
      this._column.stopDragging$.subscribe((stopRow) => { this._stopDragging(stopRow); })
    ];
  }

  ngOnDestroy() {
    this._displaySub.unsubscribe();
    this._columnSubs.forEach(s => s.unsubscribe());
    this._columnSubs = [];
  }

  public onMouseLeave() {
    this._mouseIsInComponent = false;
    if (!this.startRow) {
      this._reset();
    }
  }
  public onMouseEnter() {
    this._mouseIsInComponent = true;
  }

  private _startDragging(row: TimeSelectionRow) {
    // console.log("_startDragging " + row.startTime.format("hh:mm a") + " ---- " + row.sectionIndex)
    this._startRow = row;
    this._activateSection(this._startRow);
    this._startRow.isDrawing
    if (!this._startRow.markedDelineator) {
      this._startRow.onDrawTLEDelineators(this.startRow.startTime);
    }
  }

  private _updateDragging(updateRow: TimeSelectionRow) {
    const sectionRows = this.rows.filter(item => item.sectionIndex === this._startRow.sectionIndex);
    const sectionStart = sectionRows[0];
    const sectionEnd = sectionRows[sectionRows.length - 1];
    let startTime: moment.Moment, endTime: moment.Moment;
    const updateStartTime: moment.Moment = moment(updateRow.startTime);
    const updateIsBeforeStartRow: boolean = updateStartTime.isBefore(this._startRow.startTime);
    const updateIsAfterStartRow: boolean = updateStartTime.isAfter(this._startRow.startTime);
    const updateIsSameAsStartRow: boolean = updateStartTime.isSame(this._startRow.startTime);
    this._endRow = updateRow;
    if(updateIsBeforeStartRow){
      if(updateStartTime.isBefore(sectionStart.startTime)){
        this._endRow = sectionStart;
        startTime = moment(this._startRow.sectionStartTime)
      }else{
        startTime = moment(this._endRow.startTime);
      }
      endTime = moment(this._startRow.startTime);
    }else if(updateIsAfterStartRow){
      startTime = moment(this._startRow.startTime);
      endTime = moment(this._endRow.startTime);
      if (updateRow.endTime.isSameOrAfter(sectionEnd.startTime)) {
        this._endRow = sectionEnd;
        endTime = moment(this._startRow.sectionEndTime);
      }
    }else if(updateIsSameAsStartRow){
      this._endRow = null;
      startTime = moment(this._startRow.startTime);
      endTime = moment(startTime);
    }
    if (!this._isDrawing) {
      this._activateSection(this._startRow);
    }
    this.rows.forEach((row) => {
      row.onDrawTLEDelineators(startTime, endTime);
    });
    // console.log("UPDATING DRAWING: " + startTime.format('hh:mm a') + " to " + endTime.format('hh:mm a'))
    if(startTime.isSame(endTime)){
      this.daybookDisplayService.onStartDrawingTLE(null);
    }else{
      this.daybookDisplayService.onStartDrawingTLE(new TimelogEntryItem(startTime, endTime));
    }
  }

  private _buildTimeRange(): TimeScheduleItem {
    let startTime = moment(this._startRow.startTime);
    let endTime = moment(this._endRow.startTime);
    if (startTime.isAfter(endTime)) {
      startTime = moment(this._endRow.startTime);
      endTime = moment(this._startRow.startTime);
    }
    const timeRange = new TimeScheduleItem(startTime.toISOString(), endTime.toISOString());
    return timeRange;
  }

  private _stopDragging(stopRow: TimeSelectionRow) {
    if (this.endRow && !this.endRow.startTime.isSame(this.startRow.startTime)) {
      const timeRange: TimeScheduleItem = this._buildTimeRange();
      const startTime = timeRange.startTime;
      const endTime = timeRange.endTime;
      this._createNewTimelogEntry(startTime, endTime);
    } else {
      if (stopRow.startTime.isSame(this.startRow.startTime)) {
        this._saveNewTimeDelineator(this.startRow);
      } else {
        console.log('Error with time values');
      }

    }
    this._reset();
  }

  private _onDeleteDelineator(deleteTime: moment.Moment) {
    if (deleteTime) {
      const foundTime = this.timeDelineators
        .filter(item => item.delineatorType === TimelogDelineatorType.SAVED_DELINEATOR)
        .find(item => item.time.isSame(deleteTime));
      if (foundTime) {
        this._timeDelineators.splice(this._timeDelineators.indexOf(foundTime), 1);
        this._timeDelineators = this.timeDelineators.sort((item1, item2) => {
          if (item1.time.isBefore(item2.time)) { return -1; }
          else if (item1.time.isAfter(item2.time)) { return 1; }
          else { return 0; }
        });
        this._rebuild();
        this.daybookDisplayService.activeDayController.deleteDelineator(deleteTime);
      } else {
        console.log("Error: could not delete delineator because time was not found: " + deleteTime.format('hh:mm a'));
      }
    } else {
      console.log('Error:  no deleteTime value provided')
    }
  }

  private _reset() {
    console.log("RESETTING COLUMN")
    this._isDrawing = false;
    this._column.reset();
    this._startRow = null;
    this._endRow = null;
    // this._mouseUpRow = null;
    // this._mouseOverRow = null;
    this.daybookDisplayService.onStartDrawingTLE(null);
  }


  private _activateSection(activateRow: TimeSelectionRow) {
    this._isDrawing = true;
    this.rows.forEach((row) => {
      if (row.sectionIndex === activateRow.sectionIndex) {
        row.activate();
      } else {
        row.deactivate();
      }
    });
  }


  private _saveNewTimeDelineator(actionRow: TimeSelectionRow) {
    const maxDelineators = 16;
    let saveAllDelineators: moment.Moment[] = [];
    const existingValues = this.daybookDisplayService.activeDayController.savedTimeDelineators;
    existingValues.forEach((existingValue) => {
      if (this.daybookDisplayService.daybookSchedule.isAvailableAtTime(existingValue)) {
        saveAllDelineators.push(moment(existingValue));
      }
    });
    if (saveAllDelineators.length < maxDelineators) {
      saveAllDelineators.push(actionRow.startTime);
    }
    saveAllDelineators = saveAllDelineators.sort((item1, item2) => {
      if (item1.isBefore(item2)) { return -1; }
      else if (item1.isAfter(item2)) { return 1; }
      else { return 0; }
    });

    this.daybookDisplayService.activeDayController.saveTimeDelineators(saveAllDelineators);
    this._rebuild();
  }

  private _createNewTimelogEntry(startTime: moment.Moment, endTime: moment.Moment) {
    const saveNewTLE = new TimelogEntryItem(startTime, endTime);
    this.daybookDisplayService.onCreateNewTimelogEntry(saveNewTLE);
    this._reset();
  }




}