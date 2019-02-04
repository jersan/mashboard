import { Component, OnInit, Input } from '@angular/core';
import { IActivityInstance } from '../activity-instance.interface';
import { ISixWeekDayTile } from './six-week-day-tile.interface';

import * as moment from 'moment';
import { ActivitiesService } from '../../activities.service';
import { UserDefinedActivity } from '../../user-defined-activity.model';

@Component({
  selector: 'app-activity-six-week-view',
  templateUrl: './activity-six-week-view.component.html',
  styleUrls: ['./activity-six-week-view.component.css']
})
export class ActivitySixWeekViewComponent implements OnInit {


  private _activityInstances: IActivityInstance[];
  private _activity: UserDefinedActivity = null;
  tiles: ISixWeekDayTile[] = [];
  weeksOf: string[] = [];

  @Input() set activityInstances(activityInstances: IActivityInstance[]) {
    this._activityInstances = activityInstances;
    if (this._activityInstances.length > 0) {
      this._activity = this.activitiesService.findActivityById(this._activityInstances[0].activityTreeId);
    }


  }

  constructor(private activitiesService: ActivitiesService) { }

  ngOnInit() {

    if (this._activityInstances.length > 0) {
      this.buildSixWeekData();
    }


  }

  buildSixWeekData() {

    /*
      2019-02-03

      Some notes:  
      As of right now, there will be a bit of an inaccuracy issue here, for the following reason:
      in the activity-display.component.ts file, activities are being pulled from timeSegments from the server, and by default
      are simply being read-in as if these activies always take up the entirety of the duration of the timeSegment, even if the timeSegment has multiple activites within it.

      e.g. a timeSegment has "reading" and "web browsing" as 2 activities within it.  when the data is pulled, both "reading" as well as "web browsing" measure-in as the full duration of the timeSegment

      this is actually part of a much larger situation, where saved timeSegments do not delineate the times/duration between activities within.  
      This needs to be fixed at the level of creating and storing in the DB.
    */

    let tiles: ISixWeekDayTile[] = [];
    let weeksOf: string[] = [];

    let maxHours: number = 0;

    let currentDate = moment().startOf('week').subtract(5, 'weeks');
    while (currentDate.format('YYYY-MM-DD') <= moment().format('YYYY-MM-DD')) {
      if (currentDate.day() == 0) {
        weeksOf.push(currentDate.format('YYYY MMM DD'));
      }

      let hours = 0;
      for (let activity of this._activityInstances) {
        if (moment(activity.startTime).format('YYYY-MM-DD') != moment(currentDate).format('YYYY-MM-DD')
          && moment(activity.endTime).format('YYYY-MM-DD') == moment(currentDate).format('YYYY-MM-DD')) {
          hours += moment(activity.endTime).diff(moment(activity.endTime).startOf('date'), 'minutes') / 60;
        } else if (moment(activity.startTime).format('YYYY-MM-DD') == moment(currentDate).format('YYYY-MM-DD')
          && moment(activity.endTime).format('YYYY-MM-DD') == moment(currentDate).format('YYYY-MM-DD')) {
          hours += moment(activity.endTime).diff(moment(activity.startTime), 'minutes') / 60;
        } else if (moment(activity.startTime).format('YYYY-MM-DD') == moment(currentDate).format('YYYY-MM-DD')
          && moment(activity.endTime).format('YYYY-MM-DD') != moment(currentDate).format('YYYY-MM-DD')) {
          hours += moment(moment(activity.startTime).endOf('date')).diff(moment(activity.startTime), 'minutes') / 60;
        } else {
          //the activity did not occur at all on this day
        }
      }

      let tile: ISixWeekDayTile = { date: moment(currentDate), hours: hours, style: {} }
      if (hours > maxHours) {
        maxHours = hours;
      }

      tiles.push(tile);
      currentDate.add(1, 'days');
    }
    let color = this._activity.color;
    let gradient: string[] = this.getColorGradient(color);

    for (let tile of tiles) {
      let style: any = {};
      let percent: number = tile.hours / maxHours;
      let backgroundColor = this.getColorFromGradient(percent, gradient);

      style = { "background-color": backgroundColor };
      tile.style = style;
    }

    this.weeksOf = weeksOf;
    this.tiles = tiles;


  }



  tileHours(tile: ISixWeekDayTile): string {
    if (tile.hours > 0) {
      return "" + tile.hours.toFixed(1) + " hrs"
    } else {
      return "";
    }

  }

  weekOfStyle(weekOf: string): any {
    //first one yields:
    // grid-row 2 / span 1

    let row = this.weeksOf.indexOf(weekOf) + 2;
    let style = { "grid-row": "" + row + " / span 1" };

    return style;
  }


  getColorFromGradient(percent: number, gradient: string[]): string {
    if (percent == 0) {
      return "";
    }
    if (percent >= 0 && percent <= 0.2) {
      return gradient[0];
    } else if (percent > 0.2 && percent <= 0.4) {
      return gradient[1];
    } else if (percent > 0.4 && percent <= 0.6) {
      return gradient[1];
    } else if (percent > 0.6 && percent <= 0.8) {
      return gradient[1];
    } else if (percent > 0.8) {
      return gradient[4];
    }
    return "";
  }

  getColorGradient(startColor: string): string[] {
    function hexToRGB(hex: string, alpha: number) {
      var r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);

      if (alpha) {
        return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
      } else {
        return "rgb(" + r + ", " + g + ", " + b + ")";
      }
    }

    let colors: string[] = [];
    let gradientCount: number = 5;
    for (let i = 1; i < gradientCount; i++) {
      colors.push(hexToRGB(startColor, i / gradientCount));
    }
    colors.push(hexToRGB(startColor, 1));

    return colors;
  }

}