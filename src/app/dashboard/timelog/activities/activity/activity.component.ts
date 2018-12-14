import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { faTimes, faCog } from '@fortawesome/free-solid-svg-icons';
import { CategorizedActivity } from '../categorized-activity.model';
import { IActivityTile } from '../activity-tile.interface';

@Component({
  selector: 'app-activity',
  templateUrl: './activity.component.html',
  styleUrls: ['./activity.component.css']
})
export class ActivityComponent implements OnInit {

  constructor() { }

  faTimes = faTimes;
  faCog = faCog;

  activityTile: IActivityTile = null;

  @Input() set activity(activity: CategorizedActivity){
    this.activityTile = {activity: activity, ifShowActivityDelete: false, ifShowActivityModify: false};
  };



  @Output() activityDeleted: EventEmitter<CategorizedActivity> = new EventEmitter<CategorizedActivity>();
  @Output() activityModify: EventEmitter<CategorizedActivity> = new EventEmitter<CategorizedActivity>();

  ngOnInit() {
  }

  onClickDeleteActivity(activity){
    this.activityDeleted.emit(activity);
  }
  onClickModifyActivity(activity){
    this.activityModify.emit(activity);
  }

  onMouseEnterActivity(tile : IActivityTile){
    if(this.activityTile.activity.children.length > 0){
      this.activityTile.ifShowActivityDelete = false;
    }else{
      this.activityTile.ifShowActivityDelete = true;
    }
    this.activityTile.ifShowActivityModify = true;
    
  }
  onMouseLeaveActivity(tile : IActivityTile){
    this.activityTile.ifShowActivityDelete = false;
    this.activityTile.ifShowActivityModify = false;
  }


}
