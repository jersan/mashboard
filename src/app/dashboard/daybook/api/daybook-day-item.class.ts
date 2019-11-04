
import { DaybookDayItemHttpShape } from "./daybook-day-item-http-shape.interface";
import { DaybookTimelogEntryDataItem } from "./data-items/daybook-timelog-entry-data-item.interface";
import { DaybookActivityDataItem } from "./data-items/daybook-activity-data-item.interface";
import { DailyTaskListDataItem } from "./data-items/daily-task-list-data-item.interface";
import { Subject, Observable, scheduled, timer, Subscription } from "rxjs";
import { DayStructureDataItem } from "./data-items/day-structure-data-item.interface";
import * as moment from 'moment';
import { DayStructureSleepCycleDataItem } from "./data-items/day-structure-sleep-cycle-data-item.interface";
import { DaybookDayItemSleepProfileData } from "./data-items/daybook-day-item-sleep-profile-data.interface";
import { ActivityCategoryDefinition } from "../../activities/api/activity-category-definition.class";
import { ActivityTree } from "../../activities/api/activity-tree.class";
import { DaybookDayItemScheduledActivity, DaybookDayItemScheduledActivityItem } from "./data-items/daybook-day-item-scheduled-activity.class";
import { DaybookDayItemTimelog } from "./controllers/daybook-day-item-timelog.class";
import blankDaybookItemHttpShape from "./data-items/blank-http-shape";
import { DaybookSleepProfile } from "./controllers/daybook-sleep-profile.class";
// import { DaybookTimeReferencer } from "./daybook-time-referencer.class";


export class DaybookDayItem {

    constructor(dateYYYYMMDD: string) {
        // console.log("Do we even need sleep Cycle data items, or do we just use the sleep profile, or... ? What is the difference?")
        // console.log("CONSTRUCTING DAYBOOK ITEM: " + dateYYYYMMDD)
        let shape: DaybookDayItemHttpShape = blankDaybookItemHttpShape;
        shape.dateYYYYMMDD = dateYYYYMMDD;
        this.setHttpShape(shape);
    }
    public setHttpShape(shape: DaybookDayItemHttpShape) {
        this._httpShape = shape;
        this._rebuild();
    }
    private _rebuild() {
        this._timelog = new DaybookDayItemTimelog(this.httpShape);
        this._sleepProfile = new DaybookSleepProfile(this.httpShape.sleepProfile, this.dateYYYYMMDD);
        this._updateDataChangedSubscriptions();
    }
    private _dataChangedSubscriptions: Subscription[] = [];
    private _updateDataChangedSubscriptions() {
        this._dataChangedSubscriptions.forEach((sub) => { sub.unsubscribe(); });
        this._dataChangedSubscriptions = [];
        this._dataChangedSubscriptions.push(this._timelog.timelogUpdated$.subscribe((timelogDataEntries: DaybookTimelogEntryDataItem[]) => {
            this._httpShape.daybookTimelogEntryDataItems = timelogDataEntries;
            this.dataChanged();
        }));
        this._dataChangedSubscriptions.push(this._sleepProfile.sleepProfileUpdated$.subscribe((sleepProfileData: DaybookDayItemSleepProfileData) => {
            this._httpShape.sleepProfile = sleepProfileData;
            this.dataChanged();
        }));
    }

    private _httpShape: DaybookDayItemHttpShape;
    private _timelog: DaybookDayItemTimelog;
    private _sleepProfile: DaybookSleepProfile;
    private _previousDay: DaybookDayItem;
    private _followingDay: DaybookDayItem;

    public set previousDay(previousDay: DaybookDayItem) { this._previousDay = previousDay; }
    public set followingDay(followingDay: DaybookDayItem) { this._followingDay = followingDay; }
    public set id(id: string) { this._httpShape._id = id; }
    public set userId(userId: string) { this._httpShape.userId = userId; }

    public get httpShape(): DaybookDayItemHttpShape { return this._httpShape; }
    public get timelog(): DaybookDayItemTimelog { return this._timelog; };
    public get sleepProfile(): DaybookSleepProfile { return this._sleepProfile; }
    public get previousDay(): DaybookDayItem { return this._previousDay; }
    public get followingDay(): DaybookDayItem { return this._followingDay; }
    
    public get id(): string { return this.httpShape._id; }
    public get userId(): string { return this.httpShape.userId; }
    public get dateYYYYMMDD(): string { return this.httpShape.dateYYYYMMDD; }
    public get timeDelineators(): string[] { return this.httpShape.timeDelineators; }
    public get dayTemplateId(): string { return this.httpShape.dayTemplateId; }
    public get scheduledEventIds(): string[] { return this.httpShape.scheduledEventIds; }
    public get notebookEntryIds(): string[] { return this.httpShape.notebookEntryIds; }
    public get taskItemIds(): string[] { return this.httpShape.taskItemIds; }


    public set timeDelineators(timeDelineators: string[]) {
        // console.log("setting Time delineators ")
        this._httpShape.timeDelineators = timeDelineators;
        this.dataChanged();
    }
    public addTimeDelineator(delineatorTimeISO: string) {
        let timeDelineators = this.timeDelineators;
        if (timeDelineators.indexOf(delineatorTimeISO) == -1) {
            timeDelineators.push(delineatorTimeISO);
            this.timeDelineators = timeDelineators;
        }
    }
    public removeTimeDelineator(delineator: string) {
        let timeDelineators = this.timeDelineators;
        if (timeDelineators.indexOf(delineator) > -1) {
            timeDelineators.splice(timeDelineators.indexOf(delineator), 1);
            this.timeDelineators = timeDelineators;
        }
    }
    // public get daybookActivityDataItems(): DaybookActivityDataItem[] { return this.httpShape.daybookActivityDataItems; }
    // // private updateActivityDataItems() {
    // //     console.log("Not implemented: Updating Activity Data Items");
    // //     let activityDataItems: DaybookActivityDataItem[] = [];
    // //     this._httpShape.daybookActivityDataItems = activityDataItems;
    // // }

    public get dayStructureDataItems(): DayStructureDataItem[] { return this.httpShape.dayStructureDataItems; }
    public set dayStructureDataItems(dayStructureDataItems: DayStructureDataItem[]) {
        this._httpShape.dayStructureDataItems = dayStructureDataItems;
        this.dataChanged();
    }

    public get sleepStructureDataItems(): DayStructureSleepCycleDataItem[] { return this.httpShape.sleepCycleDataItems; }
    public set sleepStructureDataItems(sleepCycleItems: DayStructureSleepCycleDataItem[]) {
        this._httpShape.sleepCycleDataItems = sleepCycleItems;
        this.dataChanged();
    }





    public get dailyWeightLogEntryKg(): number { return this.httpShape.dailyWeightLogEntryKg; }
    public set dailyWeightLogEntryKg(kg: number) {
        this._httpShape.dailyWeightLogEntryKg = kg;
        this.dataChanged();
    }

    public get dailyTaskListDataItems(): DailyTaskListDataItem[] { return this.httpShape.dailyTaskListDataItems; }






    public set taskItemIds(taskItemIds: string[]) {
        this._httpShape.taskItemIds = taskItemIds;
        this.dataChanged();
    }
    public set dailyTaskListDataItems(dailyTaskListDataItems: DailyTaskListDataItem[]) {
        this._httpShape.dailyTaskListDataItems = dailyTaskListDataItems;
        this.dataChanged();
    }
    public set dayTemplateId(dayTemplateId: string) {
        this._httpShape.dayTemplateId = dayTemplateId;
        this.dataChanged();
    }
    public set scheduledEventIds(scheduledEventIds: string[]) {
        this._httpShape.scheduledEventIds = scheduledEventIds;
        this.dataChanged();
    }
    public set notebookEntryIds(notebookEntryIds: string[]) {
        this._httpShape.notebookEntryIds = notebookEntryIds
        this.dataChanged();
    }












    private dataChanged() {
        // console.log(this.dateYYYYMMDD + " DaybookDayItem dataChanged().")
        this._dataChanged$.next(true);
    }
    private _dataChanged$: Subject<boolean> = new Subject();
    public get dataChanged$(): Observable<boolean> {
        return this._dataChanged$.asObservable();
    }


    public getMostRecentActionTime(currentTime?: moment.Moment): moment.Moment {
        let lastActionTime: moment.Moment = moment(this.dateYYYYMMDD).startOf("day");
        // const endOfDay: moment.Moment = moment(lastActionTime).add(1, "day");

        // if (this.timelog.timelogEntryItems.length > 0) {
        //     let lastEndTime: moment.Moment = this.timelog.lastTimelogEntryItemTime;
        //     if (moment(lastEndTime).isAfter(lastActionTime)) {
        //         lastActionTime = moment(lastEndTime);
        //     }
        // }

        // let previousFallAsleepTimeIsBeforeCurrentTime: boolean = true;
        // let wakeupTimeIsBeforeCurrentTime: boolean = true;
        // let bedTimeIsBeforeCurrentTime: boolean = true;
        // let fallAsleepTimeIsBeforeCurrentTime: boolean = true;
        // if(currentTime){
        //     previousFallAsleepTimeIsBeforeCurrentTime = this.previousFallAsleepTime.isBefore(currentTime);
        //     wakeupTimeIsBeforeCurrentTime = this.wakeupTime.isBefore(currentTime);
        //     bedTimeIsBeforeCurrentTime = this.bedtime.isBefore(currentTime);
        //     fallAsleepTimeIsBeforeCurrentTime = this.fallAsleepTime.isBefore(currentTime);
        // }

        // if (this.previousFallAsleepTime.isAfter(lastActionTime) && previousFallAsleepTimeIsBeforeCurrentTime)
        //     lastActionTime = moment(this.previousFallAsleepTime);
        // if (this.wakeupTime.isAfter(lastActionTime) && wakeupTimeIsBeforeCurrentTime)
        //     lastActionTime = moment(this.wakeupTime);
        // if (this.bedtime.isAfter(lastActionTime) && bedTimeIsBeforeCurrentTime)
        //     lastActionTime = moment(this.bedtime);
        // if (this.fallAsleepTime.isAfter(lastActionTime) && fallAsleepTimeIsBeforeCurrentTime)
        //     lastActionTime = moment(this.fallAsleepTime);


        // if(lastActionTime.isAfter(endOfDay)){
        //     lastActionTime = moment(endOfDay);
        // }
        // console.log("last action time is : " + lastActionTime.format("hh:mm a"))
        console.log("Method disabled.  returning START OF DAY.  may cause issues.")
        return lastActionTime;
    }







    // public get scheduledRoutines(): ActivityCategoryDefinition[] {
    //     // return this._scheduledActivities.filter((scheduledActivity)=>{
    //     //     return scheduledActivity.isRoutine;
    //     // });
    //     // console.log("Warning: method disabled.");
    //     return [];
    // }


    private _scheduledActivities: DaybookDayItemScheduledActivity[] = [];
    public buildScheduledActivities(activityTree: ActivityTree) {
        this._scheduledActivities = this.scheduledActivityItems.map((activityItem: DaybookDayItemScheduledActivityItem) => {
            let activityDefinition: ActivityCategoryDefinition = activityTree.findActivityByTreeId(activityItem.activityTreeId);
            if (activityDefinition) {
                return this.buildScheduledActivity(activityItem, activityDefinition, activityTree);
            } else {
                // console.log("Could not find activity by tree id ", activityItem.activityTreeId)
            }
        });
        // console.log("this.scheduledActrivities", this._scheduledActivities);
    }
    private buildScheduledActivity(activityItem: DaybookDayItemScheduledActivityItem, activityDefinition: ActivityCategoryDefinition, activityTree: ActivityTree): DaybookDayItemScheduledActivity {
        let newScheduledActivity = new DaybookDayItemScheduledActivity(activityItem, activityDefinition);
        if (activityItem.routineMemberActivities.length > 0) {
            newScheduledActivity.setRoutineMembers(activityTree);
        }
        return newScheduledActivity;
    }
    public get scheduledActivities(): DaybookDayItemScheduledActivity[] {
        return this._scheduledActivities;
    }
    public get scheduledActivityItems(): DaybookDayItemScheduledActivityItem[] {
        return this.httpShape.scheduledActivityItems;
    }
    public setScheduledActivityItems(items: DaybookDayItemScheduledActivityItem[], activityTree: ActivityTree) {
        this._httpShape.scheduledActivityItems = items;
        this.buildScheduledActivities(activityTree);
        this.dataChanged();
    }
    public updateScheduledActivityItems(updateScheduledActivityItems: DaybookDayItemScheduledActivityItem[]) {
        this._httpShape.scheduledActivityItems.forEach((storedItem) => {
            updateScheduledActivityItems.forEach((updateItem) => {
                if (storedItem.activityTreeId == updateItem.activityTreeId) {
                    storedItem = updateItem;
                }
            });
        });
        this.dataChanged();
    }

}