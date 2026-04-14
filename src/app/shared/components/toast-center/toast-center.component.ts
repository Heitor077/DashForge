import { Component, inject } from '@angular/core';

import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast-center',
  standalone: true,
  templateUrl: './toast-center.component.html',
  styleUrl: './toast-center.component.css'
})
export class ToastCenterComponent {
  readonly notificationService = inject(NotificationService);
  readonly notifications = this.notificationService.notifications;
}
