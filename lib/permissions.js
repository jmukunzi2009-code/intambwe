export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  EVENT_MANAGER: 'event_manager',
  CONTENT_EDITOR: 'content_editor',
  MENTOR: 'mentor',
  STUDENT: 'student',
  VISITOR: 'visitor',
};

export const PERMISSIONS = {
  // User & Role Management
  USERS_MANAGE: 'users:manage',
  USERS_VIEW: 'users:view',
  ROLES_MANAGE: 'roles:manage',
  
  // Meetings & Events
  MEETINGS_MANAGE: 'meetings:manage',
  MEETINGS_VIEW: 'meetings:view',
  ATTENDANCE_MANAGE: 'attendance:manage',
  AGENDA_MANAGE: 'agenda:manage',
  
  // Content & Resources
  ARTICLES_MANAGE: 'articles:manage',
  ARTICLES_PUBLISH: 'articles:publish',
  RESOURCES_MANAGE: 'resources:manage',
  
  // Challenges & Certificates
  CHALLENGES_MANAGE: 'challenges:manage',
  CERTIFICATES_MANAGE: 'certificates:manage',
  
  // Communication & Moderation
  CONTACT_MANAGE: 'contact:manage',
  COMMUNITY_MODERATE: 'community:moderate',
  
  // Reports & Settings
  REPORTS_VIEW: 'reports:view',
  SETTINGS_MANAGE: 'settings:manage',
  AUDIT_LOGS_VIEW: 'audit_logs:view',
};

// Default permissions mapped by role
export const ROLE_PERMISSIONS_MAP = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.ADMIN]: [
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.MEETINGS_MANAGE,
    PERMISSIONS.MEETINGS_VIEW,
    PERMISSIONS.ATTENDANCE_MANAGE,
    PERMISSIONS.AGENDA_MANAGE,
    PERMISSIONS.ARTICLES_MANAGE,
    PERMISSIONS.ARTICLES_PUBLISH,
    PERMISSIONS.RESOURCES_MANAGE,
    PERMISSIONS.CHALLENGES_MANAGE,
    PERMISSIONS.CERTIFICATES_MANAGE,
    PERMISSIONS.CONTACT_MANAGE,
    PERMISSIONS.COMMUNITY_MODERATE,
    PERMISSIONS.REPORTS_VIEW,
  ],
  [ROLES.EVENT_MANAGER]: [
    PERMISSIONS.MEETINGS_MANAGE,
    PERMISSIONS.MEETINGS_VIEW,
    PERMISSIONS.ATTENDANCE_MANAGE,
    PERMISSIONS.AGENDA_MANAGE,
    PERMISSIONS.REPORTS_VIEW,
  ],
  [ROLES.CONTENT_EDITOR]: [
    PERMISSIONS.ARTICLES_MANAGE,
    PERMISSIONS.RESOURCES_MANAGE,
    PERMISSIONS.COMMUNITY_MODERATE,
  ],
  [ROLES.MENTOR]: [
    PERMISSIONS.MEETINGS_VIEW,
  ],
  [ROLES.STUDENT]: [],
  [ROLES.VISITOR]: [],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(userRole, permission) {
  if (userRole === ROLES.SUPER_ADMIN) return true;
  const permissions = ROLE_PERMISSIONS_MAP[userRole] || [];
  return permissions.includes(permission);
}

/**
 * Check if role is an administrative / staff role
 */
export function isStaffRole(role) {
  return [
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.EVENT_MANAGER,
    ROLES.CONTENT_EDITOR,
  ].includes(role);
}
