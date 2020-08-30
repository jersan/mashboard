import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import * as moment from 'moment';
import { timer } from 'rxjs';
import { SleepService } from '../sleep.service';
import { SleepCyclePosition } from '../sleep-cycle/sleep-cycle-position.enum';
import { faCloudMoon } from '@fortawesome/free-solid-svg-icons';
import { AppScreenSizeService } from '../../../../shared/app-screen-size/app-screen-size.service';
import { AppScreenSizeLabel } from '../../../../shared/app-screen-size/app-screen-size-label.enum';

@Component({
  selector: 'app-sleep-data-prompt',
  templateUrl: './sleep-data-prompt.component.html',
  styleUrls: ['./sleep-data-prompt.component.css']
})
export class SleepDataPromptComponent implements OnInit {

  constructor(
    private sleepService: SleepService,
    private screenService: AppScreenSizeService) { }


  public faCloudMoon = faCloudMoon;

  @Output() complete: EventEmitter<boolean> = new EventEmitter();


  public get sleepCyclePosition(): SleepCyclePosition { return this.sleepService.sleepManager.position; }

  private _currentTime: moment.Moment;
  public get currentTime(): string { return this._currentTime.format('h:mm'); }
  public get currentTimeSS(): string { return this._currentTime.format(':ss'); }
  public get currentTimeAMPM(): string { return this._currentTime.format('a'); }
  public get currentDate(): string { return this._currentTime.format('dddd, MMM Do, YYYY'); }

  private _screenSize: AppScreenSizeLabel;

  public get isNearBedtime(): boolean { return this.sleepCyclePosition === SleepCyclePosition.BEFORE_BEDTIME; }
  public get isAfterBedtime(): boolean { return this.sleepCyclePosition === SleepCyclePosition.AFTER_BEDTIME; }
  public get isSleepTime(): boolean { return this.sleepCyclePosition === SleepCyclePosition.SLEEP; }
  public get isEarlyWakeup(): boolean { return this.sleepCyclePosition === SleepCyclePosition.EARLY_WAKEUP; }
  public get newDataRequired(): boolean { return this.sleepService.sleepManager.dataUpdateRequired; }

  public get screenSize(): AppScreenSizeLabel { return this._screenSize; }
  public get isMobile(): boolean { return this.screenSize === AppScreenSizeLabel.MOBILE; }
  public get isTablet(): boolean { return this.screenSize === AppScreenSizeLabel.TABLET; }
  // public get rootNgClass(): any {
  //   return {
  //     'root-mobile': this.isMobile,
  //     'root-tablet': this.isTablet,
  //     'root-large': (!this.isMobile && !this.isTablet),
  //   };
  // }


  /**
   * app lifecycle of this component:
   *
   * AppComponent initiates the UserActionPromptService, which initiates the SleepManagerService,
   * and then checks to see if UserActionPromptService has any required user inputs.
   * If the SleepManagerService needs data, this will create a prompt in UserActionPromptService, 
   * which will cause AppComponent to load this component.
   */
  ngOnInit(): void {
    this._startClock();
    this._screenSize = this.screenService.appScreenSize.label;
    this.screenService.appScreenSize$.subscribe((size) => {
      this._screenSize = size.label;
    });

    // this.sleepService.formComplete$.subscribe((complete)=>{
    //   if(complete === true){
    //     this.complete.emit(true);
    //   }else{
    //     console.log("Error: unable to finish the sleep data form");
    //   }
    // });
  }

  public onClickContinue() {
    this.complete.emit(true);
  }

  private _startClock() {
    this._currentTime = moment();
    const endOfSecond = moment(this._currentTime).endOf('second');
    const msDiff = moment(endOfSecond).diff(this._currentTime, 'milliseconds');
    timer(msDiff, 1000).subscribe((tick) => {
      this._currentTime = moment();
    });
  }





}
