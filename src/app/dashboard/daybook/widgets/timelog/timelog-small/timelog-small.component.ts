import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { DaybookDayItem } from '../../../api/daybook-day-item.class';
import { DaybookSmallWidget } from '../../daybook-small-widget.interface';
import { faExpand } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-timelog-small',
  templateUrl: './timelog-small.component.html',
  styleUrls: ['./timelog-small.component.css']
})
export class TimelogSmallComponent implements OnInit, DaybookSmallWidget {

  constructor() { }


  @Input() activeDay: DaybookDayItem;


  ngOnInit() {
  }


}