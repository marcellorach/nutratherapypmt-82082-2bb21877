
export const scoreStudyQuality = async (studyText: string): Promise<number> => {
  await new Promise(resolve => setTimeout(resolve, 1200));
  return 3.0 + Math.random() * 2.0;
};

export const scoreStudyRelevance = async (studyText: string): Promise<number> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return 2.5 + Math.random() * 2.5;
};
