import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../Services/admin.service';
import { AdminCreatorDto, AdminSurveyDto } from '../models/admin.models';
import { TokenService } from '../Services/token.service';

type ActiveTab = 'creators' | 'surveys';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboard {

  private adminService = inject(AdminService);
  private tokenService = inject(TokenService);

  activeTab = signal<ActiveTab>('creators');

  // ── Creators ─────────────────────────────────────
  creators = signal<AdminCreatorDto[]>([]);
  creatorsLoading = signal(true);
  creatorsError = signal('');

  // ── Surveys ───────────────────────────────────────
  surveys = signal<AdminSurveyDto[]>([]);
  surveysLoading = signal(true);
  surveysError = signal('');

  // ── Delete ────────────────────────────────────────
  showDeleteModal = signal(false);
  deleteTarget = signal<{ type: 'creator' | 'survey'; id: number; name: string } | null>(null);
  isDeleting = signal(false);
  deleteError = signal('');

  // ── Admin info ────────────────────────────────────
  adminUsername = signal<string | null>(null);

  constructor() {
    this.adminUsername.set(this.tokenService.getUsername());
    this.loadCreators();
    this.loadSurveys();
  }

  // ── Load ──────────────────────────────────────────

  loadCreators() {
    this.creatorsLoading.set(true);
    this.creatorsError.set('');
    this.adminService.getAllCreators().subscribe({
      next: (data) => {
        this.creators.set(data);
        this.creatorsLoading.set(false);
      },
      error: () => {
        this.creatorsError.set('Failed to load creators.');
        this.creatorsLoading.set(false);
      }
    });
  }

  loadSurveys() {
    this.surveysLoading.set(true);
    this.surveysError.set('');
    this.adminService.getAllSurveys().subscribe({
      next: (data) => {
        this.surveys.set(data);
        this.surveysLoading.set(false);
      },
      error: () => {
        this.surveysError.set('Failed to load surveys.');
        this.surveysLoading.set(false);
      }
    });
  }

  // ── Tabs ──────────────────────────────────────────

  setTab(tab: ActiveTab) {
    this.activeTab.set(tab);
  }

  // ── Stats ─────────────────────────────────────────

  get totalCreators(): number { return this.creators().length; }
  get totalSurveys(): number  { return this.surveys().length; }
  get activeSurveys(): number { return this.surveys().filter(s => s.isActive).length; }

  // ── Delete Modal ──────────────────────────────────

  openDeleteModal(type: 'creator' | 'survey', id: number, name: string) {
    this.deleteTarget.set({ type, id, name });
    this.deleteError.set('');
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.deleteTarget.set(null);
    this.deleteError.set('');
  }

  confirmDelete() {
    const target = this.deleteTarget();
    if (!target) return;

    this.isDeleting.set(true);
    this.deleteError.set('');

    const request = target.type === 'creator'
      ? this.adminService.deleteCreator(target.id)
      : this.adminService.deleteSurvey(target.id);

    request.subscribe({
      next: () => {
        if (target.type === 'creator') {
          this.creators.update(list => list.filter(c => c.id !== target.id));
        } else {
          this.surveys.update(list => list.filter(s => s.id !== target.id));
        }
        this.isDeleting.set(false);
        this.closeDeleteModal();
      },
      error: () => {
        this.deleteError.set('Delete failed. Please try again.');
        this.isDeleting.set(false);
      }
    });
  }

  // ── Search ────────────────────────────────────────
  creatorSearch = '';
  surveySearch = '';

  get filteredCreators(): AdminCreatorDto[] {
    const q = this.creatorSearch.toLowerCase().trim();
    if (!q) return this.creators();
    return this.creators().filter(c =>
      c.username.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  }

  get filteredSurveys(): AdminSurveyDto[] {
    const q = this.surveySearch.toLowerCase().trim();
    if (!q) return this.surveys();
    return this.surveys().filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.creator.toLowerCase().includes(q)
    );
  }
}
