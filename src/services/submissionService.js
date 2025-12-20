import { supabase } from '../config/supabase'
import { guestService } from './guestService'

const isGuestMode = () => {
  return guestService.isGuestMode()
}

const generateId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }
  return `submission_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

const uploadProofs = async (submissionId, files) => {
  const uploaded = []

  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `submissions/${submissionId}/${Date.now()}_${safeName}`
    const { error: uploadError } = await supabase.storage
      .from('person-proofs')
      .upload(path, file, { upsert: false })

    if (uploadError) {
      throw uploadError
    }

    const { error: proofError } = await supabase
      .from('person_info_proofs')
      .insert({
        submission_id: submissionId,
        storage_path: path,
        file_name: file.name,
        content_type: file.type || 'application/octet-stream',
      })

    if (proofError) {
      throw proofError
    }

    uploaded.push(path)
  }

  return uploaded
}

export const submissionService = {
  async createSubmission(payload) {
    if (isGuestMode()) {
      throw new Error('Guest mode cannot submit verified information. Please sign in.')
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const submissionId = generateId()

    const submission = {
      id: submissionId,
      user_id: user.id,
      person_profile_id: payload.personProfileId || null,
      first_name: payload.firstName,
      last_name: payload.lastName,
      age: payload.age || null,
      status: 'pending',
    }

    const { error: submissionError } = await supabase
      .from('person_info_submissions')
      .insert(submission)

    if (submissionError) throw submissionError

    const inserts = []

    if (payload.addresses?.length) {
      inserts.push(
        supabase.from('person_info_addresses').insert(
          payload.addresses.map((addr) => ({
            submission_id: submissionId,
            street: addr.street,
            city: addr.city,
            state: addr.state,
            zip_code: addr.zipCode,
            country: addr.country || 'USA',
            is_current: !!addr.isCurrent,
            start_date: addr.startDate || null,
            end_date: addr.endDate || null,
          }))
        )
      )
    }

    if (payload.phoneNumbers?.length) {
      inserts.push(
        supabase.from('person_info_phone_numbers').insert(
          payload.phoneNumbers.map((phone) => ({
            submission_id: submissionId,
            number: phone.number,
            type: phone.type || 'mobile',
            is_current: phone.isCurrent ?? true,
            last_verified: phone.lastVerified || null,
          }))
        )
      )
    }

    if (payload.socialMedia?.length) {
      inserts.push(
        supabase.from('person_info_social_media').insert(
          payload.socialMedia.map((social) => ({
            submission_id: submissionId,
            platform: social.platform,
            username: social.username || null,
            url: social.url || null,
          }))
        )
      )
    }

    if (payload.criminalRecords?.length) {
      inserts.push(
        supabase.from('person_info_criminal_records').insert(
          payload.criminalRecords.map((record) => ({
            submission_id: submissionId,
            case_number: record.caseNumber || null,
            charge: record.charge || '',
            status: record.status || 'unknown',
            record_date: record.recordDate || null,
            jurisdiction: record.jurisdiction || null,
          }))
        )
      )
    }

    if (payload.relatives?.length) {
      inserts.push(
        supabase.from('person_info_relatives').insert(
          payload.relatives.map((relative) => ({
            submission_id: submissionId,
            first_name: relative.firstName || '',
            last_name: relative.lastName || null,
            relationship: relative.relationship || 'unknown',
            age: relative.age ? Number(relative.age) : null,
          }))
        )
      )
    }

    if (payload.pastNames?.length) {
      inserts.push(
        supabase.from('person_info_past_names').insert(
          payload.pastNames.map((name) => ({
            submission_id: submissionId,
            name,
          }))
        )
      )
    }

    if (inserts.length) {
      const results = await Promise.all(inserts)
      const firstError = results.find((res) => res.error)?.error
      if (firstError) throw firstError
    }

    if (!payload.proofFiles?.length) {
      throw new Error('At least one proof document is required.')
    }

    await uploadProofs(submissionId, payload.proofFiles)

    return { id: submissionId }
  },

  async getApprovedSubmissions({ personProfileId, firstName, lastName }) {
    let query = supabase
      .from('person_info_submissions')
      .select(`
        *,
        person_info_addresses (*),
        person_info_phone_numbers (*),
        person_info_social_media (*),
        person_info_criminal_records (*),
        person_info_relatives (*),
        person_info_past_names (*)
      `)
      .eq('status', 'approved')

    if (personProfileId) {
      query = query.eq('person_profile_id', personProfileId)
    } else if (firstName && lastName) {
      query = query.eq('first_name', firstName).eq('last_name', lastName)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async getPendingSubmissions() {
    const { data, error } = await supabase
      .from('person_info_submissions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return data || []
  },

  async updateSubmissionStatus(submissionId, status, reviewerNotes = '') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('person_info_submissions')
      .update({
        status,
        reviewer_notes: reviewerNotes || null,
        verified_at: status === 'approved' ? new Date().toISOString() : null,
        verified_by: status === 'approved' ? user.id : null,
      })
      .eq('id', submissionId)
      .select('*')
      .single()

    if (error) throw error
    return data
  },
}
