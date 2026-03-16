import { Component, inject, signal } from '@angular/core';
import { DatePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SurveyService } from '../Services/survey.service';
import { CreatorSurveyListDto, UpdateSurveyDto } from '../models/survey.models';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {

  private surveyService = inject(SurveyService);

  surveys = signal<CreatorSurveyListDto[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');

  totalSurveys = signal(0);
  totalResponses = signal(0);
  activeSurveys = signal(0);

  deletingSurveyId = signal<number | null>(null);
  showDeleteModal = signal(false);
  surveyToDelete = signal<CreatorSurveyListDto | null>(null);

  showEditModal = signal(false);
  editingSurvey = signal<CreatorSurveyListDto | null>(null);
  editForm: UpdateSurveyDto = { title: '', description: '' };
  isEditLoading = signal(false);
  editError = signal('');

  togglingId = signal<number | null>(null);
  copiedId = signal<number | null>(null);

  constructor() {
    this.loadSurveys();
  }

  loadSurveys() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.surveyService.getMySurveys().subscribe({
      next: (data) => {
        const sorted = [...data].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.surveys.set(sorted);
        this.totalSurveys.set(data.length);
        this.totalResponses.set(data.reduce((sum, s) => sum + s.totalResponses, 0));
        this.activeSurveys.set(data.filter(s => s.isActive).length);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load surveys. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  toggleStatus(survey: CreatorSurveyListDto) {
    this.togglingId.set(survey.surveyId);
    this.surveyService.toggleSurveyStatus(survey.surveyId).subscribe({
      next: () => {
        this.surveys.update(list =>
          list.map(s => s.surveyId === survey.surveyId ? { ...s, isActive: !s.isActive } : s)
        );
        this.activeSurveys.set(this.surveys().filter(s => s.isActive).length);
        this.togglingId.set(null);
      },
      error: () => this.togglingId.set(null)
    });
  }

  openDeleteModal(survey: CreatorSurveyListDto) {
    this.surveyToDelete.set(survey);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.surveyToDelete.set(null);
  }

  confirmDelete() {
    const survey = this.surveyToDelete();
    if (!survey) return;
    this.deletingSurveyId.set(survey.surveyId);
    this.surveyService.deleteSurvey(survey.surveyId).subscribe({
      next: () => {
        this.surveys.update(list => list.filter(s => s.surveyId !== survey.surveyId));
        this.totalSurveys.update(n => n - 1);
        if (survey.isActive) this.activeSurveys.update(n => n - 1);
        this.totalResponses.update(n => n - survey.totalResponses);
        this.deletingSurveyId.set(null);
        this.closeDeleteModal();
      },
      error: () => {
        this.deletingSurveyId.set(null);
        this.closeDeleteModal();
      }
    });
  }

  openEditModal(survey: CreatorSurveyListDto) {
    this.editingSurvey.set(survey);
    this.editForm = { title: survey.title, description: survey.description };
    this.editError.set('');
    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
    this.editingSurvey.set(null);
    this.editError.set('');
  }

  saveEdit() {
    const survey = this.editingSurvey();
    if (!survey || !this.editForm.title.trim()) return;
    this.isEditLoading.set(true);
    this.editError.set('');
    this.surveyService.updateSurvey(survey.surveyId, this.editForm).subscribe({
      next: () => {
        this.surveys.update(list =>
          list.map(s =>
            s.surveyId === survey.surveyId
              ? { ...s, title: this.editForm.title, description: this.editForm.description }
              : s
          )
        );
        this.isEditLoading.set(false);
        this.closeEditModal();
      },
      error: () => {
        this.editError.set('Failed to update survey. Please try again.');
        this.isEditLoading.set(false);
      }
    });
  }

  copyPublicLink(survey: CreatorSurveyListDto) {
    const link = `http://localhost:4200/survey/${survey.publicIdentifier}`;
    navigator.clipboard.writeText(link).then(() => {
      this.copiedId.set(survey.surveyId);
      setTimeout(() => this.copiedId.set(null), 2000);
    });
  }

}
