export interface HealthScoreInputs {
  // Growth metrics
  upliftPercentage: number // Current month uplift %
  averageUpliftPercentage: number // Average over last 3 months
  growthTrend: 'increasing' | 'stable' | 'decreasing'

  // Attribution metrics
  attributionRate: number // % attributed to Sweet Dreams
  unknownRate: number // % of revenue from unknown sources

  // Engagement metrics
  responseTime: 'fast' | 'normal' | 'slow' | 'unresponsive' // Client communication
  contentApprovalRate: number // % of content approved on first submission
  meetingAttendance: number // % of scheduled meetings attended

  // Payment metrics
  paymentHistory: 'excellent' | 'good' | 'fair' | 'poor' // Based on on-time payments
  outstandingBalance: number // Current outstanding amount

  // Activity metrics
  activityLevel: 'high' | 'normal' | 'low' // Our work output
  monthsSinceLastActivity: number
}

export interface HealthScoreFactor {
  name: string
  score: number
  maxScore: number
  weight: number
  weightedScore: number
  status: 'excellent' | 'good' | 'fair' | 'poor'
  notes?: string
}

export interface HealthScoreResult {
  totalScore: number
  maxPossibleScore: number
  percentage: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  status: 'healthy' | 'at_risk' | 'critical'
  factors: HealthScoreFactor[]
  recommendations: string[]
}

/**
 * Calculate health score for a client (0-100)
 */
export function calculateHealthScore(inputs: HealthScoreInputs): HealthScoreResult {
  const factors: HealthScoreFactor[] = []

  // 1. Growth Score (25 points max)
  const growthScore = calculateGrowthScore(inputs)
  factors.push({
    name: 'Growth',
    score: growthScore.score,
    maxScore: 25,
    weight: 0.25,
    weightedScore: growthScore.score,
    status: getStatusFromScore(growthScore.score, 25),
    notes: growthScore.notes,
  })

  // 2. Attribution Score (20 points max)
  const attributionScore = calculateAttributionScore(inputs)
  factors.push({
    name: 'Attribution',
    score: attributionScore.score,
    maxScore: 20,
    weight: 0.20,
    weightedScore: attributionScore.score,
    status: getStatusFromScore(attributionScore.score, 20),
    notes: attributionScore.notes,
  })

  // 3. Engagement Score (20 points max)
  const engagementScore = calculateEngagementScore(inputs)
  factors.push({
    name: 'Engagement',
    score: engagementScore.score,
    maxScore: 20,
    weight: 0.20,
    weightedScore: engagementScore.score,
    status: getStatusFromScore(engagementScore.score, 20),
    notes: engagementScore.notes,
  })

  // 4. Payment Score (20 points max)
  const paymentScore = calculatePaymentScore(inputs)
  factors.push({
    name: 'Payment',
    score: paymentScore.score,
    maxScore: 20,
    weight: 0.20,
    weightedScore: paymentScore.score,
    status: getStatusFromScore(paymentScore.score, 20),
    notes: paymentScore.notes,
  })

  // 5. Activity Score (15 points max)
  const activityScore = calculateActivityScore(inputs)
  factors.push({
    name: 'Activity',
    score: activityScore.score,
    maxScore: 15,
    weight: 0.15,
    weightedScore: activityScore.score,
    status: getStatusFromScore(activityScore.score, 15),
    notes: activityScore.notes,
  })

  // Calculate totals
  const totalScore = factors.reduce((sum, f) => sum + f.score, 0)
  const maxPossibleScore = 100
  const percentage = Math.round((totalScore / maxPossibleScore) * 100)

  // Determine grade
  const grade = getGrade(percentage)
  const status = getOverallStatus(percentage)

  // Generate recommendations
  const recommendations = generateRecommendations(factors, inputs)

  return {
    totalScore: Math.round(totalScore),
    maxPossibleScore,
    percentage,
    grade,
    status,
    factors,
    recommendations,
  }
}

function calculateGrowthScore(inputs: HealthScoreInputs): { score: number; notes: string } {
  let score = 0
  const notes: string[] = []

  // Uplift percentage (0-15 points)
  if (inputs.upliftPercentage >= 30) {
    score += 15
    notes.push('Excellent uplift')
  } else if (inputs.upliftPercentage >= 20) {
    score += 12
    notes.push('Strong uplift')
  } else if (inputs.upliftPercentage >= 10) {
    score += 8
    notes.push('Moderate uplift')
  } else if (inputs.upliftPercentage > 0) {
    score += 4
    notes.push('Low uplift')
  } else {
    notes.push('No uplift')
  }

  // Growth trend (0-10 points)
  if (inputs.growthTrend === 'increasing') {
    score += 10
    notes.push('Positive trend')
  } else if (inputs.growthTrend === 'stable') {
    score += 6
    notes.push('Stable trend')
  } else {
    score += 2
    notes.push('Declining trend')
  }

  return { score: Math.min(25, score), notes: notes.join(', ') }
}

function calculateAttributionScore(inputs: HealthScoreInputs): { score: number; notes: string } {
  let score = 0
  const notes: string[] = []

  // Attribution rate (0-12 points)
  if (inputs.attributionRate >= 50) {
    score += 12
    notes.push('High attribution')
  } else if (inputs.attributionRate >= 30) {
    score += 9
    notes.push('Good attribution')
  } else if (inputs.attributionRate >= 15) {
    score += 5
    notes.push('Low attribution')
  } else {
    notes.push('Very low attribution')
  }

  // Unknown rate penalty (0-8 points, deducted for high unknown)
  if (inputs.unknownRate <= 10) {
    score += 8
    notes.push('Good tracking')
  } else if (inputs.unknownRate <= 25) {
    score += 5
    notes.push('Some unknown sources')
  } else if (inputs.unknownRate <= 40) {
    score += 2
    notes.push('High unknown sources')
  } else {
    notes.push('Critical tracking issues')
  }

  return { score: Math.min(20, score), notes: notes.join(', ') }
}

function calculateEngagementScore(inputs: HealthScoreInputs): { score: number; notes: string } {
  let score = 0
  const notes: string[] = []

  // Response time (0-8 points)
  const responsePoints = { fast: 8, normal: 6, slow: 3, unresponsive: 0 }
  score += responsePoints[inputs.responseTime]

  // Content approval rate (0-6 points)
  if (inputs.contentApprovalRate >= 90) score += 6
  else if (inputs.contentApprovalRate >= 70) score += 4
  else if (inputs.contentApprovalRate >= 50) score += 2

  // Meeting attendance (0-6 points)
  if (inputs.meetingAttendance >= 90) score += 6
  else if (inputs.meetingAttendance >= 70) score += 4
  else if (inputs.meetingAttendance >= 50) score += 2

  if (inputs.responseTime === 'unresponsive') notes.push('Communication issues')
  if (inputs.meetingAttendance < 50) notes.push('Low meeting attendance')

  return { score: Math.min(20, score), notes: notes.join(', ') || 'Good engagement' }
}

function calculatePaymentScore(inputs: HealthScoreInputs): { score: number; notes: string } {
  let score = 0
  const notes: string[] = []

  // Payment history (0-15 points)
  const historyPoints = { excellent: 15, good: 11, fair: 6, poor: 0 }
  score += historyPoints[inputs.paymentHistory]

  // Outstanding balance penalty (0-5 points)
  if (inputs.outstandingBalance === 0) {
    score += 5
    notes.push('No outstanding balance')
  } else if (inputs.outstandingBalance < 1000) {
    score += 3
    notes.push('Small outstanding balance')
  } else if (inputs.outstandingBalance < 5000) {
    score += 1
    notes.push('Moderate outstanding balance')
  } else {
    notes.push('Large outstanding balance')
  }

  return { score: Math.min(20, score), notes: notes.join(', ') }
}

function calculateActivityScore(inputs: HealthScoreInputs): { score: number; notes: string } {
  let score = 0
  const notes: string[] = []

  // Activity level (0-10 points)
  const levelPoints = { high: 10, normal: 7, low: 3 }
  score += levelPoints[inputs.activityLevel]

  // Recency (0-5 points)
  if (inputs.monthsSinceLastActivity === 0) {
    score += 5
    notes.push('Active this month')
  } else if (inputs.monthsSinceLastActivity === 1) {
    score += 3
    notes.push('Active last month')
  } else if (inputs.monthsSinceLastActivity <= 3) {
    score += 1
    notes.push('Activity gap')
  } else {
    notes.push('Extended inactivity')
  }

  return { score: Math.min(15, score), notes: notes.join(', ') || 'Good activity' }
}

function getStatusFromScore(score: number, maxScore: number): 'excellent' | 'good' | 'fair' | 'poor' {
  const percentage = (score / maxScore) * 100
  if (percentage >= 80) return 'excellent'
  if (percentage >= 60) return 'good'
  if (percentage >= 40) return 'fair'
  return 'poor'
}

function getGrade(percentage: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (percentage >= 90) return 'A'
  if (percentage >= 80) return 'B'
  if (percentage >= 70) return 'C'
  if (percentage >= 60) return 'D'
  return 'F'
}

function getOverallStatus(percentage: number): 'healthy' | 'at_risk' | 'critical' {
  if (percentage >= 70) return 'healthy'
  if (percentage >= 50) return 'at_risk'
  return 'critical'
}

function generateRecommendations(factors: HealthScoreFactor[], inputs: HealthScoreInputs): string[] {
  const recommendations: string[] = []

  for (const factor of factors) {
    if (factor.status === 'poor' || factor.status === 'fair') {
      switch (factor.name) {
        case 'Growth':
          if (inputs.upliftPercentage < 10) {
            recommendations.push('Review marketing strategy to improve revenue uplift')
          }
          if (inputs.growthTrend === 'decreasing') {
            recommendations.push('Investigate declining growth trend')
          }
          break
        case 'Attribution':
          if (inputs.unknownRate > 30) {
            recommendations.push('Improve lead source tracking to reduce unknown attribution')
          }
          if (inputs.attributionRate < 20) {
            recommendations.push('Focus on Sweet Dreams-attributed lead sources')
          }
          break
        case 'Engagement':
          if (inputs.responseTime === 'slow' || inputs.responseTime === 'unresponsive') {
            recommendations.push('Address client communication issues')
          }
          break
        case 'Payment':
          if (inputs.outstandingBalance > 0) {
            recommendations.push('Follow up on outstanding payments')
          }
          break
        case 'Activity':
          if (inputs.monthsSinceLastActivity > 1) {
            recommendations.push('Increase client activity and deliverables')
          }
          break
      }
    }
  }

  return recommendations
}
