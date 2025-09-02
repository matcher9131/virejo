// Sample TypeScript file for testing the test generator

export function calculateSum(numbers: number[]): number {
  return numbers.reduce((sum, num) => sum + num, 0);
}

export async function fetchUserData(userId: string): Promise<{ name: string; email: string }> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 100));
  return {
    name: `User ${userId}`,
    email: `user${userId}@example.com`
  };
}

export class UserManager {
  private users: Map<string, { name: string; email: string }> = new Map();

  addUser(id: string, name: string, email: string): void {
    this.users.set(id, { name, email });
  }

  getUser(id: string): { name: string; email: string } | undefined {
    return this.users.get(id);
  }

  async validateUser(id: string): Promise<boolean> {
    const user = this.getUser(id);
    return new Promise(resolve => { resolve(user !== undefined); });
  }
}

const formatName = (firstName: string, lastName?: string): string => {
  return lastName ? `${firstName} ${lastName}` : firstName;
};

export { formatName };