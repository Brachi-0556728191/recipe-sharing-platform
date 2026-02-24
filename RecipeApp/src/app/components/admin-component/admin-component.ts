import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ProfileService } from '../../services/profile-service';
import { User } from '../../models/User';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-admin-component',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './admin-component.html',
  styleUrl: './admin-component.css',
})
export class AdminComponent implements OnInit, OnDestroy {

  pendingUsers: User[] = [];
  expandedUserId: number | null = null;
  errorMessage: string = '';

  private destroy$ = new Subject<void>(); // לניקוי מנויים


  constructor(
    private profileService: ProfileService,
    private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.fetchPendingUsers();
  }

  ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}


  // קבלת משתמשים ממתינים לאישור
  fetchPendingUsers() {
    this.profileService.getPendingContentRequests()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users: User[]) => {
          console.log(users);
          this.pendingUsers = users,
            this.cdr.detectChanges()
        },
        error: (err) => {
          console.error('Error fetching pending users', err);
          this.errorMessage = 'Error loading pending users.';
        }
      });
  }

  // פתיחה וסגירה של פרטי המשתמש
  toggleExpand(userId: number) {
    this.expandedUserId = this.expandedUserId === userId ? null : userId;
  }

  // אישור משתמש
  approveUser(userId: number) {
    this.profileService.approveContentUser(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.pendingUsers = this.pendingUsers.filter(u => u.id !== userId);
          this.cdr.detectChanges()

        },
        error: (err) => {
          console.error('Error approving user', err);
          this.errorMessage = 'Error approving user.';
        }
      });
  }

  // דחיית משתמש
  rejectUser(userId: number) {
    this.profileService.rejectContentUser(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.pendingUsers = this.pendingUsers.filter(u => u.id !== userId);
          this.cdr.detectChanges()

        },
        error: (err) => {
          console.error('Error rejecting user', err);
          this.errorMessage = 'Error rejecting user.';
        }
      });
  }
}
