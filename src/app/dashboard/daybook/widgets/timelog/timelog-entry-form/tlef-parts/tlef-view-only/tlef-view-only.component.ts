import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { TimelogEntryItem } from '../../../timelog-large-frame/timelog-body/timelog-entry/timelog-entry-item.class';
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { ActivityCategoryDefinitionService } from '../../../../../../activities/api/activity-category-definition.service';
import { TimelogEntryActivity } from '../../../../../api/data-items/timelog-entry-activity.interface';
import { ActivityCategoryDefinition } from '../../../../../../activities/api/activity-category-definition.class';
import { DurationString } from '../../../../../../../shared/utilities/time-utilities/duration-string.class';
import { TimelogEntryDecorator } from '../timelog-entry-decorator.class';
import { TimelogEntryDisplayItemUnit } from '../../../timelog-large-frame/timelog-body/timelog-entry/tle-display-item-unit.class';
import { DaybookDisplayService } from '../../../../../daybook-display.service';

@Component({
  selector: 'app-tlef-view-only',
  templateUrl: './tlef-view-only.component.html',
  styleUrls: ['./tlef-view-only.component.css']
})
export class TlefViewOnlyComponent implements OnInit {

  private _entryItem: TimelogEntryItem;
  public get entryItem(): TimelogEntryItem { return this._entryItem; }

  // private _isEditing: boolean = false;

  @Output() public editing: EventEmitter<boolean> = new EventEmitter();
  constructor(private daybookService: DaybookDisplayService, private activitiesService: ActivityCategoryDefinitionService) { }

  // public get isEditing(): boolean { return this._isEditing; }

  private _displayActivities: { activity: ActivityCategoryDefinition, durationMS: number, units: TimelogEntryDisplayItemUnit[] }[] = [];

  ngOnInit() {
    this._updateDisplayActivities();
    this.daybookService.tlefController.currentlyOpenTLEFItem$.subscribe((change)=>{
      this._updateDisplayActivities();
    })
  }

  private _updateDisplayActivities(){
    this._entryItem = this.daybookService.tlefController.currentlyOpenTLEFItem.getInitialTLEValue();
    const decorator: TimelogEntryDecorator = new TimelogEntryDecorator(this.activitiesService);
    this._displayActivities = this.entryItem.timelogEntryActivities.map(item => {
      const activity = this.activitiesService.findActivityByTreeId(item.activityTreeId);
      const durationMS = this.entryItem.durationMilliseconds * (item.percentage / 100);
      let units = decorator.getActivityUnits(item, (durationMS/(1000*60)));
      return {
        activity: activity,
        durationMS: durationMS,
        units: units,
      };

    });
  }

  public get displayActivities(): { activity: ActivityCategoryDefinition, durationMS: number }[] { return this._displayActivities; }


  public get activitiesCount(): number {
    return this.entryItem.timelogEntryActivities.length;
  }

  public onClickEdit() {
    this.editing.emit(true);
  }

  // public activityName(activity: TimelogEntryActivity) {
  //   return this.activitiesService.findActivityByTreeId(activity.activityTreeId).name;
  // }

  public durationString(milliseconds: number): string {
    return DurationString.getDurationStringFromMS(milliseconds);
  }

  faPencil = faPencilAlt;

}
