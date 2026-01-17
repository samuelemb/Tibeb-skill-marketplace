import { Request, Response, NextFunction } from 'express';
import {
  getUserSkills,
  addSkillToUser,
  removeSkillFromUser,
  getAllSkills,
} from '../services/skillService';
import { addSkillSchema, removeSkillSchema } from '../utils/validation';
import { ValidationError } from '../utils/errors';

/**
 * Get current user's skills
 */
export async function getMySkills(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId;
    const skills = await getUserSkills(userId);
    res.status(200).json({
      success: true,
      data: skills,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Add a skill to current user's profile
 */
export async function addSkill(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId;
    const validatedData = addSkillSchema.parse(req.body);
    const skill = await addSkillToUser(userId, validatedData);
    res.status(201).json({
      success: true,
      data: skill,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
}

/**
 * Remove a skill from current user's profile
 */
export async function removeSkill(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId;
    const validatedData = removeSkillSchema.parse(req.params);
    await removeSkillFromUser(userId, validatedData.skillId);
    res.status(200).json({
      success: true,
      message: 'Skill removed successfully',
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
}

/**
 * Get all available skills (for autocomplete/search)
 */
export async function searchSkills(req: Request, res: Response, next: NextFunction) {
  try {
    const search = req.query.search as string | undefined;
    const skills = await getAllSkills(search);
    res.status(200).json({
      success: true,
      data: skills,
    });
  } catch (error) {
    next(error);
  }
}

