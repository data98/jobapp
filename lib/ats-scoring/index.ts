export {
  calculateKeywordScore,
  calculateMeasurableResultsScore,
  calculateStructureScore,
  calculateCompositeScore,
  calculateATSScore,
  calculateJobTitleMatchScore,
  calculateContextDepthScore,
  calculateAntiSpamPenalty,
  checkKeywordInMasterResume,
  hasMeasurableResult,
} from './client';

export type {
  KeywordMatch,
  KeywordMiss,
  KeywordScoreResult,
  MeasurableResultsScoreResult,
  BulletAssessment,
  StructureScoreResult,
  JobTitleMatchResult,
  ContextDepthResult,
  AntiSpamResult,
} from './client';
