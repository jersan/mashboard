import { GenericDataEntry } from '../models/generic-data-entry.model';
import { User } from '../models/user.model';
import { GenericDataEntryService } from './generic-data-entry.service';
import { Subject, Observable } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable()
export class HomeService {

  timeViewSubject: Subject<string> = new Subject<string>();
  private timeView: string = 'month';
  
  userGenericDataEntries: GenericDataEntry[];
  // userGenericDataEntriesSubject: Subject<GenericDataEntry[]> = new Subject<GenericDataEntry[]>();
  

  constructor(private genericDataEntryService: GenericDataEntryService) { }
  
  setView(selectedView: string){
    this.timeView = selectedView;
    this.timeViewSubject.next(this.timeView);
  }

  getView(): string{
    return this.timeView;
  }

  // getGenericDataObjects(authenticatedUser: User): Subject<GenericDataEntry[]>{
    
  //   this.genericDataEntryService.getDataObjectsByUser(authenticatedUser);
  //   return this.genericDataEntryService.userGenericDataEntriesSubject;
  // }
  

}
