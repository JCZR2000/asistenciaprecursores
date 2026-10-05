// Group management utilities

export function getGroupNumbers(groupsCount: number, existingGroupNumbers: number[] = []): number[] {
  const safeCount = Math.max(1, Math.floor(groupsCount || 1));
  const set = new Set<number>();
  for (let i = 1; i <= safeCount; i++) {
    set.add(i);
  }
  for (const g of existingGroupNumbers) {
    if (g && g > 0) set.add(g);
  }
  return Array.from(set).sort((a, b) => a - b);
}

export function validateGroupCountReduction(
  newCount: number,
  assignedGroupNumbers: number[]
): { valid: boolean; maxAssigned: number; conflictingCount: number } {
  const conflicting = assignedGroupNumbers.filter((g) => g > newCount);
  return {
    valid: conflicting.length === 0,
    maxAssigned: assignedGroupNumbers.length > 0 ? Math.max(...assignedGroupNumbers) : 0,
    conflictingCount: conflicting.length,
  };
}
