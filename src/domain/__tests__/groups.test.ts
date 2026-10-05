import { describe, it, expect } from 'vitest';
import { getGroupNumbers, validateGroupCountReduction } from '../groups';

describe('Group management utilities', () => {
  it('generates standard group numbers up to groupsCount', () => {
    expect(getGroupNumbers(6)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(getGroupNumbers(10)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('safely handles minimum group count of 1', () => {
    expect(getGroupNumbers(0)).toEqual([1]);
    expect(getGroupNumbers(-5)).toEqual([1]);
  });

  it('includes any higher groups currently assigned to pioneers', () => {
    expect(getGroupNumbers(5, [7, 8])).toEqual([1, 2, 3, 4, 5, 7, 8]);
  });

  it('validates reduction of groups', () => {
    const assigned = [1, 2, 3, 4, 6];
    expect(validateGroupCountReduction(6, assigned).valid).toBe(true);
    expect(validateGroupCountReduction(5, assigned).valid).toBe(false);
    expect(validateGroupCountReduction(5, assigned).maxAssigned).toBe(6);
    expect(validateGroupCountReduction(5, assigned).conflictingCount).toBe(1);
  });
});
