import { describe, it, expect } from 'vitest';
import { calculateOverallScore } from '@/lib/scoring';

describe('Dynamic Weight Redistribution System', () => {
  describe('Baseline - All sections enabled', () => {
    it('should use fixed weights when all sections are enabled', () => {
      // All sections with score of 100
      const score = calculateOverallScore(100, 100, 100, 100, 100);
      // (100 * 0.40) + (100 * 0.25) + (100 * 0.20) + (100 * 0.10) + (100 * 0.05) = 100
      expect(score).toBe(100);
    });

    it('should calculate weighted average correctly', () => {
      const score = calculateOverallScore(80, 60, 40, 20, 100);
      // (80 * 0.40) + (60 * 0.25) + (40 * 0.20) + (20 * 0.10) + (100 * 0.05)
      // = 32 + 15 + 8 + 2 + 5 = 62
      expect(score).toBe(62);
    });
  });

  describe('Single section enabled', () => {
    it('should return site score when only site is enabled', () => {
      const score = calculateOverallScore(
        85,
        0,
        0,
        0,
        0,
        { instagram: true, gmn: true, paidTraffic: true, commercial: true }
      );
      expect(score).toBe(85);
    });

    it('should return instagram score when only instagram is enabled', () => {
      const score = calculateOverallScore(
        0,
        75,
        0,
        0,
        0,
        { site: true, gmn: true, paidTraffic: true, commercial: true }
      );
      expect(score).toBe(75);
    });

    it('should return gmn score when only gmn is enabled', () => {
      const score = calculateOverallScore(
        0,
        0,
        90,
        0,
        0,
        { site: true, instagram: true, paidTraffic: true, commercial: true }
      );
      expect(score).toBe(90);
    });
  });

  describe('Two sections enabled', () => {
    it('should redistribute correctly for site (40%) + instagram (25%)', () => {
      // Site: 40 / (40+25) = 0.615 (61.5%)
      // Instagram: 25 / (40+25) = 0.385 (38.5%)
      // (80 * 0.615) + (60 * 0.385) = 49.2 + 23.1 = 72.3 ≈ 72
      const score = calculateOverallScore(
        80,
        60,
        0,
        0,
        0,
        { gmn: true, paidTraffic: true, commercial: true }
      );
      expect(score).toBe(72);
    });

    it('should redistribute correctly for site (40%) + gmn (20%)', () => {
      // Site: 40 / (40+20) ≈ 0.667 (66.7%)
      // GMN: 20 / (40+20) ≈ 0.333 (33.3%)
      // (90 * 0.667) + (70 * 0.333) = 60 + 23 = 83
      const score = calculateOverallScore(
        90,
        0,
        70,
        0,
        0,
        { instagram: true, paidTraffic: true, commercial: true }
      );
      expect(score).toBe(83);
    });

    it('should handle instagram + gmn correctly', () => {
      // Instagram: 25 / (25+20) ≈ 0.556 (55.6%)
      // GMN: 20 / (25+20) ≈ 0.444 (44.4%)
      // (100 * 0.556) + (80 * 0.444) = 55.6 + 35.5 = 91.1 ≈ 91
      const score = calculateOverallScore(
        0,
        100,
        80,
        0,
        0,
        { site: true, paidTraffic: true, commercial: true }
      );
      expect(score).toBe(91);
    });
  });

  describe('Restaurant scenario (no Instagram)', () => {
    it('should calculate fairly without Instagram and Paid Traffic', () => {
      // Scenario: Restaurant with Site, GMN, and Commercial
      // Only these three apply
      // Total applicable weight: 40% + 20% + 5% = 65%
      // Site: 85 * (40/65) ≈ 52.3
      // GMN: 90 * (20/65) ≈ 27.7
      // Commercial: 75 * (5/65) ≈ 5.8
      // Total: 52.3 + 27.7 + 5.8 ≈ 85.8 ≈ 86
      const score = calculateOverallScore(
        85,
        0,
        90,
        0,
        75,
        { instagram: true, paidTraffic: true }
      );
      expect(score).toBe(86);
    });
  });

  describe('Clinic scenario (all sections enabled)', () => {
    it('should calculate score for a multi-channel clinic', () => {
      // Clinic using all channels
      const score = calculateOverallScore(
        75,
        92,
        88,
        60,
        95
      );
      // (75 * 0.40) + (92 * 0.25) + (88 * 0.20) + (60 * 0.10) + (95 * 0.05)
      // = 30 + 23 + 17.6 + 6 + 4.75 = 81.35 ≈ 81
      expect(score).toBe(81);
    });
  });

  describe('Edge cases', () => {
    it('should return 0 when all scores are 0', () => {
      const score = calculateOverallScore(0, 0, 0, 0, 0);
      expect(score).toBe(0);
    });

    it('should handle undefined disabledSections (all enabled)', () => {
      const score1 = calculateOverallScore(80, 60, 40, 20, 100);
      const score2 = calculateOverallScore(80, 60, 40, 20, 100, undefined);
      expect(score1).toBe(score2);
    });

    it('should handle empty disabledSections object (all enabled)', () => {
      const score1 = calculateOverallScore(80, 60, 40, 20, 100);
      const score2 = calculateOverallScore(80, 60, 40, 20, 100, {});
      expect(score1).toBe(score2);
    });
  });
});
