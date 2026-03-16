// =============================================
// ADMIN MODELS
// =============================================

// ---------- Creators ----------

export interface AdminCreatorDto {
  id: number;
  username: string;
  email: string;
}

// ---------- Surveys ----------

export interface AdminSurveyDto {
  id: number;
  title: string;
  isActive: boolean;
  creator: string;
}
