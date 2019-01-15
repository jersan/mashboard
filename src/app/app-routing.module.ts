import { Routes, RouterModule } from "@angular/router";
import { NgModule } from "@angular/core";
import { HomeComponent } from "./dashboard/home/home.component";
import { IvyleeCreationComponent } from "./dashboard/productivity/ivylee/ivylee-creation/ivylee-creation.component";
import { IvyleeManageComponent } from "./dashboard/productivity/ivylee/ivylee-manage/ivylee-manage.component";
import { BodyWeightComponent } from "./dashboard/health/body-weight/body-weight.component";
import { BuildProfileComponent } from "./dashboard/health/build-profile/build-profile.component";
import { NetWorthComponent } from "./dashboard/finance/net-worth/net-worth.component";
import { TimelogComponent } from "./dashboard/timelog/timelog.component";
import { ActivitiesComponent } from "./dashboard/activities/activities.component";
import { DaybookComponent } from "./dashboard/daybook/daybook.component";

const appRoutes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'home', component: HomeComponent },
    { path: 'ivyleeCreation', component: IvyleeCreationComponent },
    { path: 'ivyleeManagement', component: IvyleeManageComponent },
    { path: 'bodyWeight', component: BodyWeightComponent },
    { path: 'healthProfile', component: BuildProfileComponent },
    { path: 'networth', component: NetWorthComponent },
    { path: 'daybook', component: DaybookComponent },
    { path: 'timelog', component: TimelogComponent },
    { path: 'timelog-activities', component: ActivitiesComponent }
];


@NgModule({
    imports: [
        RouterModule.forRoot(appRoutes),
    ],
    exports: [
        RouterModule
    ]
})

export class AppRoutingModule { }