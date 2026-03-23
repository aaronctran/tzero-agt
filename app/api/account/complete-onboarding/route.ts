import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { findUserById } from '@/lib/userStore'
import { saveOnboardingData } from '@/lib/onboardingStore'
import { getAuthUserId } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request)
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized. Please log in to continue.' },
        { status: 401 }
      )
    }

    const user = findUserById(userId)
    if (!user) {
      return NextResponse.json(
        { message: 'User not found.' },
        { status: 404 }
      )
    }

    const body = await request.json()

    const {
      legalFirstName,
      legalLastName,
      phoneNumber,
      countryCode,
      dateOfBirth,
      accountType,
      citizenship,
      taxationCountry,
      physicalCountry,
      physicalAddress,
      physicalAptSte,
      physicalCity,
      physicalState,
      physicalZipCode,
      mailingAddressSame,
      mailingCountry,
      mailingAddress,
      mailingAptSte,
      mailingCity,
      mailingState,
      mailingZipCode,
    } = body

    if (!legalFirstName || !legalLastName) {
      return NextResponse.json(
        { message: 'First name and last name are required.' },
        { status: 400 }
      )
    }

    if (!dateOfBirth) {
      return NextResponse.json(
        { message: 'Date of Birth is required.' },
        { status: 400 }
      )
    }

    if (!physicalCountry || !physicalAddress || !physicalCity || !physicalState || !physicalZipCode) {
      return NextResponse.json(
        { message: 'All Physical Address fields are required.' },
        { status: 400 }
      )
    }

    if (!mailingAddressSame) {
      if (!mailingCountry || !mailingAddress || !mailingCity || !mailingState || !mailingZipCode) {
        return NextResponse.json(
          { message: 'All Mailing Address fields are required when mailing address is different.' },
          { status: 400 }
        )
      }
    }

    const finalMailingCountry = mailingAddressSame ? physicalCountry : mailingCountry
    const finalMailingAddress = mailingAddressSame ? physicalAddress : mailingAddress
    const finalMailingAptSte = mailingAddressSame ? physicalAptSte : mailingAptSte
    const finalMailingCity = mailingAddressSame ? physicalCity : mailingCity
    const finalMailingState = mailingAddressSame ? physicalState : mailingState
    const finalMailingZipCode = mailingAddressSame ? physicalZipCode : mailingZipCode

    saveOnboardingData(userId, {
      legalFirstName,
      legalLastName,
      accountType: accountType || 'Individual',
      dateOfBirth,
      citizenship: citizenship || 'United States',
      taxationCountry: taxationCountry || 'United States',
      physicalCountry,
      physicalAddress,
      physicalAptSte,
      physicalCity,
      physicalState,
      physicalZipCode,
      mailingAddressSame,
      mailingCountry: finalMailingCountry,
      mailingAddress: finalMailingAddress,
      mailingAptSte: finalMailingAptSte,
      mailingCity: finalMailingCity,
      mailingState: finalMailingState,
      mailingZipCode: finalMailingZipCode,
      onboardingCompleted: true,
    })

    const updateUserStmt = db.prepare(`
      UPDATE users
      SET onboarding_completed = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    updateUserStmt.run(userId)

    const updatedUser = findUserById(userId)

    return NextResponse.json({
      message: 'Onboarding completed successfully',
      user: {
        id: updatedUser?.id,
        email: updatedUser?.email,
        firstName: updatedUser?.firstName,
        lastName: updatedUser?.lastName,
        phoneNumber: updatedUser?.phoneNumber,
        countryCode: updatedUser?.countryCode,
        emailVerified: updatedUser?.emailVerified,
        onboardingCompleted: true,
      },
    })
  } catch (error: any) {
    console.error('Complete onboarding error:', error)
    return NextResponse.json(
      { message: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
