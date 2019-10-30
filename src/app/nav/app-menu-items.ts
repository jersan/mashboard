import { MenuItem } from "./header/header-menu/menu-item.model";
import { faHome, faSitemap, faCheckCircle, faProjectDiagram, faListOl, faDollarSign, faChartPie, faChartLine, faBriefcaseMedical, faWeight, faCogs, faSignOutAlt, faBookOpen, faCog, faAppleAlt, faTrophy, faBook, faCheck, faListUl, faClipboardCheck, faClipboardList, faCalendar, faUsers } from "@fortawesome/free-solid-svg-icons";
import { faCalendarAlt, faLightbulb, faClock } from "@fortawesome/free-regular-svg-icons";
import { Subscription } from "rxjs";
import { HeaderMenu } from "./header/header-menu/header-menu.model";
import { ToolComponents } from "../tools-menu/tools/tool-components.enum";


let menuItems: MenuItem[] = [];

menuItems.push(new MenuItem('Home', '/home', faHome));

let daybookMenu = new MenuItem('Daybook', '/daybook', faBookOpen);
daybookMenu.sidebarToolComponent = ToolComponents.TimelogEntry;
let daybookMenuItems: MenuItem[] = [new MenuItem('Daily Task List', '/daily-task-list', faListUl)];
daybookMenu.subMenu = new HeaderMenu('Daybook submenu', daybookMenuItems);
menuItems.push(daybookMenu);




menuItems.push(new MenuItem('Social', '/social', faUsers));

let notebookItem: MenuItem = new MenuItem('Notebooks', '/notebooks', faBook);
notebookItem.sidebarToolComponent = ToolComponents.Notepad;
menuItems.push(notebookItem);




let tasksItem: MenuItem = new MenuItem('Tasks', '/tasks', faCheckCircle);
tasksItem.sidebarToolComponent = ToolComponents.ActionItem;
menuItems.push(tasksItem);



let schedulingMenu = new MenuItem('Scheduling', '/scheduling', faCalendar);
schedulingMenu.sidebarToolComponent = ToolComponents.FutureEvent;
let schedulingMenuItems: MenuItem[] = [
    new MenuItem('Schedule Rotations', '/schedule-rotations', faClock),
    new MenuItem('Day Templates', '/day-templates', faClock),
    new MenuItem('Reccurring Tasks', '/recurring-tasks', faClock),
];
schedulingMenu.subMenu = new HeaderMenu('Scheduling submenu', schedulingMenuItems);
menuItems.push(schedulingMenu);



menuItems.push(new MenuItem('Activities', '/activities', faSitemap));


// menuItems.push(new MenuItem('Goals', '/goals', faTrophy));
// menuItems.push(new MenuItem('Meal Planning', '/meal-planning', faAppleAlt));


// let financeMenu = new MenuItem('Finances', '/finances', faDollarSign)
// let financeSubMenuItems: MenuItem[] = [];
// financeSubMenuItems.push(new MenuItem('Budget', '/budget', faChartPie));
// financeSubMenuItems.push(new MenuItem('Net Worth', '/networth', faChartLine));
// financeMenu.subMenu = new HeaderMenu('Finance submenu', financeSubMenuItems);
// menuItems.push(financeMenu);

// let healthMenu = new MenuItem('Health', '/health', faBriefcaseMedical);
// let healthSubMenuItems: MenuItem[] = [];
// healthSubMenuItems.push(new MenuItem('Body Weight', '/body-weight', faWeight))
// healthMenu.subMenu = new HeaderMenu('Health submenu', healthSubMenuItems);
// menuItems.push(healthMenu);

export const appMenuItems: MenuItem[] = menuItems;

