import pool from '../config/db.js'

const parseId = value => Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : null
const textValue = value => typeof value === 'string' ? value.trim().slice(0, 2000) : ''

// Readiness is calculated from live database rows. A missing or revised evidence file
// blocks submission, even if its linked item still says APPROVED.
export const calculateSubmissionReadiness = async (db, tenderId) => {
  const blockers = []
  const summary = { requirements: { total: 0, approved: 0 }, compliance: { total: 0, approved: 0 } }
  for (const [kind, table, link] of [
    ['requirements', 'tender_requirements', 'requirement_id'],
    ['compliance', 'tender_compliance_items', 'compliance_item_id'],
  ]) {
    const [items] = await db.query(`SELECT id, title, status, review_status, reviewed_at, is_mandatory FROM ${table} WHERE tender_id = ? AND is_active = 1`, [tenderId])
    for (const item of items) {
      const required = Number(item.is_mandatory) === 1
      if (required) summary[kind].total++
      // Non-applicable items may be omitted only when not mandatory.
      if (!required && item.status === 'NOT_APPLICABLE') continue
      if (!required) continue
      const [docs] = await db.query(`SELECT id, updated_at, created_at FROM tender_documents WHERE tender_id = ? AND ${link} = ? AND document_type = 'INTERNAL_SUBMISSION' AND is_active = 1`, [tenderId, item.id])
      const approved = item.status === 'COMPLETED' && item.review_status === 'APPROVED' && item.reviewed_at != null
      const hasEvidence = docs.length > 0
      const staleEvidence = approved && docs.some(doc => new Date(doc.updated_at || doc.created_at).getTime() > new Date(item.reviewed_at).getTime())
      if (approved && hasEvidence && !staleEvidence) summary[kind].approved++
      else blockers.push({ kind, id: item.id, title: item.title, reason: !approved ? 'Not approved' : !hasEvidence ? 'Missing evidence' : 'Evidence updated after approval' })
    }
  }
  const [finalDocs] = await db.query(`SELECT id, title, file_name, mime_type, uploaded_by, created_at FROM tender_documents WHERE tender_id = ? AND document_type = 'INTERNAL_SUBMISSION' AND requirement_id IS NULL AND compliance_item_id IS NULL AND is_active = 1 ORDER BY created_at DESC`, [tenderId])
  if (summary.requirements.total + summary.compliance.total === 0) blockers.push({kind:'tender', reason:'No mandatory requirements or compliance items defined'})
  // Final submission documents are optional until the client specifies otherwise.
  return { ready: blockers.length === 0, summary, blockers, finalSubmissionDocuments: finalDocs }
}

export const getTenderSubmission = async (req, res, next) => {
  try {
    const id = parseId(req.params.tenderId)
    if (!id) return res.status(400).json({success:false,message:'Invalid tender ID'})
    const [[tender]] = await pool.query(`SELECT t.id,t.title,t.reference_no,t.status,t.submission_method,t.submission_location,t.submission_reference,t.submission_notes,t.submitted_at,t.submitted_by,u.name AS submitted_by_name FROM tenders t LEFT JOIN users u ON u.id=t.submitted_by WHERE t.id=? AND t.is_active=1`,[id])
    if (!tender) return res.status(404).json({success:false,message:'Tender not found'})
    const readiness = await calculateSubmissionReadiness(pool,id)
    return res.json({success:true,tender,readiness,finalSubmissionDocuments:readiness.finalSubmissionDocuments})
  } catch (err) { next(err) }
}

export const submitTender = async (req, res, next) => {
  const id = parseId(req.params.tenderId)
  if (!id) return res.status(400).json({success:false,message:'Invalid tender ID'})
  const method = textValue(req.body?.submissionMethod)
  const location = textValue(req.body?.submissionLocation)
  const reference = textValue(req.body?.submissionReference)
  const notes = textValue(req.body?.submissionNotes)
  if (!method || !reference) return res.status(400).json({success:false,message:'Submission method and reference are required'})
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const [[tender]] = await conn.query('SELECT id,status FROM tenders WHERE id=? AND is_active=1 FOR UPDATE',[id])
    if (!tender) { await conn.rollback(); return res.status(404).json({success:false,message:'Tender not found'}) }
    if (tender.status === 'SUBMITTED' || tender.status === 'COMPLETED') { await conn.rollback(); return res.status(409).json({success:false,message:'Tender already submitted or completed'}) }
    const readiness = await calculateSubmissionReadiness(conn,id)
    if (!readiness.ready) { await conn.rollback(); return res.status(409).json({success:false,message:'Tender is not ready for submission',readiness}) }
    const [result] = await conn.query(`UPDATE tenders SET status='SUBMITTED', submission_method=?, submission_location=?, submission_reference=?, submission_notes=?, submitted_by=?, submitted_at=NOW() WHERE id=? AND status NOT IN ('SUBMITTED','COMPLETED')`,[method,location||null,reference,notes||null,req.user.id,id])
    if (result.affectedRows !== 1) { await conn.rollback(); return res.status(409).json({success:false,message:'Tender submission state changed'}) }
    await conn.commit()
    return res.json({success:true,message:'Tender marked as submitted',data:{id,status:'SUBMITTED'}})
  } catch (err) { try { await conn.rollback() } catch {} next(err) } finally { conn.release() }
}
