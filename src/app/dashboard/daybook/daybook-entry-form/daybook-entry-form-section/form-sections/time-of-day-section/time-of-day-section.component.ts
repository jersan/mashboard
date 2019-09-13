import { Component, OnInit, Input } from '@angular/core';
import { DaybookEntryForm } from '../../../daybook-entry-form.class';
import { TimeOfDay } from '../../../../../../shared/utilities/time-of-day-enum';
import { ActivityCategoryDefinition } from '../../../../../activities/api/activity-category-definition.class';
import { faCheck, faSyncAlt, faCircle, faPlusCircle, faPlus } from '@fortawesome/free-solid-svg-icons';
import { faCircle as faCircleNotSolid } from '@fortawesome/free-regular-svg-icons';

import { DaybookDayItemScheduledActivity } from '../../../../api/data-items/daybook-day-item-scheduled-activity.class';
import { DaybookEntryFormSection } from '../../daybook-entry-form-section.class';

@Component({
  selector: 'app-time-of-day-section',
  templateUrl: './time-of-day-section.component.html',
  styleUrls: ['./time-of-day-section.component.css']
})
export class DaySectionComponent implements OnInit {

  
  @Input() daybookEntryForm: DaybookEntryForm;
  @Input() formSection: DaybookEntryFormSection;

  public get scheduledRoutineItems(): DaybookDayItemScheduledActivity[]{
    if(this.formSection){
      return this.formSection.scheduledActivities.filter((item)=>{
        return item.isRoutine;
      });
    }else{
      return [];
    }
  }
  public get scheduledActivities(): DaybookDayItemScheduledActivity[]{
    if(this.formSection){
      return this.formSection.scheduledActivities.filter((item)=>{
        return !item.isRoutine;
      })
    }else{
      return [];
    }
  }

  constructor() { }

  ngOnInit() {
    console.log("scheduled routine items : ", this.scheduledRoutineItems);
    this.scheduledRoutineItems.forEach((item)=>{
      item.routineMemberActivities.forEach((rma)=>{
        console.log("RMA: ", rma.name);
      })
    })
    console.log("form section: " + this.formSection.title);
    console.log("isBeforeCurrentTIme? " , this.formSection.isBeforeCurrentTimeSection);
    console.log("isCurrentTime? " , this.formSection.isCurrentTimeSection);
    console.log("isAfterCurrentTime? " , this.formSection.isAfterCurrentTimeSection);
  }

  onCloseDataEntryItemInput(event : boolean){
    console.log("Event ", event);
    this.formSection.isAddingNewItem = false;
  }


  faCheck = faCheck;
  faSync = faSyncAlt;
  faCircle = faCircleNotSolid;
  faCircleSolid = faCircle;
  faSyncAlt = faSyncAlt;
  faPlusCircle = faPlusCircle;
  faPlus = faPlus;
}