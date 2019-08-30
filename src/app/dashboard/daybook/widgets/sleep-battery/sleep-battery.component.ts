import { Component, OnInit, Input } from '@angular/core';
import { timer } from 'rxjs';
import * as moment from 'moment';
import { DurationString } from '../../../../shared/utilities/duration-string.class';
import { SleepBatteryConfiguration } from './sleep-battery-configuration.interface';

@Component({
  selector: 'app-sleep-battery',
  templateUrl: './sleep-battery.component.html',
  styleUrls: ['./sleep-battery.component.css']
})
export class SleepBatteryComponent implements OnInit {

  constructor() { }


  private _percentage: number = 0;


  private _wakeupTime: moment.Moment;
  private _bedtime: moment.Moment;
  
  private _batteryConfiguration: SleepBatteryConfiguration;
  public get batteryConfiguration(): SleepBatteryConfiguration{
    return this._batteryConfiguration;
  }

  @Input() public set configuration(configuration: SleepBatteryConfiguration ){
    this._batteryConfiguration = configuration;
    this._wakeupTime = this._batteryConfiguration.wakeupTime;
    this._bedtime = this._batteryConfiguration.bedtime;
    this.updateBattery();
    
  }

  public get wakeupTime(): moment.Moment{
    return this._wakeupTime;
  }
  public get bedtime(): moment.Moment{
    return this._bedtime;
  }


  percentageNgStyle: any = {};
  colorNgClass: string[] = [];

  ngOnInit() {
    this.updateBattery();
    timer(0, 60000).subscribe((tick) => {
      this.updateBattery();
    });
  }

  public onClickBattery(){
    console.log("Battery was clicked.  DO what next?  Navigate to a page which displays battery energy levels, and ability to configure it?")
  }




  private _timeUntilBedtime: string ="";
  private _timeSinceWakeup: string = "";

  public get timeSinceWakeup(): string {
    return this._timeSinceWakeup;
  }
  public get timeUntilBedtime(): string {
    return this._timeUntilBedtime;
  }

  private updateBattery() {
    let now: moment.Moment = moment();
    let awakeForMinutes: number = moment(now).diff(this.wakeupTime, "minutes");
    let totalDayDurationMinutes: number = moment(this.bedtime).diff(this.wakeupTime, "minutes");
    this._percentage = (1 - (awakeForMinutes / totalDayDurationMinutes)) * 100;

    let colorNgClass: string[] = [];
    if (this._percentage < 25) {
      colorNgClass = ["lowest-quarter"];
    } else if (this._percentage >= 25 && this._percentage < 50) {
      colorNgClass = ["low-quarter"];
    } else if (this._percentage >= 50 && this._percentage < 75) {
      colorNgClass = ["high-quarter"];
    } else if (this._percentage >= 75) {
      colorNgClass = ["highest-quarter"];
    }


    this.colorNgClass = colorNgClass;

    this.percentageNgStyle = {
      "height": "" + this._percentage.toFixed(2) + "%",
    }

    this._batteryCharge = "" + this._percentage.toFixed(0) + "%";


    let timeUntilBedtime = "";
    if (now.isBefore(this.bedtime)) {
        timeUntilBedtime = DurationString.calculateDurationString(now, this.bedtime, true) + " until bedtime";
    } else {
        timeUntilBedtime = DurationString.calculateDurationString(this.bedtime, now, true) + " past bedtime";
    }
    this._timeUntilBedtime = timeUntilBedtime;

    let timeSinceWakeup = "";
    if (now.isBefore(this.wakeupTime)) {
        timeSinceWakeup = "";
    } else if (now.isAfter(this.wakeupTime)) {
        timeSinceWakeup = DurationString.calculateDurationString(this.wakeupTime, now, true) + " since wake up";
    }
    this._timeSinceWakeup = timeSinceWakeup;
    
    let shape = this._batteryConfiguration.shape;
    if(shape == "LARGE"){
      this._batteryNgClass = ["large-battery"];
    }else if(shape == "SMALL"){
      this._batteryNgClass = ["small-battery"];
    }

  }

  private _batteryNgClass: any = {};
  public get batteryNgClass(): any{
    return this._batteryNgClass;
  }


  private _batteryCharge: string = "";
  public get batteryCharge(): string {
    return this._batteryCharge;
  }
}
