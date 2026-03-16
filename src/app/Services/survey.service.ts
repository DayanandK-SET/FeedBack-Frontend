import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  CreateSurveyDto,
  UpdateSurveyDto,
  CreatorSurveyListDto,
  SurveyResponsesDto,
  GetSurveyResponsesRequestDto,
  SurveyAnalyticsDto,
  ResponseTrendDto
} from '../models/survey.models';

@Injectable({
  providedIn: 'root'
})
export class SurveyService {

  private baseUrl = 'http://localhost:5215/api/Survey';

  constructor(private http: HttpClient) {}

  // -----------------------------------------------
  // POST /api/Survey
  // Create a new survey
  // -----------------------------------------------
  createSurvey(dto: CreateSurveyDto) {
    return this.http.post<{ message: string; publicLink: string }>(
      this.baseUrl,
      dto
    );
  }

  // -----------------------------------------------
  // GET /api/Survey/my-surveys
  // Get all surveys for the logged-in creator
  // -----------------------------------------------
  getMySurveys() {
    return this.http.get<CreatorSurveyListDto[]>(
      `${this.baseUrl}/my-surveys`
    );
  }

  // -----------------------------------------------
  // DELETE /api/Survey/{id}
  // Delete a survey
  // -----------------------------------------------
  deleteSurvey(id: number) {
    return this.http.delete<{ message: string }>(
      `${this.baseUrl}/${id}`
    );
  }

  // -----------------------------------------------
  // PATCH /api/Survey/{id}/toggle-status
  // Toggle Active / Inactive
  // -----------------------------------------------
  toggleSurveyStatus(id: number) {
    return this.http.patch<{ message: string }>(
      `${this.baseUrl}/${id}/toggle-status`,
      {}
    );
  }

  // -----------------------------------------------
  // PUT /api/Survey/{id}
  // Update survey title and description
  // -----------------------------------------------
  updateSurvey(id: number, dto: UpdateSurveyDto) {
    return this.http.put<{ message: string }>(
      `${this.baseUrl}/${id}`,
      dto
    );
  }

  // -----------------------------------------------
  // GET /api/Survey/{id}/responses
  // Get paginated responses with optional filters
  // -----------------------------------------------
  getSurveyResponses(id: number, request: GetSurveyResponsesRequestDto) {
    let params = new HttpParams();

    if (request.pageNumber)
      params = params.set('pageNumber', request.pageNumber);

    if (request.pageSize)
      params = params.set('pageSize', request.pageSize);

    if (request.questionType != null)
      params = params.set('questionType', request.questionType);

    if (request.fromDate)
      params = params.set('fromDate', request.fromDate);

    if (request.toDate)
      params = params.set('toDate', request.toDate);

    return this.http.get<SurveyResponsesDto>(
      `${this.baseUrl}/${id}/responses`,
      { params }
    );
  }

  // -----------------------------------------------
  // GET /api/Survey/{id}/analytics
  // Get full analytics for a survey
  // -----------------------------------------------
  getSurveyAnalytics(id: number) {
    return this.http.get<SurveyAnalyticsDto>(
      `${this.baseUrl}/${id}/analytics`
    );
  }

  // -----------------------------------------------
  // GET /api/Survey/{id}/response-trend
  // Get daily response trend data (for chart)
  // -----------------------------------------------
  getResponseTrend(id: number) {
    return this.http.get<ResponseTrendDto[]>(
      `${this.baseUrl}/${id}/response-trend`
    );
  }

  // -----------------------------------------------
  // GET /api/Survey/{surveyId}/export-responses
  // Download Excel file of all responses
  // -----------------------------------------------
  exportResponses(surveyId: number) {
    return this.http.get(
      `${this.baseUrl}/${surveyId}/export-responses`,
      { responseType: 'blob' }   // Important: blob for file download
    );
  }

  // -----------------------------------------------
  // POST /api/Survey/import-excel
  // Import a survey from an uploaded Excel file
  // -----------------------------------------------
  importSurveyFromExcel(title: string, description: string, file: File) {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description ?? '');
    formData.append('file', file);

    return this.http.post<{ message: string; surveyIdentifier: string }>(
      `${this.baseUrl}/import-excel`,
      formData
    );
  }

}
