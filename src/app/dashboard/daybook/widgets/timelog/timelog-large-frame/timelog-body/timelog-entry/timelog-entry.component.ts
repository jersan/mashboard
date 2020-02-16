import { Component, OnInit, Input } from '@angular/core';
import { TimelogEntryItem } from './timelog-entry-item.class';
import { ActivityCategoryDefinitionService } from '../../../../../../activities/api/activity-category-definition.service';
import { ActivityCategoryDefinition } from '../../../../../../activities/api/activity-category-definition.class';
import { ScreenSizeService } from '../../../../../../../shared/app-screen-size/screen-size.service';
import { AppScreenSize } from '../../../../../../../shared/app-screen-size/app-screen-size.enum';
import { ColorConverter } from '../../../../../../../shared/utilities/color-converter.class';
import { ColorType } from '../../../../../../../shared/utilities/color-type.enum';
import { TimelogEntryActivity } from '../../../../../api/data-items/timelog-entry-activity.interface';
import { TimelogEntryDisplayItem } from './timelog-entry-display-item.class';
import { ToolboxService } from '../../../../../../../toolbox-menu/toolbox.service';
import { ToolType } from '../../../../../../../toolbox-menu/tool-type.enum';
import { TimelogDisplayGridItem } from '../../../timelog-display-grid-item.class';
import { TimelogEntryFormService } from '../../../timelog-entry-form/timelog-entry-form.service';

@Component({
  selector: 'app-timelog-entry',
  templateUrl: './timelog-entry.component.html',
  styleUrls: ['./timelog-entry.component.css']
})
export class TimelogEntryComponent implements OnInit {

  constructor(
    private activitiesService: ActivityCategoryDefinitionService,
    private screenSizeService: ScreenSizeService,
    private tlefService: TimelogEntryFormService) { }

  private _displayEntry: TimelogEntryDisplayItem;
  private _entries: TimelogEntryItem[] = [];
  private _activityDisplayEntries: { activity: ActivityCategoryDefinition, name: string, color: string, durationMinutes: number }[] = [];

  public screenSize: AppScreenSize;

  @Input() public gridItem: TimelogDisplayGridItem;


  public get timelogEntries(): TimelogEntryItem[] { return this.gridItem.timelogEntries; }
  public get displayEntry(): TimelogEntryDisplayItem { return this._displayEntry; }
  public get activityDisplayEntries(): { activity: ActivityCategoryDefinition, name: string, color: string, durationMinutes: number }[] { return this._activityDisplayEntries; }
  public get backgroundColor(): string { return this.displayEntry.backgroundColor; };
  public get units(): { color: string, unitType: "HOUR" | "FIFTEEN", fill: any[] }[] { return this.displayEntry.units; };
  public get displayString(): string { return this.displayEntry.displayString; };

  ngOnInit() {
    this._rebuild();
    this.screenSize = this.screenSizeService.appScreenSize;
    this.screenSizeService.appScreenSize$.subscribe((size) => {
      this.screenSize = size;
    })
    this.activitiesService.activitiesTree$.subscribe((treeChanged) => {
      this._rebuild();
    });

  }

  public onClickOpenTimelogEntry() {
    console.log("Opening Timelog Entry grid item.  this.timelogEntries.length = " , this.timelogEntries.length)
    if(this.timelogEntries.length === 0){
      this.tlefService.openTimelogEntry(new TimelogEntryItem(this.gridItem.startTime, this.gridItem.endTime));
    }else if(this.timelogEntries.length === 1){
      this.tlefService.openTimelogEntry(this.timelogEntries[0]);
    }else if(this.timelogEntries.length > 1){
      const totalMS = this.gridItem.endTime.diff(this.gridItem.startTime, 'milliseconds');
      const foundIndex = this.timelogEntries.findIndex(item => item.durationMilliseconds > (totalMS/2));
      if(foundIndex > -1){
        this.tlefService.openTimelogEntry(this.timelogEntries[foundIndex]);
      }else{
        this.tlefService.openTimelogEntry(this.timelogEntries[0]);
      }
    }
  }


  private _rebuild() {
    let displayEntry: TimelogEntryDisplayItem = new TimelogEntryDisplayItem(this.gridItem, this.activitiesService.activitiesTree);
    this._displayEntry = displayEntry;
  }



}