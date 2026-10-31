import express from 'express'

import {
  listTenders,
  getTenderDetails,
  createNewTender,
  updateTender,
  assignTender,
  removeTenderTeamMember,
  listAssignableEmployees,
  listInternalOwners,
  listMyAssignedTenders,
  archiveTender,
  
} from '../controllers/tenderController.js'


import {
  requireTenderAccess,
} from '../middleware/tenderAccessMiddleware.js'

import {
  listTenderCompliance,
  applyDefaultComplianceTemplate,
  createComplianceItem,
  updateComplianceItem,
  removeComplianceItem,
  updateEmployeeComplianceProgress,
  getComplianceTemplateOptions,
} from '../controllers/tenderComplianceController.js'

import {
  listTenderRequirements,
  createRequirement,
  updateRequirement,
  removeRequirement,
  updateEmployeeRequirementProgress
} from '../controllers/tenderRequirementController.js'


import {
  listTenderDocuments,
  uploadTenderDocument,
  editTenderDocument,
  downloadTenderDocument,
  removeTenderDocument,
  previewTenderDocument
} from '../controllers/tenderDocumentController.js'

import {
  listTenderInternalNotes,
  addTenderInternalNote,
  editTenderInternalNote,
  deleteTenderInternalNote,
} from '../controllers/tenderInternalNoteController.js'



import {
  listTenderActivities,
} from '../controllers/tenderActivityController.js'

import {
  tenderDocumentUpload,
} from '../config/documentUpload.js'

import { protect } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/roleMiddleware.js'

const router = express.Router()

// All tender routes require authentication
router.use(protect)


router.get(
  '/assignable-employees',
  requireRole('ADMIN', 'MANAGER'),
  listAssignableEmployees
)

router.get(
  '/assigned',
  requireRole('EMPLOYEE'),
  listMyAssignedTenders
)

// ADMIN + ceo + MANAGER can view all tenders
router.get(
  '/',
  requireRole('ADMIN','CEO', 'MANAGER'),
  listTenders
)

router.get(
  '/internal-owners',
  requireRole('ADMIN', 'CEO', 'MANAGER'),
  listInternalOwners
)


// ADMIN + CEO + MANAGER can view requirements
router.get(
  '/:tenderId/requirements',
  requireRole(
    'ADMIN',
    'CEO',
    'MANAGER',
    'EMPLOYEE'
  ),
  requireTenderAccess,
  listTenderRequirements
)

// ADMIN + MANAGER can create requirements
router.post(
  '/:tenderId/requirements',
  requireRole('ADMIN', 'MANAGER'),
  createRequirement
)

// ADMIN + MANAGER can update requirements
router.put(
  '/:tenderId/requirements/:requirementId',
  requireRole('ADMIN', 'MANAGER'),
  updateRequirement
)


router.get(
  '/:tenderId/compliance',
  requireRole(
    'ADMIN',
    'CEO',
    'MANAGER',
    'EMPLOYEE'
  ),
  requireTenderAccess,
  listTenderCompliance
)

router.get(
  '/:tenderId/compliance/template-options',
  requireRole(
    'ADMIN',
    'MANAGER'
  ),
  getComplianceTemplateOptions
)

router.post(
  '/:tenderId/compliance/apply-template',
  requireRole('ADMIN', 'MANAGER'),
  applyDefaultComplianceTemplate
)

router.post(
  '/:tenderId/compliance',
  requireRole('ADMIN', 'MANAGER'),
  createComplianceItem
)

router.put(
  '/:tenderId/compliance/:complianceItemId',
  requireRole('ADMIN', 'MANAGER'),
  updateComplianceItem
)

router.delete(
  '/:tenderId/compliance/:complianceItemId',
  requireRole('ADMIN', 'MANAGER'),
  removeComplianceItem
)

router.patch(
  '/:tenderId/compliance/:complianceItemId/progress',
  requireRole('EMPLOYEE'),
  requireTenderAccess,
  updateEmployeeComplianceProgress
)

// --------------------------------------------------
// Tender Documents
// --------------------------------------------------

// List documents
router.get(
  '/:tenderId/documents',
  requireRole(
    'ADMIN',
    'CEO',
    'MANAGER',
    'EMPLOYEE'
  ),
  requireTenderAccess,
  listTenderDocuments
)
// Upload document
router.post(
  '/:tenderId/documents',
  requireRole(
    'ADMIN',
    'MANAGER',
    'EMPLOYEE'
  ),
  requireTenderAccess,
  tenderDocumentUpload.single('file'),
  uploadTenderDocument
)

// Edit document metadata and optionally replace file

// Edit document metadata and optionally replace file
router.put(
  '/:tenderId/documents/:documentId',
  requireRole(
    'ADMIN',
    'MANAGER',
    'EMPLOYEE'
  ),
  requireTenderAccess,
  tenderDocumentUpload.single('file'),
  editTenderDocument
)

// Download document
router.get(
  '/:tenderId/documents/:documentId/download',
  requireRole(
    'ADMIN',
    'CEO',
    'MANAGER',
    'EMPLOYEE'
  ),
  requireTenderAccess,
  downloadTenderDocument
)

router.get(
  '/:tenderId/documents/:documentId/preview',
  requireRole(
    'ADMIN',
    'CEO',
    'MANAGER',
    'EMPLOYEE'
  ),
  requireTenderAccess,
  previewTenderDocument
)


// Remove document
router.delete(
  '/:tenderId/documents/:documentId',
  requireRole(
    'ADMIN',
    'MANAGER',
    'EMPLOYEE'
  ),
  requireTenderAccess,
  removeTenderDocument
)

//tender internal notes
//tender internal notes
router.get(
  '/:tenderId/internal-notes',
  requireRole(
    'ADMIN',
    'CEO',
    'MANAGER',
    'EMPLOYEE'
  ),
  requireTenderAccess,
  listTenderInternalNotes
)

router.post(
  '/:tenderId/internal-notes',
  requireRole(
    'ADMIN',
    'MANAGER',
    'EMPLOYEE'
  ),
  requireTenderAccess,
  addTenderInternalNote
)

router.put(
  '/:tenderId/internal-notes/:noteId',
  requireRole(
    'ADMIN',
    'MANAGER',
    'EMPLOYEE'
  ),
  requireTenderAccess,
  editTenderInternalNote
)
router.delete(
  '/:tenderId/internal-notes/:noteId',
  requireRole(
    'ADMIN',
    'MANAGER',
    'EMPLOYEE'
  ),
  requireTenderAccess,
  deleteTenderInternalNote
)





//tender activity

router.get(
  '/:tenderId/activity',
  requireRole(
    'ADMIN',
    'CEO',
    'MANAGER',
    'EMPLOYEE'
  ),
  requireTenderAccess,
  listTenderActivities
)





// ADMIN + CEO +MANAGER can view tender details
router.get(
  '/:id',
  requireRole(
    'ADMIN',
    'CEO',
    'MANAGER',
    'EMPLOYEE'
  ),
  requireTenderAccess,
  getTenderDetails
)



router.patch(
  '/:tenderId/requirements/:requirementId/progress',
  requireRole('EMPLOYEE'),
  requireTenderAccess,
  updateEmployeeRequirementProgress
)

// ADMIN + MANAGER can create tenders
router.post(
  '/',
  requireRole('ADMIN', 'MANAGER'),
  createNewTender
)

// ADMIN + MANAGER can update tenders
router.put(
  '/:id',
  requireRole('ADMIN', 'MANAGER'),
  updateTender
)

// ADMIN + MANAGER can archive tenders
router.delete(
  '/:id',
  requireRole('ADMIN', 'MANAGER'),
  archiveTender
)

// ADMIN + MANAGER can assign employees
router.post(
  '/:id/assign',
  requireRole('ADMIN', 'MANAGER'),
  assignTender
)

// ADMIN + MANAGER can remove employees from tender team

router.delete(
  '/:id/assign/:userId',
  requireRole('ADMIN', 'MANAGER'),
  removeTenderTeamMember
)

export default router