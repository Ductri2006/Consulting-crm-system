import type { TFunction } from 'i18next'

const validationMessageKeys: Record<string, string> = {
  'Address must not exceed 255 characters.': 'validation.addressMax',
  'A file is required.': 'validation.fileRequired',
  'Assigned staff is required.': 'validation.assignedStaffRequired',
  'Avatar URL must not exceed 1000 characters.': 'validation.avatarUrlMax',
  'Customer is required.': 'validation.customerRequired',
  'Date must be a valid calendar date.': 'validation.dateValid',
  'Date must use YYYY-MM-DD format.': 'validation.dateFormat',
  'Deadline must be a valid date and time.': 'validation.deadlineValid',
  'Description must not exceed 5000 characters.': 'validation.descriptionMax',
  'Email must not exceed 254 characters.': 'validation.emailMax',
  'End time must be later than start time.': 'validation.endTimeAfterStart',
  'Enter a valid email address.': 'validation.email',
  'Enter a valid avatar URL.': 'validation.avatarUrl',
  'Enter a valid owner email address.': 'validation.ownerEmail',
  'Enter a valid website URL.': 'validation.websiteUrl',
  'Expiry must be a whole number.': 'validation.expiryWholeNumber',
  'Expiry must be at least 1 day.': 'validation.expiryMin',
  'Expiry must not exceed 30 days.': 'validation.expiryMax',
  'Full name must contain at least 2 characters.': 'validation.fullNameMin',
  'Full name must not exceed 150 characters.': 'validation.fullNameMax',
  'Industry must not exceed 120 characters.': 'validation.industryMax',
  'Owner email must not exceed 254 characters.': 'validation.ownerEmailMax',
  'Owner name must contain at least 2 characters.': 'validation.ownerNameMin',
  'Owner name must not exceed 120 characters.': 'validation.ownerNameMax',
  'Owner phone must not exceed 30 characters.': 'validation.ownerPhoneMax',
  'Note must not exceed 2000 characters.': 'validation.noteMax',
  'Password must contain at least 10 characters.': 'validation.passwordMin10',
  'Password must contain at least 8 characters.': 'validation.passwordMin8',
  'Password must include a lowercase letter.': 'validation.passwordLowercase',
  'Password must include an uppercase letter.': 'validation.passwordUppercase',
  'Password must include a number.': 'validation.passwordNumber',
  'Password must include a special character.': 'validation.passwordSpecial',
  'Password must not exceed 100 characters.': 'validation.passwordMax',
  'Passwords must match.': 'validation.passwordsMatch',
  'Phone must not exceed 30 characters.': 'validation.phoneMax',
  'Phone number must contain at least 8 characters.': 'validation.phoneMin',
  'Please enter a valid email address.': 'validation.email',
  'Please enter a valid phone number.': 'validation.phoneValid',
  'Please enter your full name.': 'validation.fullNameRequired',
  'Please provide a brief description of your needs.':
    'validation.consultationMessageMin',
  'Please select a consultation method.': 'validation.methodRequired',
  'Please select a preferred date.': 'validation.preferredDateRequired',
  'Please select a preferred time.': 'validation.preferredTimeRequired',
  'Please select a service.': 'validation.serviceRequired',
  'Please tell us a little more about how we can help.':
    'validation.contactMessageMin',
  'Search must not exceed 100 characters.': 'validation.searchMax100',
  'Time must use HH:mm format.': 'validation.timeFormat',
  'Select a customer or case profile.': 'validation.customerOrCaseRequired',
  'Service is required.': 'validation.serviceRequired',
  'Title must contain at least 3 characters.': 'validation.titleMin',
  'Title must not exceed 250 characters.': 'validation.titleMax',
  'Use lowercase letters, numbers, and hyphens only.':
    'validation.workspaceSlugFormat',
  'Workspace name must contain at least 2 characters.':
    'validation.workspaceNameMin',
  'Workspace name must not exceed 120 characters.':
    'validation.workspaceNameMax',
  'Workspace phone must not exceed 30 characters.':
    'validation.workspacePhoneMax',
  'Workspace slug must contain at least 3 characters.':
    'validation.workspaceSlugMin',
  'Workspace slug must not exceed 50 characters.':
    'validation.workspaceSlugMax',
}

export const translateValidationMessage = (
  t: TFunction,
  message?: string,
): string | undefined => {
  if (!message) {
    return undefined
  }

  const key = validationMessageKeys[message]

  return key ? t(key) : message
}
