import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { calculateSum, fetchUserData, UserManager, formatName } from './sample';

describe('Integration Tests', () => {
  describe('calculateSum', () => {
    it('should calculate sum of numbers correctly', () => {
      expect(calculateSum([1, 2, 3, 4, 5])).toBe(15);
      expect(calculateSum([])).toBe(0);
      expect(calculateSum([10])).toBe(10);
    });

    it('should handle negative numbers', () => {
      expect(calculateSum([-1, -2, -3])).toBe(-6);
      expect(calculateSum([5, -3, 2])).toBe(4);
    });
  });

  describe('fetchUserData', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should fetch user data asynchronously', async () => {
      const promise = fetchUserData('123');
      
      // Fast-forward time
      vi.advanceTimersByTime(100);
      
      const result = await promise;
      
      expect(result).toEqual({
        name: 'User 123',
        email: 'user123@example.com'
      });
    });
  });

  describe('UserManager', () => {
    let manager: UserManager;

    beforeEach(() => {
      manager = new UserManager();
    });

    it('should manage users correctly', () => {
      manager.addUser('1', 'John Doe', 'john@example.com');
      
      const user = manager.getUser('1');
      expect(user).toEqual({
        name: 'John Doe',
        email: 'john@example.com'
      });
    });

    it('should return undefined for non-existent user', () => {
      expect(manager.getUser('999')).toBeUndefined();
    });

    it('should validate user existence', async () => {
      manager.addUser('1', 'John', 'john@example.com');
      
      expect(await manager.validateUser('1')).toBe(true);
      expect(await manager.validateUser('999')).toBe(false);
    });
  });

  describe('formatName', () => {
    it('should format names correctly', () => {
      expect(formatName('John')).toBe('John');
      expect(formatName('John', 'Doe')).toBe('John Doe');
    });

    it('should handle optional lastName', () => {
      expect(formatName('John', undefined)).toBe('John');
      expect(formatName('John', '')).toBe('John ');
    });
  });

  describe('Full workflow integration', () => {
    it('should work together in a realistic scenario', async () => {
      const manager = new UserManager();
      
      // Add some users
      manager.addUser('1', formatName('John', 'Doe'), 'john@example.com');
      manager.addUser('2', formatName('Jane'), 'jane@example.com');
      
      // Validate users exist
      expect(await manager.validateUser('1')).toBe(true);
      expect(await manager.validateUser('2')).toBe(true);
      
      // Calculate some numbers (simulating user IDs or scores)
      const userScores = calculateSum([1, 2]);
      expect(userScores).toBe(3);
      
      // Fetch additional data
      const userData = await fetchUserData('123');
      expect(userData.name).toBe('User 123');
    });
  });
});