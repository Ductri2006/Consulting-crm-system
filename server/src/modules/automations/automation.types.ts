export interface ConsultationAutomationRequest {
  id: string;
  organizationId: string;
  fullName: string;
  phone: string;
  email: string | null;
  serviceId: string | null;
  message: string | null;
  createdAt: Date;
  service: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface ConsultationAutomationTaskResult {
  id: string;
  assignedTo: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  deadline: Date;
}
