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

import { getTenderSubmission, submitTender } from '../controllers/tenderSubmissionController.js'
import { protect } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/roleMiddleware.js'

import {
  getTenderReviewDashboard,
  reviewTenderRequirement,
  reviewTenderCompliance,
} from '../controllers/tenderReviewController.js'

const router = express.Router()

// All tender routes require authentication
router.use(protect)

// Phase 2: Individual item review. Final submission is Phase 3.
router.get('/:tenderId/review',
  requireRole('ADMIN', 'CEO', 'MANAGER'), requireTenderAccess, getTenderReviewDashboard)
router.patch('/:tenderId/review/requirements/:requirementId',
  requireRole('ADMIN', 'CEO', 'MANAGER'), requireTenderAccess, reviewTenderRequirement)
router.patch('/:tenderId/review/compliance/:complianceItemId',
  requireRole('ADMIN', 'CEO', 'MANAGER'), requireTenderAccess, reviewTenderCompliance)




router.get(
  '/assignable-employees',
  requireRole('ADMIN', 'CEO', 'MANAGER'),
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
  requireRole('ADMIN', 'CEO', 'MANAGER'),
  createRequirement
)

// ADMIN + MANAGER can update requirements
router.put(
  '/:tenderId/requirements/:requirementId',
  requireRole('ADMIN', 'CEO', 'MANAGER'),
  updateRequirement
)


router.delete(
  '/:tenderId/requirements/:requirementId',
  requireRole('ADMIN', 'CEO', 'MANAGER'),
  removeRequirement
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
    'CEO',
    'MANAGER'
  ),
  getComplianceTemplateOptions
)

router.post(
  '/:tenderId/compliance/apply-template',
  requireRole('ADMIN', 'CEO', 'MANAGER'),
  applyDefaultComplianceTemplate
)

router.post(
  '/:tenderId/compliance',
  requireRole('ADMIN', 'CEO', 'MANAGER'),
  createComplianceItem
)

router.put(
  '/:tenderId/compliance/:complianceItemId',
  requireRole('ADMIN', 'CEO', 'MANAGER'),
  updateComplianceItem
)

router.delete(
  '/:tenderId/compliance/:complianceItemId',
  requireRole('ADMIN', 'CEO', 'MANAGER'),
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
    'CEO',
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
    'CEO',
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
    'CEO',
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
    'CEO',
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
    'CEO',
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
    'CEO',
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





// Final Submission: read-only for all tender members; only Admin/CEO may submit.
router.get('/:tenderId/submission', requireRole('ADMIN','CEO','MANAGER','EMPLOYEE'), requireTenderAccess, getTenderSubmission)
router.patch('/:tenderId/submission', requireRole('ADMIN','CEO'), requireTenderAccess, submitTender)

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
  requireRole('ADMIN', 'CEO', 'MANAGER'),
  createNewTender
)

// ADMIN + MANAGER can update tenders
router.put(
  '/:id',
  requireRole('ADMIN', 'CEO', 'MANAGER'),
  updateTender
)

// ADMIN + MANAGER can archive tenders
router.delete(
  '/:id',
  requireRole('ADMIN', 'CEO', 'MANAGER'),
  archiveTender
)

// ADMIN + MANAGER can assign employees
router.post(
  '/:id/assign',
  requireRole('ADMIN', 'CEO', 'MANAGER'),
  assignTender
)

// ADMIN + MANAGER can remove employees from tender team

router.delete(
  '/:id/assign/:userId',
  requireRole('ADMIN', 'CEO', 'MANAGER'),
  removeTenderTeamMember
)

export default router