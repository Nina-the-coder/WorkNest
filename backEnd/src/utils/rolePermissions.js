/**
 * Role to Permissions Mapping
 * Defines what permissions each role has
 * This is the central source of truth for role-based access control
 * New roles can be added here without modifying route/controller logic
 */

const PERMISSIONS = require("./permissions");

const ROLE_PERMISSIONS = {
  admin: [
    // Admin has all permissions
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_UPDATE,
    PERMISSIONS.CUSTOMER_ARCHIVE,

    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_UPDATE,
    PERMISSIONS.PRODUCT_ARCHIVE,

    PERMISSIONS.EMPLOYEE_READ,
    PERMISSIONS.EMPLOYEE_CREATE,
    PERMISSIONS.EMPLOYEE_UPDATE,
    PERMISSIONS.EMPLOYEE_ARCHIVE,

    PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.TASK_DELETE,

    PERMISSIONS.ORDER_READ,
    PERMISSIONS.ORDER_CREATE,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.ORDER_ARCHIVE,

    PERMISSIONS.QUOTATION_READ,
    PERMISSIONS.QUOTATION_CREATE,
    PERMISSIONS.QUOTATION_UPDATE,
    PERMISSIONS.QUOTATION_SUBMIT,
    PERMISSIONS.QUOTATION_SUBMIT,
    PERMISSIONS.QUOTATION_APPROVE,
    PERMISSIONS.QUOTATION_REJECT,
    PERMISSIONS.QUOTATION_ARCHIVE,

    PERMISSIONS.DASHBOARD_READ,
  ],

  employee: [
    // Employee has limited read-only permissions + own resource management
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.TASK_READ,
    PERMISSIONS.ORDER_READ,

    PERMISSIONS.QUOTATION_READ,
    PERMISSIONS.QUOTATION_CREATE,
    PERMISSIONS.QUOTATION_UPDATE,

    PERMISSIONS.DASHBOARD_READ,
  ],
};

/**
 * Get all permissions for a given role
 * @param {string} role - The role name (e.g., 'admin', 'employee')
 * @returns {string[]} Array of permission strings
 */
const getPermissionsForRole = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Check if a role has a specific permission
 * @param {string} role - The role name
 * @param {string} permission - The permission to check
 * @returns {boolean} True if role has permission
 */
const hasPermission = (role, permission) => {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

module.exports = {
  ROLE_PERMISSIONS,
  getPermissionsForRole,
  hasPermission,
};
