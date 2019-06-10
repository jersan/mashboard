
import * as moment from 'moment';


import { Subject, Observable } from 'rxjs';
import { ActivityCategoryDefinitionService } from '../../document-definitions/activity-category-definition/activity-category-definition.service';

export interface ActivityDayDataItem{
    activityTreeId: string,
    durationMinutes: number,
}

export class ActivityDayData {

    public get httpCreate(): any {
        return {
            userId: this.userId,
            dateYYYYMMDD: this.dateYYYYMMDD,
            activityDataItems: this.activityItems,
        }
    }
    public get httpUpdate(): any {
        return {
            id: this.id,
            userId: this.userId,
            dateYYYYMMDD: this.dateYYYYMMDD,
            activityDataItems: this.activityItems,
        }
    }
    public get httpDelete(): any {
        return {
            id: this.id,
        }
    }



    id: string;
    userId: string;



    private _date: moment.Moment;
    public get date(): moment.Moment {
        return moment(this._date).startOf("day");
    }

    dateYYYYMMDD: string;

    private _activityCategoryDefinitionService: ActivityCategoryDefinitionService;
    constructor(id: string, userId: string, dateYYYYMMDD: string, activityItems: ActivityDayDataItem[], activityCategoryDefinitionService: ActivityCategoryDefinitionService) {
        this.id = id;
        this.userId = userId;
        this._date = moment(dateYYYYMMDD).hour(0).minute(0).second(0).millisecond(0);
        this.dateYYYYMMDD = dateYYYYMMDD;
        this.activityItems = activityItems;

        this._activityCategoryDefinitionService = activityCategoryDefinitionService;
    }


    activityItems: ActivityDayDataItem[] = [];


    
    // private _updateSubject$: Subject<boolean> = new Subject();
    // public get updates$(): Observable<boolean> {
    //     return this._updateSubject$.asObservable();
    // }

    // private update() {
    //     this._updateSubject$.next();
    // }

}