import { Component, OnInit, Input, OnDestroy, Output, EventEmitter } from '@angular/core';
import { ActivityCategoryDefinition } from '../../../shared/document-definitions/activity-category-definition/activity-category-definition.class';
import { ActivityCategoryDefinitionService } from '../../../shared/document-definitions/activity-category-definition/activity-category-definition.service';
import { Subscription } from 'rxjs';
import { IActivityInstance } from './activity-instance.interface';
import * as moment from 'moment';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { faEdit } from '@fortawesome/free-regular-svg-icons';
import { ActivityTree } from '../activity-tree.model';
import { TimelogEntry } from '../../../shared/document-data/timelog-entry/timelog-entry.class';

@Component({
  selector: 'app-activity-display',
  templateUrl: './activity-display.component.html',
  styleUrls: ['./activity-display.component.css']
})
export class ActivityDisplayComponent implements OnInit, OnDestroy {

  faSpinner = faSpinner;
  faEdit = faEdit;

  constructor(private activityCategoryDefinitionService: ActivityCategoryDefinitionService) { }

  ifLoading: boolean = true;

  activityInstances: IActivityInstance[] = [];
  activityTimelogEntrys: TimelogEntry[] = [];

  activity: ActivityCategoryDefinition = null;

  private activityDataSubscription: Subscription = new Subscription();

  action: string = "view";

  @Output() displayClosed: EventEmitter<boolean> = new EventEmitter();

  @Input() set selectedActivity(activity: ActivityCategoryDefinition) {
    this.action = "view";
    this.activity = activity;
    // this.getActivityData();
  }
  ngOnInit() {
    this.action = "view";
    console.log("this method is neutered, due to refactor of tleActivity refactor");
    this.activityCategoryDefinitionService.activitiesTree$.subscribe((newTree: ActivityTree) => {
      let foundActivity = newTree.findActivityByTreeId(this.activity.treeId);
      this.activity = Object.assign({}, foundActivity);
      // this.getActivityData();
    });


  }

  // private getActivityData() {
  //   this.ifLoading = true;
  //   this.activityInstances = [];
  //   this.activityDataSubscription.unsubscribe();
  //   this.activityDataSubscription = this.activityCategoryDefinitionService.getActivityData(this.activity).subscribe((timelogEntrys: TimelogEntry[]) => {
  //     let activityInstances: IActivityInstance[] = [];
  //     for (let timelogEntry of timelogEntrys) {

  //       let timeForThisActivity: number = 0;
  //       if(timelogEntry.activities.length > 1){
          
  //         let timelogEntryDuration: number = moment(timelogEntry.endTimeISO).diff(moment(timelogEntry.startTimeISO), 'minutes');
  //         timeForThisActivity =  timelogEntryDuration / timelogEntry.activities.length;

  //       }else{
  //         timeForThisActivity = moment(timelogEntry.endTimeISO).diff(moment(timelogEntry.startTimeISO), 'minutes');
  //       }

  //       let durationHours: number = timeForThisActivity / 60;
  //       let instance: IActivityInstance = { startTime: moment(timelogEntry.startTime), endTime: moment(timelogEntry.endTime), durationHours: durationHours, activityTreeId: this.activity.treeId }
  //       activityInstances.push(instance);
  //     }

  //     this.activityTimelogEntrys = timelogEntrys;
  //     this.activityInstances = activityInstances
  //     this.ifLoading = false;
  //   });

  // }

  onClickEdit() {
    this.action = "edit";
  }

  onFormClosed(val: string) {
    this.action = "view";
    if (val == "DELETE") {
      this.displayClosed.emit();
    }

  }

  ngOnDestroy() {
    this.activityDataSubscription.unsubscribe();
  }

  onClickCloseActivity() {
    this.displayClosed.emit();
    this.ngOnDestroy();
  }

}
