import db from './db'

export interface OnboardingDataRow {
  id: string
  userId: string
  legalFirstName?: string
  legalMiddleName?: string
  legalLastName?: string
  accountType?: string
  dateOfBirth?: string
  citizenship?: string
  taxationCountry?: string
  employmentStatus?: string
  physicalCountry?: string
  physicalAddress?: string
  physicalAptSte?: string
  physicalCity?: string
  physicalState?: string
  physicalZipCode?: string
  mailingAddressSame?: boolean
  mailingCountry?: string
  mailingAddress?: string
  mailingAptSte?: string
  mailingCity?: string
  mailingState?: string
  mailingZipCode?: string
  onboardingCompleted?: boolean
  createdAt?: string
  updatedAt?: string
}

// Find onboarding data by user ID
export function findOnboardingDataByUserId(userId: string): OnboardingDataRow | undefined {
  const stmt = db.prepare('SELECT * FROM onboarding_data WHERE user_id = ?')
  const row = stmt.get(userId) as any
  if (!row) return undefined

  return {
    id: row.id,
    userId: row.user_id,
    legalFirstName: row.legal_first_name || undefined,
    legalMiddleName: row.legal_middle_name || undefined,
    legalLastName: row.legal_last_name || undefined,
    accountType: row.account_type || undefined,
    dateOfBirth: row.date_of_birth || undefined,
    citizenship: row.citizenship || undefined,
    taxationCountry: row.taxation_country || undefined,
    employmentStatus: row.employment_status || undefined,
    physicalCountry: row.physical_country || undefined,
    physicalAddress: row.physical_address || undefined,
    physicalAptSte: row.physical_apt_ste || undefined,
    physicalCity: row.physical_city || undefined,
    physicalState: row.physical_state || undefined,
    physicalZipCode: row.physical_zip_code || undefined,
    mailingAddressSame: row.mailing_address_same === 1,
    mailingCountry: row.mailing_country || undefined,
    mailingAddress: row.mailing_address || undefined,
    mailingAptSte: row.mailing_apt_ste || undefined,
    mailingCity: row.mailing_city || undefined,
    mailingState: row.mailing_state || undefined,
    mailingZipCode: row.mailing_zip_code || undefined,
    onboardingCompleted: row.onboarding_completed === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// Map of camelCase field names to snake_case DB columns
const fieldMap: Record<string, string> = {
  legalFirstName: 'legal_first_name',
  legalMiddleName: 'legal_middle_name',
  legalLastName: 'legal_last_name',
  accountType: 'account_type',
  dateOfBirth: 'date_of_birth',
  citizenship: 'citizenship',
  taxationCountry: 'taxation_country',
  employmentStatus: 'employment_status',
  physicalCountry: 'physical_country',
  physicalAddress: 'physical_address',
  physicalAptSte: 'physical_apt_ste',
  physicalCity: 'physical_city',
  physicalState: 'physical_state',
  physicalZipCode: 'physical_zip_code',
  mailingAddressSame: 'mailing_address_same',
  mailingCountry: 'mailing_country',
  mailingAddress: 'mailing_address',
  mailingAptSte: 'mailing_apt_ste',
  mailingCity: 'mailing_city',
  mailingState: 'mailing_state',
  mailingZipCode: 'mailing_zip_code',
  onboardingCompleted: 'onboarding_completed',
}

// Save or update onboarding data
export function saveOnboardingData(userId: string, data: Partial<OnboardingDataRow>): OnboardingDataRow {
  const existing = findOnboardingDataByUserId(userId)

  if (existing) {
    // Update existing record
    const fields: string[] = []
    const values: any[] = []

    Object.entries(data).forEach(([key, value]) => {
      if (key === 'userId' || key === 'id' || key === 'createdAt' || key === 'updatedAt') return

      const dbKey = fieldMap[key]
      if (!dbKey) return
      fields.push(`${dbKey} = ?`)

      if (typeof value === 'boolean') {
        values.push(value ? 1 : 0)
      } else {
        values.push(value || null)
      }
    })

    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP')
      values.push(userId)

      const stmt = db.prepare(`
        UPDATE onboarding_data
        SET ${fields.join(', ')}
        WHERE user_id = ?
      `)

      stmt.run(...values)
    }
  } else {
    // Create new record
    const id = `onboarding_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

    const insertFields: string[] = ['id', 'user_id']
    const insertValues: any[] = [id, userId]
    const placeholders: string[] = ['?', '?']

    Object.entries(data).forEach(([key, value]) => {
      if (key === 'userId' || key === 'id' || key === 'createdAt' || key === 'updatedAt') return

      const dbKey = fieldMap[key]
      if (!dbKey) return
      insertFields.push(dbKey)
      placeholders.push('?')

      if (typeof value === 'boolean') {
        insertValues.push(value ? 1 : 0)
      } else {
        insertValues.push(value || null)
      }
    })

    const stmt = db.prepare(`
      INSERT INTO onboarding_data (${insertFields.join(', ')})
      VALUES (${placeholders.join(', ')})
    `)

    stmt.run(...insertValues)
  }

  const updated = findOnboardingDataByUserId(userId)
  if (!updated) {
    throw new Error('Failed to save onboarding data')
  }

  return updated
}
