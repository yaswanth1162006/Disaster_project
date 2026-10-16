import {
  EmergencyReport,
  RescueTeam,
  Hospital,
  Shelter,
  BlockedRoad,
  ResourceRecommendation,
} from '../types/disaster';

// Calculate great-circle distance in kilometers using Haversine formula
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Check if a direct path is near any active road blockages
export function isRouteBlocked(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number,
  blockedRoads: BlockedRoad[]
): boolean {
  const activeRoads = blockedRoads.filter((r) => r.status === 'Active');
  for (const road of activeRoads) {
    // Check if the blockage lies roughly between the two points within 2.5km
    const distToRoadFromStart = calculateDistanceKm(startLat, startLon, road.latitude, road.longitude);
    const distToRoadFromEnd = calculateDistanceKm(road.latitude, road.longitude, endLat, endLon);
    const directDist = calculateDistanceKm(startLat, startLon, endLat, endLon);

    // Triangular inequality check: if detour is small, blockage is on or directly intersecting route
    if (distToRoadFromStart + distToRoadFromEnd < directDist + 2.5 && distToRoadFromStart < directDist) {
      return true;
    }
  }
  return false;
}

export function recommendResources(
  emergency: EmergencyReport,
  teams: RescueTeam[],
  hospitals: Hospital[],
  shelters: Shelter[],
  blockedRoads: BlockedRoad[]
): ResourceRecommendation {
  // 1. Filter and score Rescue Teams
  const scoredTeams = teams.map((team) => {
    const distance_km = calculateDistanceKm(
      team.latitude,
      team.longitude,
      emergency.latitude,
      emergency.longitude
    );

    const is_blocked = isRouteBlocked(
      team.latitude,
      team.longitude,
      emergency.latitude,
      emergency.longitude,
      blockedRoads
    );

    const match_reasons: string[] = [];
    let match_score = 50; // base score

    // Availability penalty/boost
    if (team.current_status === 'Available') {
      match_score += 30;
      match_reasons.push('Team is currently Available for immediate dispatch');
    } else {
      match_score -= 40;
      match_reasons.push(`Team currently in status "${team.current_status}" (re-assignment requires commander override)`);
    }

    // Equipment & Capability matching based on emergency type
    if (emergency.category === 'Flood' || emergency.category === 'Cyclone') {
      if (team.type === 'Boat Rescue' || team.equipment.some((e) => e.toLowerCase().includes('boat'))) {
        match_score += 25;
        match_reasons.push('Specialized aquatic / boat rescue gear equipped');
      } else {
        match_score -= 15;
        match_reasons.push('Lacks dedicated boat or watercraft capabilities');
      }
    } else if (emergency.category === 'Trapped Person' || emergency.category === 'Landslide' || emergency.category === 'Earthquake') {
      if (team.type === 'Urban SAR' || team.capabilities.some((c) => c.toLowerCase().includes('search') || c.toLowerCase().includes('k9') || c.toLowerCase().includes('extrication'))) {
        match_score += 25;
        match_reasons.push('Equipped for structural collapse, acoustic sensors, and victim extrication');
      }
    } else if (emergency.category === 'Medical Emergency') {
      if (team.type === 'Medical First Response' || team.capabilities.some((c) => c.toLowerCase().includes('medical') || c.toLowerCase().includes('triage'))) {
        match_score += 25;
        match_reasons.push('Paramedic certified first-responder unit');
      }
    }

    // Proximity factor
    if (distance_km < 5) {
      match_score += 20;
      match_reasons.push(`Immediate proximity (${distance_km} km)`);
    } else if (distance_km < 15) {
      match_score += 10;
      match_reasons.push(`Moderate proximity (${distance_km} km)`);
    } else {
      match_score -= 15;
      match_reasons.push(`Extended transit distance (${distance_km} km)`);
    }

    // Road blockage penalty
    if (is_blocked) {
      match_score -= 30;
      match_reasons.push('Transit route intersects active road blockage; detour required');
    }

    // Average speed 40km/h in disaster conditions, +15m if detour
    const baseMinutes = Math.round((distance_km / 40) * 60) + 5;
    const estimated_arrival_minutes = is_blocked ? baseMinutes + 18 : baseMinutes;

    return {
      team,
      distance_km,
      estimated_arrival_minutes,
      match_score: Math.max(0, Math.min(100, match_score)),
      match_reasons,
      is_blocked,
    };
  });

  // Sort teams by match_score descending
  scoredTeams.sort((a, b) => b.match_score - a.match_score);

  // 2. Recommend Hospitals (if medical needed or critical)
  const scoredHospitals = hospitals.map((hosp) => {
    const dist = calculateDistanceKm(
      hosp.latitude,
      hosp.longitude,
      emergency.latitude,
      emergency.longitude
    );
    let note = '';
    if (hosp.operational_status === 'Diverting') {
      note = 'Currently diverting due to facility stress';
    } else if (hosp.available_beds <= 0) {
      note = 'Zero general beds remaining';
    } else if (emergency.immediate_danger && hosp.has_trauma_center) {
      note = `Level-1 Trauma Certified, ${hosp.available_beds} beds, ${hosp.available_icu} ICU beds open`;
    } else {
      note = `${hosp.available_beds} beds available, ${hosp.ambulances_available} ambulances ready`;
    }

    return {
      hospital: hosp,
      distance_km: dist,
      available_beds: hosp.available_beds,
      has_trauma: hosp.has_trauma_center,
      recommendation_note: note,
    };
  });

  // Sort hospitals: prioritize operational with beds and proximity
  scoredHospitals.sort((a, b) => {
    if (a.hospital.operational_status === 'Diverting') return 1;
    if (b.hospital.operational_status === 'Diverting') return -1;
    if (a.available_beds > 0 && b.available_beds === 0) return -1;
    if (b.available_beds > 0 && a.available_beds === 0) return 1;
    return a.distance_km - b.distance_km;
  });

  // 3. Recommend Shelters (for displaced people)
  const scoredShelters = shelters.map((sh) => {
    const dist = calculateDistanceKm(
      sh.latitude,
      sh.longitude,
      emergency.latitude,
      emergency.longitude
    );
    const remaining = Math.max(0, sh.total_capacity - sh.current_occupancy);
    let note = '';
    if (remaining === 0) {
      note = 'Shelter at 100% capacity (No intake)';
    } else if (remaining < (emergency.people_affected || 5)) {
      note = `Limited room (${remaining} spots remaining for ${emergency.people_affected} people)`;
    } else {
      note = `${remaining} spots available, Food/Water: ${sh.food_water_status}`;
    }

    return {
      shelter: sh,
      distance_km: dist,
      remaining_capacity: remaining,
      recommendation_note: note,
    };
  });

  // Sort shelters: prioritize capacity >= needed and proximity
  scoredShelters.sort((a, b) => {
    const needed = emergency.people_affected || 1;
    const aCanFit = a.remaining_capacity >= needed;
    const bCanFit = b.remaining_capacity >= needed;
    if (aCanFit && !bCanFit) return -1;
    if (!aCanFit && bCanFit) return 1;
    return a.distance_km - b.distance_km;
  });

  const bestTeam = scoredTeams[0];
  const summary = bestTeam
    ? `Recommended primary unit: ${bestTeam.team.name} (${bestTeam.match_score}% fit, ETA ~${bestTeam.estimated_arrival_minutes}m). ${
        scoredHospitals[0] ? `Destination triage: ${scoredHospitals[0].hospital.name}.` : ''
      }`
    : 'No optimal rescue team currently free; queueing for next available detachment.';

  return {
    emergency_id: emergency.id,
    recommended_teams: scoredTeams,
    recommended_hospitals: scoredHospitals,
    recommended_shelters: scoredShelters,
    allocation_summary: summary,
  };
}
