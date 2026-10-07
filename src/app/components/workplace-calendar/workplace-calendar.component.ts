import { Component } from '@angular/core';
import { CalendarOptions, EventInput,DatesSetArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { FullCalendarModule } from '@fullcalendar/angular';
import { HqmsService } from '../../services/hqms.service';
import { DatePipe } from '@angular/common';
@Component({
    selector: 'app-workplace-calendar',
    imports: [FullCalendarModule],
    templateUrl: './workplace-calendar.component.html',
    styleUrl: './workplace-calendar.component.scss'
})
export class WorkplaceCalendarComponent {
  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    dayMaxEvents : true,
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
    headerToolbar: {
      left: 'prev,next,today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
    },
    editable: true,
    droppable: true,
    selectable: true,
    events: [],
    noEventsContent : 'No workplace meetings scheduled for this period',
    eventClick: this.handleEventClick.bind(this),
    dateClick: this.handleDateClick.bind(this),
    eventDrop: this.handleEventDrop.bind(this),
    eventResize: this.handleEventResize.bind(this),
    datesSet : async (infos:DatesSetArg) => {
      await this.getInitialEvents(infos)
    }
  };
  constructor( public _hqms: HqmsService,public _datePipe: DatePipe){};

 async  getInitialEvents(infos)  {
   this.calendarOptions['events'] = [];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    let param =   {
        "from_dt": this._datePipe.transform( new Date(infos.startStr)  , 'dd-MMM-yyyy'),
        "to_dt":   this._datePipe.transform( new Date(infos.endStr) , 'dd-MMM-yyyy'),
    }
    let info: any = await this._hqms.customGetApiCall('GET', 'fnMyWorkspaceCalendarApi', param);
    if (info.status == 200) {
       this.calendarOptions['events'] = info.data.map((ele) => ({
          title : ele.calendar_msg,
          start : new Date(ele.start_dt),
          end : new Date(ele.end_dt)
         })  )
    }
  }

  handleEventClick(arg: any): void {
    // console.log('Event clicked:', arg.event.title);
  }

  handleDateClick(arg: any): void {
    // console.log('Date clicked:', arg.dateStr);
  }

  handleEventDrop(arg: any): void {
    // console.log('Event dropped:', arg.event.title, 'to', arg.event.start);
  }

  handleEventResize(arg: any): void {
    // console.log('Event resized:', arg.event.title);
  }
}
