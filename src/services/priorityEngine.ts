import { EmergencyReport, PriorityLevel, VerificationStatus } from '../types/disaster';

export interface PriorityEvaluation {
  priority: PriorityLevel;
  score: number;
  factors: string[];
  missingInfoWarnings: string[];
  recommendedActions: string[];
}

export function evaluateEmergencyPriority(
  report: Partial<EmergencyReport>,
  currentTimeMs: number = Date.now()
): PriorityEvaluation {
  let score = 0;
  const factors: string[] = [];
  const missingInfoWarnings: string[] = [];
  const recommendedActions: string[] = [];

  // 1. Data Quality & Completeness Check
  if (!report.address && (!report.latitude || !report.longitude)) {
    missingInfoWarnings.push('Missing exact coordinates or physical address');
  }
  if (!report.people_affected || report.people_affected <= 0) {
    missingInfoWarnings.push('Unspecified count of affected individuals');
  }
  if (!report.contact_phone && !report.contact_email) {
    missingInfoWarnings.push('No direct contact info provided for verification call');
  }

  // 2. Base Category Weights
  const categoryWeights: Record<string, number> = {
    'Trapped Person': 35,
    'Fire': 30,
    'Medical Emergency': 30,
    'Landslide': 28,
    'Flood': 25,
    'Cyclone': 25,
    'Earthquake': 26,
    'Food or Water Shortage': 15,
    'Missing Person': 18,
    'Other': 10,
  };
  const category = report.category || 'Other';
  const catScore = categoryWeights[category] || 15;
  score += catScore;
  factors.push(`Emergency type [${category}]: +${catScore} pts base severity`);

  // 3. Immediate Danger to Life
  if (report.immediate_danger) {
    score += 30;
    factors.push('Immediate danger to life reported: +30 pts');
  }

  // 4. Medical Assistance Required
  if (report.medical_required) {
    score += 20;
    factors.push('Urgent medical assistance requested: +20 pts');
  }

  // 5. Vulnerable Demographics (Elderly, Children, Mobility-impaired)
  if (report.vulnerable_people) {
    score += 15;
    factors.push('Vulnerable population identified (elderly/children/disabled): +15 pts');
  }

  // 6. Scale of Impact (People affected)
  const people = Number(report.people_affected) || 1;
  if (people >= 50) {
    score += 25;
    factors.push(`Mass casualty threat (>50 people affected): +25 pts`);
  } else if (people >= 20) {
    score += 18;
    factors.push(`High casualty exposure (20-49 people affected): +18 pts`);
  } else if (people >= 6) {
    score += 12;
    factors.push(`Cluster exposure (6-19 people affected): +12 pts`);
  } else if (people > 1) {
    score += 5;
    factors.push(`Multi-person incident (${people} people): +5 pts`);
  }

  // 7. Elapsed Unattended Time (Escalation factor)
  if (report.created_at) {
    const elapsedMinutes = Math.floor(
      (currentTimeMs - new Date(report.created_at).getTime()) / 60000
    );
    if (elapsedMinutes > 60) {
      const waitBonus = Math.min(15, Math.floor(elapsedMinutes / 30) * 3);
      if (waitBonus > 0) {
        score += waitBonus;
        factors.push(`Incident pending response for ${elapsedMinutes}m: +${waitBonus} pts delay escalation`);
      }
    }
  }

  // 8. Unverified Report Penalty / Safeguard
  const isVerified = report.verification_status === 'Verified';
  if (!isVerified) {
    factors.push('Unverified report: flagged for rapid ground verification prior to heavy asset dispatch');
  }

  // Cap score between 0 and 100
  const normalizedScore = Math.min(100, Math.max(5, score));

  // Determine Priority Level based on score and conditions
  let priority: PriorityLevel = 'Low';
  if (normalizedScore >= 75) {
    priority = 'Critical';
    recommendedActions.push('Immediate dispatch of nearest Tier-1 rescue team and ambulance unit');
    recommendedActions.push('Notify incident command cell for immediate triage review');
  } else if (normalizedScore >= 50) {
    priority = 'High';
    recommendedActions.push('Assign specialized response team within 20 minutes');
    recommendedActions.push('Alert nearby reception hospitals for potential incoming casualties');
  } else if (normalizedScore >= 25) {
    priority = 'Medium';
    recommendedActions.push('Queue for tactical deployment upon sector team clearance');
    recommendedActions.push('Deploy community relief/shelter liaison for on-site needs assessment');
  } else {
    priority = 'Low';
    recommendedActions.push('Log for regional monitoring and route to local volunteer/civil defense registry');
  }

  // Verification recommendation
  if (!isVerified) {
    recommendedActions.unshift('Execute phone contact verification or dispatch local scout drone/first responder');
  }

  return {
    priority,
    score: normalizedScore,
    factors,
    missingInfoWarnings,
    recommendedActions,
  };
}
