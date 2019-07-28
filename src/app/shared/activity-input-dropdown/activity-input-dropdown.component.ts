import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { faCaretDown, faCaretRight, faSitemap, faSearch } from '@fortawesome/free-solid-svg-icons';

import { Subscription, Observable, fromEvent } from 'rxjs';
import { ActivityDropdownListItem } from './activity-dropdown-list-item.interface';
import { ActivityTree } from '../document-definitions/activity-category-definition/activity-tree.class';
import { ActivityCategoryDefinition } from '../document-definitions/activity-category-definition/activity-category-definition.class';
import { ActivityCategoryDefinitionService } from '../document-definitions/activity-category-definition/activity-category-definition.service';

@Component({
  selector: 'app-activity-input-dropdown',
  templateUrl: './activity-input-dropdown.component.html',
  styleUrls: ['./activity-input-dropdown.component.css']
})
export class ActivityInputDropdownComponent implements OnInit {


  faSitemap = faSitemap;
  faSearch = faSearch;

  searchAction: string = "search";
  onChangeAction(newAction: string){
    this.searchAction = newAction;
  }

  onActivitySelected(activity: ActivityCategoryDefinition){
    this.valueChanged.emit(activity);
  }





  faCaretDown = faCaretDown;
  faCaretRight = faCaretRight;


  activitiesDropDownList: ActivityDropdownListItem[] = [];
  activitiesSearchList: ActivityDropdownListItem[] = [];
  private dropdownListTree: ActivityDropdownListItem[] = [];
  activityTextInputValue: string = "";

  private activitiesTree: ActivityTree = null;
  private selectedActivity: ActivityCategoryDefinition = null;

  private dropdownMenuSubscription: Subscription = new Subscription();


  @Output() valueChanged: EventEmitter<ActivityCategoryDefinition> = new EventEmitter<ActivityCategoryDefinition>();
  @Input('initialValue') set initialValue(providedParent: ActivityCategoryDefinition)  {
    if(providedParent != null){
      this.activityTextInputValue = providedParent.name;
    }
    
  }; 

  constructor(private activityCategoryDefinitionService: ActivityCategoryDefinitionService) { }

  ngOnInit() {
    this.activitiesTree = this.activityCategoryDefinitionService.activitiesTree;
    this.buildDropdownListTree();
  }

  private buildDropdownListTree() {
    function buildChildDropdownItems(parent: ActivityCategoryDefinition, generationNumber: number): ActivityDropdownListItem {
      if (parent.children.length > 0) {
        let children: ActivityDropdownListItem[] = [];
        for (let child of parent.children) {
          children.push(buildChildDropdownItems(child, generationNumber + 1));
        }
        return { activity: parent, isExpanded: false, generationNumber: generationNumber, children: children };
      } else {
        return { activity: parent, isExpanded: false, generationNumber: generationNumber, children: [] };
      }
    }

    let listItems: ActivityDropdownListItem[] = []
    for (let activity of this.activitiesTree.rootActivities) {
      if (activity.children.length == 0) {
        listItems.push({ activity: activity, isExpanded: false, generationNumber: 0, children: [] })
      } else {
        let children: ActivityDropdownListItem[] = [];
        for (let child of activity.children) {
          children.push(buildChildDropdownItems(child, 1));
        }
        listItems.push({ activity: activity, isExpanded: false, generationNumber: 0, children: children })
      }
    }
    this.dropdownListTree = listItems;
  }



  onActivityInputKeyUp($event) {
    let searchValue: string = $event.target.value;
    this.activityTextInputValue = searchValue;
    if (searchValue.length > 0) {
      if(!this.searchForActivities(searchValue)){
        console.log("There are no search results");
      }
    } else {
      this.activitiesSearchList = [];
    }

  }

  onClickActivityDropdownArrow() {
    this.dropdownMenuSubscription.unsubscribe();
    console.log("click");
    if (this.activitiesDropDownList.length > 0) {
      console.log("its greater than 0")
      //if it's already open (has more than 0 items), clear it.
      this.activitiesDropDownList = [];
      this.activitiesSearchList = [];
    } else {
      console.log("we building")
      // if (this.activityTextInputValue.length > 0) {
        // this.searchForActivities(this.activityTextInputValue);
      // } else {
        this.activitiesSearchList = [];
        this.activitiesDropDownList = [];
        this.viewTreeList();
      // }
    }
  }

  onClickActivityDropdownItem(listItem: ActivityDropdownListItem) {

    this.activityTextInputValue = listItem.activity.name;
    this.selectedActivity = listItem.activity;
    this.activitiesDropDownList = [];
    this.activitiesSearchList = [];
    this.onValueChanged(this.selectedActivity);
  }

  onClickActivityDropdownItemArrow(listItem: ActivityDropdownListItem) {
    if (listItem.isExpanded) {
      listItem.isExpanded = false;
    } else {
      listItem.isExpanded = true;
    }
    this.viewTreeList();
  }



  private viewTreeList() {
    function getChildListItems(listItem: ActivityDropdownListItem): ActivityDropdownListItem[] {
      let children: ActivityDropdownListItem[] = [];
      if (listItem.isExpanded && listItem.children.length > 0) {
        for (let child of listItem.children) {
          children.push(child);
          children.push(...getChildListItems(child));
        }
      }
      return children;
    }


    // if (this.activitiesDropDownList.length > 0) {
    //   let updatedDropdownList: ActivityDropdownListItem[] = [];
    //   for (let listItem of this.activitiesDropDownList) {
    //     updatedDropdownList.push(listItem);
    //     updatedDropdownList.push(...getChildListItems(listItem))
    //   }
    //   this.activitiesDropDownList = Object.assign([], updatedDropdownList);
    // } else {
      let updatedDropdownList: ActivityDropdownListItem[] = [];
      for (let listItem of this.dropdownListTree) {
        updatedDropdownList.push(listItem);
        updatedDropdownList.push(...getChildListItems(listItem))
      }
      this.activitiesDropDownList = Object.assign([], updatedDropdownList);
    // }

  }





  private onValueChanged(activity: ActivityCategoryDefinition) {
    this.valueChanged.emit(activity);
    this.activityTextInputValue = "";
    
  }

  private searchForActivities(searchValue: string): boolean {
    let searchResults: ActivityDropdownListItem[] = [];
    let activitiesArray: ActivityCategoryDefinition[] = Object.assign([], this.activitiesTree.allActivities);
    for (let activity of activitiesArray) {
      if (activity.name.toLowerCase().indexOf(searchValue.toLowerCase()) > -1) {
        let listItem: ActivityDropdownListItem = { activity: activity, isExpanded: false, generationNumber: 0, children: [] }
        searchResults.push(listItem);
      }
    }
    searchResults.sort((a, b)=>{
      if(a.activity.name > b.activity.name){
        return 1;
      }
      if(a.activity.name < b.activity.name){
        return -1;
      }
      return 0;
    })
    if(searchResults.length > 0){
      this.activitiesSearchList = searchResults;
      return true;
    }else{
      this.activitiesSearchList = [];
      return false;
    }
  }

  onMouseLeaveDropdownList(){
    if(this.activitiesDropDownList.length > 0 || this.activitiesSearchList.length > 0 ){
      this.dropdownMenuSubscription.unsubscribe();
      let documentClickListener: Observable<Event> = fromEvent(document, 'click');
      this.dropdownMenuSubscription = documentClickListener.subscribe((click)=>{  
        this.activitiesDropDownList = [];
        this.activitiesSearchList = [];
      })
    }else{

    }
  }
  onMouseEnterDropdownList(){
    this.dropdownMenuSubscription.unsubscribe();
  }

  activityHasChildren(listItem: ActivityDropdownListItem) {
    if (listItem.activity.children.length > 0) {
      return true;
    }
    return false;
  }

  activityDropdownHeight(array: any[]): string {
    let px = array.length * 30;
    if (px <= 30) {
      return "30px";
    } else if (px >= 200) {
      return "200px";
    } else {
      return "" + px + "px";
    }
  }

  dropdownListItemMarginLeft(listItem: ActivityDropdownListItem): string {
    let px = listItem.generationNumber * 15;
    return "" + px + "px";
  }

}
