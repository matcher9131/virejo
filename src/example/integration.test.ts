import * as assert from 'assert';
import { calculateSum, fetchUserData, UserManager, formatName } from './sample';

suite('Integration Tests', () => {
  suite('calculateSum', () => {
    test('should calculate sum of numbers correctly', () => {
      assert.strictEqual(calculateSum([1, 2, 3, 4, 5]), 15);
      assert.strictEqual(calculateSum([]), 0);
      assert.strictEqual(calculateSum([10]), 10);
    });

    test('should handle negative numbers', () => {
      assert.strictEqual(calculateSum([-1, -2, -3]), -6);
      assert.strictEqual(calculateSum([5, -3, 2]), 4);
    });
  });

  suite('fetchUserData', () => {
    beforeEach(() => {
      // Note: Node.js test runner doesn't have built-in fake timers like Vitest
    });

    afterEach(() => {
      // Note: Node.js test runner doesn't have built-in fake timers like Vitest
    });

    test('should fetch user data asynchronously', async () => {
      const promise = fetchUserData('123');
      
      // Fast-forward time - would need manual timer implementation
      
      const result = await promise;
      
      assert.deepStrictEqual(result, {
        name: 'User 123',
        email: 'user123@example.com'
      });
    });
  });

  suite('UserManager', () => {
    let manager: UserManager;

    beforeEach(() => {
      manager = new UserManager();
    });

    test('should manage users correctly', () => {
      manager.addUser('1', 'John Doe', 'john@example.com');
      
      const user = manager.getUser('1');
      assert.deepStrictEqual(user, {
        name: 'John Doe',
        email: 'john@example.com'
      });
    });

    test('should return undefined for non-existent user', () => {
      assert.strictEqual(manager.getUser('999'), undefined);
    });

    test('should validate user existence', async () => {
      manager.addUser('1', 'John', 'john@example.com');
      
      assert.strictEqual(await manager.validateUser('1'), true);
      assert.strictEqual(await manager.validateUser('999'), false);
    });
  });

  suite('formatName', () => {
    test('should format names correctly', () => {
      assert.strictEqual(formatName('John'), 'John');
      assert.strictEqual(formatName('John', 'Doe'), 'John Doe');
    });

    test('should handle optional lastName', () => {
      assert.strictEqual(formatName('John', undefined), 'John');
      assert.strictEqual(formatName('John', ''), 'John ');
    });
  });

  suite('Full workflow integration', () => {
    test('should work together in a realistic scenario', async () => {
      const manager = new UserManager();
      
      // Add some users
      manager.addUser('1', formatName('John', 'Doe'), 'john@example.com');
      manager.addUser('2', formatName('Jane'), 'jane@example.com');
      
      // Validate users exist
      assert.strictEqual(await manager.validateUser('1'), true);
      assert.strictEqual(await manager.validateUser('2'), true);
      
      // Calculate some numbers (simulating user IDs or scores)
      const userScores = calculateSum([1, 2]);
      assert.strictEqual(userScores, 3);
      
      // Fetch additional data
      const userData = await fetchUserData('123');
      assert.strictEqual(userData.name, 'User 123');
    });
  });
});