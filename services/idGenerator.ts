/**
 * ID Generator Service
 * Generates sequential IDs for components based on their type
 * Format: {type}-{number} (e.g., led-1, pushbutton-2, arduino-uno-1)
 */

class IdGenerator {
  private counters: Map<string, number> = new Map();

  /**
   * Generate next ID for a component type
   * @param type Component type (e.g., 'led', 'pushbutton', 'arduino-uno')
   * @returns Sequential ID (e.g., 'led-1', 'led-2')
   */
  generateId(type: string): string {
    const currentCount = this.counters.get(type) || 0;
    const nextCount = currentCount + 1;
    this.counters.set(type, nextCount);
    return `${type}-${nextCount}`;
  }

  /**
   * Reset counter for a specific type
   * @param type Component type to reset
   */
  resetCounter(type: string): void {
    this.counters.delete(type);
  }

  /**
   * Reset all counters
   */
  resetAll(): void {
    this.counters.clear();
  }

  /**
   * Get current counter value for a type
   * @param type Component type
   * @returns Current counter value (0 if not set)
   */
  getCounter(type: string): number {
    return this.counters.get(type) || 0;
  }

  /**
   * Initialize counters from existing component IDs
   * Useful when loading saved projects
   * @param existingIds Array of existing component IDs (e.g., ['led-1', 'pushbutton-2'])
   */
  initializeFromExistingIds(existingIds: string[]): void {
    existingIds.forEach((id) => {
      const lastDashIndex = id.lastIndexOf('-');
      if (lastDashIndex > 0) {
        const type = id.substring(0, lastDashIndex);
        const number = parseInt(id.substring(lastDashIndex + 1), 10);

        if (!isNaN(number)) {
          const currentCount = this.counters.get(type) || 0;
          if (number > currentCount) {
            this.counters.set(type, number);
          }
        }
      }
    });
  }
}

// Export singleton instance
export const idGenerator = new IdGenerator();
