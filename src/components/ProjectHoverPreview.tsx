import React from 'react';
import { Project } from '../types';

interface ProjectHoverPreviewProps {
  hoveredProject?: Project | null;
}

export function updateGlobalMousePos(_x: number, _y: number) {}

export const ProjectHoverPreview: React.FC<ProjectHoverPreviewProps> = () => {
  return null;
};
