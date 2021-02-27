import { Injectable } from '@angular/core';
import { NotebookEntry } from './notebook-entry/notebook-entry.class';  
import { Subject, Observable, BehaviorSubject, Subscription } from 'rxjs';
import * as moment from 'moment';
import { NoteQuery } from './notes-query-bar/note-query.class';
import { TimeViewsManager } from '../../shared/time-views/time-views-manager.class';

@Injectable({
  providedIn: 'root'
})
export class NoteQueryService{

  constructor() { }


  private _timeViewsManager: TimeViewsManager;
  private _currentNotes$: BehaviorSubject<NotebookEntry[]> = new BehaviorSubject([]);
  private _query: NoteQuery;
  private _tagsDisplay: string = "";

  public get currentNotes(): NotebookEntry[] { return this._currentNotes$.getValue(); }
  public get currentNotes$(): Observable<NotebookEntry[]> { return this._currentNotes$.asObservable(); }
  public get timeViewsManager(): TimeViewsManager { return this._timeViewsManager; }
  public get query(): NoteQuery { return this._query; }
  public get tagsDisplay(): string { return this._tagsDisplay; }

  private _allNotes: NotebookEntry[] = [];

  private _subscription: Subscription = new Subscription();

  public reInitiate(notes: NotebookEntry[]){ 
    this._allNotes = notes;
    console.log("TIME VIEWS MANAGER START...")
    this._timeViewsManager = new TimeViewsManager();
    this._timeViewsManager.setNotebooksView(this._allNotes)
    console.log("time views manager is DONE")
    this.setQuery(new NoteQuery());
    this._subscription.unsubscribe();
    this._subscription = this._timeViewsManager.queryChanged$().subscribe((queryDatesChanged)=>{
      this.setQuery(new NoteQuery(queryDatesChanged.startDateYYYYMMDD, queryDatesChanged.endDateYYYYMMDD));
    });
  }

  public setQuery(query: NoteQuery){
    this._query = query;
    let filteredNotes = this._allNotes.filter(note => {
      const isInRange = note.journalDate.isSameOrAfter(moment(query.rangeStartYYYYMMDD).startOf('day')) 
        && note.journalDate.isSameOrBefore(moment(query.rangeEndYYYYMMDD).endOf('day'));      
      let tagsMatch: boolean = true;
      if(query.tags.length > 0){
        tagsMatch = note.tagsMatch(query.tags);
      }
      return isInRange && tagsMatch;
    });
    if(query.tags.length > 0){
      let tags = "";
      for(let i=0; i<query.tags.length; i++){
        tags += "" + query.tags[i].tagValue;
        if(i < query.tags.length-1){
          tags += ", ";
        }
      }
      this._tagsDisplay = tags;
    }else{
      this._tagsDisplay = "all tags"
    }
    console.log("Query is set")
    this._currentNotes$.next(filteredNotes);
  }



  
  public deleteNote(deleteNote: NotebookEntry){
    const foundIndex = this.currentNotes.findIndex(currentNote => currentNote.id === deleteNote.id);
    if(foundIndex >= 0){
      const currentNotes = this.currentNotes;
      currentNotes.splice(foundIndex, 1);
      this._currentNotes$.next(currentNotes);
    }
  }
  

  
}